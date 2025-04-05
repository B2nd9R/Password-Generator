// العناصر
const elements = {
  typeSelector: document.getElementById('type'),
  generateBtn: document.getElementById('generate'),
  copyBtn: document.getElementById('copy'),
  passwordField: document.getElementById('password'),
  lengthInput: document.getElementById('length'),
  uppercaseCheckbox: document.getElementById('uppercase'),
  numbersCheckbox: document.getElementById('numbers'),
  symbolsCheckbox: document.getElementById('symbols'),
  pinLengthSelect: document.getElementById('pin-length'),
  customCharsInput: document.getElementById('custom-chars'),
  customOptions: document.getElementById('custom-options'),
  pinOptions: document.getElementById('pin-options'),
  themeToggle: document.getElementById('theme-toggle'),
  loadingIndicator: document.getElementById('loading')
};

// حالات التطبيق
const state = {
  isLoading: false,
  currentTheme: localStorage.getItem('theme') || 'light'
};

// وظائف المساعدة
const helpers = {
  showToast: (message, isError = false) => {
    const toast = document.createElement('div');
    toast.className = `toast ${isError ? 'error' : 'success'}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  },

  setLoading: (isLoading) => {
    state.isLoading = isLoading;
    elements.generateBtn.disabled = isLoading;
    elements.loadingIndicator.style.display = isLoading ? 'block' : 'none';
    elements.generateBtn.textContent = isLoading ? 'جاري التوليد...' : 'توليد';
  },

  validateInput: (value, min, max) => {
    const num = parseInt(value);
    return !isNaN(num) && num >= min && num <= max;
  }
};

// معالجات الأحداث
const handlers = {
  handleTypeChange: () => {
    const type = elements.typeSelector.value;
    elements.customOptions.style.display = ['custom', 'strong'].includes(type) ? 'block' : 'none';
    elements.pinOptions.style.display = type === 'pin' ? 'block' : 'none';
  },

  handleGenerate: async () => {
    if (state.isLoading) return;
    
    const type = elements.typeSelector.value;
    const length = parseInt(elements.lengthInput.value);
    
    if (!helpers.validateInput(length, 4, 64) && type !== 'memorable') {
      helpers.showToast('الطول يجب أن يكون بين 4 و64', true);
      return;
    }

    helpers.setLoading(true);
    
    try {
      let endpoint, body;
      
      switch (type) {
        case 'strong':
          endpoint = '/generate/strong';
          body = {
            length,
            uppercase: elements.uppercaseCheckbox.checked,
            numbers: elements.numbersCheckbox.checked,
            symbols: elements.symbolsCheckbox.checked
          };
          break;
          
        case 'memorable':
          endpoint = '/generate/memorable';
          body = { num_words: 3, separator: '-' };
          break;
          
        case 'pin':
          endpoint = '/generate/pin';
          body = { length: parseInt(elements.pinLengthSelect.value) };
          break;
          
        case 'custom':
          endpoint = '/generate/custom';
          body = {
            characters: elements.customCharsInput.value,
            length
          };
          break;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'حدث خطأ في الخادم');
      }

      const data = await response.json();
      elements.passwordField.value = data.password;
      helpers.showToast('تم توليد كلمة المرور بنجاح');
      
    } catch (error) {
      helpers.showToast(error.message, true);
      console.error('Generation error:', error);
    } finally {
      helpers.setLoading(false);
    }
  },

  handleCopy: async () => {
    if (!elements.passwordField.value) {
      helpers.showToast('لا يوجد كلمة مرور لنسخها', true);
      return;
    }
    
    try {
      await navigator.clipboard.writeText(elements.passwordField.value);
      helpers.showToast('تم النسخ بنجاح');
    } catch (error) {
      helpers.showToast('فشل النسخ', true);
    }
  },

  handleThemeToggle: () => {
    state.currentTheme = state.currentTheme === 'light' ? 'dark' : 'light';
    document.body.className = state.currentTheme;
    localStorage.setItem('theme', state.currentTheme);
  }
};

// تهيئة التطبيق
function init() {
  // تعيين الثيم المبدئي
  document.body.className = state.currentTheme;
  
  // ربط الأحداث
  elements.typeSelector.addEventListener('change', handlers.handleTypeChange);
  elements.generateBtn.addEventListener('click', handlers.handleGenerate);
  elements.copyBtn.addEventListener('click', handlers.handleCopy);
  elements.themeToggle.addEventListener('click', handlers.handleThemeToggle);
  
  // عرض الخيارات المناسبة للنوع المختار
  handlers.handleTypeChange();
}

// بدء التشغيل عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', init);