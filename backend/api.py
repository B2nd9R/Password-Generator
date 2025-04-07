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

app = FastAPI(title="Password Generator API", version="1.0.0")

# إعداد CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8000",
        "http://localhost:3000",
        "https://password-generator-vm7k.onrender.com",
        "*"  # للتنمية فقط - يجب تقييده في الإنتاج
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

# إنشاء المجلدات إذا لم تكن موجودة
for directory in [STATIC_DIR, ASSETS_DIR, LANG_DIR]:
    directory.mkdir(parents=True, exist_ok=True)

# خدمة الملفات الثابتة
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")
app.mount("/assets", StaticFiles(directory=ASSETS_DIR), name="assets")
app.mount("/lang", StaticFiles(directory=LANG_DIR), name="lang")

# نماذج البيانات
class StrongPasswordRequest(BaseModel):
    length: int = 12
    uppercase: bool = True
    numbers: bool = True
    symbols: bool = True

class MemorablePasswordRequest(BaseModel):
    num_words: int = 3
    separator: str = "-"

class PinRequest(BaseModel):
    length: int = 4

class CustomPasswordRequest(BaseModel):
    characters: str
    length: int

# Middleware للغة
@app.middleware("http")
async def language_middleware(request: Request, call_next):
    try:
        lang_header = request.headers.get("Accept-Language", "en")
        lang_code = lang_header.split(',')[0].split(';')[0].strip().lower()[:2]
        request.state.lang = load_language(lang_code)
        response = await call_next(request)
        response.headers["Content-Language"] = lang_code
        return response
    except Exception as e:
        logger.error(f"Language middleware error: {str(e)}")
        request.state.lang = {}
        return await call_next(request)

def load_language(lang_code: str) -> dict:
    """تحميل ملفات اللغة مع التعامل مع الأخطاء"""
    try:
        lang_code = lang_code[:2]  # أخذ أول حرفين فقط
        lang_file = LANG_DIR / f"{lang_code}.json"
        
        if not lang_file.exists():
            logger.warning(f"Language file {lang_code}.json not found, trying English")
            lang_file = LANG_DIR / "en.json"
        
        with open(lang_file, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        logger.error(f"Error loading language {lang_code}: {str(e)}")
        return {}

# نقاط النهاية
@app.get("/", include_in_schema=False)
async def serve_home(request: Request):
    index_path = FRONTEND_DIR / "index.html"
    if not index_path.exists():
        raise HTTPException(status_code=404, detail="Home page not found")
    return FileResponse(index_path)

@app.post("/generate/strong", response_model=dict)
async def generate_strong(request: StrongPasswordRequest, lang_request: Request):
    try:
        validate_password_length(request.length)
        password = generate_secure_password(
            length=request.length,
            uppercase=request.uppercase,
            numbers=request.numbers,
            symbols=request.symbols
        )
        return {
            "password": password,
            "status": "success",
            "message": lang_request.state.lang.get("password_generated", "Password generated")
        }
    except Exception as e:
        logger.error(f"Strong password error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

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

@app.get("/health")
async def health_check():
    return {"status": "healthy", "services": ["generator", "translations"]}

@app.get("/check-files")
async def check_files():
    return {
        "frontend": FRONTEND_DIR.exists(),
        "static": STATIC_DIR.exists(),
        "lang": LANG_DIR.exists(),
        "ar_file": (LANG_DIR / "ar.json").exists(),
        "en_file": (LANG_DIR / "en.json").exists()
    }

def validate_password_length(length: int, min_len: int = 4, max_len: int = 64):
    if not (min_len <= length <= max_len):
        raise HTTPException(
            status_code=400,
            detail=f"Password length must be between {min_len} and {max_len}"
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api:app", host="0.0.0.0", port=8000, reload=True)