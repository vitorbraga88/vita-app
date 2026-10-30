import { getDb } from "@/lib/db/client";
import { getConfig } from "./configuracao";
import { agoraRecifeISO, paraHorarioRecife } from "@/lib/domain/configuracao/horario";

export interface SuplementoInput {
  nome: string;
  dose: number;
  unidade: string;
  horarios: string[];
  estoque: number;
  doses_por_embalagem: number;
  ativo: boolean;
}
export interface Suplemento extends Omit<SuplementoInput, "ativo"> { id: number; usuario_id: number; ativo: boolean; criado_em: string }
export interface DoseLog { id: number; suplemento_id: number; data: string; horario: string; tomado_em: string; nome: string }
type Linha = Omit<Suplemento, "horarios" | "ativo"> & { horarios: string; ativo: number };

function validar(input: SuplementoInput): SuplementoInput {
  const nome = input.nome.trim();
  const unidade = input.unidade.trim();
  if (!nome || nome.length > 100 || !["g", "mg", "caps", "ml"].includes(unidade) || !Number.isFinite(input.dose) || input.dose <= 0 || !Number.isFinite(input.estoque) || input.estoque < 0 || !Number.isInteger(input.doses_por_embalagem) || input.doses_por_embalagem <= 0 || !Array.isArray(input.horarios) || !input.horarios.length || typeof input.ativo !== "boolean") throw new Error("Preencha nome, dose, unidade, horários e estoque válidos.");
  const horarios = [...new Set(input.horarios.map((h) => paraHorarioRecife(h).slice(0, 5)))].sort();
  return { ...input, nome, unidade, horarios };
}
function transformar(linha: Linha): Suplemento { return { ...linha, horarios: JSON.parse(linha.horarios), ativo: Boolean(linha.ativo) }; }
export function listarSuplementos(usuarioId: number): Suplemento[] {
  return (getDb().prepare("SELECT * FROM suplemento WHERE usuario_id = ? ORDER BY ativo DESC, nome, id").all(usuarioId) as Linha[]).map(transformar);
}
export function salvarSuplemento(usuarioId: number, dados: SuplementoInput, id?: number): Suplemento {
  const item = validar(dados);
  const db = getDb();
  const valores = [item.nome, item.dose, item.unidade, JSON.stringify(item.horarios), item.estoque, item.doses_por_embalagem, Number(item.ativo)];
  if (id !== undefined) {
    const result = db.prepare("UPDATE suplemento SET nome=?, dose=?, unidade=?, horarios=?, estoque=?, doses_por_embalagem=?, ativo=? WHERE id=? AND usuario_id=?").run(...valores, id, usuarioId);
    if (!result.changes) throw new Error("Suplemento não encontrado.");
  } else {
    id = Number(db.prepare("INSERT INTO suplemento (nome,dose,unidade,horarios,estoque,doses_por_embalagem,ativo,usuario_id,criado_em) VALUES (?,?,?,?,?,?,?,?,?)").run(...valores, usuarioId, agoraRecifeISO()).lastInsertRowid);
  }
  return transformar(db.prepare("SELECT * FROM suplemento WHERE id=? AND usuario_id=?").get(id, usuarioId) as Linha);
}
export function excluirSuplemento(usuarioId: number, id: number): void {
  if (!getDb().prepare("DELETE FROM suplemento WHERE id=? AND usuario_id=?").run(id, usuarioId).changes) throw new Error("Suplemento não encontrado.");
}
export function marcarDose(usuarioId: number, id: number, data: string, horario: string): boolean {
  const hora = paraHorarioRecife(horario).slice(0, 5);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data) || Number.isNaN(Date.parse(`${data}T00:00:00Z`)) || new Date(`${data}T00:00:00Z`).toISOString().slice(0, 10) !== data) throw new Error("Data inválida.");
  const db = getDb();
  return db.transaction(() => {
    const item = db.prepare("SELECT * FROM suplemento WHERE id=? AND usuario_id=?").get(id, usuarioId) as Linha | undefined;
    if (!item || !item.ativo || !(JSON.parse(item.horarios) as string[]).includes(hora)) throw new Error("Suplemento ou horário não encontrado.");
    if (db.prepare("SELECT 1 FROM dose_log WHERE suplemento_id=? AND data=? AND horario=?").get(id, data, hora)) return false;
    if (item.estoque < item.dose) throw new Error("Estoque insuficiente para esta dose.");
    db.prepare("INSERT INTO dose_log (suplemento_id,data,horario,tomado_em) VALUES (?,?,?,?)").run(id, data, hora, agoraRecifeISO());
    db.prepare("UPDATE suplemento SET estoque=estoque-dose WHERE id=? AND usuario_id=?").run(id, usuarioId);
    return true;
  })();
}
export function listarDoses(usuarioId: number, inicio: string, fim: string): DoseLog[] {
  return getDb().prepare("SELECT d.*, s.nome FROM dose_log d JOIN suplemento s ON s.id=d.suplemento_id WHERE s.usuario_id=? AND d.data BETWEEN ? AND ? ORDER BY d.data DESC, d.horario DESC, d.id DESC").all(usuarioId, inicio, fim) as DoseLog[];
}
export function listarLegados(usuarioId: number) {
  const legados = getConfig(usuarioId, "suplementacao.itens");
  const convertidos = getDb().prepare("SELECT indice, nome, horario FROM suplemento_legado WHERE usuario_id=?").all(usuarioId) as { indice: number; nome: string; horario: string }[];
  return legados.map((item, indice) => ({ ...item, indice, convertido: convertidos.some((c) => c.indice === indice && c.nome === item.nome && c.horario === item.horario) }));
}
export function converterLegado(usuarioId: number, indice: number, dados: SuplementoInput): Suplemento {
  const db = getDb();
  return db.transaction(() => {
    const antigo = getConfig(usuarioId, "suplementacao.itens")[indice];
    if (!antigo || !Number.isInteger(indice) || indice < 0) throw new Error("Item antigo não encontrado.");
    if (db.prepare("SELECT 1 FROM suplemento_legado WHERE usuario_id=? AND indice=? AND nome=? AND horario=?").get(usuarioId, indice, antigo.nome, antigo.horario)) throw new Error("Este item já foi convertido.");
    const novo = salvarSuplemento(usuarioId, dados);
    db.prepare("INSERT INTO suplemento_legado (usuario_id,indice,nome,horario,suplemento_id) VALUES (?,?,?,?,?)").run(usuarioId, indice, antigo.nome, antigo.horario, novo.id);
    return novo;
  })();
}
