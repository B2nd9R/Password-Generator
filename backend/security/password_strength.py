import re
from typing import Dict, Literal, TypedDict

class PasswordStrengthResult(TypedDict):
    score: int
    strength: Literal['weak', 'medium', 'strong']
    suggestions: list[str]

def analyze_password_strength(password: str) -> PasswordStrengthResult:
    score = 0
    suggestions = []
    
    # طول كلمة المرور
    length = len(password)
    if length == 0:
        return {'score': 0, 'strength': 'weak', 'suggestions': ['Password cannot be empty']}
    elif length < 5:
        score += 1
        suggestions.append('Use a longer password (at least 8 characters)')
    elif length < 8:
        score += 2
        suggestions.append('Consider using a longer password (12+ characters)')
    elif length < 12:
        score += 3
    else:
        score += 4
    
    # وجود أحرف كبيرة وصغيرة
    has_lower = any(c.islower() for c in password)
    has_upper = any(c.isupper() for c in password)
    if has_lower and has_upper:
        score += 1
    else:
        suggestions.append('Mix uppercase and lowercase letters')
    
    # وجود أرقام
    has_digit = any(c.isdigit() for c in password)
    if has_digit:
        score += 1
    else:
        suggestions.append('Add numbers to your password')
    
    # وجود رموز خاصة
    has_special = bool(re.search(r'[^a-zA-Z0-9]', password))
    if has_special:
        score += 1
    else:
        suggestions.append('Consider adding special characters (e.g., !@#$%)')
    
    # تحديد القوة
    if score < 3:
        strength = 'weak'
    elif score < 5:
        strength = 'medium'
    else:
        strength = 'strong'
    
    return {
        'score': score,
        'strength': strength,
        'suggestions': suggestions
    }