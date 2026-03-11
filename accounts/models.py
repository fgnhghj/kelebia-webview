from django.contrib.auth.models import AbstractUser
from django.db import models
import pyotp
import secrets


class User(AbstractUser):
    """Custom user with teacher/student role."""
    ROLE_CHOICES = [
        ('teacher', 'Teacher'),
        ('student', 'Student'),
    ]
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='student')
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)
    bio = models.TextField(max_length=500, blank=True)
    institution = models.CharField(max_length=200, blank=True)

    # Email verification
    email_verified = models.BooleanField(default=False)
    verification_code = models.CharField(max_length=6, blank=True)
    code_created_at = models.DateTimeField(null=True, blank=True)

    # 2FA
    totp_secret = models.CharField(max_length=32, blank=True)
    is_2fa_enabled = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.get_full_name() or self.username} ({self.role})"

    def generate_verification_code(self):
        from django.utils import timezone
        self.verification_code = f"{secrets.randbelow(900000) + 100000}"
        self.code_created_at = timezone.now()
        self.save(update_fields=['verification_code', 'code_created_at'])
        return self.verification_code

    def generate_totp_secret(self):
        self.totp_secret = pyotp.random_base32()
        self.save(update_fields=['totp_secret'])
        return self.totp_secret

    def get_totp_uri(self):
        return pyotp.totp.TOTP(self.totp_secret).provisioning_uri(
            name=self.email, issuer_name='Kelebia Classroom'
        )

    def verify_totp(self, code):
        if not self.totp_secret:
            return False
        return pyotp.TOTP(self.totp_secret).verify(code)

    @property
    def is_teacher(self):
        return self.role == 'teacher'

    @property
    def is_student(self):
        return self.role == 'student'

class AppVersion(models.Model):
    version_name = models.CharField(max_length=50, unique=True, default='1.0')
    is_locked = models.BooleanField(default=False)
    message = models.TextField(default="Une nouvelle mise \u00e0 jour est disponible. Veuillez l'installer pour continuer.")
    update_link = models.URLField(default="https://isetkl-classroom.gleeze.com/download")
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Version {self.version_name} - {'Locked' if self.is_locked else 'Unlocked'}"
