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

function formatarDataBR(dataString) {
  if (!dataString) return '--/--/----';
  const p = String(dataString).substring(0, 10).split('-');
  return `${p[2]}/${p[1]}/${p[0]}`;
}

function formatarDataHora(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  const dia = String(d.getDate()).padStart(2, '0');
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const ano = String(d.getFullYear()).slice(2);
  const hora = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${dia}/${mes}/${ano} ${hora}:${min}`;
}

// ─── Mapeamento de status ─────────────────────────────────────────

const STATUS_MAP = {
  'Agendado':   { label: 'Aguardando',   cls: 'badge-aguardando' },
  'Confirmado': { label: 'Em Andamento', cls: 'badge-andamento' },
  'Finalizado': { label: 'Finalizada',   cls: 'badge-finalizada' },
  'Cancelado':  { label: 'Cancelada',    cls: 'badge-cancelada' },
  'Pendente':   { label: 'Pend. Ajuste', cls: 'badge-pendente' },
};

function getStatusInfo(status) {
  return STATUS_MAP[status] || { label: status, cls: 'badge-aguardando' };
}

// ─── Mapeamento de tipos de trâmite ───────────────────────────────

const TRAMITE_MAP = {
  'sistema':    { icon: 'info',          cls: 'tramite-sistema',    label: 'Sistema' },
  'informacao': { icon: 'chat_bubble',   cls: 'tramite-informacao', label: 'Informação' },
  'documento':  { icon: 'attach_file',   cls: 'tramite-documento',  label: 'Documento' },
  'solucao':    { icon: 'check_circle',  cls: 'tramite-solucao',    label: 'Solução' },
};

function getTramiteInfo(tipo) {
  return TRAMITE_MAP[tipo] || TRAMITE_MAP['informacao'];
}

// ─── Estado global ────────────────────────────────────────────────

let consultasLista = [];
let consultaSelecionada = null;
let filtroAtivo = 'todos';
let buscaAtiva = '';
let ordemAtiva = 'data_desc';

// ─── Renderizar lista de consultas ────────────────────────────────

function renderizarLista(lista) {
  const container = document.getElementById('lista-items');
  const vazio = document.getElementById('lista-vazia');
  const loading = document.getElementById('lista-loading');

  if (loading) loading.style.display = 'none';
  if (!container) return;

  container.innerHTML = '';

  if (!lista || lista.length === 0) {
    if (vazio) vazio.style.display = 'flex';
    return;
  }
  if (vazio) vazio.style.display = 'none';

  lista.forEach(c => {
    const statusInfo = getStatusInfo(c.status);
    const reagendada = c.id_reagendado_de ? `<span class="item-reagendada-tag">Reagendada</span>` : '';
    const numTramites = Number(c.num_tramites) || 0;

    const item = document.createElement('div');
    item.className = 'lista-item';
    if (consultaSelecionada?.id_agendamento === c.id_agendamento) {
      item.classList.add('lista-item-ativo');
    }
    item.innerHTML = `
      <div class="item-header">
        <span class="item-codigo">${c.codigo}</span>
        <span class="status-badge ${statusInfo.cls}">${statusInfo.label}</span>
        ${reagendada}
      </div>
      <div class="item-paciente">${c.nome_paciente || '--'}</div>
      <div class="item-meta">
        <span class="material-symbols-outlined" style="font-size:13px;vertical-align:middle;color:#9CA3AF;">calendar_today</span>
        ${formatarDataBR(c.data_consulta)} às ${c.horario ? String(c.horario).substring(0, 5) : '--'}
      </div>
      <div class="item-footer">
        <span class="item-tramites-badge">
          <span class="material-symbols-outlined" style="font-size:12px;vertical-align:middle;">receipt_long</span>
          ${numTramites} trâmite${numTramites !== 1 ? 's' : ''}
        </span>
      </div>
    `;
    item.addEventListener('click', () => selecionarConsulta(c));
    container.appendChild(item);
  });
}

// ─── Selecionar consulta e carregar trâmites ──────────────────────

async function selecionarConsulta(consulta) {
  consultaSelecionada = consulta;

  // Destacar item ativo na lista
  document.querySelectorAll('.lista-item').forEach(el => el.classList.remove('lista-item-ativo'));
  document.querySelectorAll('.lista-item').forEach(el => {
    if (el.querySelector('.item-codigo')?.textContent === consulta.codigo) {
      el.classList.add('lista-item-ativo');
    }
  });

  // Abrir painel de detalhe (overlay só ativo no mobile)
  document.getElementById('painel-detalhe')?.classList.add('aberto');
  if (window.innerWidth <= 768) {
    document.getElementById('detalhe-overlay')?.classList.add('ativo');
  }

  // Mostrar conteúdo
  document.getElementById('detalhe-vazio').style.display = 'none';
  document.getElementById('detalhe-conteudo').style.display = 'block';

  // Preencher header
  document.getElementById('d-codigo').textContent = consulta.codigo;

  const statusInfo = getStatusInfo(consulta.status);
  const badge = document.getElementById('d-status-badge');
  badge.textContent = statusInfo.label;
  badge.className = `detalhe-status-badge ${statusInfo.cls}`;

  // Badge reagendada
  const reagBadge = document.getElementById('d-reagendada-badge');
  if (consulta.id_reagendado_de) {
    reagBadge.style.display = 'inline-flex';
  } else {
    reagBadge.style.display = 'none';
  }

  document.getElementById('d-paciente').textContent = consulta.nome_paciente || '--';
  document.getElementById('d-data-hora').textContent =
    `${formatarDataBR(consulta.data_consulta)} às ${consulta.horario ? String(consulta.horario).substring(0, 5) : '--'}`;

  // Info sessão (pagamento)
  const sessaoInfo = document.getElementById('d-sessao-info');
  const sessaoTexto = document.getElementById('d-sessao-texto');
  if (consulta.id_sessao && consulta.valor_sessao) {
    const valor = `R$ ${parseFloat(consulta.valor_sessao).toFixed(2).replace('.', ',')}`;
    const forma = consulta.forma_pagamento || '';
    const statusPag = consulta.status_pagamento || '';
    sessaoTexto.textContent = `${valor} via ${forma} — ${statusPag}`;
    sessaoInfo.style.display = 'flex';
  } else {
    sessaoInfo.style.display = 'none';
  }

  // Info reagendamento de origem
  const reagendouDe = document.getElementById('d-reagendou-de');
  const reagendouDeTexto = document.getElementById('d-reagendou-de-texto');
  if (consulta.id_reagendado_de) {
    const numOrigem = consulta.num_reagendado_de ?? consulta.id_reagendado_de;
    const origemCode = `CON-${String(numOrigem).padStart(4, '0')}`;
    reagendouDeTexto.textContent = `Reagendada a partir da consulta ${origemCode}`;
    reagendouDe.style.display = 'flex';
  } else {
    reagendouDe.style.display = 'none';
  }

  // Botão adicionar trâmite: só consultas abertas
  const addSection = document.getElementById('add-tramite-section');
  const aberta = ['Agendado', 'Confirmado', 'Pendente'].includes(consulta.status);
  if (addSection) addSection.style.display = aberta ? 'block' : 'none';

  // Limpar e carregar trâmites
  document.getElementById('tramites-loading').style.display = 'block';
  document.getElementById('tramites-lista').innerHTML = '';
  document.getElementById('tramites-vazio').style.display = 'none';
  document.getElementById('tramite-descricao').value = '';

  try {
    const tramites = await listarTramites(consulta.id_agendamento);
    renderizarTramites(tramites, consulta.id_agendamento);
  } catch {
    document.getElementById('tramites-loading').style.display = 'none';
    document.getElementById('tramites-lista').innerHTML =
      '<p style="color:#ef4444;font-size:0.82rem;padding:12px;">Erro ao carregar trâmites.</p>';
  }
}

// ─── Renderizar trâmites ──────────────────────────────────────────

function renderizarTramites(tramites, idAgendamento) {
  const loading = document.getElementById('tramites-loading');
  const vazio = document.getElementById('tramites-vazio');
  const lista = document.getElementById('tramites-lista');
  const count = document.getElementById('tramites-count');

  if (loading) loading.style.display = 'none';
  if (count) count.textContent = tramites.length;

  if (!tramites || tramites.length === 0) {
    if (vazio) vazio.style.display = 'block';
    return;
  }
  if (vazio) vazio.style.display = 'none';

  lista.innerHTML = '';
  tramites.forEach(t => {
    const info = getTramiteInfo(t.tipo);
    const item = document.createElement('div');
    item.className = `tramite-item ${info.cls}`;
    item.innerHTML = `
      <div class="tramite-num-col">
        <div class="tramite-num">Nº ${String(t.numero_tramite).padStart(2, '0')}</div>
        <div class="tramite-linha-vert"></div>
      </div>
      <div class="tramite-body">
        <div class="tramite-header">
          <span class="tramite-tipo-badge">
            <span class="material-symbols-outlined" style="font-size:13px;vertical-align:middle;">${info.icon}</span>
            ${info.label}
          </span>
          <span class="tramite-meta">${t.usuario_nome || 'Sistema'} · ${formatarDataHora(t.criado_em)}</span>
        </div>
        <div class="tramite-descricao">${t.descricao}</div>
      </div>
    `;
    lista.appendChild(item);
  });

  // Rolar para o último
  lista.scrollTop = lista.scrollHeight;
}

// ─── Carregar consultas da API ────────────────────────────────────

async function carregarConsultas() {
  document.getElementById('lista-loading').style.display = 'flex';
  document.getElementById('lista-vazia').style.display = 'none';
  document.getElementById('lista-items').innerHTML = '';

  const params = {};
  if (filtroAtivo !== 'todos') params.status = filtroAtivo;
  if (buscaAtiva.trim()) params.busca = buscaAtiva.trim();
  if (ordemAtiva !== 'data_desc') params.ordem = ordemAtiva;

  try {
    consultasLista = await listarConsultas(params);
    renderizarLista(consultasLista);
  } catch (err) {
    document.getElementById('lista-loading').style.display = 'none';
    showNotification(err.message || 'Erro ao carregar consultas.', 'error');
  }
}

// ─── DOMContentLoaded ─────────────────────────────────────────────

window.addEventListener('DOMContentLoaded', async () => {
  if (!verificarAutenticacao()) return;
  gerenciarMenuMobile();

  const dropdownBody = document.getElementById('dropdown-body');
  if (dropdownBody) dropdownBody.innerHTML = '<div style="text-align:center;color:#9ca3af;padding:12px;font-size:0.82rem;">Nenhuma notificação.</div>';

  const bell = document.getElementById('bell-button');
  const notiDropdown = document.getElementById('noti-dropdown');
  if (bell && notiDropdown) {
    bell.addEventListener('click', e => { e.stopPropagation(); notiDropdown.classList.toggle('show'); });
    document.addEventListener('click', () => notiDropdown.classList.remove('show'));
  }

  // Filtros de status
  document.querySelectorAll('.pill').forEach(pill => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('.pill').forEach(p => p.classList.remove('pill-ativo'));
      pill.classList.add('pill-ativo');
      filtroAtivo = pill.dataset.status;
      carregarConsultas();
    });
  });

  // Ordenação
  document.getElementById('ordem-select')?.addEventListener('change', e => {
    ordemAtiva = e.target.value;
    carregarConsultas();
  });

  // Busca com debounce
  let buscaTimer;
  document.getElementById('busca-input')?.addEventListener('input', e => {
    clearTimeout(buscaTimer);
    buscaTimer = setTimeout(() => {
      buscaAtiva = e.target.value;
      carregarConsultas();
    }, 400);
  });

  // Fechar painel detalhe (mobile)
  document.getElementById('btn-fechar-detalhe')?.addEventListener('click', fecharDetalhe);
  document.getElementById('detalhe-overlay')?.addEventListener('click', fecharDetalhe);

  // Adicionar trâmite
  document.getElementById('btn-add-tramite')?.addEventListener('click', async () => {
    if (!consultaSelecionada) return;
    const tipo = document.getElementById('tramite-tipo').value;
    const descricao = document.getElementById('tramite-descricao').value.trim();

    if (!descricao) {
      showNotification('Informe a descrição do trâmite.', 'error');
      return;
    }

    const btn = document.getElementById('btn-add-tramite');
    btn.disabled = true;

    try {
      const tramites = await criarTramite(consultaSelecionada.id_agendamento, {
        tipo,
        descricao,
        usuario_nome: 'Profissional',
      });

      renderizarTramites(Array.isArray(tramites) ? tramites : [], consultaSelecionada.id_agendamento);

      // Atualizar contador na lista
      const idx = consultasLista.findIndex(c => c.id_agendamento === consultaSelecionada.id_agendamento);
      if (idx >= 0) {
        consultasLista[idx].num_tramites = (Number(consultasLista[idx].num_tramites) || 0) + 1;
        renderizarLista(consultasLista);
        // Restaurar seleção visual
        document.querySelectorAll('.lista-item').forEach(el => {
          if (el.querySelector('.item-codigo')?.textContent === consultaSelecionada.codigo) {
            el.classList.add('lista-item-ativo');
          }
        });
      }

      document.getElementById('tramite-descricao').value = '';
      showNotification('Trâmite registrado com sucesso!');
    } catch (err) {
      showNotification(err.message || 'Erro ao registrar trâmite.', 'error');
    } finally {
      btn.disabled = false;
    }
  });

  await carregarConsultas();
});

function fecharDetalhe() {
  if (window.innerWidth <= 768) {
    document.getElementById('painel-detalhe')?.classList.remove('aberto');
    document.getElementById('detalhe-overlay')?.classList.remove('ativo');
    consultaSelecionada = null;
    document.querySelectorAll('.lista-item').forEach(el => el.classList.remove('lista-item-ativo'));
  }
}
