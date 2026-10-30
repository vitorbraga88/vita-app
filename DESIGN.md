# DESIGN.md — VITA

Sistema de design do VITA, app de academia premium em dark mode. Este documento é
normativo: qualquer componente novo segue esta anatomia antes de ser codado.

## 1. Identidade

**Direção:** fitness premium, dark mode elegante. Referências de linguagem (não de
layout): Linear (densidade de informação sem ruído), Whoop (números como herói),
Apple Fitness (anéis de progresso, cor única), Hevy (fluxo de treino direto ao
ponto). **O que NÃO é:** dashboard de BI genérico, template shadcn "de fábrica",
"card branco sobre cinza".

**O que torna premium:**
1. Contraste controlado por camadas de superfície, nunca por sombra preta pesada.
2. Tipografia com hierarquia real — no máximo 3 tamanhos por dobra.
3. Espaço em branco generoso — densidade é o erro mais comum.
4. Um único acento de cor (`--accent`, verde-lima) reservado a ação primária e dado-chave.
5. Microinteração discreta: `:active{scale(.98)}`, sem confete, sem exagero.

## 2. Tokens

Arquivo fonte: `src/styles/tokens.css`. Valores exatos abaixo (não arredondar,
não inventar paleta alternativa):

```css
:root {
  --bg-0:#0A0B0F; --bg-1:#12141A; --bg-2:#1A1D26; --bg-3:#232734;
  --fg-0:#F5F7FA; --fg-1:#A0A8B8; --fg-2:#6B7484;
  --accent:#B6F53C; --accent-dim:#8FCC22; --accent-soft:rgba(182,245,60,.12);
  --ok:#34D399; --warn:#FBBF24; --err:#F87171; --info:#38BDF8;
  --border:rgba(255,255,255,.08); --border-strong:rgba(255,255,255,.14);
  --r-sm:10px; --r-md:16px; --r-lg:22px; --r-full:999px;
  --s-1:4px; --s-2:8px; --s-3:12px; --s-4:16px; --s-5:20px; --s-6:24px; --s-8:32px; --s-10:40px;
  --t-cap:12px; --t-fn:15px; --t-body:17px; --t-t3:20px; --t-t2:22px; --t-t1:28px; --t-xl:34px;
  --font:-apple-system,BlinkMacSystemFont,'SF Pro Text',system-ui,sans-serif;
  --font-num:ui-rounded,'SF Pro Rounded',system-ui,sans-serif;
  --ease:cubic-bezier(.32,.72,0,1); --dur:220ms;
}
```

Modo claro (`[data-theme="light"]`) sobrescreve só o grupo de superfícies/texto,
mantendo o mesmo `--accent` — ver seção 6.

**Regras não negociáveis** (replicadas do briefing, valem como checklist de review):
1. Um acento só — máx. ~10% da tela com `--accent`.
2. Números em `--font-num` + `font-variant-numeric: tabular-nums`.
3. Profundidade por camada `--bg-0 → --bg-3` + `--border`; sombra só em overlay.
4. Título de página `--t-t1/600`, seção `--t-t2`, corpo `--t-body`, label `--t-cap` + `letter-spacing:.06em` + `--fg-2`.
5. Padding mínimo de card `--s-5`; container desktop `max-width:1240px`, gutters `--s-8`.
6. Contraste mínimo 4.5:1 (texto normal), 3:1 (texto grande) — medido em `scripts/check-contrast.mjs`.
7. Vidro fosco em topbar/tab bar: `backdrop-filter:blur(24px) saturate(180%)` + `background:rgba(18,20,26,.72)`.
8. `:focus-visible` sempre visível; `:active{transform:scale(.98)}` com `--dur`/`--ease`.
9. Radius consistente: card `--r-lg`, input/botão `--r-md`, chip/avatar `--r-full`.

## 3. Anatomia de componentes

Cada componente define 8 estados: **Default / Hover / Focus / Active / Disabled /
Loading / Empty / Error** (os 3 últimos só quando aplicáveis ao componente).

