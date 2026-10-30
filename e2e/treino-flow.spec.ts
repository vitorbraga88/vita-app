import { test, expect } from "@playwright/test";

// Flow: criar exercício → executar sessão → ver histórico.
// Uses treino id 2 (Pull) so it doesn't collide with manual exploration done on treino 1.
test("criar exercício, executar sessão e ver no histórico", async ({ page }) => {
  // 1) Criar exercício na biblioteca.
  await page.goto("/exercicios");
  await page.getByRole("button", { name: /novo exercício/i }).click();
  const nomeExercicio = `Teste E2E ${Date.now()}`;
  await page.locator("#exercicio-nome").fill(nomeExercicio);
  await page.getByRole("button", { name: "Criar exercício" }).click();
  await expect(page.getByText(nomeExercicio)).toBeVisible({ timeout: 5000 });

  // 2) Executar uma sessão guiada do treino "Pull" (id 2): marcar a 1ª série de cada
  //    exercício como concluída. Usamos sempre `.first()` porque, ao marcar uma série, o
  //    aria-label do botão muda de "Marcar..." para "Desmarcar...", então o índice de um
  //    locator estático fica obsoleto a cada clique — reconsultar o primeiro é o jeito
  //    robusto de varrer todos sem depender de posição.
  await page.goto("/treinos/2");
  await expect(page.locator("h1")).toHaveText("Pull");
  const botaoMarcar = page.locator('button[aria-label^="Marcar série 1"]');
  const totalExercicios = await botaoMarcar.count();
  expect(totalExercicios).toBeGreaterThan(0);
  for (let i = 0; i < totalExercicios; i++) {
    await botaoMarcar.first().click();
    await expect(botaoMarcar).toHaveCount(totalExercicios - (i + 1));
  }
  await page.getByRole("button", { name: /finalizar treino/i }).click();
  await page.waitForURL(/\/treinos\/historico/, { timeout: 10_000 });

  // 3) Ver a sessão recém-concluída no histórico.
  await expect(page.locator("h1")).toHaveText("Histórico de treinos");
  await expect(page.getByText("Pull").first()).toBeVisible();
});
