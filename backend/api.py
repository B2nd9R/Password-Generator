from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from fastapi.staticfiles import StaticFiles
from pathlib import Path
from fastapi.responses import FileResponse
from fastapi.exceptions import HTTPException
import os

# استيراد الدوال من مولدات كلمات المرور
from backend.generators.strong import generate_secure_password
from backend.generators.memorable import generate_memorable_password
from backend.generators.pin_generator import generate_pin
from backend.generators.custom import generate_custom_password

app = FastAPI()

# إعداد CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ======= خدمة الملفات الثابتة (CSS, JS, etc.) =======
app.mount("/static", StaticFiles(directory="frontend"), name="static")

# مسار الصفحة الرئيسية
@app.get("/")
async def serve_homepage():
    # المسار الكامل لملف index.html
    frontend_path = Path(__file__).parent.parent / "frontend" / "index.html"
    
    # التحقق من وجود الملف
    if not frontend_path.exists():
        raise HTTPException(status_code=404, detail="الصفحة الرئيسية غير متوفرة")
    
    return FileResponse(frontend_path)

# ====== نماذج الطلبات ======

class StrongPasswordRequest(BaseModel):
    length: int
    uppercase: bool
    numbers: bool
    symbols: bool

class MemorablePasswordRequest(BaseModel):
    num_words: Optional[int] = 3
    separator: Optional[str] = "-"

class PinRequest(BaseModel):
    length: Optional[int] = 4

class CustomPasswordRequest(BaseModel):
    characters: str
    length: int

# ====== نقاط النهاية ======

# إعداد مسار الملفات الثابتة
frontend_dir = os.path.join(os.path.dirname(__file__), "..", "frontend")

app.mount("/", StaticFiles(directory=frontend_dir, html=True), name="frontend")

@app.post("/generate/strong")
def generate_strong(request: StrongPasswordRequest):
    password = generate_secure_password(
        length=request.length,
        uppercase=request.uppercase,
        numbers=request.numbers,
        symbols=request.symbols
    )
    return {"password": password}

@app.post("/generate/memorable")
def generate_memorable(request: MemorablePasswordRequest):
    password = generate_memorable_password(
        num_words=request.num_words,
        separator=request.separator
    )
    return {"password": password}

@app.post("/generate/pin")
def generate_pin_code(request: PinRequest):
    if request.length not in [4, 6]:
        return {"error": "Pin length must be 4 or 6"}
    pin = generate_pin(length=request.length)
    return {"password": pin}

@app.post("/generate/custom")
def generate_custom(request: CustomPasswordRequest):
    password = generate_custom_password(
        characters=request.characters,
        length=request.length
    )
    return {"password": password}