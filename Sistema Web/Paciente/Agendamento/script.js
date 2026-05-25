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
            
            bloco.horarios.forEach(h => {
                const canalServico = h.servico.toLowerCase(); 
                
                if (dadosDoServidor[canalServico]) {
                    if (!dadosDoServidor[canalServico][dataBloco]) {
                        dadosDoServidor[canalServico][dataBloco] = [];
                    }
                    
                    dadosDoServidor[canalServico][dataBloco].push({
                        hora: h.hora,
                        vagas: parseInt(h.vagas)
                    });
                }
            });
        });
    }
}

function carregarDatas() {
    const servico = document.getElementById('servico').value;
    const dateSelect = document.getElementById('date-select');
    const timeSection = document.getElementById('time-section');
    
    dateSelect.innerHTML = '<option value="" disabled selected>Selecione uma data</option>';
    timeSection.style.display = 'none';
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
    const servico = document.getElementById('servico').value;
    const dataEscolhida = document.getElementById('date-select').value;
    const timeSection = document.getElementById('time-section');
    const timeGrid = document.getElementById('time-grid');

    timeGrid.innerHTML = ''; 
    horarioSelecionado = null;

    if (servico && dataEscolhida && dadosDoServidor[servico][dataEscolhida]) {
        timeSection.style.display = 'block'; 

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
    if (input.files.length > 0) {
        text.innerText = "✅ " + input.files[0].name;
    }
}

document.getElementById('form-solicitacao').addEventListener('submit', (e) => {
    e.preventDefault();

    if (!horarioSelecionado) {
        alert('Por favor, selecione um horário disponível para a sua consulta.');
        return;
    }

    const dadosAgendamento = {
        servico: document.getElementById('servico').value,
        data: document.getElementById('date-select').value,
        horario: horarioSelecionado,
        observacoes: document.getElementById('observacoes').value,
        nomePaciente: "Paciente Demonstrativo"
    };

    localStorage.setItem('dadosAgendamentoPaciente', JSON.stringify(dadosAgendamento));

    const API_URL = 'http://localhost:8080/api/agendamentos';

    fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dadosAgendamento)
    })
    .then(response => {
        if (response.ok) {
            document.getElementById('modal-sucesso').classList.add('active');
        } else {
            document.getElementById('modal-sucesso').classList.add('active');
        }
    })
    .catch(() => {
        document.getElementById('modal-sucesso').classList.add('active');
    });
});