const steps = Array.from(document.querySelectorAll('.form-step'));
const tabs = Array.from(document.querySelectorAll('.step-item'));
const btnNext = document.querySelectorAll('.btn-next');
const btnPrev = document.querySelectorAll('.btn-prev');

const campos = [
    'nome', 'cpf', 'nascimento', 'email', 'telefone', 
    'senha', 'confirmar-senha', 'cep', 'logradouro', 
    'numero', 'bairro', 'complemento', 'cidade', 'estado'
];

const eyeOpenSVG = `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle>`;
const eyeClosedSVG = `<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line>`;

function setIcon(elementId, svgContent) {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = svgContent;
    }
}

function aplicarMascarasTeclado() {
    const cpfInput = document.getElementById('cpf');
    const nascimentoInput = document.getElementById('nascimento');
    const cepInput = document.getElementById('cep');
    const telefoneInput = document.getElementById('telefone');

    if (cpfInput) {
        cpfInput.addEventListener('input', (e) => {
            let v = e.target.value.replace(/\D/g, "");
            if (v.length > 11) v = v.substring(0, 11);
            v = v.replace(/(\d{3})(\d)/, "$1.$2");
            v = v.replace(/(\d{3})(\d)/, "$1.$2");
            v = v.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
            e.target.value = v;
        });
    }

    if (nascimentoInput) {
        nascimentoInput.addEventListener('input', (e) => {
            let v = e.target.value.replace(/\D/g, "");
            if (v.length > 8) v = v.substring(0, 8);
            v = v.replace(/(\d{2})(\d)/, "$1/$2");
            v = v.replace(/(\d{2})(\d)/, "$1/$2");
            e.target.value = v;
        });
    }

    if (cepInput) {
        cepInput.addEventListener('input', (e) => {
            let v = e.target.value.replace(/\D/g, "");
            if (v.length > 8) v = v.substring(0, 8);
            v = v.replace(/^(\d{5})(\d)/, "$1-$2");
            e.target.value = v;
        });
    }

    if (telefoneInput) {
        telefoneInput.addEventListener('input', (e) => {
            let v = e.target.value.replace(/\D/g, "");
            if (v.length > 11) v = v.substring(0, 11);
            v = v.replace(/^(\d{2})(\d)/g, "($1) $2");
            v = v.replace(/(\d{5})(\d)/, "$1-$2");
            e.target.value = v;
        });
    }
}

window.addEventListener('DOMContentLoaded', () => {
    aplicarMascarasTeclado();

    campos.forEach(id => {
        const valorSalvo = localStorage.getItem(`rascunho_${id}`);
        const elemento = document.getElementById(id);
        if (valorSalvo && elemento) {
            elemento.value = valorSalvo;
        }
    });

    const ultimaEtapa = localStorage.getItem('cadastro_etapa_atual');
    if (ultimaEtapa !== null) {
        changeStep(parseInt(ultimaEtapa));
    }
    
    setIcon('eye-senha', eyeOpenSVG);
    setIcon('eye-confirmar', eyeOpenSVG);
});

function setupToggle(buttonId, fieldId, iconId) {
    const btn = document.getElementById(buttonId);
    if (btn) {
        btn.addEventListener('click', () => {
            const field = document.getElementById(fieldId);
            const isPassword = field.getAttribute('type') === 'password';
            field.setAttribute('type', isPassword ? 'text' : 'password');
            setIcon(iconId, isPassword ? eyeClosedSVG : eyeOpenSVG);
        });
    }
}

setupToggle('toggleSenha', 'senha', 'eye-senha');
setupToggle('toggleConfirmar', 'confirmar-senha', 'eye-confirmar');

campos.forEach(id => {
    const elemento = document.getElementById(id);
    if (elemento) {
        elemento.addEventListener('input', () => {
            localStorage.setItem(`rascunho_${id}`, elemento.value);
            elemento.style.borderColor = '#E5E7EB';
        });
    }
});

document.querySelectorAll('.link-termos').forEach(link => {
    link.addEventListener('click', () => {
        const currentStep = document.querySelector('.form-step.active');
        const index = steps.indexOf(currentStep);
        localStorage.setItem('cadastro_etapa_atual', index);
    });
});

btnNext.forEach(button => {
    button.addEventListener('click', () => {
        const currentStep = document.querySelector('.form-step.active');
        const inputs = currentStep.querySelectorAll('input[required]');
        let valid = true;

        inputs.forEach(input => {
            if (!input.value.trim()) {
                valid = false;
                input.style.borderColor = '#EF4444';
            }

            if (input.id === 'cpf' && input.value.replace(/\D/g, '').length !== 11) {
                valid = false;
                alert('O CPF precisa conter exatamente 11 números.');
                input.style.borderColor = '#EF4444';
            }

            if (input.id === 'nascimento' && input.value.replace(/\D/g, '').length !== 8) {
                valid = false;
                alert('A data de nascimento precisa estar no formato DD/MM/AAAA.');
                input.style.borderColor = '#EF4444';
            }

            if (input.id === 'telefone' && input.value.replace(/\D/g, '').length !== 11) {
                valid = false;
                alert('O Telefone com DDD precisa conter exatamente 11 números.');
                input.style.borderColor = '#EF4444';
            }
        });

        if (currentStep.id === 'step-2') {
            const senha = document.getElementById('senha').value;
            const confirmarSenha = document.getElementById('confirmar-senha').value;
            
            if (senha !== confirmarSenha) {
                valid = false;
                alert('As senhas não coincidem!');
                document.getElementById('confirmar-senha').style.borderColor = '#EF4444';
            }
        }

        if (valid) {
            const index = steps.indexOf(currentStep);
            if (index < steps.length - 1) {
                changeStep(index + 1);
            }
        }
    });
});

