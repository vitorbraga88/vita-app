# RELATORIO-SKILLS.md — Auditoria e instalação (Etapa 1)

## 1. Auditoria do ambiente — resultado real × bloco `VERIFICADO_HERMES` do prompt

O prompt trazia um bloco "ambiente verificado (medido agora)". Ao medir agora, nesta
sessão, os valores **não batem**. Isso não é erro meu: é o estado real desta máquina,
medido com os mesmos comandos pedidos no item 1.1. Tabela de divergências:

| Item | Prompt afirmava | Medido agora (comando) | Saída |
|---|---|---|---|
| OMP | Não instalado (só servidor-203) | `omp --version; which omp` | `omp/18.14.0` em `~/.local/bin/omp` — **instalado localmente** |
| Claude Code | `/opt/data/node_modules/@anthropic-ai/claude-code`, fora do PATH | `which claude` | `~/.local/bin/claude` — **no PATH** |
| Graphify | Ausente | `which graphify` | `~/.local/bin/graphify` — **instalado** |
| Codex CLI | Ausente | `which codex` | vazio — **confirmado ausente** |
| Node | v22.22.3 | `node -v` | **v20.19.5** |
| npm | 10.9.8 | `npm -v` | **10.8.2** |
| Python | 3.13.5 | `python3 -V` | **3.12.3** |
| git | 2.47.3 | `git --version` | **2.43.0** |
| pip | Ausente, usar uv | `which pip pip3 uv` | `/usr/bin/pip`, `/usr/bin/pip3` presentes; **`uv` não encontrado** |
| MCPs configurados | Nenhum (`claude mcp list` → command not found) | `claude mcp list` | **Funciona**, 2 MCPs conectados: `plugin:ecc:chrome-devtools`, `context7` |
| `/opt/data/skills` | 41 skills | `ls /opt/data/skills` | **diretório não existe** |
| `~/.claude/skills` | 22 skills | `ls ~/.claude/skills \| wc -l` | **66** |
| `~/.pi/skills` | não existe | `ls ~/.pi/skills` | confirmado, não existe |
| `/opt/data/projetos` | pasta a usar, vazia (gym-app novo) | `ls -la /opt/data/projetos` | já existia, continha `avs-adriano-repo` (projeto de terceiro, não tocado) |
| Docker daemon | Inacessível, sem `docker.sock` | `ls -la /var/run/docker.sock; docker ps` | **socket existe, `docker ps` lista 4 containers rodando** (`doceear-admin`, `doceear-label`, `n8n`, `fase-2-bronze-silver-api`) |
| Portas 3000/8080 | Livres | leitura de `/proc/net/tcp` | **ambas ocupadas** (`0.0.0.0:3000`, `0.0.0.0:8080`), junto de ~40 outras portas (5432 Postgres, 8096/2283/7878/8989/9696 prováveis serviços de mídia, 5678 n8n, etc.) |
| Timezone sistema | UTC | `date` | retorna offset `-03` diretamente — sistema já parece usar `America/Recife`, não UTC |
| Playwright Chromium em cache | `chromium-1234`, `chromium_headless_shell-1234` | `ls ~/.cache/ms-playwright/` | **confirmado**, e também `chromium-1228`, `chromium_headless_shell-1228`, `ffmpeg-1011`, `webkit-2359` |

**Decisão tomada:** reportei a divergência ao usuário antes de instalar qualquer
coisa (via `ask`), ele confirmou continuar. Porta de dev trocada de 3000 para
**3900** (livre, confirmada). Caminho do projeto mantido em
`/opt/data/projetos/gym-app` (pasta nova, criada agora, sem conflito com
`avs-adriano-repo`).

## 2. Instalação — lista fechada da Etapa 1.2

Todos os 4 itens existem e as versões batem exatamente com o que o prompt
listou (confirmado via `npm view` antes de instalar):

```
$ npm view next version && npm view tailwindcss version && npm view shadcn version \
  && npm view @playwright/mcp version && npm view figma-developer-mcp version \
  && npm view sharp version && npm view recharts version && npm view motion version \
  && npm view lucide-react version
16.4.3
4.3.3
4.23.0
0.0.83
0.13.2
0.35.5
3.10.1
14.8.0
1.64.0
```

## 3. Testes de prova (saída real colada)

### 3.1 Playwright MCP — lista as tools/flags do servidor

