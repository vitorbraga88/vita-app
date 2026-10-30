import { expect, test } from "@playwright/test";

test("registra e desfaz água sem alterar o restante do dia", async ({ page }) => {
  await page.goto("/agua", { waitUntil: "networkidle" });
  const desfazer = page.getByRole("button", { name: "Desfazer último registro de hoje" });
  await page.getByRole("button", { name: /\+ 250 ml/ }).click();
  await expect(desfazer).toBeEnabled();
  await desfazer.click();
  await expect(desfazer).toBeDisabled();
});
test("meta automática de água e aviso de histórico são exibidos", async ({ page }) => {
  await page.goto("/agua", { waitUntil: "networkidle" });
  await expect(page.getByText(/meta diária automática/)).toBeVisible();
  await expect(page.getByText(/se a meta mudar, o histórico será recalculado/)).toBeVisible();
  await page.goto("/suplementos", { waitUntil: "networkidle" });
  await expect(page.getByText(/Se os horários ou suplementos ativos mudarem/)).toBeVisible();
});


test("registra dose e desconta estoque na interface", async ({ page }) => {
  await page.goto("/suplementos", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Novo suplemento" }).click();
  await page.getByLabel("Nome", { exact: true }).fill("Creatina E2E");
  await page.getByLabel("Dose", { exact: true }).fill("5");
  await page.getByRole("combobox", { name: "Unidade" }).selectOption("g");
  await page.getByLabel("Estoque na mesma unidade da dose").fill("20");
  await page.getByLabel("Doses por embalagem").fill("30");
  await page.getByLabel(/Horários \(separados/).fill("08:00");
  await page.getByRole("button", { name: "Salvar suplemento" }).click();
  await expect(page.getByText("Estoque: 20 g", { exact: false })).toBeVisible();
  await page.getByRole("button", { name: "08:00 · Marcar como tomada" }).click();
  await expect(page.getByText("Estoque: 15 g", { exact: false })).toBeVisible();
  await expect(page.getByRole("button", { name: "08:00 · Tomada" })).toBeDisabled();
});

test("mostra média móvel e formulário de pesagem no destino do aviso", async ({ page }) => {
  await page.goto("/evolucao#registrar-peso", { waitUntil: "networkidle" });
  await expect(page.locator("#registrar-peso")).toBeVisible();
  await expect(page.getByText("Média de 7 dias", { exact: true })).toBeVisible();
});
