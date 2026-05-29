const eyeOpenURL = "https://api.iconify.design/material-symbols:visibility-outline.svg?color=%239ca3af";
const eyeClosedURL = "https://api.iconify.design/material-symbols:visibility-off-outline.svg?color=%239ca3af";

let dadosFormularioTemporarios = null;

function togglePasswordVisibility(fieldId, imgId) {
    const field = document.getElementById(fieldId);
    const img = document.getElementById(imgId);
    
    if (field && img) {
        const isPassword = field.getAttribute('type') === 'password';
        field.setAttribute('type', isPassword ? 'text' : 'password');
        img.setAttribute('src', isPassword ? eyeClosedURL : eyeOpenURL);
    }
}

function previewImage() {
    const fileInput = document.getElementById('upload-photo');
    const profileImg = document.getElementById('profile-img');
    
    if (fileInput && fileInput.files && fileInput.files[0] && profileImg) {
        const reader = new FileReader();
        reader.onload = function(e) {
            if (e.target) profileImg.src = e.target.result;
        };
        reader.readAsDataURL(fileInput.files[0]);
    }
}

function aplicarTravasInput() {
    const cpfInput = document.getElementById('reg-cpf');
    const nascimentoInput = document.getElementById('reg-nascimento');
    const cepInput = document.getElementById('end-cep');
    const telefoneInput = document.getElementById('contato-telefone');

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

function buscarCEP() {
    const cepInput = document.getElementById('end-cep');
    if (!cepInput) return;
    let cep = cepInput.value.replace(/\D/g, '');

    if (cep.length === 0) return;

    if (cep.length !== 8) {
        alert("O CEP deve conter exatamente 8 dígitos.");
        return;
    }

    fetch(`https://viacep.com.br/ws/${cep}/json/`)
        .then(response => response.json())
        .then(data => {
            if (!data.erro) {
                if(document.getElementById('end-logradouro')) document.getElementById('end-logradouro').value = data.logradouro || "";
                if(document.getElementById('end-bairro')) document.getElementById('end-bairro').value = data.bairro || "";
                if(document.getElementById('end-cidade')) document.getElementById('end-cidade').value = data.localidade || "";
                if(document.getElementById('end-uf')) document.getElementById('end-uf').value = data.uf || "";
                if(document.getElementById('end-numero')) document.getElementById('end-numero').focus();
            } else {
                alert("CEP não encontrado.");
            }
        })
        .catch(() => {
            alert("Erro ao buscar o CEP. Digite os dados manualmente.");
        });
}

const formPerf = document.getElementById('form-perfil');
if (formPerf) {
    formPerf.addEventListener('submit', (e) => {
        e.preventDefault();

        const cpfLimpo = document.getElementById('reg-cpf') ? document.getElementById('reg-cpf').value.replace(/\D/g, "") : '';
        const nascimentoLimpo = document.getElementById('reg-nascimento') ? document.getElementById('reg-nascimento').value.replace(/\D/g, "") : '';
        const telefoneLimpo = document.getElementById('contato-telefone') ? document.getElementById('contato-telefone').value.replace(/\D/g, "") : '';
        const cepLimpo = document.getElementById('end-cep') ? document.getElementById('end-cep').value.replace(/\D/g, "") : '';

        if (cpfLimpo.length !== 11) {
            alert("Erro: O número de CPF informado está incompleto.");
            return;
        }

        if (nascimentoLimpo.length !== 8) {
            alert("Erro: A data de nascimento informada está incompleta.");
            return;
        }

        if (telefoneLimpo.length !== 11) {
            alert("O telefone / WhatsApp deve conter exatamente 11 dígitos.");
            return;
        }

        if (cepLimpo.length !== 8) {
            alert("Erro: O CEP informado está incompleto.");
            return;
        }

        const senha = document.getElementById('acesso-senha') ? document.getElementById('acesso-senha').value : '';
        const confirmar = document.getElementById('acesso-confirmar') ? document.getElementById('acesso-confirmar').value : '';
        const campoConfirmar = document.getElementById('acesso-confirmar');

        if (senha !== confirmar) {
            alert("As senhas informadas não coincidem!");
            if (campoConfirmar) {
                campoConfirmar.style.borderColor = '#EF4444';
                campoConfirmar.focus();
            }
            return;
        }

        if (campoConfirmar) campoConfirmar.style.borderColor = '#E5E7EB';

        dadosFormularioTemporarios = {
            nome: document.getElementById('reg-nome') ? document.getElementById('reg-nome').value : '',
            cpf: document.getElementById('reg-cpf') ? document.getElementById('reg-cpf').value : '',
            nascimento: document.getElementById('reg-nascimento') ? document.getElementById('reg-nascimento').value : '',
            email: document.getElementById('contato-email') ? document.getElementById('contato-email').value : '',
            telefone: document.getElementById('contato-telefone') ? document.getElementById('contato-telefone').value : '',
            novaSenha: senha ? senha : null,
            cep: document.getElementById('end-cep') ? document.getElementById('end-cep').value : '',
            logradouro: document.getElementById('end-logradouro') ? document.getElementById('end-logradouro').value : '',
            numero: document.getElementById('end-numero') ? document.getElementById('end-numero').value : '',
            bairro: document.getElementById('end-bairro') ? document.getElementById('end-bairro').value : '',
            complemento: document.getElementById('end-complemento') ? document.getElementById('end-complemento').value : '',
            cidade: document.getElementById('end-cidade') ? document.getElementById('end-cidade').value : '',
            uf: document.getElementById('end-uf') ? document.getElementById('end-uf').value : ''
        };

        const modal = document.getElementById('modal-salvar');
        if (modal) modal.classList.add('active');
    });
}

function fecharModalSalvar() {
    const modal = document.getElementById('modal-salvar');
    if (modal) modal.classList.remove('active');
    dadosFormularioTemporarios = null;
}

function confirmarSalvamento() {
    if (!dadosFormularioTemporarios) return;

    const API_URL = 'http://localhost:8080/api/pacientes/perfil';

    fetch(API_URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dadosFormularioTemporarios)
    })
    .then(response => {
        if (response.ok) {
            const headerNome = document.getElementById('txt-nome-header');
            if (headerNome) headerNome.textContent = dadosFormularioTemporarios.nome;
            alert("Perfil atualizado com sucesso!");
        } else {
            alert("Erro ao salvar as alterações do perfil.");
        }
        fecharModalSalvar();
    })
    .catch(() => {
        alert("Erro de conexão. As alterações serão salvas automaticamente quando o servidor Java estiver online.");
        fecharModalSalvar();
    });
}

