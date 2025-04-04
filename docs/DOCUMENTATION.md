# 📚 وثائق المشروع

## المميزات الرئيسية
- توليد كلمات مرور عشوائية آمنة
- دعم تخصيص معايير كلمة المرور
- واجهة مستخدم متجاوبة
- نسخ سهل بكبسة زر

## API التوثيق
```json
POST /generate-password
{
  "length": 12,
  "uppercase": true,
  "numbers": true,
  "symbols": true
}
```

### المتطلبات التقنية:

- Python 3.7+
- FastAPI
- Uvicorn
- أي متصفح ويب حديث