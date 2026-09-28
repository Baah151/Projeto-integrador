let pacienteAtual = null;
let consultaSelecionada = null;
let documentosPaciente = [];
let historicoSessoes = [];
let horarioAgendarEscolhido = null; // Guarda o horário dinâmico selecionado da grid

function calcularIdade(nascimento) {
  if (!nascimento) return '--';
  const nasc = new Date(String(nascimento).substring(0, 10));
  const hoje = new Date();
  let idade = hoje.getFullYear() - nasc.getFullYear();
  const m = hoje.getMonth() - nasc.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--;
  return idade;
}

function formatarDataBR(dataString) {
  if (!dataString) return '--/--/----';
  const p = String(dataString).substring(0, 10).split('-');
  return `${p[2]}/${p[1]}/${p[0]}`;
}

function popularHeader(p) {
  const el = (id) => document.getElementById(id);
  if (el('detalhe-nome-header')) el('detalhe-nome-header').textContent = p.nome || '--';
  if (el('detalhe-sub-registro')) {
    el('detalhe-sub-registro').textContent = `Idade: ${calcularIdade(p.nascimento)} anos • Nasc: ${formatarDataBR(p.nascimento)}`;
  }
  const cpfDisplay = document.getElementById('prontuario-cpf-display');
  if (cpfDisplay) cpfDisplay.textContent = '•••.•••.•••-••';
  const btnRevealCpf = document.getElementById('btn-reveal-cpf-prontuario');
  if (btnRevealCpf) btnRevealCpf.innerHTML = '<span class="material-symbols-outlined" style="font-size:16px;">lock</span>';
  if (el('detalhe-txt-telefone')) el('detalhe-txt-telefone').textContent = p.telefone || '--';
  if (el('detalhe-txt-email')) el('detalhe-txt-email').textContent = p.email || '--';
  const endereco = [p.logradouro, p.numero, p.bairro, p.cidade, p.estado].filter(Boolean).join(', ');
  if (el('detalhe-txt-endereco')) el('detalhe-txt-endereco').textContent = endereco || 'Endereço não informado';
  
  const blocoAlertas = document.getElementById('bloco-alertas');
  const txtObs = el('txt-observacoes-clinicas');
  if (txtObs && blocoAlertas) {
    if (p.observacoes && p.observacoes.trim() !== '') {
      txtObs.textContent = p.observacoes;
      blocoAlertas.className = 'clinical-alert'; 
    } else {
      txtObs.textContent = 'Nenhuma observação cadastrada para este paciente.';
      blocoAlertas.className = 'clinical-alert empty-alert'; 
    }
  }
}

function popularModalEditar(p) {
  const campos = ['nome', 'email', 'telefone', 'cep', 'logradouro', 'numero', 'bairro', 'complemento', 'cidade', 'estado'];
  campos.forEach(c => {
    const el = document.getElementById(`edit-${c}`);
    if (el) el.value = p[c] || '';
  });
  
  const elNasc = document.getElementById('edit-nascimento');
  if (elNasc && p.nascimento) {
    elNasc.value = String(p.nascimento).substring(0, 10);
  } else if (elNasc) {
    elNasc.value = '';
  }

  const obs = document.getElementById('edit-obs-clinicas');
  if (obs) obs.value = p.observacoes || '';
}

function abrirModalTramite(h) {
  consultaSelecionada = h;
  const modal = document.getElementById('modal-editar-tramite');
  const info = document.getElementById('tramite-info-sessao');
  if (info) info.textContent = `Sessão de ${formatarDataBR(h.data_consulta)} às ${String(h.horario || '').substring(0, 5)}`;
  
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };
  
  set('tramite-diagnostico', h.descricao_sessao);
  set('tramite-prescricao', h.orientacoes_paciente);
  set('tramite-observacoes', h.observacoes_internas);
  set('tramite-plano-proximo', h.texto_prescricao);
  set('tramite-medicamentos', h.medicamentos_suplementos);
  
  modal?.classList.add('active');
}

