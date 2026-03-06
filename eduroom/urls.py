"""
EduRoom (Kelebia Classroom) — URL Configuration
"""
from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from accounts.api_views import (
    api_signup, api_login, api_me,
    api_verify_email, api_resend_verification,
    api_enable_2fa, api_confirm_2fa, api_disable_2fa,
    api_forgot_password, api_reset_password,
)
from rooms.api_views import RoomViewSet
from content.api_views import SectionViewSet, ContentViewSet, AssignmentViewSet, SubmissionViewSet, student_grades_overview
from announcements.api_views import AnnouncementViewSet, CommentViewSet
from notifications.api_views import NotificationViewSet

router = DefaultRouter()
router.register(r'rooms', RoomViewSet, basename='room')
router.register(r'sections', SectionViewSet, basename='section')
router.register(r'content', ContentViewSet, basename='content')
router.register(r'assignments', AssignmentViewSet, basename='assignment')
router.register(r'submissions', SubmissionViewSet, basename='submission')
router.register(r'announcements', AnnouncementViewSet, basename='announcement')
router.register(r'comments', CommentViewSet, basename='comment')
router.register(r'notifications', NotificationViewSet, basename='notification')

urlpatterns = [
    path('admin/', admin.site.urls),

    # API endpoints
    path('api/', include(router.urls)),
    path('api/auth/signup/', api_signup, name='api_signup'),
    path('api/auth/login/', api_login, name='api_login'),
    path('api/auth/me/', api_me, name='api_me'),
    path('api/auth/verify-email/', api_verify_email, name='api_verify_email'),
    path('api/auth/resend-verification/', api_resend_verification, name='api_resend_verification'),
    path('api/auth/2fa/enable/', api_enable_2fa, name='api_enable_2fa'),
    path('api/auth/2fa/confirm/', api_confirm_2fa, name='api_confirm_2fa'),
    path('api/auth/2fa/disable/', api_disable_2fa, name='api_disable_2fa'),
    path('api/auth/forgot-password/', api_forgot_password, name='api_forgot_password'),
    path('api/auth/reset-password/', api_reset_password, name='api_reset_password'),

    # Grades overview for students
    path('api/grades/overview/', student_grades_overview, name='student_grades_overview'),

    # JWT token refresh
    path('api/auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]

# Serve media/static files — in production nginx handles this,
# but this acts as a fallback for dev and if nginx misconfigured
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