### Button (primary / ghost / danger)
- **Default:** `primary` = fundo `--accent`, texto `--bg-0`, peso 600, `--r-md`, altura 48px (alvo de toque), padding `0 var(--s-5)`. `ghost` = fundo transparente, borda `--border`, texto `--fg-0`. `danger` = borda `--err`, texto `--err`, fundo transparente.
- **Hover:** `primary` escurece para `--accent-dim`; `ghost`/`danger` ganham `background:var(--bg-2)`.
- **Focus:** anel `2px solid var(--accent)` + `offset 2px`, sempre visível via `:focus-visible`.
- **Active:** `transform:scale(.98)`, `transition: var(--dur) var(--ease)`.
- **Disabled:** opacidade `.4`, `cursor:not-allowed`, sem hover/active.
- **Loading:** spinner inline 16px substitui o label, botão mantém largura (evita layout shift), `aria-busy="true"`.

### Input / Select
- **Default:** fundo `--bg-1`, borda `--border`, `--r-md`, altura 48px, `font-size:16px` (evita zoom iOS), label `--t-cap`/`--fg-2` acima.
- **Hover:** borda `--border-strong`.
- **Focus:** borda `--accent`, anel `--accent-soft` (`box-shadow:0 0 0 3px var(--accent-soft)`).
- **Disabled:** fundo `--bg-0`, texto `--fg-2`, sem interação.
- **Error:** borda `--err`, texto de ajuda abaixo em `--err`, ícone de alerta.

### Card (base para StatCard, WorkoutCard, GoalCard)
- **Default:** fundo `--bg-1`, borda `1px solid var(--border)`, `--r-lg`, padding `--s-5`.
- **Hover (quando clicável):** fundo `--bg-2`, borda `--border-strong`.
- **Focus (quando é link/botão):** anel de acento.
- **Active:** `scale(.98)`.
- **Loading:** `Skeleton` com a mesma silhueta (título + valor + rodapé), nunca spinner central.
- **Empty:** ícone `--fg-2` 32px + 1 linha explicando + ação (botão ghost).
- **Error:** ícone `--err` + mensagem humana + botão "tentar de novo".

### StatCard
Default: label `--t-cap`/`--fg-2` + valor grande `--t-t1`/`--font-num` + variação
(↑/↓ com `--ok`/`--err`) + ícone 20px em `--accent-soft`. Demais estados herdam de Card.

### ProgressRing
SVG `stroke` com trilha `--bg-3` e progresso `--accent` (`stroke-linecap:round`),
número central em `--font-num`. **Loading:** trilha pulsando opacidade `.3↔.6`.
**Empty:** anel em 0%, label "sem dados ainda". Acessível via `role="img"` +
`aria-label="{valor} de {meta}"`.

### BarChart (semanal) / LineChart (evolução)
Recharts, cor única de série (`--accent`), grid `--border` discreto, eixo em
`--fg-2`/`--t-cap`. **Loading:** Skeleton com barras/linha fake em `--bg-2`.
**Empty:** mensagem "ainda sem treinos esta semana" + CTA. Tooltip com fundo
`--bg-2` + borda `--border-strong`.

### WorkoutCard
Default: nome do treino `--t-t3`/600, meta (grupo muscular, nº exercícios)
`--t-fn`/`--fg-1`, CTA "Iniciar" (`Button primary`). **Empty** (sem treino
cadastrado): ícone + "Cadastre seu primeiro treino" + botão.

### SetRow
Linha com nº da série, input de reps, input de carga (`--font-num`), RPE
opcional (select 1–10), checkbox de conclusão (`--accent` quando marcado).
**PR:** badge discreto `--accent-soft` com texto "PR" — nunca confete/animação
exagerada.

### RestTimer
Círculo grande com tempo restante `--font-num`/`--t-xl`, botões ±15s
(`ghost`, 48×48px), pausa/retomar (`primary`). **Limitação documentada:** o
timer usa `setInterval` + `Notification`/beep via `AudioContext`; não dispara
som se a aba estiver em background e o navegador suspender timers — mitigado
recalculando o tempo restante por `Date.now()` ao voltar o foco (`visibilitychange`),
mas o aviso sonoro em si pode atrasar até a aba voltar ao foco. Documentado
também no app (texto de aviso na primeira vez que o timer é usado).

