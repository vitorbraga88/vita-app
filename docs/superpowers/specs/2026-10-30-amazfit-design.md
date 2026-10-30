# Fase 5 — Amazfit T-Rex 3

Aprovado pelo dono em 2026-10-30. Escopo: **A** (lembretes no pulso por espelhamento do ntfy)
e **B** (mini-app Zepp OS com treino do dia, offline primeiro). Fora do escopo: importar
treinos via Strava ou arquivo; reinício automático do servidor após reboot (risco registrado).

## Fatos que limitam o desenho (fontes oficiais)

- T-Rex 3: Zepp OS 4.5, API_LEVEL 4.0, tela redonda 480×480
  ([lista de dispositivos](https://docs.zepp.com/docs/reference/related-resources/device-list/)).
- Side service (no celular) faz `fetch({url, method, headers, body})`; `res.body` pode vir como
  string JSON ([Fetch API](https://docs.zepp.com/docs/reference/side-service-api/fetch/)).
- `@zos/alarm.set` cria alarme persistente (`store: true`) que acorda um App Service; o App
  Service de execução única tem limite de 600 ms e sem timers; `@zos/notification.notify` cria
  notificação no relógio ([App Service](https://docs.zepp.com/docs/guides/framework/device/app-service/)).
- O app Zepp espelha notificações **por app** do celular; não filtra por tópico do ntfy.
- Build: `@zeppos/zeus-cli` 1.9.3. O pacote publica a dependência `zeppos-app-utils` em
  `private-modules/` sem vinculá-la; ela é vinculada a partir dessa cópia
  (`file:node_modules/@zeppos/zeus-cli/private-modules/zeppos-app-utils`). O pacote público
  homônimo no npm **não** é usado.
- Rede: o VITA responde em `http://192.168.101.4:3900` (LAN) e `http://100.74.176.72:3900`
  (Tailscale do host).

## Decisões do dono

| Tema | Decisão |
|---|---|
| Lembretes no pulso | Os dois mecanismos: ntfy espelhado para água, suplemento, pesagem e resumo; alarme nativo só para treino |
| Duplicidade | Com `amazfit.ativo` e relógio pareado, o lembrete de treino **não** é publicado no ntfy (o aviso no sino continua) |
| Conectividade | Offline primeiro: séries gravadas no relógio e enviadas quando houver rota |
| `amazfit.espelhar`, `amazfit.tipos` | Removidos do catálogo: o Zepp não consegue respeitá-los. `/ajustes` explica o espelhamento |
| `amazfit.sincronizar_treino` | Mantida: liga o recebimento de séries do relógio |

## Servidor

### Dados (migração aditiva com backup)

```sql
CREATE TABLE IF NOT EXISTS relogio_dispositivo (
  id INTEGER PRIMARY KEY,
  usuario_id INTEGER NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,          -- SHA-256 hex; o token só é exibido uma vez
  criado_em TEXT NOT NULL,                  -- ISO com offset -03:00
  ultimo_contato_em TEXT
);
CREATE TABLE IF NOT EXISTS relogio_sessao (
  cliente_id TEXT PRIMARY KEY,              -- gerado no relógio
  sessao_id INTEGER NOT NULL REFERENCES sessao(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS relogio_serie (
  cliente_id TEXT PRIMARY KEY,              -- gerado no relógio; garante idempotência
  sessao_serie_id INTEGER NOT NULL REFERENCES sessao_serie(id) ON DELETE CASCADE
);
```

Gerar um token novo substitui o anterior (um relógio por usuário). Contagens protegidas
795/36/28/1/132 e configurações existentes inalteradas.

### Contrato da API (versão 1)

Autenticação: `Authorization: Bearer <token>`. Token ausente/inválido → `401 {erro}`.
`amazfit.ativo` desligado → `403 {erro}`. Toda resposta válida atualiza `ultimo_contato_em`.

`GET /api/relogio/pacote` → `200`

```json
{
  "versao": 1,
  "geradoEm": "2026-10-30T16:30:00-03:00",
  "treino": null | {
    "id": 1, "nome": "Push",
    "exercicios": [{
      "exercicioId": 1, "nome": "Supino reto", "seriesAlvo": 4, "repsAlvo": "8-12",
      "cargaSugeridaKg": 70.5, "tipoSugestao": "manter", "motivo": "…",
      "ultimaReps": 11, "ultimaCargaKg": 70.5
    }]
  },
  "alarmes": [{ "chave": "2026-10-31:treino", "em": 1793480400, "titulo": "Hora do treino", "mensagem": "Push às 18:00" }]
}
```

- `treino`: próximo da sequência (`getProximoTreino`); sugestão do motor de progressão quando
  `treino.sugestao_progressao` e o exercício é de força, senão `null`.
- `alarmes`: próximos 7 dias de calendário de Recife, a partir de agora, quando `treino.ativo`;
  instante = `treino.lembrete_hora` − `treino.lembrete_antecedencia_min`, em segundos UTC;
  omitidos se caírem no silêncio configurado ou já tiverem passado. `mensagem` ≤ 40 caracteres.

`POST /api/relogio/series` (requer `amazfit.sincronizar_treino`, senão `403`)

```json
{
  "sessoes": [{ "id": "s-…", "treinoId": 1, "iniciadaEm": "2026-10-31T18:05:00-03:00",
                "finalizadaEm": "2026-10-31T19:00:00-03:00" | null }],
  "series": [{ "id": "r-…", "sessaoId": "s-…", "exercicioId": 1, "numeroSerie": 1,
               "reps": 12, "cargaKg": 70.5, "registradaEm": "2026-10-31T18:07:00-03:00" }]
}
```

→ `200 { "aceitas": [ids], "duplicadas": [ids], "rejeitadas": [{ "id", "motivo" }], "finalizadas": [ids] }`

- `aceitas`/`duplicadas` confirmam **sessões e séries** (sessão nova → `aceitas`; id já conhecido
  → `duplicadas`). `finalizadas` é informativa: sessões que estão concluídas no servidor.
  (Esclarecido após a prova de contrato: sem isso, a sessão nunca saía da fila do relógio.)
- ids: 8–64 caracteres `[A-Za-z0-9_-]`; no máximo 50 sessões e 300 séries por lote (`400`).
- Sessão nova: `INSERT` em `sessao` com `iniciado_em` local de Recife vindo do relógio
  (não reaproveita sessão em andamento do navegador). `finalizadaEm` conclui a sessão
  (duração em minutos, kcal = 6/min, mesma regra da sessão guiada); repetir é inofensivo.
- Série: mesmo cálculo de recorde do registro existente; `cliente_id` repetido → `duplicadas`.
- Rejeitada: sessão desconhecida, exercício inexistente, reps fora de 1–100, carga fora de
  0–500, data inválida. Rejeição de um item não descarta os demais.

### Agendador

Pula a publicação ntfy do tipo `treino` quando `amazfit.ativo` e existe relógio com
`ultimo_contato_em` preenchido. O aviso no sino é registrado normalmente.

### `/ajustes › Amazfit T-Rex 3`

Toggle mestre, `amazfit.sincronizar_treino`, pareamento (gerar token, exibido uma vez; endereços
LAN e Tailscale; último contato) e instruções do espelhamento do ntfy.

## Mini-app (`relogio/`)

Projeto Zepp OS independente (`app.json`, API_LEVEL 3.0 mínimo, alvo T-Rex 3).

- **Configurações (app Zepp no celular):** endereço do VITA e token.
- **Side service:** baixa o pacote e envia a fila; repassa respostas ao relógio.
- **Telas:** *Hoje* (treino, última sincronização, pendências, Sincronizar) → *Exercício*
  (série N de M, alvo, sugestão, ± reps, ± carga em 0,5 kg/2,5 kg, Concluir série) → *Finalizar*.
- **Fila offline:** sessões e séries com ids únicos persistidas no relógio; removidas só após
  `aceitas`/`duplicadas`; `rejeitadas` ficam visíveis como erro.
- **Alarmes:** a cada pacote recebido, cancela os alarmes anteriores e cria os novos
  (`store: true`); o App Service chama `notify()` com título e mensagem.
- Lógica pura (fila, conversão de pacote, agenda) separada das telas e testada com Vitest.

## Verificação

- Vitest: token, 401/403, pacote (treino, sugestão, alarmes, silêncio), lote idempotente,
  rejeições parciais, finalização, agendador sem treino no ntfy; lógica pura do mini-app.
- E2E (banco isolado): parear em `/ajustes`, cliente simulado envia o mesmo lote 2× → 1 registro,
  sessão aparece no histórico.
- `zeus build` gera o pacote do mini-app.
- Produção: backup, migração aditiva, contagens e `integrity_check`, `curl` das rotas.
- **Não exercitado aqui:** execução no relógio (exige `zeus login`/`zeus preview` do dono) e
  entrega via ntfy (container na porta 8185 fora do ar).
