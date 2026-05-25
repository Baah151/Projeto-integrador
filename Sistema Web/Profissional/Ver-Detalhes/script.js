document.addEventListener('DOMContentLoaded', () => {
    const filterMes = document.getElementById('filter-mes');
    const timelineContainer = document.getElementById('timeline-container');
    const timelineEmpty = document.getElementById('timeline-empty');
    const countConcluidas = document.getElementById('count-concluidas');

    const modalEditar = document.getElementById('modal-editar');
    const modalConfirmarSalvar = document.getElementById('modal-confirmar-salvar');
    const modalExcluir = document.getElementById('modal-excluir');

    const btnAbrirEditar = document.getElementById('btn-abrir-editar');
    const btnFecharEditar = document.getElementById('btn-fechar-editar');
    const btnAbrirExcluir = document.getElementById('btn-abrir-excluir');

    const btnCancelarConfirmacao = document.getElementById('btn-cancelar-confirmacao');
    const btnConcluirSalvamento = document.getElementById('btn-concluir-salvamento');
    const btnCancelarExclusao = document.getElementById('btn-cancelar-exclusao');
    const btnConcluirExclusao = document.getElementById('btn-concluir-exclusao');

    const formEditar = document.getElementById('form-editar-dados');
    const inputCpf = document.getElementById('edit-cpf');
    const inputTelefone = document.getElementById('edit-telefone');
    const inputCep = document.getElementById('edit-cep');

    let pacienteAtual = null;
    let historicoSessoes = [];

    inputCpf.addEventListener('input', (e) => {
        let v = e.target.value.replace(/\D/g, "");
        if (v.length > 11) v = v.substring(0, 11);
        v = v.replace(/(\d{3})(\d)/, "$1.$2");
        v = v.replace(/(\d{3})(\d)/, "$1.$2");
        v = v.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
        e.target.value = v;
    });

    inputTelefone.addEventListener('input', (e) => {
        let v = e.target.value.replace(/\D/g, "");
        if (v.length > 11) v = v.substring(0, 11);
        v = v.replace(/^(\d{2})(\d)/g, "($1) $2");
        v = v.replace(/(\d{5})(\d)/, "$1-$2");
        e.target.value = v;
    });

    inputCep.addEventListener('input', (e) => {
        let v = e.target.value.replace(/\D/g, "");
        if (v.length > 8) v = v.substring(0, 8);
        v = v.replace(/^(\d{5})(\d)/, "$1-$2");
        e.target.value = v;
    });

    inputCep.addEventListener('blur', async () => {
        const cep = inputCep.value.replace(/\D/g, "");
        if (cep.length === 8) {
            try {
                const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
                const dados = await res.json();
                if (!dados.erro) {
                    document.getElementById('edit-logradouro').value = dados.logradouro || "";
                    document.getElementById('edit-bairro').value = dados.bairro || "";
                    document.getElementById('edit-cidade').value = dados.localidade || "";
                    document.getElementById('edit-estado').value = dados.uf || "";
                }
            } catch (e) {}
        }
    });

    function formatarDataBR(dataString) {
        if (!dataString) return "--/--/----";
        const partes = dataString.split('-');
        return `${partes[2]}/${partes[1]}/${partes[0]}`;
    }

    function renderizarProntuario() {
        if (!pacienteAtual) {
            document.getElementById('detalhe-nome-header').textContent = "Selecione um Paciente";
            document.getElementById('detalhe-sub-registro').textContent = "Idade: -- anos • Nasc: --/--/---- • CPF: ---.---.---.--";
            document.getElementById('detalhe-sub-contato').innerHTML = `
                <span class="material-symbols-outlined">call</span> (--) ----- ----- 
                <span class="material-symbols-outlined">mail</span> sem-email@sistema.com
            `;
            document.getElementById('detalhe-sub-endereco').innerHTML = `
                <span class="material-symbols-outlined" style="font-size: 14px; vertical-align: middle;">location_on</span> Endereço não informado
            `;
            return;
        }

        document.getElementById('detalhe-nome-header').textContent = pacienteAtual.nome;
        document.getElementById('detalhe-sub-registro').textContent = `Nasc: ${formatarDataBR(pacienteAtual.nascimento)} • CPF: ${pacienteAtual.cpf}`;
        document.getElementById('detalhe-sub-contato').innerHTML = `
            <span class="material-symbols-outlined">call</span> ${pacienteAtual.telefone} 
            <span class="material-symbols-outlined">mail</span> ${pacienteAtual.email}
        `;
        document.getElementById('detalhe-sub-endereco').innerHTML = `
            <span class="material-symbols-outlined" style="font-size: 14px; vertical-align: middle;">location_on</span> 
            ${pacienteAtual.logradouro}, Nº ${pacienteAtual.numero} - ${pacienteAtual.bairro}, ${pacienteAtual.cidade}/${pacienteAtual.estado} (CEP: ${pacienteAtual.cep})
        `;

        const alertaBox = document.getElementById('bloco-alertas');
        const txtAlertas = document.getElementById('txt-observacoes-clinicas');

        if (pacienteAtual.obsClinicas && pacienteAtual.obsClinicas.trim() !== "") {
            alertaBox.classList.remove('empty-alert');
            txtAlertas.textContent = pacienteAtual.obsClinicas;
        } else {
            alertaBox.classList.add('empty-alert');
            txtAlertas.textContent = "Nenhuma observation cadastrada para este paciente. Clique em Editar para registrar restrições físicas, patologias ou patamares clínicos.";
        }
    }

    function renderizarLinhaTempo() {
        const blocosAntigos = timelineContainer.querySelectorAll('.session-history-block');
        blocosAntigos.forEach(b => b.remove());

        const mesFiltro = filterMes.value; 
        const filtradas = historicoSessoes.filter(s => s.data.startsWith(mesFiltro));
        countConcluidas.textContent = historicoSessoes.length;

        if (filtradas.length === 0) {
            timelineEmpty.style.display = 'block';
            return;
        }

        timelineEmpty.style.display = 'none';
        filtradas.sort((a, b) => b.data.localeCompare(a.data));

        filtradas.forEach((sessao, index) => {
            const bloco = document.createElement('div');
            bloco.className = 'session-history-block';

            const linkDocumento = sessao.docPaciente 
                ? `<a href="../assets/docs_pacientes/${sessao.docPaciente}" download style="color:#046C4E; font-weight:600; text-decoration:underline;">📄 Baixar ${sessao.docPaciente}</a>`
                : "Nenhum arquivo enviado.";

            bloco.innerHTML = `
                <div class="session-block-header">
                    <h5>Sessão de ${sessao.servico} • ${formatarDataBR(sessao.data)}</h5>
                    <span class="session-block-value">R$ ${parseFloat(sessao.valorFinal).toFixed(2)}</span>
                </div>
                <div class="session-grid-data">
                    <div class="session-data-box">
                        <label>Observações do Agendamento (Paciente)</label>
                        <p>${sessao.obsPaciente || "Nenhuma observação enviada pelo paciente."}</p>
                    </div>
                    <div class="session-data-box">
                        <label>Documentação Anexada pelo Paciente</label>
                        <p>${linkDocumento}</p>
                    </div>
                </div>
                <div class="session-grid-data">
                    <div class="session-data-box" style="grid-column: span 2;">
                        <label>Evolução da Sessão e Nota Clínica (Luana)</label>
                        <p>${sessao.notaClinica || "Sessão finalizada sem descrição de nota de texto."}</p>
                    </div>
                </div>
                <div class="session-laudo-panel">
                    <div class="laudo-input-wrapper" id="laudo-wrapper-${index}">
                        ${sessao.laudoEnviado ? `
                            <span class="status-enviado-label">
                                <span class="material-symbols-outlined" style="font-size:16px;">check_circle</span> Enviado (Laudo Clínico anexado)
                            </span>
                        ` : `
                            <input type="file" id="laudo-file-${index}" accept=".pdf,image/*" style="font-size:0.8rem; color:#4b5563;">
                            <button class="btn-laudo-send" data-index="${index}">Enviar</button>
                        `}
                    </div>
                </div>
            `;

            const btnEnviar = bloco.querySelector('.btn-laudo-send');
            if (btnEnviar) {
                btnEnviar.addEventListener('click', () => {
                    const fileInput = document.getElementById(`laudo-file-${index}`);
                    
                    if (!fileInput.files || fileInput.files.length === 0) {
                        alert("Por favor, selecione um arquivo de laudo (PDF ou Imagem) antes de clicar em enviar.");
                        return;
                    }

                    sessao.laudoEnviado = true;
                    document.getElementById(`laudo-wrapper-${index}`).innerHTML = `
                        <span class="status-enviado-label">
                            <span class="material-symbols-outlined" style="font-size:16px;">check_circle</span> Enviado (Laudo Clínico anexado)
                        </span>
                    `;
                    alert("Sucesso! O laudo clínico foi processado.");
                });
            }

            timelineContainer.appendChild(bloco);
        });
    }

    function popularCamposFormulario() {
        if (!pacienteAtual) {
            formEditar.reset();
            return;
        }
        document.getElementById('edit-nome').value = pacienteAtual.nome || "";
        document.getElementById('edit-cpf').value = pacienteAtual.cpf || "";
        document.getElementById('edit-nascimento').value = pacienteAtual.nascimento || "";
        document.getElementById('edit-email').value = pacienteAtual.email || "";
        document.getElementById('edit-telefone').value = pacienteAtual.telefone || "";
        document.getElementById('edit-obs-clinicas').value = pacienteAtual.obsClinicas || "";
        document.getElementById('edit-cep').value = pacienteAtual.cep || "";
        document.getElementById('edit-logradouro').value = pacienteAtual.logradouro || "";
        document.getElementById('edit-numero').value = pacienteAtual.numero || "";
        document.getElementById('edit-bairro').value = pacienteAtual.bairro || "";
        document.getElementById('edit-complemento').value = pacienteAtual.complemento || "";
        document.getElementById('edit-cidade').value = pacienteAtual.cidade || "";
        document.getElementById('edit-estado').value = pacienteAtual.estado || "";
    }

    btnAbrirEditar.addEventListener('click', () => {
        popularCamposFormulario();
        modalEditar.classList.add('active');
    });

    btnFecharEditar.addEventListener('click', () => modalEditar.classList.remove('active'));

    formEditar.addEventListener('submit', (e) => {
        e.preventDefault();

        const cpfLimpo = inputCpf.value.replace(/\D/g, "");
        const telLimpo = inputTelefone.value.replace(/\D/g, "");
        const emailValor = document.getElementById('edit-email').value.trim();
        const cepLimpo = inputCep.value.replace(/\D/g, "");

        if (cpfLimpo.length !== 11) {
            alert("Erro: O número de CPF informado está incompleto.");
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(emailValor)) {
            alert("Erro: Por favor, insira uma estrutura de E-mail válida.");
            return;
        }

        if (telLimpo.length !== 10 && telLimpo.length !== 11) {
            alert("Erro: O número de Telefone/WhatsApp informado está incompleto.");
            return;
        }

        if (cepLimpo.length !== 8) {
            alert("Erro: CEP incompleto.");
            return;
        }

        modalConfirmarSalvar.classList.add('active');
    });

    btnCancelarConfirmacao.addEventListener('click', () => modalConfirmarSalvar.classList.remove('active'));

    btnConcluirSalvamento.addEventListener('click', () => {
        pacienteAtual = {
            nome: document.getElementById('edit-nome').value,
            cpf: inputCpf.value,
            nascimento: document.getElementById('edit-nascimento').value,
            email: document.getElementById('edit-email').value,
            telefone: inputTelefone.value,
            obsClinicas: document.getElementById('edit-obs-clinicas').value,
            cep: inputCep.value,
            logradouro: document.getElementById('edit-logradouro').value,
            numero: document.getElementById('edit-numero').value,
            bairro: document.getElementById('edit-bairro').value,
            complemento: document.getElementById('edit-complemento').value,
            cidade: document.getElementById('edit-cidade').value,
            estado: document.getElementById('edit-estado').value
        };

        renderizarProntuario();
        modalConfirmarSalvar.classList.remove('active');
        modalEditar.classList.remove('active');
        alert("Sucesso! Prontuário cadastrado e atualizado.");
    });

    btnAbrirExcluir.addEventListener('click', () => modalExcluir.classList.add('active'));
    btnCancelarExclusao.addEventListener('click', () => modalExcluir.classList.remove('active'));
    
    btnConcluirExclusao.addEventListener('click', () => {
        const motivo = document.getElementById('excluir-motivo').value;
        if (!motivo) {
            alert("Por favor, selecione o motivo.");
            return;
        }
        alert("Conta Excluída com sucesso.");
        pacienteAtual = null;
        historicoSessoes = [];
        renderizarProntuario();
        renderizarLinhaTempo();
        window.location.href = "../pacientes/index.html";
    });

    filterMes.addEventListener('change', renderizarLinhaTempo);

    renderizarProntuario();
    renderizarLinhaTempo();
});