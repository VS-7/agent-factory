# agent-factory

Uma **fábrica de sistemas multi-agente**. É uma *skill* (um playbook + gerador) que ensina
qualquer IA a **projetar e gerar um time de agentes orquestrado** para qualquer domínio —
e que funciona igual no **Claude Code, Codex, Gemini** e outras CLIs/IAs.

Em vez de você escrever à mão todos os arquivos de configuração de agentes, você **descreve
o domínio** e a fábrica gera a estrutura completa: orquestradora, especialistas, leis,
contratos, memória e o hook de arranque.

---

## O que é

Um sistema multi-agente é um **orquestrador** (que planeja e delega) coordenando vários
**especialistas** (cada um dono de uma responsabilidade estrita). A `agent-factory` é o
molde que produz esse sistema pronto para usar.

A ideia central:

> **O conhecimento do domínio vira *dados* (um `spec.json`). A estrutura é *template*.**

Por isso a mesma fábrica gera um time para um tema Shopify, uma API backend, um pipeline de
dados ou um tema não-técnico — a única coisa que muda é o conteúdo do spec.

## O que faz

1. **Entrevista** você para mapear o domínio (artefatos, fronteiras de responsabilidade,
   regras de qualidade).
2. **Materializa** as respostas num `agent-system.spec.json`.
3. **Gera** todos os arquivos do sistema no projeto-alvo a partir de templates.
4. **Ativa** o sistema em cada ferramenta via uma fonte única + pontes finas.

O resultado é um time de agentes que qualquer uma das IAs suportadas carrega
automaticamente ao abrir o projeto.

### Arquivos que ela gera

| Saída | Para quê |
|---|---|
| `AGENTS.md` | **Fonte única de verdade** (Codex/Gemini leem nativo) |
| `CLAUDE.md` | Ponte para o Claude → importa `@AGENTS.md` |
| `GEMINI.md` | Ponte para o Gemini |
| `.claude/agents/*.md` | Orquestradora + especialistas (subagentes) |
| `.claude/settings.json` + `.claude/hooks/session-start.sh` | Arranque determinístico (identidade + memórias) |
| `.agent-system/laws/*.md` · `agents/*.md` · `templates/*` | Leis, contratos e templates de memória |

---

## Arquitetura (de forma simples)

O sistema gerado tem **5 camadas** + 1 camada transversal de portabilidade. Cerca de 85% é
agnóstico ao domínio; só o conteúdo muda.

```
                ┌─────────────────────────────────────────────┐
                │   AGENTS.md  (fonte única de verdade)        │
                │   ── lida nativa por Codex/Gemini            │
                │   ── via pontes finas por Claude e outras    │
                └─────────────────────────────────────────────┘
                                    │
        ┌───────────────────────────┴───────────────────────────┐
        │                  Orquestradora                         │
        │            (planeja, delega, integra)                  │
        └───────────────────────────┬───────────────────────────┘
                                    │ delega por contrato
        ┌──────────────┬────────────┼────────────┬──────────────┐
        ▼              ▼             ▼            ▼              ▼
   especialista   especialista  especialista  especialista   ...
   (escopo 1)     (escopo 2)    (escopo 3)    (qualidade)

   regidos por:  ⚖️ Leis de engenharia (regras que TODOS obedecem)
   guiados por:  📄 Contratos (propósito, escopo, hand-offs, checklist)
   apoiados por: 🧠 Memória (PROJECT_MEMORY + USER_MEMORY)
```

1. **Macroarquitetura** — 1 orquestradora + N especialistas isolados. Um especialista = uma
   responsabilidade; ninguém invade o escopo do outro.
2. **Contratos** — cada especialista tem propósito, escopo permitido, escopo proibido,
   regras de hand-off e checklist de saída. É o que mantém os escopos separados.
3. **Leis de engenharia** — regras transversais imutáveis que todos os agentes seguem
   (ex.: arquitetura em camadas, validação na borda, performance).
4. **Fluxo gerar → editar → validar** — nada é escrito "de memória"; gera-se de template,
   edita-se com contexto, valida-se contra as leis.
5. **Memória persistente** — `PROJECT_MEMORY` (estado e decisões do projeto) e
   `USER_MEMORY` (perfil/preferências), lidas no arranque e atualizadas ao fim.

**Camada transversal — portabilidade.** Tudo gira em torno do `AGENTS.md` como fonte única.
Codex e Gemini o leem nativamente; o Claude o recebe via `CLAUDE.md` + um hook
`SessionStart`. Adicionar uma ferramenta nova = criar uma ponte fina apontando para o
`AGENTS.md`.

### O molde abstrato

| Camada genérica | Tema Shopify (Luara) | API backend (Atlas) |
|---|---|---|
| Primitivo base | snippet | model (schema) |
| Composição intermediária | block | service (caso de uso) |
| Composição final | section | route (HTTP) |
| Qualidade transversal | linter de tema | test_agent |
| Leis | SOLID, BEM, camadas, perf | camadas, validação, erros, perf |

---

## Estrutura do repositório

```
agent-factory/
├── SKILL.md                 # playbook — ponto de entrada da skill
├── README.md                # este arquivo
├── references/              # 01-architecture · 02-domain-discovery · 03-multi-tool-bridges · 04-scaffolder-linter
├── templates/               # esqueletos .tpl com placeholders __PLACEHOLDER__
├── generator/factory.mjs    # gerador Node, zero-dependência
└── examples/rest-api.spec.json
```

## Uso rápido

1. Descreva o domínio à IA: *"crie um sistema de agentes para \<X\>"*.
2. A IA entrevista você (`references/02`) e monta um `agent-system.spec.json`.
3. Gere o sistema no projeto-alvo (use o **caminho absoluto** do gerador — ele acha os
   próprios templates e roda de qualquer pasta):
   ```bash
   G=~/.claude/skills/agent-factory/generator/factory.mjs
   node "$G" --spec agent-system.spec.json --out /caminho/do/projeto --dry-run   # revisar
   node "$G" --spec agent-system.spec.json --out /caminho/do/projeto             # gerar
   ```
4. **Sem Node?** A IA preenche os `templates/*.tpl` manualmente — mesma saída. O gerador é
   conveniência, não requisito; por isso a fábrica roda em qualquer IA/CLI.

Teste agora mesmo com o exemplo incluído:
```bash
node ~/.claude/skills/agent-factory/generator/factory.mjs \
  --spec ~/.claude/skills/agent-factory/examples/rest-api.spec.json --out /tmp/atlas-demo
```

## Como cada ferramenta carrega o sistema gerado

- **Claude Code** — auto: lê `CLAUDE.md` (importa `@AGENTS.md`), os subagentes em
  `.claude/agents/` e roda o hook `SessionStart`. Vale a partir da próxima sessão.
- **Codex** — auto: lê o `AGENTS.md` da raiz nativamente (garanta `trust_level = "trusted"`
  no `~/.codex/config.toml`).
- **Gemini** — lê `AGENTS.md`/`GEMINI.md` nativamente.
- **Outras** — crie uma ponte fina apontando para `AGENTS.md` (ver `references/03`).

## Onde esta skill vive

Em `~/.claude/skills/agent-factory/`. O Claude Code a carrega automaticamente; para usar no
Codex/Gemini, aponte ou copie a pasta. Auto-contida e portável.
