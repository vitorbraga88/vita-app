import { rmSync } from "node:fs";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
import { getDb } from "@/lib/db/client";
import { getMeta } from "@/lib/db/repositories/meta";
import { getAllConfig } from "@/lib/db/repositories/configuracao";
import { importarConfiguracoesAction, salvarConfigAction, salvarMetaManualAction } from "@/app/ajustes/actions";
import { GET as exportar } from "@/app/ajustes/exportar/route";
import { registrarPesoAction } from "@/app/evolucao/actions";
const arquivo = path.join(process.cwd(), "data", "vita.test-nutricao-metas.db");
process.env.VITA_DB_PATH = arquivo;
for (const suffix of ["", "-wal", "-shm"]) rmSync(arquivo + suffix, { force: true });
beforeAll(() => {
  const db = getDb();
  db.prepare("INSERT INTO usuario (id,nome,email,altura_cm,data_nascimento,sexo) VALUES (1,'Teste','nutricao-metas@vita.app',178,'1996-04-12','masculino')").run();
  db.prepare("INSERT INTO peso_registro (usuario_id,data,peso_kg) VALUES (1,'2026-10-28',80.6)").run();
  db.prepare("INSERT INTO meta (usuario_id,tipo,valor_alvo) VALUES (1,'kcal_dia',2300),(1,'proteina_g_dia',140),(1,'carbo_g_dia',250),(1,'gordura_g_dia',70)").run();
});
afterAll(() => { getDb().close(); for (const suffix of ["", "-wal", "-shm"]) rmSync(arquivo + suffix, { force: true }); });

describe("metas de nutrição", () => {
  it("persiste overrides automáticos e restaura metas manuais ao trocar de modo", async () => {
    expect((await salvarConfigAction("nutricao.kcal_modo", "auto")).ok).toBe(true);
    expect((await salvarConfigAction("nutricao.macros_modo", "auto")).ok).toBe(true);
    await salvarConfigAction("nutricao.override_tmb", 1800);
    await salvarConfigAction("nutricao.override_fator", 1.2);
    await salvarConfigAction("nutricao.override_kcal", 2000);
    await salvarConfigAction("nutricao.override_proteina", 150);
    await salvarConfigAction("nutricao.override_gordura", 50);
    await salvarConfigAction("nutricao.override_carbo", 100);
    expect(getMeta(1, "kcal_dia")?.valor_alvo).toBe(2000);
    expect(getMeta(1, "proteina_g_dia")?.valor_alvo).toBe(150);
    expect(getMeta(1, "gordura_g_dia")?.valor_alvo).toBe(50);
    expect(getMeta(1, "carbo_g_dia")?.valor_alvo).toBe(100);
    expect(getAllConfig(1)["nutricao.override_fator"]).toBe(1.2);
    await salvarConfigAction("nutricao.kcal_modo", "manual");
    await salvarConfigAction("nutricao.macros_modo", "manual");
    expect(getMeta(1, "kcal_dia")?.valor_alvo).toBe(2300);
    expect(getMeta(1, "proteina_g_dia")?.valor_alvo).toBe(140);
    expect(getMeta(1, "carbo_g_dia")?.valor_alvo).toBe(250);
    expect(getMeta(1, "gordura_g_dia")?.valor_alvo).toBe(70);
    await salvarMetaManualAction("kcal_dia", 2400);
    await salvarConfigAction("nutricao.override_tmb", 1900);
    expect(getMeta(1, "kcal_dia")?.valor_alvo).toBe(2400);
  });

  it("importa overrides e metas manuais sem substituir escolhas por valores automáticos", async () => {
    const resultado = await importarConfiguracoesAction(JSON.stringify({ configuracoes: {
      "nutricao.kcal_modo": "manual", "nutricao.macros_modo": "manual",
      "nutricao.manual_kcal": 2200, "nutricao.manual_proteina": 160,
      "nutricao.override_kcal": 2100,
    } }));
    expect(resultado.ok).toBe(true);
    expect(getMeta(1, "kcal_dia")?.valor_alvo).toBe(2200);
    expect(getMeta(1, "proteina_g_dia")?.valor_alvo).toBe(160);
    expect(getAllConfig(1)["nutricao.override_kcal"]).toBe(2100);
  });
});

  it("exporta as metas manuais existentes junto das configurações", async () => {
    const dados = await exportar().json();
    expect(dados.configuracoes["nutricao.manual_kcal"]).toBe(2200);
    expect(dados.configuracoes["nutricao.manual_proteina"]).toBe(160);
    expect(dados.configuracoes["nutricao.override_kcal"]).toBe(2100);
  });

  it("recalcula metas automáticas após registrar uma pesagem", async () => {
    await salvarConfigAction("nutricao.override_kcal", null);
    await salvarConfigAction("nutricao.override_proteina", null);
    await salvarConfigAction("nutricao.kcal_modo", "auto");
    await salvarConfigAction("nutricao.macros_modo", "auto");
    await registrarPesoAction("2026-10-30", 90);
    expect(getMeta(1, "proteina_g_dia")?.valor_alvo).toBe(180);
  });
