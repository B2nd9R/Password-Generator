# طريقة التنصيب

## المتطلبات

قبل أن تبدأ، تأكد من أنك قد قمت بتثبيت الأدوات التالية:

- Python 3.7 أو أعلى
- pip
- Node.js (لإدارة الحزم الخاصة بالواجهة الأمامية)

## خطوات التنصيب

### 1. استنساخ المستودع
```bash
git clone https://github.com/B2nd9R/password-generator.git
cd password-generator
```

### 2. تثبيت المتطلبات الخاصة بالخلفية (Backend)
```bash
cd backend
pip install -r requirements.txt
```

### 3. تثبيت المتطلبات الخاصة بالواجهة الأمامية (Frontend)
```bash
cd frontend
npm install
```

### 4. تشغيل المشروع
#### تشغيل الخادم الخلفي (Backend):
```bash
cd backend
uvicorn api:app --reload
```

#### تشغيل الواجهة الأمامية (Frontend):
```bash
cd frontend
npm start
```
الواجهة الأمامية ستكون متاحة على http://localhost:3000 والخادم الخلفي على http://localhost:8000.

ملاحظة: تأكد من أن كل من الواجهة الأمامية والخلفية تعمل بشكل صحيح عبر المتصفحات المختلفة.