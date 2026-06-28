#!/usr/bin/env node
// factory.mjs — Gerador agnóstico de sistemas multi-agente portáveis (agent-factory).
// Zero-dependency (Node >= 16). Lê um spec JSON e materializa o ferramental no destino:
// AGENTS.md (fonte única) + pontes por ferramenta (Claude/Gemini/Codex) + subagentes +
// contratos + leis + memórias + hook de arranque (Claude).
//
// Uso:
//   node factory.mjs --spec <spec.json> --out <dir> [--force] [--dry-run]
//
//   --force    sobrescreve arquivos existentes (padrão: pula e avisa)
//   --dry-run  só mostra o que faria, sem escrever

import { readFileSync, writeFileSync, mkdirSync, existsSync, chmodSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const TPL_DIR = join(HERE, '..', 'templates');

// ---------- args ----------
function parseArgs(argv) {
  const a = { force: false, dryRun: false };
  for (let i = 0; i < argv.length; i++) {
    const t = argv[i];
    if (t === '--spec') a.spec = argv[++i];
    else if (t === '--out') a.out = argv[++i];
    else if (t === '--force') a.force = true;
    else if (t === '--dry-run') a.dryRun = true;
    else if (t === '-h' || t === '--help') a.help = true;
  }
  return a;
}

const HELP = `agent-factory — gera um sistema multi-agente portável a partir de um spec.

Uso:
  node factory.mjs --spec <spec.json> --out <dir> [--force] [--dry-run]

Gera no destino:
  AGENTS.md                       fonte única (Codex/Gemini leem nativo)
  CLAUDE.md                       ponte Claude (importa @AGENTS.md)
  GEMINI.md                       ponte Gemini (se 'gemini' em tools)
  .claude/agents/*.md             orquestradora + especialistas (subagentes Claude)
  .claude/settings.json           hook SessionStart (se features.hook)
  .claude/hooks/session-start.sh  injeta identidade + memórias a cada sessão
  .agent-system/laws/*.md         leis de engenharia
  .agent-system/agents/*.md       contratos dos especialistas
  .agent-system/templates/*       templates de memória (PROJECT/USER)
`;

// ---------- helpers ----------
function die(msg) { console.error('✗ ' + msg); process.exit(1); }

function readTpl(rel) {
  const p = join(TPL_DIR, rel);
  if (!existsSync(p)) die(`template ausente: ${rel}`);
  return readFileSync(p, 'utf8');
}

// substitui todos os __KEY__ por vars[KEY]; deixa $ e demais caracteres intactos
function fill(str, vars) {
  let out = str;
  for (const [k, v] of Object.entries(vars)) {
    out = out.split(`__${k}__`).join(v == null ? '' : String(v));
  }
  const left = out.match(/__[A-Z0-9_]+__/g);
  if (left) console.warn(`  ⚠ placeholders não resolvidos: ${[...new Set(left)].join(', ')}`);
  return out;
}

// valor seguro para frontmatter YAML de uma linha
function yamlStr(s) {
  const one = String(s == null ? '' : s).replace(/\s+/g, ' ').trim();
  return '"' + one.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';
}

function slug(s) {
  return String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, "") // remove acentos
    .toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

const written = [];
function emit(out, dryRun, force, rel, content, { exec = false } = {}) {
  const dest = join(out, rel);
  if (existsSync(dest) && !force) { console.warn(`  • pulado (já existe, use --force): ${rel}`); return; }
  if (dryRun) { written.push(rel + ' (dry-run)'); return; }
  mkdirSync(dirname(dest), { recursive: true });
  writeFileSync(dest, content);
  if (exec) chmodSync(dest, 0o755);
  written.push(rel);
}

// ---------- spec ----------
function loadSpec(path) {
  if (!path) die('faltou --spec <spec.json>');
  if (!existsSync(path)) die(`spec não encontrado: ${path}`);
  let spec;
  try { spec = JSON.parse(readFileSync(path, 'utf8')); }
  catch (e) { die(`spec JSON inválido: ${e.message}`); }
  const sys = spec.system || {};
  if (!sys.orchestrator) die('spec.system.orchestrator é obrigatório');
  if (!sys.domain) die('spec.system.domain é obrigatório');
  if (!Array.isArray(spec.specialists) || spec.specialists.length === 0)
    die('spec.specialists deve ter ao menos 1 especialista');
  spec.laws = spec.laws || [];
  spec.tools = (spec.tools && spec.tools.length) ? spec.tools : ['claude', 'codex', 'gemini'];
  spec.features = Object.assign({ memory: true, hook: true, contracts: true, laws: true }, spec.features || {});
  spec.extraReferences = spec.extraReferences || [];
  return spec;
}

// ---------- builders de seções dinâmicas ----------
function specialistsTable(spec) {
  const rows = spec.specialists.map(s =>
    `| **${s.name}** | ${s.role || ''} | \`${s.scope || ''}\` | ${(s.description || '').replace(/\s+/g, ' ').trim()} |`);
  return ['| Agente | Papel | Escopo | Quando acionar |', '|---|---|---|---|', ...rows].join('\n');
}
function lawsList(spec) {
  if (!spec.laws.length) return '_(nenhuma lei formal definida)_';
  return spec.laws.map(l => `### Lei ${l.id} — ${l.name}\n${l.summary || ''}`).join('\n\n');
}
function lawsShort(spec) {
  if (!spec.laws.length) return '_(nenhuma lei formal definida)_';
  return spec.laws.map(l => `- **Lei ${l.id} (${l.name}):** ${l.summary || ''}`).join('\n');
}
function toolsNote(spec) {
  const n = [];
  if (spec.tools.includes('claude')) n.push('- **Claude Code:** lê `CLAUDE.md` (importa `@AGENTS.md`) + subagentes em `.claude/agents/`' + (spec.features.hook ? ' + hook `SessionStart`.' : '.'));
  if (spec.tools.includes('codex')) n.push('- **Codex:** lê o `AGENTS.md` nativamente (sem ponte). Veja `.agent-system/codex-setup.md`.');
  if (spec.tools.includes('gemini')) n.push('- **Gemini:** lê `AGENTS.md` nativo; `GEMINI.md` é fallback que importa a mesma fonte.');
  n.push('- **Outra ferramenta:** crie uma ponte fina que aponte para `AGENTS.md` (guia: references/03 da skill agent-factory).');
  return n.join('\n');
}
function extraRefs(spec) {
  return spec.extraReferences.length ? spec.extraReferences.map(r => `- ${r}`).join('\n') : '';
}
function handoffsBlock(s) {
  if (!Array.isArray(s.handoffs) || !s.handoffs.length) return '_(sem hand-offs definidos)_';
  const rows = s.handoffs.map(h => `| ${h.when || ''} | ${h.to || ''} | ${h.context || ''} |`);
  return ['| Situação | Agente destino | Contexto a passar |', '|---|---|---|', ...rows].join('\n');
}
function checklistBlock(s) {
  const items = (Array.isArray(s.checklist) && s.checklist.length) ? s.checklist : ['Validado contra todas as Leis de Engenharia'];
  return items.map(i => `- [ ] ${i}`).join('\n');
}
function forbiddenBlock(s) {
  const items = Array.isArray(s.forbidden) ? s.forbidden : (s.forbidden ? [s.forbidden] : []);
  return items.length ? items.map(i => `- ${i}`).join('\n') : '- (sem restrições específicas além das Leis)';
}
function forbiddenInline(s) {
  const items = Array.isArray(s.forbidden) ? s.forbidden : (s.forbidden ? [s.forbidden] : []);
  return items.length ? items.join('; ') : 'fora do escopo definido';
}

// ---------- main ----------
function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) { console.log(HELP); return; }
  const spec = loadSpec(args.spec);
  const out = resolve(args.out || '.');
  const sys = spec.system;

  const g = {
    ORCH_NAME: sys.orchestrator,
    ORCH_ROLE: sys.role || 'Arquiteto(a)-chefe',
    ORCH_MISSION: sys.mission || `a orquestradora do sistema para ${sys.domain}.`,
    ORCH_DESCRIPTION: yamlStr(sys.description || `Orquestradora do sistema ${sys.orchestrator}. Use para planejamento, delegação e revisão arquitetural.`),
    DOMAIN: sys.domain,
    WORKSPACE_PATH: sys.workspacePath || out,
    STACK: sys.stack || '(defina o stack)',
    LANGUAGE: sys.language || 'Português brasileiro',
    CREATION_ORDER: sys.creationOrder || spec.specialists.map(s => s.name).join(' → '),
    PROJECT_MEMORY_FILE: sys.projectMemoryFile || 'PROJECT_MEMORY.md',
    USER_MEMORY_FILE: sys.userMemoryFile || 'USER_MEMORY.md',
    SPECIALISTS_TABLE: specialistsTable(spec),
    LAWS_LIST: lawsList(spec),
    LAWS_SHORT: lawsShort(spec),
    TOOLS_NOTE: toolsNote(spec),
    EXTRA_REFERENCES: extraRefs(spec),
  };

  const w = (rel, content, o) => emit(out, args.dryRun, args.force, rel, content, o);

  // 1) AGENTS.md — fonte única (sempre)
  w('AGENTS.md', fill(readTpl('AGENTS.md.tpl'), g));

  // 2) Claude
  if (spec.tools.includes('claude')) {
    w('CLAUDE.md', fill(readTpl('bridges/claude/CLAUDE.md.tpl'), g));
    w(`.claude/agents/${g.ORCH_NAME}.md`, fill(readTpl('agents/orchestrator.claude.md.tpl'), g));
    for (const s of spec.specialists) {
      const sv = Object.assign({}, g, {
        SPEC_NAME: s.name, SPEC_ROLE: s.role || '', SPEC_DESCRIPTION: yamlStr(s.description || ''),
        SPEC_SCOPE: s.scope || '', SPEC_FORBIDDEN: forbiddenInline(s), LEADER: g.ORCH_NAME,
      });
      w(`.claude/agents/${s.name}.md`, fill(readTpl('agents/specialist.claude.md.tpl'), sv));
    }
    if (spec.features.hook) {
      w('.claude/settings.json', fill(readTpl('bridges/claude/settings.json.tpl'), g));
      w('.claude/hooks/session-start.sh', fill(readTpl('bridges/claude/session-start.sh.tpl'), g), { exec: true });
    }
  }

  // 3) Gemini
  if (spec.tools.includes('gemini')) w('GEMINI.md', fill(readTpl('bridges/gemini/GEMINI.md.tpl'), g));

  // 4) Codex
  if (spec.tools.includes('codex')) w('.agent-system/codex-setup.md', fill(readTpl('bridges/codex/SETUP.md.tpl'), g));

  // 5) Leis
  if (spec.features.laws) for (const l of spec.laws) {
    const lv = Object.assign({}, g, { LAW_ID: l.id, LAW_NAME: l.name, LAW_SUMMARY: l.summary || '', LAW_DETAILS: l.details || '' });
    w(`.agent-system/laws/${l.id}-${slug(l.name)}.md`, fill(readTpl('laws/law.md.tpl'), lv));
  }

  // 6) Contratos
  if (spec.features.contracts) for (const s of spec.specialists) {
    const cv = Object.assign({}, g, {
      SPEC_NAME: s.name, SPEC_ROLE: s.role || '', SPEC_DESCRIPTION: yamlStr(s.description || ''), LEADER: g.ORCH_NAME,
      SPEC_PURPOSE: s.purpose || s.description || '', SPEC_SCOPE: s.scope || '',
      SPEC_PRIMITIVES: s.primitives || '(defina os primitivos autorizados)',
      SPEC_FORBIDDEN: forbiddenBlock(s), SPEC_HANDOFFS: handoffsBlock(s), SPEC_CHECKLIST: checklistBlock(s),
    });
    w(`.agent-system/agents/${s.name}.md`, fill(readTpl('agents/contract.md.tpl'), cv));
  }

  // 7) Memória (templates)
  if (spec.features.memory) {
    w('.agent-system/templates/' + g.PROJECT_MEMORY_FILE, fill(readTpl('memory/PROJECT_MEMORY.md.tpl'), g));
    w('.agent-system/templates/' + g.USER_MEMORY_FILE, fill(readTpl('memory/USER_MEMORY.md.tpl'), g));
  }

  // relatório
  console.log(`\n✓ ${sys.orchestrator}: ${written.length} arquivo(s) ${args.dryRun ? '(dry-run) ' : ''}gerado(s) em ${out}`);
  for (const f of written) console.log('  + ' + f);
  console.log(`\nFerramentas: ${spec.tools.join(', ')}`);
  if (spec.tools.includes('claude') && spec.features.hook)
    console.log('Claude: o hook SessionStart vale a partir da PRÓXIMA sessão (ou após abrir /hooks).');
}

main();
