let pacienteAtual = null;
let consultaSelecionada = null;
let documentosPaciente = [];
let historicoSessoes = [];

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
  if (el('detalhe-txt-telefone')) el('detalhe-txt-telefone').textContent = formatarTelefone(p.telefone);
  if (el('detalhe-txt-email')) el('detalhe-txt-email').textContent = p.email || '--';
  const endereco = [p.logradouro, p.numero, p.bairro, p.cidade, p.estado].filter(Boolean).join(', ');
  if (el('detalhe-txt-endereco')) el('detalhe-txt-endereco').textContent = endereco || 'Endereço não informado';
  if (el('txt-observacoes-clinicas')) el('txt-observacoes-clinicas').textContent = p.observacoes || 'Nenhuma observação cadastrada para este paciente.';
}

function popularModalEditar(p) {
  const campos = ['nome', 'nascimento', 'email', 'telefone', 'cep', 'logradouro', 'numero', 'bairro', 'complemento', 'cidade', 'estado'];
  campos.forEach(c => {
    const el = document.getElementById(`edit-${c}`);
    if (el) el.value = p[c] || '';
  });
  const obs = document.getElementById('edit-obs-clinicas');
  if (obs) obs.value = p.observacoes || '';
}

function abrirModalTramite(h) {
  consultaSelecionada = h;
  const modal = document.getElementById('modal-editar-tramite');
  const info = document.getElementById('tramite-info-sessao');
  if (info) info.textContent = `Sessão de ${formatarDataBR(h.data_consulta)} às ${String(h.horario || '').substring(0, 5)}`;
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };
  set('tramite-diagnostico', h.diagnostico);
  set('tramite-prescricao', h.prescricao);
  set('tramite-observacoes', h.observacoes);
  set('tramite-plano-proximo', h.plano_proximo);
  modal?.classList.add('active');
}

