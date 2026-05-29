🌿 Site de Fisioterapia e Pilates

Projeto de um site institucional desenvolvido para uma profissional da área de
Fisioterapia e Pilates, com o objetivo de apresentar serviços, disponibilizar
informações de contato e facilitar o agendamento de consultas.
O projeto foi estruturado de forma modular, permitindo futuras expansões e
integrações com serviços externos.

---

🚀 Tecnologias Utilizadas

🎨 Front-end
* HTML5 – Estruturação das páginas
* CSS3 – Estilização e layout responsivo
* JavaScript – Interatividade da aplicação
* React (via CDN) – Construção da interface de forma componentizada
* Babel Standalone – Permite a utilização de JSX diretamente no navegador
* Google Fonts – Padronização e melhoria da tipografia

⚙️ Back-end (em planejamento)
* Node.js – Ambiente de execução JavaScript no servidor
* Express.js – Framework para criação de APIs REST
* Axios – Comunicação entre serviços via HTTP
* dotenv – Gerenciamento de variáveis de ambiente

🗄️ Banco de Dados
* PostgreSQL – Sistema de gerenciamento de banco de dados relacional
* DBeaver – Interface gráfica para administração do banco de dados

---

🎯 Funcionalidades
* Página inicial com apresentação institucional
* Seção de serviços oferecidos
* Seção de benefícios e diferenciais
* Área de contato
* Botão de redirecionamento direto para WhatsApp
* Layout responsivo para diferentes dispositivos
* Estrutura preparada para agendamento automatizado

---

📖 Bibliotecas e Recursos Utilizados
* React (CDN) – Organização da interface em componentes
* Babel Standalone – Transpilação de código JSX no navegador
* Google Fonts – Tipografia personalizada
* Links da API do WhatsApp (wa.me / api.whatsapp.com) – Integração para contato
  e agendamento
* Node.js e Express.js – Planejados para implementação das regras de negócio
* Google Calendar API (planejado) – Automação e gerenciamento de agendamentos

---

🛠️ Ferramentas de Desenvolvimento
* Visual Studio Code – Editor de código-fonte
* Git – Controle de versionamento
* GitHub – Hospedagem do repositório
* GitHub Pages – Publicação do front-end
* DBeaver – Administração e visualização do banco de dados

---

🏗️ Arquitetura do Projeto

O projeto segue uma arquitetura baseada na separação entre front-end e back-end,
permitindo maior organização, manutenção e escalabilidade.

O front-end é responsável pela interface do usuário, enquanto o back-end,
implementado com Node.js, será responsável pelo gerenciamento de dados,
integrações e automações.

O banco de dados PostgreSQL armazena as informações de pacientes, profissionais,
agendamentos, consultas, documentos, histórico e disponibilidade de agenda,
seguindo um modelo relacional com integridade referencial via chaves estrangeiras.

---

🗄️ Estrutura do Banco de Dados

O banco sistema_clinica é composto pelas seguintes tabelas:

| Tabela                  | Descrição                                         |
|-------------------------|---------------------------------------------------|
| paciente                | Dados cadastrais dos pacientes                    |
| profissional            | Dados cadastrais dos profissionais de saúde       |
| agendamento             | Consultas agendadas entre paciente e profissional |
| consulta                | Diagnóstico e prescrição após a consulta          |
| documento               | Arquivos e exames enviados pelo paciente          |
| financeiro              | Controle de pagamentos das consultas              |
| historico               | Histórico clínico do paciente                     |
| disponibilidade_agenda  | Horários disponíveis de cada profissional         |

---

📌 Status do Projeto
* ✅ Front-end funcional
* ✅ Banco de dados modelado e implementado
* 🚧 Back-end em fase de planejamento e implementação
* 🚀 Estrutura preparada para futuras integrações e automações
