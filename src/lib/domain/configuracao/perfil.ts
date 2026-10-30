import { ErroConfiguracao } from "./catalogo";

// Identity fields stay in the `usuario` table; /ajustes edits them one field at a time.
export const CAMPOS_PERFIL = ["nome", "email", "data_nascimento", "sexo", "altura_cm"] as const;
export type CampoPerfil = (typeof CAMPOS_PERFIL)[number];

const SEXOS = ["masculino", "feminino", "outro"] as const;

function erro(motivo: string): never {
  throw new ErroConfiguracao(motivo);
}

/** Validates and canonicalizes one profile field. `hoje` is the Recife calendar date. */
export function validarCampoPerfil(campo: CampoPerfil, valor: unknown, hoje: string): string | number | null {
  // Server Actions are public POST endpoints: the TS union is not enforced at runtime, and the
  // repository interpolates `campo` as a column name — reject anything outside the whitelist.
  if (!CAMPOS_PERFIL.includes(campo)) erro(`Campo de perfil desconhecido: ${String(campo)}`);
  switch (campo) {
    case "nome": {
      const nome = typeof valor === "string" ? valor.trim() : "";
      return nome.length >= 1 && nome.length <= 80 ? nome : erro("Informe um nome de 1 a 80 caracteres.");
    }
    case "email": {
      const email = typeof valor === "string" ? valor.trim().toLowerCase() : "";
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : erro("E-mail inválido.");
    }
    case "altura_cm":
      if (valor === null) return null;
      return typeof valor === "number" && valor >= 100 && valor <= 250 ? valor : erro("Altura entre 100 e 250 cm.");
    case "sexo":
      if (valor === null) return null;
      return SEXOS.includes(valor as (typeof SEXOS)[number]) ? (valor as string) : erro("Sexo inválido.");
    case "data_nascimento": {
      if (valor === null) return null;
      if (typeof valor !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(valor)) erro("Data no formato AAAA-MM-DD.");
      const data = new Date(`${valor}T12:00:00Z`);
      if (Number.isNaN(data.getTime()) || data.toISOString().slice(0, 10) !== valor) erro("Data inexistente.");
      if (valor >= hoje || valor < "1900-01-01") erro("Data de nascimento fora do intervalo.");
      return valor;
    }
  }
}
