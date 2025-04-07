# python -m uvicorn main:app --reload

import os
import logging
from pathlib import Path
from backend.api import app  # استيراد app من ملف api.py

# إعداد التسجيل
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def check_directory_structure():
    """التحقق من هيكل المجلدات الأساسية"""
    required_dirs = [
        Path(__file__).parent / "frontend",
        Path(__file__).parent / "frontend/static",
        Path(__file__).parent / "backend"
    ]
    
    for dir_path in required_dirs:
        if not dir_path.exists():
            logger.error(f"المجلد المطلوب غير موجود: {dir_path}")
            return False
    return True

if __name__ == "__main__":
    try:
        if not check_directory_structure():
            raise RuntimeError("هيكل المجلدات غير صحيح!")
        
        logger.info("بدء تشغيل خادم FastAPI...")
        
        import uvicorn
        uvicorn.run(
            "backend.api:app",
            host="0.0.0.0",
            port=int(os.environ.get("PORT", 8000)),
            reload=os.getenv("DEV_MODE", "True") == "True",
            log_level="debug",
            reload_dirs=["backend", "frontend"] if os.getenv("DEV_MODE") == "True" else None,
            access_log=True
        )
    except Exception as e:
        logger.critical(f"فشل تشغيل الخادم: {str(e)}")
        raise