#!/bin/bash
set -e
cd /home/ubuntu/eduroom

echo "==============================="
echo "  Kelebia Classroom — Deploy"
echo "==============================="

# --- 1. Load env ---
echo "[1/4] Loading environment..."
set -a; source /home/ubuntu/eduroom/.env; set +a
source venv/bin/activate

# --- 2. Run migrations ---
echo "[2/4] Migrations..."
python manage.py migrate --run-syncdb 2>&1 | tail -5

# --- 3. Rebuild frontend ---
echo "[3/4] Building frontend..."
cd /home/ubuntu/eduroom/frontend
npm run build 2>&1 | tail -10
echo "Frontend build complete"

# --- 4. Restart Gunicorn ---
echo "[4/4] Restarting Gunicorn..."
cd /home/ubuntu/eduroom
pkill -f gunicorn 2>/dev/null && echo "Killed old gunicorn" || echo "No gunicorn was running"
sleep 1

nohup gunicorn \
    --workers 3 \
    --bind 127.0.0.1:8000 \
    --access-logfile /home/ubuntu/eduroom/gunicorn.log \
    --error-logfile /home/ubuntu/eduroom/gunicorn.error.log \
    --env DJANGO_SECRET_KEY='@ayx7oag43h42wz7rcd0b90a2dxw9fnc6@(1wma_vq0sqabo4-' \
    --env DJANGO_DEBUG=False \
    --env DJANGO_ALLOWED_HOSTS=isetkl-classroom.gleeze.com,localhost \
    --env DATABASE_URL=postgres \
    --env DB_NAME=eduroom \
    --env DB_USER=eduroom_user \
    --env DB_PASSWORD=eduroom_secure_pass_2026 \
    --env DB_HOST=localhost \
    --env DB_PORT=5432 \
    --env EMAIL_HOST=smtp.gmail.com \
    --env EMAIL_PORT=587 \
    --env EMAIL_USE_TLS=True \
    --env EMAIL_HOST_USER=zaaallmani@gmail.com \
    --env EMAIL_HOST_PASSWORD=xgipavpfczunrhzx \
    --env SENDER_EMAIL=zaaallmani@gmail.com \
    --env SITE_URL=https://isetkl-classroom.gleeze.com \
    --env CORS_ORIGINS=https://isetkl-classroom.gleeze.com,http://localhost:5173 \
    eduroom.wsgi:application >> /home/ubuntu/eduroom/gunicorn.log 2>&1 &

sleep 3
pgrep -c gunicorn > /dev/null && echo "Gunicorn is UP ($(pgrep -c gunicorn) processes)" || echo "ERROR: Gunicorn failed"

# --- 5. Reload Nginx ---
sudo systemctl reload nginx
echo "Nginx reloaded"

echo ""
echo "==============================="
echo "  Deploy Complete!"
echo "==============================="
echo "Gunicorn: $(pgrep -c gunicorn) workers"
echo "Nginx:    $(sudo systemctl is-active nginx)"
echo "Site:     https://isetkl-classroom.gleeze.com"
echo "==============================="
