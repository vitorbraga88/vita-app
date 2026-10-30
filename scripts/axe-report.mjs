#!/usr/bin/env node
// Runs @axe-core/playwright against every route and prints violations.
// Run with `node scripts/axe-report.mjs` (dev server must be running on :3900).
import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";

const ROTAS = ["/", "/treinos", "/treinos/1", "/treinos/historico", "/exercicios", "/evolucao", "/nutricao", "/ajustes"];

const browser = await chromium.launch();
let totalCritico = 0;
let totalSerio = 0;

for (const rota of ROTAS) {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(`http://localhost:3900${rota}`, { waitUntil: "networkidle" });
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();

  console.log(`\n=== ${rota} ===`);
  if (results.violations.length === 0) {
    console.log("  nenhuma violação");
  } else {
    for (const v of results.violations) {
      console.log(`  [${v.impact}] ${v.id}: ${v.description} (${v.nodes.length} nó(s))`);
      if (v.impact === "critical") totalCritico += v.nodes.length;
      if (v.impact === "serious") totalSerio += v.nodes.length;
    }
  }
  await context.close();
}

await browser.close();

console.log(`\n=== RESUMO ===`);
console.log(`Violações críticas: ${totalCritico}`);
console.log(`Violações sérias: ${totalSerio}`);
if (totalCritico > 0) {
  console.error("FALHA: há violações críticas.");
  process.exit(1);
}
console.log("OK: zero violações críticas (WCAG2A/AA).");
