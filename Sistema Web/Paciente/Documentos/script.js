let consultaAtiva = null;

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

function formatarDataBR(dataISO) {
  if (!dataISO) return '--/--/----';
  const p = String(dataISO).substring(0, 10).split('-');
  return `${p[2]}/${p[1]}/${p[0]}`;
}

function formatarBytes(bytes) {
  if (!bytes) return '';
  return bytes > 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    : `${Math.round(bytes / 1024)} KB`;
}

function gerarNomeArquivo(arquivoOriginal) {
  const paciente = getPaciente();
  const nomePaciente = (paciente?.nome || 'paciente')
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '');

  const hoje = new Date();
  const dd = String(hoje.getDate()).padStart(2, '0');
  const mm = String(hoje.getMonth() + 1).padStart(2, '0');
  const aaaa = hoje.getFullYear();

  const ext = arquivoOriginal.name.includes('.')
    ? '.' + arquivoOriginal.name.split('.').pop().toLowerCase()
    : '';

  return `arquivo_encaminhado_${nomePaciente}_${dd}-${mm}-${aaaa}${ext}`;
}

async function carregarDocumentos() {
  const container = document.getElementById('docs-list');
  if (!container) return;
  container.innerHTML = '<div class="empty-docs"><span class="material-symbols-outlined" style="animation:spin 1s linear infinite">sync</span><p>Carregando...</p></div>';

  try {
    const docs = await listarDocumentosPaciente() || [];

    if (docs.length === 0) {
      container.innerHTML = `
        <div class="empty-docs">
          <span class="material-symbols-outlined">inventory_2</span>
          <p>Nenhum documento encontrado ou compartilhado ainda.</p>
        </div>`;
      return;
    }

    container.innerHTML = '';
    docs.forEach(doc => {
      const row = document.createElement('div');
      row.className = 'docs-item';
      const data = doc.data_upload ? formatarDataBR(doc.data_upload) : '—';
      const tamanho = doc.tamanho_bytes ? ` <small style="color:#9CA3AF;">(${formatarBytes(doc.tamanho_bytes)})</small>` : '';
      const isEncaminhado = doc.nome_arquivo?.startsWith('arquivo_encaminhado_');

      row.innerHTML = `
        <span>${data}</span>
        <span style="font-weight:500;color:#1F2937;">${doc.nome_arquivo || '—'}${tamanho}</span>
        <span class="${isEncaminhado ? 'status-encaminhado' : 'status-recebido'}">${isEncaminhado ? 'Encaminhado' : 'Recebido'}</span>
        <button class="btn-download-table" data-id="${doc.id_documento}" title="Baixar">
          <span class="material-symbols-outlined">download</span>
        </button>
      `;
      row.querySelector('button').addEventListener('click', () => baixarDocumento(doc));
      container.appendChild(row);
    });
  } catch (err) {
    container.innerHTML = `<div class="empty-docs"><p style="color:#ef4444;">${err.message || 'Erro ao carregar documentos.'}</p></div>`;
  }
}

async function baixarDocumento(docMeta) {
  try {
    const doc = await apiRequest('GET', `/documentos/${docMeta.id_documento}/download`);
    if (!doc?.conteudo_base64) { showNotification('Arquivo sem conteúdo.', 'error'); return; }
    const link = document.createElement('a');
    link.href = `data:${doc.tipo_arquivo || 'application/octet-stream'};base64,${doc.conteudo_base64}`;
    link.download = doc.nome_arquivo;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch {
    showNotification('Erro ao baixar arquivo.', 'error');
  }
}

async function configurarUpload() {
  try {
    const agendamentos = await listarAgendamentosPaciente() || [];
    consultaAtiva = agendamentos.find(a => a.status === 'Confirmado' || a.status === 'Agendado') || null;
  } catch {
    consultaAtiva = null;
  }

  const secSem = document.getElementById('upload-sem-consulta');
  const secCom = document.getElementById('upload-com-consulta');
  const infoEl = document.getElementById('upload-consulta-info');

  if (!consultaAtiva) {
    if (secSem) secSem.style.display = 'block';
    if (secCom) secCom.style.display = 'none';
    return;
  }

  if (secSem) secSem.style.display = 'none';
  if (secCom) secCom.style.display = 'block';
  if (infoEl) {
    const hora = consultaAtiva.horario ? String(consultaAtiva.horario).substring(0, 5) : '';
    infoEl.textContent = `Consulta de ${formatarDataBR(consultaAtiva.data_consulta)} às ${hora} — será vinculado a esta consulta`;
  }

  const fileInput = document.getElementById('file-upload');
  fileInput?.addEventListener('change', async () => {
    const arquivo = fileInput.files?.[0];
    if (!arquivo) return;

    if (arquivo.size > 5 * 1024 * 1024) {
      showNotification('Arquivo muito grande. Máximo 5 MB.', 'error');
      fileInput.value = '';
      return;
    }

    const nomeGerado = gerarNomeArquivo(arquivo);
    const progresso = document.getElementById('upload-progresso');
    const progressoTexto = document.getElementById('upload-progresso-texto');
    const btnLabel = document.getElementById('btn-upload-label');

    if (progresso) progresso.style.display = 'flex';
    if (progressoTexto) progressoTexto.textContent = `Enviando "${nomeGerado}"...`;
    if (btnLabel) btnLabel.style.pointerEvents = 'none';

    try {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        try {
          const base64 = ev.target.result.split(',')[1];
          await uploadDocumentoPaciente({
            id_agendamento: consultaAtiva.id_agendamento,
            nome_arquivo: nomeGerado,
            tipo_arquivo: arquivo.type || 'application/octet-stream',
            tamanho_bytes: arquivo.size,
            conteudo_base64: base64,
          });
          showNotification(`"${nomeGerado}" encaminhado com sucesso!`);
          await carregarDocumentos();
        } catch (err) {
          showNotification(err.message || 'Erro ao enviar documento.', 'error');
        } finally {
          if (progresso) progresso.style.display = 'none';
          if (btnLabel) btnLabel.style.pointerEvents = '';
          fileInput.value = '';
        }
      };
      reader.onerror = () => {
        showNotification('Erro ao ler o arquivo.', 'error');
        if (progresso) progresso.style.display = 'none';
        if (btnLabel) btnLabel.style.pointerEvents = '';
        fileInput.value = '';
      };
      reader.readAsDataURL(arquivo);
    } catch (err) {
      showNotification(err.message || 'Erro.', 'error');
      if (progresso) progresso.style.display = 'none';
      if (btnLabel) btnLabel.style.pointerEvents = '';
    }
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  if (!verificarAutenticacaoPaciente()) return;
  gerenciarMenuMobile();
  await Promise.all([configurarUpload(), carregarDocumentos()]);
});
