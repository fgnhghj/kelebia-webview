#!/bin/bash
# ================================================
# Kelebia Classroom — Server Deployment Script
# Deploy to: isetkl-classroom.gleeze.com (user: ubuntu)
# ================================================

set -e

PROJECT_DIR="/home/ubuntu/eduroom"
VENV_DIR="$PROJECT_DIR/venv"

echo ""
echo "=============================="
echo "  Kelebia Classroom Deploy"
echo "=============================="

# --- 1. System packages ---
echo "[1/10] Installing system packages..."
sudo apt update -qq
sudo apt install -y -qq python3 python3-pip python3-venv python3-dev \
    postgresql postgresql-contrib nginx libpq-dev build-essential curl

# Install Node.js for React build
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt install -y -qq nodejs
fi

# --- 2. PostgreSQL ---
echo "[2/10] Setting up PostgreSQL..."
# Generate DB password on first deploy, reuse from .env on subsequent deploys
if [ -f "$PROJECT_DIR/.env" ]; then
    EXISTING_DB_PASS=$(grep '^DB_PASSWORD=' "$PROJECT_DIR/.env" 2>/dev/null | cut -d'=' -f2 | tr -d '"')
fi
if [ -z "$EXISTING_DB_PASS" ]; then
    DB_PASS=$(openssl rand -base64 24 | tr -d '/+=' | head -c 24)
else
    DB_PASS="$EXISTING_DB_PASS"
fi
sudo -u postgres psql -tc "SELECT 1 FROM pg_roles WHERE rolname='eduroom_user'" | grep -q 1 || \
    sudo -u postgres psql -c "CREATE ROLE eduroom_user WITH LOGIN PASSWORD '$DB_PASS';"
# Update password in case it changed
sudo -u postgres psql -c "ALTER ROLE eduroom_user WITH PASSWORD '$DB_PASS';" 2>/dev/null || true
sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname='eduroom'" | grep -q 1 || \
    sudo -u postgres psql -c "CREATE DATABASE eduroom OWNER eduroom_user;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE eduroom TO eduroom_user;"

# --- 3. Project directory ---
echo "[3/10] Setting up project directory..."
sudo chown -R ubuntu:ubuntu $PROJECT_DIR

# --- 4. Virtual environment ---
echo "[4/10] Setting up Python virtual environment..."
python3 -m venv $VENV_DIR || true
$VENV_DIR/bin/pip install --upgrade pip -q
$VENV_DIR/bin/pip install -r $PROJECT_DIR/requirements.txt -q

# --- 5. Environment variables ---
echo "[5/10] Configuring environment..."
# Preserve SECRET_KEY across deploys (only generate once)
if [ -f "$PROJECT_DIR/.env" ]; then
    EXISTING_KEY=$(grep '^DJANGO_SECRET_KEY=' "$PROJECT_DIR/.env" | cut -d'"' -f2)
fi
if [ -z "$EXISTING_KEY" ]; then
    EXISTING_KEY=$($VENV_DIR/bin/python3 -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())')
fi
# Generate a random admin password (only used for initial creation)
ADMIN_PASS=$(openssl rand -base64 16 | tr -d '/+=' | head -c 20)
cat > $PROJECT_DIR/.env << EOF
DJANGO_SECRET_KEY="$EXISTING_KEY"
DJANGO_DEBUG=False
DJANGO_ALLOWED_HOSTS=isetkl-classroom.gleeze.com,localhost
DATABASE_URL=postgres
DB_NAME=eduroom
DB_USER=eduroom_user
DB_PASSWORD=$DB_PASS
DB_HOST=localhost
DB_PORT=5432
SITE_URL=https://isetkl-classroom.gleeze.com
CORS_ORIGINS=https://isetkl-classroom.gleeze.com,http://localhost:5173
BREVO_API_KEY=${BREVO_API_KEY:-}
BREVO_SENDER_EMAIL=${BREVO_SENDER_EMAIL:-}
EMAIL_HOST_USER=${EMAIL_HOST_USER:-}
EMAIL_HOST_PASSWORD=${EMAIL_HOST_PASSWORD:-}
EOF
set -a && source $PROJECT_DIR/.env && set +a

# --- 6. Build React frontend ---
echo "[6/10] Building React frontend..."
cd $PROJECT_DIR/frontend
npm install --production=false -q 2>&1 | tail -1
npm run build
cd $PROJECT_DIR

