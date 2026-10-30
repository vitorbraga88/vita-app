# DEPLOY — VITA

Servidor de produção: `next start` na porta **3900**, banco `data/vita.db`.

## 1. Um único Node para tudo

O host tem vários binários Node no PATH (medido em 2026-10-30):

| Binário | Versão | `NODE_MODULE_VERSION` |
|---|---|---|
| `/usr/local/bin/node` | v22.12.0 | 127 — **runtime da produção** |
| `~/.local/node20/bin/node` | v20.19.5 | 115 |
| `~/.nvm/versions/node/v20.20.2/bin/node` | v20.20.2 | 115 |
| `/usr/bin/node` | v18.19.1 | 109 |

`better-sqlite3` é um módulo nativo: o `.node` compilado só carrega no Node com o mesmo
`NODE_MODULE_VERSION`. Compilar com um Node e rodar com outro faz `next start` subir,
servir as rotas estáticas e devolver **500 em toda rota que usa o banco**
(`ERR_DLOPEN_FAILED`). Foi o que aconteceu na entrega da Fase 2.

Por isso **todo** comando do projeto (install, build, test, seed, start) roda com o Node
de produção. `package.json` declara `"engines": { "node": "22.12.x" }`.

```bash
export PATH=/usr/local/bin:$PATH
hash -r
node -v                      # v22.12.0
node -p process.versions.modules   # 127
```

## 2. Depois de qualquer troca de versão do Node

```bash
cd /opt/data/projetos/gym-app
export PATH=/usr/local/bin:$PATH
npm rebuild better-sqlite3
node scripts/verificar-runtime.mjs   # deve imprimir "runtime ok ... 127"
```

`npm run start` executa `scripts/verificar-runtime.mjs` antes (`prestart`). Se o módulo
nativo não carregar, o start **falha** com a instrução de rebuild em vez de subir um
servidor que só responde 500.

## 3. Build e start persistente

```bash
cd /opt/data/projetos/gym-app
export PATH=/usr/local/bin:$PATH
npm run build
setsid nohup npm run start > /tmp/prod-server.log 2>&1 < /dev/null &
```

`nohup` sozinho não basta: o processo continua no grupo da sessão SSH e morre quando ela
fecha. `setsid` cria uma sessão nova, desacoplada do terminal.

Para parar antes de um novo start, encontre o dono da porta 3900 (o container não tem
`ss`/`lsof`; use `/proc/net/tcp*` → inode → `/proc/<pid>/fd`) e encerre o grupo
`npm run start` → `next-server`.

## 4. Verificação obrigatória — no momento do relatório

Não se relata HTTP 200 sem `curl` executado naquele momento:

```bash
for r in / /treinos /treinos/historico /exercicios /evolucao /nutricao /perfil /ajustes; do
  printf '%s ' "$r"; curl -s -o /dev/null -w '%{http_code}\n' "http://localhost:3900$r"
done
```

Rotas com banco (`/exercicios`, `/treinos`) precisam responder 200; um 500 nelas com 200
em rotas estáticas é o sintoma clássico de ABI errado (seção 1).

## 5. Dados de produção

- `npm run seed` e os E2E nunca tocam `data/vita.db` (usam `vita.dev.db` / `vita.e2e.db`).
- Qualquer escrita manual em `data/vita.db` começa por backup consistente com a API do
  SQLite (`db.backup(...)`), que funciona com o servidor no ar (WAL).
- Abrir `/treinos/[id]` não grava nada; a sessão só nasce quando a primeira série é
  registrada.
