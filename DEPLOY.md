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

`npm run start`, `npm run dev` e `npm run start:e2e` executam `scripts/verificar-runtime.mjs`
antes (`prestart`/`predev`/`prestart:e2e`). Se o módulo nativo não carregar, o comando
**falha** com a instrução de rebuild em vez de subir um servidor que só responde 500.

Atenção: shells novos (serviços em background, terminais de ferramentas) herdam o PATH
padrão do usuário, cujo primeiro `node` é o v20. Exporte o PATH de produção em todo shell
novo antes de qualquer `npm`.

## 3. Build e start persistente

```bash
cd /opt/data/projetos/gym-app
export PATH=/usr/local/bin:$PATH
npm run build
setsid nohup npm run start > /tmp/prod-server.log 2>&1 < /dev/null &
```

`nohup` sozinho não basta: o processo continua no grupo da sessão SSH e morre quando ela
fecha. `setsid` cria uma sessão nova, desacoplada do terminal.

Para trocar o build em produção use o script, que acha o dono da porta 3900 via
`/proc/net/tcp*` (o container não tem `ss`/`lsof`), encerra o grupo `npm run start` →
`next-server`, valida o runtime, sobe com `setsid nohup` e espera `/exercicios` → 200:

```bash
npm run build && scripts/reiniciar-producao.sh
```

## 4. Verificação obrigatória — no momento do relatório

Não se relata HTTP 200 sem `curl` executado naquele momento:

```bash
for r in / /treinos /treinos/historico /exercicios /evolucao /nutricao /ajustes; do
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
- Mudanças de schema são aditivas e aplicadas com backup:
  `node scripts/migrar-configuracao.mjs` (backup → `schema.sql`, que só tem
  `CREATE … IF NOT EXISTS` → confere 795/36/28/1/132 e `integrity_check`). Idempotente.

## 6. `next dev` e o SQLite: não grave no banco por fora com o dev rodando

Medido em 2026-10-30 via `/proc/locks`: o `next dev` (Turbopack) **perde os locks POSIX do
SQLite após a primeira Server Action**; o `next start` mantém. Sem esses locks, uma conexão
de escrita aberta por outro processo (script, `sqlite3`, teste), ao fechar, se acha a última,
faz checkpoint e **apaga o `-wal`** — o servidor de dev passa a gravar num WAL órfão e as
gravações seguintes somem. Por isso:

- Os E2E rodam contra build de produção (`build:e2e` + `start:e2e`, porta 3901,
  `distDir` `.next-e2e`), nunca contra `next dev`.
- Com `npm run dev` no ar, não escreva no banco por fora; pare o dev antes.
- Produção (`next start`) não é afetada: locks verificados antes e depois de actions.

## 7. Notificações ntfy

O agendador publica em `http://localhost:8185/` com JSON e o campo `topic`. O app ntfy do
celular também precisa alcançar esse servidor, então ele escuta no localhost (VITA), na rede
local e no Tailscale — e em nenhuma outra interface:

```bash
docker run -d --name vita-ntfy --restart unless-stopped \
  -p 127.0.0.1:8185:80 -p 192.168.101.4:8185:80 -p 100.74.176.72:8185:80 \
  binwiederhier/ntfy serve
```

(Correção da Fase 5: a versão anterior publicava só em `127.0.0.1`, e o celular nunca
receberia nada.) Os tópicos não têm senha: qualquer aparelho na rede local ou no seu
Tailscale que souber o nome consegue ler. Não exponha a porta 8185 à internet.

**Atenção:** a porta 8085 já estava ocupada por outro aplicativo na inspeção de
30/10/2026. Não publique nela nem interrompa o serviço existente. Antes de
ativar os lembretes, confirme que 8185 está livre e pertence ao ntfy.

No app ntfy do celular, use o servidor `http://192.168.101.4:8185` (em casa) ou
`http://100.74.176.72:8185` (Tailscale) e assine os tópicos `vita-agua`, `vita-sup`,
`vita-pesagem`, `vita-treino` e `vita-resumo`. A publicação é registrada como enviada somente
após resposta HTTP 2xx do servidor; isso não comprova leitura no aparelho.
Falhas aparecem no histórico em Ajustes. Web Push não está implementado:
selecionar `ambos` envia ao ntfy e registra Web Push como indisponível.
O botão “Testar agora” continua simulado, sem publicação.

## 8. Amazfit T-Rex 3

- **Lembretes no pulso:** no app Zepp, em Notificações de apps, ative o ntfy. O Zepp espelha
  por app, não por tópico: tudo o que o ntfy mostrar no celular aparece no relógio.
- **Treino:** com a integração ativa e o relógio pareado (já sincronizou ao menos uma vez), o
  lembrete de treino deixa de ir ao ntfy e vira alarme nativo do relógio; o sino do VITA
  continua registrando.
- **Mini-app:** instalação e configuração em `relogio/README.md`. O relógio fala com
  `GET /api/relogio/pacote` e `POST /api/relogio/series` usando o token gerado em
  `/ajustes › Amazfit T-Rex 3`. Gerar um novo token desconecta o relógio anterior.
- **Migração:** `node scripts/migrar-fase5.mjs` (backup → tabelas `relogio_*` → confere
  contagens, configurações e `integrity_check`). Idempotente.
- **Reinício:** o VITA não sobe sozinho após reboot do host (observado em 30/10/2026,
  ~15:36). Depois de um reboot, rode `scripts/reiniciar-producao.sh`.
