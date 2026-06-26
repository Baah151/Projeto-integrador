const eyeOpenURL = 'https://api.iconify.design/material-symbols:visibility-outline.svg?color=%239ca3af';
const eyeClosedURL = 'https://api.iconify.design/material-symbols:visibility-off-outline.svg?color=%239ca3af';

let dadosFormularioTemporarios = null;

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
  if (fileInput && fileInput.files && fileInput.files[0] && profileImg) {
    const reader = new FileReader();
    reader.onload = function (e) { if (e.target) profileImg.src = e.target.result; };
    reader.readAsDataURL(fileInput.files[0]);
  }
}

function aplicarTravasInput() {
  const cpfInput = document.getElementById('reg-cpf');
  const nascimentoInput = document.getElementById('reg-nascimento');
  const cepInput = document.getElementById('end-cep');
  const telefoneInput = document.getElementById('contato-telefone');

  if (cpfInput) {
    cpfInput.addEventListener('input', (e) => {
      let v = e.target.value.replace(/\D/g, '');
      if (v.length > 11) v = v.substring(0, 11);
      v = v.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2');
      e.target.value = v;
    });
  }
  if (nascimentoInput) {
    nascimentoInput.addEventListener('input', (e) => {
      let v = e.target.value.replace(/\D/g, '');
      if (v.length > 8) v = v.substring(0, 8);
      v = v.replace(/(\d{2})(\d)/, '$1/$2').replace(/(\d{2})(\d)/, '$1/$2');
      e.target.value = v;
    });
  }
  if (cepInput) {
    cepInput.addEventListener('input', (e) => {
      let v = e.target.value.replace(/\D/g, '');
      if (v.length > 8) v = v.substring(0, 8);
      v = v.replace(/^(\d{5})(\d)/, '$1-$2');
      e.target.value = v;
    });
  }
  if (telefoneInput) {
    telefoneInput.addEventListener('input', (e) => {
      let v = e.target.value.replace(/\D/g, '');
      if (v.length > 11) v = v.substring(0, 11);
      v = v.replace(/^(\d{2})(\d)/g, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2');
      e.target.value = v;
    });
  }
}

function buscarCEP() {
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
  } catch (err) {
    showNotification(err.message || 'Erro ao salvar perfil.', 'error');
  }
  fecharModalSalvar();
}

function preencherFormulario(dados) {
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };

  // Converter data YYYY-MM-DD para DD/MM/YYYY
  let nascimentoFormatado = '';
  if (dados.nascimento) {
    const p = String(dados.nascimento).substring(0, 10).split('-');
    nascimentoFormatado = `${p[2]}/${p[1]}/${p[0]}`;
  }

  set('reg-nome', dados.nome);
  set('reg-cpf', dados.cpf);
  set('reg-nascimento', nascimentoFormatado);
  set('contato-email', dados.email);
  set('contato-telefone', dados.telefone);
  set('end-cep', dados.cep);
  set('end-logradouro', dados.logradouro);
  set('end-numero', dados.numero);
  set('end-bairro', dados.bairro);
  set('end-complemento', dados.complemento);
  set('end-cidade', dados.cidade);
  set('end-uf', dados.estado);

  const headerNome = document.getElementById('txt-nome-header');
  if (headerNome) headerNome.textContent = dados.nome || '';
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

  const formPerf = document.getElementById('form-perfil');
  if (formPerf) {
    formPerf.addEventListener('submit', (e) => {
      e.preventDefault();

      const cpfLimpo = document.getElementById('reg-cpf')?.value.replace(/\D/g, '') || '';
      const nascimentoLimpo = document.getElementById('reg-nascimento')?.value.replace(/\D/g, '') || '';
      const telefoneLimpo = document.getElementById('contato-telefone')?.value.replace(/\D/g, '') || '';
      const cepLimpo = document.getElementById('end-cep')?.value.replace(/\D/g, '') || '';

      if (cpfLimpo.length !== 11) { showNotification('CPF incompleto.', 'error'); return; }
      if (nascimentoLimpo.length !== 8) { showNotification('Data de nascimento incompleta.', 'error'); return; }
      if (telefoneLimpo.length !== 11) { showNotification('Telefone deve conter 11 dígitos.', 'error'); return; }
      if (cepLimpo.length !== 8) { showNotification('CEP incompleto.', 'error'); return; }

      const senha = document.getElementById('acesso-senha')?.value || '';
      const confirmar = document.getElementById('acesso-confirmar')?.value || '';
      if (senha !== confirmar) {
        showNotification('As senhas não coincidem!', 'error');
        const campoConf = document.getElementById('acesso-confirmar');
        if (campoConf) campoConf.style.borderColor = '#EF4444';
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
      };

      const modal = document.getElementById('modal-salvar');
      if (modal) modal.classList.add('active');
    });
  }
});