function renderizarHistorico(historico, filtroMes) {
  const container = document.getElementById('timeline-container');
  const empty = document.getElementById('timeline-empty');
  if (!container) return;

  container.querySelectorAll('.timeline-item').forEach(i => i.remove());

  let lista = historico || [];
  
  if (filtroMes && filtroMes.trim() !== "") {
    lista = lista.filter(h => h.data_consulta && String(h.data_consulta).substring(0, 7) === filtroMes);
  }

  if (lista.length === 0) {
    if (empty) empty.style.display = 'flex';
    return;
  }
  if (empty) empty.style.display = 'none';

  lista.forEach(h => {
    const idAgendamento = h.id_agendamento;
    const docsSession = documentosPaciente.filter(d => d.id_agendamento != null && String(d.id_agendamento) === String(idAgendamento));

    let docsHtml = '';
    if (docsSession.length > 0) {
      const items = docsSession.map(d => `
        <div class="doc-sessao-item" data-id="${d.id_documento}" style="display:flex;align-items:center;gap:8px;padding:5px 8px;background:#f0fdf4;border:1px solid #d1fae5;border-radius:8px;margin-top:5px;">
          <span style="font-size:0.8rem;color:#374151;flex:1;">📎 ${d.nome_arquivo} <small style="color:#9CA3AF;">${formatarBytes(d.tamanho_bytes)}</small></span>
          <button class="btn-dl-doc" data-id="${d.id_documento}" style="background:#046C4E;color:white;border:none;padding:3px 10px;border-radius:6px;font-size:0.72rem;font-weight:600;cursor:pointer;">Baixar</button>
        </div>`).join('');
      docsHtml = `<div style="margin-top:10px;"><p style="font-size:0.72rem;font-weight:700;color:#046C4E;margin:0 0 4px 0;text-transform:uppercase;letter-spacing:0.04em;">Documentos desta sessão</p>${items}</div>`;
    }

    const descReal = h.descricao_sessao || 'Atendimento finalizado.';
    const orientacoesReal = h.orientacoes_paciente;

    const div = document.createElement('div');
    div.className = 'timeline-item';
    div.innerHTML = `
      <div class="timeline-dot"></div>
      <div class="timeline-content" style="border: 1px solid #E5E7EB; border-radius: 12px; padding: 16px; background: white; margin-bottom: 15px; box-shadow: 0 1px 3px rgba(0,0,0,0.02);">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; border-bottom: 1px dashed #F3F4F6; padding-bottom: 8px;">
          <div class="timeline-date" style="font-weight:700; color:#046C4E; font-size:0.9rem;">📅 SESSÃO EM ${formatarDataBR(h.data_consulta)}</div>
          <button class="btn-edit-tramite" style="background:#E6F4EA; border:none; color:#137333; padding:5px 14px; border-radius:8px; font-size:0.78rem; font-weight:600; cursor:pointer; transition: all 0.2s;">Visualizar</button>
        </div>
        
        <div style="margin-bottom: 8px;">
          <span style="font-size: 0.72rem; text-transform: uppercase; color: #9CA3AF; font-weight: 700; display: block; letter-spacing: 0.03em;">Realizado na Sessão</span>
          <p class="timeline-desc" style="margin: 3px 0 0 0; font-size: 0.85rem; color: #374151; line-height: 1.4;">${descReal}</p>
        </div>

        ${orientacoesReal ? `
        <div style="margin-top:10px; padding:10px; background:#F0FDF4; border-left:3px solid #10B981; border-radius:4px; font-size:0.8rem; color:#046C4E;">
          <strong>💡 Orientações passadas:</strong> ${orientacoesReal}
        </div>` : ''}

        ${docsHtml}
        ${h.valor ? `<div style="text-align: right; margin-top: 10px;"><span class="timeline-valor" style="display:inline-block; font-size: 0.78rem; background: #F3F4F6; color: #4B5563; padding: 3px 8px; border-radius: 6px; font-weight: 600;">R$ ${parseFloat(h.valor).toFixed(2).replace('.', ',')}</span></div>` : ''}
      </div>
    `;
    div.querySelector('.btn-edit-tramite').addEventListener('click', () => abrirModalTramite(h));
    docsSession.forEach(d => {
      div.querySelector(`.btn-dl-doc[data-id="${d.id_documento}"]`)
        ?.addEventListener('click', () => downloadDocumento(d));
    });
    container.appendChild(div);
  });
}

