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

function popularFormulario(p) {
  const campos = ['nome', 'email', 'telefone', 'cpf', 'nascimento', 'cep', 'logradouro', 'numero', 'bairro', 'complemento', 'cidade', 'estado', 'especialidade', 'registro'];
  campos.forEach(c => {
    const el = document.getElementById(`perfil-${c}`) || document.getElementById(c);
    if (el) el.value = p[c] || '';
  });
  const nomeHeader = document.getElementById('perfil-nome-header') || document.getElementById('nome-header');
  if (nomeHeader) nomeHeader.textContent = p.nome || '--';
  const emailHeader = document.getElementById('perfil-email-header') || document.getElementById('email-header');
  if (emailHeader) emailHeader.textContent = p.email || '--';
}

window.addEventListener('DOMContentLoaded', async () => {
  if (!verificarAutenticacao()) return;
  gerenciarMenuMobile();

  const dropdownBody = document.getElementById('dropdown-body');
  if (dropdownBody) dropdownBody.innerHTML = '<div class="dropdown-item" style="text-align:center;color:#9ca3af;">Nenhuma notificação.</div>';

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
  } catch (err) {
    showNotification(err.message || 'Erro ao carregar perfil.', 'error');
  }

  const cepInput = document.getElementById('perfil-cep') || document.getElementById('cep');
  if (cepInput) {
    cepInput.addEventListener('blur', async () => {
      const cep = cepInput.value.replace(/\D/g, '');
      if (cep.length === 8) {
        try {
          const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
          const dados = await res.json();
          if (!dados.erro) {
            const set = (suf, v) => {
              const e = document.getElementById(`perfil-${suf}`) || document.getElementById(suf);
              if (e) e.value = v;
            };
            set('logradouro', dados.logradouro || '');
            set('bairro', dados.bairro || '');
            set('cidade', dados.localidade || '');
            set('estado', dados.uf || '');
          }
        } catch {}
      }
    });
  }

  const form = document.getElementById('form-perfil') || document.getElementById('perfil-form');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = form.querySelector('button[type="submit"]');
      if (btn) { btn.textContent = 'Salvando...'; btn.disabled = true; }

      const dados = {};
      const campos = ['nome', 'email', 'telefone', 'cpf', 'nascimento', 'cep', 'logradouro', 'numero', 'bairro', 'complemento', 'cidade', 'estado', 'especialidade', 'registro'];
      campos.forEach(c => {
        const el = document.getElementById(`perfil-${c}`) || document.getElementById(c);
        if (el) dados[c] = el.value;
      });

      try {
        await atualizarProfissional(profissionalId, dados);
        showNotification('Perfil atualizado com sucesso!');

        const nomeHeader = document.getElementById('perfil-nome-header') || document.getElementById('nome-header');
        if (nomeHeader && dados.nome) nomeHeader.textContent = dados.nome;
      } catch (err) {
        showNotification(err.message || 'Erro ao salvar.', 'error');
      } finally {
        if (btn) { btn.textContent = 'Salvar Alterações'; btn.disabled = false; }
      }
    });
  }
});
