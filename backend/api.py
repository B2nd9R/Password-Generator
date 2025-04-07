import os
from fastapi import FastAPI, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel
from typing import Optional
from pathlib import Path
import json
import logging
import re

from backend.generators import (
    generate_secure_password,
    generate_memorable_password,
    generate_pin,
    generate_custom_password
)

# إعداد التسجيل
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

# إعداد CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8000",
        "http://localhost:3000",
        "https://password-generator-vm7k.onrender.com"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# المسارات الصحيحة
BASE_DIR = Path(__file__).parent.parent
FRONTEND_DIR = BASE_DIR / "frontend"
STATIC_DIR = FRONTEND_DIR / "static"
ASSETS_DIR = FRONTEND_DIR / "assets"
LANG_DIR = FRONTEND_DIR / "lang"

# خدمة الملفات الثابتة
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")
app.mount("/assets", StaticFiles(directory=ASSETS_DIR), name="assets")
app.mount("/lang", StaticFiles(directory=LANG_DIR), name="lang")

# تحميل ملفات اللغة (محدث)
def load_language(lang_code):
    try:
        # تنظيف كود اللغة من أي إضافات مثل ;q=0.5
        clean_lang = re.split(r'[;,]', lang_code)[0].strip().lower()
        
        # اللغات المدعومة
        supported_langs = ['en', 'ar']
        
        # استخدم الإنجليزية إذا لم تكن اللغة مدعومة
        if clean_lang not in supported_langs:
            clean_lang = 'en'
        
        lang_file = LANG_DIR / f"{clean_lang}.json"
        
        if not lang_file.exists():
            logger.warning(f"ملف اللغة {clean_lang}.json غير موجود، استخدام الإنجليزية")
            lang_file = LANG_DIR / "en.json"
            
            if not lang_file.exists():
                logger.error("ملف اللغة الإنجليزية غير موجود!")
                return {}

        with open(lang_file, "r", encoding="utf-8") as file:
            return json.load(file)
            
    except Exception as e:
        logger.error(f"خطأ في تحميل اللغة: {str(e)}")
        return {}

# Middleware للغة (محدث)
@app.middleware("http")
async def language_middleware(request: Request, call_next):
    try:
        lang_header = request.headers.get("Accept-Language", "en")
        request.state.lang = load_language(lang_header)
        response = await call_next(request)
        return response
    except Exception as e:
        logger.error(f"خطأ في middleware اللغة: {str(e)}")
        request.state.lang = {}
        return await call_next(request)

# نماذج البيانات (تبقى كما هي)
class StrongPasswordRequest(BaseModel):
    length: int = 8
    uppercase: bool = True
    numbers: bool = True
    symbols: bool = True

class MemorablePasswordRequest(BaseModel):
    num_words: Optional[int] = 3
    separator: Optional[str] = "-"

class PinRequest(BaseModel):
    length: Optional[int] = 4

class CustomPasswordRequest(BaseModel):
    characters: str
    length: int

# نقاط النهاية (تبقى كما هي مع تعديلات طفيفة)
@app.get("/")
async def serve_home(request: Request):
    index_path = FRONTEND_DIR / "index.html"
    if not index_path.exists():
        logger.error("ملف index.html غير موجود")
        return JSONResponse(
            {"error": request.state.lang.get("error", "File not found")},
            status_code=404
        )
    return FileResponse(index_path)

@app.post("/generate/strong")
async def generate_strong(request: StrongPasswordRequest):
    try:
        password = generate_secure_password(
            length=request.length,
            uppercase=request.uppercase,
            numbers=request.numbers,
            symbols=request.symbols
        )
        logger.info("تم توليد كلمة مرور قوية")
        return JSONResponse({
            "password": password,
            "status": "success",
            "message": request.state.lang.get("password_generated", "Strong password generated")
        })
    except Exception as e:
        logger.error(f"خطأ في التوليد: {str(e)}")
        return JSONResponse(
            {"error": str(e), "status": "error"},
            status_code=400
        )

@app.post("/generate/memorable")
async def generate_memorable(request: MemorablePasswordRequest):
    try:
        password = generate_memorable_password(
            num_words=request.num_words,
            separator=request.separator
        )
        logger.info("تم توليد كلمة مرور سهلة التذكر")
        return JSONResponse({
            "password": password,
            "status": "success",
            "message": request.state.lang.get("password_generated", "Memorable password generated")
        })
    except Exception as e:
        logger.error(f"خطأ في التوليد: {str(e)}")
        return JSONResponse(
            {"error": str(e), "status": "error"},
            status_code=400
        )

@app.post("/generate/pin")
async def generate_pin_code(request: PinRequest):
    try:
        if request.length not in [4, 6, 8]:
            raise ValueError("يجب أن يكون طول الرمز 4 او 6 او 8 ارقام")
        
        pin = generate_pin(length=request.length)
        logger.info("تم توليد PIN")
        return JSONResponse({
            "password": pin,
            "status": "success",
            "message": request.state.lang.get("pin_generated", "PIN generated successfully")
        })
    except Exception as e:
        logger.error(f"خطأ في التوليد: {str(e)}")
        return JSONResponse(
            {"error": str(e), "status": "error"},
            status_code=400
        )

@app.post("/generate/custom")
async def generate_custom(request: CustomPasswordRequest):
    try:
        if len(request.characters) < 4:
            raise ValueError("يجب إدخال 4 أحرف على الأقل")
        
        password = generate_custom_password(
            characters=request.characters,
            length=request.length
        )
        logger.info("تم توليد كلمة مرور مخصصة")
        return JSONResponse({
            "password": password,
            "status": "success",
            "message": request.state.lang.get("custom_password_generated", "Custom password generated")
        })
    except Exception as e:
        logger.error(f"خطأ في التوليد: {str(e)}")
        return JSONResponse(
            {"error": str(e), "status": "error"},
            status_code=400
        )

@app.get("/check-files")
async def check_files():
    return {
        "frontend_dir": str(FRONTEND_DIR),
        "lang_dir_exists": LANG_DIR.exists(),
        "ar_file_exists": (LANG_DIR / "ar.json").exists(),
        "en_file_exists": (LANG_DIR / "en.json").exists(),
        "cwd": os.getcwd(),
        "available_languages": ["en", "ar"]
    }

# فحص المسارات عند التشغيل
if __name__ == "__main__":
    print("\n=== مسارات الملفات ===")
    print(f"دليل الجذر: {BASE_DIR}")
    print(f"يوجد مجلد frontend: {FRONTEND_DIR.exists()}")
    print(f"يوجد ملف index.html: {(FRONTEND_DIR/'index.html').exists()}")
    print(f"يوجد مجلد static: {(FRONTEND_DIR/'static').exists()}")
    print(f"يوجد مجلد assets: {ASSETS_DIR.exists()}")
    print(f"يوجد مجلد lang: {LANG_DIR.exists()}")
    print(f"يوجد ملف ar.json: {(LANG_DIR/'ar.json').exists()}")
    print(f"يوجد ملف en.json: {(LANG_DIR/'en.json').exists()}")