# --- 7. Django setup ---
echo "[7/10] Running Django setup..."
$VENV_DIR/bin/python manage.py migrate --noinput
$VENV_DIR/bin/python manage.py collectstatic --noinput
# Create superuser only if it doesn't exist (use generated random password)
echo "from accounts.models import User; User.objects.filter(username='admin').exists() or User.objects.create_superuser('admin', 'admin@kelebia.com', '$ADMIN_PASS')" | $VENV_DIR/bin/python manage.py shell
if ! echo "from accounts.models import User; print(User.objects.filter(username='admin', last_login__isnull=False).exists())" | $VENV_DIR/bin/python manage.py shell 2>/dev/null | grep -q True; then
    echo "  ℹ️  Admin password: $ADMIN_PASS (save it, shown only once)"
fi

# --- 8. Gunicorn service ---
echo "[8/10] Setting up Gunicorn service..."
sudo tee /etc/systemd/system/kelebia.service > /dev/null << EOF
[Unit]
Description=Kelebia Classroom Gunicorn Daemon
After=network.target

[Service]
User=ubuntu
Group=www-data
WorkingDirectory=$PROJECT_DIR
EnvironmentFile=$PROJECT_DIR/.env
ExecStart=$VENV_DIR/bin/gunicorn eduroom.wsgi:application --bind 127.0.0.1:8000 --workers 3 --timeout 120

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable kelebia
sudo systemctl restart kelebia

# --- 9. Nginx ---
echo "[9/10] Configuring Nginx..."

# Serve the React SPA from the collected static files
sudo tee /etc/nginx/sites-available/kelebia > /dev/null << 'NGINX'
server {
    listen 80;
    server_name isetkl-classroom.gleeze.com;

    client_max_body_size 50M;

    # API endpoints — proxy to Django/Gunicorn
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Django admin
    location /admin/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Django static files (admin CSS etc)
    location /static/ {
        alias /home/ubuntu/eduroom/staticfiles/;
    }

    # Media uploads
    location /media/ {
        alias /home/ubuntu/eduroom/media/;
    }

    # React SPA — serve index.html for all non-API routes
    location / {
        root /home/ubuntu/eduroom/frontend/dist;
        try_files $uri $uri/ /index.html;
    }
}
NGINX

# --- 10. SSL/HTTPS (Let's Encrypt) ---
echo "[10/10] Setting up SSL..."

# Activate nginx config FIRST (certbot needs it)
sudo rm -f /etc/nginx/sites-enabled/default
sudo rm -f /etc/nginx/sites-enabled/eduroom
sudo rm -f /etc/nginx/sites-enabled/kelebia
sudo ln -sf /etc/nginx/sites-available/kelebia /etc/nginx/sites-enabled/kelebia
sudo nginx -t
sudo systemctl restart nginx

# Install certbot if not present
if ! command -v certbot &> /dev/null; then
    sudo apt install -y -qq certbot python3-certbot-nginx
fi

# Only run certbot if SSL is not already configured
if ! grep -q 'ssl_certificate' /etc/nginx/sites-available/kelebia 2>/dev/null; then
    echo "  Requesting SSL certificate..."
    sudo certbot --nginx -d isetkl-classroom.gleeze.com --non-interactive --agree-tos -m admin@kelebia.com --redirect || \
        echo "  ⚠️  Certbot failed — you may need to set up SSL manually"
else
    echo "  SSL already configured, renewing if needed..."
    sudo certbot renew --quiet || true
fi

# Restart nginx with SSL config
sudo nginx -t && sudo systemctl restart nginx

# Fix permissions
sudo chown -R ubuntu:www-data $PROJECT_DIR/staticfiles $PROJECT_DIR/frontend/dist
sudo chmod -R 755 /home/ubuntu /home/ubuntu/eduroom $PROJECT_DIR/staticfiles $PROJECT_DIR/frontend/dist
sudo mkdir -p $PROJECT_DIR/media
sudo chown -R ubuntu:www-data $PROJECT_DIR/media
sudo chmod -R 755 $PROJECT_DIR/media

echo ""
echo "=============================="
echo "  ✅ Kelebia Classroom deployed!"
echo "  Visit: https://isetkl-classroom.gleeze.com"
echo "=============================="
