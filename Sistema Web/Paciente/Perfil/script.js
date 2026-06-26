const eyeOpenURL = 'https://api.iconify.design/material-symbols:visibility-outline.svg?color=%239ca3af';
const eyeClosedURL = 'https://api.iconify.design/material-symbols:visibility-off-outline.svg?color=%239ca3af';

let dadosFormularioTemporarios = null;
let modoEdicaoAtivo = false;
let fotoBase64Nova = null;
let pacienteCpfAtual = null;
let timerCpfPaciente = null;

// ── Campos editáveis (CPF e email são somente leitura) ────────
const CAMPOS_EDITAVEIS = [
  'reg-nome', 'reg-nascimento',
  'contato-telefone',
  'end-cep', 'end-logradouro', 'end-numero', 'end-bairro',
  'end-complemento', 'end-cidade', 'end-uf',
  'acesso-senha', 'acesso-confirmar',
];

function togglePasswordVisibility(fieldId, imgId) {
  const field = document.getElementById(fieldId);
  const img = document.getElementById(imgId);
  if (field && img) {
    const isPassword = field.getAttribute('type') === 'password';
    field.setAttribute('type', isPassword ? 'text' : 'password');
    img.setAttribute('src', isPassword ? eyeClosedURL : eyeOpenURL);
  }
}

function previewImage() {
  const fileInput = document.getElementById('upload-photo');
  const profileImg = document.getElementById('profile-img');
  if (!fileInput || !fileInput.files || !fileInput.files[0]) return;

  const file = fileInput.files[0];
  if (!file.type.startsWith('image/')) {
    showNotification('Selecione um arquivo de imagem válido.', 'error');
    fileInput.value = '';
    return;
  }
  if (file.size > 3 * 1024 * 1024) {
    showNotification('A imagem deve ter no máximo 3 MB.', 'error');
    fileInput.value = '';
    return;
  }

  const reader = new FileReader();
  reader.onload = function (e) {
    const base64 = e.target.result;
    if (profileImg) profileImg.src = base64;
    fotoBase64Nova = base64;
  };
  reader.readAsDataURL(file);
}

// ── Modo visualização / edição ────────────────────────────────

function ativarModoVisualizacao() {
  modoEdicaoAtivo = false;
  CAMPOS_EDITAVEIS.forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.disabled = true; el.classList.add('campo-readonly'); }
  });
  // E-mail sempre somente leitura
  const emailEl = document.getElementById('contato-email');
  if (emailEl) { emailEl.disabled = true; emailEl.classList.add('campo-readonly'); }
  // Limpar senha
  const s = document.getElementById('acesso-senha');
  const c = document.getElementById('acesso-confirmar');
  if (s) s.value = '';
  if (c) c.value = '';

  document.getElementById('btn-liberar-edicao')?.style && (document.getElementById('btn-liberar-edicao').style.display = 'inline-flex');
  document.getElementById('btn-salvar')?.style && (document.getElementById('btn-salvar').style.display = 'none');
  document.getElementById('btn-cancelar-edicao')?.style && (document.getElementById('btn-cancelar-edicao').style.display = 'none');
  document.getElementById('secao-senha')?.style && (document.getElementById('secao-senha').style.display = 'none');
}

function ativarModoEdicao() {
  modoEdicaoAtivo = true;
  CAMPOS_EDITAVEIS.forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.disabled = false; el.classList.remove('campo-readonly'); }
  });
  // E-mail permanece readonly
  const emailEl2 = document.getElementById('contato-email');
  if (emailEl2) { emailEl2.disabled = true; emailEl2.classList.add('campo-readonly'); }

  document.getElementById('btn-liberar-edicao')?.style && (document.getElementById('btn-liberar-edicao').style.display = 'none');
  document.getElementById('btn-salvar')?.style && (document.getElementById('btn-salvar').style.display = 'inline-flex');
  document.getElementById('btn-cancelar-edicao')?.style && (document.getElementById('btn-cancelar-edicao').style.display = 'inline-flex');
  document.getElementById('secao-senha')?.style && (document.getElementById('secao-senha').style.display = 'block');
}

