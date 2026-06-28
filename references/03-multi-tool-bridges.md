# 03 — Fonte única + pontes multi-ferramenta

## A regra de ouro

**`AGENTS.md` na raiz é a fonte única de verdade.** Toda ferramenta lê a MESMA fonte —
diretamente ou por uma ponte fina que aponta para ela. Nunca duplique instruções por
ferramenta; qualquer ajuste de comportamento entra no `AGENTS.md` e propaga para todas.

## Convenções por ferramenta

| Ferramenta | Lê automaticamente | Ponte gerada | Subagentes | Hook de arranque |
|---|---|---|---|---|
| **Codex** | `AGENTS.md` (nativo) | nenhuma | — | — |
| **Gemini CLI** | `AGENTS.md` / `GEMINI.md` | `GEMINI.md` → `@AGENTS.md` | — | — |
| **Claude Code** | `CLAUDE.md` (não `AGENTS.md`) | `CLAUDE.md` → `@AGENTS.md` | `.claude/agents/*.md` | `.claude/settings.json` → `session-start.sh` |

> **A lição que originou esta skill:** o Claude Code **não** lê `AGENTS.md` por padrão. Sem
> um `CLAUDE.md`, ele arranca "cego" enquanto Codex/Gemini já assumem a persona. A ponte
> `CLAUDE.md` (import `@AGENTS.md`) + o hook resolvem a paridade.

## Por que o hook (e não só o CLAUDE.md)

O `CLAUDE.md` faz o modelo *ser instruído* a ler as memórias. O **hook `SessionStart`** vai
além: injeta a identidade e o **conteúdo vivo** de `PROJECT_MEMORY`/`USER_MEMORY` de forma
determinística (via harness), sem depender do modelo lembrar de usar `Read`. O hook gerado
emite JSON (`hookSpecificOutput.additionalContext`) e tem fallback para texto puro se não
houver `jq`.

> O hook só passa a valer **na próxima sessão** (ou após abrir `/hooks`): o watcher de
> settings não captura um `settings.json` criado durante a sessão atual.

## Adicionar uma ferramenta nova (registro extensível)

O padrão é sempre o mesmo — uma ponte fina que aponta para `AGENTS.md`:

| Ferramenta | Onde criar a ponte |
|---|---|
| **Cursor** | `.cursor/rules/agents.mdc` (ou `.cursorrules`) referenciando/incluindo `AGENTS.md` |
| **GitHub Copilot** | `.github/copilot-instructions.md` apontando para `AGENTS.md` |
| **Windsurf** | `.windsurfrules` incluindo o conteúdo/aponte de `AGENTS.md` |
| **Aider** | `CONVENTIONS.md` (via `.aider.conf.yml`) apontando para `AGENTS.md` |

Passos: (1) se a ferramenta tem um arquivo de contexto próprio, faça-o importar/citar o
`AGENTS.md`; (2) se ela suporta subagentes, replique `.claude/agents/` no formato dela; (3)
se ela suporta hooks de início, replique o `session-start.sh`. Acrescente a ferramenta ao
array `tools` do spec quando o gerador passar a suportá-la, ou crie a ponte à mão.
