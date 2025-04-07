/**
 * حالة التطبيق والترجمات
 */
const AppState = {
  elements: null,
  
  state: {
    isLoading: false,
    currentTheme: localStorage.getItem('theme') || 'light',
    currentLang: localStorage.getItem('lang') || 'ar',
    alertClosed: localStorage.getItem('alertClosed') === 'true',
    translations: {
      en: {},
      ar: {}
    }
  },

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
      no_password: "No password to copy",
      alert_title: "Important Notice!",
      alert_message: "We apologize for the inconvenience, the service is currently unavailable due to maintenance.",
      alert_contact: "Contact Support",
      language_changed: "Language changed to English"
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
      no_password: "لا يوجد كلمة مرور للنسخ",
      alert_title: "تنبيه مهم!",
      alert_message: "نعتذر عن الإزعاج، الخدمة غير متاحة حاليًا بسبب أعمال الصيانة",
      alert_contact: "تواصل مع الدعم",
      language_changed: "تم تغيير اللغة إلى العربية"
    }
  }
};

/**
 * الدوال المساعدة
 */
const Helpers = {
  showToast(message, isError = false) {
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

  setLoading(isLoading) {
    AppState.state.isLoading = isLoading;
    if (AppState.elements.generateBtn) {
      AppState.elements.generateBtn.disabled = isLoading;
      AppState.elements.generateBtn.textContent = isLoading
        ? AppState.state.translations[AppState.state.currentLang]?.loading_text || 'Loading...'
        : AppState.state.translations[AppState.state.currentLang]?.generate_button || 'Generate';
    }
    if (AppState.elements.loadingIndicator) {
      AppState.elements.loadingIndicator.style.display = isLoading ? 'flex' : 'none';
    }
  },

  validateInput(value, min, max) {
    const num = parseInt(value);
    return !isNaN(num) && num >= min && num <= max;
  },

  closeAlert() {
    if (AppState.elements.serviceAlert) {
      AppState.elements.serviceAlert.classList.add('hidden');
      setTimeout(() => {
        AppState.elements.serviceAlert.style.display = 'none';
        AppState.state.alertClosed = true;
        localStorage.setItem('alertClosed', 'true');
      }, 300);
    }
  }
};

/**
 * خدمة API
 */
const ApiService = {
  async request(endpoint, method = 'GET', body = null) {
    try {
      const options = {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Accept-Language': AppState.state.currentLang
        }
      };

      if (body) {
        options.body = JSON.stringify(body);
      }

      const response = await fetch(endpoint, options);

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || 'Server error');
      }

      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },

  async generatePassword(type, body) {
    return this.request(`/api/generate/${type}`, 'POST', body);
  },

  async loadTranslations(lang) {
    try {
      const response = await fetch(`/api/lang/${lang}.json?_=${Date.now()}`);
      if (!response.ok) {
        return AppState.defaultTranslations[lang];
      }
      return await response.json();
    } catch (error) {
      console.error('Failed to load translations:', error);
      return AppState.defaultTranslations[lang];
    }
  },

  async checkConnection() {
    return this.request('/api/check-connection');
  }
};

/**
 * معالجات الأحداث
 */
