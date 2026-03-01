from __future__ import annotations

import os
import uuid
from datetime import datetime, timezone
from typing import Any

from flask import Flask, jsonify, render_template, request, session
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import String, Text
from sqlalchemy.orm import Mapped, mapped_column

DEFAULT_DATABASE_URL = "postgresql://postgres.qxchnkfmauykcywyhwwt:Omodara4wife$@aws-1-eu-west-1.pooler.supabase.com:5432/postgres"


db = SQLAlchemy()


def _normalize_database_url(database_url: str) -> str:
    if database_url.startswith("postgres://"):
        return database_url.replace("postgres://", "postgresql+psycopg://", 1)
    if database_url.startswith("postgresql://") and "+" not in database_url.split("://", 1)[0]:
        return database_url.replace("postgresql://", "postgresql+psycopg://", 1)
    return database_url


class GApplicant(db.Model):
    __tablename__ = "g_applicants"

    id: Mapped[int] = mapped_column(primary_key=True)
    application_id: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    full_name: Mapped[str] = mapped_column(String(160), nullable=False)
    email: Mapped[str] = mapped_column(String(160), nullable=False, index=True)
    state: Mapped[str] = mapped_column(String(100), nullable=False)
    income: Mapped[int] = mapped_column(nullable=False)
    need_summary: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(40), nullable=False, default="Submitted")
    qualified_amount: Mapped[int] = mapped_column(nullable=False, default=0)
    approved_amount: Mapped[int] = mapped_column(nullable=False, default=0)
    admin_note: Mapped[str] = mapped_column(Text, nullable=False, default="Your application has been submitted and is waiting for review.")
    created_at: Mapped[datetime] = mapped_column(nullable=False)
    updated_at: Mapped[datetime] = mapped_column(nullable=False)


class GDonation(db.Model):
    __tablename__ = "g_donations"

    id: Mapped[int] = mapped_column(primary_key=True)
    donation_id: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    donor_name: Mapped[str] = mapped_column(String(160), nullable=False)
    email: Mapped[str] = mapped_column(String(160), nullable=False, index=True)
    amount: Mapped[float] = mapped_column(nullable=False)
    donation_type: Mapped[str] = mapped_column(String(80), nullable=False)
    note: Mapped[str] = mapped_column(Text, nullable=False, default="")
    created_at: Mapped[datetime] = mapped_column(nullable=False)


class GAdminUser(db.Model):
    __tablename__ = "g_admin_users"

    id: Mapped[int] = mapped_column(primary_key=True)
    username: Mapped[str] = mapped_column(String(80), unique=True, nullable=False)
    password: Mapped[str] = mapped_column(String(120), nullable=False)


class GTestimonial(db.Model):
    __tablename__ = "g_testimonials"

    id: Mapped[int] = mapped_column(primary_key=True)
    full_name: Mapped[str] = mapped_column(String(120), nullable=False)
    role_title: Mapped[str] = mapped_column(String(160), nullable=False)
    location: Mapped[str] = mapped_column(String(160), nullable=False)
    quote: Mapped[str] = mapped_column(Text, nullable=False)
    is_featured: Mapped[bool] = mapped_column(nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(nullable=False)
    updated_at: Mapped[datetime] = mapped_column(nullable=False)


def create_app() -> Flask:
    app = Flask(__name__)
    database_url = os.getenv("DATABASE_URL", DEFAULT_DATABASE_URL)
    app.config["SQLALCHEMY_DATABASE_URI"] = _normalize_database_url(database_url)
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "simplegrant-secret")

    db.init_app(app)

    with app.app_context():
        db.create_all()
        _seed_admin_user()
        _seed_testimonials()

    @app.get("/")
    def index() -> str:
        return render_template("index.html")

    @app.get("/admin")
    def admin_page() -> str:
        if not session.get("admin_authenticated"):
            return render_template("admin_login.html")
        return render_template("admin_dashboard.html")

    @app.get("/api/testimonials")
    def get_testimonials() -> Any:
        testimonials = (
            GTestimonial.query.filter_by(is_featured=True)
            .order_by(GTestimonial.updated_at.desc())
            .limit(12)
            .all()
        )
        return jsonify({"ok": True, "testimonials": [_serialize_testimonial(t) for t in testimonials]})

    @app.post("/api/admin/login")
    def admin_login() -> Any:
        payload = request.get_json(silent=True) or {}
        username = str(payload.get("username", "")).strip()
        password = str(payload.get("password", "")).strip()

        admin_user = GAdminUser.query.filter_by(username=username).first()
        if not admin_user or admin_user.password != password:
            return jsonify({"ok": False, "error": "Invalid admin credentials."}), 401

        session["admin_authenticated"] = True
        session["admin_username"] = admin_user.username
        return jsonify({"ok": True, "message": "Logged in successfully."})

    @app.post("/api/admin/logout")
    def admin_logout() -> Any:
        session.clear()
        return jsonify({"ok": True})

    @app.get("/api/admin/testimonials")
    def admin_get_testimonials() -> Any:
        if not session.get("admin_authenticated"):
            return jsonify({"ok": False, "error": "Unauthorized."}), 401

        testimonials = GTestimonial.query.order_by(GTestimonial.updated_at.desc()).all()
        return jsonify({"ok": True, "testimonials": [_serialize_testimonial(t) for t in testimonials]})

    @app.post("/api/admin/testimonials")
    def admin_upsert_testimonial() -> Any:
        if not session.get("admin_authenticated"):
            return jsonify({"ok": False, "error": "Unauthorized."}), 401

        payload = request.get_json(silent=True) or {}
        testimonial_id = payload.get("id")

        required_fields = ["full_name", "role_title", "location", "quote"]
        missing = [field for field in required_fields if not str(payload.get(field, "")).strip()]
        if missing:
            return jsonify({"ok": False, "error": f"Missing fields: {', '.join(missing)}"}), 400

        now = datetime.now(timezone.utc)

        if testimonial_id:
            testimonial = GTestimonial.query.filter_by(id=int(testimonial_id)).first()
            if not testimonial:
                return jsonify({"ok": False, "error": "Testimonial not found."}), 404
        else:
            testimonial = GTestimonial(created_at=now, updated_at=now)
            db.session.add(testimonial)

        testimonial.full_name = str(payload["full_name"]).strip()
        testimonial.role_title = str(payload["role_title"]).strip()
        testimonial.location = str(payload["location"]).strip()
        testimonial.quote = str(payload["quote"]).strip()
        testimonial.is_featured = bool(payload.get("is_featured", True))
        testimonial.updated_at = now

        db.session.commit()
        return jsonify({"ok": True, "testimonial": _serialize_testimonial(testimonial)})

    @app.post("/api/apply")
    def apply_for_grant() -> Any:
        payload = request.get_json(silent=True) or {}
        required = ["full_name", "email", "state", "income", "need_summary"]
        missing = [field for field in required if not payload.get(field)]
        if missing:
            return jsonify({"ok": False, "error": f"Missing fields: {', '.join(missing)}"}), 400

        now = datetime.now(timezone.utc)
        application_id = f"FMJ-{uuid.uuid4().hex[:8].upper()}"
        record = GApplicant(
            application_id=application_id,
            full_name=str(payload["full_name"]).strip(),
            email=str(payload["email"]).strip().lower(),
            state=str(payload["state"]).strip(),
            income=int(payload["income"]),
            need_summary=str(payload["need_summary"]).strip(),
            status="Submitted",
            qualified_amount=0,
            approved_amount=0,
            admin_note="Your application has been submitted and is waiting for review.",
            created_at=now,
            updated_at=now,
        )
        db.session.add(record)
        db.session.commit()
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

        donation = GDonation(
            donation_id=f"DON-{uuid.uuid4().hex[:8].upper()}",
            donor_name=str(payload["donor_name"]).strip(),
            email=str(payload["email"]).strip().lower(),
            amount=amount,
            donation_type=str(payload["donation_type"]).strip(),
            note=str(payload.get("note", "")).strip(),
            created_at=datetime.now(timezone.utc),
        )
        db.session.add(donation)
        db.session.commit()
        return jsonify({"ok": True, "donation_id": donation.donation_id, "message": "Thank you for your donation."})

    @app.get("/api/application/<application_id>")
    def check_application(application_id: str) -> Any:
        email = (request.args.get("email") or "").strip().lower()
        if not email:
            return jsonify({"ok": False, "error": "Email is required."}), 400

        application = GApplicant.query.filter_by(application_id=application_id.strip().upper(), email=email).first()
        if not application:
            return jsonify({"ok": False, "error": "Application not found."}), 404
        return jsonify({"ok": True, "application": _serialize_application(application)})

    @app.post("/api/admin/update")
    def admin_update() -> Any:
        if not session.get("admin_authenticated"):
            return jsonify({"ok": False, "error": "Unauthorized."}), 401

        payload = request.get_json(silent=True) or {}
        application_id = str(payload.get("application_id", "")).strip().upper()
        application = GApplicant.query.filter_by(application_id=application_id).first()
        if not application:
            return jsonify({"ok": False, "error": "Application not found."}), 404

        for field in ["status", "admin_note"]:
            if field in payload:
                setattr(application, field, str(payload[field]).strip())
        for field in ["qualified_amount", "approved_amount"]:
            if field in payload and payload[field] is not None:
                setattr(application, field, max(0, int(payload[field])))

        application.updated_at = datetime.now(timezone.utc)
        db.session.commit()
        return jsonify({"ok": True, "application": _serialize_application(application)})

    return app


def _serialize_application(application: GApplicant) -> dict[str, Any]:
    return {
        "application_id": application.application_id,
        "full_name": application.full_name,
        "email": application.email,
        "state": application.state,
        "income": application.income,
        "need_summary": application.need_summary,
        "status": application.status,
        "qualified_amount": application.qualified_amount,
        "approved_amount": application.approved_amount,
        "admin_note": application.admin_note,
        "created_at": application.created_at.isoformat(),
        "updated_at": application.updated_at.isoformat(),
    }


def _serialize_testimonial(testimonial: GTestimonial) -> dict[str, Any]:
    return {
        "id": testimonial.id,
        "full_name": testimonial.full_name,
        "role_title": testimonial.role_title,
        "location": testimonial.location,
        "quote": testimonial.quote,
        "is_featured": testimonial.is_featured,
        "created_at": testimonial.created_at.isoformat(),
        "updated_at": testimonial.updated_at.isoformat(),
    }


def _seed_admin_user() -> None:
    admin = GAdminUser.query.filter_by(username="admin").first()
    if not admin:
        db.session.add(GAdminUser(username="admin", password="Jethro01"))
        db.session.commit()


def _seed_testimonials() -> None:
    if GTestimonial.query.count() > 0:
        return

    now = datetime.now(timezone.utc)
    samples = [
        {
            "full_name": "Aisha Thompson",
            "role_title": "Single Parent & Grant Recipient",
            "location": "Houston, Texas",
            "quote": "FMJ support helped me keep my apartment and cover school supplies for my children during a difficult transition.",
        },
        {
            "full_name": "Michael Rivera",
            "role_title": "Community Volunteer",
            "location": "Phoenix, Arizona",
            "quote": "The recovery grants gave our neighborhood center enough momentum to reopen services faster than expected.",
        },
        {
            "full_name": "Janelle Brooks",
            "role_title": "Youth Program Participant",
            "location": "Atlanta, Georgia",
            "quote": "I received technology support and mentorship that helped me stay in school and complete my certification goals.",
        },
        {
            "full_name": "David Chen",
            "role_title": "Local Partner Organization Lead",
            "location": "Seattle, Washington",
            "quote": "FMJ collaborates with partners in a way that respects local needs and gets real resources to families quickly.",
        },
    ]

    for sample in samples:
        db.session.add(
            GTestimonial(
                full_name=sample["full_name"],
                role_title=sample["role_title"],
                location=sample["location"],
                quote=sample["quote"],
                is_featured=True,
                created_at=now,
                updated_at=now,
            )
        )

    db.session.commit()


if __name__ == "__main__":
    app = create_app()
    app.run(debug=True, host="0.0.0.0", port=5000)
