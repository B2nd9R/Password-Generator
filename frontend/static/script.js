// حالة التطبيق والترجمات
const AppState = {
  elements: null,
  
  state: {
    isLoading: false,
    currentTheme: localStorage.getItem('theme') || 'light',
    currentLang: localStorage.getItem('lang') || 'ar', // تغيير الافتراضي إلى العربية
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
    if (AppState.elements.generateBtn) {
      AppState.elements.generateBtn.disabled = isLoading;
    }
    if (AppState.elements.loadingIndicator) {
      AppState.elements.loadingIndicator.style.display = isLoading ? 'block' : 'none';
    }
    if (AppState.elements.generateBtn) {
      AppState.elements.generateBtn.textContent = isLoading
        ? AppState.state.translations[AppState.state.currentLang]?.loading_text || 'Loading...'
        : AppState.state.translations[AppState.state.currentLang]?.generate_button || 'Generate';
    }
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
    if (!AppState.elements.typeSelector) return;
    
    const type = AppState.elements.typeSelector.value;
    console.log('Password type changed to:', type);
    
    if (AppState.elements.customOptions) {
      AppState.elements.customOptions.style.display = type === 'custom' ? 'block' : 'none';
    }
    if (AppState.elements.pinOptions) {
      AppState.elements.pinOptions.style.display = type === 'pin' ? 'block' : 'none';
    }
    if (AppState.elements.strongOptions) {
      AppState.elements.strongOptions.style.display = type === 'strong' ? 'block' : 'none';
    }
  },

  handleGenerate: async () => {
    if (AppState.state.isLoading || !AppState.elements.typeSelector || !AppState.elements.passwordField) return;

    console.log('Generating password...');
    
    const type = AppState.elements.typeSelector.value;
    let length = 12;

    try {
      switch (type) {
        case 'custom':
          length = parseInt(AppState.elements.lengthInput?.value) || 12;
          break;
        case 'strong':
          length = parseInt(AppState.elements.strongLength?.value) || 16;
          break;
        case 'pin':
          length = parseInt(AppState.elements.pinLengthSelect?.value) || 4;
          break;
      }
    } catch (e) {
      console.error('Error parsing length:', e);
    }

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
            uppercase: AppState.elements.uppercaseCheckbox?.checked || true,
            numbers: AppState.elements.numbersCheckbox?.checked || true,
            symbols: AppState.elements.symbolsCheckbox?.checked || true
          };
          break;

        case 'memorable':
          endpoint = '/generate/memorable';
          body = { num_words: 3, separator: '-' };
          break;

        case 'pin':
          endpoint = '/generate/pin';
          body = { length };
          break;

        case 'custom':
          endpoint = '/generate/custom';
          body = {
            characters: AppState.elements.customCharsInput?.value || '',
            length
          };
          break;

        default:
          throw new Error(AppState.state.translations[AppState.state.currentLang]?.error || 'Unsupported type');
      }

      console.log('Sending request to:', endpoint, 'with body:', body);
      
      const response = await fetch(`${Helpers.getAPIBaseURL()}${endpoint}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept-Language': AppState.state.currentLang
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || AppState.state.translations[AppState.state.currentLang]?.error || 'Server error');
      }

      const data = await response.json();
      console.log('Received response:', data);
      
      AppState.elements.passwordField.value = data.password || '';
      Helpers.showToast(AppState.state.translations[AppState.state.currentLang]?.success || 'Password generated');
    } catch (error) {
      console.error('Generation error:', error);
      Helpers.showToast(error.message || AppState.state.translations[AppState.state.currentLang]?.error || 'Error occurred', true);
    } finally {
      Helpers.setLoading(false);
    }
  },

  handleCopy: async () => {
    try {
      if (!AppState.elements.passwordField?.value) {
        Helpers.showToast(AppState.state.translations[AppState.state.currentLang]?.no_password || 'No password to copy', true);
        return;
      }
      await navigator.clipboard.writeText(AppState.elements.passwordField.value);
      Helpers.showToast(AppState.state.translations[AppState.state.currentLang]?.copied || 'Copied!');
    } catch (err) {
      console.error('Copy error:', err);
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
    console.log('Changing language to:', lang);
    AppState.state.currentLang = lang;
    localStorage.setItem('lang', lang);
    
    // تغيير اتجاه الصفحة حسب اللغة
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    
    await TranslationService.loadTranslations(lang);
  }
};

// خدمة الترجمة
const TranslationService = {
  loadTranslations: async (lang) => {
    try {
      console.log(`Loading translations for ${lang}...`);
      
      const response = await fetch(`/lang/${lang}.json?t=${new Date().getTime()}`);
      
      if (response.ok) {
        AppState.state.translations[lang] = await response.json();
        console.log(`Successfully loaded translations for ${lang}`);
      } else {
        console.warn(`Failed to load ${lang}.json, using defaults`);
        AppState.state.translations[lang] = AppState.defaultTranslations[lang];
      }
      
      UI.updateTextContent();
    } catch (err) {
      console.error('Translation error:', err);
      AppState.state.translations[lang] = AppState.defaultTranslations[lang];
      UI.updateTextContent();
    }
  }
};

// واجهة المستخدم
const UI = {
  updateTextContent: () => {
    const t = AppState.state.translations[AppState.state.currentLang] || AppState.defaultTranslations.en;
    console.log('Updating UI with translations:', t);

    // تحديث جميع العناصر
    for (const [key, value] of Object.entries(t)) {
      const element = AppState.elements[key];
      if (element) {
        if (element.tagName === 'INPUT' && element.type === 'text') {
          element.placeholder = value || '';
        } else if (element.textContent !== undefined) {
          element.textContent = value || '';
        }
      }
    }

    // تحديث خاص للعناصر التي تحتاج معالجة إضافية
    if (AppState.elements.pageTitle) {
      document.title = t.page_title || 'Password Generator';
    }
  },

  initializeElements: () => {
    AppState.elements = {
      typeSelector: document.getElementById('type'),
      generateBtn: document.getElementById('generate'),
      copyBtn: document.getElementById('copy'),
      passwordField: document.getElementById('password'),
      lengthInput: document.getElementById('custom-length'),
      strongLength: document.getElementById('strong-length'),
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
  },

  setupEventListeners: () => {
    if (AppState.elements.typeSelector) {
      AppState.elements.typeSelector.addEventListener('change', () => {
        EventHandlers.handleTypeChange();
      });
    }

    if (AppState.elements.generateBtn) {
      AppState.elements.generateBtn.addEventListener('click', (e) => {
        e.preventDefault();
        EventHandlers.handleGenerate();
      });
    }

    if (AppState.elements.copyBtn) {
      AppState.elements.copyBtn.addEventListener('click', (e) => {
        e.preventDefault();
        EventHandlers.handleCopy();
      });
    }

    if (AppState.elements.themeToggle) {
      AppState.elements.themeToggle.addEventListener('click', (e) => {
        e.preventDefault();
        EventHandlers.handleThemeToggle();
      });
    }

    if (AppState.elements.langArButton) {
      AppState.elements.langArButton.addEventListener('click', (e) => {
        e.preventDefault();
        EventHandlers.handleLanguageChange('ar');
      });
    }

    if (AppState.elements.langEnButton) {
      AppState.elements.langEnButton.addEventListener('click', (e) => {
        e.preventDefault();
        EventHandlers.handleLanguageChange('en');
      });
    }
  },

  initialize: async () => {
    console.log('Initializing application...');
    
    try {
      // 1. تهيئة العناصر
      this.initializeElements();
      
      // 2. التحقق من العناصر الأساسية
      const essentialElements = ['typeSelector', 'generateBtn', 'passwordField'];
      for (const element of essentialElements) {
        if (!AppState.elements[element]) {
          throw new Error(`Essential element ${element} is missing!`);
        }
      }
      
      console.log('All essential elements found:', AppState.elements);
      
      // 3. إعداد السمة الأولية
      document.body.className = AppState.state.currentTheme === 'dark' ? 'dark-theme' : '';
      
      // 4. إعداد معالجات الأحداث
      this.setupEventListeners();
      
      // 5. تهيئة اللغة
      await TranslationService.loadTranslations(AppState.state.currentLang);
      
      // 6. تهيئة نوع كلمة المرور
      EventHandlers.handleTypeChange();
      
      console.log('Application initialized successfully');
    } catch (error) {
      console.error('Initialization error:', error);
      alert(`Initialization error: ${error.message}`);
    }
  }
};

// بدء التطبيق بعد تحميل DOM
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM fully loaded, starting app...');
  UI.initialize();
});