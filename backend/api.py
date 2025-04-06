from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import Optional
from pathlib import Path
import os
import logging

# إعداد التسجيل
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

# إعداد CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# المسارات الصحيحة
BASE_DIR = Path(__file__).parent.parent  # المجلد الجذر للمشروع
FRONTEND_DIR = BASE_DIR / "frontend"

# خدمة الملفات الثابتة (CSS, JS, الصور)
app.mount("/static", StaticFiles(directory=FRONTEND_DIR / "static"), name="static")
app.mount("/assets", StaticFiles(directory=FRONTEND_DIR / "assets"), name="assets")


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

# نقاط النهاية
@app.get("/")
async def serve_home():
    index_path = FRONTEND_DIR / "index.html"
    if not index_path.exists():
        logger.error("ملف index.html غير موجود")
        raise HTTPException(status_code=404, detail="الصفحة غير متوفرة")
    return FileResponse(index_path)

@app.post("/generate/strong")
async def generate_strong(request: StrongPasswordRequest):
    try:
        password = generate_strong_password(
            length=request.length,
            uppercase=request.uppercase,
            numbers=request.numbers,
            symbols=request.symbols
        )
        logger.info(f"تم توليد كلمة مرور قوية: {password[:2]}...")
        return {"password": password}
    except Exception as e:
        logger.error(f"خطأ في توليد كلمة مرور قوية: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/generate/memorable")
async def generate_memorable(request: MemorablePasswordRequest):
    try:
        password = generate_memorable_password(
            num_words=request.num_words,
            separator=request.separator
        )
        logger.info(f"تم توليد كلمة مرور سهلة التذكر")
        return {"password": password}
    except Exception as e:
        logger.error(f"خطأ في توليد كلمة مرور سهلة: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/generate/pin")
async def generate_pin_code(request: PinRequest):
    try:
        if request.length not in [4, 6]:
            raise ValueError("يجب أن يكون طول PIN 4 أو 6 أرقام")
        pin = generate_pin(length=request.length)
        logger.info(f"تم توليد PIN: {pin[:2]}...")
        return {"password": pin}
    except Exception as e:
        logger.error(f"خطأ في توليد PIN: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

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
        return {"password": password}
    except Exception as e:
        logger.error(f"خطأ في توليد كلمة مرور مخصصة: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))