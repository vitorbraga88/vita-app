# PROGRESS — VITA (gym app)

Atualizado a cada bloco concluído. Ver `progresso.md` na raiz para o status final
de entrega (funcionalidades concluídas × pendentes × bloqueadas).

## 2026-10-29

- Auditoria do ambiente real executada (Etapa 1.1). Resultado diverge do bloco
  `VERIFICADO_HERMES` do prompt original em vários pontos (OMP instalado, Docker
  disponível, portas 3000/8080 ocupadas, contagem de skills diferente, versões de
  Node/Python/git diferentes). Reportado ao usuário e confirmado: seguir mesmo
  assim, porta de dev trocada para **3900**.
- Projeto criado em `/opt/data/projetos/gym-app`, `git init` feito.
- `.gitignore`, `.env.example` criados.
- Scaffold Next.js 16.4.3 + TypeScript + Tailwind 4.3.3 + App Router + `src/`
  gerado via `create-next-app@16.4.3` (confirmado instalado: `npm ls next
  tailwindcss`).
- `@playwright/mcp@0.0.83` testado via `npx --help` — funciona (lista todas as
  flags do servidor).
- `shadcn@4.23.0` testado via `--version` — responde `4.23.0`.
- Dependências de runtime instaladas e fixadas: `recharts@3.10.1`,
  `motion@14.8.0`, `lucide-react@1.64.0`.
- `better-sqlite3@13.0.3` (conforme citado no prompt de stack, sem versão
  travada) **falhou**: binário nativo exige Node >=22, neste ambiente há Node
  20.19.5 → segfault (exit 139) ao `require()`. Trocado para
  `better-sqlite3@12.11.1`, que declara suporte explícito a `20.x` — ver
  `RELATORIO-SKILLS.md` para o desvio documentado.

## 2026-10-30

- Design system implementado (tokens.css, 15 componentes base retemados do
  shadcn/Base UI) + Dashboard construído e iterado 3× (v1→v2→v3) com bugs reais
  corrigidos a cada rodada (console, contraste WCAG, fuso horário, cross-tema).
- 7 módulos restantes (`/treinos`, `/treinos/[id]`, `/treinos/historico`,
  `/exercicios`, `/evolucao`, `/nutricao`, `/perfil`) construídos em paralelo por
  4 subagentes com contratos compartilhados (design system + repositórios já
  prontos); integrados, revisados e commitados por mim.
- Etapa 4 completa: contraste medido (script), axe-core (0 violações em 8
  rotas), Vitest (20/20), Playwright E2E (3/3 fluxos), `npm run build` (bug real
  de rotas estáticas encontrado e corrigido), Lighthouse real (Dashboard LCP
  1.9s, Performance 82).
- Status final detalhado, com pendências reais sem maquiagem, em `progresso.md`.

- Fase 1 de mídia ampliada para catálogo curado de 132 exercícios em
  `data/mapa-midia.json`: todos têm identidade OpenGym única, still WebP, clip
  MP4 e metadados/instruções pt-BR. O mapa continua sendo a fonte auditável.
- A importação explícita `VITA_CATALOGO_APLICAR=1 npm run importar:catalogo`
  cria backup datado, faz migração aditiva e idempotente em `data/vita.db` e
  preserva `795` séries, `36` sessões, `28` pesagens e `1` usuário.
- Produção conferida: 132 exercícios, 132 stills e 132 clips; `integrity_check`
  retornou `ok`. A segunda execução inseriu e enriqueceu zero registros.
- Biblioteca, editor de treino e sessão guiada exibem thumbnails/clip; o sheet
  mostra metadados e passos em pt-BR. A captura
  `desktop-exercicios-catalogo-132.png` confirma o exercício novo em produção.
- Verificação pós-importação: Vitest 32/32, Playwright 7/7 e build de produção
  aprovados. Os assets novos retornam `200 image/webp` e `200 video/mp4`.

