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

- Fase 1 de mídia concluída: catálogo curado de 33 exercícios em
  `data/mapa-midia.json`; 32 thumbnails WebP e 32 clipes MP4 do openGym servidos
  localmente em `public/midia/`; a Cadeira abdutora fica sem mídia
  intencionalmente para validar o fallback.
- Migration aditiva e idempotente em `scripts/aplicar-midia.mjs`, aplicada por
  `npm run seed` depois de cada recriação do SQLite. Assim o seed não volta a
  apagar a mídia — regressão descoberta e corrigida durante a verificação.
- Biblioteca, editor de treino e sessão guiada exibem thumbnails/clip; o sheet
  da biblioteca mostra vídeo em loop, passos em pt-BR e tags de catálogo.
- Verificação da fase: Vitest 26/26, Playwright 6/6 após reseed, build de
  produção aprovado; os 8 caminhos retornaram HTTP 200 pelo `next start`.

- A miniatura na sessão guiada agora é um controle acessível que abre o mesmo
  sheet de demonstração da biblioteca; o usuário não perde o contexto das
  séries. Evidência: `desktop-treino-sessao-midia.png`, vídeo local 180×180
  decodificado e console sem mensagens.
- Fallback de `Cadeira abdutora` conferido na aplicação de produção e registrado
  em `desktop-exercicios-fallback-cadeira-abdutora.png`; os sete fluxos E2E e os
  29 testes unitários passaram após a alteração.
