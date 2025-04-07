import os
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel
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

app = FastAPI(title="Password Generator API", version="1.1.0")

# إعداد CORS الآمن
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://password-generator-vm7k.onrender.com",
        "http://localhost:8000",
        "http://localhost:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# المسارات الصحيحة للاستضافة على Render
BASE_DIR = Path(__file__).parent.parent
STATIC_DIR = BASE_DIR / "frontend" / "static"
LANG_DIR = BASE_DIR / "frontend" / "lang"
ASSETS_DIR = BASE_DIR / "frontend" / "assets"

# خدمة الملفات الثابتة
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")
app.mount("/lang", StaticFiles(directory=LANG_DIR), name="lang")
app.mount("/assets", StaticFiles(directory=ASSETS_DIR), name="assets")

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

# Middleware للغة المحسّن
@app.middleware("http")
async def language_middleware(request: Request, call_next):
    try:
        lang_code = request.headers.get("Accept-Language", "en")[:2]
        lang_file = LANG_DIR / f"{lang_code}.json"
        
        if lang_file.exists():
            with open(lang_file, "r", encoding="utf-8") as f:
                translations = json.load(f)
        else:
            with open(LANG_DIR / "en.json", "r", encoding="utf-8") as f:
                translations = json.load(f)
        
        request.state.translations = translations
        response = await call_next(request)
        response.headers["Content-Language"] = lang_code
        return response
    except Exception as e:
        logger.error(f"Language middleware error: {str(e)}")
        return JSONResponse(
            {"error": "Language configuration error"},
            status_code=500
        )

# نقاط النهاية المحسنة
@app.post("/generate/strong")
async def generate_strong(request_data: StrongPasswordRequest, request: Request):
    try:
        if not (4 <= request_data.length <= 64):
            raise HTTPException(status_code=400, detail=request.state.translations.get("lengthError", "Invalid length"))
        
        password = generate_secure_password(
            length=request_data.length,
            uppercase=request_data.uppercase,
            numbers=request_data.numbers,
            symbols=request_data.symbols
        )
        
        return JSONResponse({
            "password": password,
            "message": request.state.translations.get("success", "Password generated")
        })
    
    except Exception as e:
        logger.error(f"Error: {str(e)}")
        return JSONResponse(
            {"error": request.state.translations.get("error", "Operation failed")},
            status_code=400
        )

# نقاط النهاية الأخرى بنفس النمط...

@app.get("/", include_in_schema=False)
async def serve_frontend():
    index_path = BASE_DIR / "frontend" / "index.html"
    if not index_path.exists():
        raise HTTPException(status_code=404, detail="Frontend not found")
    return FileResponse(index_path)

@app.get("/health")
async def health_check():
    return {"status": "healthy", "version": "1.1.2"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", 8000)))