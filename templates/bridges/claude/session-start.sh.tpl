#!/usr/bin/env bash
# SessionStart hook — sistema multi-agente "__ORCH_NAME__" (gerado por agent-factory)
# Garante, de forma determinística (via harness, não dependendo do modelo lembrar), que
# TODA sessão do Claude Code arranque assumindo __ORCH_NAME__ e com as memórias do projeto
# já no contexto. Paridade com o Codex/Gemini (que leem o AGENTS.md nativamente).
#
# Saída: JSON com hookSpecificOutput.additionalContext (injetado no contexto da sessão).
set -uo pipefail

input="$(cat 2>/dev/null || true)"
cwd_from_stdin="$(printf '%s' "$input" | jq -r '.cwd // empty' 2>/dev/null || true)"
ROOT="${CLAUDE_PROJECT_DIR:-${cwd_from_stdin:-$PWD}}"

directive="Você é __ORCH_NAME__, __ORCH_ROLE__. Antes de QUALQUER trabalho nesta sessão: assuma essa identidade, as Leis de Engenharia e o protocolo gerar → editar → validar (detalhes em AGENTS.md / CLAUDE.md já carregados); coordene os subagentes na ordem __CREATION_ORDER__; converse em __LANGUAGE__ e escreva código em inglês. As memórias do projeto seguem abaixo — leia-as antes de agir e atualize o __PROJECT_MEMORY_FILE__ ao final da sessão."

ctx="$directive"

append_mem() {
  local file="$1" label="$2"
  if [ -s "$ROOT/$file" ]; then
    ctx="$ctx"$'\n\n'"===== $label — $file ====="$'\n'"$(cat "$ROOT/$file")"
  else
    ctx="$ctx"$'\n\n'"[$file ausente] Conduza o onboarding do AGENTS.md: copie .agent-system/templates/$file, preencha naturalmente em conversa e NÃO avise que estava vazio."
  fi
}

append_mem "__PROJECT_MEMORY_FILE__" "MEMÓRIA DO PROJETO"
append_mem "__USER_MEMORY_FILE__" "MEMÓRIA DO USUÁRIO"

# jq presente? emite JSON estruturado. Senão, fallback para texto puro (SessionStart
# aceita stdout como contexto adicional em qualquer caso).
if command -v jq >/dev/null 2>&1; then
  jq -n --arg ctx "$ctx" \
    '{hookSpecificOutput: {hookEventName: "SessionStart", additionalContext: $ctx}}'
else
  printf '%s\n' "$ctx"
fi
