"""
Django settings for Kelebia Classroom project.
"""
import os
from pathlib import Path
from datetime import timedelta

BASE_DIR = Path(__file__).resolve().parent.parent

_default_key = 'dev-secret-key-change-in-production-xyz123!' if os.environ.get('DJANGO_DEBUG', 'True').lower() in ('true', '1', 'yes') else None
SECRET_KEY = os.environ.get('DJANGO_SECRET_KEY', _default_key)
if not SECRET_KEY:
    raise ValueError('DJANGO_SECRET_KEY environment variable is required in production!')

DEBUG = os.environ.get('DJANGO_DEBUG', 'True').lower() in ('true', '1', 'yes')

ALLOWED_HOSTS = os.environ.get('DJANGO_ALLOWED_HOSTS', 'localhost').split(',')

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    # Third party
    'rest_framework',
    'rest_framework_simplejwt.token_blacklist',
    'corsheaders',
    # Local apps
    'accounts',
    'rooms',
    'content',
    'announcements',
    'notifications',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'eduroom.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'eduroom.wsgi.application'

# Database — use PostgreSQL in production, SQLite for local dev
if os.environ.get('DATABASE_URL'):
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': os.environ.get('DB_NAME', 'eduroom'),
            'USER': os.environ.get('DB_USER', 'eduroom_user'),
            'PASSWORD': os.environ.get('DB_PASSWORD', 'eduroom_pass'),
            'HOST': os.environ.get('DB_HOST', 'localhost'),
            'PORT': os.environ.get('DB_PORT', '5432'),
        }
    }
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# Static and Media
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# WhiteNoise — serve static files efficiently in production
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Custom user model
AUTH_USER_MODEL = 'accounts.User'

# REST Framework
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 50,
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '30/minute',
        'user': '120/minute',
        'login': '5/minute',
    },
}

# JWT Settings
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=30),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
}

# CORS — allow React dev server in dev, explicit origins in production
CORS_ALLOW_ALL_ORIGINS = DEBUG
if not DEBUG:
    _cors = os.environ.get('CORS_ORIGINS', '')
    _site = os.environ.get('SITE_URL', '')
    CORS_ALLOWED_ORIGINS = [o.strip() for o in _cors.split(',') if o.strip()]
    # Always allow the SITE_URL itself (the React SPA origin)
    if _site and _site not in CORS_ALLOWED_ORIGINS:
        CORS_ALLOWED_ORIGINS.append(_site)
    # Also allow the bare IP with http
    for host in ALLOWED_HOSTS:
        origin = f'http://{host}'
        if host not in ('*', 'localhost') and origin not in CORS_ALLOWED_ORIGINS:
            CORS_ALLOWED_ORIGINS.append(origin)
    # Capacitor Android WebView runs from https://localhost (androidScheme: 'https')
    # Also allow http://localhost fallback and capacitor://localhost for iOS
    for cap_origin in ['https://localhost', 'http://localhost', 'capacitor://localhost']:
        if cap_origin not in CORS_ALLOWED_ORIGINS:
            CORS_ALLOWED_ORIGINS.append(cap_origin)
CORS_ALLOW_CREDENTIALS = True

# CSRF trusted origins (required when DEBUG=False)
CSRF_TRUSTED_ORIGINS = ['https://isetkl-classroom.gleeze.com', 'http://localhost:5173', 'https://localhost', 'http://localhost', 'capacitor://localhost']
if not DEBUG:
    if _site and _site not in CSRF_TRUSTED_ORIGINS:
        CSRF_TRUSTED_ORIGINS.append(_site)
    for host in ALLOWED_HOSTS:
        origin = f'http://{host}'
        if host not in ('*', 'localhost') and origin not in CSRF_TRUSTED_ORIGINS:
            CSRF_TRUSTED_ORIGINS.append(origin)

# File upload limits
FILE_UPLOAD_MAX_MEMORY_SIZE = 50 * 1024 * 1024  # 50MB
DATA_UPLOAD_MAX_MEMORY_SIZE = 50 * 1024 * 1024

# Gmail SMTP — 500 emails/day free via App Password
SENDER_EMAIL = os.environ.get('SENDER_EMAIL', 'zaaallamni@gmail.com')
SITE_URL = os.environ.get('SITE_URL', 'https://isetkl-classroom.gleeze.com')

# Gmail SMTP (for Django's send_mail / password reset emails)
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = os.environ.get('EMAIL_HOST', 'smtp.gmail.com')
EMAIL_PORT = int(os.environ.get('EMAIL_PORT', '587'))
EMAIL_USE_TLS = os.environ.get('EMAIL_USE_TLS', 'True').lower() in ('true', '1', 'yes')
EMAIL_HOST_USER = os.environ.get('EMAIL_HOST_USER', SENDER_EMAIL)
EMAIL_HOST_PASSWORD = os.environ.get('EMAIL_HOST_PASSWORD', 'mxdzobuacnbnimqq')
DEFAULT_FROM_EMAIL = f'ISET Classroom <{SENDER_EMAIL}>'