function renderizarHistorico(historico, filtroMes) {
  const container = document.getElementById('timeline-container');
  const empty = document.getElementById('timeline-empty');
  if (!container) return;

  container.querySelectorAll('.timeline-item').forEach(i => i.remove());

  let lista = historico || [];
  if (filtroMes) lista = lista.filter(h => h.data_consulta && String(h.data_consulta).substring(0, 7) === filtroMes);

  if (lista.length === 0) {
    if (empty) empty.style.display = 'flex';
    return;
  }
  if (empty) empty.style.display = 'none';

  lista.forEach(h => {
    const docsSession = documentosPaciente.filter(d => d.id_agendamento != null && String(d.id_agendamento) === String(h.id_agendamento));

    let docsHtml = '';
    if (docsSession.length > 0) {
      const items = docsSession.map(d => `
        <div class="doc-sessao-item" data-id="${d.id_documento}" style="display:flex;align-items:center;gap:8px;padding:5px 8px;background:#f0fdf4;border:1px solid #d1fae5;border-radius:8px;margin-top:5px;">
          <span style="font-size:0.8rem;color:#374151;flex:1;">📎 ${d.nome_arquivo} <small style="color:#9CA3AF;">${formatarBytes(d.tamanho_bytes)}</small></span>
          <button class="btn-dl-doc" data-id="${d.id_documento}" style="background:#046C4E;color:white;border:none;padding:3px 10px;border-radius:6px;font-size:0.72rem;font-weight:600;cursor:pointer;">Baixar</button>
        </div>`).join('');
      docsHtml = `<div style="margin-top:10px;"><p style="font-size:0.72rem;font-weight:700;color:#046C4E;margin:0 0 4px 0;text-transform:uppercase;letter-spacing:0.04em;">Documentos desta sessão</p>${items}</div>`;
    }

    const div = document.createElement('div');
    div.className = 'timeline-item';
    div.innerHTML = `
      <div class="timeline-dot"></div>
      <div class="timeline-content">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:4px;">
          <div class="timeline-date">${formatarDataBR(h.data_consulta)}</div>
          <button class="btn-edit-tramite" style="background:#f0fdf4;border:1px solid #d1fae5;color:#046C4E;padding:3px 10px;border-radius:8px;font-size:0.75rem;font-weight:600;cursor:pointer;">Editar Trâmite</button>
        </div>
        <h4 class="timeline-title">${h.diagnostico || 'Consulta realizada'}</h4>
        <p class="timeline-desc">${h.observacoes || h.descricao || 'Sem observações registradas.'}</p>
        ${h.plano_proximo ? `<div style="margin-top:8px;padding:8px 10px;background:#fff7ed;border-left:3px solid #f97316;border-radius:4px;font-size:0.8rem;color:#c2410c;"><strong>Próxima sessão:</strong> ${h.plano_proximo}</div>` : ''}
        ${docsHtml}
        ${h.valor ? `<span class="timeline-valor" style="display:inline-block;margin-top:8px;">R$ ${parseFloat(h.valor).toFixed(2).replace('.', ',')}</span>` : ''}
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
          renderizarHistorico(historicoSessoes, document.getElementById('filter-mes')?.value || null);
          renderizarLaudos(pacienteId);
        } catch (err) { showNotification(err.message || 'Erro ao remover.', 'error'); }
      });
      container.appendChild(item);
    });
  } catch (err) {
    if (empty) { empty.style.display = 'flex'; empty.querySelector('p').textContent = 'Erro ao carregar documentos.'; }
  }
}

function configurarModalAgendar(pacienteId) {
  const overlay = document.getElementById('modal-agendar-prontuario');
  const btnAbrir = document.getElementById('btn-abrir-agendar');
  const btnFechar = document.getElementById('btn-fechar-agendar');
  const btnCancelar = document.getElementById('btn-cancelar-agendar');
  const btnConcluir = document.getElementById('btn-concluir-agendar');

  const fechar = () => overlay.classList.remove('active');

  if (btnAbrir) {
    btnAbrir.addEventListener('click', () => {
      const dataInput = document.getElementById('agendar-data');
      const horarioInput = document.getElementById('agendar-horario');
      const obsInput = document.getElementById('agendar-obs');
      if (dataInput) dataInput.value = new Date().toISOString().split('T')[0];
      if (horarioInput) horarioInput.value = '';
      if (obsInput) obsInput.value = '';
      overlay.classList.add('active');
    });
  }

  if (btnFechar) btnFechar.addEventListener('click', fechar);
  if (btnCancelar) btnCancelar.addEventListener('click', fechar);

  if (btnConcluir) {
    btnConcluir.addEventListener('click', async () => {
      const data = document.getElementById('agendar-data')?.value;
      const horario = document.getElementById('agendar-horario')?.value;
      const obs = document.getElementById('agendar-obs')?.value || '';

      if (!data) { showNotification('Selecione a data da consulta.', 'error'); return; }
      if (!horario) { showNotification('Informe o horário da consulta.', 'error'); return; }

      btnConcluir.textContent = 'Agendando...';
      btnConcluir.disabled = true;
      try {
        await criarAgendamento({ id_paciente: pacienteId, data_consulta: data, horario, observacoes: obs });
        showNotification('Consulta agendada com sucesso!');
        fechar();
      } catch (err) {
        showNotification(err.message || 'Erro ao agendar.', 'error');
      } finally {
        btnConcluir.textContent = 'Confirmar Consulta';
        btnConcluir.disabled = false;
      }
    });
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
        nascimento: document.getElementById('edit-nascimento')?.value,
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
    btnConcluirSalv.addEventListener('click', async () => {
      if (!dadosPendentes) return;
      btnConcluirSalv.textContent = 'Salvando...';
      btnConcluirSalv.disabled = true;
      try {
        const atualizado = await atualizarPaciente(pacienteId, dadosPendentes);
        pacienteAtual = atualizado;
        popularHeader(atualizado);
        showNotification('Dados atualizados com sucesso!');
        overlayConfirmar.classList.remove('active');
      } catch (err) {
        showNotification(err.message || 'Erro ao salvar.', 'error');
        overlayConfirmar.classList.remove('active');
        overlayEditar.classList.add('active');
      } finally {
        btnConcluirSalv.textContent = 'Finalizar Alteração';
        btnConcluirSalv.disabled = false;
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

window.addEventListener('DOMContentLoaded', async () => {
  if (!verificarAutenticacao()) return;

  const pacienteId = localStorage.getItem('pacienteId');
  if (!pacienteId) {
    showNotification('Nenhum paciente selecionado.', 'error');
    setTimeout(() => { window.location.href = '../pacientes/index.html'; }, 1500);
    return;
  }

  try {
    pacienteAtual = await buscarPaciente(pacienteId);
    popularHeader(pacienteAtual);
  } catch (err) {
    showNotification(err.message || 'Erro ao carregar paciente.', 'error');
  }

  try {
    [historicoSessoes, documentosPaciente] = await Promise.all([
      historicoDoPaciente(pacienteId).catch(() => []),
      apiRequest('GET', `/documentos/paciente/${pacienteId}`).catch(() => []),
    ]);
    documentosPaciente = documentosPaciente || [];
    historicoSessoes = historicoSessoes || [];
    const countEl = document.getElementById('count-concluidas');
    if (countEl) countEl.textContent = historicoSessoes.length;
    renderizarHistorico(historicoSessoes, null);
  } catch {}

  const filterMes = document.getElementById('filter-mes');
  if (filterMes) {
    filterMes.addEventListener('change', () => renderizarHistorico(historicoSessoes, filterMes.value));
  }

  configurarModalAgendar(pacienteId);
  configurarModalEditar(pacienteId);
  configurarModalExcluir(pacienteId);

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

  // ─── MODAL EDITAR TRÂMITE ────────────────────────────────
  const modalTramite = document.getElementById('modal-editar-tramite');
  document.getElementById('btn-fechar-tramite')?.addEventListener('click', () => modalTramite?.classList.remove('active'));
  document.getElementById('btn-cancelar-tramite')?.addEventListener('click', () => modalTramite?.classList.remove('active'));

  document.getElementById('btn-salvar-tramite')?.addEventListener('click', async () => {
    if (!consultaSelecionada?.id_consulta) return;
    const btn = document.getElementById('btn-salvar-tramite');
    btn.disabled = true;
    btn.textContent = 'Salvando...';
    try {
      const payload = {
        diagnostico: document.getElementById('tramite-diagnostico')?.value || null,
        prescricao: document.getElementById('tramite-prescricao')?.value || null,
        observacoes: document.getElementById('tramite-observacoes')?.value || null,
        plano_proximo: document.getElementById('tramite-plano-proximo')?.value || null,
      };
      await apiRequest('PUT', `/consultas/${consultaSelecionada.id_consulta}`, payload);
      Object.assign(consultaSelecionada, payload);
      renderizarHistorico(historicoSessoes, filterMes?.value || null);
      showNotification('Trâmite atualizado com sucesso!');
      modalTramite?.classList.remove('active');
    } catch (err) {
      showNotification(err.message || 'Erro ao salvar.', 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Salvar Trâmite';
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
          renderizarHistorico(historicoSessoes, document.getElementById('filter-mes')?.value || null);
        } catch (err) {
          showNotification(err.message || 'Erro ao enviar laudo.', 'error');
        }
      };
      reader.readAsDataURL(file);
      inputLaudo.value = '';
    });
  }
});