const EventHandlers = {
  handleTypeChange() {
    const type = AppState.elements.typeSelector.value;
    const options = {
      'custom': AppState.elements.customOptions,
      'pin': AppState.elements.pinOptions,
      'strong': AppState.elements.strongOptions
    };

    Object.entries(options).forEach(([key, element]) => {
      if (element) element.style.display = type === key ? 'block' : 'none';
    });
  },

  async handleGenerate() {
    if (AppState.state.isLoading) return;

    const type = AppState.elements.typeSelector.value;
    let body = {};

    try {
      switch (type) {
        case 'strong':
          body = {
            length: parseInt(AppState.elements.strongLength.value) || 16,
            uppercase: AppState.elements.uppercaseCheckbox.checked,
            numbers: AppState.elements.numbersCheckbox.checked,
            symbols: AppState.elements.symbolsCheckbox.checked
          };
          break;

        case 'memorable':
          body = { num_words: 3, separator: '-' };
          break;

        case 'pin':
          body = { length: parseInt(AppState.elements.pinLengthSelect.value) || 4 };
          break;

        case 'custom':
          body = {
            length: parseInt(AppState.elements.lengthInput.value) || 12,
            characters: AppState.elements.customCharsInput.value
          };
          break;

        default:
          throw new Error('Unsupported password type');
      }

      if (type !== 'memorable' && !Helpers.validateInput(body.length, 4, 64)) {
        throw new Error(AppState.state.translations[AppState.state.currentLang]?.lengthError);
      }

      Helpers.setLoading(true);
      const data = await ApiService.generatePassword(type, body);
      
      AppState.elements.passwordField.value = data.password;
      Helpers.showToast(data.message || AppState.state.translations[AppState.state.currentLang]?.success);
    } catch (error) {
      console.error('Generation error:', error);
      Helpers.showToast(error.message || AppState.state.translations[AppState.state.currentLang]?.error, true);
    } finally {
      Helpers.setLoading(false);
    }
  },

  async handleCopy() {
    try {
      if (!AppState.elements.passwordField.value) {
        throw new Error(AppState.state.translations[AppState.state.currentLang]?.no_password);
      }
      await navigator.clipboard.writeText(AppState.elements.passwordField.value);
      Helpers.showToast(AppState.state.translations[AppState.state.currentLang]?.copied);
    } catch (error) {
      console.error('Copy error:', error);
      Helpers.showToast(AppState.state.translations[AppState.state.currentLang]?.error, true);
    }
  },

  handleThemeToggle() {
    AppState.state.currentTheme = AppState.state.currentTheme === 'light' ? 'dark' : 'light';
    document.body.className = AppState.state.currentTheme === 'dark' ? 'dark-theme' : '';
    localStorage.setItem('theme', AppState.state.currentTheme);
    
    if (AppState.elements.themeIcon) {
      AppState.elements.themeIcon.className = AppState.state.currentTheme === 'dark' 
        ? 'fa fa-moon icon' 
        : 'fa fa-sun icon';
    }
  },

  async handleLanguageChange(lang) {
    try {
      AppState.state.currentLang = lang;
      localStorage.setItem('lang', lang);
      
      document.documentElement.lang = lang;
      document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
      
      // تحميل الترجمات أولاً
      AppState.state.translations[lang] = await ApiService.loadTranslations(lang);
      
      // تحديث جميع عناصر الواجهة
      UI.updateTextContent();
      
      // عرض رسالة باللغة المحددة
      Helpers.showToast(AppState.state.translations[lang]?.language_changed || 
        `Language changed to ${lang === 'ar' ? 'Arabic' : 'English'}`);
    } catch (error) {
      console.error('Language change error:', error);
      AppState.state.translations[lang] = AppState.defaultTranslations[lang];
      UI.updateTextContent();
    }
  },

  handleCloseAlert() {
    Helpers.closeAlert();
  }
};

/**
 * واجهة المستخدم
 */
