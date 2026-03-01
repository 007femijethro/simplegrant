from __future__ import annotations

import json
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from flask import Flask, jsonify, render_template, request

BASE_DIR = Path(__file__).resolve().parent
APPLICATIONS_FILE = BASE_DIR / "data" / "applications.json"
DONATIONS_FILE = BASE_DIR / "data" / "donations.json"
ADMIN_KEY = "FMJ-ADMIN"


def create_app() -> Flask:
    app = Flask(__name__)

    @app.get("/")
    def index() -> str:
        return render_template("index.html")

    @app.post("/api/apply")
    def apply_for_grant() -> Any:
        payload = request.get_json(silent=True) or {}
        required = ["full_name", "email", "state", "income", "need_summary"]
        missing = [field for field in required if not payload.get(field)]
        if missing:
            return jsonify({"ok": False, "error": f"Missing fields: {', '.join(missing)}"}), 400

        application_id = f"FMJ-{uuid.uuid4().hex[:8].upper()}"
        now_iso = datetime.now(timezone.utc).isoformat()
        record = {
            "application_id": application_id,
            "full_name": str(payload["full_name"]).strip(),
            "email": str(payload["email"]).strip().lower(),
            "state": str(payload["state"]).strip(),
            "income": int(payload["income"]),
            "need_summary": str(payload["need_summary"]).strip(),
            "status": "Submitted",
            "qualified_amount": 0,
            "approved_amount": 0,
            "admin_note": "Your application has been submitted and is waiting for review.",
            "created_at": now_iso,
            "updated_at": now_iso,
        }

        applications = _load_json_array(APPLICATIONS_FILE)
        applications.append(record)
        _save_json_array(APPLICATIONS_FILE, applications)
        return jsonify({"ok": True, "application_id": application_id, "message": "Application submitted successfully."})

    @app.post("/api/donate")
    def donate() -> Any:
        payload = request.get_json(silent=True) or {}
        required = ["donor_name", "email", "amount", "donation_type"]
        missing = [field for field in required if not payload.get(field)]
        if missing:
            return jsonify({"ok": False, "error": f"Missing fields: {', '.join(missing)}"}), 400

        amount = float(payload["amount"])
        if amount <= 0:
            return jsonify({"ok": False, "error": "Donation amount must be greater than zero."}), 400

        donation_id = f"DON-{uuid.uuid4().hex[:8].upper()}"
        now_iso = datetime.now(timezone.utc).isoformat()
        donation = {
            "donation_id": donation_id,
            "donor_name": str(payload["donor_name"]).strip(),
            "email": str(payload["email"]).strip().lower(),
            "amount": amount,
            "donation_type": str(payload["donation_type"]).strip(),
            "note": str(payload.get("note", "")).strip(),
            "created_at": now_iso,
        }
        donations = _load_json_array(DONATIONS_FILE)
        donations.append(donation)
        _save_json_array(DONATIONS_FILE, donations)
        return jsonify({"ok": True, "donation_id": donation_id, "message": "Thank you for your donation."})

    @app.get("/api/application/<application_id>")
    def check_application(application_id: str) -> Any:
        email = (request.args.get("email") or "").strip().lower()
        if not email:
            return jsonify({"ok": False, "error": "Email is required."}), 400

        application = _find_application(application_id)
        if not application or application["email"] != email:
            return jsonify({"ok": False, "error": "Application not found."}), 404
        return jsonify({"ok": True, "application": application})

    @app.post("/api/admin/update")
    def admin_update() -> Any:
        payload = request.get_json(silent=True) or {}
        if payload.get("admin_key") != ADMIN_KEY:
            return jsonify({"ok": False, "error": "Unauthorized."}), 401

        application_id = str(payload.get("application_id", "")).strip().upper()
        applications = _load_json_array(APPLICATIONS_FILE)
        application = next((a for a in applications if a.get("application_id", "").upper() == application_id), None)
        if not application:
            return jsonify({"ok": False, "error": "Application not found."}), 404

        for field in ["status", "admin_note"]:
            if field in payload:
                application[field] = str(payload[field]).strip()
        for field in ["qualified_amount", "approved_amount"]:
            if field in payload and payload[field] is not None:
                application[field] = max(0, int(payload[field]))

        application["updated_at"] = datetime.now(timezone.utc).isoformat()
        _save_json_array(APPLICATIONS_FILE, applications)
        return jsonify({"ok": True, "application": application})

    return app


def _load_json_array(file_path: Path) -> list[dict[str, Any]]:
    if not file_path.exists():
        return []
    with file_path.open("r", encoding="utf-8") as file:
        return json.load(file)


def _save_json_array(file_path: Path, rows: list[dict[str, Any]]) -> None:
    file_path.parent.mkdir(parents=True, exist_ok=True)
    with file_path.open("w", encoding="utf-8") as file:
        json.dump(rows, file, indent=2)


def _find_application(application_id: str) -> dict[str, Any] | None:
    application_id = application_id.strip().upper()
    for application in _load_json_array(APPLICATIONS_FILE):
        if application.get("application_id", "").upper() == application_id:
            return application
    return None


if __name__ == "__main__":
    app = create_app()
    app.run(debug=True, host="0.0.0.0", port=5000)
