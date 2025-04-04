const typeSelector = document.getElementById('type');
const customOptions = document.getElementById('custom-options');
const pinOptions = document.getElementById('pin-options');

typeSelector.addEventListener('change', () => {
  const selectedType = typeSelector.value;

  customOptions.style.display = selectedType === 'custom' || selectedType === 'strong' ? 'block' : 'none';
  pinOptions.style.display = selectedType === 'pin_generator' ? 'block' : 'none';
});

document.getElementById('generate').addEventListener('click', async () => {
  const type = document.getElementById('type').value;
  const length = parseInt(document.getElementById('length').value);
  const uppercase = document.getElementById('uppercase').checked;
  const numbers = document.getElementById('numbers').checked;
  const symbols = document.getElementById('symbols').checked;

  let endpoint = '';
  let body = {};

  if (type === 'custom') {
    const characters = prompt("أدخل الأحرف التي تريد استخدامها:");
    endpoint = '/generate/custom';
    body = {
      characters,
      length
    };
  } else if (type === 'strong') {
    endpoint = '/generate/strong';
    body = {
      length,
      uppercase,
      numbers,
      symbols
    };
  } else if (type === 'memorable') {
    endpoint = '/generate/memorable';
    body = {
      num_words: 3,
      separator: '-'
    };
  } else if (type === 'pin_generator') {
    endpoint = '/generate/pin';
    const pinLength = parseInt(document.getElementById('pin-length').value);
    body = {
      length: pinLength
    };
  }

  const response = await fetch(`http://localhost:8000${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();
  document.getElementById('password').value = data.password;
});

document.getElementById('copy').addEventListener('click', () => {
  const passwordField = document.getElementById('password');
  passwordField.select();
  document.execCommand('copy');

  const message = document.createElement('div');
  message.className = 'copied-message';
  message.textContent = 'تم نسخ كلمة المرور بنجاح!';
  document.body.appendChild(message);
  message.style.display = 'block';

  setTimeout(() => {
    message.style.display = 'none';
    setTimeout(() => {
      message.remove();
    }, 300);
  }, 2000);
});
