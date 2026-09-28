function renderizarContatos(dadosClinica) {
    const emailSpan = document.getElementById('info-email');
    const telefoneSpan = document.getElementById('info-telefone');
    const logradouroSpan = document.getElementById('info-logradouro');
    const localidadeSpan = document.getElementById('info-bairro-cidade');
    const cepSpan = document.getElementById('info-cep');

    // Mapeia os dados reais vindos das colunas do seu banco PostgreSQL
    const email = dadosClinica.email;
    const telefone = dadosClinica.telefone;
    const logradouro = dadosClinica.logradouro;
    const numero = dadosClinica.numero;
    const complemento = dadosClinica.complemento;
    const bairro = dadosClinica.bairro;
    const cidade = dadosClinica.cidade;
    const uf = dadosClinica.estado;
    const cep = dadosClinica.cep;

    if (emailSpan) emailSpan.textContent = email || "E-mail não cadastrado";
    if (telefoneSpan) {
        // Usa a função de formatação do seu api.js se ela existir
        if (typeof formatarTelefone === "function") {
            telefoneSpan.textContent = formatarTelefone(telefone);
        } else {
            telefoneSpan.textContent = telefone || "Telefone não cadastrado";
        }
    }
    
    if (logradouroSpan) {
        if (logradouro) {
            const complText = complemento ? `, ${complemento}` : '';
            logradouroSpan.textContent = `${logradouro}, Nº ${numero || ''}${complText}`;
        } else {
            logradouroSpan.textContent = "Endereço não cadastrado";
        }
    }
    
    if (localidadeSpan) {
        if (bairro) {
            localidadeSpan.textContent = `${bairro} - ${cidade || ''} / ${uf || ''}`;
        } else {
            localidadeSpan.textContent = "";
        }
    }
    
    if (cepSpan) {
        if (typeof formatarCpf === "function" && cep) { // Apenas uma segurança caso use helpers
            cepSpan.textContent = `CEP: ${cep}`;
        } else {
            cepSpan.textContent = cep ? `CEP: ${cep}` : "CEP: --.------";
        }
    }
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

document.addEventListener('DOMContentLoaded', async () => {
    gerenciarMenuMobile();

    // 1. Valida se o paciente está devidamente autenticado
    if (typeof verificarAutenticacaoPaciente === "function") {
        if (!verificarAutenticacaoPaciente()) return;
    }

    try {
        console.log("Buscando dados cadastrados da clínica via api.js...");
        
        // 2. Aciona o fluxo seguro do api.js que injeta o Bearer token automaticamente
        if (typeof obterDadosClinica === "function") {
            const dados = await obterDadosClinica();
            
            if (dados) {
                renderizarContatos(dados);
                console.log("Contatos da clínica carregados com sucesso!");
            } else {
                throw new Error("Nenhum dado retornado da clínica.");
            }
        } else {
            throw new Error("Função obterDadosClinica não encontrada.");
        }

    } catch (err) {
        console.error("Erro ao carregar a página de contatos:", err);
        renderizarContatos({
            email: "Erro ao sincronizar canais de atendimento",
            telefone: "Erro ao sincronizar canais de atendimento"
        });
    }
});