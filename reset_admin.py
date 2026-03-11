from accounts.models import User

email = 'admin@kelebia.com'
# The LoginSerializer authenticates against username = email
username = email 

user = User.objects.filter(email=email).first()
if getattr(user, 'username', '') != email:
    if user:
        user.username = email
        user.set_password('Admin123!')
        user.is_staff = True
        user.is_superuser = True
        user.save()
        print(f"Updated existing user {email} to have matching username and admin access.")
    else:
        User.objects.create_superuser(username, email, 'Admin123!')
        print(f"Created new superuser {email} with password Admin123!")
else:
    user.set_password('Admin123!')
    user.is_staff = True
    user.is_superuser = True
    user.save()
    print(f"Reset password for existing correctly-configured admin {email}.")
