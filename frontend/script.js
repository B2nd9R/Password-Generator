// تحديد العناصر
const typeSelector = document.getElementById('type');
const customOptions = document.getElementById('custom-options');
const pinOptions = document.getElementById('pin-options');
const themeToggleBtn = document.getElementById('theme-toggle');
const generateBtn = document.getElementById('generate');
const copyBtn = document.getElementById('copy');
const passwordField = document.getElementById('password');
const pinLengthInput = document.getElementById('pin-length');

// تغيير خيارات بناءً على نوع كلمة المرور المختار
typeSelector.addEventListener('change', () => {
  const selectedType = typeSelector.value;

  customOptions.style.display = selectedType === 'custom' || selectedType === 'strong' ? 'block' : 'none';
  pinOptions.style.display = selectedType === 'pin_generator' ? 'block' : 'none';
});

// توليد كلمة المرور بناءً على الخيارات المحددة
generateBtn.addEventListener('click', async () => {
  const type = typeSelector.value;
  const length = parseInt(document.getElementById('length').value);
  const uppercase = document.getElementById('uppercase').checked;
  const numbers = document.getElementById('numbers').checked;
  const symbols = document.getElementById('symbols').checked;

  let endpoint = '';
  let body = {};

  if (type === 'custom') {
    const characters = prompt("أدخل الأحرف التي تريد استخدامها:");
    endpoint = '/generate/custom';
    body = { characters, length };
  } else if (type === 'strong') {
    endpoint = '/generate/strong';
    body = { length, uppercase, numbers, symbols };
  } else if (type === 'memorable') {
    endpoint = '/generate/memorable';
    body = { num_words: 3, separator: '-' };
  } else if (type === 'pin_generator') {
    endpoint = '/generate/pin';
    const pinLength = parseInt(pinLengthInput.value);
    body = { length: pinLength };
  }

  try {
    const response = await fetch(`http://localhost:8000${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    passwordField.value = data.password;
  } catch (error) {
    console.error("Error generating password:", error);
  }
});

// نسخ كلمة المرور إلى الحافظة
copyBtn.addEventListener('click', () => {
  passwordField.select();
  document.execCommand('copy');

  const message = document.createElement('div');
  message.className = 'copied-message';
  message.textContent = 'تم نسخ كلمة المرور بنجاح!';
  document.body.appendChild(message);

  // عرض الرسالة وإخفائها بعد فترة قصيرة
  message.style.display = 'block';
  setTimeout(() => {
    message.style.display = 'none';
    setTimeout(() => {
      message.remove();
    }, 300);
  }, 2000);
});

// التبديل بين الثيمات
themeToggleBtn.addEventListener('click', () => {
  const body = document.body;
  
  if (body.classList.contains('light-theme')) {
    body.classList.remove('light-theme');
    body.classList.add('dark-theme');
    localStorage.setItem('theme', 'dark-theme');
  } else {
    body.classList.remove('dark-theme');
    body.classList.add('light-theme');
    localStorage.setItem('theme', 'light-theme');
  }
});

// تحميل الثيم المختار من localStorage عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme) {
    document.body.classList.add(savedTheme);
  } else {
    document.body.classList.add('light-theme');
  }
});
