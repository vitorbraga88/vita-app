import { test, expect } from "@playwright/test";

// Flow: registrar refeição → ver macros.
test("adicionar item a uma refeição e ver os macros do dia atualizarem", async ({ page }) => {
  await page.goto("/nutricao");
  await expect(page.locator("h1")).toHaveText("Nutrição");

  const totalCard = page.locator('[data-slot=card]').filter({ hasText: "Total do dia" });
  const kcalAntes = await totalCard.locator("span.font-num").first().textContent();

  await page.locator('button[aria-label="Adicionar item em Ceia"]').click();
  await page.locator("#busca-alimento").fill("Banana");
  await page.getByRole("button", { name: /^Banana/ }).click();
  await page.locator("#quantidade-g").fill("120");
  await page.getByRole("button", { name: "Adicionar" }).click();

  await expect(page.getByText(/banana adicionado em ceia/i)).toBeVisible({ timeout: 5000 });

  // revalidatePath após a Server Action é assíncrono em relação ao toast — espera o DOM
  // realmente refletir o novo total em vez de ler no instante do toast.
  const kcalAntesNum = Number(kcalAntes);
  await expect(async () => {
    const atual = Number(await totalCard.locator("span.font-num").first().textContent());
    expect(atual).toBeGreaterThan(kcalAntesNum);
  }).toPass({ timeout: 5000 });
});
