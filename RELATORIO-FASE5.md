# Fase 5 — Amazfit T-Rex 3

Escopo aprovado: **A** (lembretes no pulso pelo espelhamento do ntfy) e **B** (mini-app Zepp OS
com treino do dia, offline primeiro). Decisões do dono: alarme nativo só para treino, que
sai do ntfy quando o relógio está pareado; `amazfit.espelhar` e `amazfit.tipos` removidas.
Especificação: `docs/superpowers/specs/2026-10-30-amazfit-design.md`.

## 1. Estado por entregável

| Item | Estado | Evidência |
|---|---|---|
| Backup + migração aditiva | [OK] | `node scripts/migrar-fase5.mjs` → backup `data/vita.db.bak-2026-10-30T19-37-20-369Z-pre-fase5`; criadas `relogio_dispositivo`, `relogio_serie`, `relogio_sessao`; antes = depois = 795/36/28/1/132; `settingsUnchanged: true`; `integrity: ok` |
| API `GET /api/relogio/pacote`, `POST /api/relogio/series` | [OK] | `src/lib/relogio/api.test.ts` 7/7 (401, 403, sugestão do motor, revogação de token, lote 2× = 1 registro, rejeição parcial, finalização idempotente, 400/403); produção: sem token → `401` (17:08:24) |
| Agenda de alarmes de treino | [OK] | `src/lib/relogio/agenda.test.ts` 5/5 (7 dias, antecedência, silêncio, 40 caracteres, conversão para Recife) |
| Treino fora do ntfy quando pareado | [OK] | `src/lib/entrega-notificacao.test.ts` 8/8; o teste novo falhou antes da mudança (`expected 7 to be 6`) e passa depois |
| `/ajustes › Amazfit T-Rex 3` | [OK] | Pareamento com token exibido uma vez, endereços reais (`http://192.168.101.4:3900`, `http://100.74.176.72:3900`), instruções do espelhamento; axe 0 violações e overflow 0 em 1440/390 px; `screenshots/fase5-ajustes-amazfit-{desktop,mobile}.png` |
| E2E pareamento → lote offline → histórico | [OK] | `e2e/relogio-flow.spec.ts`; suíte 22/22 |
| Mini-app Zepp OS (`relogio/`) | [OK] build / [WARN] execução | `zeus build` sem login → `relogio/dist/27391-VITA-1.0.0-20261030165944.zab`, 110354 bytes, sha256 `084d7f8c196fd7bdbbe7480bf1d1d413244487c9e37436f597f9a6e17ea3ec43`; testes 58/58. **Não executado no relógio nem no simulador** |
| Contrato mini-app ↔ servidor | [OK] | Código real de `relogio/src` (fila, sync, http) contra o build E2E na porta 3901, via `192.168.101.4`; resultado abaixo |
| Espelhamento ntfy → relógio (A) | [WARN] não exercitado | Container ntfy na porta 8185 fora do ar; depende de configuração no celular |
| Documentação | [OK] | `DEPLOY.md` §7 (corrigido) e §8, `README.md`, `relogio/README.md`, `progresso.md` |

Prova de contrato (sincronização no meio do treino, depois finalização):

```text
pacote: Legs | 1º exercício: Agachamento livre 8-12 sugestão 80 manter | alarmes: 7
alarmes planejados no relógio: 7
meio do treino, pendentes: {"sessoes":1,"series":1,"total":2}
envio 1: {"lotes":1,"removidas":2,"rejeitadas":0} | pendentes depois: {"sessoes":0,"series":0,"total":0}
após finalizar, pendentes: {"sessoes":1,"series":1,"total":2}
envio 2: {"lotes":1,"removidas":2,"rejeitadas":0} | pendentes depois: {"sessoes":0,"series":0,"total":0} | rejeitadas: []
reenvio do mesmo lote: {"aceitas":[],"duplicadas":["s-mvvd0emv-mF4cczLKsC","r-mvvdap07-NesyitpDm6"],...}
banco: {"status":"concluido","iniciado_em":"2026-10-30 16:22:47","finalizado_em":"2026-10-30 17:02:47","duracao_min":40,"series":2}
```

## 2. Números medidos