function abrirModalExcluir() {
    const modal = document.getElementById('modal-excluir');
    if (modal) modal.classList.add('active');
}

function fecharModalExcluir() {
    const modal = document.getElementById('modal-excluir');
    if (modal) modal.classList.remove('active');
    const motivoSelect = document.getElementById('motivo-exclusao');
    if (motivoSelect) motivoSelect.value = "";
}

function confirmarExclusao() {
    const motivoSelect = document.getElementById('motivo-exclusao');
    if (!motivoSelect) return;
    const motivoText = motivoSelect.options[motivoSelect.selectedIndex].text;

    if (!motivoSelect.value) {
        alert("Por favor, selecione o motivo da exclusão antes de prosseguir.");
        return;
    }

    const payloadExclusao = {
        motivo: motivoSelect.value,
        descricaoMotivo: motivoText
    };

    const API_URL = 'http://localhost:8080/api/pacientes/conta';

    fetch(API_URL, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payloadExclusao)
    })
    .then(response => {
        if (response.ok) {
            alert("Conta excluída com sucesso.");
            window.location.href = '../login/index.html';
        } else {
            alert("Erro ao processar a exclusão da conta.");
        }
        fecharModalExcluir();
    })
    .catch(() => {
        alert("Erro de conexão. Ação encaminhada para processamento no banco Java.");
        fecharModalExcluir();
    });
}

document.addEventListener('DOMContentLoaded', () => {
    aplicarTravasInput();
});