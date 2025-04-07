// حالة التطبيق والترجمات
const AppState = {
  elements: {
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
  },

  state: {
    isLoading: false,
    currentTheme: localStorage.getItem('theme') || 'light',
    currentLang: localStorage.getItem('lang') || 'en',
    translations: {
      en: {},
      ar: {}
    }
  },

  // الترجمات الافتراضية (كنسخة احتياطية)
  defaultTranslations: {
    en: {
      page_title: "Secure Password Generator",
      title: "Secure Password Generator",
      description: "Choose the password type and generate it easily and securely",
      theme_toggle: "Toggle Theme",
      password_type: "Password Type:",
      custom_option: "Custom",
      strong_option: "Strong",
      memorable_option: "Memorable",
      pin_option: "PIN",
      password_length: "Password Length:",
      custom_chars: "Enter custom characters:",
      generate_button: "Generate Password",
      loading_text: "Generating...",
      password_placeholder: "Password will appear here",
      copy_button: "Copy",
      uppercase: "Uppercase letters (A-Z)",
      numbers: "Numbers (0-9)",
      symbols: "Special characters (!@#$%)",
      pin_length: "PIN Length:",
      language: "Language",
      success: "Password generated successfully",
      copied: "Copied!",
      lengthError: "Invalid length (4-64 characters)",
      error: "Error occurred",
      no_password: "No password to copy"
    },
    ar: {
      page_title: "مولد كلمات مرور آمنة",
      title: "مولد كلمات مرور آمنة",
      description: "اختر نوع كلمة المرور وقم بتوليدها بسهولة وأمان",
      theme_toggle: "تبديل السمة",
      password_type: "نوع كلمة المرور:",
      custom_option: "مخصص",
      strong_option: "قوي",
      memorable_option: "سهل التذكر",
      pin_option: "رمز سري",
      password_length: "طول كلمة المرور:",
      custom_chars: "أدخل أحرف مخصصة:",
      generate_button: "توليد كلمة المرور",
      loading_text: "جاري التوليد...",
      password_placeholder: "ستظهر كلمة المرور هنا",
      copy_button: "نسخ",
      uppercase: "أحرف كبيرة (A-Z)",
      numbers: "أرقام (0-9)",
      symbols: "رموز خاصة (!@#$%)",
      pin_length: "طول الرمز السري:",
      language: "اللغة",
      success: "تم توليد كلمة المرور بنجاح",
      copied: "تم النسخ!",
      lengthError: "طول غير صالح (4-64 حرف)",
      error: "حدث خطأ",
      no_password: "لا يوجد كلمة مرور للنسخ"
    }
  }
};

// الدوال المساعدة
const Helpers = {
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
    AppState.state.isLoading = isLoading;
    AppState.elements.generateBtn.disabled = isLoading;
    AppState.elements.loadingIndicator.style.display = isLoading ? 'block' : 'none';
    AppState.elements.generateBtn.textContent = isLoading
      ? AppState.state.translations[AppState.state.currentLang]?.loading_text || 'Loading...'
      : AppState.state.translations[AppState.state.currentLang]?.generate_button || 'Generate';
  },

  validateInput: (value, min, max) => {
    const num = parseInt(value);
    return !isNaN(num) && num >= min && num <= max;
  },

  getAPIBaseURL: () => {
    return window.location.origin;
  }
};

