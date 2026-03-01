# FMJ Organisation Community Impact Portal (Simulation)

A Flask-based simulation portal inspired by large nonprofit experience patterns.

## Website experience
- Content-rich homepage with mission, impact areas, programs, and get-involved sections.
- Action area with **tabs** for:
  - Donate
  - Apply for Grant
  - Monitor Application
  - Admin Review

## APIs
- `POST /api/donate` — submit a donation record.
- `POST /api/apply` — submit a grant application.
- `GET /api/application/<application_id>?email=<email>` — track status.
- `POST /api/admin/update` — admin simulation updates.

## Run locally
```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python run.py
```

Open: <http://localhost:5000>

## Simulation Admin Access
- Admin key: `FMJ-ADMIN`
