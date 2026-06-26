document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('form-login-profissional');
  const passwordInput = document.getElementById('password');
  const eyeIcon = document.querySelector('.eye-icon');

  if (eyeIcon && passwordInput) {
    eyeIcon.addEventListener('click', function () {
      passwordInput.type = passwordInput.type === 'password' ? 'text' : 'password';
      this.textContent = passwordInput.type === 'password' ? 'visibility' : 'visibility_off';
    });
  }

  if (loginForm) {
    loginForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      const btnLogin = loginForm.querySelector('button[type="submit"]');
      const email = document.getElementById('email').value.trim();
      const senha = passwordInput.value;

      btnLogin.textContent = 'Entrando...';
      btnLogin.disabled = true;

      try {
        const data = await apiRequest('POST', '/auth/login', { email, senha });
        localStorage.setItem('token', data.token);
        localStorage.setItem('profissional', JSON.stringify(data.profissional));
        showNotification('Login realizado com sucesso!');
        setTimeout(() => { window.location.href = '../painel/index.html'; }, 600);
      } catch (err) {
        showNotification(err.message || 'Credenciais inválidas.', 'error');
      } finally {
        btnLogin.textContent = 'Entrar no Sistema';
        btnLogin.disabled = false;
      }
    });
  }
});
