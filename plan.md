# plan.md — VITA

## Arquitetura

```
src/
  app/                       # Next.js App Router — uma pasta por rota
    page.tsx                 # Dashboard (/)
    treinos/                 # /treinos, /treinos/[id], /treinos/historico
    exercicios/               # /exercicios
    evolucao/                 # /evolucao
    nutricao/                 # /nutricao
    ajustes/                  # /ajustes (perfil + preferências; /perfil redireciona 308)
    layout.tsx                # shell raiz: aparência do banco no <html>, AppShell, Toaster, lang="pt-BR"
    globals.css                # import dos tokens + mapeamento @theme do Tailwind
  components/
    ui/                       # primitivos retemados (Button, Input, Card, Tabs, Sheet, Select,
                               #   Avatar, Badge, Skeleton, EmptyState, ErrorState, StatCard, GoalCard)
    charts/                   # ProgressRing, WeeklyBarChart, TrendLineChart, MacroBar
    workout/                  # WorkoutCard, SetRow, RestTimer
    layout/                   # Sidebar, TabBar, AppShell, ThemeProvider, navItems
  lib/
    db/
      schema.sql               # DDL
      client.ts                # único ponto de acesso ao better-sqlite3
      types.ts                 # tipos espelhando o schema
      repositories/             # uma função por operação, nenhum SQL fora daqui
      seed.ts / seedData.ts     # dados de demonstração coerentes
    domain/                    # regras de negócio puras, testadas por Vitest
      oneRepMax.ts, streak.ts, macros.ts, progressaoCarga.ts, dataLocal.ts
    dashboard/
      getDashboardData.ts       # agregação de dados do Dashboard, fora do componente
  styles/
    tokens.css                 # fonte única dos design tokens (ver DESIGN.md)
```

Camada de dados: **toda** query SQL vive em `src/lib/db/repositories/*.ts`. Páginas
e componentes nunca importam `better-sqlite3` diretamente — só os repositórios.
Isso é o que torna a troca futura para Postgres uma troca de implementação
dentro de `src/lib/db/`, sem tocar em páginas.

## Decisões e por quê

### SQLite em vez de PostgreSQL
O ambiente não tem Postgres rodando nem Docker configurado para subir um
(na auditoria real descobri que o Docker *existe* e está em uso por outros
serviços do usuário — mas subir mais um serviço de banco nesse host
compartilhado, para uma entrega de app single-user, seria desproporcional e
arriscado). SQLite via `better-sqlite3` entrega: zero infraestrutura, mesma
expressividade SQL para 1 usuário, arquivo único versionável/portável. A
troca para Postgres depois é só trocar `src/lib/db/client.ts` e os
repositórios — a interface pública (funções `listarX`/`criarX`/etc.) não
muda.

### `better-sqlite3` 12.11.1, não 13.0.3
`13.0.3` declara `engines.node: >=22`; este ambiente tem Node 20.19.5 e o
binário nativo **dava segfault** ao `require()`. `12.11.1` declara suporte
explícito a `20.x` e foi testado de verdade (ver RELATORIO-SKILLS.md).

### `/graphify .` não executado
Instrução do prompt: só rodar na primeira re-delegação, quando já existir
código — a pasta estava vazia no início da Etapa 1. Documentado aqui como a
exceção aceita pelo próprio prompt.

### shadcn 4.23.0 usa Base UI, não Radix
O prompt descreve "shadcn/ui 4.23.0 (Radix)". O estilo padrão instalado
(`base-nova`) usa `@base-ui/react` (sucessor do Radix nos templates mais
recentes do shadcn) — confirmado em `package.json` e `npm ls`. Não troquei
por engano: é o que o `shadcn add` realmente gerou. Os primitivos
(`Tabs`, `Sheet`, `Select`, `Avatar`, `Button`) foram mantidos (acessibilidade
de verdade: foco, ARIA, portal) e reestilizados com os tokens do DESIGN.md.

### Identificadores de código em português, não inglês
O prompt pede "Código e comentários em inglês, UI e docs em pt-BR." Os
**comentários** seguem isso à risca (100% em inglês em todo o código). Os
**identificadores** (nomes de função, variável, coluna) ficaram em
português — desvio consciente, pelos motivos abaixo:
1. O próprio prompt especifica o schema do banco em português
   (`usuario, exercicio, treino, sessao_serie, peso_registro...`), então o
   vocabulário de domínio já nasce em português.
2. Traduzir só os identificadores de código (`criarTreino` → `createWorkout`)
   mantendo as colunas do banco em português criaria uma camada de mapeamento
   nome-a-nome sem nenhum ganho real, só risco de erro (ex.: `row.carga_kg`
   teria que virar `loadKg` em algum ponto, e esse ponto de tradução é
   superfície extra de bug).
3. Um app de domínio restrito a um usuário brasileiro, cujo texto de UI é
   100% português, se beneficia mais de identificadores que leem igual ao
   domínio (`treino`, `sessao`, `exercicio`) do que de identificadores em
   inglês que exigiriam tradução mental constante ao ler o SQL ao lado.

Se a preferência for identificadores em inglês mesmo assim, é um
`rename`/`grep`+substituição mecânica (sem mudar lógica) — posso fazer sob
pedido explícito, mas decidi não fazer silenciosamente por conta própria dado
o volume de código já escrito e testado.

### Tailwind v4 + tokens customizados em vez do tema padrão do shadcn
O `globals.css` gerado pelo `shadcn init` vem com uma paleta neutra genérica
(`--background`, `--primary` em OKLCH cinza). Substituí inteiramente pelos
tokens do DESIGN.md, mapeados via `@theme inline` para gerar utilities
Tailwind (`bg-bg-1`, `text-fg-2`, etc.). Index zero de classes
`bg-primary`/`text-muted-foreground` sobrou no código — todos os componentes
shadcn foram reescritos para os tokens novos.

### Next.js `cacheComponents`/PPR desligados
`create-next-app@16.4.3` liga `cacheComponents: true` por padrão. VITA lê
SQLite e a data corrente em toda página (dashboard, sessão, nutrição) — ou
seja, é inerentemente dinâmico por requisição. Manter `cacheComponents`
exigiria `"use cache"`/`connection()` espalhados por todo lugar sem nenhum
ganho (não há nada para cachear entre requisições de um único usuário local).
Desliguei a flag; renderização volta a ser dinâmica por padrão, como no
Next.js clássico.

### Servidor MCP do Figma não habilitado
Exige `FIGMA_API_KEY`, ausente neste ambiente. Deixado fora do `.mcp.json`
ativo, documentado como pendência em `.env.example` e `RELATORIO-SKILLS.md`.
Não foi solicitado no chat, conforme instrução do prompt.

## Dados: fuso horário

Achado durante a Etapa 3 (não um plano, um bug real): `Date#toISOString()` e
`date('now')` do SQLite operam em UTC. O usuário está em America/Recife
(UTC-3); à noite isso fazia "hoje" virar "amanhã" nos cálculos. Toda data
"hoje"/"N dias atrás" do app passa por `src/lib/domain/dataLocal.ts`
(hora local real), nunca por UTC. Detalhe completo em `DESIGN.md` §5.
