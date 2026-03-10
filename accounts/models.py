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


class AppVersionConfig(models.Model):
    """Singleton model to manage forced app updates."""
    min_version = models.CharField(
        max_length=20, default='1.0.0',
        help_text='Minimum required app version (semver, e.g. 2.1.0)',
    )
    is_locked = models.BooleanField(
        default=False,
        help_text='When enabled, users with an older version will be forced to update.',
    )
    lock_message = models.TextField(
        default='A new version of the app is available. Please update to continue.',
        help_text='Message displayed to users when the app is locked.',
    )
    update_url = models.URLField(
        blank=True, default='',
        help_text='URL where users can download the latest APK.',
    )
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'App Version Config'
        verbose_name_plural = 'App Version Config'

    def __str__(self):
        return f'App v{self.min_version} (locked={self.is_locked})'

    def save(self, *args, **kwargs):
        # Enforce singleton: always use pk=1
        self.pk = 1
        super().save(*args, **kwargs)

    @classmethod
    def load(cls):
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj
