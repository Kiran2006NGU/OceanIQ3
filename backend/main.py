"""
backend/main.py — Direct entry point for FastAPI service (Vercel Services & ASGI runners).
"""

from app.main import app

__all__ = ["app"]
