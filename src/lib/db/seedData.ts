import type { Equipamento, GrupoMuscular, TipoExercicio } from "@/lib/db/types";

export interface ExercicioSeed {
  nome: string;
  grupo_muscular: GrupoMuscular;
  equipamento: Equipamento;
  tipo: TipoExercicio;
  /** Working load in kg used as the baseline for the simulated 12-week progression. 0 for bodyweight. */
  cargaBase: number;
}

export const EXERCICIOS_SEED: ExercicioSeed[] = [
  { nome: "Supino reto", grupo_muscular: "peito", equipamento: "barra", tipo: "forca", cargaBase: 60 },
  { nome: "Supino inclinado", grupo_muscular: "peito", equipamento: "halteres", tipo: "forca", cargaBase: 24 },
  { nome: "Crucifixo no cabo", grupo_muscular: "peito", equipamento: "cabo", tipo: "forca", cargaBase: 15 },
  { nome: "Flexão de braço", grupo_muscular: "peito", equipamento: "peso_corporal", tipo: "forca", cargaBase: 0 },
  { nome: "Puxada alta", grupo_muscular: "costas", equipamento: "cabo", tipo: "forca", cargaBase: 55 },
  { nome: "Remada curvada", grupo_muscular: "costas", equipamento: "barra", tipo: "forca", cargaBase: 50 },
  { nome: "Barra fixa", grupo_muscular: "costas", equipamento: "peso_corporal", tipo: "forca", cargaBase: 0 },
  { nome: "Remada unilateral", grupo_muscular: "costas", equipamento: "halteres", tipo: "forca", cargaBase: 22 },
  { nome: "Levantamento terra", grupo_muscular: "costas", equipamento: "barra", tipo: "forca", cargaBase: 90 },
  { nome: "Agachamento livre", grupo_muscular: "pernas", equipamento: "barra", tipo: "forca", cargaBase: 70 },
  { nome: "Leg press", grupo_muscular: "pernas", equipamento: "maquina", tipo: "forca", cargaBase: 120 },
  { nome: "Cadeira extensora", grupo_muscular: "pernas", equipamento: "maquina", tipo: "forca", cargaBase: 45 },
  { nome: "Mesa flexora", grupo_muscular: "pernas", equipamento: "maquina", tipo: "forca", cargaBase: 40 },
  { nome: "Avanço com halteres", grupo_muscular: "pernas", equipamento: "halteres", tipo: "forca", cargaBase: 16 },
  { nome: "Stiff", grupo_muscular: "pernas", equipamento: "barra", tipo: "forca", cargaBase: 60 },
  { nome: "Desenvolvimento militar", grupo_muscular: "ombro", equipamento: "barra", tipo: "forca", cargaBase: 40 },
  { nome: "Elevação lateral", grupo_muscular: "ombro", equipamento: "halteres", tipo: "forca", cargaBase: 10 },
  { nome: "Elevação frontal", grupo_muscular: "ombro", equipamento: "halteres", tipo: "forca", cargaBase: 9 },
  { nome: "Remada alta", grupo_muscular: "ombro", equipamento: "barra", tipo: "forca", cargaBase: 30 },
  { nome: "Rosca direta", grupo_muscular: "biceps", equipamento: "barra", tipo: "forca", cargaBase: 30 },
  { nome: "Rosca alternada", grupo_muscular: "biceps", equipamento: "halteres", tipo: "forca", cargaBase: 12 },
  { nome: "Rosca martelo", grupo_muscular: "biceps", equipamento: "halteres", tipo: "forca", cargaBase: 14 },
  { nome: "Tríceps corda", grupo_muscular: "triceps", equipamento: "cabo", tipo: "forca", cargaBase: 25 },
  { nome: "Tríceps testa", grupo_muscular: "triceps", equipamento: "barra", tipo: "forca", cargaBase: 20 },
  { nome: "Mergulho em paralelas", grupo_muscular: "triceps", equipamento: "peso_corporal", tipo: "forca", cargaBase: 0 },
  { nome: "Prancha", grupo_muscular: "abdomen", equipamento: "peso_corporal", tipo: "tempo", cargaBase: 0 },
  { nome: "Abdominal supra", grupo_muscular: "abdomen", equipamento: "peso_corporal", tipo: "forca", cargaBase: 0 },
  { nome: "Elevação de pernas", grupo_muscular: "abdomen", equipamento: "peso_corporal", tipo: "forca", cargaBase: 0 },
  { nome: "Elevação pélvica", grupo_muscular: "gluteos", equipamento: "barra", tipo: "forca", cargaBase: 70 },
  { nome: "Cadeira abdutora", grupo_muscular: "gluteos", equipamento: "maquina", tipo: "forca", cargaBase: 35 },
  { nome: "Panturrilha em pé", grupo_muscular: "panturrilha", equipamento: "maquina", tipo: "forca", cargaBase: 80 },
  { nome: "Esteira", grupo_muscular: "cardio", equipamento: "esteira", tipo: "cardio", cargaBase: 0 },
  { nome: "Bicicleta ergométrica", grupo_muscular: "cardio", equipamento: "bicicleta", tipo: "cardio", cargaBase: 0 },
];

