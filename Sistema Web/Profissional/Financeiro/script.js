window.addEventListener('DOMContentLoaded', () => {
    const filterMes = document.getElementById('filter-mes');
    const btnExportar = document.getElementById('btn-exportar');

    const txtFaturamento = document.getElementById('total-faturamento');
    const txtMediaPaciente = document.getElementById('media-paciente');
    const txtSessoes = document.getElementById('total-sessoes');

    const financeEmpty = document.getElementById('finance-empty');
    const tableWrapper = document.getElementById('finance-table-wrapper');
    const rowsContainer = document.getElementById('finance-rows');

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

    let sessoesFinalizadasMassa = [];

    function formatarDataBR(dataString) {
        const partes = dataString.split('-');
        return `${partes[2]}/${partes[1]}/${partes[0]}`;
    }

    function processarFinanceiro() {
        rowsContainer.innerHTML = '';
        const mesSelecionado = filterMes.value;

        const filtradas = sessoesFinalizadasMassa.filter(s => s.data.startsWith(mesSelecionado));

        if (filtradas.length === 0) {
            tableWrapper.style.display = 'none';
            financeEmpty.style.display = 'block';
            
            txtFaturamento.textContent = "R$ 0,00";
            txtMediaPaciente.textContent = "R$ 0,00";
            txtSessoes.textContent = "0";
            return;
        }

        financeEmpty.style.display = 'none';
        tableWrapper.style.display = 'block';

        let faturamentoTotal = 0;
        let pacientesDoMes = new Set();

        filtradas.forEach(s => {
            faturamentoTotal += parseFloat(s.valor);
            if (s.pacienteId) {
                pacientesDoMes.add(s.pacienteId);
            }
        });

        const qtdPacientesUnicos = pacientesDoMes.size > 0 ? pacientesDoMes.size : 1;
        let mediaPorPaciente = faturamentoTotal / qtdPacientesUnicos;

        txtFaturamento.textContent = `R$ ${faturamentoTotal.toFixed(2).replace('.', ',')}`;
        txtMediaPaciente.textContent = `R$ ${mediaPorPaciente.toFixed(2).replace('.', ',')}`;
        txtSessoes.textContent = filtradas.length;

        let caixaDiarioMap = {};

        filtradas.forEach(s => {
            if (!caixaDiarioMap[s.data]) {
                caixaDiarioMap[s.data] = { atendimentos: 0, totalValor: 0 };
            }
            caixaDiarioMap[s.data].atendimentos++;
            caixaDiarioMap[s.data].totalValor += parseFloat(s.valor);
        });

        const chavesDiasOrdenados = Object.keys(caixaDiarioMap).sort((a, b) => b.localeCompare(a));

        let maiorValorDia = -1;
        let menorValorDia = Infinity;

        chavesDiasOrdenados.forEach(d => {
            const val = caixaDiarioMap[d].totalValor;
            if (val > maiorValorDia) maiorValorDia = val;
            if (val < menorValorDia) menorValorDia = val;
        });

        chavesDiasOrdenados.forEach(dia => {
            const dadosDia = caixaDiarioMap[dia];
            const tr = document.createElement('tr');

            let badgeHTML = '';
            
            if (dadosDia.totalValor === maiorValorDia && maiorValorDia !== menorValorDia) {
                badgeHTML = `<span class="badge-finance maior">Maior</span>`;
            } else if (dadosDia.totalValor === menorValorDia && maiorValorDia !== menorValorDia) {
                badgeHTML = `<span class="badge-finance menor">Menor</span>`;
            }

            tr.innerHTML = `
                <td><strong>${formatarDataBR(dia)}</strong></td>
                <td>${dadosDia.atendimentos} sessões finalizadas</td>
                <td><strong>R$ ${dadosDia.totalValor.toFixed(2).replace('.', ',')}</strong></td>
                <td style="text-align: right;">${badgeHTML}</td>
            `;

            rowsContainer.appendChild(tr);
        });
    }

    btnExportar.addEventListener('click', () => {
        const t = new Date();
        const dataFormatada = `${String(t.getDate()).padStart(2, '0')}/${String(t.getMonth() + 1).padStart(2, '0')}/${t.getFullYear()}`;
        document.getElementById('print-data-txt').textContent = `Relatório de Performance de Fluxo emitido em: ${dataFormatada} | Competência: ${filterMes.value}`;
        window.print();
    });

    filterMes.addEventListener('change', processarFinanceiro);

    function inicializarPainel() {
        if (dropdownBody) {
            dropdownBody.innerHTML = '<div class="dropdown-item" style="text-align:center; color:#9ca3af;">Nenhuma notificação por enquanto.</div>';
        }
        processarFinanceiro();
    }

    inicializarPainel();
});