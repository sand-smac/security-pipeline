🛡️ Security Pipeline — Desafio DevSecOps | ADA Tech
Repositório: sand-smac/security-pipeline · Branch: main

Sobre o projeto
Esse repositório faz parte do desafio prático do módulo de DevSecOps da ADA Tech.
A ideia era simples de entender, mas trabalhosa de executar: eu recebi uma aplicação web cheia de vulnerabilidades propositais e uma pipeline incompleta. Minha missão era implementar os gates de segurança, deixar a pipeline quebrar ao encontrar os problemas, corrigir cada um deles, e só então fazer tudo passar com verde.
Cada etapa me ensinou bastante coisa na prática.

Como a pipeline funciona
Antes de qualquer deploy acontecer, o código precisa passar por 4 verificações em sequência. Se uma falhar, o processo para ali mesmo — o deploy não acontece. Só chega em produção o que passar em tudo.
Isso é o que chamam de "break the build": a esteira não é decorativa, realmente bloqueia código inseguro.

Gate 1 — Secrets Scanning com Gitleaks
O Gitleaks vasculha o repositório inteiro procurando por senhas, tokens e chaves de API escritas diretamente no código. Isso tem um nome: hardcoded credentials, e é considerado um dos erros mais graves que um desenvolvedor pode cometer.
O motivo é simples: qualquer pessoa com acesso ao repositório consegue usar essas credenciais para invadir sistemas, acessar bancos de dados, consumir APIs pagas — o estrago pode ser enorme.
No código original eu encontrei isso aqui:
const API_SECRET = "ghp_hardcodedSecretToken1234567890abcd"
const DB_PASSWORD = "admin123"
A correção foi mover tudo para variáveis de ambiente:

js
const API_SECRET = process.env.API_SECRET
const DB_PASSWORD = process.env.DB_PASSWORD

Parece simples, mas a diferença de segurança é gigante. O valor real nunca fica no código — ele fica em um lugar separado, protegido.

Gate 2 — SAST com Semgrep
O Semgrep faz análise estática de código, ou seja, ele lê o código sem precisar executar e identifica padrões conhecidos de vulnerabilidade. É como se fosse uma revisão de código automática, feita por alguém que conhece os erros mais comuns.
Ele encontrou três problemas:
SQL Injection
A query estava sendo montada colando o input do usuário direto na string. Um atacante pode manipular esse input e fazer o banco executar qualquer coisa que ele quiser.

js//
Vulnerável
const query = "SELECT * FROM users WHERE id = " + userId

// Corrigido
const query = "SELECT * FROM users WHERE id = ?"
connection.query(query, [userId])

Command Injection
O código usava exec() com input do usuário, o que permitia executar comandos maliciosos no próprio servidor.
js// Vulnerável
exec("ls " + userInput)

// Corrigido
execFile("ls", [userInput])

XSS Refletido
O input do usuário estava sendo inserido direto no HTML sem nenhum tratamento. Um atacante podia injetar um script e fazer ele rodar no navegador de outras pessoas.
js// Vulnerável
element.innerHTML = userInput

// Corrigido
element.innerHTML = he.encode(userInput)

Gate 3 — SCA com Grype
O Grype analisa as dependências do projeto listadas no package.json e verifica se alguma delas tem vulnerabilidades conhecidas — os famosos CVEs.
Isso é algo que eu não tinha pensado antes: mesmo que o nosso código esteja correto, se a biblioteca que usamos tem uma falha de segurança conhecida, o sistema continua vulnerável. Não adianta nada a casa estar arrumada se a fechadura está quebrada.

O Grype encontrou 6 CVEs nas versões originais:
mysql2 ^3.6.5 → atualizado para ^3.9.8

CVESeveridadeDescriçãoCVE-2024-21508CRITICALRCE via readCodeFor por validação incorreta de supportBigNumbersCVE-2024-21511CRITICALInjeção de código arbitrário via parâmetro timezone não sanitizadoCVE-2024-21509MODERATEPrototype Poisoning em text_parser.js e binary_parser.jsCVE-2024-21507MODERATECache Poisoning via keyFromFields
express ^4.18.2 → atualizado para ^4.21.2
CVESeveridadeDescriçãoCVE-2024-29041MODERATEOpen Redirect em res.redirect() via URLs malformadasCVE-2024-43796MODERATEXSS em res.redirect() com input não sanitizado

Após as atualizações, o Grype não encontrou nenhum CVE de severidade HIGH ou CRITICAL. A biblioteca he ^1.2.0 não apresentou vulnerabilidades.
A pipeline quebra automaticamente se encontrar qualquer dependência com severidade HIGH ou CRITICAL.

Gate 4 — Deploy no GitHub Pages
Esse gate só roda se os três anteriores passarem. Ele publica a aplicação automaticamente no GitHub Pages.
Não tem segredo aqui: se chegou nesse ponto, o código passou em tudo e merece ir para produção.

URL de produção
🔗 https://sand-smac.github.io/security-pipeline/

O que aprendi com isso:
Antes desse projeto, eu sabia que segurança era importante, mas não entendia direito como isso funcionava na prática dentro de um fluxo de desenvolvimento.
Ver uma ferramenta como o Gitleaks barrar um commit por causa de uma senha no código, ou o Semgrep apontar exatamente a linha do SQL Injection — isso tornou o conceito muito mais concreto pra mim.
O que ficou mais claro é que segurança não é algo que você adiciona no final. Ela precisa estar no meio do processo, bloqueando problemas antes que eles cheguem em produção, assunto repisado em sala de aula e demonstrado na  pipeline.
