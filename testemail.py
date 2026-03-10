import sys
import os

# Support both Linux deployment path and local Windows workspace
_LINUX_PATH = "/home/ubuntu/eduroom"
_WIN_PATH   = os.path.dirname(os.path.abspath(__file__))
for _p in (_LINUX_PATH, _WIN_PATH):
    if _p not in sys.path:
        sys.path.insert(0, _p)
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "eduroom.settings")
import django
django.setup()
from django.conf import settings
from accounts.emails import _build_html, _send_email

print("HOST:", settings.EMAIL_HOST)
print("PORT:", settings.EMAIL_PORT)
print("USER:", settings.EMAIL_HOST_USER)
print("TLS:", settings.EMAIL_USE_TLS)
print("FROM:", settings.DEFAULT_FROM_EMAIL)

site_url = getattr(settings, "SITE_URL", "https://isetkl-classroom.gleeze.com")

subject = "Kelebia Classroom \u2014 Nouveau contenu ajout\u00e9"
html = _build_html(
    "Bonjour Aymen,",
    "Un nouveau contenu a \u00e9t\u00e9 ajout\u00e9 dans votre salle de classe."
    "<br><br>"
    "<strong>Salle :</strong> Introduction \u00e0 l\u2019Informatique<br>"
    "<strong>Contenu :</strong> Cours 5 \u2014 Structures de donn\u00e9es &amp; Algorithmes<br>"
    "<strong>Type :</strong> Document PDF<br>"
    "<strong>Ajout\u00e9 par :</strong> Prof. Aymen"
    "<br><br>"
    "Connectez-vous pour consulter le nouveau mat\u00e9riel.",
    cta_url=site_url,
    cta_label="Voir le contenu",
)

try:
    _send_email("pistoohd@gmail.com", "Aymen", subject, html)
    print("SUCCESS - email sent to pistoohd@gmail.com!")
except Exception as e:
    print("ERROR:", type(e).__name__, e)
