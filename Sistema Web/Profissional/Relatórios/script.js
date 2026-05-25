window.addEventListener('DOMContentLoaded', () => {
    const filterMes = document.getElementById('report-month');
    const btnExportarPdf = document.getElementById('btn-exportar-pdf');

    const txtAtendimentos = document.getElementById('metric-atendimentos');
    const txtPacientes = document.getElementById('metric-pacientes');
    const txtPresenca = document.getElementById('metric-presenca');

    const barFisioHeight = document.getElementById('bar-fisio-height');
    const barFisioTxt = document.getElementById('bar-fisio-txt');
    const barPilatesHeight = document.getElementById('bar-pilates-height');
    const barPilatesTxt = document.getElementById('bar-pilates-txt');

    const weeksBarsContainer = document.getElementById('weeks-bars-container');

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

    // Arrays clínicos zerados aguardando injeção de dados reais do banco Java
    let sessoesFinalizadas = []; 
    let todosAgendamentosAprovados = []; 
    let pacientesCadastrados = []; 

    function calcularRelatorios() {
        const mesSelecionado = filterMes.value; 

        // 1. Filtra os dados com base no mês do topo
        const sessoesMes = sessoesFinalizadas.filter(s => s.data.startsWith(mesSelecionado));
        const aprovadosMes = todosAgendamentosAprovados.filter(a => a.data.startsWith(mesSelecionado));
        const cadastrosMes = pacientesCadastrados.filter(p => p.dataCadastro.startsWith(mesSelecionado));

        // 2. Calcula Métricas do Topo
        const totalAtendimentos = sessoesMes.length;
        const totalNovosPacientes = cadastrosMes.length;
        
        let taxaPresenca = 0;
        if (aprovadosMes.length > 0) {
            taxaPresenca = Math.round((totalAtendimentos / aprovadosMes.length) * 100);
        }

        txtAtendimentos.textContent = totalAtendimentos;
        txtPacientes.textContent = totalNovosPacientes;
        txtPresenca.textContent = `${taxaPresenca}%`;

        // 3. Calcula Distribuição por Especialidade
        const totalFisio = sessoesMes.filter(s => s.servico === 'Fisioterapia').length;
        const totalPilates = sessoesMes.filter(s => s.servico === 'Pilates').length;

        const maxEspecialidade = Math.max(totalFisio, totalPilates, 1);
        
        const pctFisio = (totalFisio / maxEspecialidade) * 100;
        const pctPilates = (totalPilates / maxEspecialidade) * 100;

        barFisioHeight.style.height = totalFisio > 0 ? `${pctFisio}%` : '8%';
        barFisioTxt.textContent = totalFisio;

        barPilatesHeight.style.height = totalPilates > 0 ? `${pctPilates}%` : '8%';
        barPilatesTxt.textContent = totalPilates;

        // 4. Calcula Evolução por Semana do Mês (Semana 1 a Semana 4)
        let semanasContagem = [0, 0, 0, 0];

        sessoesMes.forEach(s => {
            const dia = parseInt(s.data.split('-')[2]);
            if (dia <= 7) semanasContagem[0]++;
            else if (dia <= 14) semanasContagem[1]++;
            else if (dia <= 21) semanasContagem[2]++;
            else semanasContagem[3]++;
        });

        const maxSemana = Math.max(...semanasContagem, 1);

        weeksBarsContainer.innerHTML = '';
        semanasContagem.forEach((qtd, i) => {
            const pctSemana = (qtd / maxSemana) * 100;
            const row = document.createElement('div');
            row.className = 'week-row';
            row.innerHTML = `
                <div class="week-label">${i + 1}ª Semana</div>
                <div class="week-bar-bg">
                    <div class="week-bar-fill" style="width: ${qtd > 0 ? pctSemana : 0}%"></div>
                </div>
                <div class="week-value">${qtd}</div>
            `;
            weeksBarsContainer.appendChild(row);
        });
    }

    // GATILHO NATIVO DE EXPORTAÇÃO: Configura a folha antes de disparar o gerenciador de impressão
    btnExportarPdf.addEventListener('click', () => {
        const hoje = new Date();
        const dataFormatada = `${String(hoje.getDate()).padStart(2, '0')}/${String(hoje.getMonth() + 1).padStart(2, '0')}/${hoje.getFullYear()}`;
        document.getElementById('print-txt-data').textContent = `Relatório Gerencial Mensal emitido em: ${dataFormatada} | Referente ao período: ${filterMes.value}`;
        
        window.print();
    });

    filterMes.addEventListener('change', calcularRelatorios);

    function renderizacoesIniciais() {
        if (dropdownBody) {
            dropdownBody.innerHTML = '<div class="dropdown-item" style="text-align:center; color:#9ca3af;">Nenhuma notificação por enquanto.</div>';
        }
        calcularRelatorios();
    }

    renderizacoesIniciais();
});