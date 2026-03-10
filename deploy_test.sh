#!/bin/bash
cd /home/ubuntu/eduroom
sed -i 's/\r$//' .env
set -a
source .env
set +a
echo "=== ENV CHECK ==="
echo "HOST: $EMAIL_HOST"
echo "USER: $EMAIL_HOST_USER"
echo "TLS: $EMAIL_USE_TLS"
echo "FROM: $SENDER_EMAIL"
echo ""
echo "=== RESTARTING GUNICORN ==="
pkill -f gunicorn || true
sleep 1
source venv/bin/activate
gunicorn eduroom.wsgi:application --bind 0.0.0.0:8000 --workers 3 --daemon
sleep 1
echo "Gunicorn PIDs: $(pgrep -c gunicorn)"
echo ""
echo "=== SENDING TEST EMAIL ==="
python3 /tmp/testemail.py