btnPrev.forEach(button => {
    button.addEventListener('click', () => {
        const currentStep = document.querySelector('.form-step.active');
        const index = steps.indexOf(currentStep);
        if (index > 0) {
            changeStep(index - 1);
        }
    });
});

function changeStep(toStep) {
    if (toStep >= 0 && toStep < steps.length) {
        steps.forEach(step => step.classList.remove('active'));
        tabs.forEach(tab => tab.classList.remove('active'));
        
        steps[toStep].classList.add('active');
        tabs[toStep].classList.add('active');
        localStorage.setItem('cadastro_etapa_atual', toStep);
    }
}

const cepInput = document.getElementById('cep');

function tratarBuscaCep() {
    const cep = cepInput.value.replace(/\D/g, '');
    
    if (cep.length !== 8) return;

    fetch(`https://viacep.com.br/ws/${cep}/json/`)
        .then(response => response.json())
        .then(data => {
            if (!data.erro) {
                document.getElementById('logradouro').value = data.logradouro || "";
                document.getElementById('bairro').value = data.bairro || "";
                document.getElementById('cidade').value = data.localidade || "";
                document.getElementById('estado').value = data.uf || "";

                localStorage.setItem('rascunho_logradouro', data.logradouro || "");
                localStorage.setItem('rascunho_bairro', data.bairro || "");
                localStorage.setItem('rascunho_cidade', data.localidade || "");
                localStorage.setItem('rascunho_estado', data.uf || "");
                
                document.getElementById('numero').focus();
            } else {
                cepInput.style.borderColor = '#EF4444';
                
                cepInput.removeEventListener('blur', tratarBuscaCep);
                
                alert('CEP não encontrado.');
                
                setTimeout(() => {
                    cepInput.addEventListener('blur', tratarBuscaCep);
                }, 100);
            }
        })
        .catch(() => {
            console.log('Modo offline ou API do ViaCEP fora do ar.');
        });
}

if (cepInput) {
    cepInput.addEventListener('blur', tratarBuscaCep);
    
    cepInput.addEventListener('input', () => {
        cepInput.style.borderColor = '#E5E7EB';
    });
}

const btnFinalizar = document.getElementById('btn-finalizar-cadastro');
if (btnFinalizar) {
    btnFinalizar.addEventListener('click', () => {
        const senha = document.getElementById('senha').value;
        const confirmarSenha = document.getElementById('confirmar-senha').value;
        const cep = document.getElementById('cep').value.replace(/\D/g, '');

        if (senha !== confirmarSenha) {
            alert('As senhas não coincidem!');
            document.getElementById('confirmar-senha').style.borderColor = '#EF4444';
            return;
        }

        if (cep.length !== 8) {
            alert('O CEP precisa conter exatamente 8 números.');
            document.getElementById('cep').style.borderColor = '#EF4444';
            return;
        }

        const currentStep = document.querySelector('.form-step.active');
        const inputs = currentStep.querySelectorAll('input[required]');
        let stepValid = true;
        inputs.forEach(input => {
            if (!input.value.trim()) {
                stepValid = false;
                input.style.borderColor = '#EF4444';
            }
        });

        if (!stepValid) {
            alert('Por favor, preencha todos os campos obrigatórios do endereço.');
            return;
        }

        if (!document.getElementById('termos').checked) {
            alert('Você precisa aceitar os Termos de Uso e Privacidade para continuar.');
            return;
        }

        const dadosPaciente = {
            nome: document.getElementById('nome').value,
            cpf: document.getElementById('cpf').value.replace(/\D/g, ''),
            dataNascimento: document.getElementById('nascimento').value,
            email: document.getElementById('email').value,
            telefone: document.getElementById('telefone').value.replace(/\D/g, ''),
            senha: senha,
            logradouro: document.getElementById('logradouro').value,
            numero: document.getElementById('numero').value,
            bairro: document.getElementById('bairro').value,
            cep: cep,
            complemento: document.getElementById('complemento').value,
            cidade: document.getElementById('cidade').value,
            estado: document.getElementById('estado').value
        };

        const API_URL = 'http://localhost:8080/api/pacientes';

        fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dadosPaciente)
        })
        .then(response => {
            if (response.ok) {
                campos.forEach(id => localStorage.removeItem(`rascunho_${id}`));
                localStorage.removeItem('cadastro_etapa_atual');
                alert('Cadastro realizado com sucesso!');
                window.location.href = '../login/index.html';
            } else {
                alert('Erro ao realizar o cadastro no servidor.');
            }
        })
        .catch(() => {
            localStorage.setItem('dadosCadastroPaciente', JSON.stringify(dadosPaciente));
            campos.forEach(id => localStorage.removeItem(`rascunho_${id}`));
            localStorage.removeItem('cadastro_etapa_atual');
            alert('Servidor fora do ar! Dados salvos localmente para simulação.');
            window.location.href = '../login/index.html';
        });
    });
}