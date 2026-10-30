# VITA — app de academia

App pessoal de academia: treinos, evolução física e nutrição em um só lugar.
Dark mode premium, SQLite local, zero infraestrutura externa.

## Stack

Next.js 16.4.3 (App Router) · TypeScript · Tailwind CSS 4.3.3 · shadcn/ui
4.23.0 (Base UI) · Recharts 3.10.1 · motion 14.8.0 · SQLite via
better-sqlite3 12.11.1 · Vitest 4.0.8 · Playwright 1.62.0

Por que essas versões (algumas diferem do que foi pedido) e por que SQLite em
vez de Postgres: ver `plan.md` e `RELATORIO-SKILLS.md`.

## Como rodar

```bash
cd /opt/data/projetos/gym-app
npm install
cp .env.example .env        # preencher FIGMA_API_KEY só se for usar o MCP do Figma (opcional)
npm run seed                 # popula o banco com 12 semanas de dados coerentes
npm run dev                  # http://localhost:3900
```

Porta **3900**, não 3000 — a 3000 já estava em uso por outro serviço neste
ambiente (ver `RELATORIO-SKILLS.md`, seção de auditoria).

## Scripts

| Comando | O que faz |
|---|---|
| `npm run dev` | servidor de desenvolvimento, porta 3900 |
| `npm run build` | build de produção |
| `npm run start` | serve o build, porta 3900 |
| `npm run seed` | recria o banco e reaplica o catálogo local de mídia de exercícios |
| `npm run test` | testes unitários (Vitest) — regras de negócio em `src/lib/domain/` |
| `npm run test:e2e` | testes end-to-end (Playwright) |
| `node scripts/aplicar-midia.mjs` | migration aditiva e idempotente do catálogo de mídia |
| `node scripts/verificar-midia.mjs` | verifica dimensões e reprodução local dos assets |
| `npm run lint` | ESLint |
| `node scripts/check-contrast.mjs` | razão de contraste WCAG de cada par texto/fundo dos tokens |

## Estrutura

Ver `plan.md` para a árvore completa e as decisões de arquitetura. Resumo:
`src/app/` (rotas), `src/components/{ui,charts,workout,layout}/` (componentes),
`src/lib/db/` (schema + repositórios — único lugar que fala SQL),
`src/lib/domain/` (regras de negócio puras, testadas), `src/styles/tokens.css`
(design tokens, ver `DESIGN.md`).

## Dados

Banco em `data/vita.db` (SQLite, fora do git — `.gitignore`). `npm run seed`
recria do zero: 1 usuário, 33 exercícios, 3 treinos (Push/Pull/Legs), 12
semanas de sessões com progressão de carga plausível, histórico de peso e
medidas, 20 alimentos, uma semana de refeições e o catálogo de mídia local.

### Mídia de exercícios

`data/mapa-midia.json` é o mapa curado entre os 33 exercícios da VITA e o
catálogo [openGym](https://github.com/DuarteSantos8/openGym). O seed baixa uma
vez e serve localmente 32 thumbnails WebP e 32 clipes MP4; a Cadeira abdutora
permanece propositalmente sem arquivo para exercitar o fallback desenhado.
O app não busca mídia em runtime. Os arquivos vêm da fonte com seus próprios
termos de licença; mantenha este uso pessoal e privado, sem redistribuí-los.

## Documentos da entrega

- `RELATORIO-SKILLS.md` — auditoria do ambiente e instalação das ferramentas (Etapa 1)
- `DESIGN.md` — identidade visual, tokens, anatomia de componentes
- `plan.md` — arquitetura e decisões técnicas
- `progresso.md` — o que está concluído, pendente e bloqueado, sem maquiagem
