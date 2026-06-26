const profissionalId = sessionStorage.getItem('mfa_profissionalId');
const emailDestino = sessionStorage.getItem('mfa_email') || 'seu e-mail';

if (!profissionalId) {
  window.location.href = '../login/index.html';
}

document.getElementById('email-destino').textContent = emailDestino;

// ── Inputs de 6 dígitos ──────────────────────────────────────
const inputs = Array.from(document.querySelectorAll('.codigo-inputs input'));

inputs.forEach((input, i) => {
  input.addEventListener('input', (e) => {
    const val = e.target.value.replace(/\D/g, '');
    e.target.value = val;
    if (val) {
      e.target.classList.add('preenchido');
      if (i < inputs.length - 1) inputs[i + 1].focus();
    } else {
      e.target.classList.remove('preenchido');
    }
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Backspace' && !e.target.value && i > 0) {
      inputs[i - 1].focus();
    }
  });

  input.addEventListener('paste', (e) => {
    e.preventDefault();
    const texto = e.clipboardData.getData('text').replace(/\D/g, '').substring(0, 6);
    texto.split('').forEach((char, idx) => {
      if (inputs[idx]) {
        inputs[idx].value = char;
        inputs[idx].classList.add('preenchido');
      }
    });
    const prox = Math.min(texto.length, inputs.length - 1);
    inputs[prox].focus();
  });
});

function obterCodigo() {
  return inputs.map(i => i.value).join('');
}

// ── Timer de reenvio ─────────────────────────────────────────
let segundos = 60;
const timerEl = document.getElementById('timer');
const btnReenviar = document.getElementById('btn-reenviar');

function iniciarTimer() {
  segundos = 60;
  btnReenviar.disabled = true;
  const interval = setInterval(() => {
    segundos--;
    timerEl.textContent = segundos;
    if (segundos <= 0) {
      clearInterval(interval);
      btnReenviar.textContent = 'Reenviar código';
      btnReenviar.disabled = false;
    }
  }, 1000);
}

iniciarTimer();

btnReenviar.addEventListener('click', async () => {
  btnReenviar.disabled = true;
  try {
    await apiRequest('POST', '/mfa/enviar', { profissionalId: Number(profissionalId) });
    showNotification('Novo código enviado para seu e-mail!');
    btnReenviar.textContent = `Reenviar código (60s)`;
    timerEl.textContent = '60';
    iniciarTimer();
    inputs.forEach(i => { i.value = ''; i.classList.remove('preenchido'); });
    inputs[0].focus();
  } catch (err) {
    showNotification(err.message || 'Erro ao reenviar código.', 'error');
    btnReenviar.disabled = false;
  }
});

// ── Verificar código ─────────────────────────────────────────
document.getElementById('btn-verificar').addEventListener('click', async () => {
  const codigo = obterCodigo();
  if (codigo.length < 6) { showNotification('Digite os 6 dígitos do código.', 'error'); return; }

  const lembrar = document.getElementById('lembrar-dispositivo').checked;
  const btn = document.getElementById('btn-verificar');
  btn.textContent = 'Verificando...';
  btn.disabled = true;

  try {
    const data = await apiRequest('POST', '/mfa/verificar', {
      profissionalId: Number(profissionalId),
      codigo,
      lembrarDispositivo: lembrar,
    });

    if (data.token) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('profissional', JSON.stringify(data.profissional));

      if (lembrar && data.deviceToken) {
        const emailSalvo = sessionStorage.getItem('mfa_email') || '';
        localStorage.setItem(`deviceToken_${emailSalvo}`, data.deviceToken);
      }

      sessionStorage.removeItem('mfa_profissionalId');
      sessionStorage.removeItem('mfa_email');

      showNotification('Acesso liberado!');
      setTimeout(() => { window.location.href = '../painel/index.html'; }, 600);
    }
  } catch (err) {
    showNotification(err.message || 'Código inválido ou expirado.', 'error');
    inputs.forEach(i => { i.value = ''; i.classList.remove('preenchido'); });
    inputs[0].focus();
    btn.textContent = 'Verificar e Entrar';
    btn.disabled = false;
  }
});

inputs[0].focus();