// ── Máscaras de input ─────────────────────────────────────────

function aplicarTravasInput() {
  const nascimentoInput = document.getElementById('reg-nascimento');
  const cepInput = document.getElementById('end-cep');
  const telefoneInput = document.getElementById('contato-telefone');

  if (nascimentoInput) {
    nascimentoInput.addEventListener('input', (e) => {
      let v = e.target.value.replace(/\D/g, '').substring(0, 8);
      v = v.replace(/(\d{2})(\d)/, '$1/$2').replace(/(\d{2})(\d)/, '$1/$2');
      e.target.value = v;
    });
  }
  if (cepInput) {
    cepInput.addEventListener('input', (e) => {
      let v = e.target.value.replace(/\D/g, '').substring(0, 8);
      v = v.replace(/^(\d{5})(\d)/, '$1-$2');
      e.target.value = v;
    });
  }
  if (telefoneInput) {
    telefoneInput.addEventListener('input', (e) => {
      let v = e.target.value.replace(/\D/g, '').substring(0, 11);
      v = v.replace(/^(\d{2})(\d)/g, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2');
      e.target.value = v;
    });
  }
}

function buscarCEP() {
  if (!modoEdicaoAtivo) return;
  const cepInput = document.getElementById('end-cep');
  if (!cepInput) return;
  const cep = cepInput.value.replace(/\D/g, '');
  if (cep.length !== 8) { showNotification('O CEP deve conter 8 dígitos.', 'error'); return; }

  fetch(`https://viacep.com.br/ws/${cep}/json/`)
    .then(r => r.json())
    .then(data => {
      if (!data.erro) {
        if (document.getElementById('end-logradouro')) document.getElementById('end-logradouro').value = data.logradouro || '';
        if (document.getElementById('end-bairro')) document.getElementById('end-bairro').value = data.bairro || '';
        if (document.getElementById('end-cidade')) document.getElementById('end-cidade').value = data.localidade || '';
        if (document.getElementById('end-uf')) document.getElementById('end-uf').value = data.uf || '';
        if (document.getElementById('end-numero')) document.getElementById('end-numero').focus();
      } else {
        showNotification('CEP não encontrado.', 'error');
      }
    })
    .catch(() => showNotification('Erro ao buscar o CEP.', 'error'));
}

function gerenciarMenuMobile() {
  const openBtn = document.getElementById('open-menu-btn');
  const closeBtn = document.getElementById('close-menu-btn');
  const sidebar = document.getElementById('mobile-sidebar');
  const backdrop = document.getElementById('menu-backdrop');
  if (!openBtn || !sidebar || !backdrop) return;
  openBtn.addEventListener('click', () => { sidebar.classList.add('open'); backdrop.classList.add('active'); });
  const fechar = () => { sidebar.classList.remove('open'); backdrop.classList.remove('active'); };
  if (closeBtn) closeBtn.addEventListener('click', fechar);
  backdrop.addEventListener('click', fechar);
}

function abrirModalExcluir() {
  const modal = document.getElementById('modal-excluir');
  if (modal) modal.classList.add('active');
}

function fecharModalExcluir() {
  const modal = document.getElementById('modal-excluir');
  if (modal) modal.classList.remove('active');
  const motivoSelect = document.getElementById('motivo-exclusao');
  if (motivoSelect) motivoSelect.value = '';
}

async function confirmarExclusao() {
  const motivoSelect = document.getElementById('motivo-exclusao');
  if (!motivoSelect || !motivoSelect.value) {
    showNotification('Selecione o motivo da exclusão.', 'error');
    return;
  }
  try {
    await excluirContaPaciente(motivoSelect.value);
    localStorage.removeItem('paciente_token');
    localStorage.removeItem('paciente');
    showNotification('Conta excluída com sucesso.');
    setTimeout(() => { window.location.href = '../login/index.html'; }, 1000);
  } catch (err) {
    showNotification(err.message || 'Erro ao excluir conta.', 'error');
  }
  fecharModalExcluir();
}

function fecharModalSalvar() {
  const modal = document.getElementById('modal-salvar');
  if (modal) modal.classList.remove('active');
  dadosFormularioTemporarios = null;
}

async function confirmarSalvamento() {
  if (!dadosFormularioTemporarios) return;
  try {
    await atualizarPerfilPaciente(dadosFormularioTemporarios);
    const headerNome = document.getElementById('txt-nome-header');
    if (headerNome) headerNome.textContent = dadosFormularioTemporarios.nome;
    showNotification('Perfil atualizado com sucesso!');
    ativarModoVisualizacao();
  } catch (err) {
    showNotification(err.message || 'Erro ao salvar perfil.', 'error');
  }
  fecharModalSalvar();
}

function preencherFormulario(dados) {
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };

  let nascimentoFormatado = '';
  if (dados.nascimento) {
    const p = String(dados.nascimento).substring(0, 10).split('-');
    nascimentoFormatado = `${p[2]}/${p[1]}/${p[0]}`;
  }

  set('reg-nome', dados.nome);
  // CPF: guardado em variável, exibido mascarado
  if (dados.cpf) {
    pacienteCpfAtual = dados.cpf;
    mascarCpfPaciente();
  }
  set('reg-nascimento', nascimentoFormatado);
  set('contato-email', dados.email);
  set('contato-telefone', formatarTelefone(dados.telefone));
  set('end-cep', dados.cep ? dados.cep.replace(/^(\d{5})(\d{3})$/, '$1-$2') : '');
  set('end-logradouro', dados.logradouro);
  set('end-numero', dados.numero);
  set('end-bairro', dados.bairro);
  set('end-complemento', dados.complemento);
  set('end-cidade', dados.cidade);
  set('end-uf', dados.estado);

  // Senha nunca pré-preenchida
  set('acesso-senha', '');
  set('acesso-confirmar', '');

  // Foto de perfil
  const profileImg = document.getElementById('profile-img');
  if (profileImg && dados.foto_base64) profileImg.src = dados.foto_base64;

  const headerNome = document.getElementById('txt-nome-header');
  if (headerNome) headerNome.textContent = dados.nome || '';
}

