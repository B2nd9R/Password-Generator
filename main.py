# python -m uvicorn main:app --reload

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
import os
from backend.api import app  # استيراد app من ملف api.py

# احصل على المسار المطلق للفرونت إند
frontend_dir = os.path.join(os.path.dirname(__file__), "..", "frontend")

if os.path.exists(frontend_dir):
    app.mount("/", StaticFiles(directory=frontend_dir, html=True), name="frontend")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.environ.get("PORT", 10000)))