| Medida | Resultado |
|---|---|
| Vitest raiz | 115/115 em 28 arquivos; novos/alterados: `relogio/api.test.ts` 7, `relogio/agenda.test.ts` 5, `entrega-notificacao.test.ts` 8, `catalogo.test.ts` 7 |
| Vitest mini-app | 58/58: `fila` 15, `sync` 10, `http` 9, `pacote` 8, `alarmes` 6, `datas` 6, `ids` 4 |
| Playwright | 22/22 (banco isolado) |
| Axe (seção Amazfit aberta) | 0 violações, 1440 e 390 px |
| Console em produção | `[]` em `/ajustes`, `/treinos/1`, `/hoje`, 1440 e 390 px |
| Rotas em produção (17:08:24) | 11 rotas → 200; `/api/relogio/pacote` sem token → 401 |
| Dados protegidos | 795/36/28/1/132, 4 configurações, `integrity_check ok`; `relogio_*` = 0/0/0 (nada pareado em produção) |
| `eslint .` | 3 erros pré-existentes (ver §5) |

## 3. Rodou aqui × bloqueado × limitação de plataforma

- **Rodou aqui:** migração, API, agenda, pareamento, E2E, `zeus build`, contrato do mini-app com o servidor real pela rede local.
- **Bloqueado (precisa do dono):** instalar e rodar no T-Rex 3 (`zeus login`, `zeus preview`, QR no app Zepp em modo desenvolvedor); subir o container ntfy na porta 8185 e configurar o app ntfy e o espelhamento no celular.
- **Limitação de plataforma:**
  - O Zepp espelha notificações **por app**, não por tópico; por isso `amazfit.tipos` foi removida.
  - O serviço em segundo plano do relógio tem 600 ms e não tem rede: o alarme de treino não sabe se você já treinou.
  - A agenda só se atualiza quando o mini-app sincroniza.

## 4. Desvios de escopo

- **Sessões em `aceitas`/`duplicadas`:** o contrato inicial não dizia se sessões entravam nessas listas, e o relógio nunca esvaziava a fila. Achado na prova de contrato e corrigido no servidor; spec atualizada.
- **ntfy no `DEPLOY.md`:** o comando da Fase 4B publicava o ntfy só em `127.0.0.1`, e o celular nunca receberia nada. Agora escuta também em `192.168.101.4` e `100.74.176.72`.
- **Lint:** `eslint.config.mjs` passa a ignorar `.next-e2e/` (saída do build E2E, 9.381 problemas) e o `dist`/`node_modules` do mini-app.
- **Teste E2E:** `e2e/ajustes-flow.spec.ts` perdia cliques antes da hidratação sob carga paralela. Isolado com 1 worker: 21/21. O helper novo `e2e/hidratacao.ts` espera o React anexar o fiber ao elemento.
- **Refatoração:** montagem da sugestão (`src/lib/sessaoPlano.ts`) e regra de kcal (`src/lib/domain/energiaTreino.ts`) passaram a ser compartilhadas entre a sessão guiada e o relógio, sem mudança de comportamento.

## 5. Riscos

- **O VITA não sobe sozinho após reboot.** O host reiniciou por volta de 15:36 e a produção ficou fora até 16:18; religada com `scripts/reiniciar-producao.sh`. Registrado no `DEPLOY.md` §8; o reinício automático ficou fora do escopo aprovado.
- **Sem senha na rede:** o token do relógio protege só a API do relógio; o restante do VITA e o ntfy aceitam qualquer aparelho da rede local ou do Tailscale.
- **Riscos do mini-app (detalhados em `relogio/README.md`):**
  - Não está provado que o `param` do alarme chega ao serviço; se não chegar, a notificação sai com o texto padrão.
  - O `appId` 27391 pode precisar ser trocado pelo registrado na conta Zepp.
  - O botão físico de voltar pode fechar o app; a fila fica salva.
- **`zeppos-app-utils`:** o `zeus-cli` 1.9.3 não vincula essa dependência; ela vem da cópia embutida no pacote oficial. O pacote público homônimo do npm não é usado.
- **3 erros de lint pré-existentes** (`react-hooks/set-state-in-effect`) em `ExercicioFormSheet`, `AdicionarItemSheet` e `EditarExerciciosSheet`, arquivos que a Fase 5 não tocou.
