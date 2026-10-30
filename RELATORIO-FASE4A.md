# Fase 4 — Parte 1: água, suplementos e pesagem

## Banco de produção

Backup consistente via API SQLite, antes da migração: `data/vita.db.bak-2026-10-30T14-57-42-924Z-pre-fase4a`. A migração é aditiva: `node scripts/migrar-fase4a.mjs`. Cria `agua_log`, `suplemento`, `dose_log`, `notif_log` e `suplemento_legado` (rastreia conversões revisadas, inclusive após exclusão). Não altera as quatro chaves existentes.

| Medida | Antes | Depois, 12:17:49 (-03) |
|---|---:|---:|
| Séries | 795 | 795 |
| Sessões | 36 | 36 |
| Pesagens | 28 | 28 |
| Usuários | 1 | 1 |
| Exercícios | 132 | 132 |

`PRAGMA integrity_check` → `ok`. As quatro configurações lidas depois são `hidratacao.ativo=false`, `pesagem.ativo=false`, `pesagem.hora="07:00:00-03:00"` e `treino.ativo=false`; são os valores observados antes da migração. Nenhum seed ou E2E usa `data/vita.db`.

## Idempotência — prova exercida

Em banco temporário isolado, o script de prova chamou o mesmo repositório de produção `registrarAviso` duas vezes com a mesma chave e executou a consulta agrupada. Comando executado: `npx tsx --tsconfig tsconfig.json /tmp/prova-fase4a.ts` (script temporário removido após a prova).

```text
tentativa 1: true
tentativa 2: false
SELECT chave_dia,count(*) FROM notif_log GROUP BY chave_dia: [{"chave_dia":"2026-10-30:agua:14:00","total":1}]
```

A prova permanente, executável com `npx vitest run src/lib/db/repositories/notificacoes.test.ts src/lib/agendador.test.ts`, cobre duas tentativas, recuperação em até 30 minutos e a segunda chamada de pesagem. Também iniciei o Next de produção em `:3902` com banco de teste separado e o lembrete de água ativo: `/api/avisos` retornou um aviso com `enviado_em="2026-10-30T12:10:05-03:00"`; após outro ciclo o agrupamento permaneceu `[{"chave_dia":"2026-10-30:agua:12:09","total":1}]`. O sino exibiu o aviso no navegador. Banco e servidor temporários foram removidos.

## Telas e regras

- `screenshots/fase4a-agua.png`: copos, desfazer, progresso e histórico. A adesão histórica compara todos os dias à **meta atual**, não a metas históricas.
- `screenshots/fase4a-suplementos.png`: cadastro, dose, estoque e adesão. A adesão é uma estimativa dos horários e suplementos ativos atuais desde o cadastro; alterações antigas de agenda não são versionadas. O estoque é medido na unidade da dose; o limiar vem de Ajustes. Excluir um suplemento também exclui seu histórico após confirmação.
- `screenshots/fase4a-evolucao.png`: peso, meta e média móvel dos registros existentes nos sete dias de calendário anteriores a cada ponto. O link do aviso abre `#registrar-peso`.
- Itens de `suplementacao.itens` existentes ou importados são preservados e aguardam revisão de dose/unidade antes da conversão; não geram lembretes até então.
- Meta automática de água: peso × 35 ml, arredondamento para 250 ml mais próximos, +500 ml para máxima prevista superior a 32 °C. Modo manual usa `meta.agua_ml_dia`. Previsão Open-Meteo para Igarassu; na indisponibilidade, [média mensal de máximas Climatempo](https://www.climatempo.com.br/climatologia/1256/igarassu-pe), série de 30 anos sem período/estação especificados pela fonte. A tela identifica essa aproximação.
- A configuração existente usa `hidratacao.meta_modo` e `pesagem.lembrete_atraso_h`; o fuso único do app já é `America/Recife`, não há um campo de fuso no perfil. A periodicidade quinzenal é ancorada em 05/01/1970.
- O processo Next verifica lembretes a cada 60 s; usa janela de 30 minutos, horário de silêncio, metas e toggles. O aviso aparece **dentro do VITA**; não há ntfy, Web Push ou alerta quando o usuário não acessa o app nesta parte. Se o servidor ficar desligado mais de 30 minutos, o horário perdido não é recuperado.

## Verificação

- `npm test`: 79 testes aprovados em 22 arquivos.
- `npm run test:e2e`: 18 fluxos aprovados em banco isolado; build de produção aprovado com TypeScript.
- ESLint dos arquivos afetados: sem diagnósticos.
- axe WCAG 2 A/AA e 2.1 A/AA: zero violações em `/agua`, `/suplementos` e `/evolucao`, em 1440 e 390 px. Corrigido gráfico com foco dentro de `aria-hidden` antes da medição final.
- Console e `pageerror` em navegador Chromium, três rotas: `/agua []`, `/suplementos []`, `/evolucao []`.
- `curl` executado em 2026-10-30 12:17:49 -0300 no servidor de produção:

```text
/agua 200
/suplementos 200
/evolucao 200
```

**Limites:** notificações externas e progressão/TDEE da Parte 2 não foram implementadas. Os testes de envio simulado anteriores continuam no histórico separado de Ajustes. A Parte 2 aguarda validação do proprietário.
