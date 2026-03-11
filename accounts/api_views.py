from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework_simplejwt.tokens import RefreshToken
from .models import AppVersion
from .serializers import SignupSerializer, LoginSerializer, UserSerializer, UserProfileSerializer, AppVersionSerializer
import secrets
import pyotp
import qrcode
import io
import base64


class LoginRateThrottle(ScopedRateThrottle):
    scope = 'login'


@api_view(['POST'])
@permission_classes([AllowAny])
@throttle_classes([LoginRateThrottle])
def api_signup(request):
    """Register a new user, send verification code, return JWT tokens."""
    serializer = SignupSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    user = serializer.save()
    # Auto-verify email (no SMTP configured)
    user.email_verified = True
    user.save(update_fields=['email_verified'])
    refresh = RefreshToken.for_user(user)
    return Response({
        'user': UserSerializer(user).data,
        'tokens': {
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        },
        'requires_verification': False,
    }, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def api_verify_email(request):
    """Verify the user's email with the 6-digit code."""
    code = request.data.get('code', '')
    user = request.user
    if user.email_verified:
        return Response({'detail': 'Email déjà vérifié.'})
    if user.verification_code == code:
        user.email_verified = True
        user.verification_code = ''
        user.save(update_fields=['email_verified', 'verification_code'])
        return Response({'detail': 'Email vérifié avec succès !'})
    return Response({'detail': 'Code invalide.'}, status=400)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def api_resend_verification(request):
    """Deprecated — email is auto-verified on signup. Kept for URL compatibility."""
    return Response(
        {'detail': 'Email verification is automatic. This endpoint is no longer needed.'},
        status=status.HTTP_410_GONE,
    )


@api_view(['POST'])
@permission_classes([AllowAny])
@throttle_classes([LoginRateThrottle])
def api_login(request):
    """Login and return JWT tokens."""
    serializer = LoginSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    user = serializer.validated_data['user']

    # Check 2FA
    if user.is_2fa_enabled:
        totp_code = request.data.get('totp_code', '')
        if not totp_code:
            return Response({
                'requires_2fa': True,
                'detail': 'Code 2FA requis.'
            }, status=status.HTTP_206_PARTIAL_CONTENT)
        if not user.verify_totp(totp_code):
            return Response({'detail': 'Code 2FA invalide.'}, status=400)

    refresh = RefreshToken.for_user(user)
    return Response({
        'user': UserSerializer(user).data,
        'tokens': {
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        }
    })


@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
def api_me(request):
    """Get or update the current user's profile."""
    ctx = {'request': request}
    if request.method == 'GET':
        return Response(UserSerializer(request.user, context=ctx).data)
    serializer = UserProfileSerializer(request.user, data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return Response(UserSerializer(request.user, context=ctx).data)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def api_delete_avatar(request):
    """Delete the current user's avatar and return to initials."""
    user = request.user
    if user.avatar:
        user.avatar.delete(save=False)
    user.avatar = None
    user.save(update_fields=['avatar'])
    return Response(UserSerializer(user, context={'request': request}).data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def api_enable_2fa(request):
    """Generate a TOTP secret and return a QR code for 2FA setup."""
    user = request.user
    if user.is_2fa_enabled:
        return Response({'detail': '2FA est déjà activé.'}, status=400)

    secret = user.generate_totp_secret()
    uri = user.get_totp_uri()

    # Generate QR code as base64 image
    img = qrcode.make(uri)
    buf = io.BytesIO()
    img.save(buf, format='PNG')
    qr_base64 = base64.b64encode(buf.getvalue()).decode()

    return Response({
        'secret': secret,
        'qr_code': f'data:image/png;base64,{qr_base64}',
        'uri': uri,
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def api_confirm_2fa(request):
    """Confirm 2FA setup by verifying a TOTP code."""
    user = request.user
    code = request.data.get('code', '')
    if not user.totp_secret:
        return Response({'detail': 'Aucun secret 2FA généré.'}, status=400)
    if user.verify_totp(code):
        user.is_2fa_enabled = True
        user.save(update_fields=['is_2fa_enabled'])
        return Response({'detail': '2FA activé avec succès !'})
    return Response({'detail': 'Code invalide.'}, status=400)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def api_disable_2fa(request):
    """Disable 2FA."""
    user = request.user
    user.is_2fa_enabled = False
    user.totp_secret = ''
    user.save(update_fields=['is_2fa_enabled', 'totp_secret'])
    return Response({'detail': '2FA désactivé.'})


@api_view(['POST'])
@permission_classes([AllowAny])
@throttle_classes([LoginRateThrottle])
def api_forgot_password(request):
    """Send a password reset code to the user's email."""
    from .models import User
    from accounts.emails import send_verification_email
    email = request.data.get('email', '').strip().lower()
    # Always return success to avoid email enumeration
    try:
        user = User.objects.get(email=email)
        code = user.generate_verification_code()
        send_verification_email(user, code)
    except User.DoesNotExist:
        pass
    return Response({'detail': 'Si un compte existe avec cet email, un code a été envoyé.'})


@api_view(['POST'])
@permission_classes([AllowAny])
@throttle_classes([LoginRateThrottle])
def api_reset_password(request):
    """Reset password using the 6-digit code."""
    from .models import User
    from django.utils import timezone
    from datetime import timedelta
    email = request.data.get('email', '').strip().lower()
    code = request.data.get('code', '')
    new_password = request.data.get('new_password', '')
    if len(new_password) < 8:
        return Response({'detail': 'Le mot de passe doit contenir au moins 8 caractères.'}, status=400)
    try:
        user = User.objects.get(email=email)
        if not code or user.verification_code != code:
            # C1: Brute-force lockout — invalidate code after 5 wrong attempts
            cache_key = f'reset_attempts_{email}'
            from django.core.cache import cache
            attempts = cache.get(cache_key, 0) + 1
            cache.set(cache_key, attempts, timeout=600)  # 10 min window
            if attempts >= 5:
                user.verification_code = ''
                user.save(update_fields=['verification_code'])
                cache.delete(cache_key)
                return Response({'detail': 'Trop de tentatives incorrectes. Veuillez demander un nouveau code.'}, status=400)
            return Response({'detail': 'Code invalide.'}, status=400)
        # Check code expiry (10 minutes)
        if user.code_created_at and (timezone.now() - user.code_created_at) > timedelta(minutes=10):
            user.verification_code = ''
            user.save(update_fields=['verification_code'])
            return Response({'detail': 'Code expiré. Veuillez en demander un nouveau.'}, status=400)
        user.set_password(new_password)
        user.verification_code = ''
        user.code_created_at = None
        user.save(update_fields=['password', 'verification_code', 'code_created_at'])
        # Clear brute-force counter on success
        from django.core.cache import cache
        cache.delete(f'reset_attempts_{email}')
        return Response({'detail': 'Mot de passe réinitialisé avec succès !'})
    except User.DoesNotExist:
        return Response({'detail': 'Code invalide.'}, status=400)

from django.views.decorators.cache import never_cache

@never_cache
@api_view(['GET', 'POST', 'PATCH', 'DELETE'])
@permission_classes([AllowAny])
def api_app_version(request):
    """Get or update app versions."""
    
    if request.method == 'GET':
        version_param = request.query_params.get('version')
        if version_param:
            try:
                version = AppVersion.objects.get(version_name=version_param)
                return Response(AppVersionSerializer(version).data)
            except AppVersion.DoesNotExist:
                return Response({'is_locked': False})
        else:
            versions = AppVersion.objects.all().order_by('-updated_at')
            return Response(AppVersionSerializer(versions, many=True).data)

    # Admin only below this point
    if not request.user.is_authenticated or not request.user.is_superuser:
        return Response({'detail': 'Non autorisé. Admin only.'}, status=403)

    if request.method == 'POST':
        serializer = AppVersionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    if request.method == 'PATCH':
        version_id = request.data.get('id')
        if not version_id:
            return Response({"detail": "ID required for PATCH"}, status=400)
        try:
            version = AppVersion.objects.get(id=version_id)
        except AppVersion.DoesNotExist:
            return Response({"detail": "Not found"}, status=404)
        
        serializer = AppVersionSerializer(version, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    if request.method == 'DELETE':
        version_id = request.data.get('id')
        if not version_id:
            return Response({"detail": "ID required for DELETE"}, status=400)
        AppVersion.objects.filter(id=version_id).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
