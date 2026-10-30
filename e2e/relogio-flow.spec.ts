import Database from "better-sqlite3";
import { expect, test } from "@playwright/test";
import { esperarHidratacao } from "./hidratacao";

function consultar<T>(sql: string, ...params: unknown[]): T {
  const db = new Database("data/vita.e2e.db", { readonly: true });
  try {
    return db.prepare(sql).get(...params) as T;
  } finally {
    db.close();
  }
}

const isoRecife = (ms: number) => new Date(ms - 3 * 3_600_000).toISOString().slice(0, 19) + "-03:00";

// Writes only to workout 1 (Push): other specs only read it; workouts 2 and 3 are counted by
// treino-flow and sessao-sem-efeito-get running in parallel workers.
const TREINO_ID = 1;

test("parear o relógio em Ajustes e sincronizar um treino offline sem duplicar", async ({ page, request }) => {
  const erros: string[] = [];
  page.on("console", (m) => (m.type() === "error" || m.type() === "warning") && erros.push(m.text()));
  page.on("pageerror", (e) => erros.push(e.message));

  await page.goto("/ajustes", { waitUntil: "networkidle" });
  const secao = page.locator("details#amazfit");
  await secao.locator("summary").click();
  await esperarHidratacao(secao.getByRole("switch", { name: "Integração com o relógio" }));
  await secao.getByRole("switch", { name: "Integração com o relógio" }).click();
  await expect.poll(() => consultar<{ valor: string } | undefined>("SELECT valor FROM configuracao WHERE usuario_id = 1 AND chave = 'amazfit.ativo'")?.valor).toBe("true");

  await secao.getByRole("button", { name: "Gerar token" }).click();
  const token = (await secao.locator("code").innerText()).trim();
  expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);
  const auth = { authorization: `Bearer ${token}` };

  const pacote = await request.get("/api/relogio/pacote", { headers: auth });
  expect(pacote.status()).toBe(200);
  const { treino } = await pacote.json();
  expect(treino.exercicios.length).toBeGreaterThan(0);
  const { exercicioId } = consultar<{ exercicioId: number }>(
    "SELECT exercicio_id AS exercicioId FROM treino_exercicio WHERE treino_id = ? ORDER BY ordem LIMIT 1", TREINO_ID);

  const agora = Date.now();
  const sufixo = String(agora);
  const lote = {
    sessoes: [{ id: `e2e-sessao-${sufixo}`, treinoId: TREINO_ID, iniciadaEm: isoRecife(agora - 50 * 60000), finalizadaEm: isoRecife(agora - 3 * 60000) }],
    series: [1, 2].map((n) => ({
      id: `e2e-serie-${sufixo}-${n}`, sessaoId: `e2e-sessao-${sufixo}`, exercicioId,
      numeroSerie: n, reps: 10, cargaKg: 40, registradaEm: isoRecife(agora - (40 - n) * 60000),
    })),
  };
  const primeiro = await (await request.post("/api/relogio/series", { headers: auth, data: lote })).json();
  const segundo = await (await request.post("/api/relogio/series", { headers: auth, data: lote })).json();
  const ids = [lote.sessoes[0].id, ...lote.series.map((s) => s.id)];
  expect(primeiro).toMatchObject({ aceitas: ids, duplicadas: [], rejeitadas: [] });
  expect(segundo).toMatchObject({ aceitas: [], duplicadas: ids, finalizadas: [lote.sessoes[0].id] });
  expect(consultar<{ n: number }>(`SELECT count(*) AS n FROM sessao_serie ss JOIN relogio_serie r ON r.sessao_serie_id = ss.id
    WHERE r.cliente_id LIKE ?`, `e2e-serie-${sufixo}-%`).n).toBe(2);
  expect(consultar<{ status: string; duracao_min: number }>(`SELECT s.status, s.duracao_min FROM sessao s
    JOIN relogio_sessao r ON r.sessao_id = s.id WHERE r.cliente_id = ?`, lote.sessoes[0].id)).toEqual({ status: "concluido", duracao_min: 47 });

  await page.reload({ waitUntil: "networkidle" });
  await page.locator("details#amazfit summary").click();
  await expect(page.locator("details#amazfit").getByRole("status")).toContainText("Pareado. Último contato do relógio");

  await page.goto("/treinos/historico", { waitUntil: "networkidle" });
  await expect(page.getByText("Push").first()).toBeVisible();
  await expect(page.getByText("2 séries").first()).toBeVisible();
  expect(erros).toEqual([]);
});
