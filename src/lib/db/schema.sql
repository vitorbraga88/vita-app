-- VITA — schema SQLite
-- Convenção: tabelas e colunas em português (domínio do produto),
-- nomes de arquivo/código em inglês quando referem-se à camada técnica.
-- Datas em ISO-8601 (TEXT), timestamps em segundos Unix (INTEGER) quando aplicável.

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS usuario (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  nome            TEXT NOT NULL,
  email           TEXT NOT NULL UNIQUE,
  objetivo        TEXT NOT NULL DEFAULT 'hipertrofia' CHECK (objetivo IN ('hipertrofia','emagrecimento','forca','resistencia','saude_geral')),
  altura_cm       REAL,
  data_nascimento TEXT,
  sexo            TEXT CHECK (sexo IN ('masculino','feminino','outro')),
  aparencia       TEXT NOT NULL DEFAULT 'dark' CHECK (aparencia IN ('dark','light')),
  criado_em       TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS exercicio (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  nome            TEXT NOT NULL,
  grupo_muscular  TEXT NOT NULL CHECK (grupo_muscular IN ('peito','costas','pernas','ombro','biceps','triceps','abdomen','gluteos','panturrilha','cardio','corpo_inteiro')),
  equipamento     TEXT NOT NULL DEFAULT 'barra' CHECK (equipamento IN ('barra','halteres','maquina','cabo','peso_corporal','kettlebell','esteira','bicicleta','outro')),
  tipo            TEXT NOT NULL DEFAULT 'forca' CHECK (tipo IN ('forca','cardio','tempo')),
  descricao       TEXT,
  midia_still     TEXT,
  midia_clip      TEXT,
  instrucoes      TEXT,
  musculo_alvo    TEXT,
  musculos_sec    TEXT,
  nivel           TEXT,
  mecanica        TEXT,
  fonte           TEXT,
  fonte_id        TEXT,
  sistema         INTEGER NOT NULL DEFAULT 0 CHECK (sistema IN (0,1)),
  criado_em       TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS treino (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  usuario_id      INTEGER NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
  nome            TEXT NOT NULL,
  divisao         TEXT NOT NULL DEFAULT 'full_body' CHECK (divisao IN ('push','pull','legs','upper','lower','full_body')),
  ordem           INTEGER NOT NULL DEFAULT 0,
  ativo           INTEGER NOT NULL DEFAULT 1 CHECK (ativo IN (0,1)),
  criado_em       TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS treino_exercicio (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  treino_id       INTEGER NOT NULL REFERENCES treino(id) ON DELETE CASCADE,
  exercicio_id    INTEGER NOT NULL REFERENCES exercicio(id) ON DELETE RESTRICT,
  ordem           INTEGER NOT NULL DEFAULT 0,
  series_alvo     INTEGER NOT NULL DEFAULT 3,
  reps_alvo       TEXT NOT NULL DEFAULT '8-12'
);

CREATE TABLE IF NOT EXISTS sessao (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  usuario_id      INTEGER NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
  treino_id       INTEGER REFERENCES treino(id) ON DELETE SET NULL,
  iniciado_em     TEXT NOT NULL DEFAULT (datetime('now')),
  finalizado_em   TEXT,
  duracao_min     INTEGER,
  kcal_estimado   INTEGER,
  status          TEXT NOT NULL DEFAULT 'em_andamento' CHECK (status IN ('em_andamento','concluido','cancelado'))
);

CREATE TABLE IF NOT EXISTS sessao_serie (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  sessao_id       INTEGER NOT NULL REFERENCES sessao(id) ON DELETE CASCADE,
  exercicio_id    INTEGER NOT NULL REFERENCES exercicio(id) ON DELETE RESTRICT,
  numero_serie    INTEGER NOT NULL,
  reps            INTEGER NOT NULL,
  carga_kg        REAL NOT NULL DEFAULT 0,
  rpe             REAL CHECK (rpe IS NULL OR (rpe >= 1 AND rpe <= 10)),
  pr              INTEGER NOT NULL DEFAULT 0 CHECK (pr IN (0,1)),
  criado_em       TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS peso_registro (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  usuario_id      INTEGER NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
  data            TEXT NOT NULL,
  peso_kg         REAL NOT NULL,
  UNIQUE(usuario_id, data)
);

CREATE TABLE IF NOT EXISTS medida (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  usuario_id      INTEGER NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
  data            TEXT NOT NULL,
  cintura_cm      REAL,
  braco_cm        REAL,
  coxa_cm         REAL,
  peito_cm        REAL,
  UNIQUE(usuario_id, data)
);

CREATE TABLE IF NOT EXISTS alimento (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  nome            TEXT NOT NULL,
  kcal_100g       REAL NOT NULL,
  proteina_g_100g REAL NOT NULL,
  carbo_g_100g    REAL NOT NULL,
  gordura_g_100g  REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS refeicao (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  usuario_id      INTEGER NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
  data            TEXT NOT NULL,
  periodo         TEXT NOT NULL CHECK (periodo IN ('cafe_da_manha','almoco','lanche','jantar','ceia')),
  criado_em       TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS refeicao_item (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  refeicao_id     INTEGER NOT NULL REFERENCES refeicao(id) ON DELETE CASCADE,
  alimento_id     INTEGER NOT NULL REFERENCES alimento(id) ON DELETE RESTRICT,
  quantidade_g    REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS meta (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  usuario_id      INTEGER NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
  tipo            TEXT NOT NULL CHECK (tipo IN ('treinos_semana','kcal_dia','agua_ml_dia','proteina_g_dia','peso_alvo_kg','carbo_g_dia','gordura_g_dia')),
  valor_alvo      REAL NOT NULL,
  criado_em       TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(usuario_id, tipo)
);

-- Ajustes (/ajustes). Additive: valor is JSON validated by src/lib/domain/configuracao/catalogo.ts;
-- timestamps are ISO-8601 with the America/Recife offset (…-03:00), never UTC.
CREATE TABLE IF NOT EXISTS configuracao (
  usuario_id      INTEGER NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
  chave           TEXT NOT NULL,
  valor           TEXT NOT NULL,
  atualizado_em   TEXT NOT NULL,
  PRIMARY KEY (usuario_id, chave)
);

-- Notification log (last 20 shown in /ajustes). teste=1 rows come from "Testar agora" and
-- never count toward the once-per-day rule; data_local is the Recife calendar day.
CREATE TABLE IF NOT EXISTS notificacao_envio (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  usuario_id      INTEGER NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
  tipo            TEXT NOT NULL CHECK (tipo IN ('hidratacao','suplementacao','pesagem','treino','nutricao')),
  canal           TEXT NOT NULL CHECK (canal IN ('ntfy','webpush','ambos')),
  teste           INTEGER NOT NULL DEFAULT 0 CHECK (teste IN (0,1)),
  status          TEXT NOT NULL,
  data_local      TEXT NOT NULL,
  enviado_em      TEXT NOT NULL
);

-- Phase 4A: water, supplements, scheduled in-app notifications.
CREATE TABLE IF NOT EXISTS agua_log (
  id INTEGER PRIMARY KEY, usuario_id INTEGER NOT NULL REFERENCES usuario(id),
  ts TEXT NOT NULL, ml INTEGER NOT NULL CHECK (ml > 0),
  origem TEXT NOT NULL DEFAULT 'app' CHECK (origem IN ('app','ajuste','relogio'))
);
CREATE INDEX IF NOT EXISTS idx_agua_user_ts ON agua_log(usuario_id, ts);

CREATE TABLE IF NOT EXISTS suplemento (
  id INTEGER PRIMARY KEY, usuario_id INTEGER NOT NULL REFERENCES usuario(id),
  nome TEXT NOT NULL, dose REAL NOT NULL CHECK (dose > 0),
  unidade TEXT NOT NULL CHECK (unidade IN ('g','mg','caps','ml')),
  horarios TEXT NOT NULL, estoque REAL NOT NULL DEFAULT 0 CHECK (estoque >= 0),
  doses_por_embalagem REAL, ativo INTEGER NOT NULL DEFAULT 1, criado_em TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS dose_log (
  id INTEGER PRIMARY KEY, suplemento_id INTEGER NOT NULL REFERENCES suplemento(id) ON DELETE CASCADE,
  data TEXT NOT NULL, horario TEXT NOT NULL, tomado_em TEXT,
  UNIQUE(suplemento_id, data, horario)
);

CREATE TABLE IF NOT EXISTS suplemento_legado (
  usuario_id INTEGER NOT NULL REFERENCES usuario(id), indice INTEGER NOT NULL,
  nome TEXT NOT NULL, horario TEXT NOT NULL,
  suplemento_id INTEGER REFERENCES suplemento(id) ON DELETE SET NULL,
  UNIQUE(usuario_id, indice, nome, horario)
);

CREATE TABLE IF NOT EXISTS notif_log (
  id INTEGER PRIMARY KEY, usuario_id INTEGER NOT NULL REFERENCES usuario(id),
  tipo TEXT NOT NULL CHECK (tipo IN ('agua','suplemento','pesagem','treino','resumo')),
  chave_dia TEXT NOT NULL, enviado_em TEXT NOT NULL,
  titulo TEXT NOT NULL, mensagem TEXT NOT NULL, link TEXT NOT NULL, lida_em TEXT,
  UNIQUE(usuario_id, tipo, chave_dia)
);

CREATE INDEX IF NOT EXISTS idx_sessao_usuario ON sessao(usuario_id, iniciado_em);
CREATE INDEX IF NOT EXISTS idx_sessao_serie_sessao ON sessao_serie(sessao_id);
CREATE INDEX IF NOT EXISTS idx_sessao_serie_exercicio ON sessao_serie(exercicio_id, criado_em);
CREATE INDEX IF NOT EXISTS idx_peso_usuario ON peso_registro(usuario_id, data);
CREATE INDEX IF NOT EXISTS idx_medida_usuario ON medida(usuario_id, data);
CREATE INDEX IF NOT EXISTS idx_refeicao_usuario ON refeicao(usuario_id, data);
CREATE INDEX IF NOT EXISTS idx_treino_exercicio_treino ON treino_exercicio(treino_id, ordem);
CREATE INDEX IF NOT EXISTS idx_notificacao_envio_usuario ON notificacao_envio(usuario_id, id);
