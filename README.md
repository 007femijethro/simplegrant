# US Grant Hub (Flask)

A feature-rich U.S. grants discovery web app built with Flask + vanilla JavaScript.

## Features
- Dynamic grant listings with search, category, state, and minimum-award filters.
- Live stats summary from backend API.
- Save/unsave grants in browser local storage.
- Eligibility quick-check form with scoring API.
- Contact form connected to Flask endpoint.
- Dark mode toggle with persisted preference.
- Responsive cards, FAQ, and image-rich UI using online Unsplash photos.

## Run locally
```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python run.py
```

Then open <http://localhost:5000>.


## Deploy on Render (Web Service)
Use these values in the Render form:

- **Language:** Python 3
- **Branch:** `main`
- **Region:** choose the same region as your other services (e.g., Oregon)
- **Root Directory:** leave blank
- **Build Command:** `pip install -r requirements.txt`
- **Start Command:** `gunicorn run:app`

### Environment variables
- `PYTHON_VERSION=3.11.11` (optional but recommended)
- Add any app secrets your deployment needs.