export interface AlimentoSeed {
  nome: string;
  kcal_100g: number;
  proteina_g_100g: number;
  carbo_g_100g: number;
  gordura_g_100g: number;
}

export const ALIMENTOS_SEED: AlimentoSeed[] = [
  { nome: "Peito de frango grelhado", kcal_100g: 165, proteina_g_100g: 31, carbo_g_100g: 0, gordura_g_100g: 3.6 },
  { nome: "Arroz branco cozido", kcal_100g: 130, proteina_g_100g: 2.7, carbo_g_100g: 28, gordura_g_100g: 0.3 },
  { nome: "Feijão carioca cozido", kcal_100g: 76, proteina_g_100g: 4.8, carbo_g_100g: 13.6, gordura_g_100g: 0.5 },
  { nome: "Ovo cozido", kcal_100g: 155, proteina_g_100g: 13, carbo_g_100g: 1.1, gordura_g_100g: 11 },
  { nome: "Batata-doce cozida", kcal_100g: 86, proteina_g_100g: 1.6, carbo_g_100g: 20, gordura_g_100g: 0.1 },
  { nome: "Aveia em flocos", kcal_100g: 389, proteina_g_100g: 16.9, carbo_g_100g: 66, gordura_g_100g: 6.9 },
  { nome: "Banana", kcal_100g: 89, proteina_g_100g: 1.1, carbo_g_100g: 23, gordura_g_100g: 0.3 },
  { nome: "Whey protein (pó)", kcal_100g: 400, proteina_g_100g: 80, carbo_g_100g: 8, gordura_g_100g: 6.5 },
  { nome: "Pão francês", kcal_100g: 300, proteina_g_100g: 8, carbo_g_100g: 58, gordura_g_100g: 3 },
  { nome: "Queijo minas", kcal_100g: 264, proteina_g_100g: 17.4, carbo_g_100g: 3.2, gordura_g_100g: 20.2 },
  { nome: "Azeite de oliva", kcal_100g: 884, proteina_g_100g: 0, carbo_g_100g: 0, gordura_g_100g: 100 },
  { nome: "Brócolis cozido", kcal_100g: 35, proteina_g_100g: 2.4, carbo_g_100g: 7.2, gordura_g_100g: 0.4 },
  { nome: "Carne bovina moída (patinho)", kcal_100g: 172, proteina_g_100g: 26, carbo_g_100g: 0, gordura_g_100g: 7 },
  { nome: "Salmão grelhado", kcal_100g: 208, proteina_g_100g: 20, carbo_g_100g: 0, gordura_g_100g: 13 },
  { nome: "Iogurte natural integral", kcal_100g: 61, proteina_g_100g: 3.5, carbo_g_100g: 4.7, gordura_g_100g: 3.3 },
  { nome: "Amêndoas", kcal_100g: 579, proteina_g_100g: 21, carbo_g_100g: 22, gordura_g_100g: 50 },
  { nome: "Macarrão cozido", kcal_100g: 158, proteina_g_100g: 5.8, carbo_g_100g: 31, gordura_g_100g: 0.9 },
  { nome: "Tapioca", kcal_100g: 240, proteina_g_100g: 0.2, carbo_g_100g: 59, gordura_g_100g: 0.1 },
  { nome: "Abacate", kcal_100g: 160, proteina_g_100g: 2, carbo_g_100g: 8.5, gordura_g_100g: 14.7 },
  { nome: "Atum em água (lata)", kcal_100g: 116, proteina_g_100g: 26, carbo_g_100g: 0, gordura_g_100g: 1 },
];
