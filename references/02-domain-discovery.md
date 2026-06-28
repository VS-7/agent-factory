# 02 — Domain Discovery (roteiro de entrevista)

Objetivo: transformar "quero agentes para X" num `spec.json`. Pergunte **uma de cada vez**,
em linguagem do usuário, e proponha defaults quando ele hesitar.

## Perguntas

1. **Domínio e stack.** "Que software/assunto é esse e qual o stack?" → `system.domain`,
   `system.stack`.
2. **Identidade da orquestradora.** "Como quer chamar a líder e qual o papel dela?" →
   `system.orchestrator`, `role`, `mission`.
3. **Artefatos e composição.** "Quais são as *peças* que vocês criam, e em que ordem uma
   depende da outra?" (ex.: snippet→block→section; ou model→service→route→test). →
   `system.creationOrder` e a base da lista de especialistas.
4. **Fronteiras de responsabilidade.** Para cada peça/área: "quem cuida disso, e o que essa
   pessoa **não** faz?" → um especialista por fronteira, com `scope` e `forbidden`.
5. **Hand-offs.** "Quando o trabalho de A precisa de B, o que A entrega para B?" →
   `specialists[].handoffs`.
6. **Leis de qualidade.** "Quais regras NUNCA podem ser violadas neste projeto?" (arquitetura,
   segurança, performance, estilo) → `laws`.
7. **Ferramentas/IAs.** "Quais CLIs vocês usam?" → `tools` (claude/codex/gemini/…).
8. **Camadas opcionais.** memória? hook? contratos? leis? scaffolder/linter? → `features`.

## Heurísticas para derivar especialistas

- **Uma responsabilidade por especialista.** Se você precisa de "E" para descrever o escopo
  ("rotas **e** banco"), são dois especialistas.
- **Escopo proibido é tão importante quanto o permitido** — é o que evita sobreposição.
- **Ordem de criação** segue a dependência: o que é consumido nasce antes do que consome.
- 3–8 especialistas é o ponto saudável. Menos que 3, talvez não precise de orquestração;
  mais que 8, agrupe responsabilidades.

## Exemplo de mapeamento (mentale antes de escrever o spec)

> Domínio: "app CLI de deploy". Artefatos: comando → serviço → provider. Fronteiras:
> `command_agent` (parsing/UX do CLI, não chama cloud), `service_agent` (orquestra deploy,
> não conhece flags), `provider_agent` (fala com AWS/GCP, não conhece o CLI), `test_agent`.
> Leis: idempotência, dry-run sempre disponível, segredos nunca em log, erros acionáveis.

Quando o mapa estiver claro, escreva o `spec.json` (modelo: `examples/rest-api.spec.json`).
