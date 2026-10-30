import { describe, expect, it } from "vitest";
import { dentroDaJanela, emSilencio, ultimoHorarioAgua } from "./agendamento";

describe("regras de agendamento", () => {
  it("limita recuperação a 30 minutos incluindo o limite", () => {
    expect(dentroDaJanela(630, 600)).toBe(true);
    expect(dentroDaJanela(631, 600)).toBe(false);
    expect(dentroDaJanela(599, 600)).toBe(false);
  });
  it("interpreta silêncio atravessando meia-noite", () => {
    expect(emSilencio(23 * 60, 22 * 60 + 30, 7 * 60)).toBe(true);
    expect(emSilencio(6 * 60, 22 * 60 + 30, 7 * 60)).toBe(true);
    expect(emSilencio(7 * 60, 22 * 60 + 30, 7 * 60)).toBe(false);
  });
  it("recupera apenas o horário de água mais recente, sem rajada", () => {
    expect(ultimoHorarioAgua(630, 420, 1320, 15)).toBe(630);
    expect(ultimoHorarioAgua(430, 420, 1320, 60)).toBe(420);
    expect(ultimoHorarioAgua(410, 420, 1320, 60)).toBeNull();
    expect(ultimoHorarioAgua(1360, 420, 1320, 60)).toBeNull();
  });
});
