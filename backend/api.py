import os
import re
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

app = FastAPI(title="Password Generator API", version="1.2.0")

# إعداد CORS الآمن
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # للتطوير فقط - حدد النطاقات في الإنتاج
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Language"]
)

# المسارات الصحيحة
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

class PasswordStrengthRequest(BaseModel):
    password: str

class PasswordStrengthResponse(BaseModel):
    score: int
    strength: str  # weak, medium, strong
    suggestions: list[str]

# Middleware للغة
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

# نقاط النهاية الرئيسية
@app.post("/api/generate/strong")
async def api_generate_strong(request_data: StrongPasswordRequest, request: Request):
    try:
        if not (4 <= request_data.length <= 64):
            raise HTTPException(
                status_code=400,
                detail=request.state.translations.get("lengthError", "Invalid length (4-64 characters)")
            )
        
        password = generate_secure_password(
            length=request_data.length,
            uppercase=request_data.uppercase,
            numbers=request_data.numbers,
            symbols=request_data.symbols
        )
        
        return {
            "password": password,
            "message": request.state.translations.get("success", "Password generated successfully")
        }
    
    except Exception as e:
        logger.error(f"Strong password generation error: {str(e)}")
        raise HTTPException(
            status_code=400,
            detail=request.state.translations.get("error", "Error generating password")
        )

@app.post("/api/generate/memorable")
async def api_generate_memorable(request_data: MemorablePasswordRequest, request: Request):
    try:
        password = generate_memorable_password(
            num_words=request_data.num_words,
            separator=request_data.separator
        )
        return {
            "password": password,
            "message": request.state.translations.get("success", "Memorable password generated")
        }
    except Exception as e:
        logger.error(f"Memorable password error: {str(e)}")
        raise HTTPException(
            status_code=400,
            detail=request.state.translations.get("error", "Error generating memorable password")
        )

@app.post("/api/generate/pin")
async def api_generate_pin(request_data: PinRequest, request: Request):
    try:
        if request_data.length not in [4, 6, 8]:
            raise HTTPException(
                status_code=400,
                detail=request.state.translations.get("lengthError", "PIN length must be 4, 6 or 8 digits")
            )
        
        pin = generate_pin(length=request_data.length)
        return {
            "password": pin,
            "message": request.state.translations.get("success", "PIN generated successfully")
        }
    except Exception as e:
        logger.error(f"PIN generation error: {str(e)}")
        raise HTTPException(
            status_code=400,
            detail=request.state.translations.get("error", "Error generating PIN")
        )

@app.post("/api/generate/custom")
async def api_generate_custom(request_data: CustomPasswordRequest, request: Request):
    try:
        if len(request_data.characters) < 4:
            raise HTTPException(
                status_code=400,
                detail=request.state.translations.get("lengthError", "At least 4 characters required")
            )
        
        password = generate_custom_password(
            characters=request_data.characters,
            length=request_data.length
        )
        return {
            "password": password,
            "message": request.state.translations.get("success", "Custom password generated")
        }
    except Exception as e:
        logger.error(f"Custom password error: {str(e)}")
        raise HTTPException(
            status_code=400,
            detail=request.state.translations.get("error", "Error generating custom password")
        )

@app.post("/api/analyze-strength", response_model=PasswordStrengthResponse)
async def api_analyze_strength(request_data: PasswordStrengthRequest, request: Request):
    """
    تحليل قوة كلمة المرور وإرجاع النتائج مع اقتراحات التحسين
    """
    try:
        password = request_data.password
        
        # 1. التحقق من طول كلمة المرور
        suggestions = []
        score = 0
        
        # الطول
        if len(password) < 5:
            score += 1
            suggestions.append(request.state.translations.get(
                "password_strength_suggestion_length_short",
                "Use at least 8 characters"
            ))
        elif len(password) < 8:
            score += 2
            suggestions.append(request.state.translations.get(
                "password_strength_suggestion_length_medium",
                "Consider using 12+ characters for better security"
            ))
        elif len(password) < 12:
            score += 3
        else:
            score += 4

        # 2. التحقق من وجود أحرف كبيرة وصغيرة
        has_lower = any(c.islower() for c in password)
        has_upper = any(c.isupper() for c in password)
        if has_lower and has_upper:
            score += 1
        else:
            suggestions.append(request.state.translations.get(
                "password_strength_suggestion_case",
                "Mix uppercase and lowercase letters"
            ))

        # 3. التحقق من وجود أرقام
        has_digit = any(c.isdigit() for c in password)
        if has_digit:
            score += 1
        else:
            suggestions.append(request.state.translations.get(
                "password_strength_suggestion_numbers",
                "Add numbers to increase complexity"
            ))

        # 4. التحقق من وجود رموز خاصة
        has_special = bool(re.search(r'[^a-zA-Z0-9]', password))
        if has_special:
            score += 1
        else:
            suggestions.append(request.state.translations.get(
                "password_strength_suggestion_special",
                "Add special characters (!@#$%)"
            ))

        # تحديد مستوى القوة
        if score < 3:
            strength = "weak"
        elif score < 5:
            strength = "medium"
        else:
            strength = "strong"

        return {
            "score": score,
            "strength": strength,
            "suggestions": suggestions
        }

    except Exception as e:
        logger.error(f"Password strength analysis error: {str(e)}")
        raise HTTPException(
            status_code=400,
            detail=request.state.translations.get(
                "password_strength_error",
                "Error analyzing password strength"
            )
        )
    
# نقاط نهاية الخدمة
@app.get("/api/lang/{lang}.json")
async def api_get_translations(lang: str):
    lang_file = LANG_DIR / f"{lang}.json"
    if not lang_file.exists():
        lang_file = LANG_DIR / "en.json"
    return FileResponse(lang_file)

@app.get("/api/health")
async def api_health_check():
    return {"status": "healthy", "version": "1.2.0"}

@app.get("/api/check-connection")
async def api_check_connection():
    return {"status": "connected", "service": "Password Generator API"}

# نقطة النهاية للواجهة الأمامية
@app.get("/", include_in_schema=False)
async def serve_frontend():
    index_path = BASE_DIR / "frontend" / "index.html"
    if not index_path.exists():
        raise HTTPException(status_code=404, detail="Frontend not found")
    return FileResponse(index_path)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", 8000)))