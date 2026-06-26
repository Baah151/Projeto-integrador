document.getElementById('form-recuperar-senha').addEventListener('submit', async function (e) {
  e.preventDefault();
  const btn = this.querySelector('button[type="submit"]');
  const email = document.getElementById('email').value.trim();

  btn.textContent = 'Enviando...';
  btn.disabled = true;

  try {
    await apiRequest('POST', '/auth/forgot-password', { email });
    showNotification('Instruções enviadas! Verifique seu e-mail.');
    setTimeout(() => { window.location.href = '../login/index.html'; }, 2000);
  } catch (err) {
    showNotification(err.message || 'E-mail não encontrado.', 'error');
    btn.textContent = 'Enviar Instruções';
    btn.disabled = false;
  }
});
