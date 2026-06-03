let dadosDoServidor = {
    fisioterapia: {},
    pilates: {}
};
let horarioSelecionado = null;

function carregarAgendasDoLocalStorage() {
    const dadosSalvos = localStorage.getItem('agendaPublicadaProfissional');
    
    dadosDoServidor = {
        fisioterapia: {},
        pilates: {}
    };

    if (dadosSalvos) {
        const blocosAgenda = JSON.parse(dadosSalvos);
        
        blocosAgenda.forEach(bloco => {
            const dataBloco = bloco.data;
            
            if (bloco.horarios) {
                bloco.horarios.forEach(h => {
                    const canalServico = h.servico.toLowerCase(); 
                    
                    if (dadosDoServidor[canalServico]) {
                        if (!dadosDoServidor[canalServico][dataBloco]) {
                            dadosDoServidor[canalServico][dataBloco] = [];
                        }
                        
                        dadosDoServidor[canalServico][dataBloco].push({
                            hora: h.hora,
                            vagas: parseInt(h.vagas || 0)
                        });
                    }
                });
            }
        });
    }
}

function carregarDatas() {
    const servicoElem = document.getElementById('servico');
    const dateSelect = document.getElementById('date-select');
    const timeSection = document.getElementById('time-section');
    
    if (!servicoElem || !dateSelect) return;
    const servico = servicoElem.value;
    
    dateSelect.innerHTML = '<option value="" disabled selected>Selecione uma data</option>';
    if (timeSection) timeSection.style.display = 'none';
    horarioSelecionado = null;

    carregarAgendasDoLocalStorage();

    if (servico && dadosDoServidor[servico] && Object.keys(dadosDoServidor[servico]).length > 0) {
        dateSelect.disabled = false;
        
        Object.keys(dadosDoServidor[servico]).forEach(data => {
            const partes = data.split('-');
            const dataFormatada = `${partes[2]}/${partes[1]}/${partes[0]}`;
            
            const option = document.createElement('option');
            option.value = data;
            option.textContent = dataFormatada;
            dateSelect.appendChild(option);
        });
    } else if (servico) {
        dateSelect.disabled = true;
        dateSelect.innerHTML = '<option value="" disabled selected>Nenhuma data disponível para este serviço</option>';
    }
}

function showTimes() {
    const servicoElem = document.getElementById('servico');
    const dateSelect = document.getElementById('date-select');
    const timeSection = document.getElementById('time-section');
    const timeGrid = document.getElementById('time-grid');

    if (!servicoElem || !dateSelect || !timeGrid) return;
    const servico = servicoElem.value;
    const dataEscolhida = dateSelect.value;

    timeGrid.innerHTML = ''; 
    horarioSelecionado = null;

    if (servico && dataEscolhida && dadosDoServidor[servico][dataEscolhida]) {
        if (timeSection) timeSection.style.display = 'block'; 

        const listaHorarios = dadosDoServidor[servico][dataEscolhida];
        listaHorarios.sort((a, b) => a.hora.localeCompare(b.hora));

        listaHorarios.forEach(item => {
            const divSlot = document.createElement('div');
            divSlot.classList.add('time-slot');
            divSlot.textContent = item.hora;

            if (item.vagas <= 0) {
                divSlot.classList.add('esgotado');
            } else {
                divSlot.addEventListener('click', () => {
                    document.querySelectorAll('.time-slot').forEach(slot => slot.classList.remove('selected'));
                    divSlot.classList.add('selected');
                    horarioSelecionado = item.hora;
                });
            }

            timeGrid.appendChild(divSlot);
        });
    }
}

function updateFileName() {
    const input = document.getElementById('exam-file');
    const text = document.getElementById('file-text');
    if (input && text && input.files.length > 0) {
        text.innerText = "✅ " + input.files[0].name;
    }
}

function gerenciarMenuMobile() {
    const openBtn = document.getElementById('open-menu-btn');
    const closeBtn = document.getElementById('close-menu-btn');
    const sidebar = document.getElementById('mobile-sidebar');
    const backdrop = document.getElementById('menu-backdrop');

    if (!openBtn || !sidebar || !backdrop) return;

    openBtn.addEventListener('click', () => {
        sidebar.classList.add('open');
        backdrop.classList.add('active');
    });

    const fecharMenu = () => {
        sidebar.classList.remove('open');
        backdrop.classList.remove('active');
    };

    if (closeBtn) closeBtn.addEventListener('click', fecharMenu);
    backdrop.addEventListener('click', fecharMenu);
}

document.addEventListener('DOMContentLoaded', () => {
    gerenciarMenuMobile();
    
    const formSol = document.getElementById('form-solicitacao');
    if (formSol) {
        formSol.addEventListener('submit', (e) => {
            e.preventDefault();

            if (!horarioSelecionado) {
                alert('Por favor, selecione um horário disponível para a sua consulta.');
                return;
            }

            const servicoVal = document.getElementById('servico') ? document.getElementById('servico').value : '';
            const dataVal = document.getElementById('date-select') ? document.getElementById('date-select').value : '';
            const obsVal = document.getElementById('observacoes') ? document.getElementById('observacoes').value : '';

            const dadosAgendamento = {
                servico: servicoVal,
                data: dataVal,
                horario: horarioSelecionado,
                observacoes: obsVal,
                nomePaciente: "Paciente Logado"
            };

            localStorage.setItem('dadosAgendamentoPaciente', JSON.stringify(dadosAgendamento));

            const API_URL = 'http://localhost:8080/api/agendamentos';

            fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dadosAgendamento)
            })
            .then(response => {
                const modal = document.getElementById('modal-sucesso');
                if (modal) modal.classList.add('active');
            })
            .catch(() => {
                const modal = document.getElementById('modal-sucesso');
                if (modal) modal.classList.add('active');
            });
        });
    }
});