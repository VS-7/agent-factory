# 04 — Scaffolder + Linter de domínio (opcional)

O `factory.mjs` gera o **núcleo** do sistema (AGENTS.md, agentes, leis, memória, pontes,
hook). O **scaffolder/linter específico do domínio** é um passo seguinte opcional — ele é
colado demais ao stack para ser genérico, então este guia ensina a construí-lo (a referência
viva é o par `scripts/horizon-gen.mjs` + `scripts/horizon-lint.mjs` do projeto Horizon).

## Scaffolder (gerar → editar)

Objetivo: nunca escrever um artefato "do zero de memória". Para cada **tipo de artefato** do
domínio:

1. Crie um template canônico com placeholders (`__NAME__`, `__NAMESPACE__`, …).
2. Um script `gen` copia o template, substitui os placeholders e **fia** o artefato no lugar
   certo (registra a rota, importa o módulo, adiciona ao índice…).
3. Exponha via CLI/script: `gen <tipo> <nome> [--opções]`.

Espelhe o padrão do `factory.mjs` (função `fill()` + `emit()`); ele já é um scaffolder
agnóstico — adapte os templates para os tipos do seu domínio.

## Linter (validar)

Objetivo: transformar as **Leis** em checagens automáticas.

- **Erros (bloqueiam):** apenas regras de **alta confiança, zero falso-positivo** (ex.: um
  anti-padrão proibido literal). Rodam em CI/pre-commit.
- **Avisos (modo estrito):** heurísticas que pedem julgamento humano.
- **Ignore** blocos de doc/comentário ao varrer (evita falso-positivo em exemplos).

Estrutura mínima de um linter (pseudo): varra os arquivos do escopo → para cada lei, aplique
um matcher → acumule {erro|aviso, arquivo, linha, regra} → saída legível + exit code ≠ 0 se
houver erro.

## Quando NÃO construir

Se o domínio tem poucos artefatos repetitivos, ou a IA gera com qualidade direto dos
contratos + leis, pule o scaffolder/linter. Eles pagam quando há **repetição estrutural** e
**conformidade fácil de errar** — exatamente o caso de temas/componentes.
