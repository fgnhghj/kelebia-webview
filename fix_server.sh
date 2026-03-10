#!/bin/bash
set -e
cd /home/ubuntu/eduroom

echo "==============================="
echo "  Kelebia Classroom — Startup"
echo "==============================="

# --- 1. Fix .env with correct credentials ---
echo "[1/5] Writing .env..."
cat > /home/ubuntu/eduroom/.env << 'ENVEOF'
DJANGO_SECRET_KEY='@ayx7oag43h42wz7rcd0b90a2dxw9fnc6@(1wma_vq0sqabo4-'
DJANGO_DEBUG=False
DJANGO_ALLOWED_HOSTS=isetkl-classroom.gleeze.com,localhost
DATABASE_URL=postgres
DB_NAME=eduroom
DB_USER=eduroom_user
DB_PASSWORD=eduroom_secure_pass_2026
DB_HOST=localhost
DB_PORT=5432
SITE_URL=https://isetkl-classroom.gleeze.com
CORS_ORIGINS=https://isetkl-classroom.gleeze.com,http://localhost:5173
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=zaaallmani@gmail.com
EMAIL_HOST_PASSWORD=xgipavpfczunrhzx
SENDER_EMAIL=zaaallmani@gmail.com
ENVEOF
echo ".env written OK"

# --- 2. Load env ---
set -a; source /home/ubuntu/eduroom/.env; set +a
source venv/bin/activate

# --- 3. Run migrations + collectstatic ---
echo "[2/5] Migrations & static files..."
python manage.py migrate --run-syncdb 2>&1 | tail -5
python manage.py collectstatic --noinput 2>&1 | tail -3

# --- 4. Restart Gunicorn ---
echo "[3/5] Restarting Gunicorn..."
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

# --- 5. Nginx ---
echo "[4/5] Checking Nginx..."
sudo nginx -t 2>&1
sudo systemctl reload nginx
sudo systemctl is-active nginx && echo "Nginx is UP" || echo "ERROR: Nginx down"

# --- 6. SMTP test ---
echo "[5/5] Testing SMTP..."
python3 -c "
import smtplib, os
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.utils import formatdate
import uuid
user = 'zaaallmani@gmail.com'
pwd  = 'xgipavpfczunrhzx'
msg = MIMEMultipart('alternative')
msg['Subject'] = 'Kelebia Server — All Systems Go'
msg['From'] = 'ISET Classroom <' + user + '>'
msg['To'] = user
msg['Date'] = formatdate(localtime=True)
msg['Message-ID'] = '<' + uuid.uuid4().hex + '@kelebia-classroom.com>'
msg.attach(MIMEText('Server started successfully. SMTP working.', 'plain'))
try:
    with smtplib.SMTP('smtp.gmail.com', 587) as s:
        s.ehlo(); s.starttls(); s.login(user, pwd)
        s.sendmail(user, [user], msg.as_string())
    print('SMTP TEST: SUCCESS - check zaaallmani@gmail.com inbox')
except Exception as e:
    print('SMTP TEST: FAILED -', str(e))
"

echo ""
echo "==============================="
echo "  Status Summary"
echo "==============================="
echo "Gunicorn: $(pgrep -c gunicorn) workers on 127.0.0.1:8000"
echo "Nginx:    $(sudo systemctl is-active nginx)"
echo "Site:     https://isetkl-classroom.gleeze.com"
echo "==============================="
