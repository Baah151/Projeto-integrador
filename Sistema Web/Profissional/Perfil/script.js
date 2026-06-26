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

function set(id, valor) {
  const el = document.getElementById(id);
  if (el) el.value = valor || '';
}

function get(id) {
  return document.getElementById(id)?.value || '';
}

function popularFormulario(p) {
  set('email', p.email);
  set('telefone', p.telefone);
  set('cep', p.cep);
  set('rua', p.logradouro);
  set('numero', p.numero);
  set('complemento', p.complemento);
  set('bairro', p.bairro);
  set('cidade', p.cidade);
  set('uf', p.estado);
}

window.addEventListener('DOMContentLoaded', async () => {
  if (!verificarAutenticacao()) return;
  gerenciarMenuMobile();

  const bell = document.getElementById('bell-button');
  const notiDropdown = document.getElementById('noti-dropdown');
  if (bell && notiDropdown) {
    bell.addEventListener('click', (e) => { e.stopPropagation(); notiDropdown.classList.toggle('show'); });
    document.addEventListener('click', () => notiDropdown.classList.remove('show'));
  }

  const usuario = getUsuario();
  const profissionalId = usuario?.id;

  try {
    const profissional = await obterProfissional(profissionalId);
    popularFormulario(profissional);
    const emailInput = document.getElementById('email');
    if (emailInput) emailInput.readOnly = true;
  } catch (err) {
    showNotification(err.message || 'Erro ao carregar perfil.', 'error');
  }

  // Busca automática pelo CEP (ViaCEP)
  const cepInput = document.getElementById('cep');
  if (cepInput) {
    cepInput.addEventListener('blur', async () => {
      const cep = cepInput.value.replace(/\D/g, '');
      if (cep.length === 8) {
        try {
          const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
          const dados = await res.json();
          if (!dados.erro) {
            set('rua', dados.logradouro);
            set('bairro', dados.bairro);
            set('cidade', dados.localidade);
            set('uf', dados.uf);
          }
        } catch {}
      }
    });
  }

  // Form 1: Contatos e Segurança (telefone + senha)
  const formContatos = document.getElementById('form-dados-seguranca');
  if (formContatos) {
    formContatos.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = formContatos.querySelector('button[type="submit"]');
      if (btn) { btn.textContent = 'Salvando...'; btn.disabled = true; }

      const senhaAtual = get('senha-atual');
      const novaSenha = get('nova-senha');
      const confirmaSenha = get('confirma-senha');

      if (novaSenha && novaSenha !== confirmaSenha) {
        showNotification('As senhas não coincidem.', 'error');
        if (btn) { btn.textContent = 'Salvar Dados'; btn.disabled = false; }
        return;
      }

      const dados = { telefone: get('telefone') };
      if (novaSenha && senhaAtual) {
        dados.senha_atual = senhaAtual;
        dados.nova_senha = novaSenha;
      }

      try {
        await atualizarProfissional(profissionalId, dados);
        showNotification('Dados atualizados com sucesso!');
        document.getElementById('senha-atual').value = '';
        document.getElementById('nova-senha').value = '';
        document.getElementById('confirma-senha').value = '';
      } catch (err) {
        showNotification(err.message || 'Erro ao salvar.', 'error');
      } finally {
        if (btn) { btn.textContent = 'Salvar Dados'; btn.disabled = false; }
      }
    });
  }

  // Form 2: Endereço
  const formEndereco = document.getElementById('form-endereco');
  if (formEndereco) {
    formEndereco.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = formEndereco.querySelector('button[type="submit"]');
      if (btn) { btn.textContent = 'Salvando...'; btn.disabled = true; }

      const dados = {
        cep: get('cep'),
        logradouro: get('rua'),
        numero: get('numero'),
        complemento: get('complemento'),
        bairro: get('bairro'),
        cidade: get('cidade'),
        estado: get('uf'),
      };

      try {
        await atualizarProfissional(profissionalId, dados);
        showNotification('Endereço atualizado com sucesso!');
      } catch (err) {
        showNotification(err.message || 'Erro ao salvar.', 'error');
      } finally {
        if (btn) { btn.textContent = 'Atualizar Endereço'; btn.disabled = false; }
      }
    });
  }

  // Toggle visibilidade das senhas
  document.querySelectorAll('.eye-icon').forEach(icon => {
    icon.addEventListener('click', () => {
      const input = icon.previousElementSibling;
      if (!input) return;
      if (input.type === 'password') {
        input.type = 'text';
        icon.textContent = 'visibility_off';
      } else {
        input.type = 'password';
        icon.textContent = 'visibility';
      }
    });
  });
});
