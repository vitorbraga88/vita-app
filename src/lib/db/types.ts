// Row shapes mirroring schema.sql. Kept separate from Zod/validation schemas
// (none needed yet — all writes go through typed repository functions).

export type Objetivo = "hipertrofia" | "emagrecimento" | "forca" | "resistencia" | "saude_geral";
export type Sexo = "masculino" | "feminino" | "outro";
export type Aparencia = "dark" | "light";

export interface Usuario {
  id: number;
  nome: string;
  email: string;
  objetivo: Objetivo;
  altura_cm: number | null;
  data_nascimento: string | null;
  sexo: Sexo | null;
  aparencia: Aparencia;
  criado_em: string;
}

export type GrupoMuscular =
  | "peito" | "costas" | "pernas" | "ombro" | "biceps" | "triceps"
  | "abdomen" | "gluteos" | "panturrilha" | "cardio" | "corpo_inteiro";
export type Equipamento =
  | "barra" | "halteres" | "maquina" | "cabo" | "peso_corporal"
  | "kettlebell" | "esteira" | "bicicleta" | "outro";
export type TipoExercicio = "forca" | "cardio" | "tempo";

export type NivelExercicio = "iniciante" | "intermediario" | "avancado";
export type MecanicaExercicio = "composto" | "isolado";

export interface Exercicio {
  id: number;
  nome: string;
  grupo_muscular: GrupoMuscular;
  equipamento: Equipamento;
  tipo: TipoExercicio;
  descricao: string | null;
  midia_still: string | null;
  midia_clip: string | null;
  instrucoes: string | null;
  musculo_alvo: string | null;
  musculos_sec: string | null;
  nivel: NivelExercicio | null;
  mecanica: MecanicaExercicio | null;
  fonte: string | null;
  fonte_id: string | null;
  sistema: 0 | 1;
  criado_em: string;
}

export type Divisao = "push" | "pull" | "legs" | "upper" | "lower" | "full_body";

export interface Treino {
  id: number;
  usuario_id: number;
  nome: string;
  divisao: Divisao;
  ordem: number;
  ativo: 0 | 1;
  criado_em: string;
}

export interface TreinoExercicio {
  id: number;
  treino_id: number;
  exercicio_id: number;
  ordem: number;
  series_alvo: number;
  reps_alvo: string;
}

export type StatusSessao = "em_andamento" | "concluido" | "cancelado";

export interface Sessao {
  id: number;
  usuario_id: number;
  treino_id: number | null;
  iniciado_em: string;
  finalizado_em: string | null;
  duracao_min: number | null;
  kcal_estimado: number | null;
  status: StatusSessao;
}

export interface SessaoSerie {
  id: number;
  sessao_id: number;
  exercicio_id: number;
  numero_serie: number;
  reps: number;
  carga_kg: number;
  rpe: number | null;
  pr: 0 | 1;
  criado_em: string;
}

export interface PesoRegistro {
  id: number;
  usuario_id: number;
  data: string;
  peso_kg: number;
}

export interface Medida {
  id: number;
  usuario_id: number;
  data: string;
  cintura_cm: number | null;
  braco_cm: number | null;
  coxa_cm: number | null;
  peito_cm: number | null;
}

export interface Alimento {
  id: number;
  nome: string;
  kcal_100g: number;
  proteina_g_100g: number;
  carbo_g_100g: number;
  gordura_g_100g: number;
}

export type Periodo = "cafe_da_manha" | "almoco" | "lanche" | "jantar" | "ceia";

export interface Refeicao {
  id: number;
  usuario_id: number;
  data: string;
  periodo: Periodo;
  criado_em: string;
}

export interface RefeicaoItem {
  id: number;
  refeicao_id: number;
  alimento_id: number;
  quantidade_g: number;
}

export type TipoMeta =
  | "treinos_semana" | "kcal_dia" | "agua_ml_dia" | "proteina_g_dia"
  | "peso_alvo_kg" | "carbo_g_dia" | "gordura_g_dia";

export interface Meta {
  id: number;
  usuario_id: number;
  tipo: TipoMeta;
  valor_alvo: number;
  criado_em: string;
}