function formatarBytes(bytes) {
  if (!bytes) return '';
  return bytes > 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`;
}

async function downloadDocumento(docMeta) {
  try {
    const doc = await apiRequest('GET', `/documentos/${docMeta.id_documento}/download`);
    if (!doc?.conteudo_base64) { showNotification('Arquivo sem conteúdo.', 'error'); return; }
    const link = document.createElement('a');
    link.href = `data:${doc.tipo_arquivo || 'application/octet-stream'};base64,${doc.conteudo_base64}`;
    link.download = doc.nome_arquivo;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch { showNotification('Erro ao baixar arquivo.', 'error'); }
}

async function renderizarLaudos(pacienteId) {
  const container = document.getElementById('laudos-container');
  const empty = document.getElementById('laudos-empty');
  if (!container) return;

  try {
    const docs = await apiRequest('GET', `/documentos/paciente/${pacienteId}`) || [];
    documentosPaciente = docs;
    container.querySelectorAll('.laudo-item').forEach(i => i.remove());

    if (docs.length === 0) {
      if (empty) empty.style.display = 'flex';
      return;
    }
    if (empty) empty.style.display = 'none';

    docs.forEach(d => {
      const item = document.createElement('div');
      item.className = 'laudo-item';
      item.style.cssText = 'display:flex;justify-content:space-between;align-items:center;padding:12px 16px;background:#FAFCF8;border:1px solid #E5E7EB;border-radius:12px;margin-bottom:8px;';
      item.innerHTML = `
        <div>
          <span style="font-size:0.85rem;font-weight:600;color:#1F2937;">📎 ${d.nome_arquivo}</span>
          <span style="display:block;font-size:0.75rem;color:#9CA3AF;margin-top:2px;">${formatarBytes(d.tamanho_bytes)} • ${formatarDataBR(d.data_upload)}</span>
        </div>
        <div style="display:flex;gap:8px;">
          <button class="btn-dl" style="background:#046C4E;color:white;border:none;padding:6px 14px;border-radius:8px;font-size:0.78rem;font-weight:600;cursor:pointer;">Download</button>
          <button class="btn-rm" style="background:#fef2f2;color:#ef4444;border:1px solid #fecaca;padding:6px 10px;border-radius:8px;font-size:0.78rem;cursor:pointer;">×</button>
        </div>
      `;
      item.querySelector('.btn-dl').addEventListener('click', () => downloadDocumento(d));
      item.querySelector('.btn-rm').addEventListener('click', async () => {
        if (!confirm(`Remover "${d.nome_arquivo}"?`)) return;
        try {
          await apiRequest('DELETE', `/documentos/${d.id_documento}?pacienteId=${pacienteId}`);
          showNotification('Documento removido.');
          documentosPaciente = documentosPaciente.filter(x => x.id_documento !== d.id_documento);
          carregarDadosHistorico(pacienteId);
          renderizarLaudos(pacienteId);
        } catch (err) { showNotification(err.message || 'Erro ao remover.', 'error'); }
      });
      container.appendChild(item);
    });
  } catch (err) {
    if (empty) { empty.style.display = 'flex'; empty.querySelector('p').textContent = 'Erro ao carregar documentos.'; }
  }
}

function configurarModalEditar(pacienteId) {
  const overlayEditar = document.getElementById('modal-editar');
  const overlayConfirmar = document.getElementById('modal-confirmar-salvar');
  const btnAbrir = document.getElementById('btn-abrir-editar');
  const btnFechar = document.getElementById('btn-fechar-editar');
  const form = document.getElementById('form-editar-dados');
  const btnCancelarConf = document.getElementById('btn-cancelar-confirmacao');
  const btnConcluirSalv = document.getElementById('btn-concluir-salvamento');

  const editCep = document.getElementById('edit-cep');
  if (editCep) {
    editCep.addEventListener('blur', async () => {
      const cep = editCep.value.replace(/\D/g, '');
      if (cep.length === 8) {
        try {
          const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
          const dados = await res.json();
          if (!dados.erro) {
            const set = (id, v) => { const e = document.getElementById(id); if (e) e.value = v; };
            set('edit-logradouro', dados.logradouro || '');
            set('edit-bairro', dados.bairro || '');
            set('edit-cidade', dados.localidade || '');
            set('edit-estado', dados.uf || '');
          }
        } catch {}
      }
    });
  }

  if (btnAbrir) btnAbrir.addEventListener('click', () => { popularModalEditar(pacienteAtual || {}); overlayEditar.classList.add('active'); });
  if (btnFechar) btnFechar.addEventListener('click', () => overlayEditar.classList.remove('active'));

  let dadosPendentes = null;

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      dadosPendentes = {
        nome: document.getElementById('edit-nome')?.value.trim(),
        nascimento: document.getElementById('edit-nascimento')?.value || pacienteAtual?.nascimento,
        email: document.getElementById('edit-email')?.value.trim(),
        telefone: document.getElementById('edit-telefone')?.value,
        cep: document.getElementById('edit-cep')?.value,
        logradouro: document.getElementById('edit-logradouro')?.value,
        numero: document.getElementById('edit-numero')?.value,
        bairro: document.getElementById('edit-bairro')?.value,
        complemento: document.getElementById('edit-complemento')?.value,
        cidade: document.getElementById('edit-cidade')?.value,
        estado: document.getElementById('edit-estado')?.value,
        observacoes: document.getElementById('edit-obs-clinicas')?.value,
      };
      overlayEditar.classList.remove('active');
      overlayConfirmar.classList.add('active');
    });
  }

  if (btnCancelarConf) btnCancelarConf.addEventListener('click', () => { overlayConfirmar.classList.remove('active'); overlayEditar.classList.add('active'); });

  if (btnConcluirSalv) {
    const novoBotao = btnConcluirSalv.cloneNode(true);
    btnConcluirSalv.parentNode.replaceChild(novoBotao, btnConcluirSalv);

    novoBotao.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      if (!dadosPendentes) return;
      novoBotao.textContent = 'Salvando...';
      novoBotao.disabled = true;
      try {
        await atualizarPaciente(pacienteId, dadosPendentes);
        
        pacienteAtual = await buscarPaciente(pacienteId);
        popularHeader(pacienteAtual);

        await carregarDadosHistorico(pacienteId);

        showNotification('Dados atualizados com sucesso!');
        overlayConfirmar.classList.remove('active');
      } catch (err) {
        showNotification(err.message || 'Erro ao salvar.', 'error');
        overlayConfirmar.classList.remove('active');
        overlayEditar.classList.add('active');
      } finally {
        novoBotao.textContent = 'Finalizar Alteração';
        novoBotao.disabled = false;
      }
    });
  }
}

function configurarModalExcluir(pacienteId) {
  const overlay = document.getElementById('modal-excluir');
  const btnAbrir = document.getElementById('btn-abrir-excluir');
  const btnCancelar = document.getElementById('btn-cancelar-exclusao');
  const btnConcluir = document.getElementById('btn-concluir-exclusao');

  if (btnAbrir) btnAbrir.addEventListener('click', () => overlay.classList.add('active'));
  if (btnCancelar) btnCancelar.addEventListener('click', () => overlay.classList.remove('active'));

  if (btnConcluir) {
    btnConcluir.addEventListener('click', async () => {
      const motivo = document.getElementById('excluir-motivo')?.value;
      if (!motivo) { showNotification('Selecione um motivo.', 'error'); return; }
      btnConcluir.textContent = 'Excluindo...';
      btnConcluir.disabled = true;
      try {
        await deletarPaciente(pacienteId);
        showNotification('Paciente excluído com sucesso!');
        setTimeout(() => { window.location.href = '../pacientes/index.html'; }, 1200);
      } catch (err) {
        showNotification(err.message || 'Erro ao excluir.', 'error');
        btnConcluir.textContent = 'Finalizar Exclusão';
        btnConcluir.disabled = false;
        overlay.classList.remove('active');
      }
    });
  }
}

// ─── TRANSCRIÇÃO DAS REGRAS DE INTEGRAÇÃO DO AGENDADOS ───

function obterAtendimentosConfigurados() {
  const salvos = localStorage.getItem('agenda_atendimentos');
  return salvos ? JSON.parse(salvos) : ['Fisioterapia Geral', 'Avaliação Inicial', 'Pilates Solo'];
}

function obterAtendimentoDoSlot(data, horario) {
  const mapa = JSON.parse(localStorage.getItem('mapa_atendimentos_slots') || '{}');
  const dataLimpa = String(data).substring(0, 10);
  const horaLimpa = String(horario).substring(0, 5);
  return mapa[`${dataLimpa}_${horaLimpa}`];
}

function popularDropdownAgendamento() {
  const select = document.getElementById('agendar-servico-select');
  if (!select) return;
  const atendimentos = obterAtendimentosConfigurados();
  select.innerHTML = '<option value="" disabled selected>Selecione o tipo de atendimento</option>';
  atendimentos.forEach(atend => {
    const opt = document.createElement('option');
    opt.value = atend;
    opt.textContent = atend;
    select.appendChild(opt);
  });
}

async function buscarHorariosLivresAgendar(dataSelecionada, servicoSelecionado) {
  const grid = document.getElementById('agendar-horarios-grid');
  const btnConcluir = document.getElementById('btn-concluir-agendar');
  if (!grid) return;

  if (!dataSelecionada || !servicoSelecionado) {
    grid.innerHTML = '<p style="color:#9CA3AF; font-size:0.8rem; padding: 10px; text-align:center; width: 100%; grid-column:1/-1; margin:0;">Escolha um serviço e uma data para ver os horários livres.</p>';
    return;
  }

  grid.innerHTML = '<p style="color:#9CA3AF; font-size:0.85rem; padding:10px; grid-column:1/-1; text-align:center; margin:0;">Buscando horários...</p>';
  horarioAgendarEscolhido = null;
  if (btnConcluir) btnConcluir.disabled = true;

  try {
    const slots = await apiRequest('GET', '/agendamentos/disponibilidade') || [];
    
    const horariosDoDia = slots.filter(s => {
      const dataMatch = String(s.data_disponivel).substring(0, 10) === dataSelecionada;
      const tipoDoSlot = s.servico || s.especialidade || s.tipo || s.tipo_atendimento || obterAtendimentoDoSlot(s.data_disponivel, s.horario) || 'Fisioterapia Geral';
      return dataMatch && tipoDoSlot === servicoSelecionado;
    });

    grid.innerHTML = "";
    if (horariosDoDia.length === 0) {
      grid.innerHTML = `<p style="color:#DC2626; font-size:0.85rem; padding:10px; text-align:center; width: 100%; grid-column:1/-1; margin:0;">Nenhum horário de "${servicoSelecionado}" cadastrado para esta data.</p>`;
      return;
    }

    let todosAgendamentos = await apiRequest('GET', '/agendamentos').catch(() => []) || [];

    horariosDoDia.sort((a, b) => String(a.horario).localeCompare(String(b.horario))).forEach(slot => {
      const hora = String(slot.horario).substring(0, 5);
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'slot-reagendar-btn'; 
      btn.style.cssText = 'padding: 8px; border: 1px solid #D1D5DB; border-radius: 8px; background: white; font-size: 0.8rem; font-weight: 500; cursor: pointer; text-align: center; font-family: inherit; transition:all 0.2s;';

      const limiteVagas = parseInt(slot.vagas || '1');
      const ocupadasNoMinuto = todosAgendamentos.filter(a => 
        String(a.data_consulta).substring(0, 10) === dataSelecionada && 
        (a.horario ? a.horario.substring(0, 5) : '') === hora && 
        a.status !== 'Cancelado'
      ).length;

      const flagOcupado = slot.ocupado === true || slot.ocupado === 'true' || slot.ocupado === 1 || slot.status === 'Ocupado';
      const esgotouLimiteVagas = ocupadasNoMinuto >= limiteVagas;

      if (flagOcupado || esgotouLimiteVagas) {
        btn.textContent = `${hora} (Esg)`;
        btn.disabled = true;
        btn.style.cssText += 'background:#F3F4F6; color:#9CA3AF; border-color:#E5E7EB; cursor:not-allowed;';
      } else {
        const vagasRestantes = limiteVagas - ocupadasNoMinuto;
        btn.textContent = limiteVagas > 1 ? `${hora} (${vagasRestantes}v)` : hora;
        
        btn.addEventListener('click', () => {
          grid.querySelectorAll('.slot-reagendar-btn').forEach(b => {
            if (!b.disabled) b.style.cssText = 'padding: 8px; border: 1px solid #D1D5DB; border-radius: 8px; background: white; font-size: 0.8rem; font-weight: 500; cursor: pointer; text-align: center; font-family: inherit;';
          });
          btn.style.cssText = 'padding: 8px; border: 1px solid #3B82F6; border-radius: 8px; background: #EBF5FF; color: #1E40AF; font-size: 0.8rem; font-weight: 700; cursor: pointer; text-align: center; font-family: inherit;';
          horarioAgendarEscolhido = hora;
          if (btnConcluir) btnConcluir.disabled = false;
        });
      }
      grid.appendChild(btn);
    });

  } catch (err) {
    grid.innerHTML = '<p style="color:#DC2626; font-size:0.85rem; padding:10px; grid-column:1/-1; text-align:center; margin:0;">Erro ao carregar os horários.</p>';
  }
}

function configurarModalAgendar(pacienteId) {
  const overlay = document.getElementById('modal-agendar-prontuario');
  const btnAbrir = document.getElementById('btn-abrir-agendar');
  const btnFechar = document.getElementById('btn-fechar-agendar');
  const btnCancelar = document.getElementById('btn-cancelar-agendar');
  const btnConcluir = document.getElementById('btn-concluir-agendar');
  const dataInput = document.getElementById('agendar-data');
  const servicoSelect = document.getElementById('agendar-servico-select');

  const fechar = () => overlay.classList.remove('active');

  if (btnAbrir) {
    btnAbrir.addEventListener('click', () => {
      popularDropdownAgendamento();
      if (dataInput) {
        dataInput.value = "";
        dataInput.min = new Date().toISOString().split('T')[0];
      }
      if (servicoSelect) servicoSelect.value = "";
      document.getElementById('agendar-horarios-grid').innerHTML = '<p style="color:#9CA3AF; font-size:0.8rem; padding: 10px; text-align:center; width: 100%; grid-column:1/-1; margin:0;">Escolha um serviço e uma data para ver os horários livres.</p>';
      horarioAgendarEscolhido = null;
      if (btnConcluir) btnConcluir.disabled = true;
      overlay.classList.add('active');
    });
  }

  if (btnFechar) btnFechar.addEventListener('click', fechar);
  if (btnCancelar) btnCancelar.addEventListener('click', fechar);

  const dispararBuscaSlotsAgendar = () => {
    if (dataInput?.value && servicoSelect?.value) {
      buscarHorariosLivresAgendar(dataInput.value, servicoSelect.value);
    }
  };

  dataInput?.addEventListener('change', dispararBuscaSlotsAgendar);
  servicoSelect?.addEventListener('change', dispararBuscaSlotsAgendar);

  if (btnConcluir) {
    btnConcluir.addEventListener('click', async () => {
      if (!dataInput.value || !horarioAgendarEscolhido || !servicoSelect.value) return;

      btnConcluir.textContent = 'Agendando...';
      btnConcluir.disabled = true;
      try {
        const observacaoComAtendimento = `[Atendimento: ${servicoSelect.value}]`;
        await apiRequest('POST', '/agendamentos', { 
          id_paciente: pacienteId, 
          data_consulta: dataInput.value, 
          horario: horarioAgendarEscolhido + ':00', 
          observacoes: observacaoComAtendimento 
        });
        
        showNotification('Consulta agendada com sucesso!');
        fechar();
        await carregarDadosHistorico(pacienteId);
      } catch (err) {
        showNotification(err.message || 'Erro ao agendar.', 'error');
      } finally {
        btnConcluir.textContent = 'Confirmar Consulta';
        btnConcluir.disabled = false;
      }
    });
  }
}

// SINCRONIZAÇÃO COMPLETA DE TRÂMITES
async function carregarDadosHistorico(pacienteId) {
  try {
    const [resHistorico, resAgendamentos] = await Promise.all([
      historicoDoPaciente(pacienteId).catch(() => []),
      listarAgendamentos({ id_paciente: pacienteId }).catch(() => [])
    ]);

    const oficiais = resHistorico || [];
    const agendamentos = resAgendamentos || [];

    const finalizados = agendamentos.filter(a => String(a.status).toLowerCase() === 'finalizado');

    const unificados = await Promise.all(finalizados.map(async (f) => {
      const correspondenteOficial = oficiais.find(o => String(o.id_agendamento || o.id_consulta) === String(f.id_agendamento));
      const tramitesApi = await listarTramites(f.id_agendamento).catch(() => []);
      const t = Array.isArray(tramitesApi) ? tramitesApi.find(x => x.descricao_sessao || x.orientacoes_paciente) || tramitesApi[0] : tramitesApi;

      const limparTextoInvalido = (texto) => {
        if (!texto) return '';
        const txtStr = String(texto);
        if (txtStr.includes("Solicitação de agendamento realizada")) return '';
        if (txtStr.includes("[Atendimento:")) return '';
        return txtStr.trim();
      };

      const descSessao = t?.descricao_sessao || correspondenteOficial?.descricao_sessao || limparTextoInvalido(f.descricao_sessao) || limparTextoInvalido(f.diagnostico) || limparTextoInvalido(f.descricao) || '';
      const orientacoes = t?.orientacoes_paciente || correspondenteOficial?.orientacoes_paciente || limparTextoInvalido(f.orientacoes_paciente) || limparTextoInvalido(f.prescricao) || limparTextoInvalido(f.orientacoes) || '';
      const obsInternas = t?.observacoes_internas || correspondenteOficial?.observacoes_internas || limparTextoInvalido(f.observacoes_internas) || limparTextoInvalido(f.observacoes) || '';
      const prescricaoTexto = t?.texto_prescricao || correspondenteOficial?.texto_prescricao || limparTextoInvalido(f.texto_prescricao) || limparTextoInvalido(f.plano_proximo) || '';
      const medicamentos = t?.medicamentos_suplementos || correspondenteOficial?.medicamentos_suplementos || limparTextoInvalido(f.medicamentos_suplementos) || limparTextoInvalido(f.medicamentos) || '';

      return {
        id_consulta: f.id_agendamento,
        id_agendamento: f.id_agendamento,
        data_consulta: f.data_consulta,
        horario: f.horario,
        valor: f.valor || t?.valor || null,
        
        descricao_sessao: descSessao,
        orientacoes_paciente: orientacoes,
        observacoes_internas: obsInternas,
        texto_prescricao: prescricaoTexto,
        medicamentos_suplementos: medicamentos
      };
    }));

    oficiais.forEach(o => {
      const jaExiste = unificados.some(u => String(u.id_agendamento) === String(o.id_agendamento || o.id_consulta));
      if (!jaExiste) {
        unificados.push({
          id_consulta: o.id_consulta || o.id_agendamento,
          id_agendamento: o.id_agendamento || o.id_consulta,
          data_consulta: o.data_consulta,
          horario: o.horario,
          descricao_sessao: o.descricao_sessao || o.diagnostico,
          orientacoes_paciente: o.orientacoes_paciente || o.prescricao,
          observacoes_internas: o.observacoes_internas || o.observacoes,
          texto_prescricao: o.texto_prescricao || o.plano_proximo,
          medicamentos_suplementos: o.medicamentos_suplementos || o.medicamentos || '',
          valor: o.valor || null
        });
      }
    });

    unificados.sort((a, b) => new Date(b.data_consulta) - new Date(a.data_consulta));

    historicoSessoes = unificados;
    
    const countEl = document.getElementById('count-concluidas');
    if (countEl) countEl.textContent = historicoSessoes.length;
    
    const filterMes = document.getElementById('filter-mes');
    renderizarHistorico(historicoSessoes, filterMes?.value || null);
  } catch (err) {
    console.error("Erro ao cruzar dados de histórico:", err);
  }
}

window.addEventListener('DOMContentLoaded', async () => {
  if (!verificarAutenticacao()) return;

  const pacienteId = localStorage.getItem('pacienteId');
  if (!pacienteId) {
    showNotification('Nenhum paciente selecionado.', 'error');
    setTimeout(() => { window.location.href = '../pacientes/index.html'; }, 1500);
    return;
  }

  const filterMes = document.getElementById('filter-mes');
  if (filterMes) {
    filterMes.value = ""; 
  }

  try {
    pacienteAtual = await buscarPaciente(pacienteId);
    popularHeader(pacienteAtual);
  } catch (err) {
    showNotification(err.message || 'Erro ao carregar paciente.', 'error');
  }

  try {
    documentosPaciente = await apiRequest('GET', `/documentos/paciente/${pacienteId}`).catch(() => []);
    documentosPaciente = documentosPaciente || [];
    await carregarDadosHistorico(pacienteId);
  } catch {}

  if (filterMes) {
    filterMes.addEventListener('change', () => renderizarHistorico(historicoSessoes, filterMes.value));
  }

  configurarModalEditar(pacienteId);
  configurarModalExcluir(pacienteId);
  configurarModalAgendar(pacienteId);

  // ─── CPF PROTEGIDO POR SENHA ─────────────────────────────
  const modalCpf = document.getElementById('modal-cpf-prontuario');
  const btnReveal = document.getElementById('btn-reveal-cpf-prontuario');
  const btnFecharCpf = document.getElementById('btn-fechar-modal-cpf');
  const btnCancelarCpf = document.getElementById('btn-cancelar-modal-cpf');
  const btnConfirmarCpf = document.getElementById('btn-confirmar-cpf-prontuario');
  const senhaInputCpf = document.getElementById('modal-cpf-senha');
  const eyeCpf = document.getElementById('modal-cpf-eye');
  const cpfDisplayEl = document.getElementById('prontuario-cpf-display');
  let cpfTimer = null;

  const abrirModalCpf = () => {
    if (senhaInputCpf) { senhaInputCpf.value = ''; senhaInputCpf.type = 'password'; }
    if (eyeCpf) eyeCpf.textContent = 'visibility';
    modalCpf?.classList.add('active');
    setTimeout(() => senhaInputCpf?.focus(), 100);
  };

  const fecharModalCpf = () => modalCpf?.classList.remove('active');

  const mascarCpf = () => {
    if (cpfDisplayEl) cpfDisplayEl.textContent = '•••.•••.•••-••';
    if (btnReveal) btnReveal.innerHTML = '<span class="material-symbols-outlined" style="font-size:16px;">lock</span>';
    clearTimeout(cpfTimer);
  };

  btnReveal?.addEventListener('click', abrirModalCpf);
  btnFecharCpf?.addEventListener('click', fecharModalCpf);
  btnCancelarCpf?.addEventListener('click', fecharModalCpf);

  eyeCpf?.addEventListener('click', () => {
    if (!senhaInputCpf) return;
    senhaInputCpf.type = senhaInputCpf.type === 'password' ? 'text' : 'password';
    eyeCpf.textContent = senhaInputCpf.type === 'password' ? 'visibility' : 'visibility_off';
  });

  senhaInputCpf?.addEventListener('keydown', (e) => { if (e.key === 'Enter') btnConfirmarCpf?.click(); });

  btnConfirmarCpf?.addEventListener('click', async () => {
    const senha = senhaInputCpf?.value?.trim();
    if (!senha) { showNotification('Digite sua senha.', 'error'); return; }

    const usuario = getUsuario();
    btnConfirmarCpf.disabled = true;
    btnConfirmarCpf.textContent = 'Verificando...';

    try {
      await revelarCpfProfissional(usuario?.id, senha);
      fecharModalCpf();

      if (cpfDisplayEl) cpfDisplayEl.textContent = formatarCpf(pacienteAtual?.cpf);
      if (btnReveal) {
        btnReveal.innerHTML = '<span class="material-symbols-outlined" style="font-size:16px;">lock_open</span>';
        btnReveal.onclick = mascarCpf;
      }

      clearTimeout(cpfTimer);
      cpfTimer = setTimeout(mascarCpf, 30000);
      showNotification('CPF revelado. Será ocultado em 30 segundos.');
    } catch (err) {
      showNotification(err.message || 'Senha incorreta.', 'error');
    } finally {
      btnConfirmarCpf.disabled = false;
      btnConfirmarCpf.textContent = 'Confirmar';
    }
  });

  // ─── MODAL SALVAR TRÂMITE ───
  const modalTramite = document.getElementById('modal-editar-tramite');
  document.getElementById('btn-fechar-tramite')?.addEventListener('click', () => modalTramite?.classList.remove('active'));
  document.getElementById('btn-cancelar-tramite')?.addEventListener('click', () => modalTramite?.classList.remove('active'));

  document.getElementById('btn-salvar-tramite')?.addEventListener('click', async () => {
    const idConsulta = consultaSelecionada?.id_consulta || consultaSelecionada?.id_agendamento;
    if (!idConsulta) {
      showNotification('Identificador da consulta não encontrado.', 'error');
      return;
    }
    
    const btn = document.getElementById('btn-salvar-tramite');
    btn.disabled = true;
    btn.textContent = 'Salvando...';
    try {
      const payload = {
        descricao_sessao: document.getElementById('tramite-diagnostico')?.value || null,
        orientacoes_paciente: document.getElementById('tramite-prescricao')?.value || null,
        observacoes_internas: document.getElementById('tramite-observacoes')?.value || null,
        texto_prescricao: document.getElementById('tramite-plano-proximo')?.value || null,
        medicamentos_suplementos: document.getElementById('tramite-medicamentos')?.value || null,
      };
      
      await apiRequest('POST', `/tramites/agendamento/${idConsulta}`, payload);
      await apiRequest('PUT', `/agendamentos/${idConsulta}`, payload).catch(() => {});

      Object.assign(consultaSelecionada, payload);
      await carregarDadosHistorico(pacienteId);
      
      showNotification('Trâmite atualizado! Sincronizado com o paciente.');
      modalTramite?.classList.remove('active');
    } catch (err) {
      showNotification(err.message || 'Erro ao salvar.', 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Salvar Alterações';
    }
  });

  // ─── LAUDOS ──────────────────────────────────────────────
  await renderizarLaudos(pacienteId);

  const inputLaudo = document.getElementById('input-laudo-upload');
  if (inputLaudo) {
    inputLaudo.addEventListener('change', async () => {
      const file = inputLaudo.files?.[0];
      if (!file) return;
      if (file.size > 5 * 1024 * 1024) { showNotification('Arquivo muito grande. Máximo 5MB.', 'error'); return; }

      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result.split(',')[1];
        try {
          await apiRequest('POST', `/documentos/paciente/${pacienteId}`, {
            nome_arquivo: file.name,
            tipo_arquivo: file.type || 'application/octet-stream',
            tamanho_bytes: file.size,
            conteudo_base64: base64,
          });
          showNotification('Laudo enviado com sucesso!');
          await renderizarLaudos(pacienteId);
          await carregarDadosHistorico(pacienteId);
        } catch (err) {
          showNotification(err.message || 'Erro ao enviar laudo.', 'error');
        }
      };
      reader.readAsDataURL(file);
      inputLaudo.value = '';
    });
  }
});