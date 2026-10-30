// Populates the SQLite database with a coherent demo dataset: one user, the
// exercise library, three workout splits, 12 weeks of completed sessions
// with a plausible progressive-overload curve, body-weight/measurement
// history, and a week of meals. Run with `npm run seed`.
import { getDb } from "@/lib/db/client";
import { ALIMENTOS_SEED, EXERCICIOS_SEED } from "@/lib/db/seedData";
import { isoLocalDiasAtras } from "@/lib/domain/dataLocal";
import { getSeedDatabasePath } from "@/lib/db/seedTarget";
import { calcularAguaMl } from "@/lib/domain/configuracao/metasAuto";

process.env.VITA_DB_PATH = getSeedDatabasePath(process.env.VITA_DB_PATH);

const TABELAS_EM_ORDEM_DE_LIMPEZA = [
  "suplemento_legado", "dose_log", "suplemento", "agua_log", "notif_log",
  "refeicao_item", "refeicao", "medida", "peso_registro", "sessao_serie",
  "sessao", "treino_exercicio", "treino", "meta", "alimento", "exercicio", "usuario",
];

/** Small deterministic PRNG (mulberry32) so re-running the seed yields the same "plausible" data. */
function criarRng(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}


async function seed() {
  const db = getDb();
  const rng = criarRng(42);

  const tx = db.transaction(() => {
    for (const tabela of TABELAS_EM_ORDEM_DE_LIMPEZA) db.prepare(`DELETE FROM ${tabela}`).run();
    db.prepare(
      `DELETE FROM sqlite_sequence WHERE name IN (${TABELAS_EM_ORDEM_DE_LIMPEZA.map(() => "?").join(",")})`
    ).run(...TABELAS_EM_ORDEM_DE_LIMPEZA);

    const usuarioId = Number(
      db
        .prepare(
          `INSERT INTO usuario (nome, email, objetivo, altura_cm, data_nascimento, sexo, aparencia)
           VALUES (?, ?, ?, ?, ?, ?, ?)`
        )
        .run("Gabriel Souza", "gabriel@vita.app", "hipertrofia", 178, "1996-04-12", "masculino", "dark").lastInsertRowid
    );

    const insertExercicio = db.prepare(
      `INSERT INTO exercicio (nome, grupo_muscular, equipamento, tipo) VALUES (?, ?, ?, ?)`
    );
    const exercicioIds = EXERCICIOS_SEED.map((e) =>
      Number(insertExercicio.run(e.nome, e.grupo_muscular, e.equipamento, e.tipo).lastInsertRowid)
    );
    const cargaBasePorId = new Map(exercicioIds.map((id, i) => [id, EXERCICIOS_SEED[i].cargaBase]));
    const idPorNome = new Map(EXERCICIOS_SEED.map((e, i) => [e.nome, exercicioIds[i]]));

    const insertTreino = db.prepare(`INSERT INTO treino (usuario_id, nome, divisao, ordem) VALUES (?, ?, ?, ?)`);
    const insertTreinoExercicio = db.prepare(
      `INSERT INTO treino_exercicio (treino_id, exercicio_id, ordem, series_alvo, reps_alvo) VALUES (?, ?, ?, ?, ?)`
    );

    const DIVISAO: Array<{ nome: string; divisao: "push" | "pull" | "legs"; exercicios: string[] }> = [
      { nome: "Push", divisao: "push", exercicios: ["Supino reto", "Supino inclinado", "Desenvolvimento militar", "Elevação lateral", "Tríceps corda", "Tríceps testa"] },
      { nome: "Pull", divisao: "pull", exercicios: ["Puxada alta", "Remada curvada", "Barra fixa", "Remada unilateral", "Rosca direta", "Rosca martelo"] },
      { nome: "Legs", divisao: "legs", exercicios: ["Agachamento livre", "Leg press", "Cadeira extensora", "Mesa flexora", "Stiff", "Elevação pélvica", "Panturrilha em pé"] },
    ];
    const treinoIds = DIVISAO.map((t, i) => {
      const id = Number(insertTreino.run(usuarioId, t.nome, t.divisao, i).lastInsertRowid);
      t.exercicios.forEach((nome, ordem) => {
        insertTreinoExercicio.run(id, idPorNome.get(nome), ordem, 4, "8-12");
      });
      return id;
    });

    const insertSessao = db.prepare(
      `INSERT INTO sessao (usuario_id, treino_id, iniciado_em, finalizado_em, duracao_min, kcal_estimado, status)
       VALUES (?, ?, ?, ?, ?, ?, 'concluido')`
    );
    const insertSerie = db.prepare(
      `INSERT INTO sessao_serie (sessao_id, exercicio_id, numero_serie, reps, carga_kg, rpe, pr, criado_em)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    );

    // 12 weeks of history: Mon/Wed/Fri, rotating Push -> Pull -> Legs -> Push ...
    const recordePorExercicio = new Map<number, number>();
    const sessoesPorTreino = new Map<number, number>(treinoIds.map((id) => [id, 0]));
    let rotacao = 0;
    for (let diasAtras = 83; diasAtras >= 1; diasAtras--) {
      const data = new Date();
      data.setDate(data.getDate() - diasAtras);
      const diaSemana = data.getDay(); // 1=Mon, 3=Wed, 5=Fri
      if (![1, 3, 5].includes(diaSemana)) continue;

      const treinoIndex = rotacao % 3;
      rotacao += 1;
      const treinoId = treinoIds[treinoIndex];
      const divisaoExercicios = DIVISAO[treinoIndex].exercicios.map((nome) => idPorNome.get(nome)!);
      const numeroSessaoDoTreino = sessoesPorTreino.get(treinoId)!;
      sessoesPorTreino.set(treinoId, numeroSessaoDoTreino + 1);
      // Progresso linear de 85% a 118% da carga base ao longo de ~12 sessões por treino, com ruído leve.
      const progresso = Math.min(1, numeroSessaoDoTreino / 11);
      const fatorCarga = 0.85 + progresso * 0.33 + (rng() - 0.5) * 0.04;

      const isoData = isoLocalDiasAtras(diasAtras);
      const horaInicio = `${isoData} ${18 + Math.floor(rng() * 2)}:${String(Math.floor(rng() * 59)).padStart(2, "0")}:00`;
      const duracaoMin = 45 + Math.floor(rng() * 25);
      const kcalEstimado = 280 + Math.floor(rng() * 180);
      const sessaoId = Number(
        insertSessao.run(usuarioId, treinoId, horaInicio, horaInicio, duracaoMin, kcalEstimado).lastInsertRowid
      );

      for (const exercicioId of divisaoExercicios) {
        const cargaBase = cargaBasePorId.get(exercicioId) ?? 0;
        const numSeries = 3 + Math.floor(rng() * 2);
        for (let serie = 1; serie <= numSeries; serie++) {
          const reps = cargaBase === 0 ? 8 + Math.floor(rng() * 6) : 8 + Math.floor(rng() * 5);
          const cargaKg = cargaBase === 0 ? 0 : Math.round(cargaBase * fatorCarga * 2) / 2;
          const recordeAnterior = recordePorExercicio.get(exercicioId) ?? 0;
          const pr = cargaKg > recordeAnterior ? 1 : 0;
          if (pr) recordePorExercicio.set(exercicioId, cargaKg);
          const rpe = Math.round((6 + rng() * 3) * 2) / 2;
          insertSerie.run(sessaoId, exercicioId, serie, reps, cargaKg, rpe, pr, horaInicio);
        }
      }
    }

    // Peso corporal e medidas: 12 semanas, leve perda/ganho conforme objetivo de hipertrofia (ganho leve).
    const insertPeso = db.prepare(`INSERT INTO peso_registro (usuario_id, data, peso_kg) VALUES (?, ?, ?)`);
    const insertMedida = db.prepare(
      `INSERT INTO medida (usuario_id, data, cintura_cm, braco_cm, coxa_cm, peito_cm) VALUES (?, ?, ?, ?, ?, ?)`
    );
    const pesoInicial = 78.5;
    let ultimoPeso = pesoInicial;
    for (let diasAtras = 83; diasAtras >= 0; diasAtras -= 3) {
      const progresso = (83 - diasAtras) / 83;
      const peso = Math.round((pesoInicial + progresso * 2.2 + (rng() - 0.5) * 0.6) * 10) / 10;
      ultimoPeso = peso;
      insertPeso.run(usuarioId, isoLocalDiasAtras(diasAtras), peso);
    }
    for (let diasAtras = 77; diasAtras >= 0; diasAtras -= 14) {
      const progresso = (77 - diasAtras) / 77;
      insertMedida.run(
        usuarioId,
        isoLocalDiasAtras(diasAtras),
        Math.round((82 - progresso * 1.5) * 10) / 10,
        Math.round((34 + progresso * 1.2) * 10) / 10,
        Math.round((56 + progresso * 1.5) * 10) / 10,
        Math.round((98 + progresso * 2) * 10) / 10
      );
    }

    // Alimentos + refeições dos últimos 7 dias.
    const insertAlimento = db.prepare(
      `INSERT INTO alimento (nome, kcal_100g, proteina_g_100g, carbo_g_100g, gordura_g_100g) VALUES (?, ?, ?, ?, ?)`
    );
    const alimentoIds = ALIMENTOS_SEED.map((a) =>
      Number(insertAlimento.run(a.nome, a.kcal_100g, a.proteina_g_100g, a.carbo_g_100g, a.gordura_g_100g).lastInsertRowid)
    );
    const insertRefeicao = db.prepare(`INSERT INTO refeicao (usuario_id, data, periodo) VALUES (?, ?, ?)`);
    const insertItem = db.prepare(
      `INSERT INTO refeicao_item (refeicao_id, alimento_id, quantidade_g) VALUES (?, ?, ?)`
    );
    const PERIODOS: Array<{ periodo: "cafe_da_manha" | "almoco" | "lanche" | "jantar"; itens: Array<[string, number]> }> = [
      { periodo: "cafe_da_manha", itens: [["Aveia em flocos", 60], ["Banana", 120], ["Whey protein (pó)", 30]] },
      { periodo: "almoco", itens: [["Peito de frango grelhado", 150], ["Arroz branco cozido", 150], ["Feijão carioca cozido", 100], ["Brócolis cozido", 80]] },
      { periodo: "lanche", itens: [["Iogurte natural integral", 170], ["Amêndoas", 20]] },
      { periodo: "jantar", itens: [["Salmão grelhado", 160], ["Batata-doce cozida", 150], ["Abacate", 50]] },
    ];
    for (let diasAtras = 6; diasAtras >= 0; diasAtras--) {
      const isoData = isoLocalDiasAtras(diasAtras);
      for (const { periodo, itens } of PERIODOS) {
        const refeicaoId = Number(insertRefeicao.run(usuarioId, isoData, periodo).lastInsertRowid);
        for (const [nome, quantidade] of itens) {
          const idx = ALIMENTOS_SEED.findIndex((a) => a.nome === nome);
          const variacao = Math.round(quantidade * (0.9 + rng() * 0.2));
          insertItem.run(refeicaoId, alimentoIds[idx], variacao);
        }
      }
    }

    // Metas.
    const insertMeta = db.prepare(`INSERT INTO meta (usuario_id, tipo, valor_alvo) VALUES (?, ?, ?)`);
    insertMeta.run(usuarioId, "treinos_semana", 3);
    insertMeta.run(usuarioId, "kcal_dia", 2600);
    insertMeta.run(usuarioId, "proteina_g_dia", 170);
    insertMeta.run(usuarioId, "carbo_g_dia", 280);
    insertMeta.run(usuarioId, "gordura_g_dia", 80);
    insertMeta.run(usuarioId, "agua_ml_dia", calcularAguaMl(ultimoPeso));
    insertMeta.run(usuarioId, "peso_alvo_kg", 82);

    console.log(`Seed concluído: usuario=${usuarioId}, exercicios=${exercicioIds.length}, treinos=${treinoIds.length}, sessoes=${rotacao}, alimentos=${alimentoIds.length}`);
  });

  tx();
}

seed();
