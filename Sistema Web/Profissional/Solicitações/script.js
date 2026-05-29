window.addEventListener('DOMContentLoaded', () => {
    const emptyState = document.getElementById('requests-empty');
    const tableWrapper = document.getElementById('requests-table-wrapper');
    const rowsContainer = document.getElementById('requests-rows');

    const modalAnalisar = document.getElementById('modal-analisar');
    const modalCancelar = document.getElementById('modal-justificativa-cancelar');
    const modalPendente = document.getElementById('modal-dados-pendentes');

    const btnFecharAnalisar = document.getElementById('close-modal-analisar');
    const btnModalConfirmar = document.getElementById('btn-modal-confirmar');
    const btnModalPendente = document.getElementById('btn-modal-pendente');
    const btnModalCancelar = document.getElementById('btn-modal-cancelar');

    const btnConcluirCancelar = document.getElementById('btn-concluir-cancelar');
    const btnVoltarCancelar = document.getElementById('btn-voltar-cancelar');
    const btnConcluirPendente = document.getElementById('btn-concluir-pendente');
    const btnVoltarPendente = document.getElementById('btn-voltar-pendente');

    const bellButton = document.getElementById('bell-button');
    const notiDropdown = document.getElementById('noti-dropdown');
    const dropdownBody = document.getElementById('dropdown-body');

    if (bellButton) {
        bellButton.addEventListener('click', function(e) {
            e.stopPropagation();
            notiDropdown.classList.toggle('show');
        });
    }

    document.addEventListener('click', function() {
        if (notiDropdown) {
            notiDropdown.classList.remove('show');
        }
    });

    // LISTA ORIGINAL INICIA VAZIA AGUARDANDO OS LOGS DA API REST DO JAVA
    let solicitacoesMock = [];

    let itemSelecionadoId = null;

    function formatarDataBR(dataString) {
        const partes = dataString.split('-');
        return `${partes[2]}/${partes[1]}/${partes[0]}`;
    }

    function renderizarTabela() {
        if (!rowsContainer) return;
        rowsContainer.innerHTML = '';

        if (solicitacoesMock.length === 0) {
            if (tableWrapper) tableWrapper.style.display = 'none';
            if (emptyState) emptyState.style.display = 'block';
            return;
        }

        if (tableWrapper) tableWrapper.style.display = 'block';
        if (emptyState) emptyState.style.display = 'none';

        solicitacoesMock.forEach(item => {
            const tr = document.createElement('tr');
            
            tr.innerHTML = `
                <td><strong>${item.nome}</strong></td>
                <td style="text-align: right;"><button class="btn-analyse" data-id="${item.id}">Analisar</button></td>
            `;

            tr.querySelector('.btn-analyse').addEventListener('click', function() {
                abrirPainelAnalise(item.id);
            });

            rowsContainer.appendChild(tr);
        });
    }

    function abrirPainelAnalise(id) {
        const item = solicitacoesMock.find(s => s.id === id);
        if (!item) return;

        itemSelecionadoId = id;

        if(document.getElementById('detalhe-nome')) document.getElementById('detalhe-nome').textContent = item.nome;
        if(document.getElementById('detalhe-servico')) document.getElementById('detalhe-servico').textContent = item.servico;
        if(document.getElementById('detalhe-data')) document.getElementById('detalhe-data').textContent = formatarDataBR(item.data);
        if(document.getElementById('detalhe-hora')) document.getElementById('detalhe-hora').textContent = item.hora;
        if(document.getElementById('detalhe-documento')) document.getElementById('detalhe-documento').textContent = item.documento !== "Nenhum" ? `📄 ${item.documento}` : "Nenhum arquivo enviado";
        if(document.getElementById('detalhe-observacoes')) document.getElementById('detalhe-observacoes').textContent = item.obs;

        if (modalAnalisar) modalAnalisar.classList.add('active');
    }

    function fecharTodosModais() {
        if (modalAnalisar) modalAnalisar.classList.remove('active');
        if (modalCancelar) modalCancelar.classList.remove('active');
        if (modalPendente) modalPendente.classList.remove('active');
        
        const txtCancelar = document.getElementById('texto-cancelar');
        const txtPendente = document.getElementById('texto-pendente');
        if (txtCancelar) txtCancelar.value = '';
        if (txtPendente) txtPendente.value = '';
        
        itemSelecionadoId = null;
    }

    function removerSolicitacaoAtual() {
        solicitacoesMock = solicitacoesMock.filter(s => s.id !== itemSelecionadoId);
        fecharTodosModais();
        renderizarTabela();
    }

    function renderizarNotificacoesLimpas() {
        if (dropdownBody) {
            dropdownBody.innerHTML = '<div class="dropdown-item" style="text-align:center; color:#9ca3af;">Nenhuma notificação por enquanto.</div>';
        }
    }

    if (btnFecharAnalisar) btnFecharAnalisar.addEventListener('click', fecharTodosModais);

    if (btnModalConfirmar) {
        btnModalConfirmar.addEventListener('click', () => {
            alert('Ação registrada! O agendamento foi confirmado. O paciente será notificado e os dados movidos para a tela de Agendados.');
            removerSolicitacaoAtual();
        });
    }

    if (btnModalCancelar) {
        btnModalCancelar.addEventListener('click', () => {
            if (modalCancelar) modalCancelar.classList.add('active');
        });
    }

    if (btnVoltarCancelar) {
        btnVoltarCancelar.addEventListener('click', () => {
            if (modalCancelar) modalCancelar.classList.remove('active');
        });
    }

    if (btnConcluirCancelar) {
        btnConcluirCancelar.addEventListener('click', () => {
            const txtCancelar = document.getElementById('texto-cancelar');
            const texto = txtCancelar ? txtCancelar.value : '';
            if (!texto.trim()) {
                alert('Por favor, informe o motivo do cancelamento antes de concluir.');
                return;
            }
            alert('Agendamento Cancelado! O motivo foi enviado ao paciente. Os dados foram arquivados e movidos conforme o fluxo de UX.');
            removerSolicitacaoAtual();
        });
    }

    if (btnModalPendente) {
        btnModalPendente.addEventListener('click', () => {
            if (modalPendente) modalPendente.classList.add('active');
        });
    }

    if (btnVoltarPendente) {
        btnVoltarPendente.addEventListener('click', () => {
            if (modalPendente) modalPendente.classList.remove('active');
        });
    }

    if (btnConcluirPendente) {
        btnConcluirPendente.addEventListener('click', () => {
            const txtPendente = document.getElementById('texto-pendente');
            const texto = txtPendente ? txtPendente.value : '';
            if (!texto.trim()) {
                alert('Por favor, descreva o que está pendente antes de enviar.');
                return;
            }
            alert('Status alterado para Pendente! O paciente recebeu a lista de pendências em sua conta para correção.');
            removerSolicitacaoAtual();
        });
    }

    renderizarTabela();
    renderizarNotificacoesLimpas();
});