import Database from "better-sqlite3";
import { expect, test } from "@playwright/test";

// Uses workout 3 (Legs): no other spec touches it, so counts are not raced by parallel workers.
const TREINO_ID = 3;

function sessoesDoTreino(): { total: number; emAndamento: number } {
  const db = new Database("data/vita.e2e.db", { readonly: true });
  try {
    return db
      .prepare(
        `SELECT COUNT(*) AS total, COALESCE(SUM(status = 'em_andamento'), 0) AS emAndamento
         FROM sessao WHERE treino_id = ?`
      )
      .get(TREINO_ID) as { total: number; emAndamento: number };
  } finally {
    db.close();
  }
}

test("abrir a sessão guiada não grava nada; a 1ª série cria a sessão uma única vez", async ({ page }) => {
  const antes = sessoesDoTreino();

  await page.goto(`/treinos/${TREINO_ID}`);
  await expect(page.locator("h1")).toHaveText("Legs");
  await page.reload();
  await expect(page.locator("h1")).toHaveText("Legs");
  expect(sessoesDoTreino()).toEqual(antes);
  await expect(page.getByRole("button", { name: "Finalizar treino" })).toBeDisabled();

  await page.locator('button[aria-label^="Marcar série 1"]').first().click();
  await expect.poll(sessoesDoTreino).toEqual({ total: antes.total + 1, emAndamento: antes.emAndamento + 1 });

  await page.reload();
  await page.locator('button[aria-label^="Marcar série 2"]').first().click();
  await expect(page.locator('button[aria-label^="Desmarcar série 2"]').first()).toBeVisible();
  expect(sessoesDoTreino()).toEqual({ total: antes.total + 1, emAndamento: antes.emAndamento + 1 });
  await expect(page.getByRole("button", { name: "Finalizar treino" })).toBeEnabled();
});
