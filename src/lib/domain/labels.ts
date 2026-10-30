// Human-readable pt-BR labels for domain enums, shared across /treinos and
// /exercicios so Selects and badges stay consistent.
import type { Divisao, Equipamento, GrupoMuscular, TipoExercicio } from "@/lib/db/types";

export const LABEL_GRUPO_MUSCULAR: Record<GrupoMuscular, string> = {
  peito: "Peito",
  costas: "Costas",
  pernas: "Pernas",
  ombro: "Ombro",
  biceps: "Bíceps",
  triceps: "Tríceps",
  abdomen: "Abdômen",
  gluteos: "Glúteos",
  panturrilha: "Panturrilha",
  cardio: "Cardio",
  corpo_inteiro: "Corpo inteiro",
};

export const LABEL_EQUIPAMENTO: Record<Equipamento, string> = {
  barra: "Barra",
  halteres: "Halteres",
  maquina: "Máquina",
  cabo: "Cabo",
  peso_corporal: "Peso corporal",
  kettlebell: "Kettlebell",
  esteira: "Esteira",
  bicicleta: "Bicicleta",
  outro: "Outro",
};

export const LABEL_TIPO_EXERCICIO: Record<TipoExercicio, string> = {
  forca: "Força",
  cardio: "Cardio",
  tempo: "Tempo",
};

export const LABEL_DIVISAO: Record<Divisao, string> = {
  push: "Push",
  pull: "Pull",
  legs: "Legs",
  upper: "Upper",
  lower: "Lower",
  full_body: "Full Body",
};
