const requestForm = document.getElementById('request-reset-form');
const verifyForm = document.getElementById('verify-temp-password-form');
const loaderRequest = document.getElementById('loader-request-reset');
const loaderVerify = document.getElementById('loader-verify-reset');
const messageRequest = document.getElementById('message-request-reset');
const messageVerify = document.getElementById('message-verify-reset');
const passwordStrength = document.getElementById('password-strength');

// Switch Sections
const switchSection = (from, to) => {
  document.getElementById(from).style.display = 'none';
  document.getElementById(to).style.display = 'block';
};

// Password Strength Checker
const checkPasswordStrength = (password) => {
  if (password.length < 6) {
    passwordStrength.style.background = 'red';
  } else if (password.length < 10) {
    passwordStrength.style.background = 'yellow';
  } else {
    passwordStrength.style.background = 'green';
  }
};

// Handle Request Form Submission
requestForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  loaderRequest.classList.remove('hidden');
  const email = document.getElementById('email').value;

  try {
    const response = await fetch('http://localhost:3000/api/auth/request-password-reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();
    loaderRequest.classList.add('hidden');
    messageRequest.textContent = data.message;

    if (response.ok) switchSection('request-reset', 'verify-temp-password');
  } catch (error) {
    loaderRequest.classList.add('hidden');
    messageRequest.textContent = 'Error requesting reset.';
  }
});

// Handle Verify Form Submission
verifyForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  loaderVerify.classList.remove('hidden');
  const email = document.getElementById('email').value; // Email persisted
  const tempPassword = document.getElementById('temp-password').value;
  const newPassword = document.getElementById('new-password').value;
  const confirmPassword = document.getElementById('confirm-password').value;

  if (newPassword !== confirmPassword) {
    messageVerify.textContent = 'Passwords do not match!';
    loaderVerify.classList.add('hidden');
    return;
  }

  try {
    const response = await fetch('http://localhost:3000/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, tempPassword, newPassword }),
    });

    const data = await response.json();
    loaderVerify.classList.add('hidden');
    messageVerify.textContent = data.message;

    if (response.ok) {
      alert('Password reset successful!');
      // Redirect to index.html in the parent directory
      window.location.href = "../index.html";
    }
  } catch (error) {
    loaderVerify.classList.add('hidden');
    messageVerify.textContent = 'Error resetting password.';
  }
});

// Password Strength Listener
document.getElementById('new-password').addEventListener('input', (e) => {
  checkPasswordStrength(e.target.value);
});
