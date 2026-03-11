import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'eduroom.settings')
django.setup()

from django.contrib.auth import authenticate
from accounts.models import User

email = 'admin@kelebia.com'
pwd = 'Admin123!'

print("Checking user directly:")
try:
    user = User.objects.get(email=email)
    print("User exists:", user.email)
    print("Username:", user.username)
    print("Is active:", user.is_active)
    print("Check password directly:", user.check_password(pwd))
except Exception as e:
    print("User get failed:", e)

print("Testing authenticate():")
auth_user = authenticate(username=email, password=pwd)
print("Auth user result:", auth_user)
