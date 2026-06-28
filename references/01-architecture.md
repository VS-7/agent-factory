# 01 — Arquitetura: as 5 camadas + portabilidade

O sistema é ~85% agnóstico. O que muda entre domínios é o *conteúdo* (o spec); a estrutura
abaixo é constante.

## As 5 camadas

1. **Macroarquitetura — 1 orquestradora + N especialistas isolados.**
   A orquestradora planeja e delega; cada especialista tem um escopo estrito e não invade o
   dos outros. Granularidade: um especialista = uma responsabilidade.

2. **Contratual — contratos de agente.**
   Cada especialista tem um contrato: *propósito* (o que entrega), *escopo permitido*,
   *escopo proibido*, *regras de hand-off* (quando passar para outro agente, com que
   contexto) e *checklist de saída*. O contrato é o que mantém os escopos isolados.

3. **Princípios imutáveis — leis de engenharia.**
   Regras transversais que TODOS os agentes obedecem (ex.: arquitetura em camadas, validação
   na borda, performance). Cada lei tem resumo + detalhes + "como validar".

4. **Fluxo de trabalho — gerar → editar → validar.**
   Nada é escrito "de memória": gera-se a partir de template/scaffolder, edita-se com
   contexto, valida-se contra as leis (linter, se houver). É o pipeline de qualidade.

5. **Contexto persistente — memória.**
   `PROJECT_MEMORY` (estado do projeto, decisões, log) e `USER_MEMORY` (perfil/preferências).
   Lidos no arranque, atualizados ao fim da sessão. Evitam duplicação e recalibram respostas.

## Camada transversal — portabilidade multi-ferramenta

A peça que torna tudo portável: **`AGENTS.md` é a fonte única de verdade**. Codex e Gemini o
leem nativamente; o Claude o recebe via `CLAUDE.md` (que importa `@AGENTS.md`) + um hook
`SessionStart` que injeta identidade e memórias de forma determinística. Adicionar uma
ferramenta nova = criar uma ponte fina que aponte para o `AGENTS.md` (ver `03`).

## O molde abstrato (como mapear um domínio novo)

| Camada genérica | Tema Shopify (Luara) | API backend (Atlas) |
|---|---|---|
| Primitivo base | snippet | model (schema) |
| Composição intermediária | block | service (caso de uso) |
| Composição final | section | route (HTTP) |
| Qualidade transversal | linter de tema | test_agent |
| Leis | SOLID, BEM, camadas, perf | camadas, validação, erros, perf |

Reconheça no domínio: **(a)** os tipos de artefato e sua ordem de composição, **(b)** as
fronteiras naturais de responsabilidade (→ especialistas), **(c)** os invariantes de
qualidade (→ leis).
