window.addEventListener('DOMContentLoaded', () => {
    const inputData = document.getElementById('data-disponivel');
    const selectServico = document.getElementById('servico-select');
    const inputTime = document.getElementById('time-input');
    const inputVagas = document.getElementById('vagas-input');
    const btnAdicionar = document.getElementById('btn-adicionar');
    const btnLiberar = document.getElementById('btn-liberar');
    const chipsContainer = document.getElementById('chips-container');
    const agendaPublicadaContainer = document.getElementById('agenda-publicada-container');

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

    let horariosTemporarios = {};
    let agendaPublicada = [];

    const agendasSalvas = localStorage.getItem('agendaPublicadaProfissional');
    if (agendasSalvas) {
        agendaPublicada = JSON.parse(agendasSalvas);
    }

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    const dia = String(hoje.getDate()).padStart(2, '0');
    inputData.value = `${ano}-${mes}-${dia}`;

    function formatarDataBR(dataString) {
        const partes = dataString.split('-');
        return `${partes[2]}/${partes[1]}/${partes[0]}`;
    }

    function renderizarChips() {
        chipsContainer.innerHTML = '';
        const dataSelecionada = inputData.value;
        
        if (!dataSelecionada || !horariosTemporarios[dataSelecionada] || horariosTemporarios[dataSelecionada].length === 0) {
            chipsContainer.innerHTML = '<p style="font-size:0.8rem; color:#9CA3AF; text-align:center; padding:10px 0;">Nenhum horário adicionado para este dia.</p>';
            return;
        }

        horariosTemporarios[dataSelecionada].forEach((item, index) => {
            const chip = document.createElement('div');
            chip.className = 'agenda-chip';
            chip.innerHTML = `
                <span>Dia: <strong>${formatarDataBR(item.data)}</strong> | Serviço: <strong>${item.servico}</strong> | Horário: <strong>${item.hora}</strong> | Vagas: <strong>${item.vagas}</strong></span>
                <button class="btn-del-chip" data-index="${index}">×</button>
            `;

            chip.querySelector('.btn-del-chip').addEventListener('click', function() {
                horariosTemporarios[dataSelecionada].splice(index, 1);
                renderizarChips();
            });

            chipsContainer.appendChild(chip);
        });
    }

    function renderizarAgendaPublicada() {
        agendaPublicadaContainer.innerHTML = '';
        
        const dataAtual = new Date();
        dataAtual.setHours(0, 0, 0, 0);

        agendaPublicada = agendaPublicada.filter(bloco => {
            const dataBloco = new Date(`${bloco.data}T00:00:00`);
            return dataBloco >= dataAtual;
        });

        if (agendaPublicada.length === 0) {
            agendaPublicadaContainer.innerHTML = `
                <div class="empty-list">
                    <p>Nenhum horário liberado ainda.</p>
                </div>
            `;
            return;
        }

        agendaPublicada.sort((a, b) => new Date(a.data) - new Date(b.data));

        agendaPublicada.forEach((bloco, blocoIndex) => {
            const blocoDiv = document.createElement('div');
            blocoDiv.className = 'published-day-block';
            blocoDiv.innerHTML = `<h4>📅 Dia ${formatarDataBR(bloco.data)}</h4>`;

            bloco.horarios.forEach((h, horarioIndex) => {
                const itemDiv = document.createElement('div');
                itemDiv.className = 'published-item';
                itemDiv.innerHTML = `
                    <div>
                        <strong>${h.hora}</strong> - ${h.servico} 
                        <span style="color: #9CA3AF; font-size: 0.75rem; margin-left: 8px;">(${h.vagas} vagas)</span>
                    </div>
                    <button class="btn-remove-published" data-bloco="${blocoIndex}" data-horario="${horarioIndex}">×</button>
                `;

                itemDiv.querySelector('.btn-remove-published').addEventListener('click', function() {
                    const certeza = confirm(`Tem certeza que deseja excluir o horário das ${h.hora} (${h.servico}) do dia ${formatarDataBR(bloco.data)}?\n\nIsso impedirá novos agendamentos para este horário.`);
                    if (certeza) {
                        bloco.horarios.splice(horarioIndex, 1);
                        
                        if (bloco.horarios.length === 0) {
                            agendaPublicada.splice(blocoIndex, 1);
                        }

                        localStorage.setItem('agendaPublicadaProfissional', JSON.stringify(agendaPublicada));
                        renderizarAgendaPublicada();
                    }
                });

                blocoDiv.appendChild(itemDiv);
            });

            agendaPublicadaContainer.appendChild(blocoDiv);
        });
    }

    function renderizarNotificacoesLimpas() {
        if (dropdownBody) {
            dropdownBody.innerHTML = '<div class="dropdown-item" style="text-align:center; color:#9ca3af;">Nenhuma notificação por enquanto.</div>';
        }
    }

    inputData.addEventListener('change', () => {
        renderizarChips();
    });

    btnAdicionar.addEventListener('click', () => {
        const dataVal = inputData.value;
        const servicoVal = selectServico.value;
        const timeVal = inputTime.value;
        const vagasVal = inputVagas.value;

        if (!dataVal || !timeVal || !vagasVal) {
            alert('Por favor, preencha todos os campos do horário antes de adicionar.');
            return;
        }

        if (!horariosTemporarios[dataVal]) {
            horariosTemporarios[dataVal] = [];
        }

        horariosTemporarios[dataVal].push({
            data: dataVal,
            servico: servicoVal,
            hora: timeVal,
            vagas: vagasVal
        });

        inputTime.value = '';
        renderizarChips();
    });

    btnLiberar.addEventListener('click', () => {
        const dataVal = inputData.value;

        if (!dataVal || !horariosTemporarios[dataVal] || horariosTemporarios[dataVal].length === 0) {
            alert('Não existem horários selecionados para este dia para serem liberados.');
            return;
        }

        const indexExistente = agendaPublicada.findIndex(b => b.data === dataVal);

        if (indexExistente > -1) {
            agendaPublicada[indexExistente].horarios = [
                ...agendaPublicada[indexExistente].horarios,
                ...horariosTemporarios[dataVal]
            ];
        } else {
            agendaPublicada.push({
                data: dataVal,
                horarios: [...horariosTemporarios[dataVal]]
            });
        }

        localStorage.setItem('agendaPublicadaProfissional', JSON.stringify(agendaPublicada));

        horariosTemporarios[dataVal] = [];
        renderizarChips();
        renderizarAgendaPublicada();
        alert('Sucesso! Horários publicados e disponíveis para a área do paciente.');
    });

    renderizarChips();
    renderizarAgendaPublicada();
    renderizarNotificacoesLimpas();
});