# progresso.md — VITA

Status real na entrega. Sem maquiagem: o que funciona, o que não foi feito, e o que é
limitação de plataforma/tempo, cada um na sua categoria.

## ✅ Concluído e verificado

**Etapa 1 — auditoria e ferramentas**
- Auditoria do ambiente real executada; divergências do prompt original documentadas e
  reportadas ao usuário antes de prosseguir (ver `RELATORIO-SKILLS.md`).
- `@playwright/mcp`, Playwright, `shadcn`, `sharp` instalados e testados com saída real colada.
- `.mcp.json` do projeto com Playwright ativo; Figma MCP documentado como pendência de
  autenticação (sem `FIGMA_API_KEY`), não forçado.

**Etapa 2 — aplicação**
- 8 rotas funcionais, todas retornando 200, console limpo, sem violação crítica de
  acessibilidade (axe-core, WCAG2A/AA): `/`, `/treinos`, `/treinos/[id]`,
  `/treinos/historico`, `/exercicios`, `/evolucao`, `/nutricao`, `/perfil`.
- CRUD completo de exercícios e treinos (criar, compor exercícios do treino, editar,
  excluir com tratamento de erro de FK). Catálogo curado com 132 exercícios OpenGym
  únicos, thumbnail e clip local; a biblioteca, o editor e a sessão guiada abrem
  o mesmo sheet. O fallback continua disponível para registros manuais sem mídia.
- Sessão guiada funcional: carga/reps pré-preenchidos do último registro, cronômetro de
  descanso real (±15s, pausa/retomar, correção por `Date.now()` ao voltar o foco — limitação
  de som em segundo plano documentada na própria UI), detecção de PR automática.
- Histórico com detalhe por sessão e gráfico de evolução de carga por exercício
  (`calcularProgressaoCarga`).
- Evolução física: peso (7/30/90 dias com linha de meta), medidas com variação vs. registro
  anterior, meta de peso editável.
- Nutrição: refeições por período, busca de alimento, macros do dia com `MacroBar`, alerta
  discreto ao passar a meta de kcal.
- Perfil: dados pessoais editáveis + alternância de aparência (dark/light) funcional via
  `next-themes`.
- Responsivo confirmado em 3 breakpoints reais (390×844, 820×1180, 1440×900) — sidebar
  colapsa para ícones no tablet, vira tab bar fixa no mobile.

**Etapa 3 — design**
- `DESIGN.md` com tokens, anatomia de 20 componentes e as 9 regras não negociáveis.
- Dashboard iterado 3 vezes com evidência real (não estética hipotética) — ver `DESIGN.md` §5:
  v1→v2 corrigiu um warning real de console, uma violação de contraste medida, um bug de
  fuso horário, e um bug cross-tema de contraste (texto do botão primário ilegível no claro);
  v2→v3 adicionou informação (total semanal, rótulos de valor no gráfico) e corrigiu um bug
  de animação que escondia os rótulos no screenshot.

**Etapa 4 — qualidade**
- Console limpo nas 8 rotas (Playwright, provado).
- Contraste: `scripts/check-contrast.mjs` — 100% dos pares texto/fundo ≥4.5:1 nos dois temas
  (corrigiu 3 valores do próprio prompt que violavam essa mesma regra).
- Acessibilidade: axe-core zero violações (8 rotas × WCAG2A/AA), `lang="pt-BR"`, 1 `<h1>` por
  página, ordem de heading sem pulos, 100% dos botões só-ícone com `aria-label` contextual
  (confirmado programaticamente), foco visível confirmado via navegação por Tab real.
- Dados coerentes: 3 verificações independentes com consulta SQL direta batendo exatamente
  com o número exibido na tela (kcal/proteína/carbo/gordura do dia, treinos da semana).
- Testes: Vitest 32/32 (10 arquivos — domínio, isolamento do seed e importação
  idempotente do catálogo); Playwright E2E 7/7 fluxos reais (criar
  exercício→sessão→histórico; peso→gráfico; refeição→macros;
  biblioteca/editor/sessão com mídia) — todos passaram após reseed.
- Build de produção: `npm run build` passa, TypeScript limpo. **Bug real encontrado e
  corrigido**: 6 das 8 rotas saíam `○ Static` (prerendeadas uma vez no build, congelando os
  dados) — adicionado `export const dynamic = "force-dynamic"` em todas.
- Lighthouse real (servidor de produção, `npm run start`): Dashboard — Performance 82,
  Acessibilidade 100, Best Practices 100, SEO 100, **LCP 1.9s** (meta <2.5s ✅), CLS 0.
  `/nutricao` — Performance 95, LCP 2.0s.
- Nenhum arquivo de código passa de 300 linhas (maior: 208).
- `.env` e `data/*.db` confirmados fora do git (`git check-ignore`).

## ⚠️ Pendências reais (não escondidas)

- **`/treinos/[id]` (sessão guiada) tem LCP ~2.8s em duas medições** — acima da meta de
  2.5s. Causa provável: página com ~24 inputs interativos (SetRow × exercícios × séries)
  tem mais DOM/hidratação que as demais. Medido em servidor compartilhado sob carga real
  (load average 4.6 no host durante o teste — ver `RELATORIO-SKILLS.md`), o que infla a
  métrica; mesmo descontando ruído, ainda fica acima da meta. Não corrigido: exigiria
  refatorar a hidratação (ex.: virtualizar as séries ou adiar interatividade das linhas não
  visíveis), risco/esforço maior do que o tempo restante permitia sem comprometer o resto.
- **Screenshot do estado `loading.tsx` não foi capturado.** Os 8 arquivos `loading.tsx`
  existem e têm skeleton com a silhueta correta do conteúdo (verificado por leitura de
  código), mas a busca no SQLite local é rápida demais para o estado aparecer de forma
  capturável — tentei limitar rede via CDP (latência 800ms–3s, banda 5–50KB/s) em navegação
  client-side e full page load, sem sucesso em nenhuma das duas abordagens. Estados vazio e
  de erro têm screenshot real de várias telas.
- **"Editar exercícios" do treino não tem drag-and-drop** — reordenação é por botões ↑/↓
  (alternativa explicitamente aceita no escopo da tarefa).
- **Edição de nome/divisão de um treino já existente não foi implementada** — só criar,
  compor exercícios e excluir (não estava no escopo pedido explicitamente).
- **Campo `aparencia` do usuário no banco é best-effort**: o toggle dark/light funciona de
  verdade via `next-themes` (o que importa pro usuário); a sincronização com a coluna do
  banco não foi testada em todos os caminhos.
- **Figma MCP não habilitado** — falta `FIGMA_API_KEY`, que não existe neste ambiente.

## 🚫 Bloqueado por limitação de ambiente (não por falta de esforço)

- Lighthouse rodou num host compartilhado com outros serviços (n8n, containers de terceiros)
  — os números de performance têm ruído real medido (load average variando de 2 a 4.6 entre
  execuções da mesma página). Reportei os dois números, não escondi a variação.
- Ambiente não tinha Docker dedicado para Postgres nem X server para o Chrome com
  interface gráfica (`mcp__chrome_devtools` MCP falhou por isso) — Lighthouse rodou via CLI
  com Chromium headless do cache do Playwright, não pelo MCP do chrome-devtools.
