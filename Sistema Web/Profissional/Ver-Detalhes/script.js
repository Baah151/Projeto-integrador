document.addEventListener('DOMContentLoaded', () => {
    const filterMes = document.getElementById('filter-mes');
    const timelineContainer = document.getElementById('timeline-container');
    const timelineEmpty = document.getElementById('timeline-empty');
    const countConcluidas = document.getElementById('count-concluidas');

    const modalEditar = document.getElementById('modal-editar');
    const modalConfirmarSalvar = document.getElementById('modal-confirmar-salvar');
    const modalExcluir = document.getElementById('modal-excluir');
    const modalAgendar = document.getElementById('modal-agendar-prontuario'); 

    const btnAbrirEditar = document.getElementById('btn-abrir-editar');
    const btnFecharEditar = document.getElementById('btn-fechar-editar');
    const btnAbrirExcluir = document.getElementById('btn-abrir-excluir');
    const btnAbrirAgendar = document.getElementById('btn-abrir-agendar'); 
    const btnFecharAgendar = document.getElementById('btn-fechar-agendar');
    const btnCancelarAgendar = document.getElementById('btn-cancelar-agendar');
    const btnConcluirAgendar = document.getElementById('btn-concluir-agendar');

    const btnCancelarConfirmacao = document.getElementById('btn-cancelar-confirmacao');
    const btnConcluirSalvamento = document.getElementById('btn-concluir-salvamento');
    const btnCancelarExclusao = document.getElementById('btn-cancelar-exclusao');
    const btnConcluirExclusao = document.getElementById('btn-concluir-exclusao');

    const formEditar = document.getElementById('form-editar-dados');
    const inputCpf = document.getElementById('edit-cpf');
    const inputTelefone = document.getElementById('edit-telefone');
    const inputCep = document.getElementById('edit-cep');
    const containerVagas = document.getElementById('container-vagas-publicadas');

    // ARRAYS INICIAIS ORIGINALMENTE LIMPOD AGUARDANDO CONSUMO DE SUAS ROTAS REST
    let pacienteAtual = null;
    let historicoSessoes = [];
    let vagaSelecionadaDados = null; 

    if (inputCpf) {
        inputCpf.addEventListener('input', (e) => {
            let v = e.target.value.replace(/\D/g, "");
            if (v.length > 11) v = v.substring(0, 11);
            v = v.replace(/(\d{3})(\d)/, "$1.$2");
            v = v.replace(/(\d{3})(\d)/, "$1.$2");
            v = v.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
            e.target.value = v;
        });
    }

    if (inputTelefone) {
        inputTelefone.addEventListener('input', (e) => {
            let v = e.target.value.replace(/\D/g, "");
            if (v.length > 11) v = v.substring(0, 11);
            v = v.replace(/^(\d{2})(\d)/g, "($1) $2");
            v = v.replace(/(\d{5})(\d)/, "$1-$2");
            e.target.value = v;
        });
    }

    if (inputCep) {
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
                        if(document.getElementById('edit-logradouro')) document.getElementById('edit-logradouro').value = dados.logradouro || "";
                        if(document.getElementById('edit-bairro')) document.getElementById('edit-bairro').value = dados.bairro || "";
                        if(document.getElementById('edit-cidade')) document.getElementById('edit-cidade').value = dados.localidade || "";
                        if(document.getElementById('edit-estado')) document.getElementById('edit-estado').value = dados.uf || "";
                    }
                } catch (e) {}
            }
        });
    }

    function formatarDataBR(dataString) {
        if (!dataString) return "--/--/----";
        const partes = dataString.split('-');
        return `${partes[2]}/${partes[1]}/${partes[0]}`;
    }

    function renderizarProntuario() {
        if (!pacienteAtual) {
            if(document.getElementById('detalhe-nome-header')) document.getElementById('detalhe-nome-header').textContent = "Selecione um Paciente";
            if(document.getElementById('detalhe-sub-registro')) document.getElementById('detalhe-sub-registro').textContent = "Idade: -- anos • Nasc: --/--/---- • CPF: ---.---.---.--";
            if(document.getElementById('detalhe-sub-contato')) {
                document.getElementById('detalhe-sub-contato').innerHTML = `
                    <span class="material-symbols-outlined">call</span> (--) ----- ----- 
                    <span class="material-symbols-outlined">mail</span> sem-email@sistema.com
                `;
            }
            if(document.getElementById('detalhe-sub-endereco')) {
                document.getElementById('detalhe-sub-endereco').innerHTML = `
                    <span class="material-symbols-outlined" style="font-size: 14px; vertical-align: middle;">location_on</span> Endereço não informado
                `;
            }
            return;
        }

        if(document.getElementById('detalhe-nome-header')) document.getElementById('detalhe-nome-header').textContent = pacienteAtual.nome;
        if(document.getElementById('detalhe-sub-registro')) document.getElementById('detalhe-sub-registro').textContent = `Nasc: ${formatarDataBR(pacienteAtual.nascimento)} • CPF: ${pacienteAtual.cpf}`;
        if(document.getElementById('detalhe-sub-contato')) {
            document.getElementById('detalhe-sub-contato').innerHTML = `
                <span class="material-symbols-outlined">call</span> ${pacienteAtual.telefone} 
                <span class="material-symbols-outlined">mail</span> ${pacienteAtual.email}
            `;
        }
        if(document.getElementById('detalhe-sub-endereco')) {
            document.getElementById('detalhe-sub-endereco').innerHTML = `
                <span class="material-symbols-outlined" style="font-size: 14px; vertical-align: middle;">location_on</span> 
                ${pacienteAtual.logradouro}, Nº ${pacienteAtual.numero} - ${pacienteAtual.bairro}, ${pacienteAtual.cidade}/${pacienteAtual.estado} (CEP: ${pacienteAtual.cep})
            `;
        }

        const alertaBox = document.getElementById('bloco-alertas');
        const txtAlertas = document.getElementById('txt-observacoes-clinicas');

        if (alertaBox && txtAlertas) {
            if (pacienteAtual.obsClinicas && pacienteAtual.obsClinicas.trim() !== "") {
                alertaBox.classList.remove('empty-alert');
                txtAlertas.textContent = pacienteAtual.obsClinicas;
            } else {
                alertaBox.classList.add('empty-alert');
                txtAlertas.textContent = "Nenhuma observação cadastrada para este paciente. Clique em Editar para registrar restrições físicas, patologias ou patamares clínicos.";
            }
        }
    }

    function renderizarLinhaTempo() {
        if (!timelineContainer) return;
        const blocosAntigos = timelineContainer.querySelectorAll('.session-history-block');
        blocosAntigos.forEach(b => b.remove());

        const mesFiltro = filterMes ? filterMes.value : ''; 
        const filtradas = historicoSessoes.filter(s => s.data.startsWith(mesFiltro));
        if (countConcluidas) countConcluidas.textContent = historicoSessoes.length;

        if (filtradas.length === 0) {
            if (timelineEmpty) timelineEmpty.style.display = 'block';
            return;
        }

        if (timelineEmpty) timelineEmpty.style.display = 'none';
        filtradas.sort((a, b) => b.data.localeCompare(a.data));

        filtradas.forEach((sessao, index) => {
            const bloco = document.createElement('div');
            bloco.className = 'session-history-block';

            const linkDocumento = sessao.docPaciente 
                ? `<a href="../assets/docs_pacientes/${sessao.docPaciente}" download style="color:#046C4E; font-weight:600; text-decoration:underline;">📄 Baixar ${sessao.docPaciente}</a>`
                : "Nenhum arquivo enviado.";

            // AJUSTADO: Mudança de "Nota Clínica" para "Evolução Clínica Registrada" nos rótulos de dados
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
                        <label>Evolução Clínica Registrada (Luana)</label>
                        <p>${sessao.notaClinica || "Sessão finalizada sem descrição de evolução técnica."}</p>
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
                    
                    if (fileInput && (!fileInput.files || fileInput.files.length === 0)) {
                        alert("Por favor, selecione um arquivo de laudo (PDF ou Imagem) antes de clicar em enviar.");
                        return;
                    }

                    sessao.laudoEnviado = true;
                    const wrapper = document.getElementById(`laudo-wrapper-${index}`);
                    if (wrapper) {
                        wrapper.innerHTML = `
                            <span class="status-enviado-label">
                                <span class="material-symbols-outlined" style="font-size:16px;">check_circle</span> Enviado (Laudo Clínico anexado)
                            </span>
                        `;
                    }
                    alert("Sucesso! O laudo clínico foi processado.");
                });
            }

            timelineContainer.appendChild(bloco);
        });
    }

    function carregarHorariosDisponiveis() {
        if (!containerVagas) return;
        containerVagas.innerHTML = '';
        vagaSelecionadaDados = null;

        const dadosSalvos = localStorage.getItem('agendaPublicadaProfissional');
        let agendaPublicada = dadosSalvos ? JSON.parse(dadosSalvos) : [];

        if (agendaPublicada.length === 0) {
            containerVagas.innerHTML = '<p style="text-align:center; color:#EF4444; font-size:0.85rem; font-weight:500; padding:10px 0;">Nenhum horário disponível na "Agenda Publicada". Cadastre uma grade na página de gerenciamento primeiro.</p>';
            return;
        }

        let encontrouVaga = false;

        agendaPublicada.forEach(bloco => {
            bloco.horarios.forEach(h => {
                if (parseInt(h.vagas) > 0) {
                    encontrouVaga = true;
                    const card = document.createElement('div');
                    card.className = 'vaga-disponivel-card';
                    card.innerHTML = `
                        <div>
                            <strong style="color: #046C4E;">${h.hora}</strong> - 
                            <span style="font-size:0.85rem; font-weight:500; color:#374151;">${h.servico}</span>
                        </div>
                        <span style="font-size:0.75rem; color:#065F46; font-weight:600; background:#D1FAE5; padding:2px 8px; border-radius:10px;">${formatarDataBR(bloco.data)}</span>
                    `;

                    card.addEventListener('click', () => {
                        document.querySelectorAll('.vaga-disponivel-card').forEach(c => c.classList.remove('selected', 'selecionada'));
                        card.classList.add('selecionada');
                        vagaSelecionadaDados = { blocoData: bloco.data, hora: h.hora, servico: h.servico };
                    });

                    containerVagas.appendChild(card);
                }
            });
        });

        if (!encontrouVaga) {
            containerVagas.innerHTML = '<p style="text-align:center; color:#EF4444; font-size:0.85rem; font-weight:500; padding:10px 0;">Todas as vagas publicadas já foram preenchidas.</p>';
        }
    }

    if (btnAbrirAgendar) {
        btnAbrirAgendar.addEventListener('click', () => {
            carregarHorariosDisponiveis();
            if (modalAgendar) modalAgendar.classList.add('active');
        });
    }

    const fecharModalAgendar = () => { if (modalAgendar) modalAgendar.classList.remove('active'); };
    if (btnFecharAgendar) btnFecharAgendar.addEventListener('click', fecharModalAgendar);
    if (btnCancelarAgendar) btnCancelarAgendar.addEventListener('click', fecharModalAgendar);

    if (btnConcluirAgendar) {
        btnConcluirAgendar.addEventListener('click', () => {
            if (!pacienteAtual) {
                alert("Ação recusada! Carregue os dados de um paciente primeiro.");
                return;
            }
            if (!vagaSelecionadaDados) {
                alert("Ação recusada! Por favor, clique sobre uma vaga ativa listada acima antes de confirmar.");
                return;
            }

            const novaConsultaPaciente = {
                data: vagaSelecionadaDados.blocoData,
                horario: vagaSelecionadaDados.hora,
                servico: vagaSelecionadaDados.servico,
                status: "Confirmado"
            };

            let consultasPaciente = localStorage.getItem('consultasDoPacienteSimulado') ? JSON.parse(localStorage.getItem('consultasDoPacienteSimulado')) : [];
            consultasPaciente.push(novaConsultaPaciente);
            localStorage.setItem('consultasDoPacienteSimulado', JSON.stringify(consultasPaciente));

            alert(`Sucesso! Agendamento manual realizado.\nPaciente: ${pacienteAtual.nome}\nProcedimento: ${vagaSelecionadaDados.servico}\nData: ${formatarDataBR(vagaSelecionadaDados.blocoData)} às ${vagaSelecionadaDados.hora}.`);
            fecharModalAgendar();
        });
    }

    function popularCamposFormulario() {
        if (!formEditar) return;
        if (!pacienteAtual) {
            formEditar.reset();
            return;
        }
        if(document.getElementById('edit-nome')) document.getElementById('edit-nome').value = pacienteAtual.nome || "";
        if(document.getElementById('edit-cpf')) document.getElementById('edit-cpf').value = pacienteAtual.cpf || "";
        if(document.getElementById('edit-nascimento')) document.getElementById('edit-nascimento').value = pacienteAtual.nascimento || "";
        if(document.getElementById('edit-email')) document.getElementById('edit-email').value = pacienteAtual.email || "";
        if(document.getElementById('edit-telefone')) document.getElementById('edit-telefone').value = pacienteAtual.telefone || "";
        if(document.getElementById('edit-obs-clinicas')) document.getElementById('edit-obs-clinicas').value = pacienteAtual.obsClinicas || "";
        if(document.getElementById('edit-cep')) document.getElementById('edit-cep').value = pacienteAtual.cep || "";
        if(document.getElementById('edit-logradouro')) document.getElementById('edit-logradouro').value = pacienteAtual.logradouro || "";
        if(document.getElementById('edit-numero')) document.getElementById('edit-numero').value = pacienteAtual.numero || "";
        if(document.getElementById('edit-bairro')) document.getElementById('edit-bairro').value = pacienteAtual.bairro || "";
        if(document.getElementById('edit-complemento')) document.getElementById('edit-complemento').value = pacienteAtual.complemento || "";
        if(document.getElementById('edit-cidade')) document.getElementById('edit-cidade').value = pacienteAtual.cidade || "";
        if(document.getElementById('edit-estado')) document.getElementById('edit-estado').value = pacienteAtual.estado || "";
    }

    if (btnAbrirEditar) {
        btnAbrirEditar.addEventListener('click', () => {
            popularCamposFormulario();
            if (modalEditar) modalEditar.classList.add('active');
        });
    }

    if (btnFecharEditar) btnFecharEditar.addEventListener('click', () => { if (modalEditar) modalEditar.classList.remove('active'); });

    if (formEditar) {
        formEditar.addEventListener('submit', (e) => {
            e.preventDefault();

            const cpfLimpo = inputCpf ? inputCpf.value.replace(/\D/g, "") : '';
            const telLimpo = inputTelefone ? inputTelefone.value.replace(/\D/g, "") : '';
            const emailElem = document.getElementById('edit-email');
            const emailValor = emailElem ? emailElem.value.trim() : '';
            const cepLimpo = inputCep ? inputCep.value.replace(/\D/g, "") : '';

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

            if (modalConfirmarSalvar) modalConfirmarSalvar.classList.add('active');
        });
    }

    if (btnCancelarConfirmacao) btnCancelarConfirmacao.addEventListener('click', () => { if (modalConfirmarSalvar) modalConfirmarSalvar.classList.remove('active'); });

    if (btnConcluirSalvamento) {
        btnConcluirSalvamento.addEventListener('click', () => {
            pacienteAtual = {
                nome: document.getElementById('edit-nome') ? document.getElementById('edit-nome').value : '',
                cpf: inputCpf ? inputCpf.value : '',
                nascimento: document.getElementById('edit-nascimento') ? document.getElementById('edit-nascimento').value : '',
                email: document.getElementById('edit-email') ? document.getElementById('edit-email').value : '',
                telefone: inputTelefone ? inputTelefone.value : '',
                obsClinicas: document.getElementById('edit-obs-clinicas') ? document.getElementById('edit-obs-clinicas').value : '',
                cep: inputCep ? inputCep.value : '',
                logradouro: document.getElementById('edit-logradouro') ? document.getElementById('edit-logradouro').value : '',
                numero: document.getElementById('edit-numero') ? document.getElementById('edit-numero').value : '',
                bairro: document.getElementById('edit-bairro') ? document.getElementById('edit-bairro').value : '',
                complemento: document.getElementById('edit-complemento') ? document.getElementById('edit-complemento').value : '',
                cidade: document.getElementById('edit-cidade') ? document.getElementById('edit-cidade').value : '',
                estado: document.getElementById('edit-estado') ? document.getElementById('edit-estado').value : ''
            };

            renderizarProntuario();
            if (modalConfirmarSalvar) modalConfirmarSalvar.classList.remove('active');
            if (modalEditar) modalEditar.classList.remove('active');
            alert("Sucesso! Prontuário cadastrado e atualizado.");
        });
    }

    if (btnAbrirExcluir) btnAbrirExcluir.addEventListener('click', () => { if (modalExcluir) modalExcluir.classList.add('active'); });
    if (btnCancelarExclusao) btnCancelarExclusao.addEventListener('click', () => { if (modalExcluir) modalExcluir.classList.remove('active'); });
    
    if (btnConcluirExclusao) {
        btnConcluirExclusao.addEventListener('click', () => {
            const motivoCombo = document.getElementById('excluir-motivo');
            const motivo = motivoCombo ? motivoCombo.value : '';
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
    }

    if (filterMes) {
        filterMes.addEventListener('change', renderizarLinhaTempo);
    }

    renderizarProntuario();
    renderizarLinhaTempo();
});