### MacroBar (P/C/G)
Três barras horizontais empilhadas, uma cor por macro usando apenas tons de
`--fg-1`/`--accent` (proteína em `--accent`, carbo/gordura em `--bg-3` com
borda), % preenchido = consumido/meta. **Error (meta ausente):** barra cinza +
link "definir meta".

### GoalCard
`ProgressRing` pequeno + label + valor atual/alvo. **Empty:** "nenhuma meta
definida" + CTA.

### Avatar
Círculo `--r-full`, iniciais em `--font-num` sobre `--bg-3` se sem foto.

### Sheet (bottom sheet / modal)
Overlay `rgba(0,0,0,.6)`, painel `--bg-1`, `--r-lg` no topo, sombra
`0 24px 64px -12px rgba(0,0,0,.6)` (única sombra pesada permitida, por ser
overlay). Fecha com `Esc`, clique fora, ou swipe-down no mobile.

### Toast
Canto inferior (mobile: acima da tab bar), fundo `--bg-2`, borda `--border-strong`,
ícone de status (`--ok`/`--err`/`--info`), auto-dismiss 4s, pausa no hover/foco.

### Skeleton
Retângulos `--bg-2` com shimmer sutil (`background-position` animado,
`--dur` longo ~1.5s), sempre com a MESMA silhueta do conteúdo real.

### EmptyState / ErrorState
Centralizado, ícone 40px `--fg-2`/`--err`, título `--t-t3`, descrição `--t-fn`/`--fg-1`,
ação (`Button`). ErrorState sempre com "Tentar de novo".

### Tabs
Fundo `--bg-1`, indicador ativo = sublinhado `--accent` 2px (não preenchimento
sólido, mantém 1 acento). `:focus-visible` com anel.

### Sidebar (desktop ≥1024px) / TabBar (mobile <768px)
Sidebar: 240px fixa, fundo `--bg-1` + `--border` à direita, item ativo com
barra lateral `--accent` 3px + fundo `--accent-soft`. TabBar: fixa no rodapé,
vidro fosco (regra 7), ícone + label `--t-cap`, item ativo em `--accent`,
`padding-bottom:env(safe-area-inset-bottom)`. Tablet 768–1023px: sidebar
colapsa para só ícones (64px).

## 4. Arquitetura das páginas

```
src/
  app/
    layout.tsx              # shell: Sidebar/TabBar, fontes, tokens.css, lang="pt-BR"
    page.tsx                # Dashboard
    treinos/page.tsx         # lista + editor
    treinos/[id]/page.tsx    # sessão guiada
    treinos/historico/page.tsx
    exercicios/page.tsx
    evolucao/page.tsx
    nutricao/page.tsx
    perfil/page.tsx
  components/
    ui/                     # Button, Input, Card, Skeleton, EmptyState, ErrorState, Tabs, Sheet, Toast, Avatar
    charts/                 # BarChart, LineChart, ProgressRing, MacroBar
    workout/                # WorkoutCard, SetRow, RestTimer
    layout/                 # Sidebar, TabBar, Topbar
  lib/
    db/                     # schema.sql, client.ts, repositories/*.ts, seed.ts
    domain/                 # regras de negócio puras (1rm.ts, streak.ts, macros.ts) — testadas por Vitest
  styles/
    tokens.css
```

Toda tela que busca dado implementa os três estados obrigatórios (loading via
Skeleton de mesma silhueta, empty com CTA, error com retry) — sem isso a tela
não está concluída.

## 5. Processo de iteração do Dashboard (v1 → v3)

Documentado com screenshots em `screenshots/v1-dashboard.png`,
`v2-dashboard.png`, `v3-dashboard.png`. Resumo das mudanças em cada round em
`progresso.md`.

## 6. Modo claro (opcional, toggle em /perfil)

```css
[data-theme="light"] {
  --bg-0:#F7F8FA; --bg-1:#FFFFFF; --bg-2:#F0F2F5; --bg-3:#E5E8ED;
  --fg-0:#14161B; --fg-1:#4A5160; --fg-2:#7A8292;
  --border:rgba(10,11,15,.08); --border-strong:rgba(10,11,15,.14);
}
```
`--accent` permanece igual nos dois modos (identidade da marca). Dark é o
padrão (`<html data-theme="dark">` por default, sem flash — definido no
`layout.tsx` antes da hidratação).
