import { rmSync } from "node:fs";
import path from "node:path";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { getDb } from "@/lib/db/client";
import { setConfig, getConfig } from "./configuracao";
import * as repo from "./suplemento";

const arquivo = path.join(process.cwd(), "data", "vita.test-suplemento.db");
process.env.VITA_DB_PATH = "data/vita.test-suplemento.db";
function limpar() { for (const s of ["", "-wal", "-shm"]) rmSync(arquivo + s, { force: true }); }
limpar();
let usuario = 0;
let outro = 0;
const dados = { nome: "Creatina", dose: 5, unidade: "g", horarios: ["08:00"], estoque: 20, doses_por_embalagem: 30, ativo: true };
beforeAll(() => {
  usuario = Number(getDb().prepare("INSERT INTO usuario (nome,email) VALUES ('Teste','s@vita.app')").run().lastInsertRowid);
  outro = Number(getDb().prepare("INSERT INTO usuario (nome,email) VALUES ('Outro','o@vita.app')").run().lastInsertRowid);
});
beforeEach(() => {
  getDb().prepare("DELETE FROM suplemento_legado").run();
  getDb().prepare("DELETE FROM suplemento").run();
  getDb().prepare("DELETE FROM configuracao").run();
});
afterAll(() => { getDb().close(); limpar(); });

describe("suplementos", () => {
  it("desconta a dose apenas uma vez e impede acesso por outro usuário", () => {
    const item = repo.salvarSuplemento(usuario, dados);
    expect(repo.marcarDose(usuario, item.id, "2026-10-30", "08:00")).toBe(true);
    expect(repo.marcarDose(usuario, item.id, "2026-10-30", "08:00")).toBe(false);
    expect(repo.listarSuplementos(usuario)[0].estoque).toBe(15);
    expect(() => repo.marcarDose(outro, item.id, "2026-10-30", "08:00")).toThrow();
  });
  it("não registra dose se o estoque for insuficiente", () => {
    const item = repo.salvarSuplemento(usuario, { ...dados, estoque: 4 });
    expect(() => repo.marcarDose(usuario, item.id, "2026-10-30", "08:00")).toThrow();
    expect(repo.listarDoses(usuario, "2026-10-30", "2026-10-30")).toEqual([]);
  });
  it("converte item legado uma única vez sem alterar a configuração", () => {
    setConfig(usuario, "suplementacao.itens", [{ nome: "Creatina", horario: "08:00" }]);
    const item = repo.converterLegado(usuario, 0, dados);
    expect(() => repo.converterLegado(usuario, 0, dados)).toThrow();
    expect(repo.listarSuplementos(usuario).map((s) => s.id)).toEqual([item.id]);
    expect(getConfig(usuario, "suplementacao.itens")).toHaveLength(1);
  });
  it("exclui apenas o próprio suplemento e mantém histórico dos demais", () => {
    const item = repo.salvarSuplemento(usuario, dados);
    expect(() => repo.excluirSuplemento(outro, item.id)).toThrow();
    repo.excluirSuplemento(usuario, item.id);
    expect(repo.listarSuplementos(usuario)).toEqual([]);
  });
});
