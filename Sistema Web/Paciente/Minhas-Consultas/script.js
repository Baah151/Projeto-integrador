let consultasPaciente = [];

function carregarNotificacoesMecanica() {
    const bellButton = document.getElementById('bell-button');
    const notiDropdown = document.getElementById('noti-dropdown');
    const dropdownBody = document.getElementById('dropdown-body');
    const notiBadge = document.getElementById('noti-badge');
    const menuBadge = document.getElementById('consultas-notif-badge');

    if (!bellButton || !notiDropdown || !dropdownBody) return;

    bellButton.addEventListener('click', function(e) {
        e.stopPropagation();
        notiDropdown.classList.toggle('show');
    });

    document.addEventListener('click', function() {
        notiDropdown.classList.remove('show');
    });

    dropdownBody.innerHTML = '';
    let contagemNotificacoes = 0;

    consultasPaciente.forEach(c => {
        if (c.status === 'aguardando' || c.status === 'pendente' || c.status === 'confirmado' || c.status === 'reagendado') {
            contagemNotificacoes++;
            const item = document.createElement('div');
            item.classList.add('dropdown-item');
            
            if (c.status === 'aguardando') {
                item.innerHTML = `Sua solicitação para o dia ${c.data} às ${c.horario} foi enviada e está <strong>aguardando validação</strong>.`;
            } else if (c.status === 'confirmado') {
                item.innerHTML = `Seu agendamento para o dia ${c.data} às ${c.horario} foi <strong>aprovado com sucesso!</strong>`;
            } else if (c.status === 'pendente') {
                item.innerHTML = `Atenção: Seu agendamento do dia ${c.data} possui uma <strong>pendência</strong> pendente de ajuste.`;
            } else if (c.status === 'reagendado') {
                item.innerHTML = `Aviso: Seu agendamento foi <strong>reagendado pela profissional</strong> para o dia ${c.data} às ${c.horario}.`;
            }
            dropdownBody.appendChild(item);
        }
    });

    if (contagemNotificacoes > 0) {
        if (notiBadge) {
            notiBadge.textContent = contagemNotificacoes;
            notiBadge.style.display = 'block';
        }
        if (menuBadge) {
            menuBadge.textContent = contagemNotificacoes;
            menuBadge.style.display = 'flex';
        }
    } else {
        if (notiBadge) notiBadge.style.display = 'none';
        if (menuBadge) menuBadge.style.display = 'none';
        dropdownBody.innerHTML = '<div class="dropdown-item" style="text-align:center; color:#9ca3af;">Nenhuma notificação recente.</div>';
    }
}

function carregarTelaConsultas() {
    const container = document.getElementById('appointments-container');
    if (!container) return;
    
    container.innerHTML = '';

    const dadosAtivos = consultasPaciente.filter(item => item.status !== 'cancelado');

    if (dadosAtivos.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📅</div>
                <h2>Nenhuma consulta encontrada</h2>
                <p>Você ainda não possui nenhum agendamento confirmado ou solicitado para os próximos dias.</p>
                <a href="../agendamento/index.html" class="btn-empty">Agendar Agora</a>
            </div>
        `;
        return;
    }

    dadosAtivos.forEach(consulta => {
        const itemRow = document.createElement('div');
        itemRow.classList.add('appointment-row');

        let textoEtiqueta = '';
        if (consulta.status === 'aguardando') textoEtiqueta = 'Aguardando aprovação';
        if (consulta.status === 'confirmado') textoEtiqueta = 'Confirmado';
        if (consulta.status === 'pendente') textoEtiqueta = 'Pendente';
        if (consulta.status === 'reagendado') textoEtiqueta = 'Reagendado';

        let docConteudo = 'Nenhum';
        if (consulta.documento) {
            docConteudo = `
                <a href="#" class="btn-download-table" onclick="alert('Simulação: Baixando documento...')">
                    <span class="material-symbols-outlined" style="font-size: 16px;">download</span> Baixar
                </a>
            `;
        }

        let html = `
            <div class="row-main">
                <span>${consulta.data || ''}</span>
                <span>${consulta.horario || ''}</span>
                <span style="font-weight: 500; color: #1F2937;">${consulta.servico || ''}</span>
                <div>${docConteudo}</div>
                <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 150px;" title="${consulta.observacoes || ''}">${consulta.observacoes || 'Nenhuma'}</span>
                <span class="status-text ${consulta.status || ''}">${textoEtiqueta}</span>
            </div>
        `;

        if (consulta.status === 'pendente') {
            html += `
                <div class="pending-inner-box">
                    <p><strong>Pendente:</strong> ${consulta.mensagemFeedback || ''}</p>
                    <a href="../agendamento/index.html?id=${consulta.id || ''}" class="btn-edit-table">Editar</a>
                </div>
            `;
        }

        itemRow.innerHTML = html;
        container.appendChild(itemRow);
    });
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
    carregarTelaConsultas();
    carregarNotificacoesMecanica();
    gerenciarMenuMobile();
});