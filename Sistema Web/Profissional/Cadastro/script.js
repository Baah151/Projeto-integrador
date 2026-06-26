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
        input.type = input.type === 'password' ? 'text' : 'password';
        icone.textContent = input.type === 'password' ? 'visibility' : 'visibility_off';
      });
    }
  }
  ligarVisualizacaoSenha('eye-senha', 'reg-senha');
  ligarVisualizacaoSenha('eye-confirma', 'reg-confirma-senha');

  inputCpf.addEventListener('input', (e) => {
    let v = e.target.value.replace(/\D/g, '').substring(0, 11);
    v = v.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    e.target.value = v;
  });

  inputTelefone.addEventListener('input', (e) => {
    let v = e.target.value.replace(/\D/g, '').substring(0, 11);
    v = v.replace(/^(\d{2})(\d)/g, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2');
    e.target.value = v;
  });

  inputCep.addEventListener('input', (e) => {
    let v = e.target.value.replace(/\D/g, '').substring(0, 8);
    v = v.replace(/^(\d{5})(\d)/, '$1-$2');
    e.target.value = v;
  });

  inputCep.addEventListener('blur', async () => {
    const cep = inputCep.value.replace(/\D/g, '');
    if (cep.length === 8) {
      try {
        inputLogradouro.placeholder = 'Carregando...';
        const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const dados = await res.json();
        if (!dados.erro) {
          inputLogradouro.value = dados.logradouro || '';
          inputBairro.value = dados.bairro || '';
          inputCidade.value = dados.localidade || '';
          inputEstado.value = dados.uf || '';
        }
        inputLogradouro.placeholder = 'Rua, Avenida, etc.';
      } catch { inputLogradouro.placeholder = 'Rua, Avenida, etc.'; }
    }
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');

    const cpfLimpo = inputCpf.value.replace(/\D/g, '');
    const telLimpo = inputTelefone.value.replace(/\D/g, '');
    const cepLimpo = inputCep.value.replace(/\D/g, '');
    const senha = document.getElementById('reg-senha').value;
    const confirmaSenha = document.getElementById('reg-confirma-senha').value;

    if (cpfLimpo.length !== 11) { showNotification('CPF incompleto.', 'error'); return; }
    if (telLimpo.length !== 11) { showNotification('Telefone inválido.', 'error'); return; }
    if (senha !== confirmaSenha) { showNotification('Senhas não conferem.', 'error'); return; }
    if (cepLimpo.length !== 8) { showNotification('CEP incompleto.', 'error'); return; }

    const dados = {
      nome: document.getElementById('reg-nome').value.trim(),
      cpf: inputCpf.value,
      nascimento: document.getElementById('reg-nascimento').value,
      email: document.getElementById('reg-email').value.trim(),
      telefone: inputTelefone.value,
      senha,
      cep: inputCep.value,
      logradouro: inputLogradouro.value,
      numero: document.getElementById('end-numero') ? document.getElementById('end-numero').value : '',
      bairro: inputBairro.value,
      complemento: document.getElementById('end-complemento') ? document.getElementById('end-complemento').value : '',
      cidade: inputCidade.value,
      estado: inputEstado.value,
    };

    btn.textContent = 'Cadastrando...';
    btn.disabled = true;

    try {
      await criarPaciente(dados);
      showNotification('Paciente cadastrado com sucesso!');
      setTimeout(() => { window.location.href = '../pacientes/index.html'; }, 1200);
    } catch (err) {
      showNotification(err.message || 'Erro ao cadastrar.', 'error');
      btn.textContent = 'Cadastrar Paciente';
      btn.disabled = false;
    }
  });
});
