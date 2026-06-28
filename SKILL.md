---
name: agent-factory
description: >-
  Use when o usuário quer criar um sistema multi-agente orquestrado (um orquestrador +
  subagentes especialistas, leis de engenharia, memória persistente, scaffolder/linter)
  para QUALQUER domínio ou software, portável entre Claude Code, Codex, Gemini e outras
  IAs/CLIs — ou replicar um toolkit de agentes estilo "Luara/Horizon" para um novo
  projeto. Gatilhos: "crie agentes para X", "quero uma Luara para Y", "sistema de
  subagentes", "fonte única AGENTS.md + pontes", "orquestrador + especialistas".
---

# Agent Factory

## Overview

Gera um **sistema multi-agente orquestrado e portável** para qualquer domínio: 1
orquestradora + N especialistas isolados, leis de engenharia, contratos, memória
persistente e um hook de arranque — tudo a partir de uma **fonte única `AGENTS.md`** que
Claude Code, Codex e Gemini consomem (nativamente ou via ponte fina).

**Princípio:** o conhecimento do domínio vira *dados* (um `spec.json`); a estrutura é
*template*. A mesma arquitetura serve a um tema Shopify, uma API backend, um pipeline de
dados ou um assunto não-técnico — só muda o spec.

## When to use

- "Crie um time de agentes para \<software/assunto\>"; "quero uma orquestradora estilo Luara".
- Padronizar como várias IAs/CLIs arrancam num projeto (mesma persona + memórias).
- **Não use** para um único agente trivial sem especialistas — aí basta um `AGENTS.md` à mão.

## Processo (siga em ordem)

1. **Discovery.** Entreviste o usuário para mapear o domínio → primitivos → camadas →
   especialistas → leis → ordem de criação. Roteiro completo: `references/02-domain-discovery.md`.
2. **Spec.** Materialize as respostas num `agent-system.spec.json` (schema abaixo). Use
   `examples/rest-api.spec.json` como modelo.
3. **Gerar.** Rode o gerador apontando para o projeto-alvo. **Use o caminho absoluto do
   gerador** — assim ele roda de qualquer cwd (acha os próprios templates via `import.meta.url`):
   ```bash
   node ~/.claude/skills/agent-factory/generator/factory.mjs \
     --spec agent-system.spec.json --out <projeto> [--dry-run] [--force]
   ```
   Comece com `--dry-run` para revisar a lista de arquivos. Sem `--force`, arquivos
   existentes são preservados. O nome do arquivo de spec é livre (`--spec` aceita qualquer caminho).
4. **Fallback sem Node.** Se a IA/ambiente não tiver Node, **não pare**: leia os
   `templates/*.tpl`, substitua os `__PLACEHOLDER__` com os valores do spec e escreva os
   arquivos manualmente. O gerador é conveniência, não requisito — por isso roda em
   qualquer IA/CLI.
5. **Ativar + handoff.** Veja `references/03-multi-tool-bridges.md`. No Claude, o hook
   `SessionStart` só vale a partir da próxima sessão (ou após abrir `/hooks`).

## O spec (schema mínimo)

```jsonc
{
  "system": { "orchestrator": "Atlas", "role": "...", "mission": "...", "description": "...",
              "domain": "...", "stack": "...", "language": "Português brasileiro",
              "creationOrder": "a → b → c",
              // opcionais (têm default): workspacePath, projectMemoryFile, userMemoryFile
              "projectMemoryFile": "PROJECT_MEMORY.md", "userMemoryFile": "USER_MEMORY.md" },
  "specialists": [ { "name": "schema_agent", "role": "...", "description": "...",
                     "scope": "...", "purpose": "...",
                     "primitives": "...",  // preenche o slot "Primitivos autorizados" do contrato
                     "forbidden": ["..."],
                     "handoffs": [ { "when": "...", "to": "...", "context": "..." } ],
                     "checklist": ["..."] } ],
  "laws": [ { "id": 1, "name": "...", "summary": "...", "details": "..." } ],
  "tools": ["claude", "codex", "gemini"],
  "features": { "memory": true, "hook": true, "contracts": true, "laws": true },
  "extraReferences": ["Docs: https://..."]   // opcional: links que entram no AGENTS.md
}
```
> Campos opcionais caem em defaults sensatos se omitidos. `primitives` é o mais fácil de
> esquecer — sem ele, o contrato mostra `(defina os primitivos autorizados)`.

## Arquivos gerados (referência rápida)

| Saída | Para quê |
|---|---|
| `AGENTS.md` | Fonte única (Codex/Gemini leem nativo) |
| `CLAUDE.md` | Ponte Claude → importa `@AGENTS.md` |
| `GEMINI.md` | Ponte Gemini (fallback) |
| `.claude/agents/*.md` | Orquestradora + especialistas (subagentes) |
| `.claude/settings.json` + `.claude/hooks/session-start.sh` | Arranque determinístico (identidade + memórias) |
| `.agent-system/laws/*.md` · `agents/*.md` · `templates/*` | Leis, contratos, templates de memória |

> O gerador entrega o **núcleo** do sistema. O **scaffolder/linter específico do domínio**
> (scripts gen/lint) é opcional e **não vem pronto** na saída — é um passo seguinte guiado
> por `references/04-scaffolder-linter.md`.

## Referências

- `references/01-architecture.md` — as 5 camadas e o molde abstrato.
- `references/02-domain-discovery.md` — roteiro de entrevista do domínio.
- `references/03-multi-tool-bridges.md` — fonte única + pontes + adicionar uma IA nova.
- `references/04-scaffolder-linter.md` — derivar gen/lint específicos do domínio.
- `README.md` — como instalar/usar em Claude, Codex e Gemini.

## Common mistakes

- Duplicar instruções por ferramenta em vez de manter o `AGENTS.md` como fonte única.
- Especialistas com escopos sobrepostos (sem hand-off claro) → defina escopo proibido.
- Esquecer o fallback sem-Node ao rodar numa IA sem shell.
