from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from flask import Flask, jsonify, render_template, request

BASE_DIR = Path(__file__).resolve().parent
DATA_FILE = BASE_DIR / "data" / "grants.json"


def create_app() -> Flask:
    app = Flask(__name__)

    @app.get("/")
    def index() -> str:
        return render_template("index.html")

    @app.get("/api/grants")
    def get_grants() -> Any:
        return jsonify(_load_grants())

    @app.get("/api/stats")
    def stats() -> Any:
        grants = _load_grants()
        total = len(grants)
        avg_min_award = int(sum(g["award_min"] for g in grants) / total)
        avg_max_award = int(sum(g["award_max"] for g in grants) / total)
        categories = sorted({g["category"] for g in grants})
        return jsonify(
            {
                "total_grants": total,
                "avg_min_award": avg_min_award,
                "avg_max_award": avg_max_award,
                "categories": categories,
            }
        )

    @app.post("/api/eligibility")
    def eligibility() -> Any:
        payload = request.get_json(silent=True) or {}
        score = 0
        if payload.get("entity_type") in {"individual", "caregiver", "student"}:
            score += 25
        if payload.get("project_stage") in {"urgent", "planned"}:
            score += 25
        if payload.get("in_us") is True:
            score += 25
        if payload.get("budget") and int(payload["budget"]) <= 15000:
            score += 25

        verdict = "High" if score >= 75 else "Medium" if score >= 50 else "Low"
        return jsonify({"score": score, "verdict": verdict})

    @app.post("/api/contact")
    def contact() -> Any:
        payload = request.get_json(silent=True) or {}
        required = {"name", "email", "message"}
        missing = [field for field in required if not payload.get(field)]
        if missing:
            return jsonify({"ok": False, "error": f"Missing fields: {', '.join(missing)}"}), 400

        return jsonify({"ok": True, "message": "Thanks for applying. Our nonprofit grants team will contact you shortly."})

    return app


def _load_grants() -> list[dict[str, Any]]:
    with DATA_FILE.open(encoding="utf-8") as f:
        return json.load(f)


if __name__ == "__main__":
    app = create_app()
    app.run(debug=True, host="0.0.0.0", port=5000)
