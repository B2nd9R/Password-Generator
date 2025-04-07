import logging
import sys
from pathlib import Path
from logging.handlers import RotatingFileHandler
from datetime import datetime

# إنشاء مجلد السجلات إذا لم يكن موجوداً
LOG_DIR = Path(__file__).parent.parent / "logs"
LOG_DIR.mkdir(exist_ok=True)

# تنسيق السجلات
LOG_FORMAT = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
DATE_FORMAT = "%Y-%m-%d %H:%M:%S"

# تهيئة اللوغر الأساسية
def setup_logger(name: str = "PasswordGenerator"):
    # إنشاء اللوغر
    logger = logging.getLogger(name)
    logger.setLevel(logging.DEBUG)
    
    # منع التكرار عند الاستيراد
    if logger.hasHandlers():
        return logger

    # تنسيق الرسائل
    formatter = logging.Formatter(LOG_FORMAT, datefmt=DATE_FORMAT)

    # معالج ملف السجلات الدورية
    file_handler = RotatingFileHandler(
        filename=LOG_DIR / f"{datetime.now().strftime('%Y-%m-%d')}.log",
        maxBytes=5*1024*1024,  # 5MB
        backupCount=7,
        encoding="utf-8"
    )
    file_handler.setFormatter(formatter)
    file_handler.setLevel(logging.INFO)

    # معالج سجلات الكونسول
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(formatter)
    console_handler.setLevel(logging.DEBUG)

    # إضافة المعالجات
    logger.addHandler(file_handler)
    logger.addHandler(console_handler)

    return logger

# تهيئة اللوغر الرئيسي
logger = setup_logger()