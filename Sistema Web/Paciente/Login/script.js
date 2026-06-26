const eyeOpenSVG = `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle>`;
const eyeClosedSVG = `<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line>`;

function setIcon(svgContent) {
  const eyeIcon = document.getElementById('eye-icon');
  if (eyeIcon) eyeIcon.innerHTML = svgContent;
}

document.addEventListener('DOMContentLoaded', () => {
  const togglePassword = document.getElementById('togglePassword');
  const passwordField = document.getElementById('senha');
  const form = document.querySelector('.login-form');
  const emailInput = document.getElementById('email');
  const rememberCheckbox = document.getElementById('remember-me');

  setIcon(eyeOpenSVG);

  if (togglePassword && passwordField) {
    togglePassword.addEventListener('click', () => {
      const isPassword = passwordField.getAttribute('type') === 'password';
      passwordField.setAttribute('type', isPassword ? 'text' : 'password');
      setIcon(isPassword ? eyeClosedSVG : eyeOpenSVG);
    });
  }

  const savedEmail = localStorage.getItem('paciente_lembrar_email');
  if (savedEmail && emailInput && rememberCheckbox) {
    emailInput.value = savedEmail;
    rememberCheckbox.checked = true;
  }

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = form.querySelector('button[type="submit"]');
      const email = emailInput.value.trim();
      const senha = passwordField.value;

      if (rememberCheckbox && rememberCheckbox.checked) {
        localStorage.setItem('paciente_lembrar_email', email);
      } else {
        localStorage.removeItem('paciente_lembrar_email');
      }

      btn.textContent = 'Entrando...';
      btn.disabled = true;

      try {
        const data = await loginPaciente(email, senha);
        localStorage.setItem('paciente_token', data.token);
        localStorage.setItem('paciente', JSON.stringify(data.paciente));
        showNotification('Login realizado com sucesso!');
        setTimeout(() => { window.location.href = '../agendamento/index.html'; }, 600);
      } catch (err) {
        showNotification(err.message || 'Credenciais inválidas.', 'error');
      } finally {
        btn.textContent = 'Entrar';
        btn.disabled = false;
      }
    });
  }
});
