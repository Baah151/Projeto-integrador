window.addEventListener('DOMContentLoaded', () => {
    const emptyState = document.getElementById('appointments-empty');
    const tableWrapper = document.getElementById('appointments-table-wrapper');
    const rowsContainer = document.getElementById('appointments-rows');

    const filterDate = document.getElementById('filter-date');
    const filterService = document.getElementById('filter-service');

    const modalModificar = document.getElementById('modal-modificar');
    const modalSubFinalizar = document.getElementById('modal-sub-finalizar');
    const modalSubReagendar = document.getElementById('modal-sub-reagendar');
    const modalSubCancelar = document.getElementById('modal-sub-cancelar');

    const btnFecharModificar = document.getElementById('close-modal-modificar');
    const btnTriggerFinalizar = document.getElementById('btn-trigger-finalizar');
    const btnTriggerReagendar = document.getElementById('btn-trigger-reagendar');
    const btnTriggerCancelar = document.getElementById('btn-trigger-cancelar');

    const btnVoltarFinalizar = document.getElementById('btn-voltar-finalizar');
    const btnVoltarReagendar = document.getElementById('btn-voltar-reagendar');
    const btnVoltarCancelar = document.getElementById('btn-voltar-cancelar');

    const btnEnviarNota = document.getElementById('btn-enviar-nota');
    const btnNotaDepois = document.getElementById('btn-nota-depois');
    const btnConcluirReagendamento = document.getElementById('btn-concluir-reagendamento');
    const btnConcluirCancelarAgenda = document.getElementById('btn-concluir-cancelar-agenda');

    const containerHorariosReagendar = document.getElementById('reagendar-horarios-container');

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

    let agendadosMock = [];

    let itemSelecionadoId = null;
    let horarioReagendamentoEscolhido = null;
    let diaEscolhidoReagendamento = null;

    function formatarDataBR(dataString) {
        const partes = dataString.split('-');
        return `${partes[2]}/${partes[1]}/${partes[0]}`;
    }

    function renderizarTabela() {
        rowsContainer.innerHTML = '';
        const dataFiltro = filterDate.value;
        const servicoFiltro = filterService.value;

        const filtrados = agendadosMock.filter(item => {
            const bateData = !dataFiltro || item.data === dataFiltro;
            const bateServico = servicoFiltro === 'todos' || item.servico === servicoFiltro;
            return bateData && bateServico;
        });

        if (filtrados.length === 0) {
            if (tableWrapper) tableWrapper.style.display = 'none';
            if (emptyState) emptyState.style.display = 'block';
            return;
        }

        if (tableWrapper) tableWrapper.style.display = 'block';
        if (emptyState) emptyState.style.display = 'none';
        filtrados.sort((a, b) => a.data.localeCompare(b.data) || a.hora.localeCompare(b.hora));

        filtrados.forEach(item => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${item.nome}</strong></td>
                <td>${formatarDataBR(item.data)}</td>
                <td><strong>${item.hora}</strong></td>
                <td>${item.servico}</td>
                <td style="text-align: right;"><button class="btn-modify" data-id="${item.id}">Modificar</button></td>
            `;
            tr.querySelector('.btn-modify').addEventListener('click', () => abrirPainelModificar(item.id));
            rowsContainer.appendChild(tr);
        });
    }

    function abrirPainelModificar(id) {
        const item = agendadosMock.find(a => a.id === id);
        if (!item) return;
        itemSelecionadoId = id;
        document.getElementById('modificar-info-paciente').textContent = `Paciente: ${item.nome} | ${item.servico} às ${item.hora} do dia ${formatarDataBR(item.data)}`;
        modalModificar.classList.add('active');
    }

    function fecharTodosModais() {
        modalModificar.classList.remove('active');
        modalSubFinalizar.classList.remove('active');
        modalSubReagendar.classList.remove('active');
        modalSubCancelar.classList.remove('active');
        
        document.getElementById('finalizar-valor').value = '';
        document.getElementById('finalizar-observacao').value = '';
        document.getElementById('cancelar-motivo').value = '';
        if (containerHorariosReagendar) containerHorariosReagendar.innerHTML = '';
        
        itemSelecionadoId = null;
        diaEscolhidoReagendamento = null;
        horarioReagendamentoEscolhido = null;
    }

    function removerAgendamentoAtual() {
        agendadosMock = agendadosMock.filter(a => a.id !== itemSelecionadoId);
        fecharTodosModais();
        renderizarTabela();
    }

    function carregarEspelhoDaAgendaPublicada() {
        if (!containerHorariosReagendar) return;
        containerHorariosReagendar.innerHTML = '';
        diaEscolhidoReagendamento = null;
        horarioReagendamentoEscolhido = null;

        const agendasSalvas = localStorage.getItem('agendaPublicadaProfissional');
        let agendaPublicada = agendasSalvas ? JSON.parse(agendasSalvas) : [];

        if (agendaPublicada.length === 0) {
            containerHorariosReagendar.innerHTML = '<span style="font-size:0.85rem; color:#ef4444; text-align:center; padding: 20px 0; font-weight:500;">Nenhuma agenda ativa publicada no sistema.</span>';
            return;
        }

        agendaPublicada.sort((a, b) => a.data.localeCompare(b.data));

        agendaPublicada.forEach(bloco => {
            const cardBloco = document.createElement('div');
            cardBloco.className = 'reagendar-block-card';

            const headerBloco = document.createElement('div');
            headerBloco.className = 'reagendar-card-header';
            headerBloco.innerHTML = `📅 Dia ${formatarDataBR(bloco.data)}`;
            cardBloco.appendChild(headerBloco);

            bloco.horarios.sort((a, b) => a.hora.localeCompare(b.hora));

            bloco.horarios.forEach(h => {
                const rowAtendimento = document.createElement('div');
                rowAtendimento.className = 'reagendar-card-row';
                const totalVagas = parseInt(h.vagas);

                if (totalVagas <= 0) {
                    rowAtendimento.style.cursor = 'not-allowed';
                    rowAtendimento.style.opacity = '0.5';
                    rowAtendimento.innerHTML = `
                        <div class="reagendar-card-info">
                            <strong>${h.hora}</strong> - ${h.servico} 
                            <span class="reagendar-card-vagas esgotado">(0 vagas)</span>
                        </div>
                    `;
                } else {
                    rowAtendimento.innerHTML = `
                        <div class="reagendar-card-info">
                            <strong>${h.hora}</strong> - ${h.servico} 
                            <span class="reagendar-card-vagas">(${totalVagas} vagas)</span>
                        </div>
                    `;

                    rowAtendimento.addEventListener('click', () => {
                        document.querySelectorAll('.reagendar-card-row').forEach(r => r.classList.remove('selected'));
                        rowAtendimento.classList.add('selected');
                        diaEscolhidoReagendamento = bloco.data;
                        horarioReagendamentoEscolhido = h.hora;
                    });
                }
                cardBloco.appendChild(rowAtendimento);
            });

            containerHorariosReagendar.appendChild(cardBloco);
        });
    }

    function carregarNotificacoesSininhoERadius() {
        const menuBadge = document.getElementById('badge-painel');
        if (menuBadge) {
            menuBadge.style.display = 'none';
        }

        const notiBadge = document.getElementById('noti-badge');
        if (notiBadge) {
            notiBadge.textContent = '0';
            notiBadge.style.display = 'block';
        }

        if (dropdownBody) {
            dropdownBody.innerHTML = '<div class="dropdown-item" style="text-align:center; color:#9ca3af;">Nenhuma notificação recente.</div>';
        }
    }

    btnFecharModificar.addEventListener('click', fecharTodosModais);
    btnVoltarFinalizar.addEventListener('click', () => modalSubFinalizar.classList.remove('active'));
    btnVoltarReagendar.addEventListener('click', () => modalSubReagendar.classList.remove('active'));
    btnVoltarCancelar.addEventListener('click', () => modalSubCancelar.classList.remove('active'));

    btnTriggerFinalizar.addEventListener('click', () => modalSubFinalizar.classList.add('active'));
    
    btnTriggerReagendar.addEventListener('click', () => {
        carregarEspelhoDaAgendaPublicada();
        modalSubReagendar.classList.add('active');
    });
    
    btnTriggerCancelar.addEventListener('click', () => modalSubCancelar.classList.add('active'));

    btnEnviarNota.addEventListener('click', () => {
        const valor = document.getElementById('finalizar-valor').value;
        const obs = document.getElementById('finalizar-observacao').value;
        if (!valor || !obs.trim()) {
            alert('Ação bloqueada! Para enviar a nota, você precisa preencher o valor e a observação clínica.');
            return;
        }
        alert('Sessão Finalizada com Sucesso! O atendimento foi enviado para o histórico do paciente.');
        removerAgendamentoAtual();
    });

    btnNotaDepois.addEventListener('click', () => {
        const valor = document.getElementById('finalizar-valor').value;
        if (!valor) {
            alert('Ação bloqueada! Para avançar e deixar a nota para depois, insira o valor da sessão.');
            return;
        }
        alert('Sessão Concluída! Nota pendente configurada.');
        removerAgendamentoAtual();
    });

    btnConcluirReagendamento.addEventListener('click', () => {
        if (!diaEscolhidoReagendamento || !horarioReagendamentoEscolhido) {
            alert('Ação bloqueada! Clique sobre uma linha de horário ativa com vagas em qualquer um dos cartões para selecionar.');
            return;
        }

        const item = agendadosMock.find(a => a.id === itemSelecionadoId);
        if (item) {
            item.data = diaEscolhidoReagendamento;
            item.hora = horarioReagendamentoEscolhido;
            
            const agendasSalvas = localStorage.getItem('agendaPublicadaProfissional');
            let agendaPublicada = agendasSalvas ? JSON.parse(agendasSalvas) : [];
            const bloco = agendaPublicada.find(b => b.data === diaEscolhidoReagendamento);
            if (bloco) {
                const hInfo = bloco.horarios.find(h => h.hora === horarioReagendamentoEscolhido);
                if (hInfo) item.servico = hInfo.servico;
            }
        }

        alert('Atendimento Reagendado com Sucesso! Os dados foram updated na grade.');
        fecharTodosModais();
        renderizarTabela();
    });

    btnConcluirCancelarAgenda.addEventListener('click', () => {
        const motivo = document.getElementById('cancelar-motivo').value;
        if (!motivo.trim()) {
            alert('Por favor, informe o motivo do cancelamento.');
            return;
        }
        alert('Atendimento Cancelado! A sessão foi arquivada.');
        removerAgendamentoAtual();
    });

    function renderizacoesIniciais() {
        renderizarTabela();
        carregarNotificacoesSininhoERadius();
    }

    filterDate.addEventListener('change', renderizarTabela);
    filterService.addEventListener('change', renderizarTabela);
    renderizacoesIniciais();
});