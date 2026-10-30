import { expect, test } from "@playwright/test";

test("abre demonstrações locais da biblioteca para exercícios existentes e importados", async ({ page }) => {
  await page.goto("/exercicios");

  await page.getByRole("button", { name: "Ver demonstração de Supino reto", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Supino reto" })).toBeVisible();
  const video = page.getByLabel("Demonstração em vídeo de Supino reto");
  await expect(video).toHaveAttribute("preload", "metadata");
  await expect.poll(() => video.evaluate((element) => (element as HTMLVideoElement).videoWidth)).toBe(180);
  await expect.poll(() => video.evaluate((element) => (element as HTMLVideoElement).videoHeight)).toBe(180);
  await expect(page.getByRole("heading", { name: "Como executar" })).toBeVisible();
  await expect(page.getByText("Deite-se em um banco com os pés apoiados no chão e as costas pressionadas contra o banco.")).toBeVisible();

  await page.getByRole("button", { name: "Fechar" }).click();
  await page.getByLabel("Buscar exercício por nome").fill("abdução de quadril sentado com faixa elástica");
  await page.getByRole("button", { name: "Ver demonstração de abdução de quadril sentado com faixa elástica" }).click();
  const importado = page.getByLabel("Demonstração em vídeo de abdução de quadril sentado com faixa elástica");
  await expect(importado).toHaveAttribute("preload", "metadata");
  await expect.poll(() => importado.evaluate((element) => (element as HTMLVideoElement).videoWidth)).toBe(180);
});

test("exibe clipes locais na sessão guiada", async ({ page }) => {
  await page.goto("/treinos/1");
  await page.getByRole("button", { name: "Ver demonstração de Supino reto" }).click();

  const clip = page.getByLabel("Demonstração em vídeo de Supino reto");
  await expect(clip).toBeVisible();
  await expect(clip).toHaveAttribute("preload", "metadata");
  await expect.poll(() => clip.evaluate((element) => (element as HTMLVideoElement).videoWidth)).toBe(180);
});

test("mostra thumbnails no editor de composição do treino", async ({ page }) => {
  await page.goto("/treinos");

  await page.getByRole("button", { name: "Editar exercícios" }).first().click();
  await expect(page.getByRole("heading", { name: /Exercícios — Push/ })).toBeVisible();
  const thumbnail = page.getByAltText("Demonstração de Supino reto");
  await expect(thumbnail).toBeVisible();
  await expect(thumbnail).toHaveAttribute("loading", "lazy");
});

test("abre a demonstração pela thumbnail da sessão guiada", async ({ page }) => {
  await page.goto("/treinos/1");

  await page.getByRole("button", { name: "Ver demonstração de Supino reto" }).click();
  await expect(page.getByRole("heading", { name: "Supino reto" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Como executar" })).toBeVisible();
});
