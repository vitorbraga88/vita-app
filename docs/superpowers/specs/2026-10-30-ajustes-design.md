# Ajustes (/ajustes) — desenho da Fase 3

Aprovado pelo dono em 2026-10-30. Escopo: **configuração e persistência**. Água,
suplemento, pesagem e envio de notificação **funcionando** são Fase 4; Amazfit é Fase 5.

## Decisões do dono

| Tema | Decisão |
|---|---|
| Perfil | `/ajustes` é o único editor. nome, email, nascimento, sexo e altura continuam em `usuario`; objetivo (com *manutenção*), nível, dias/semana e horário de treino vão para `configuracao`; `usuario.objetivo` deixa de ser lido. `/perfil` → redirect 308 para `/ajustes`; menu "Perfil" vira "Ajustes". |
| Peso atual | Somente leitura: última linha de `peso_registro` + link para `/evolucao`. Nunca escreve pesagem. |
| Metas kcal/macros/água | Fonte única = tabela `meta`. Modo manual edita `meta`; modo auto calcula e grava em `meta` (campos desabilitados mostrando o valor). |
| Aparência | Sem `next-themes`/localStorage. Layout lê o banco e escreve `data-theme`, `data-densidade`, `data-fonte`, `data-movimento` no `<html>`. |
| Toggle "ativo" | Desabilita **todos** os campos da seção (não esconde). Padrão desligado. Sub-toggles desabilitam seus próprios dependentes. |
| Dados | Exportar/importar/limpar afetam só configuração. Backup manual copia o `.db` inteiro. |

## Banco (migração aditiva)

```sql
CREATE TABLE IF NOT EXISTS configuracao (
  usuario_id    INTEGER NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
  chave         TEXT NOT NULL,
  valor         TEXT NOT NULL,   -- JSON
  atualizado_em TEXT NOT NULL,   -- ISO-8601 com offset de America/Recife (…-03:00)
  PRIMARY KEY (usuario_id, chave)
);
CREATE TABLE IF NOT EXISTS notificacao_envio (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  usuario_id INTEGER NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
  tipo       TEXT NOT NULL CHECK (tipo IN ('hidratacao','suplementacao','pesagem','treino','nutricao')),
  canal      TEXT NOT NULL CHECK (canal IN ('ntfy','webpush','ambos')),
  teste      INTEGER NOT NULL DEFAULT 0 CHECK (teste IN (0,1)),
  status     TEXT NOT NULL,
  data_local TEXT NOT NULL,      -- YYYY-MM-DD no calendário de America/Recife
  enviado_em TEXT NOT NULL       -- ISO-8601 com -03:00
);
```

Aplicada por `scripts/migrar-configuracao.mjs`: backup via API do SQLite → `schema.sql`
(só `CREATE … IF NOT EXISTS`) → confere 795/36/28/1/132 e `integrity_check`.

## API (`src/lib/db/repositories/configuracao.ts`)

```ts
getConfig<K>(usuarioId, chave: K, padrao?: ValorDe<K>): ValorDe<K>   // ausente → padrao ?? default do catálogo
setConfig<K>(usuarioId, chave: K, valor: ValorDe<K>): ValorDe<K>      // valida; rejeita chave/valor inválidos
getAllConfig(usuarioId): ConfigCompleta                               // todas as chaves com default aplicado
```

Valor inválido no banco (JSON quebrado ou fora do catálogo) também cai no default: o app não quebra.

## Horários

Todo horário é gravado como `HH:mm:ss±HH:mm` com o offset de **America/Recife** calculado
por `Intl` (hoje `-03:00`; Recife não tem horário de verão). `atualizado_em` e `enviado_em`
são ISO completos com o mesmo offset. Nada é gravado em UTC.

## Catálogo de chaves (default)