// ── CPF do paciente ───────────────────────────────────────────

function mascarCpfPaciente() {
  const el = document.getElementById('cpf-paciente-display');
  const btn = document.getElementById('btn-reveal-cpf-paciente');
  if (el) el.textContent = '•••.•••.•••-••';
  if (el) el.style.letterSpacing = '2px';
  if (btn) btn.innerHTML = '<span class="material-symbols-outlined" style="font-size:18px;">lock</span>';
  if (timerCpfPaciente) { clearTimeout(timerCpfPaciente); timerCpfPaciente = null; }
}

function revelarCpfDisplay(cpf) {
  const el = document.getElementById('cpf-paciente-display');
  const btn = document.getElementById('btn-reveal-cpf-paciente');
  if (el) { el.textContent = formatarCpf(cpf); el.style.letterSpacing = '0'; }
  if (btn) btn.innerHTML = '<span class="material-symbols-outlined" style="font-size:18px;">lock_open</span>';
  if (timerCpfPaciente) clearTimeout(timerCpfPaciente);
  timerCpfPaciente = setTimeout(mascarCpfPaciente, 30000);
}

function abrirModalCpfPaciente() {
  const modal = document.getElementById('modal-cpf-paciente');
  const input = document.getElementById('input-senha-cpf-paciente');
  if (modal) modal.classList.add('active');
  if (input) { input.value = ''; input.focus(); }
}

function fecharModalCpfPaciente() {
  const modal = document.getElementById('modal-cpf-paciente');
  if (modal) modal.classList.remove('active');
  const input = document.getElementById('input-senha-cpf-paciente');
  if (input) input.value = '';
}

