// OBJETO DE ENTRADA CONFIGURED ORIGINALMENTE VAZIO AGUARDANDO RETORNO DA API JAVA
const dadosClinica = {
    email: "",
    telefone: "",
    cep: "",
    logradouro: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade: "",
    uf: ""
};

function renderizarContatos() {
    const emailSpan = document.getElementById('info-email');
    const telefoneSpan = document.getElementById('info-telefone');
    const logradouroSpan = document.getElementById('info-logradouro');
    const localidadeSpan = document.getElementById('info-bairro-cidade');
    const cepSpan = document.getElementById('info-cep');

    if (emailSpan) emailSpan.textContent = dadosClinica.email || "E-mail não cadastrado";
    if (telefoneSpan) telefoneSpan.textContent = dadosClinica.telefone || "Telefone não cadastrado";
    
    if (logradouroSpan) {
        if (dadosClinica.logradouro) {
            const complText = dadosClinica.complemento ? `, ${dadosClinica.complemento}` : '';
            logradouroSpan.textContent = `${dadosClinica.logradouro}, Nº ${dadosClinica.numero || ''}${complText}`;
        } else {
            logradouroSpan.textContent = "Endereço não cadastrado";
        }
    }
    
    if (localidadeSpan) {
        if (dadosClinica.bairro) {
            localidadeSpan.textContent = `${dadosClinica.bairro} - ${dadosClinica.cidade || ''} / ${dadosClinica.uf || ''}`;
        } else {
            localidadeSpan.textContent = "";
        }
    }
    
    if (cepSpan) {
        cepSpan.textContent = dadosClinica.cep ? `CEP: ${dadosClinica.cep}` : "CEP: --.------";
    }
}

document.addEventListener('DOMContentLoaded', renderizarContatos);