```
$ timeout 40 npx -y @playwright/mcp@0.0.83 --help
Usage: Playwright MCP [options]
Options:
  -V, --version ...
  --headless  run browser in headless mode, headed by default
  --isolated  keep the browser profile in memory, do not save it to disk.
  ... (lista completa de 50+ flags, EXIT=0)
```
Status: ✅ funciona.

### 3.2 Playwright real — abre, navega, tira screenshot (usando cache existente, sem baixar nada)

```
$ node -e "
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage();
await p.setContent('<h1 style=\"color:lime\">ok</h1>');
await p.screenshot({path:'/tmp/pw-smoke.png'});
console.log('titulo:', await p.title(), '| a11y:', await p.locator('h1').innerText());
await b.close();})()"
titulo:  | a11y: ok

$ ls -la /tmp/pw-smoke.png
-rw-rw-r-- 1 vitorbraga vitorbraga 5088 Oct 29 22:35 /tmp/pw-smoke.png

$ ls ~/.cache/ms-playwright/ | grep chrom   # confirma: mesmas pastas de antes, nada novo baixado
chromium-1228
chromium-1234
chromium_headless_shell-1228
chromium_headless_shell-1234
```
Status: ✅ funciona. Usou `chromium-1234` já em cache.

### 3.3 shadcn CLI

```
$ npx shadcn@4.23.0 --version
4.23.0
$ npx shadcn@4.23.0 init -y -d --silent
✔ Writing components.json.
Project initialization completed.
$ npx shadcn@4.23.0 add button input select card tabs sheet sonner skeleton avatar badge label -y
✔ Created 10 files (input, select, card, tabs, sonner, skeleton, avatar, badge, label, sheet)
```
Status: ✅ funciona.

**Correção factual sobre a stack:** o prompt descreve "shadcn/ui 4.23.0 (Radix)".
Na versão 4.23.0 instalada, o estilo padrão (`base-nova`) usa **`@base-ui/react`**
(biblioteca headless da equipe MUI, sucessora conceitual do Radix nos templates
mais novos do shadcn), não `@radix-ui/*`. Confirmado em `package.json`:
`"@base-ui/react": "^1.9.0"`, `npm ls` não lista nenhum pacote `@radix-ui/*`.
Documentado como desvio de escopo (não troquei por engano — é o que o `shadcn add`
realmente instalou).

### 3.4 sharp — converte de fato

```
$ node -e "const s=require('sharp');s({create:{width:8,height:8,channels:3,background:'#b6f53c'}}).png().toFile('/tmp/s.png').then(i=>console.log(i))"
{ format: 'png', width: 8, height: 8, channels: 3, premultiplied: false, hasAlpha: false, size: 95 }
$ ls -la /tmp/s.png
-rw-r--r-- 1 vitorbraga vitorbraga 95 Oct 29 22:33 /tmp/s.png
```
Status: ✅ funciona. (Já vinha como dependência opcional do `next@16.4.3`; fixado
também como devDependency direta `0.35.5` por clareza.)

## 4. Desvios de versão nas dependências de app (não estavam na lista fechada de 4, mas são citadas na seção STACK)

Nenhuma dessas é a "lista fechada de 4" da Etapa 1.2 — são dependências de
runtime/teste da Etapa 2 (STACK). Documentando porque trocaram de versão por
incompatibilidade real com Node 20.19.5 deste ambiente (não 22.x como o prompt
assumia):

| Pacote | Versão pedida/assumida | Problema medido | Versão usada | Prova |
|---|---|---|---|---|
| `better-sqlite3` | `13.0.3` (última, sem pin explícito no prompt) | `engines.node: >=22`; ao rodar em Node 20.19.5: **segfault** (`exit 139`) no `require()` | **`12.11.1`** (`engines.node` inclui `20.x`) | compilado de fonte (sem binário pré-compilado para esta combinação), `node -e "require('better-sqlite3')..."` → `[ { id: 1 } ]` |
| `vitest` | `5.0.5` (não citado no prompt, inferido como "última") | `engines.node: ^22.12.0 \|\| ^24 \|\| >=26`; instalação com `npm install` trava o **Arborist do npm** (`TypeError: Cannot read properties of null (reading 'edgesOut')`, bug conhecido do npm 10.8.2 ao resolver o peer `@vitest/browser-playwright`); mesmo com `--legacy-peer-deps` falta a dependência `vite` | **`4.0.8`** (`engines.node` inclui `^20.0.0`) | `npx vitest run smoke.test.ts` → `1 passed (1)` |
| `@playwright/test` / `playwright` | última (`1.64.1`) | `playwright-core@1.64.1` exige chromium revisão `1248`, **não presente no cache** (`~/.cache/ms-playwright` só tem `1228`/`1234`) — instalar baixaria Chromium de novo, proibido pelo prompt | **`1.62.0`** (chromium revisão `1234`, já em cache) | smoke test do item 3.2 rodou sem nenhum download novo |
| `@axe-core/playwright` | `4.14.0` (confirmado no `npm view`) | `engines.node: >=22.12.0` (warning, não erro) | `4.14.0` mantido — **funciona** apesar do warning | ver item 5 abaixo |

