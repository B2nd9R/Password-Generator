from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional

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