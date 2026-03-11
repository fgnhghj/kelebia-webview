import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'eduroom.settings')
django.setup()

from accounts.models import User

email = 'admin@kelebia.com'
pwd = 'Admin123!'

# Delete all existing users with this email just to be absolutely sure
User.objects.filter(email=email).delete()

# Create a fresh superuser
User.objects.create_superuser(username=email, email=email, password=pwd)
print("Admin user created/reset successfully.")
