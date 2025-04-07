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


# تحميل ملفات اللغة
def load_language(lang_code):
    try:
        with open(LANG_DIR / f"{lang_code}.json", "r", encoding="utf-8") as file:
            return json.load(file)
    except FileNotFoundError:
        logger.error(f"ملف اللغة {lang_code}.json غير موجود")
        return {}

# نماذج البيانات
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

# النقطة الوسطى للتحقق من اللغة
@app.middleware("http")
async def add_language(request: Request, call_next):
    lang_code = request.headers.get("Accept-Language", "en")  # افتراض اللغة الإنجليزية
    request.state.lang = load_language(lang_code)
    response = await call_next(request)
    return response

# نقاط النهاية
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
        logger.info(f"تم توليد كلمة مرور قوية")
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
        logger.info(f"تم توليد كلمة مرور سهلة التذكر")
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
        logger.info(f"تم توليد PIN")
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
        logger.info(f"تم توليد كلمة مرور مخصصة")
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

@app.middleware("http")
async def add_language(request: Request, call_next):
    lang_header = request.headers.get("Accept-Language", "en")
    request.state.lang = load_language(lang_header)
    response = await call_next(request)
    return response

@app.get("/check-files")
async def check_files():
    return {
        "frontend_dir": str(FRONTEND_DIR),
        "lang_dir_exists": LANG_DIR.exists(),
        "ar_file_exists": (LANG_DIR / "ar.json").exists(),
        "en_file_exists": (LANG_DIR / "en.json").exists(),
        "cwd": os.getcwd()
    }

print("\n=== مسارات الملفات ===")
print(f"دليل الجذر: {BASE_DIR}")
print(f"يوجد مجلد frontend: {FRONTEND_DIR.exists()}")
print(f"يوجد ملف index.html: {(FRONTEND_DIR/'index.html').exists()}")
print(f"يوجد مجلد static: {(FRONTEND_DIR/'static').exists()}")
print(f"يوجد مجلد assets: {ASSETS_DIR.exists()}")
print(f"يوجد مجلد lang: {LANG_DIR.exists()}")