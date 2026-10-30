import { describe, expect, it } from "vitest";
import { agoraRecifeISO, dataLocalRecife, horarioParaInput, offsetRecife, paraHorarioRecife } from "./horario";

// 2026-10-30T02:30:00Z is still 29/10 23:30 in Recife — the classic UTC rollover trap.
const MADRUGADA_UTC = new Date("2026-10-30T02:30:00Z");

describe("horários em America/Recife", () => {
  it("usa o offset de Recife, não o do servidor nem UTC", () => {
    expect(offsetRecife(MADRUGADA_UTC)).toBe("-03:00");
  });

  it("grava horário de relógio com segundos e offset -03:00", () => {
    expect(paraHorarioRecife("07:30", MADRUGADA_UTC)).toBe("07:30:00-03:00");
    expect(paraHorarioRecife("07:30:00-03:00", MADRUGADA_UTC)).toBe("07:30:00-03:00");
  });

  it("recusa horário em UTC ou com outro offset", () => {
    expect(() => paraHorarioRecife("10:30:00Z", MADRUGADA_UTC)).toThrow();
    expect(() => paraHorarioRecife("10:30:00+00:00", MADRUGADA_UTC)).toThrow();
    expect(() => paraHorarioRecife("25:00", MADRUGADA_UTC)).toThrow();
  });

  it("converte o valor salvo de volta para o input type=time", () => {
    expect(horarioParaInput("07:30:00-03:00")).toBe("07:30");
  });

  it("carimbo e data local seguem o calendário de Recife", () => {
    expect(agoraRecifeISO(MADRUGADA_UTC)).toBe("2026-10-29T23:30:00-03:00");
    expect(dataLocalRecife(MADRUGADA_UTC)).toBe("2026-10-29");
  });
});
