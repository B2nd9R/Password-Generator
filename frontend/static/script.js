// ==== Configuration & Constants ====
const CONFIG = {
  API_ENDPOINTS: {
    STRONG: '/generate/strong',
    MEMORABLE: '/generate/memorable',
    PIN: '/generate/pin',
    CUSTOM: '/generate/custom'
  },
  LENGTH_RANGES: { MIN: 4, MAX: 64 },
  DEFAULT_LANG: 'ar',
  ERROR_MESSAGES: {
    GENERIC: 'حدث خطأ غير متوقع',
    NO_PASSWORD: 'لا يوجد كلمة مرور للنسخ',
    COPY_FAILED: 'فشلت عملية النسخ'
  }
};

// ==== State Management ====
const state = {
  currentLang: localStorage.getItem('lang') || CONFIG.DEFAULT_LANG,
  currentTheme: localStorage.getItem('theme') || 'light',
  isLoading: false,
  translations: {}
};

// ==== DOM Elements ====
const DOM = {
  elements: {
    password: document.getElementById('password'),
    generateBtn: document.getElementById('generate'),
    typeSelector: document.getElementById('type'),
    themeToggle: document.getElementById('theme-toggle')
  },
  
  getByDataAttr(attr) {
    return document.querySelectorAll(`[data-${attr}]`);
  }
};

// ==== Core Utilities ====
const utils = {
  showToast(message, isError = false) {
    const toast = document.createElement('div');
    toast.className = `toast ${isError ? 'error' : 'success'}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  },

  validateLength(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= CONFIG.LENGTH_RANGES.MIN && num <= CONFIG.LENGTH_RANGES.MAX;
  },

  handleError(error) {
    console.error(error);
    this.showToast(error.message || CONFIG.ERROR_MESSAGES.GENERIC, true);
  }
};

// ==== API Service ====
const apiService = {
  async generatePassword(type, body) {
    try {
      const response = await fetch(CONFIG.API_ENDPOINTS[type.toUpperCase()], {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept-Language': state.currentLang
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) throw new Error(await response.text());
      return await response.json();
    } catch (error) {
      throw new Error(error.message);
    }
  }
};

// ==== Event Handlers ====
const handlers = {
  async handleGenerate(e) {
    e.preventDefault();
    if (state.isLoading) return;

    state.isLoading = true;
    DOM.elements.generateBtn.disabled = true;

    try {
      const type = DOM.elements.typeSelector.value;
      const body = this.getRequestBody(type);
      
      const data = await apiService.generatePassword(type, body);
      DOM.elements.password.value = data.password;
      utils.showToast(data.message);
    } catch (error) {
      utils.handleError(error);
    } finally {
      state.isLoading = false;
      DOM.elements.generateBtn.disabled = false;
    }
  },

  getRequestBody(type) {
    const getValue = (id) => document.getElementById(id).value;
    const getChecked = (id) => document.getElementById(id).checked;

    switch (type) {
      case 'strong':
        return {
          length: getValue('strong-length'),
          uppercase: getChecked('uppercase'),
          numbers: getChecked('numbers'),
          symbols: getChecked('symbols')
        };
      case 'custom':
        return {
          length: getValue('custom-length'),
          characters: getValue('custom-chars')
        };
      case 'pin':
        return { length: getValue('pin-length') };
      case 'memorable':
        return { num_words: 3, separator: '-' };
      default:
        throw new Error('نوع كلمة المرور غير معروف');
    }
  },

  async handleCopy() {
    try {
      if (!DOM.elements.password.value) {
        throw new Error(CONFIG.ERROR_MESSAGES.NO_PASSWORD);
      }
      await navigator.clipboard.writeText(DOM.elements.password.value);
      utils.showToast('تم النسخ بنجاح!');
    } catch (error) {
      utils.handleError(new Error(CONFIG.ERROR_MESSAGES.COPY_FAILED));
    }
  },

  handleThemeToggle() {
    state.currentTheme = state.currentTheme === 'light' ? 'dark' : 'light';
    document.body.className = `${state.currentTheme}-theme`;
    localStorage.setItem('theme', state.currentTheme);
    this.updateThemeIcon();
  },

  updateThemeIcon() {
    const icon = DOM.elements.themeToggle.querySelector('i');
    icon.className = state.currentTheme === 'dark' 
      ? 'fas fa-moon' 
      : 'fas fa-sun';
  },

  async handleLanguageChange(lang) {
    state.currentLang = lang;
    localStorage.setItem('lang', lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    await this.loadTranslations();
  },

  async loadTranslations() {
    try {
      const response = await fetch(`/lang/${state.currentLang}.json`);
      state.translations = await response.json();
      this.updateUIText();
    } catch (error) {
      utils.handleError(error);
    }
  },

  updateUIText() {
    document.querySelectorAll('[data-translate]').forEach(el => {
      const key = el.dataset.translate;
      el.textContent = state.translations[key] || el.textContent;
    });
  }
};

// ==== Initialization ====
const init = () => {
  // Event Listeners
  DOM.elements.generateBtn.addEventListener('click', (e) => handlers.handleGenerate(e));
  document.getElementById('copy').addEventListener('click', () => handlers.handleCopy());
  DOM.elements.themeToggle.addEventListener('click', () => handlers.handleThemeToggle());
  document.getElementById('type').addEventListener('change', () => {
    document.querySelectorAll('.options-group').forEach(g => g.style.display = 'none');
    document.getElementById(`${DOM.elements.typeSelector.value}-options`).style.display = 'block';
  });

  // Initial Setup
  handlers.handleThemeToggle();
  handlers.handleLanguageChange(state.currentLang);
};

// Start Application
document.addEventListener('DOMContentLoaded', init);