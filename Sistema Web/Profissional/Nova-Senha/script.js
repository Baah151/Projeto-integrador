function togglePass(id) {
    const input = document.getElementById(id);
    const icon = input.nextElementSibling;
    if (input.type === 'password') {
        input.type = 'text';
        icon.textContent = 'visibility';
    } else {
        input.type = 'password';
        icon.textContent = 'visibility_off';
    }
}

function showToast(message) {
    const toast = document.getElementById('error-toast');
    const toastMessage = document.getElementById('error-message');
    
    toastMessage.textContent = message;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 4000);
}

document.getElementById('form-nova-senha').addEventListener('submit', function(e) {
    e.preventDefault();

    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;

    if (password !== confirmPassword) {
        showToast('As senhas inseridas não coincidem. Por favor, verifique.');
        return;
    }

    const API_URL = 'http://localhost:8080/api/profissional/atualizar-senha';

    fetch(API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ novaSenha: password })
    })
    .then(response => {
        if (response.ok) {
            alert('Senha redefinida com sucesso! Você já pode acessar o sistema.');
            window.location.href = '../login/index.html';
        } else {
            showToast('Erro ao redefinir senha. O link pode ter expirado.');
        }
    })
    .catch(() => {
        alert('Simulação: Senha atualizada com sucesso!\nRedirecionando para a tela de login...');
        window.location.href = '../login/index.html';
    });
});