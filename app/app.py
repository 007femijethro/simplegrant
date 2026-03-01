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
        grants = _load_grants()
        search = request.args.get("search", "").strip().lower()
        category = request.args.get("category", "all").strip().lower()
        state = request.args.get("state", "all").strip().upper()
        min_award = int(request.args.get("min_award", 0))

        filtered = []
        for grant in grants:
            if search and search not in json.dumps(grant).lower():
                continue
            if category != "all" and grant["category"].lower() != category:
                continue
            if state != "ALL" and state not in grant["states"] and "NATIONAL" not in grant["states"]:
                continue
            if grant["award_max"] < min_award:
                continue
            filtered.append(grant)

        return jsonify(filtered)

    @app.get("/api/stats")
    def stats() -> Any:
        grants = _load_grants()
        total = len(grants)
        avg_max_award = int(sum(g["award_max"] for g in grants) / total)
        categories = sorted({g["category"] for g in grants})
        return jsonify(
            {
                "total_grants": total,
                "avg_max_award": avg_max_award,
                "categories": categories,
            }
        )

    @app.post("/api/eligibility")
    def eligibility() -> Any:
        payload = request.get_json(silent=True) or {}
        score = 0
        if payload.get("entity_type") in {"nonprofit", "tribal", "small_business"}:
            score += 25
        if payload.get("project_stage") in {"ready", "pilot"}:
            score += 25
        if payload.get("in_us") is True:
            score += 25
        if payload.get("budget") and int(payload["budget"]) > 10000:
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

        return jsonify({"ok": True, "message": "Thanks! Our grant advisor will reach out soon."})

    return app


def _load_grants() -> list[dict[str, Any]]:
    with DATA_FILE.open(encoding="utf-8") as f:
        return json.load(f)


if __name__ == "__main__":
    app = create_app()
    app.run(debug=True, host="0.0.0.0", port=5000)
