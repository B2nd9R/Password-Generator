import os
import logging
from pathlib import Path
from backend.api import app
from fastapi import FastAPI

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def check_required_files():
    """التحقق من وجود الملفات الأساسية"""
    required_files = [
        Path(__file__).parent / "frontend" / "index.html",
        Path(__file__).parent / "frontend" / "lang" / "en.json",
        Path(__file__).parent / "frontend" / "lang" / "ar.json"
    ]
    
    missing_files = [str(f) for f in required_files if not f.exists()]
    if missing_files:
        logger.error(f"Missing required files: {', '.join(missing_files)}")
        return False
    return True

if __name__ == "__main__":
    if not check_required_files():
        raise RuntimeError("بعض الملفات الأساسية مفقودة. الرجاء التحقق من هيكل المجلدات.")
    
    import uvicorn
    uvicorn.run(
        "backend.api:app",
        host="0.0.0.0",
        port=int(os.environ.get("PORT", 8000)),
        reload=True,
        log_level="info",
        access_log=True
    )