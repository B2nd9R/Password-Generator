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
    strongOptions: document.getElementById('strong-options'),
    pinLengthSelect: document.getElementById('pin-length'),
    customCharsInput: document.getElementById('custom-chars'),
    customOptions: document.getElementById('custom-options'),
    pinOptions: document.getElementById('pin-options'),
    themeToggle: document.getElementById('theme-toggle'),
    loadingIndicator: document.getElementById('loading'),
    pageTitle: document.getElementById('page-title'),
    title: document.getElementById('title'),
    description: document.getElementById('description'),
    passwordTypeLabel: document.getElementById('password-type-label'),
    customOption: document.getElementById('custom-option'),
    strongOption: document.getElementById('strong-option'),
    memorableOption: document.getElementById('memorable-option'),
    pinOption: document.getElementById('pin-option'),
    passwordLengthLabel: document.getElementById('password-length-label'),
    customCharsLabel: document.getElementById('custom-chars-label'),
    passwordInput: document.getElementById('password'),
    uppercaseLabel: document.getElementById('uppercase-label'),
    numbersLabel: document.getElementById('numbers-label'),
    symbolsLabel: document.getElementById('symbols-label'),
    pinLengthLabel: document.getElementById('pin-length-label'),
    themeIcon: document.getElementById('theme-icon'),
    languageToggle: document.getElementById('language-toggle'),
    langArButton: document.getElementById('language-ar'),
    langEnButton: document.getElementById('language-en')
  };

  if (!elements.typeSelector || !elements.generateBtn) {
    throw new Error('العناصر الأساسية غير موجودة!');
  }

  const state = {
    isLoading: false,
    currentTheme: localStorage.getItem('theme') || 'light',
    currentLang: localStorage.getItem('lang') || 'en'
  };

  const translations = {};

  const helpers = {
    showToast: (message, isError = false) => {
      try {
        const toast = document.createElement('div');
        toast.className = `toast ${isError ? 'error' : 'success'}`;
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
      } catch (e) {
        console.error('Toast error:', e);
      }
    },

    setLoading: (isLoading) => {
      state.isLoading = isLoading;
      elements.generateBtn.disabled = isLoading;
      elements.loadingIndicator.style.display = isLoading ? 'block' : 'none';
      elements.generateBtn.textContent = isLoading
        ? translations[state.currentLang]?.copying || 'Loading...'
        : translations[state.currentLang]?.generate || 'Generate';
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
        helpers.showToast(translations[state.currentLang]?.lengthError || 'Invalid length', true);
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

        const isLocalhost = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
        const API_BASE_URL = isLocalhost
          ? 'http://127.0.0.1:8000'
          : 'https://password-generator-vm7k.onrender.com';

        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Server error');
        }

        elements.passwordField.value = data.password;
        helpers.showToast(translations[state.currentLang]?.success || 'تم إنشاء كلمة المرور');
      } catch (error) {
        console.error('Error:', error);
        helpers.showToast(error.message || 'Unexpected error', true);
      } finally {
        helpers.setLoading(false);
      }
    },

    handleCopy: async () => {
      try {
        await navigator.clipboard.writeText(elements.passwordField.value);
        helpers.showToast(translations[state.currentLang]?.copied || 'تم النسخ!');
      } catch (err) {
        helpers.showToast('Copy failed', true);
      }
    },

    handleThemeToggle: () => {
      state.currentTheme = state.currentTheme === 'light' ? 'dark' : 'light';
      document.body.className = state.currentTheme === 'dark' ? 'dark-theme' : '';
      localStorage.setItem('theme', state.currentTheme);
    },

    handleLanguageChange: (lang) => {
      state.currentLang = lang;
      localStorage.setItem('lang', state.currentLang);
      loadTranslations(state.currentLang);
    }
  };

  async function loadTranslations(lang) {
    try {
      const response = await fetch(`/lang/${lang}.json`);
      if (!response.ok) throw new Error('Translation file not found');
      translations[lang] = await response.json();
      updateTextContent();
    } catch (err) {
      console.error('Translation error:', err);
    }
  }

  function updateTextContent() {
    const t = translations[state.currentLang] || {};

    elements.pageTitle.textContent = t.page_title || 'Secure Password Generator';
    document.title = t.page_title || 'Secure Password Generator';

    elements.title.textContent = t.title || 'Secure Password Generator';
    elements.description.textContent = t.description || 'Choose the password type and generate it easily and securely';

    elements.themeToggle.textContent = t.theme_toggle || 'Toggle Theme';
    elements.themeIcon.className = t.theme_icon || 'fa fa-sun icon';

    elements.passwordTypeLabel.textContent = t.password_type || 'Password Type:';
    elements.customOption.textContent = t.custom_option || 'Custom';
    elements.strongOption.textContent = t.strong_option || 'Strong';
    elements.memorableOption.textContent = t.memorable_option || 'Memorable';
    elements.pinOption.textContent = t.pin_option || 'PIN';

    elements.passwordLengthLabel.textContent = t.password_length || 'Password Length:';
    elements.customCharsLabel.textContent = t.custom_chars || 'Enter custom characters:';

    elements.generateBtn.textContent = t.generate_button || 'Generate Password';
    elements.generateBtn.dataset.loadingText = t.loading_text || 'Generating...';

    elements.passwordInput.placeholder = t.password_placeholder || 'Password will appear here';
    elements.copyBtn.textContent = t.copy_button || 'Copy';

    elements.uppercaseLabel.textContent = t.uppercase || 'Uppercase letters (A-Z)';
    elements.numbersLabel.textContent = t.numbers || 'Numbers (0-9)';
    elements.symbolsLabel.textContent = t.symbols || 'Special characters (!@#$%)';

    elements.pinLengthLabel.textContent = t.pin_length || 'PIN Length:';

    elements.languageToggle.textContent = t.language || 'Language';
  }

  function init() {
    document.body.className = state.currentTheme === 'dark' ? 'dark-theme' : '';

    elements.typeSelector.addEventListener('change', handlers.handleTypeChange);
    elements.generateBtn.addEventListener('click', handlers.handleGenerate);
    elements.copyBtn.addEventListener('click', handlers.handleCopy);
    elements.themeToggle.addEventListener('click', handlers.handleThemeToggle);

    if (elements.langArButton)
      elements.langArButton.addEventListener('click', () => handlers.handleLanguageChange('ar'));
    if (elements.langEnButton)
      elements.langEnButton.addEventListener('click', () => handlers.handleLanguageChange('en'));

    handlers.handleTypeChange();
    loadTranslations(state.currentLang);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

} catch (e) {
  console.error('Fatal error:', e);
  alert('فشل في تحميل التطبيق، حاول إعادة التحميل.');
}