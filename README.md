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