const UI = {
  initializeElements() {
    AppState.elements = {
      // العناصر الأساسية
      typeSelector: document.getElementById('type'),
      generateBtn: document.getElementById('generate'),
      copyBtn: document.getElementById('copy'),
      passwordField: document.getElementById('password'),
      themeToggle: document.getElementById('theme-toggle'),
      loadingIndicator: document.getElementById('loading'),
      themeIcon: document.getElementById('theme-icon'),
      langArButton: document.getElementById('language-ar'),
      langEnButton: document.getElementById('language-en'),
      serviceAlert: document.getElementById('serviceAlert'),
      closeAlertBtn: document.getElementById('closeAlert'),
      
      // عناصر الترجمة
      title: document.querySelector('[data-translate="title"]'),
      description: document.querySelector('[data-translate="description"]'),
      passwordTypeLabel: document.querySelector('[data-translate="password_type"]'),
      customOption: document.querySelector('option[value="custom"]'),
      strongOption: document.querySelector('option[value="strong"]'),
      memorableOption: document.querySelector('option[value="memorable"]'),
      pinOption: document.querySelector('option[value="pin"]'),
      passwordLengthLabel: document.querySelector('[data-translate="password_length"]'),
      customCharsLabel: document.querySelector('[data-translate="custom_chars"]'),
      uppercaseLabel: document.querySelector('label[for="uppercase"]'),
      numbersLabel: document.querySelector('label[for="numbers"]'),
      symbolsLabel: document.querySelector('label[for="symbols"]'),
      pinLengthLabel: document.querySelector('[data-translate="pin_length"]'),
      alertTitle: document.querySelector('[data-translate="alert_title"]'),
      alertMessage: document.querySelector('[data-translate="alert_message"]'),
      alertContact: document.querySelector('[data-translate="alert_contact"]'),
      
      // مجموعات الخيارات
      lengthInput: document.getElementById('custom-length'),
      strongLength: document.getElementById('strong-length'),
      uppercaseCheckbox: document.getElementById('uppercase'),
      numbersCheckbox: document.getElementById('numbers'),
      symbolsCheckbox: document.getElementById('symbols'),
      strongOptions: document.getElementById('strong-options'),
      pinLengthSelect: document.getElementById('pin-length'),
      customCharsInput: document.getElementById('custom-chars'),
      customOptions: document.getElementById('custom-options'),
      pinOptions: document.getElementById('pin-options')
    };
  },

  updateTextContent() {
    const lang = AppState.state.currentLang;
    const t = AppState.state.translations[lang] || AppState.defaultTranslations[lang];
    
    // تحديث عنوان الصفحة
    document.title = t.page_title || document.title;
    
    // تحديث جميع العناصر التي تحتوي على data-translate
    document.querySelectorAll('[data-translate]').forEach(element => {
      const key = element.getAttribute('data-translate');
      if (t[key]) {
        element.textContent = t[key];
      }
    });
    
    // تحديث عناصر خاصة
    const elementsToUpdate = {
      'title': AppState.elements.title,
      'description': AppState.elements.description,
      'theme_toggle': AppState.elements.themeToggle,
      'password_type': AppState.elements.passwordTypeLabel,
      'custom_option': AppState.elements.customOption,
      'strong_option': AppState.elements.strongOption,
      'memorable_option': AppState.elements.memorableOption,
      'pin_option': AppState.elements.pinOption,
      'password_length': AppState.elements.passwordLengthLabel,
      'custom_chars': AppState.elements.customCharsLabel,
      'generate_button': AppState.elements.generateBtn,
      'password_placeholder': AppState.elements.passwordField,
      'copy_button': AppState.elements.copyBtn,
      'uppercase': AppState.elements.uppercaseLabel,
      'numbers': AppState.elements.numbersLabel,
      'symbols': AppState.elements.symbolsLabel,
      'pin_length': AppState.elements.pinLengthLabel,
      'alert_title': AppState.elements.alertTitle,
      'alert_message': AppState.elements.alertMessage,
      'alert_contact': AppState.elements.alertContact
    };

    Object.entries(elementsToUpdate).forEach(([key, element]) => {
      if (element && t[key]) {
        if (element.tagName === 'INPUT' && element.hasAttribute('placeholder')) {
          element.setAttribute('placeholder', t[key]);
        } else {
          element.textContent = t[key];
        }
      }
    });
  },

  setupEventListeners() {
    const addEventListener = (element, event, handler) => {
      if (element) element.addEventListener(event, handler);
    };

    addEventListener(AppState.elements.typeSelector, 'change', () => EventHandlers.handleTypeChange());
    addEventListener(AppState.elements.generateBtn, 'click', (e) => {
      e.preventDefault();
      EventHandlers.handleGenerate();
    });
    addEventListener(AppState.elements.copyBtn, 'click', (e) => {
      e.preventDefault();
      EventHandlers.handleCopy();
    });
    addEventListener(AppState.elements.themeToggle, 'click', (e) => {
      e.preventDefault();
      EventHandlers.handleThemeToggle();
    });
    addEventListener(AppState.elements.langArButton, 'click', (e) => {
      e.preventDefault();
      EventHandlers.handleLanguageChange('ar');
    });
    addEventListener(AppState.elements.langEnButton, 'click', (e) => {
      e.preventDefault();
      EventHandlers.handleLanguageChange('en');
    });
    addEventListener(AppState.elements.closeAlertBtn, 'click', (e) => {
      e.preventDefault();
      EventHandlers.handleCloseAlert();
    });
  },

  async initialize() {
    try {
      this.initializeElements();
      this.setupEventListeners();
      
      // تطبيق السمة المختارة
      document.body.className = AppState.state.currentTheme === 'dark' ? 'dark-theme' : '';
      
      // تحديث أيقونة السمة
      if (AppState.elements.themeIcon) {
        AppState.elements.themeIcon.className = AppState.state.currentTheme === 'dark' 
          ? 'fa fa-moon icon' 
          : 'fa fa-sun icon';
      }
      
      // إخفاء التنبيه إذا كان مغلقاً مسبقاً
      if (AppState.state.alertClosed && AppState.elements.serviceAlert) {
        AppState.elements.serviceAlert.style.display = 'none';
      }
      
      // تحميل الترجمات وتحديث الواجهة
      await EventHandlers.handleLanguageChange(AppState.state.currentLang);
      
      // تحديث خيارات نوع كلمة المرور
      EventHandlers.handleTypeChange();
      
      console.log('Application initialized successfully');
    } catch (error) {
      console.error('Initialization error:', error);
    }
  }
};

// بدء التطبيق عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
  UI.initialize();
});