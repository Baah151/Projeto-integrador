document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('form-cadastro-manual');
    
    const inputCpf = document.getElementById('reg-cpf');
    const inputTelefone = document.getElementById('reg-telefone');
    const inputCep = document.getElementById('end-cep');
    
    const inputLogradouro = document.getElementById('end-logradouro');
    const inputBairro = document.getElementById('end-bairro');
    const inputCidade = document.getElementById('end-cidade');
    const inputEstado = document.getElementById('end-estado');

    function ligarVisualizacaoSenha(idIcone, idInput) {
        const icone = document.getElementById(idIcone);
        const input = document.getElementById(idInput);
        
        if (icone && input) {
            icone.addEventListener('click', () => {
                if (input.type === 'password') {
                    input.type = 'text';
                    icone.textContent = 'visibility_off';
                } else {
                    input.type = 'password';
                    icone.textContent = 'visibility';
                }
            });
        }
    }
    
    ligarVisualizacaoSenha('eye-senha', 'reg-senha');
    ligarVisualizacaoSenha('eye-confirma', 'reg-confirma-senha');

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
                inputLogradouro.placeholder = "Carregando...";
                const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
                const dados = await res.json();
                
                if (!dados.erro) {
                    inputLogradouro.value = dados.logradouro || "";
                    inputBairro.value = dados.bairro || "";
                    inputCidade.value = dados.localidade || "";
                    inputEstado.value = dados.uf || "";
                    inputLogradouro.placeholder = "Rua, Avenida, etc.";
                } else {
                    alert("CEP não encontrado. Digite o endereço manualmente.");
                    inputLogradouro.placeholder = "Rua, Avenida, etc.";
                }
            } catch (error) {
                inputLogradouro.placeholder = "Rua, Avenida, etc.";
            }
        }
    });

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const cpfLimpo = inputCpf.value.replace(/\D/g, "");
        const telLimpo = inputTelefone.value.replace(/\D/g, "");
        const cepLimpo = inputCep.value.replace(/\D/g, "");
        
        const senha = document.getElementById('reg-senha').value;
        const confirmaSenha = document.getElementById('reg-confirma-senha').value;

        if (cpfLimpo.length !== 11) {
            alert("Erro: O número de CPF informado está incompleto.");
            return;
        }

        if (telLimpo.length !== 11) {
            alert("Erro: Informe um número de Telefone/WhatsApp válido.");
            return;
        }

        if (senha !== confirmaSenha) {
            alert("Erro: As senhas informadas nos campos de criação e repetição não conferem.");
            return;
        }

        if (cepLimpo.length !== 8) {
            alert("Erro: CEP incompleto.");
            return;
        }

        alert("Sucesso! O paciente foi cadastrado manualmente e inserido na lista clínica em ordem alfabética.");
        window.location.href = "../pacientes/index.html";
    });
});

document.addEventListener('DOMContentLoaded', () => {
    const formProfissional = document.getElementById('form-cadastro-profissional'); // ID do form do HTML

    if (!formProfissional) return;

    formProfissional.addEventListener('submit', async (e) => {
        e.preventDefault();

        const senha = document.getElementById('reg-senha').value;
        const confirmaSenha = document.getElementById('reg-confirma-senha').value;

        if (senha !== confirmaSenha) {
            alert("Erro: As senhas não coincidem.");
            return;
        }

        // Monta o objeto com os dados digitados na tela do profissional
        const dadosProfissional = {
            nome: document.getElementById('reg-nome').value,
            cpf: document.getElementById('reg-cpf').value.replace(/\D/g, ""),
            nascimento: document.getElementById('reg-nascimento').value,
            email: document.getElementById('reg-email').value,
            telefone: document.getElementById('reg-telefone').value.replace(/\D/g, ""),
            senha: senha,
            cidade: document.getElementById('end-cidade').value,
            estado: document.getElementById('end-estado').value.toUpperCase()
        };

        try {
            // Envia para a rota de profissionais do backend
            const resposta = await fetch('http://localhost:3000/profissionais', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(dadosProfissional)
            });

            const resultado = await resposta.json();

            if (resposta.ok) {
                alert("Profissional cadastrado com sucesso!");
                formProfissional.reset();
                // Redireciona para a tela de Login que está na pasta ao lado
                window.location.href = "../Login/index.html"; 
            } else {
                alert(`Erro: ${resultado.error}`);
            }
        } catch (error) {
            console.error(error);
            alert("Não foi possível conectar ao servidor.");
        }
    });
});