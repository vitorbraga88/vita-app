import { expect, test } from "@playwright/test";

test("Hoje está disponível na navegação móvel e reúne os dados do dia", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("navigation", { name: "Navegação principal" }).getByRole("link", { name: "Hoje" }).click();
  await expect(page).toHaveURL(/\/hoje$/);
  await expect(page.getByRole("heading", { name: "Água" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Suplementos" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Treino" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Refeições" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Hoje" })).toHaveAttribute("aria-current", "page");
});

test("manifesto abre a experiência diária sem substituir o dashboard", async ({ request }) => {
  const manifest = await request.get("/manifest.webmanifest");
  expect(manifest.ok()).toBeTruthy();
  const data = await manifest.json();
  expect(data.start_url).toBe("/hoje");
  expect(data.display).toBe("standalone");
  expect((await request.get("/")).ok()).toBeTruthy();
});