- Correções pós-auditoria da Fase 2 (detalhe e provas em `RELATORIO-SKILLS.md` §9):
  Node único (`/usr/local/bin/node` v22.12.0, ABI 127) documentado em `DEPLOY.md` com
  `prestart` que recusa subir com `better-sqlite3` de outro ABI; os 33 exercícios do
  dono voltaram a `sistema=0` (33/99/132) e o enriquecimento de mídia não muda mais o
  dono; `/treinos/[id]` deixou de criar sessão no GET (sessão 38 vazia removida com
  backup, referência 795/36/28/1/132 restaurada).

- Fase 3 — `/ajustes`: 10 seções persistidas em `configuracao` (58 chaves, default
  central, horários `-03:00`), migração aditiva com backup em produção (795/36/28/1/132
  intactos). Aparência saiu do localStorage (`next-themes` removido) para o banco,
  aplicada no `<html>` pelo servidor. `/perfil` → 308 `/ajustes`.
- Corrigidos no caminho: escala tipográfica (Tailwind lia as classes como cor), overflow
  mobile, violação WCAG 2.5.3 nos chips, falha de rede derrubando a seção, e E2E migrado
  do `next dev` (perde locks do SQLite após Server Action) para build de produção.
- Verificação: Vitest 61/61 (16 arquivos), Playwright 15/15 em 3 execuções seguidas,
  axe 0 violações com seções abertas, build de produção e provas a–i em `RELATORIO-SKILLS.md` §10.

- Fase 4A entregue para validação: migração aditiva com backup
  `data/vita.db.bak-2026-10-30T14-57-42-924Z-pre-fase4a`; contagens protegidas
  795/36/28/1/132 e configurações inalteradas. Água, suplementos, gráfico de média
  móvel e agendador de avisos no app implementados; ntfy/Web Push ficam para a
  Parte 2. Detalhes e evidências em `RELATORIO-FASE4A.md`.
- Verificação: Vitest 79/79, Playwright 18/18, build de produção; axe sem violações
  nas três rotas em 1440/390 px. Prova de idempotência e console no relatório.

- Fase 4B: corrigidos o default da meta automática de água e os rótulos de
  recálculo histórico; implementados progressão, plano alimentar, `/hoje` e
  envio ntfy. Produção preservada: 795/36/28/1/132, quatro configurações
  anteriores e `integrity_check=ok`. Backup e evidências em `RELATORIO-FASE4B.md`.
- Verificação: Vitest 100/100, progressão 5/5, Playwright 21/21, build e
  rotas de produção verificadas. ntfy na porta 8185 não estava disponível:
  entrega real não exercitada; Web Push indisponível. A Fase 5 aguarda validação.
- Correção da progressão (reprovada na validação): séries abaixo do alvo agora só
  sugerem +1 série; aumento exige todas as séries executadas no topo (≥2 séries);
  deload só com série abaixo do piso, na mesma carga, por N sessões seguidas.
  1RM exibido com a conta da melhor série da última sessão. Push: 6/6 em MANTER,
  nenhum deload. Vitest 102/102 (progressao 7/7), Playwright 21/21.

- Fase 5 — Amazfit T-Rex 3 (opções A e B aprovadas): migração aditiva com backup
  `data/vita.db.bak-2026-10-30T19-37-20-369Z-pre-fase5` (795/36/28/1/132 e configurações
  intactos); API `/api/relogio/{pacote,series}` com token, lote offline idempotente;
  pareamento em `/ajustes`; treino sai do ntfy quando o relógio está pareado; mini-app
  Zepp OS em `relogio/` (`zeus build` sem login). Prova de contrato com o código do
  mini-app contra o servidor real achou e corrigiu um defeito (sessão nunca saía da fila).
- Verificação: Vitest 115/115 (28 arquivos) + mini-app 58/58 (7 arquivos), Playwright
  22/22, axe 0 violações em 1440/390 px. Não exercitado: relógio real e ntfy real.
  Detalhes em `RELATORIO-FASE5.md`.
