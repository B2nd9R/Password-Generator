# python -m uvicorn main:app --reload

from fastapi import FastAPI
import os
from backend.api import app  # استيراد app من ملف api.py المعدل

if __name__ == "__main__":
    import uvicorn
    # تشغيل السيرفر مع إعدادات Render
    uvicorn.run(
        "backend.api:app",  # المسار الصحيح للتطبيق
        host="0.0.0.0",
        port=int(os.environ.get("PORT", 10000)),
        reload=True,  # فقط للتنمية المحلية
        log_level="debug"  # لتسجيل كل الطلبات
    )