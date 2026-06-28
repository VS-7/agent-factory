# agent-factory

Skill agnóstica que ensina qualquer IA a **projetar e gerar um sistema multi-agente
orquestrado** (1 orquestradora + N especialistas, leis, memória, hook de arranque) para
qualquer domínio, **portável entre Claude Code, Codex e Gemini** — e extensível a outras
ferramentas. Generaliza o "ferramental Luara/Horizon".

## Estrutura

```
agent-factory/
├── SKILL.md                 # playbook (ponto de entrada)
├── README.md                # este arquivo
├── references/              # 01-architecture, 02-domain-discovery, 03-multi-tool-bridges, 04-scaffolder-linter
├── templates/               # esqueletos .tpl com placeholders __PLACEHOLDER__
├── generator/factory.mjs    # gerador Node zero-dependência
└── examples/rest-api.spec.json
```

## Uso rápido

1. Descreva o domínio à IA: *"crie um sistema de agentes para \<X\>"*.
2. A IA entrevista você (`references/02`) e monta um `agent-system.spec.json`.
3. Gere o sistema no projeto-alvo:
   ```bash
   G=~/.claude/skills/agent-factory/generator/factory.mjs   # caminho absoluto → roda de qualquer cwd
   node "$G" --spec agent-system.spec.json --out /caminho/do/projeto --dry-run
   node "$G" --spec agent-system.spec.json --out /caminho/do/projeto
   ```
4. (Sem Node) a IA preenche os `templates/*.tpl` manualmente — mesma saída.

Teste o gerador agora mesmo:
```bash
node ~/.claude/skills/agent-factory/generator/factory.mjs \
  --spec ~/.claude/skills/agent-factory/examples/rest-api.spec.json --out /tmp/atlas-demo
```

## Como cada ferramenta carrega o sistema gerado

- **Claude Code** — auto: lê `CLAUDE.md` (importa `@AGENTS.md`), os subagentes em
  `.claude/agents/` e roda o hook `SessionStart`. Vale a partir da próxima sessão.
- **Codex** — auto: lê o `AGENTS.md` da raiz nativamente. Garanta `trust_level = "trusted"`
  no `~/.codex/config.toml`.
- **Gemini** — lê `AGENTS.md`/`GEMINI.md` nativamente.
- **Outras** — crie uma ponte fina apontando para `AGENTS.md` (`references/03`).

## Onde esta skill vive

Em `~/.claude/skills/agent-factory/` — fora de qualquer repositório (não é commitada). O
Claude Code a carrega automaticamente; para usar no Codex/Gemini, aponte/copia a pasta.
Auto-contida e portável.
