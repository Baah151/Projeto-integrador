document.getElementById('form-recuperar-senha').addEventListener('submit', function(e) {
    e.preventDefault();

    const email = document.getElementById('email').value.trim();
    const API_URL = 'http://localhost:8080/api/profissional/recuperar-senha';

    fetch(API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: email })
    })
    .then(response => {
        if (response.ok) {
            alert('E-mail enviado! Verifique sua caixa de entrada para redefinir a senha.');
            window.location.href = '../login/index.html';
        } else {
            alert('O e-mail informado não está cadastrado em nosso sistema.');
        }
    })
    .catch(() => {
        alert(`Simulação: Instruções enviadas com sucesso para o endereço:\n${email}\n\nVerifique sua caixa de entrada.`);
        window.location.href = '../login/index.html';
    });
});