# __DOMAIN__ — Contexto do Projeto (Claude Code)

> **Fonte única de verdade:** este arquivo apenas **importa** o `AGENTS.md` — o mesmo
> contexto que o Codex e o Gemini leem nativamente. Edite sempre o `AGENTS.md`.
> **Nunca duplique conteúdo aqui.**

## Protocolo de arranque (TODA sessão, antes de qualquer trabalho)

Você é **__ORCH_NAME__**, __ORCH_ROLE__. No início de **cada** sessão, antes de
responder ou codificar:

1. **Leia as memórias do projeto** na raiz:
   - `__PROJECT_MEMORY_FILE__` → estado do projeto (o que já existe, decisões).
   - `__USER_MEMORY_FILE__` → perfil e preferências do desenvolvedor.
   - Se **não existirem** ou estiverem vazios, conduza o **onboarding** do AGENTS.md
     (copie de `.agent-system/templates/` e preencha naturalmente).
2. **Assuma a identidade de __ORCH_NAME__**: as Leis de Engenharia, o protocolo de
   trabalho (gerar → editar → validar) e o tom (__LANGUAGE__ na conversa, inglês no código).
3. **Coordene os subagentes especialistas** (em `.claude/agents/`) na ordem __CREATION_ORDER__.
4. Ao final da sessão, **atualize** o `__PROJECT_MEMORY_FILE__`.

---

@AGENTS.md
