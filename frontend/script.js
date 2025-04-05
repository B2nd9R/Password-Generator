// العناصر الأساسية في واجهة المستخدم
const elements = {
  typeSelector: document.getElementById('type'), // اختيار نوع كلمة المرور
  customOptions: document.getElementById('custom-options'), // خيارات التخصيص
  pinOptions: document.getElementById('pin-options'), // خيارات الـ PIN
  themeToggleBtn: document.getElementById('theme-toggle'), // زر تبديل الثيم
  generateBtn: document.getElementById('generate'), // زر التوليد
  copyBtn: document.getElementById('copy'), // زر النسخ
  passwordField: document.getElementById('password'), // حقل عرض كلمة المرور
  pinLengthInput: document.getElementById('pin-length'), // إدخال طول الـ PIN
  lengthInput: document.getElementById('length'), // إدخال الطول العام
  uppercaseCheckbox: document.getElementById('uppercase'), // خيار الأحرف الكبيرة
  numbersCheckbox: document.getElementById('numbers'), // خيار الأرقام
  symbolsCheckbox: document.getElementById('symbols'), // خيار الرموز
  customCharsInput: document.getElementById('custom-chars'), // إدخال الأحرف المخصصة
  customCharsContainer: document.getElementById('custom-chars-container') // حاوية الأحرف المخصصة
};

// عرض رسائل للمستخدم
function showMessage(text, isError = false) {
  const msg = document.createElement('div');
  msg.className = `message ${isError ? 'error' : 'success'}`;
  msg.textContent = text;
  document.body.appendChild(msg);
  setTimeout(() => msg.remove(), 2000);
}

// تبديل حالة الأزرار
function setButtonState(button, disabled, text) {
  button.disabled = disabled;
  if (text) button.textContent = text;
}

// التحقق من صحة الإدخال
function validateInput(value, min, max) {
  const num = parseInt(value);
  return !isNaN(num) && num >= min && num <= max;
}

// توليد كلمة المرور عبر API
async function generatePassword(type, options) {
  let endpoint = '';
  let body = {};

  switch (type) {
    case 'custom':
      if (!options.characters) {
        showMessage('الرجاء إدخال الأحرف المطلوبة', true);
        return null;
      }
      endpoint = '/generate/custom';
      body = { characters: options.characters, length: options.length };
      break;

    case 'strong':
      endpoint = '/generate/strong';
      body = { 
        length: options.length, 
        uppercase: options.uppercase, 
        numbers: options.numbers, 
        symbols: options.symbols 
      };
      break;

    case 'memorable':
      endpoint = '/generate/memorable';
      body = { num_words: 3, separator: '-' };
      break;

    case 'pin_generator':
      endpoint = '/generate/pin';
      body = { length: options.pinLength || 4 };
      break;

    default:
      showMessage('نوع كلمة المرور غير صحيح', true);
      return null;
  }

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'حدث خطأ في الخادم');
    }

    return await response.json();
  } catch (error) {
    console.error("Error generating password:", error);
    showMessage(error.message, true);
    return null;
  }
}

// إدارة الثيمات (الوضع الفاتح/الداكن)
const themeService = {
  toggle: () => {
    document.body.classList.toggle('dark-theme');
    document.body.classList.toggle('light-theme');
    const currentTheme = document.body.classList.contains('dark-theme') ? 'dark-theme' : 'light-theme';
    localStorage.setItem('theme', currentTheme);
    return currentTheme;
  },

  load: () => {
    const savedTheme = localStorage.getItem('theme') || 'light-theme';
    document.body.classList.add(savedTheme);
    return savedTheme;
  }
};

// معالجة تغيير نوع كلمة المرور
function handleTypeChange() {
  const selectedType = elements.typeSelector.value;
  elements.customOptions.style.display = ['custom', 'strong'].includes(selectedType) ? 'block' : 'none';
  elements.pinOptions.style.display = selectedType === 'pin_generator' ? 'block' : 'none';
  elements.customCharsContainer.style.display = selectedType === 'custom' ? 'block' : 'none';
}

// معالجة النقر على زر التوليد
async function handleGenerateClick() {
  const type = elements.typeSelector.value;
  const length = parseInt(elements.lengthInput.value);
  
  if (!validateInput(length, 4, 64) && type !== 'memorable') {
    showMessage('الطول يجب أن يكون بين 4 و64 حرفاً', true);
    return;
  }

  const options = {
    length,
    uppercase: elements.uppercaseCheckbox.checked,
    numbers: elements.numbersCheckbox.checked,
    symbols: elements.symbolsCheckbox.checked,
    pinLength: parseInt(elements.pinLengthInput.value),
    characters: elements.customCharsInput.value
  };

  setButtonState(elements.generateBtn, true, 'جاري التوليد...');

  const result = await generatePassword(type, options);
  if (result) {
    elements.passwordField.value = result.password;
  }

  setButtonState(elements.generateBtn, false, 'توليد');
}

// معالجة النقر على زر النسخ
async function handleCopyClick() {
  if (!elements.passwordField.value) {
    showMessage('لا يوجد كلمة مرور لنسخها', true);
    return;
  }
  
  try {
    await navigator.clipboard.writeText(elements.passwordField.value);
    showMessage('تم النسخ بنجاح!');
  } catch (err) {
    showMessage('فشل النسخ!', true);
  }
}

// تهيئة التطبيق
function init() {
  // إعداد معالج الأحداث
  elements.typeSelector.addEventListener('change', handleTypeChange);
  elements.generateBtn.addEventListener('click', handleGenerateClick);
  elements.copyBtn.addEventListener('click', handleCopyClick);
  elements.themeToggleBtn.addEventListener('click', themeService.toggle);

  // تحميل الثيم المحفوظ
  themeService.load();

  // عرض الخيارات المناسبة حسب النوع الافتراضي
  handleTypeChange();
}

// بدء تشغيل التطبيق عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', init);