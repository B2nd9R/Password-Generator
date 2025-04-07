try {
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
  
    if (!elements.typeSelector || !elements.generateBtn) {
      throw new Error('العناصر الأساسية غير موجودة!');
    }
  
    const state = {
      isLoading: false,
      currentTheme: localStorage.getItem('theme') || 'light'
    };
  
    const helpers = {
      showToast: (message, isError = false) => {
        try {
          const toast = document.createElement('div');
          toast.className = `toast ${isError ? 'error' : 'success'}`;
          toast.textContent = message;
          document.body.appendChild(toast);
          setTimeout(() => toast.remove(), 3000);
        } catch (e) {
          console.error('خطأ في عرض الإشعار:', e);
        }
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
  
    const handlers = {
      handleTypeChange: () => {
        const type = elements.typeSelector.value;
        elements.customOptions.style.display = type === 'custom' ? 'block' : 'none';
        elements.pinOptions.style.display = type === 'pin' ? 'block' : 'none';
        elements.strongOptions.style.display = type === 'strong' ? 'block' : 'none';
      },
  
      handleGenerate: async () => {
        if (state.isLoading) return;
  
        const type = elements.typeSelector.value;
        const length = parseInt(elements.lengthInput.value) || 12;
  
        if (type !== 'memorable' && !helpers.validateInput(length, 4, 64)) {
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
  
            default:
              throw new Error('نوع التوليد غير مدعوم');
          }
  
          const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
          const API_BASE_URL = isLocalhost
            ? "http://127.0.0.1:8000"
            : "https://password-generator-vm7k.onrender.com";
  
          const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
          });
  
          const responseData = await response.json();
  
          if (!response.ok) {
            throw new Error(responseData.error || 'حدث خطأ في الخادم');
          }
  
          elements.passwordField.value = responseData.password;
          helpers.showToast('تم التوليد بنجاح!');
        } catch (error) {
          console.error('Error:', error);
          helpers.showToast(error.message || 'حدث خطأ غير متوقع', true);
        } finally {
          helpers.setLoading(false);
        }
      },
  
      handleCopy: async () => {
        try {
          await navigator.clipboard.writeText(elements.passwordField.value);
          helpers.showToast('تم النسخ بنجاح');
        } catch (error) {
          helpers.showToast('فشل النسخ', true);
        }
      },
  
      handleThemeToggle: () => {
        state.currentTheme = state.currentTheme === 'light' ? 'dark' : 'light';
        document.body.className = state.currentTheme === 'dark' ? 'dark-theme' : '';
        localStorage.setItem('theme', state.currentTheme);
      }
    };
  
    function init() {
      document.body.className = state.currentTheme === 'dark' ? 'dark-theme' : '';
  
      elements.typeSelector.addEventListener('change', handlers.handleTypeChange);
      elements.generateBtn.addEventListener('click', handlers.handleGenerate);
      elements.copyBtn.addEventListener('click', handlers.handleCopy);
      elements.themeToggle.addEventListener('click', handlers.handleThemeToggle);
  
      handlers.handleTypeChange();
    }
  
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  } catch (e) {
    console.error('حدث خطأ فادح:', e);
    alert('حدث خطأ في تحميل التطبيق، يرجى تحديث الصفحة');
  }
  