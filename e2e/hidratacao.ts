import { expect, type Locator } from "@playwright/test";

/**
 * `networkidle` does not mean React has hydrated: under parallel load a click can land on
 * server-rendered markup with no handler and be silently lost. Wait until React has attached
 * its fiber to the element we are about to interact with.
 */
export async function esperarHidratacao(alvo: Locator): Promise<void> {
  await expect.poll(() => alvo.evaluate((el) => Object.keys(el).some((k) => k.startsWith("__reactFiber"))), {
    message: "React não hidratou o elemento",
  }).toBe(true);
}
