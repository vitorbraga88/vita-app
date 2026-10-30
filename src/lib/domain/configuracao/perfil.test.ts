import { describe, expect, it } from "vitest";
import { validarCampoPerfil } from "./perfil";

const HOJE = "2026-10-30";

describe("campos de perfil gravados em usuario", () => {
  it("normaliza valores válidos", () => {
    expect(validarCampoPerfil("nome", "  Gabriel Souza ", HOJE)).toBe("Gabriel Souza");
    expect(validarCampoPerfil("email", " Gabriel@Vita.App ", HOJE)).toBe("gabriel@vita.app");
    expect(validarCampoPerfil("altura_cm", 178, HOJE)).toBe(178);
    expect(validarCampoPerfil("data_nascimento", "1996-04-12", HOJE)).toBe("1996-04-12");
    expect(validarCampoPerfil("sexo", "feminino", HOJE)).toBe("feminino");
    expect(validarCampoPerfil("altura_cm", null, HOJE)).toBeNull();
  });

  it("rejeita valores que quebrariam o cálculo automático ou o banco", () => {
    expect(() => validarCampoPerfil("nome", "   ", HOJE)).toThrow();
    expect(() => validarCampoPerfil("email", "sem-arroba", HOJE)).toThrow();
    expect(() => validarCampoPerfil("altura_cm", 30, HOJE)).toThrow();
    expect(() => validarCampoPerfil("data_nascimento", "2027-01-01", HOJE)).toThrow();
    expect(() => validarCampoPerfil("data_nascimento", "1996-02-30", HOJE)).toThrow();
    expect(() => validarCampoPerfil("sexo", "x", HOJE)).toThrow();
  });

  it("recusa coluna fora da whitelist (o repositório interpola o nome do campo)", () => {
    expect(() => validarCampoPerfil("objetivo = 'x' --" as never, "x", HOJE)).toThrow(/desconhecido/);
    expect(() => validarCampoPerfil("aparencia" as never, "light", HOJE)).toThrow(/desconhecido/);
  });
});