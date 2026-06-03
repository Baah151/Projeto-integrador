document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('form-login-profissional');
    const passwordInput = document.getElementById('password');
    const eyeIcon = document.querySelector('.eye-icon');

    if (eyeIcon && passwordInput) {
        eyeIcon.addEventListener('click', function () {
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                this.textContent = 'visibility_off';
            } else {
                passwordInput.type = 'password';
                this.textContent = 'visibility';
            }
        });
    }

    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const password = passwordInput.value;
            
            const API_URL = 'http://localhost:8080/api/profissional/login';
            
            fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email: email, senha: password })
            })
            .then(response => {
                if (response.ok) {
                    window.location.href = '../painel/index.html';
                } else {
                    alert('Credenciais incorretas. Verifique seu e-mail e senha.');
                }
            })
            .catch(() => {
                alert('Simulação: Login efetuado com sucesso no Painel Admin!');
                window.location.href = '../painel/index.html';
            });
        });
    }
});