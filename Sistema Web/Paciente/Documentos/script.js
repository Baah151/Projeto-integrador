// ARRAY ORIGINAL INICIALIZA VAZIO AGUARDANDO CONSUMO DA API REST DO JAVA
const bancoDocumentos = [];

function renderizarDocumentos(filtroData = "") {
    const listContainer = document.getElementById('docs-list');
    if (!listContainer) return;
    listContainer.innerHTML = '';

    const dadosFiltrados = bancoDocumentos.filter(item => {
        if (!filtroData) return true;
        if (!item.dataAlteracao) return false;
        const partesFiltro = filtroData.split('-');
        const anoFiltro = partesFiltro[0];
        const mesFiltro = partesFiltro[1];
        
        const partesDoc = item.dataAlteracao.split('/');
        const mesDoc = partesDoc[1];
        const anoDoc = partesDoc[2];
        return mesDoc === mesFiltro && anoDoc === anoFiltro;
    });

    if (dadosFiltrados.length === 0) {
        listContainer.innerHTML = `
            <div class="empty-docs">
                <span class="material-symbols-outlined">inventory_2</span>
                <p>Nenhum documento encontrado ou compartilhado ainda.</p>
            </div>
        `;
        return;
    }

    dadosFiltrados.forEach(item => {
        const row = document.createElement('div');
        row.className = 'docs-item';
        
        if (item.origem === 'professional' && !item.lido) {
            row.classList.add('new-doc');
        }

        const badgeNovo = (item.origem === 'professional' && !item.lido) ? `<span class="new-badge">Novo</span>` : '';

        row.innerHTML = `
            <span>${item.dataAlteracao || ''}</span>
            <span style="font-weight: 500; color: #1F2937;">${item.nome || ''} ${badgeNovo}</span>
            <span class="status-encaminhado">Encaminhado</span>
            <a href="#" class="btn-download-table" onclick="visualizarDoc(${item.id})">
                <span class="material-symbols-outlined">download</span>
            </a>
        `;
        listContainer.appendChild(row);
    });

    atualizarSininho();
}

function atualizarSininho() {
    const badgeSininho = document.getElementById('notif-badge');
    const badgeMenu = document.getElementById('menu-notif-badge');
    const naoLidos = bancoDocumentos.filter(d => d.origem === 'professional' && !d.lido).length;

    if (badgeSininho) {
        if (naoLidos > 0) {
            badgeSininho.innerText = naoLidos;
            badgeSininho.style.display = 'flex';
        } else {
            badgeSininho.style.display = 'none';
        }
    }

    if (badgeMenu) {
        if (naoLidos > 0) {
            badgeMenu.innerText = naoLidos;
            badgeMenu.style.display = 'flex';
        } else {
            badgeMenu.style.display = 'none';
        }
    }
}

function visualizarDoc(id) {
    const doc = bancoDocumentos.find(d => d.id === id);
    if (doc) doc.lido = true;
    
    alert('Simulação: Abrindo documento...');
    const filterInput = document.getElementById('month-year-filter');
    renderizarDocumentos(filterInput ? filterInput.value : "");
}

function limparNotificacoes() {
    bancoDocumentos.forEach(d => {
        if (d.origem === 'professional') d.lido = true;
    });
    const filterInput = document.getElementById('month-year-filter');
    renderizarDocumentos(filterInput ? filterInput.value : "");
}

function filtrarDocumentos() {
    const filterInput = document.getElementById('month-year-filter');
    if (filterInput) renderizarDocumentos(filterInput.value);
}

function uploadGenerico() {
    const input = document.getElementById('file-upload');
    if (input && input.files.length > 0) {
        const novoDoc = {
            id: Date.now(),
            dataAlteracao: new Date().toLocaleDateString('pt-BR'),
            name: input.files[0].name,
            origem: 'paciente',
            lido: true
        };
        bancoDocumentos.unshift(novoDoc);
        renderizarDocumentos();
        input.value = '';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    renderizarDocumentos();
});