// معالجات الأحداث
const EventHandlers = {
  handleTypeChange: () => {
    const type = AppState.elements.typeSelector.value;
    AppState.elements.customOptions.style.display = type === 'custom' ? 'block' : 'none';
    AppState.elements.pinOptions.style.display = type === 'pin' ? 'block' : 'none';
    AppState.elements.strongOptions.style.display = type === 'strong' ? 'block' : 'none';
  },

  handleGenerate: async () => {
    if (AppState.state.isLoading) return;

    const type = AppState.elements.typeSelector.value;
    const length = parseInt(AppState.elements.lengthInput.value) || 12;

    if (type !== 'memorable' && !Helpers.validateInput(length, 4, 64)) {
      Helpers.showToast(
        AppState.state.translations[AppState.state.currentLang]?.lengthError || 'Invalid length (4-64 characters)',
        true
      );
      return;
    }

    Helpers.setLoading(true);

    try {
      let endpoint, body;

      switch (type) {
        case 'strong':
          endpoint = '/generate/strong';
          body = {
            length,
            uppercase: AppState.elements.uppercaseCheckbox.checked,
            numbers: AppState.elements.numbersCheckbox.checked,
            symbols: AppState.elements.symbolsCheckbox.checked
          };
          break;

        case 'memorable':
          endpoint = '/generate/memorable';
          body = { num_words: 3, separator: '-' };
          break;

        case 'pin':
          endpoint = '/generate/pin';
          body = { length: parseInt(AppState.elements.pinLengthSelect.value) };
          break;

        case 'custom':
          endpoint = '/generate/custom';
          body = {
            characters: AppState.elements.customCharsInput.value,
            length
          };
          break;

        default:
          throw new Error(AppState.state.translations[AppState.state.currentLang]?.error || 'Unsupported type');
      }

      const response = await fetch(`${Helpers.getAPIBaseURL()}${endpoint}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept-Language': AppState.state.currentLang
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || AppState.state.translations[AppState.state.currentLang]?.error || 'Server error');
      }

      const data = await response.json();
      AppState.elements.passwordField.value = data.password;
      Helpers.showToast(AppState.state.translations[AppState.state.currentLang]?.success || 'Password generated');
    } catch (error) {
      console.error('Error:', error);
      Helpers.showToast(error.message || AppState.state.translations[AppState.state.currentLang]?.error || 'Error occurred', true);
    } finally {
      Helpers.setLoading(false);
    }
  },

  handleCopy: async () => {
    try {
      if (!AppState.elements.passwordField.value) {
        Helpers.showToast(AppState.state.translations[AppState.state.currentLang]?.no_password || 'No password to copy', true);
        return;
      }
      await navigator.clipboard.writeText(AppState.elements.passwordField.value);
      Helpers.showToast(AppState.state.translations[AppState.state.currentLang]?.copied || 'Copied!');
    } catch (err) {
      Helpers.showToast(AppState.state.translations[AppState.state.currentLang]?.error || 'Copy failed', true);
    }
  },

  handleThemeToggle: () => {
    AppState.state.currentTheme = AppState.state.currentTheme === 'light' ? 'dark' : 'light';
    document.body.className = AppState.state.currentTheme === 'dark' ? 'dark-theme' : '';
    localStorage.setItem('theme', AppState.state.currentTheme);
    
    if (AppState.elements.themeIcon) {
      AppState.elements.themeIcon.className = AppState.state.currentTheme === 'dark' 
        ? 'fa fa-moon icon' 
        : 'fa fa-sun icon';
    }
  },

  handleLanguageChange: async (lang) => {
    if (lang !== 'en' && lang !== 'ar') {
      console.warn(`Unsupported language: ${lang}, defaulting to English`);
      lang = 'en';
    }
    AppState.state.currentLang = lang;
    localStorage.setItem('lang', lang);
    await TranslationService.loadTranslations(lang);
  }
};

// خدمة الترجمة
const TranslationService = {
  loadTranslations: async (lang) => {
    try {
      // 1. محاولة تحميل الترجمات من ملف JSON الخارجي
      const response = await fetch(`/lang/${lang}.json`);
      
      if (response.ok) {
        AppState.state.translations[lang] = await response.json();
      } else {
        // 2. إذا فشل التحميل، استخدام الترجمات الافتراضية
        console.warn(`Using default translations for ${lang}`);
        AppState.state.translations[lang] = AppState.defaultTranslations[lang];
      }
      
      UI.updateTextContent();
    } catch (err) {
      console.error('Translation error:', err);
      // 3. في حالة الخطأ، استخدام الإنجليزية كحل أخير
      AppState.state.translations[lang] = AppState.defaultTranslations.en;
      UI.updateTextContent();
    }
  }
};

// واجهة المستخدم
const UI = {
  updateTextContent: () => {
    const t = AppState.state.translations[AppState.state.currentLang] || AppState.defaultTranslations.en;

    // تحديث جميع العناصر
    Object.keys(t).forEach(key => {
      const element = AppState.elements[key];
      if (element) {
        if (element.tagName === 'INPUT' && element.type === 'text') {
          element.placeholder = t[key] || '';
        } else if (element.textContent !== undefined) {
          element.textContent = t[key] || '';
        }
      }
    });

    // تحديث خاص للعناصر التي تحتاج معالجة إضافية
    if (AppState.elements.pageTitle) {
      document.title = t.page_title || 'Password Generator';
    }
  },

  initialize: async () => {
    // التحقق من العناصر الأساسية
    if (!AppState.elements.typeSelector || !AppState.elements.generateBtn) {
      throw new Error('Essential elements are missing!');
    }

    document.body.className = AppState.state.currentTheme === 'dark' ? 'dark-theme' : '';
    
    // إعداد معالجي الأحداث
    AppState.elements.typeSelector?.addEventListener('change', EventHandlers.handleTypeChange);
    AppState.elements.generateBtn?.addEventListener('click', EventHandlers.handleGenerate);
    AppState.elements.copyBtn?.addEventListener('click', EventHandlers.handleCopy);
    AppState.elements.themeToggle?.addEventListener('click', EventHandlers.handleThemeToggle);
    AppState.elements.langArButton?.addEventListener('click', () => EventHandlers.handleLanguageChange('ar'));
    AppState.elements.langEnButton?.addEventListener('click', () => EventHandlers.handleLanguageChange('en'));

    // التهيئة الأولية
    EventHandlers.handleTypeChange();
    await TranslationService.loadTranslations(AppState.state.currentLang);
  }
};

// بدء التطبيق
try {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', UI.initialize);
  } else {
    UI.initialize();
  }
} catch (e) {
  console.error('Fatal error:', e);
  alert('Application failed to load. Please refresh the page.');
}