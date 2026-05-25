const dadosClinica = {
    email: "contato@luanadamazio.com",
    telefone: "(51) 99999-9999",
    cep: "95520-000",
    logradouro: "Rua Marechal Floriano Peixoto",
    numero: "123",
    complemento: "Sala 402",
    bairro: "Centro",
    cidade: "Osório",
    uf: "RS"
};

function renderizarContatos() {
    const emailSpan = document.getElementById('info-email');
    const telefoneSpan = document.getElementById('info-telefone');
    const logradouroSpan = document.getElementById('info-logradouro');
    const localidadeSpan = document.getElementById('info-bairro-cidade');
    const cepSpan = document.getElementById('info-cep');

    if (emailSpan) emailSpan.textContent = dadosClinica.email;
    if (telefoneSpan) telefoneSpan.textContent = dadosClinica.telefone;
    
    if (logradouroSpan) {
        const complText = dadosClinica.complemento ? `, ${dadosClinica.complemento}` : '';
        logradouroSpan.textContent = `${dadosClinica.logradouro}, Nº ${dadosClinica.numero}${complText}`;
    }
    
    if (localidadeSpan) {
        localidadeSpan.textContent = `${dadosClinica.bairro} - ${dadosClinica.cidade} / ${dadosClinica.uf}`;
    }
    
    if (cepSpan) {
        cepSpan.textContent = `CEP: ${dadosClinica.cep}`;
    }
}

document.addEventListener('DOMContentLoaded', renderizarContatos);