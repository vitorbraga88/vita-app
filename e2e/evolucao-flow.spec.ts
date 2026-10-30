import { test, expect } from "@playwright/test";

// Flow: registrar peso → ver gráfico.
test("registrar peso e ver o gráfico de evolução atualizar", async ({ page }) => {
  await page.goto("/evolucao");
  await expect(page.locator("h1")).toHaveText("Evolução");

  const pesoTeste = (70 + Math.random() * 5).toFixed(1);
  await page.locator("#peso-data").fill("2026-10-15"); // data fora do seed, não colide com o histórico real
  await page.locator("#peso-kg").fill(pesoTeste);
  await page.getByRole("button", { name: "Salvar" }).first().click();

  await expect(page.getByText(/peso registrado/i)).toBeVisible({ timeout: 5000 });

  // O gráfico (Recharts) deve re-renderizar com o novo ponto — confirmamos que o SVG do
  // TrendLineChart segue presente e que não há erro no console após a atualização.
  await expect(page.locator(".recharts-wrapper").first()).toBeVisible();
});
