import { describe, expect, it } from "vitest";
import { agendaTreino } from "./agenda";
import { paraLocalSQLRecife } from "./contrato";

const base = {
  "treino.ativo": true,
  "treino.lembrete_hora": "18:00:00-03:00",
  "treino.lembrete_antecedencia_min": 30,
  "notificacoes.silencio_ativo": false,
  "notificacoes.silencio_inicio": "22:30:00-03:00",
  "notificacoes.silencio_fim": "07:00:00-03:00",
} as const;

describe("agenda de alarmes do relógio", () => {
  it("cria os próximos 7 dias com antecedência, pulando o horário de hoje que já passou", () => {
    const alarmes = agendaTreino(base, new Date("2026-10-30T17:45:00-03:00"), "Push");
    expect(alarmes).toHaveLength(6);
    expect(alarmes[0]).toEqual({
      chave: "2026-10-31:treino",
      em: Date.parse("2026-10-31T17:30:00-03:00") / 1000,
      titulo: "Hora do treino",
      mensagem: "Push às 18:00",
    });
    expect(alarmes.at(-1)?.chave).toBe("2026-11-05:treino");
  });

  it("inclui hoje quando o alarme ainda está por vir", () => {
    expect(agendaTreino(base, new Date("2026-10-30T09:00:00-03:00"), "Push")).toHaveLength(7);
  });

  it("não agenda com o lembrete de treino desligado ou dentro do silêncio", () => {
    expect(agendaTreino({ ...base, "treino.ativo": false }, new Date("2026-10-30T09:00:00-03:00"), "Push")).toEqual([]);
    const silencio = { ...base, "notificacoes.silencio_ativo": true, "notificacoes.silencio_inicio": "17:00:00-03:00", "notificacoes.silencio_fim": "18:00:00-03:00" };
    expect(agendaTreino(silencio, new Date("2026-10-30T09:00:00-03:00"), "Push")).toEqual([]);
  });

  it("limita a mensagem a 40 caracteres e funciona sem treino cadastrado", () => {
    const [longo] = agendaTreino(base, new Date("2026-10-30T09:00:00-03:00"), "Treino com um nome realmente comprido demais");
    expect([...longo.mensagem].length).toBeLessThanOrEqual(40);
    expect(agendaTreino(base, new Date("2026-10-30T09:00:00-03:00"), null)[0].mensagem).toBe("Seu treino às 18:00");
  });

  it("converte instantes de qualquer offset para o relógio de Recife", () => {
    expect(paraLocalSQLRecife(Date.parse("2026-10-31T21:07:00Z"))).toBe("2026-10-31 18:07:00");
  });
});
