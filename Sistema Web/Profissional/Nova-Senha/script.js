function togglePass(id) {
  const input = document.getElementById(id);
  const icon = input.nextElementSibling;
  input.type = input.type === 'password' ? 'text' : 'password';
  icon.textContent = input.type === 'password' ? 'visibility_off' : 'visibility';
}

function showToast(message) {
  const toast = document.getElementById('error-toast');
  const toastMessage = document.getElementById('error-message');
  if (toast && toastMessage) {
    toastMessage.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 4000);
  }
}

document.getElementById('form-nova-senha').addEventListener('submit', async function (e) {
  e.preventDefault();
  const btn = this.querySelector('button[type="submit"]');
  const password = document.getElementById('password').value;
  const confirmPassword = document.getElementById('confirm-password').value;

  if (password !== confirmPassword) { showToast('As senhas não coincidem.'); return; }
  if (password.length < 8) { showToast('Senha deve ter no mínimo 8 caracteres.'); return; }

  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');

  btn.textContent = 'Salvando...';
  btn.disabled = true;

  try {
    await apiRequest('POST', '/auth/reset-password', { token: token || '', novaSenha: password });
    showNotification('Senha redefinida com sucesso!');
    setTimeout(() => { window.location.href = '../login/index.html'; }, 1500);
  } catch (err) {
    showToast(err.message || 'Erro ao redefinir. O link pode ter expirado.');
    btn.textContent = 'Salvar Nova Senha';
    btn.disabled = false;
  }
});
