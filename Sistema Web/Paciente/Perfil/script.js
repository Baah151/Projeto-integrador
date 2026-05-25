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
    
    if (fileInput.files && fileInput.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            profileImg.src = e.target.result;
        };
        reader.readAsDataURL(fileInput.files[0]);
    }
}

function aplicarTravasInput() {
    const cepInput = document.getElementById('end-cep');
    const telefoneInput = document.getElementById('contato-telefone');

    if(cepInput) {
        cepInput.addEventListener('input', () => {
            cepInput.value = cepInput.value.replace(/\D/g, '').substring(0, 8);
        });
    }

    if(telefoneInput) {
        telefoneInput.addEventListener('input', () => {
            telefoneInput.value = telefoneInput.value.replace(/\D/g, '').substring(0, 11);
        });
    }
}

function buscarCEP() {
    const cepInput = document.getElementById('end-cep');
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
                document.getElementById('end-logradouro').value = data.logradouro;
                document.getElementById('end-bairro').value = data.bairro;
                document.getElementById('end-cidade').value = data.localidade;
                document.getElementById('end-uf').value = data.uf;
                document.getElementById('end-numero').focus();
            } else {
                alert("CEP não encontrado.");
            }
        })
        .catch(() => {
            alert("Erro ao buscar o CEP. Digite os dados manualmente.");
        });
}

// LÓGICA DO MODAL DE SALVAMENTO
document.getElementById('form-perfil').addEventListener('submit', (e) => {
    e.preventDefault();

    const telefoneInput = document.getElementById('contato-telefone');
    let telefone = telefoneInput.value.replace(/\D/g, '');

    if (telefone.length !== 11) {
        alert("O telefone / WhatsApp deve conter exatamente 11 dígitos.");
        telefoneInput.focus();
        return;
    }

    const senha = document.getElementById('acesso-senha').value;
    const confirmar = document.getElementById('acesso-confirmar').value;
    const campoConfirmar = document.getElementById('acesso-confirmar');

    if (senha !== confirmar) {
        alert("As senhas informadas não coincidem!");
        campoConfirmar.style.borderColor = '#EF4444';
        campoConfirmar.focus();
        return;
    }

    campoConfirmar.style.borderColor = '#E5E7EB';

    // Armazena temporariamente os dados validados para envio posterior
    dadosFormularioTemporarios = {
        email: document.getElementById('contato-email').value,
        telefone: telefone,
        novaSenha: senha ? senha : null,
        cep: document.getElementById('end-cep').value,
        logradouro: document.getElementById('end-logradouro').value,
        numero: document.getElementById('end-numero').value,
        bairro: document.getElementById('end-bairro').value,
        complemento: document.getElementById('end-complemento').value,
        cidade: document.getElementById('end-cidade').value,
        uf: document.getElementById('end-uf').value
    };

    document.getElementById('modal-salvar').classList.add('active');
});

function fecharModalSalvar() {
    document.getElementById('modal-salvar').classList.remove('active');
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
            alert("Perfil updated com sucesso!");
        } else {
            alert("Erro ao salvar as alterações do perfil.");
        }
        fecharModalSalvar();
    })
    .catch(() => {
        alert("Simulação: Perfil atualizado com sucesso no sistema!");
        fecharModalSalvar();
    });
}

// LÓGICA DO MODAL DE EXCLUSÃO DE CONTA
function abrirModalExcluir() {
    document.getElementById('modal-excluir').classList.add('active');
}

function fecharModalExcluir() {
    document.getElementById('modal-excluir').classList.remove('active');
    document.getElementById('motivo-exclusao').value = "";
}

function confirmarExclusao() {
    const motivoSelect = document.getElementById('motivo-exclusao');
    const motivoText = motivoSelect.options[motivoSelect.selectedIndex].text;

    if (!motivoSelect.value) {
        alert("Por favor, selecione o motivo da exclusão antes de prosseguir.");
        motivoSelect.focus();
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
        alert(`Simulação: Notificação enviada para a profissional!\nMotivo registrado: "${motivoText}".\n\nConta encerrada com sucesso.`);
        window.location.href = '../login/index.html';
    });
}

document.addEventListener('DOMContentLoaded', () => {
    aplicarTravasInput();
});