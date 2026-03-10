"""Email utilities for Kelebia Classroom.

Uses direct smtplib SMTP (Gmail app-password) with branded HTML templates.
Credentials are loaded from Django settings (EMAIL_HOST / EMAIL_HOST_USER / EMAIL_HOST_PASSWORD).
"""
import re
import smtplib
import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from django.conf import settings

logger = logging.getLogger(__name__)


def _html_to_text(html):
    """Strip HTML tags to produce a plain-text fallback."""
    text = re.sub(r'<[^>]+>', ' ', html)
    return ' '.join(text.split())


def _send_email(to_email, to_name, subject, html_body):
    """Send a single email via direct smtplib (Gmail app-password).

    Reads credentials from Django settings:
        EMAIL_HOST, EMAIL_PORT, EMAIL_HOST_USER, EMAIL_HOST_PASSWORD,
        DEFAULT_FROM_EMAIL.
    """
    host = getattr(settings, 'EMAIL_HOST', 'smtp.gmail.com')
    port = int(getattr(settings, 'EMAIL_PORT', 587))
    user = settings.EMAIL_HOST_USER
    password = settings.EMAIL_HOST_PASSWORD
    from_addr = getattr(settings, 'DEFAULT_FROM_EMAIL', user)

    import uuid
    from email.utils import formatdate

    msg = MIMEMultipart('alternative')
    msg['Subject'] = subject
    msg['From'] = from_addr
    msg['To'] = to_email
    msg['Date'] = formatdate(localtime=True)
    msg['Message-ID'] = f'<{uuid.uuid4().hex}@kelebia-classroom.com>'
    msg['Reply-To'] = from_addr
    msg['X-Mailer'] = 'Kelebia Classroom'
    msg['List-Unsubscribe'] = f'<mailto:{user}?subject=unsubscribe>'
    msg.attach(MIMEText(_html_to_text(html_body), 'plain', 'utf-8'))
    msg.attach(MIMEText(html_body, 'html', 'utf-8'))

    try:
        with smtplib.SMTP(host, port) as server:
            server.ehlo()
            server.starttls()
            server.login(user, password)
            server.sendmail(user, [to_email], msg.as_string())
        logger.info(f'Email sent to {to_email} — {subject}')
    except Exception as e:
        logger.warning(f'Email failed for {to_email}: {e}')


def _build_html(greeting, body_text, cta_url=None, cta_label=None):
    """Build a professional branded HTML email matching the Kelebia site aesthetic."""
    site_url = getattr(settings, 'SITE_URL', 'https://isetkl-classroom.gleeze.com')
    year = __import__('datetime').datetime.now().year

    cta_block = ''
    if cta_url:
        label = cta_label or 'Ouvrir Kelebia Classroom'
        cta_block = f'''
            <tr>
              <td style="padding: 8px 40px 32px;">
                <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                  <tr>
                    <td style="background: #1a1a2e; border-radius: 8px;">
                      <a href="{cta_url}" target="_blank"
                         style="display: inline-block; padding: 14px 36px; color: #ffffff;
                                font-size: 15px; font-weight: 600; text-decoration: none;
                                font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif;
                                letter-spacing: 0.3px;">
                        {label} &rarr;
                      </a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>'''

    return f'''<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{greeting}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f3f1; -webkit-font-smoothing: antialiased;">
  <!-- Outer wrapper -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
         style="background-color: #f4f3f1; padding: 40px 16px;">
    <tr>
      <td align="center">
        <!-- Card -->
        <table role="presentation" width="560" cellpadding="0" cellspacing="0"
               style="max-width: 560px; width: 100%; background: #ffffff;
                      border-radius: 12px; overflow: hidden;
                      box-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04);">

          <!-- Header bar -->
          <tr>
            <td style="background: linear-gradient(135deg, #1a1a2e 0%, #2d2b55 100%);
                       padding: 28px 40px; text-align: center;">
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                <tr>
                  <td style="background: rgba(255,255,255,0.15); width: 36px; height: 36px;
                             border-radius: 8px; text-align: center; vertical-align: middle;
                             font-family: Georgia, 'Times New Roman', serif;
                             font-size: 18px; font-weight: 600; color: #ffffff;
                             letter-spacing: -0.5px;">
                    K
                  </td>
                  <td style="padding-left: 12px;
                             font-family: Georgia, 'Times New Roman', serif;
                             font-size: 20px; font-weight: 500; color: #ffffff;
                             letter-spacing: -0.3px;">
                    Kelebia Classroom
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body content -->
          <tr>
            <td style="padding: 36px 40px 8px;">
              <p style="margin: 0 0 6px; font-size: 17px; font-weight: 600; color: #1a1a2e;
                        font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif;">
                {greeting}
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 40px 28px;">
              <p style="margin: 0; font-size: 15px; line-height: 1.7; color: #4a4a5a;
                        font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif;">
                {body_text}
              </p>
            </td>
          </tr>

          <!-- CTA button -->
          {cta_block}

          <!-- Divider -->
          <tr>
            <td style="padding: 0 40px;">
              <div style="border-top: 1px solid #eeeee8; margin: 0;"></div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px 28px; text-align: center;">
              <p style="margin: 0 0 8px; font-size: 12px; color: #9a9a9a;
                        font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif;">
                Vous recevez cet email car vous avez un compte sur
                <a href="{site_url}" style="color: #6a6a8a; text-decoration: underline;">Kelebia Classroom</a>.
              </p>
              <p style="margin: 0; font-size: 11px; color: #b5b5b5;
                        font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif;">
                &copy; {year} Kelebia Classroom &mdash; ISEK
              </p>
            </td>
          </tr>

        </table>
        <!-- /Card -->
      </td>
    </tr>
  </table>
</body>
</html>'''


def send_notification_email(user, subject, message):
    """Send a notification email to a single user."""
    site_url = getattr(settings, 'SITE_URL', 'https://isetkl-classroom.gleeze.com')
    html = _build_html(
        f'Bonjour {user.first_name or user.username},',
        message,
        cta_url=site_url,
    )
    _send_email(user.email, user.get_full_name(), f'Kelebia Classroom — {subject}', html)


def send_verification_email(user, code):
    """Send a verification code email (password reset etc.)."""
    site_url = getattr(settings, 'SITE_URL', 'https://isetkl-classroom.gleeze.com')
    body = f'''Voici votre code de vérification\u00a0:
    <div style="margin: 20px 0; text-align: center;">
      <span style="display: inline-block; background: #f4f3f1; border: 1px solid #e5e5e0;
                   border-radius: 10px; padding: 16px 32px;
                   font-family: 'JetBrains Mono', 'Fira Code', 'Courier New', monospace;
                   font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #1a1a2e;">
        {code}
      </span>
    </div>
    <span style="color: #9a9a9a; font-size: 13px;">Ce code expire dans 10 minutes. Ne le partagez avec personne.</span>'''

    html = _build_html(
        f'Bonjour {user.first_name or user.username},',
        body,
        cta_url=site_url,
        cta_label='Aller à Kelebia Classroom',
    )
    _send_email(user.email, user.get_full_name(), 'Kelebia Classroom — Code de vérification', html)


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
