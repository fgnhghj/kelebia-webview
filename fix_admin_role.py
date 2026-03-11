import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'eduroom.settings')
django.setup()

from accounts.models import User

count = User.objects.filter(email='admin@kelebia.com').update(role='teacher', is_staff=True, is_superuser=True)
print(f"Updated {count} admins to role=teacher")