Node 20.19.5 continua compatível com `next@16.4.3` (`engines.node: >=20.9.0`,
confirmado via `npm view next@16.4.3 engines`), então o scaffold principal não
foi afetado.

## 5. Teste real de `@axe-core/playwright` (apesar do `EBADENGINE`)

```
$ node -e "
const {chromium}=require('playwright');
const {AxeBuilder}=require('@axe-core/playwright');
(async()=>{const b=await chromium.launch();const ctx=await b.newContext();const p=await ctx.newPage();
await p.setContent('<html lang=\"pt-BR\"><body><h1>ok</h1><img src=\"x\"></body></html>');
const results=await new AxeBuilder({page:p}).analyze();
console.log('violations:', results.violations.length, results.violations.map(v=>v.id));
await b.close();})()"
violations: 4 [ 'document-title', 'image-alt', 'landmark-one-main', 'region' ]
```
Status: ✅ funciona (apesar do `EBADENGINE`) — detectou 4 violações reais numa
página de teste deliberadamente quebrada.

## 6. Checklist final — tabela obrigatória

| Ferramenta | Origem | Versão | Local de instalação | Finalidade | Status | Pendência |
|---|---|---|---|---|---|---|
| Playwright MCP | npm `@playwright/mcp` | 0.0.83 | `.mcp.json` do projeto (`npx` stdio) | Automação de navegador para o agente | ✅ funciona (saída §3.1) | — |
| Framelink Figma MCP | npm `figma-developer-mcp` (GitHub `GLips/Figma-Context-MCP`) | 0.13.2 | não adicionado ao `.mcp.json` | Ler design do Figma como contexto | ⚠️ não verificado | **Bloqueado**: exige `FIGMA_API_KEY`, ausente neste ambiente. Não solicitado no chat, conforme instrução. `.env.example` criado com o campo vazio |
| shadcn/ui CLI | npm `shadcn` | 4.23.0 | `npx` (gera arquivos em `src/components/ui`) | Componentes acessíveis (Base UI, não Radix — ver §3.3) | ✅ funciona (saída §3.3) | — |
| sharp | npm `sharp` | 0.35.5 | devDependency local | Otimização de imagens | ✅ funciona (saída §3.4) | — |
| Playwright (browsers + test runner) | npm `playwright` / `@playwright/test` | 1.62.0 (chromium rev. 1234, já em cache) | devDependency local | Testes visuais/E2E | ✅ funciona (saída §3.2) | — |
| Vitest | npm `vitest` | 4.0.8 (trocado de 5.0.5, ver §4) | devDependency local | Testes unitários | ✅ funciona (saída §4) | — |
| @axe-core/playwright | npm `@axe-core/playwright` | 4.14.0 | devDependency local | Auditoria de acessibilidade automatizada | ✅ funciona (saída §5) | Warning de engine (`>=22.12.0`), sem impacto funcional observado |
| better-sqlite3 | npm `better-sqlite3` | 12.11.1 (trocado de 13.0.3, ver §4) | dependency local | Persistência SQLite | ✅ funciona (saída §4) | Compilado de fonte (sem binário pré-compilado p/ Node 20 nesta plataforma); build levou ~2min16s |

## 7. O que não foi instalado (conforme Etapa 1.3)

Nenhum item da lista de proibição (`@modelcontextprotocol/server-playwright`,
`figma/mcp-server-guide`, MCP oficial Figma dev mode, "design skills" genéricas,
`npm install -g`, Chromium novo, Oh My Posh, config global) foi tocado. Confirmado:
nenhum `npm install -g` foi executado em nenhum passo acima (todas as instalações
são `devDependency`/`dependency` locais do projeto ou `npx` efêmero).
