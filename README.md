# 🛡️ Pipeline de Segurança — Projeto Final DevSecOps

**URL de Produção:** https://sand-smac.github.io/security-pipeline/

---

## O que eu fiz neste projeto?

Eu precisava criar uma pipeline de segurança que impedisse código vulnerável de chegar à produção. O repositório já tinha uma aplicação web, mas o código estava cheio de problemas de segurança propositais — e a pipeline não tinha os gates de segurança implementados.

Minha missão foi implementar esses gates e corrigir as vulnerabilidades encontradas.

---

## Como a pipeline funciona?

Basicamente, antes de qualquer deploy acontecer, o código precisa passar por 4 verificações (gates). Se uma falhar, o deploy é bloqueado na hora. Só chega em produção o que passar em tudo.

---

### Gate 1 — Gitleaks (Secrets Scanning)

O Gitleaks vasculha o código inteiro procurando por senhas, tokens e chaves de API que estejam escritas diretamente no código — o que chamamos de "hardcoded".

Isso é um problema gravíssimo porque se alguém tiver acesso ao repositório, consegue usar essas credenciais para invadir sistemas, banco de dados, APIs, etc.

No código original eu encontrei duas situações assim:
- `const API_SECRET = "ghp_hardcodedSecretToken1234567890abcd"`
- `const DB_PASSWORD = "admin123"`

A correção foi substituir por variáveis de ambiente:
- `const API_SECRET = process.env.API_SECRET`
- `const DB_PASSWORD = process.env.DB_PASSWORD`

---

### Gate 2 — Semgrep (SAST)

O Semgrep analisa o código sem precisar executá-lo, procurando padrões de código inseguro. É como uma revisão automática que conhece os principais erros que desenvolvedores cometem.

Ele encontrou três problemas no código:

**SQL Injection** — a query SQL estava sendo montada com o input do usuário direto na string, o que permite que um atacante manipule a consulta ao banco. Corrigi usando prepared statements com `?` como placeholder.

**Command Injection** — o código usava `exec()` com input do usuário, o que permitia executar comandos maliciosos no servidor. Corrigi substituindo por `execFile()` com lista de argumentos separados.

**XSS Refletido** — o input do usuário era inserido direto no HTML sem nenhuma sanitização, permitindo injeção de scripts maliciosos. Corrigi usando `he.encode()` antes de renderizar qualquer input.

---

### Gate 3 — Grype (SCA)

O Grype verifica as dependências do projeto (as bibliotecas listadas no `package.json`) em busca de vulnerabilidades conhecidas, chamadas de CVEs.E detectou 6 CVEs — 2 críticos e 4 moderados — nas versões originais de mysql2 e express.
mysql2 ^3.6.5 → atualizado para ^3.9.8

CVE-2024-21508 (CRITICAL) — RCE via readCodeFor por validação incorreta de supportBigNumbers
CVE-2024-21511 (CRITICAL) — Arbitrary Code Injection via parâmetro timezone não sanitizado
CVE-2024-21509 (MODERATE) — Prototype Poisoning em text_parser.js e binary_parser.js
CVE-2024-21507 (MODERATE) — Cache Poisoning via keyFromFields

express ^4.18.2 → atualizado para ^4.21.2

CVE-2024-29041 (MODERATE) — Open Redirect em res.redirect() via URLs malformadas
CVE-2024-43796 (MODERATE) — XSS em res.redirect() com input não sanitizado

Após as atualizações, o Grype não encontrou nenhum CVE de severidade HIGH ou CRITICAL. A he ^1.2.0 não apresentou vulnerabilidades conhecidas.

Isso é importante porque mesmo que o nosso código esteja correto, se usarmos uma biblioteca desatualizada com falha de segurança conhecida, o sistema continua vulnerável.

A pipeline quebra se encontrar qualquer dependência com severidade HIGH ou CRITICAL.

---

### Gate 4 — Deploy (GitHub Pages)

Este gate só roda se os três anteriores passarem. Ele publica a aplicação no GitHub Pages automaticamente.

É o conceito de "break the build" na prática — a esteira garante que só código seguro vai para produção.

**URL:** https://sand-smac.github.io/security-pipeline/

---

## O que aprendi com isso?

Antes deste projeto eu não sabia que existiam ferramentas que fazem essa verificação de forma automática. Achei muito interessante ver na prática como um segredo hardcoded ou uma query SQL mal feita pode ser detectada antes mesmo do código ir para produção. Faz todo sentido integrar isso ao fluxo de desenvolvimento desde o início.
