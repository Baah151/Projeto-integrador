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

window.addEventListener('DOMContentLoaded', () => {
    gerenciarMenuMobile();

    const formDadosSeguranca = document.getElementById('form-dados-seguranca');
    const formEndereco = document.getElementById('form-endereco');

    const emailInput = document.getElementById('email');
    const telefoneInput = document.getElementById('telefone');

    const cepInput = document.getElementById('cep');
    const ruaInput = document.getElementById('rua');
    const bairroInput = document.getElementById('bairro');
    const cidadeInput = document.getElementById('cidade');
    const ufInput = document.getElementById('uf');

    const senhaAtual = document.getElementById('senha-atual');
    const novaSenha = document.getElementById('nova-senha');
    const confirmaSenha = document.getElementById('confirma-senha');
    const eyeIcons = document.querySelectorAll('.eye-icon');

    eyeIcons.forEach(icon => {
        icon.addEventListener('click', function () {
            const inputField = this.previousElementSibling;
            if (inputField && inputField.type === 'password') {
                inputField.type = 'text';
                this.textContent = 'visibility_off';
            } else if (inputField) {
                inputField.type = 'password';
                this.textContent = 'visibility';
            }
        });
    });

    if (formDadosSeguranca) {
        formDadosSeguranca.addEventListener('submit', function (e) {
            e.preventDefault();

            const temEmail = emailInput && emailInput.value.trim() !== "";
            const temTelefone = telefoneInput && telefoneInput.value.trim() !== "";
            const temSenhaAtual = senhaAtual && senhaAtual.value.trim() !== "";
            const temNovaSenha = novaSenha && novaSenha.value.trim() !== "";
            const temConfirma = confirmaSenha && confirmaSenha.value.trim() !== "";

            if (!temEmail && !temTelefone && !temSenhaAtual && !temNovaSenha && !temConfirma) {
                alert('Preencha ao menos um campo (E-mail, Telefone ou as Senhas) para poder salvar!');
                return;
            }

            if (temEmail && emailInput) {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(emailInput.value)) {
                    alert('Por favor, insira um e-mail válido!');
                    return;
                }
            }

            if (temTelefone && telefoneInput) {
                if (telefoneInput.value.replace(/\D/g, '').length !== 11) {
                    alert('O telefone deve conter exatamente 11 dígitos numéricos com o DDD!');
                    return;
                }
            }

            if (temSenhaAtual || temNovaSenha || temConfirma) {
                if (!temSenhaAtual || !temNovaSenha || !temConfirma) {
                    alert('Para alterar a senha, você deve preencher os três campos de segurança!');
                    return;
                }
                if (novaSenha && confirmaSenha && novaSenha.value !== confirmaSenha.value) {
                    alert('A nova senha e a confirmação não coincidem!');
                    return;
                }
            }

            const confirmar = confirm('Deseja realmente confirmar a alteration dos seus dados de acesso?');
            if (confirmar) {
                alert('Atualização realizada com sucesso!');
            }
        });
    }

    function tratarBuscaCep() {
        const cep = cepInput.value.replace(/\D/g, '');
        if (cep.length !== 8) return;

        fetch(`https://viacep.com.br/ws/${cep}/json/`)
            .then(response => response.json())
            .then(data => {
                if (!data.erro) {
                    if (ruaInput) ruaInput.value = data.logradouro || '';
                    if (bairroInput) bairroInput.value = data.bairro || '';
                    if (cidadeInput) cidadeInput.value = data.localidade || '';
                    if (ufInput) ufInput.value = data.uf || '';
                    if (document.getElementById('numero')) document.getElementById('numero').focus();
                } else {
                    cepInput.style.borderColor = '#EF4444';
                    cepInput.removeEventListener('input', tratarBuscaCep);
                    alert('CEP não encontrado!');
                    setTimeout(() => {
                        cepInput.addEventListener('input', tratarBuscaCep);
                    }, 100);
                }
            })
            .catch(() => alert('Erro ao buscar o CEP!'));
    }

    if (cepInput) {
        cepInput.addEventListener('input', tratarBuscaCep);
    }

    if (formEndereco) {
        formEndereco.addEventListener('submit', function (e) {
            e.preventDefault();
            if (cepInput && cepInput.value.replace(/\D/g, '').length !== 8) {
                alert('O CEP deve conter exatamente 8 dígitos!');
                return;
            }

            const confirmar = confirm('Deseja realmente confirmar a atualização do endereço da clínica?');
            if (confirmar) {
                alert('Atualização realizada com sucesso!');
            }
        });
    }
});