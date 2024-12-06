// Handle section toggling
const tabButtons = document.querySelectorAll('.tab-button');
const sections = document.querySelectorAll('.form-container');

tabButtons.forEach(button => {
  button.addEventListener('click', () => {
    const targetSection = button.getAttribute('data-section');

    // Hide all sections
    sections.forEach(section => section.classList.remove('active'));

    // Show the target section
    document.getElementById(`${targetSection}-section`).classList.add('active');

    // Toggle active class for buttons
    tabButtons.forEach(tab => tab.classList.remove('active'));
    button.classList.add('active');
  });
});

// Register Form Submission
document.getElementById('register-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const formData = {
    firstName: document.getElementById('firstName').value,
    lastName: document.getElementById('lastName').value,
    email: document.getElementById('email').value,
    password: document.getElementById('password').value,
    referralCode: document.getElementById('referralCode').value,
  };

  // Show loader
  document.getElementById('register-loader').classList.add('active');

  try {
    const response = await fetch('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });

    const result = await response.json();
    document.getElementById('register-loader').classList.remove('active');

    if (response.ok) {
      alert(result.message);
      // Scroll to verify section after successful registration
      document.querySelector('.tab-button[data-section="verify"]').click();
    } else {
      alert(result.message || 'Registration failed.');
    }
  } catch (error) {
    console.error('Error:', error);
    document.getElementById('register-loader').classList.remove('active');
  }
});

// Login Form Submission
document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const formData = {
    email: document.getElementById('login-email').value,
    password: document.getElementById('login-password').value,
  };

  // Show loader
  document.getElementById('login-loader').classList.add('active');

  try {
    const response = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });

    const result = await response.json();
    document.getElementById('login-loader').classList.remove('active');

    if (response.ok) {
      alert('Login successful!');
      // Redirect to dashboard after successful login
      window.location.href = '/dashboard';
    } else {
      alert(result.message || 'Login failed.');
    }
  } catch (error) {
    console.error('Error:', error);
    document.getElementById('login-loader').classList.remove('active');
  }
});

// Verify Form Submission
document.getElementById('verify-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const formData = {
    email: document.getElementById('verify-email').value,
    verificationCode: document.getElementById('verificationCode').value,
  };

  // Show loader
  document.getElementById('verify-loader').classList.add('active');

  try {
    const response = await fetch('http://localhost:3000/api/auth/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });

    const result = await response.json();
    document.getElementById('verify-loader').classList.remove('active');

    if (response.ok) {
      alert('Verification successful!');
      // Scroll to login page after successful verification
      document.querySelector('.tab-button[data-section="login"]').click();
    } else {
      alert(result.message || 'Verification failed.');
    }
  } catch (error) {
    console.error('Error:', error);
    document.getElementById('verify-loader').classList.remove('active');
  }
});

// Toggle password visibility
const togglePasswordVisibility = (inputId, buttonId) => {
  const passwordField = document.getElementById(inputId);
  const toggleButton = document.getElementById(buttonId);
  const isPasswordVisible = passwordField.type === 'text';

  passwordField.type = isPasswordVisible ? 'password' : 'text';
  toggleButton.innerHTML = isPasswordVisible ? 'Show' : 'Hide';
};

// Password Visibility in Register
document.getElementById('register-section').querySelector('.password-toggle').addEventListener('click', () => {
  togglePasswordVisibility('password', 'password-toggle');
});

// Password Visibility in Login
document.getElementById('login-section').querySelector('.password-toggle').addEventListener('click', () => {
  togglePasswordVisibility('login-password', 'login-password-toggle');
});

