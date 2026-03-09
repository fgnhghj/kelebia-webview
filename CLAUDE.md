# Kelebia Classroom — Project Reference for Claude Code

## What This Is
A **LMS (Learning Management System)** called **Kelebia Classroom**.
- **Backend:** Django 4.x + Django REST Framework + JWT auth (SimpleJWT)
- **Frontend:** React 18 + Vite + React Router v6
- **Database:** SQLite (dev) / PostgreSQL (prod via `DATABASE_URL` env var)
- **Deployment:** EC2 + Nginx + Gunicorn, domain: `isetkl-classroom.gleeze.com`
- **Email:** Brevo SMTP (`smtp-relay.brevo.com`)

---

## Project Structure

```
classroom/
├── eduroom/            # Django project config (settings, urls, wsgi, asgi)
├── accounts/           # Custom User model, auth, 2FA, password reset
├── rooms/              # Classroom rooms, membership, invite codes
├── content/            # Sections, content items, assignments, submissions, grades
├── announcements/      # Room announcements + comments
├── notifications/      # In-app notifications
├── frontend/           # React/Vite SPA
│   └── src/
│       ├── pages/      # 10 pages (Dashboard, RoomDetail, Profile, Grades, etc.)
│       ├── AuthContext.jsx   # Global auth state
│       ├── LanguageContext.jsx  # i18n (FR default, switchable in settings)
│       ├── api.js      # All Axios API calls
│       └── index.css   # Design system (CSS vars, components)
├── manage.py
├── requirements.txt
└── deploy.sh
```

---

## Key Design Decisions

### Authentication
- **Custom user model:** `accounts.User` (extends `AbstractUser`)
- **JWT:** access token 60 min, refresh token 30 days, blacklist on logout
- **2FA:** TOTP via `pyotp`, QR code via `qrcode`
- **Roles:** `teacher` | `student` (set at signup, cannot change)
- **Email verification:** auto-verified on signup (no SMTP confirmation required)
- **Password reset:** 6-digit code via email, 10-min expiry, 5-attempt lockout

### Language
- **French is the default language** for ALL user-facing strings (API messages, notifications, UI)
- Frontend has a language switcher (FR/EN/AR) managed by `LanguageContext.jsx`
- Do **not** change French strings to English in API responses

### Rooms
- Teachers create rooms, students join via 8-char invite code (cryptographically random via `secrets`)
- Membership statuses: `approved` | `pending` | `removed`
- "General" section auto-created when a room is created

### Content Types
`lecture` | `tp` (Practical Work) | `exam` | `resource` | `link`
- Uploading a `tp` content auto-creates an Assignment with 1-week deadline

### Assignments & Submissions
- Students submit files (multiple allowed via `SubmissionFile`)
- `allow_late=False` is enforced (rejected at API level)
- Grades stored in separate `Grade` model (score, feedback, grader)

### File Uploads
- Max file size: 25MB (validator) / 50MB (Django setting)
- Blocked extensions: `.exe`, `.bat`, `.sh`, `.js`, `.jar`, etc. (see `content/validators.py`)
- Media files served by Nginx in prod, by Django in dev

---

## API Endpoints Overview

| Prefix | Description |
|--------|-------------|
| `POST /api/auth/signup/` | Register new user |
| `POST /api/auth/login/` | Login (returns JWT; 206 if 2FA needed) |
| `GET/PATCH /api/auth/me/` | Current user profile |
| `POST /api/auth/2fa/enable/` | Generate TOTP secret + QR |
| `POST /api/auth/2fa/confirm/` | Confirm 2FA setup |
| `POST /api/auth/2fa/disable/` | Disable 2FA |
| `POST /api/auth/forgot-password/` | Send reset code |
| `POST /api/auth/reset-password/` | Reset with code |
| `POST /api/auth/token/refresh/` | Refresh JWT |
| `POST /api/auth/token/blacklist/` | Blacklist refresh token (logout) |
| `/api/rooms/` | CRUD rooms + join/leave/members/manage_member |
| `/api/sections/` | CRUD sections (filtered by `?room=id`) |
| `/api/content/` | CRUD content items (filtered by `?room=id`) |
| `/api/assignments/` | CRUD assignments + export_grades |
| `/api/submissions/` | CRUD submissions + grade action |
| `/api/announcements/` | CRUD announcements |
| `/api/comments/` | CRUD comments |
| `/api/notifications/` | List/read/delete notifications |
| `GET /api/grades/overview/` | Student grades grouped by room |

---

## Frontend Pages

| Route | Page | Notes |
|-------|------|-------|
| `/` | `Landing.jsx` | Public hero page |
| `/login` | `Login.jsx` | Email+password, 2FA step |
| `/signup` | `Signup.jsx` | Role picker (teacher/student) |
| `/forgot-password` | `ForgotPassword.jsx` | Email → code → new password |
| `/dashboard` | `Dashboard.jsx` | Room list, join/create room |
| `/rooms/:id` | `RoomDetail.jsx` | Full room view (content, assignments, announcements, members, grades) |
| `/profile` | `Profile.jsx` | Edit profile, avatar, 2FA toggle |
| `/notifications` | `Notifications.jsx` | All notifications |
| `/grades` | `Grades.jsx` | Student grade overview |

---

## Environment Variables (Production)

```env
DJANGO_SECRET_KEY=...          # Required in prod
DJANGO_DEBUG=False
DJANGO_ALLOWED_HOSTS=isetkl-classroom.gleeze.com
DATABASE_URL=1                 # Just needs to exist to switch to Postgres
DB_NAME=eduroom
DB_USER=eduroom_user
DB_PASSWORD=...
DB_HOST=localhost
CORS_ORIGINS=https://isetkl-classroom.gleeze.com
SITE_URL=https://isetkl-classroom.gleeze.com
BREVO_API_KEY=...
BREVO_SENDER_EMAIL=...
EMAIL_HOST_USER=...
EMAIL_HOST_PASSWORD=...
```

---

## Common Commands

```bash
# Backend
python manage.py runserver
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser

# Frontend
cd frontend
npm install
npm run dev        # dev server on :5173
npm run build      # production build → dist/
```

---

## Permissions Model
- `IsRoomTeacherOrReadOnly` — teachers write, members read (content, assignments, announcements)
- `IsAuthenticated` — all other endpoints
- Students only see their own submissions; teachers see all in their rooms
- Notifications are private per user (filtered in `get_queryset`)

---

## Known Constraints
- No WebSocket / real-time (polling not implemented, notifications are pull-based)
- No email verification flow (auto-verified on signup)
- Android WebView app lives in `android-webview/` (Capacitor-based)
- `a.pem` in root is the EC2 SSH key — never commit this