| Seção | Chave | Tipo / opções | Default |
|---|---|---|---|
| Perfil | `perfil.nivel` | iniciante · intermediario · avancado | intermediario |
| | `perfil.objetivo` | hipertrofia · emagrecimento · manutencao · forca | hipertrofia |
| | `perfil.dias_treino_semana` | inteiro 1–7 | 4 |
| | `perfil.horario_treino` | horário | 18:00:00-03:00 |
| Aparência | `aparencia.tema` | dark · light · sistema | dark |
| | `aparencia.densidade` | confortavel · compacto | confortavel |
| | `aparencia.idioma` | pt-BR | pt-BR |
| | `aparencia.reduzir_movimento` | booleano (desligado ⇒ segue `prefers-reduced-motion`) | false |
| | `aparencia.tamanho_fonte` | normal · grande | normal |
| Hidratação | `hidratacao.ativo` | booleano | false |
| | `hidratacao.meta_modo` | auto (peso × 35 ml) · manual (`meta.agua_ml_dia`) | manual |
| | `hidratacao.copo_ml` | 200 · 250 · 300 · 500 | 250 |
| | `hidratacao.janela_inicio` / `_fim` | horário | 07:00 / 22:00 |
| | `hidratacao.intervalo_min` | inteiro 15–240 | 60 |
| | `hidratacao.dias` | lista 0–6 (0 = domingo) | todos |
| | `hidratacao.pausar_meta_atingida` | booleano | true |
| Suplementação | `suplementacao.ativo` | booleano | false |
| | `suplementacao.itens` | lista `{nome, horario}` (até 10) | [] |
| | `suplementacao.antecedencia_min` | 0 · 15 · 30 | 15 |
| | `suplementacao.estoque_limiar` | doses restantes 1–60 | 7 |
| Pesagem | `pesagem.ativo` | booleano | false |
| | `pesagem.dia_semana` | 0–6 | 1 (segunda) |
| | `pesagem.hora` | horário | 07:00 |
| | `pesagem.lembrete_atraso_h` | inteiro 1–24 | 3 |
| | `pesagem.horario_preferido` | jejum · manha · noite | jejum |
| | `pesagem.periodicidade` | semanal · quinzenal | semanal |
| Treino | `treino.ativo` | booleano | false |
| | `treino.lembrete_hora` / `treino.lembrete_antecedencia_min` | horário / 0 · 15 · 30 · 60 | 18:00 / 30 |
| | `treino.sugestao_progressao` | booleano (desabilita incrementos e deload) | true |
| | `treino.incremento_superior_kg` / `_inferior_kg` | 0,5–10 / 0,5–20 (passo 0,5) | 2,5 / 5 |
| | `treino.deload_apos_falhas` | inteiro 2–6 | 3 |
| | `treino.som_cronometro` / `treino.vibracao` | booleano | true / true |
| Nutrição | `nutricao.ativo` | booleano | false |
| | `nutricao.kcal_modo` / `nutricao.macros_modo` | auto · manual (`meta`) | manual / manual |
| | `nutricao.lembrete.<periodo>` | horário ou `null` (desligado), períodos cafe_da_manha · almoco · lanche · jantar · ceia | null |
| | `nutricao.alerta_meta` | booleano | true |
| Notificações | `notificacoes.canal` | ntfy · webpush · ambos | ntfy |
| | `notificacoes.prioridade.<tipo>` | baixa · normal · alta | normal |
| | `notificacoes.silencio_ativo` + `_inicio` / `_fim` | booleano + horários | true, 22:30 / 07:00 |
| Amazfit T-Rex 3 | `amazfit.ativo` | booleano | false |
| | `amazfit.espelhar` | booleano | true |
| | `amazfit.tipos` | subconjunto dos 5 tipos | treino, pesagem |
| | `amazfit.sincronizar_treino` | booleano | true |

## Cálculos automáticos (gravados em `meta`)

- Água: `peso × 35` ml, arredondado para 50 ml.
- TDEE: Mifflin-St Jeor (`10·peso + 6,25·altura − 5·idade + s`, `s` = +5 masculino, −161
  feminino, −78 outro) × fator pelos dias de treino (0–1: 1,2 · 2–3: 1,375 · 4–5: 1,55 ·
  6–7: 1,725) × objetivo (emagrecimento 0,85 · manutenção 1,0 · hipertrofia 1,10 ·
  força 1,05), arredondado para 10 kcal.
- Macros: proteína 2,0 g/kg; gordura 0,9 g/kg; carboidrato = (kcal − 4P − 9G) / 4, mínimo 0.
- Sem peso ou altura cadastrados → o modo auto é recusado com mensagem; `meta` não muda.

## Notificações nesta fase

- "Testar agora" grava em `notificacao_envio` com `teste=1`, `status='simulado'`. Não envia
  ntfy, Web Push nem relógio (Fase 4/5). A UI deixa isso explícito.
- Histórico: últimos 20 registros, mais recentes primeiro.
- Regra "não reenviar hoje": `podeDisparar(tipo, dataLocal, envios)` retorna falso se já
  existe envio real (`teste=0`) do tipo na data local de Recife, independentemente de
  mudanças de configuração. Testes não contam. O agendador da Fase 4 usa essa função.

## Dados

- Exportar: `GET /ajustes/exportar` → JSON com versão, data e `getAllConfig`.
- Importar: valida cada chave pelo catálogo; chave desconhecida ou valor inválido rejeita
  o arquivo inteiro (transação).
- Limpar dados de teste: remove `notificacao_envio` com `teste=1`.
- Backup manual: `db.backup()` para `data/vita.db.bak-<ISO>-manual`.

## UI

Acordeão (`<details>/<summary>`) mobile-first; alvo de toque ≥ 48px; label em todo controle;
foco visível. Cada controle salva na hora (toggle/select na mudança, número/texto/horário ao
confirmar) com toast discreto; falha reverte o valor e mostra toast de erro.

## Provas exigidas

a) migração + 795/36/28/1/132 · b) screenshot das 10 seções · c) 3 toggles + F5 ·
d) `SELECT chave, valor FROM configuracao ORDER BY chave` · e) chave apagada → default ·
f) dependentes desabilitados antes/depois · g) horário com `-03:00` · h) console ·
i) `curl /ajustes` → 200 no momento do relatório.
