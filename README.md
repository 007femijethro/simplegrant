# FMJ Organisation Community Impact Portal

A Flask-based portal for donations and grant applications with PostgreSQL persistence.

## Configuration
Set the database connection string with `DATABASE_URL`:

```bash
export DATABASE_URL='postgresql://postgres.qxchnkfmauykcywyhwwt:Omodara4wife$@aws-1-eu-west-1.pooler.supabase.com:5432/postgres'
```

The app auto-creates these tables on startup (all `g_` prefixed):
- `g_applicants`
- `g_donations`
- `g_admin_users`

A default admin user is seeded automatically:
- Username: `admin`
- Password: `Jethro01`

## Features
- Modal popup forms for **Apply for Grant** and **Donate Today** actions.
- Application tracking by application ID + email.
- Dedicated `/admin` route with login and authenticated application review/update actions.

## APIs
- `POST /api/donate` — submit a donation record.
- `POST /api/apply` — submit a grant application.
- `GET /api/application/<application_id>?email=<email>` — track status.
- `POST /api/admin/login` — admin login.
- `POST /api/admin/update` — update application review fields (authenticated session).
- `POST /api/admin/logout` — admin logout.

## Run locally
```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python run.py
```

Open: <http://localhost:5000>
