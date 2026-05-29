const togglePassword = document.getElementById('togglePassword');
const passwordField = document.getElementById('senha');
const eyeIcon = document.getElementById('eye-icon');

const eyeOpenSVG = `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle>`;
const eyeClosedSVG = `<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line>`;

function setIcon(svgContent) {
    eyeIcon.innerHTML = svgContent;
}

setIcon(eyeOpenSVG);

togglePassword.addEventListener('click', () => {
    const isPassword = passwordField.getAttribute('type') === 'password';
    passwordField.setAttribute('type', isPassword ? 'text' : 'password');
    setIcon(isPassword ? eyeClosedSVG : eyeOpenSVG);
});

const form = document.querySelector('.login-form');
const emailInput = document.getElementById('email');
const rememberCheckbox = document.getElementById('remember-me');

window.addEventListener('DOMContentLoaded', () => {
    const savedEmail = localStorage.getItem('login_lembrar_email');
    if (savedEmail) {
        emailInput.value = savedEmail;
        rememberCheckbox.checked = true;
    }
});

form.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = emailInput.value;

    if (rememberCheckbox.checked) {
        localStorage.setItem('login_lembrar_email', email);
    } else {
        localStorage.removeItem('login_lembrar_email');
    }

    alert('Login efetuado com sucesso!');
    window.location.href = '../agendamento/index.html';
});