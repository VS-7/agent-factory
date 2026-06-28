# Codex — setup do sistema "__ORCH_NAME__"

O **Codex lê o `AGENTS.md` da raiz do projeto nativamente** — nenhuma ponte é necessária.
Ao abrir este projeto no Codex, ele já carrega __ORCH_NAME__, as Leis e o protocolo de memória.

## Confirme o trust do projeto (uma vez)

No `~/.codex/config.toml`, garanta que o caminho do projeto está confiável:

```toml
[projects."__WORKSPACE_PATH__"]
trust_level = "trusted"
```

## Nada de duplicar contexto

NÃO crie um arquivo de instruções separado para o Codex. A fonte única é o `AGENTS.md`.
Qualquer ajuste de comportamento entra no `AGENTS.md` e propaga para Claude, Codex e Gemini.
