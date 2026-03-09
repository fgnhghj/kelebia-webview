"""Email utilities for Kelebia Classroom.

Uses Django's SMTP backend (configured via EMAIL_HOST settings).
"""
import logging
from django.conf import settings
from django.core.mail import send_mail

logger = logging.getLogger(__name__)


def _html_to_text(html):
    """Strip basic HTML tags to produce a plain-text fallback."""
    import re
    text = re.sub(r'<[^>]+>', ' ', html)
    return ' '.join(text.split())


def _send_email(to_email, to_name, subject, html_body):
    """Send a single email via Django SMTP backend."""
    try:
        send_mail(
            subject=subject,
            message=_html_to_text(html_body),  # L7: proper plain-text fallback
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[to_email],
            html_message=html_body,
            fail_silently=False,
        )
    except Exception as e:
        logger.warning(f'Email failed for {to_email}: {e}')


def _build_html(greeting, body_text, cta_url=None):
    """Build a simple styled HTML email."""
    cta = ''
    if cta_url:
        cta = f'<p style="margin-top:20px"><a href="{cta_url}" style="background:#6366f1;color:white;padding:10px 24px;border-radius:6px;text-decoration:none;font-weight:600">Ouvrir Kelebia Classroom</a></p>'
    return f'''
    <div style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto;padding:24px">
        <h2 style="color:#6366f1;margin-bottom:4px">Kelebia Classroom</h2>
        <hr style="border:none;border-top:2px solid #e5e7eb;margin:12px 0 20px">
        <p style="font-size:15px"><strong>{greeting}</strong></p>
        <p style="font-size:14px;color:#374151;line-height:1.6">{body_text}</p>
        {cta}
        <p style="font-size:12px;color:#9ca3af;margin-top:24px">— Kelebia Classroom</p>
    </div>
    '''


def send_notification_email(user, subject, message):
    """Send a notification email to a single user."""
    site_url = getattr(settings, 'SITE_URL', 'https://isetkl-classroom.gleeze.com')
    html = _build_html(
        f'Bonjour {user.first_name or user.username},',
        message,
        cta_url=site_url,
    )
    _send_email(user.email, user.get_full_name(), f'Kelebia — {subject}', html)


def notify_room_members(room, subject, message, exclude_user=None):
    """Email all approved members of a room."""
    from rooms.models import RoomMembership
    memberships = RoomMembership.objects.filter(
        room=room, status='approved'
    ).select_related('student')
    for m in memberships:
        if exclude_user and m.student == exclude_user:
            continue
        send_notification_email(m.student, subject, message)


def notify_teacher(room, subject, message):
    """Email the teacher of a room."""
    send_notification_email(room.teacher, subject, message)
