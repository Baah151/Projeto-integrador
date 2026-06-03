// Função do Menu Hamburguer
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

// Controle do Sino de Notificações
function setupNotificacoes() {
    const bell = document.getElementById('bell-button');
    const dropdown = document.getElementById('noti-dropdown');

    if(bell && dropdown) {
        bell.addEventListener('click', function(e) {
            e.stopPropagation();
            dropdown.classList.toggle('show');
        });

        document.addEventListener('click', function() {
            dropdown.classList.remove('show');
        });
    }
}

window.addEventListener('DOMContentLoaded', () => {
    // 1. Inicia o menu e notificações
    gerenciarMenuMobile();
    setupNotificacoes();

    // 2. Dados Mockados (Simulação)
    let pacientesContador = 0; 
    let consultasContador = 0;
    let solicitacoesContador = 0;
    const notificacoesMock = [];
    const agendaMock = []; // Vazio para mostrar o cafézinho

    // 3. Atualiza contadores
    document.getElementById('count-pacientes').textContent = pacientesContador;
    document.getElementById('count-consultas').textContent = consultasContador;
    document.getElementById('count-solicitacoes').textContent = solicitacoesContador;

    // 4. Lógica da Agenda (Cafézinho)
    const agendaEmpty = document.getElementById('agenda-empty');
    const agendaTable = document.getElementById('agenda-table-wrapper');
    const agendaRows = document.getElementById('agenda-rows');

    if (agendaMock.length === 0) {
        if(agendaTable) agendaTable.style.display = 'none';
        if(agendaEmpty) agendaEmpty.style.display = 'block'; // AQUI FAZ O CAFÉ APARECER
    } else {
        if(agendaTable) agendaTable.style.display = 'block';
        if(agendaEmpty) agendaEmpty.style.display = 'none';
        agendaRows.innerHTML = ''; 
        
        agendaMock.forEach(item => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${item.hora}</strong></td>
                <td><span class="servico-badge">${item.servico}</span></td>
                <td>${item.nome}</td>
            `;
            agendaRows.appendChild(tr);
        });
    }

    // 5. Menu Badge
    const menuBadge = document.getElementById('badge-painel');
    if (menuBadge) {
        menuBadge.style.display = notificacoesMock.length > 0 ? 'block' : 'none';
        menuBadge.textContent = notificacoesMock.length;
    }

    // 6. Dropdown de Notificações
    const dropdownBody = document.getElementById('dropdown-body');
    if (dropdownBody) {
        if (notificacoesMock.length === 0) {
            dropdownBody.innerHTML = '<div class="dropdown-item" style="text-align:center; color:#9ca3af;">Nenhuma notificação.</div>';
        } else {
            dropdownBody.innerHTML = '';
            notificacoesMock.forEach(noti => {
                const div = document.createElement('div');
                div.className = 'dropdown-item';
                div.innerHTML = `<strong>✨ ${noti.titulo}</strong><span>${noti.desc}</span>`;
                dropdownBody.appendChild(div);
            });
        }
    }
});