document.getElementById('bell-button').addEventListener('click', function(e) {
    e.stopPropagation();
    document.getElementById('noti-dropdown').classList.toggle('show');
});

document.addEventListener('click', function() {
    document.getElementById('noti-dropdown').classList.remove('show');
});

window.addEventListener('DOMContentLoaded', () => {
    let pacientesContador = 0; 
    let consultasContador = 0;
    let solicitacoesContador = 0;

    const notificacoesMock = [];
    const agendaMock = [];

    document.getElementById('count-pacientes').textContent = pacientesContador;
    document.getElementById('count-consultas').textContent = consultasContador;
    document.getElementById('count-solicitacoes').textContent = solicitacoesContador;

    const agendaRows = document.getElementById('agenda-rows');
    if (agendaMock.length === 0) {
        document.getElementById('agenda-table-wrapper').style.display = 'none';
        document.getElementById('agenda-empty').style.display = 'block';
    } else {
        document.getElementById('agenda-table-wrapper').style.display = 'block';
        document.getElementById('agenda-empty').style.display = 'none';
        agendaRows.innerHTML = ''; 
        
        agendaMock.forEach(item => {
            const ehPilates = item.servico.toLowerCase().includes('pilates');
            const bgCor = ehPilates ? '#FEF3C7' : '#E0F2FE'; 
            const textoCor = ehPilates ? '#B45309' : '#0369a1'; 

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${item.hora}</strong></td>
                <td><span style="background:${bgCor}; color:${textoCor}; padding:4px 10px; border-radius:20px; font-size:0.78rem; font-weight:600;">${item.servico}</span></td>
                <td>${item.nome}</td>
            `;
            agendaRows.appendChild(tr);
        });
    }

    document.getElementById('noti-badge').textContent = notificacoesMock.length;
    
    const menuBadge = document.getElementById('menu-badge');
    if (menuBadge) {
        if (notificacoesMock.length > 0) {
            menuBadge.textContent = notificacoesMock.length;
            menuBadge.style.display = 'block';
        } else {
            menuBadge.style.display = 'none';
        }
    }

    const dropdownBody = document.getElementById('dropdown-body');
    dropdownBody.innerHTML = '';
    
    if (notificacoesMock.length === 0) {
        dropdownBody.innerHTML = '<div class="dropdown-item" style="text-align:center; color:#9ca3af;">Nenhuma notificação por enquanto.</div>';
    } else {
        notificacoesMock.forEach(noti => {
            const div = document.createElement('div');
            div.className = 'dropdown-item';
            div.innerHTML = `<strong>✨ ${noti.titulo}</strong><span>${noti.desc}</span>`;
            dropdownBody.appendChild(div);
        });
    }

    const aiSideContainer = document.getElementById('ai-messages');
    aiSideContainer.innerHTML = ''; 

    const API_IA_URL = 'http://localhost:8080/api/ia/sugestoes';

    fetch(API_IA_URL)
        .then(response => {
            if (!response.ok) throw new Error('Erro na resposta do servidor');
            return response.json();
        })
        .then(aiMessages => {
            if (!aiMessages || aiMessages.length === 0) {
                mostrarIaEmEspera(aiSideContainer);
            } else {
                renderizarSugestoesIA(aiMessages, aiSideContainer);
            }
        })
        .catch(() => {
            mostrarIaEmEspera(aiSideContainer);
        });
});

function mostrarIaEmEspera(container) {
    container.innerHTML = `
        <div class="ai-card empty-ai">
            <p>✨ <strong>IA em espera:</strong> Assim que os pacientes realizarem os primeiros cadastros, eu começarei a dar sugestões e alertas clínicos aqui.</p>
        </div>
    `;
}

function renderizarSugestoesIA(messages, container) {
    container.innerHTML = '';
    messages.forEach(msg => {
        const card = document.createElement('div');
        card.className = 'ai-card';
        card.id = msg.id;
        card.style.display = 'flex';
        card.style.justifyContent = 'space-between';
        card.style.alignItems = 'flex-start';
        card.style.gap = '15px';
        card.style.position = 'relative';

        card.innerHTML = `
            <div style="flex: 1;">
                <strong>💡 ${msg.titulo}</strong>
                <span>${msg.desc}</span>
            </div>
            <button class="btn-close-ai" style="background:none; border:none; color:#10B981; font-weight:700; font-size:16px; cursor:pointer; padding: 0 5px; transition: 0.2s;" onmouseover="this.style.color='#ef4444'" onmouseout="this.style.color='#10B981'">×</button>
        `;

        card.querySelector('.btn-close-ai').addEventListener('click', function() {
            card.style.opacity = '0';
            card.style.transform = 'scale(0.95)';
            card.style.transition = '0.3s';
            setTimeout(() => {
                card.remove();
                if (container.children.length === 0) {
                    container.innerHTML = `
                        <div class="ai-card empty-ai">
                            <p>✨ <strong>IA em espera:</strong> Sem sugestões pendentes no momento.</p>
                        </div>
                    `;
                }
            }, 300);
        });

        container.appendChild(card);
    });
}