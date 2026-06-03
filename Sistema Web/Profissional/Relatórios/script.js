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

window.addEventListener('DOMContentLoaded', () => {
    gerenciarMenuMobile();

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
            if (notiDropdown) notiDropdown.classList.toggle('show');
        });
    }

    document.addEventListener('click', function() {
        if (notiDropdown) {
            notiDropdown.classList.remove('show');
        }
    });

    let sessoesFinalizadas = []; 
    let todosAgendamentosAprovados = []; 
    let pacientesCadastrados = []; 

    function calcularRelatorios() {
        if (!filterMes) return;
        const mesSelecionado = filterMes.value; 

        const sessoesMes = sessoesFinalizadas.filter(s => s.data && s.data.startsWith(mesSelecionado));
        const aprovadosMes = todosAgendamentosAprovados.filter(a => a.data && a.data.startsWith(mesSelecionado));
        const cadastrosMes = pacientesCadastrados.filter(p => p.dataCadastro && p.dataCadastro.startsWith(mesSelecionado));

        const totalAtendimentos = sessoesMes.length;
        const totalNovosPacientes = cadastrosMes.length;
        
        let taxaPresenca = 0;
        if (aprovadosMes.length > 0) {
            taxaPresenca = Math.round((totalAtendimentos / aprovadosMes.length) * 100);
        }

        if (txtAtendimentos) txtAtendimentos.textContent = totalAtendimentos;
        if (txtPacientes) txtPacientes.textContent = totalNovosPacientes;
        if (txtPresenca) txtPresenca.textContent = `${taxaPresenca}%`;

        const totalFisio = sessoesMes.filter(s => s.servico === 'Fisioterapia').length;
        const totalPilates = sessoesMes.filter(s => s.servico === 'Pilates').length;

        const maxEspecialidade = Math.max(totalFisio, totalPilates, 1);
        
        const pctFisio = (totalFisio / maxEspecialidade) * 100;
        const pctPilates = (totalPilates / maxEspecialidade) * 100;

        if (barFisioHeight) barFisioHeight.style.height = totalFisio > 0 ? `${pctFisio}%` : '8%';
        if (barFisioTxt) barFisioTxt.textContent = totalFisio;

        if (barPilatesHeight) barPilatesHeight.style.height = totalPilates > 0 ? `${pctPilates}%` : '8%';
        if (barPilatesTxt) barPilatesTxt.textContent = totalPilates;

        let semanasContagem = [0, 0, 0, 0];

        sessoesMes.forEach(s => {
            if (s.data) {
                const dia = parseInt(s.data.split('-')[2]);
                if (dia <= 7) semanasContagem[0]++;
                else if (dia <= 14) semanasContagem[1]++;
                else if (dia <= 21) semanasContagem[2]++;
                else semanasContagem[3]++;
            }
        });

        const maxSemana = Math.max(...semanasContagem, 1);

        if (weeksBarsContainer) {
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
    }

    if (btnExportarPdf) {
        btnExportarPdf.addEventListener('click', () => {
            const hoje = new Date();
            const dataFormatada = `${String(hoje.getDate()).padStart(2, '0')}/${String(hoje.getMonth() + 1).padStart(2, '0')}/${hoje.getFullYear()}`;
            const printTxt = document.getElementById('print-txt-data');
            const mesVal = filterMes ? filterMes.value : '--';
            if (printTxt) printTxt.textContent = `Relatório Gerencial Mensal emitido em: ${dataFormatada} | Referente ao período: ${mesVal}`;
            
            window.print();
        });
    }

    if (filterMes) {
        filterMes.addEventListener('change', calcularRelatorios);
    }

    function renderizacoesIniciais() {
        if (dropdownBody) {
            dropdownBody.innerHTML = '<div class="dropdown-item" style="text-align:center; color:#9ca3af;">Nenhuma notificação por enquanto.</div>';
        }
        calcularRelatorios();
    }

    renderizacoesIniciais();
});