async function confirmarRevealCpfPaciente() {
  const input = document.getElementById('input-senha-cpf-paciente');
  const senha = input?.value?.trim();
  if (!senha) { showNotification('Digite sua senha.', 'error'); return; }
  try {
    const result = await revelarCpfPaciente(senha);
    if (result?.cpf) {
      pacienteCpfAtual = result.cpf;
      revelarCpfDisplay(result.cpf);
      fecharModalCpfPaciente();
      showNotification('CPF revelado. Ocultado em 30 segundos.');
    }
  } catch (err) {
    showNotification(err.message || 'Senha incorreta.', 'error');
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  if (!verificarAutenticacaoPaciente()) return;
  aplicarTravasInput();
  gerenciarMenuMobile();

  try {
    const perfil = await obterPerfilPaciente();
    if (perfil) preencherFormulario(perfil);
  } catch (err) {
    showNotification(err.message || 'Erro ao carregar perfil.', 'error');
  }

  // Inicia em modo visualização
  ativarModoVisualizacao();

  // Botão revelar CPF
  document.getElementById('btn-reveal-cpf-paciente')?.addEventListener('click', () => {
    const display = document.getElementById('cpf-paciente-display');
    if (display && display.textContent !== '•••.•••.•••-••' && pacienteCpfAtual) {
      mascarCpfPaciente();
    } else {
      abrirModalCpfPaciente();
    }
  });

  // Enter no campo de senha do modal CPF
  document.getElementById('input-senha-cpf-paciente')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') confirmarRevealCpfPaciente();
  });

  // Botão liberar edição
  document.getElementById('btn-liberar-edicao')?.addEventListener('click', ativarModoEdicao);

  // Botão cancelar edição
  document.getElementById('btn-cancelar-edicao')?.addEventListener('click', async () => {
    fotoBase64Nova = null;
    try {
      const perfil = await obterPerfilPaciente();
      if (perfil) preencherFormulario(perfil);
    } catch {}
    ativarModoVisualizacao();
  });

  // Submissão do formulário
  const formPerf = document.getElementById('form-perfil');
  if (formPerf) {
    formPerf.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!modoEdicaoAtivo) return;

      const nascimentoLimpo = document.getElementById('reg-nascimento')?.value.replace(/\D/g, '') || '';
      const telefoneLimpo = document.getElementById('contato-telefone')?.value.replace(/\D/g, '') || '';
      const cepLimpo = document.getElementById('end-cep')?.value.replace(/\D/g, '') || '';

      if (nascimentoLimpo.length !== 8) { showNotification('Data de nascimento incompleta.', 'error'); return; }
      if (telefoneLimpo.length < 10) { showNotification('Telefone inválido.', 'error'); return; }
      if (cepLimpo.length !== 8) { showNotification('CEP incompleto.', 'error'); return; }

      const senha = document.getElementById('acesso-senha')?.value || '';
      const confirmar = document.getElementById('acesso-confirmar')?.value || '';
      if (senha !== confirmar) {
        showNotification('As senhas não coincidem!', 'error');
        return;
      }

      dadosFormularioTemporarios = {
        nome: document.getElementById('reg-nome')?.value || '',
        telefone: telefoneLimpo,
        cep: cepLimpo,
        logradouro: document.getElementById('end-logradouro')?.value || '',
        numero: document.getElementById('end-numero')?.value || '',
        bairro: document.getElementById('end-bairro')?.value || '',
        complemento: document.getElementById('end-complemento')?.value || '',
        cidade: document.getElementById('end-cidade')?.value || '',
        estado: document.getElementById('end-uf')?.value || '',
        novaSenha: senha || undefined,
        foto_base64: fotoBase64Nova || undefined,
      };

      const modal = document.getElementById('modal-salvar');
      if (modal) modal.classList.add('active');
    });
  }
});
