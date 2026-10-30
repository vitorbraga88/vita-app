"use client";

import type { ConfigCompleta } from "@/lib/domain/configuracao/catalogo";
import { CampoSelect, CampoSwitch } from "./campos";
import { Secao } from "./Secao";
import { useConfig } from "./useSalvavel";

/** Mirrors the root layout's <html data-*> immediately; the server render on the next request
 * (revalidated by the action) reads the same values from the database — no localStorage. */
function aplicarNoDocumento(atributo: string, valor: string) {
  document.documentElement.setAttribute(atributo, valor);
}

export function SecaoAparencia({ config }: { config: ConfigCompleta }) {
  const [tema, setTema] = useConfig("aparencia.tema", config["aparencia.tema"], (v) => aplicarNoDocumento("data-theme", v));
  const [densidade, setDensidade] = useConfig("aparencia.densidade", config["aparencia.densidade"], (v) =>
    aplicarNoDocumento("data-densidade", v)
  );
  const [idioma, setIdioma] = useConfig("aparencia.idioma", config["aparencia.idioma"]);
  const [reduzir, setReduzir] = useConfig("aparencia.reduzir_movimento", config["aparencia.reduzir_movimento"], (v) =>
    aplicarNoDocumento("data-movimento", v ? "reduzido" : "sistema")
  );
  const [fonte, setFonte] = useConfig("aparencia.tamanho_fonte", config["aparencia.tamanho_fonte"], (v) =>
    aplicarNoDocumento("data-fonte", v)
  );

  return (
    <Secao id="aparencia" titulo="Aparência">
      <CampoSelect
        rotulo="Tema"
        valor={tema}
        opcoes={[
          { valor: "dark", rotulo: "Escuro" },
          { valor: "light", rotulo: "Claro" },
          { valor: "sistema", rotulo: "Seguir o sistema" },
        ]}
        onMudar={setTema}
      />
      <CampoSelect
        rotulo="Densidade"
        valor={densidade}
        opcoes={[
          { valor: "confortavel", rotulo: "Confortável" },
          { valor: "compacto", rotulo: "Compacto" },
        ]}
        onMudar={setDensidade}
      />
      <CampoSelect
        rotulo="Idioma"
        descricao="Português (Brasil) é o único idioma disponível."
        valor={idioma}
        opcoes={[{ valor: "pt-BR", rotulo: "Português (Brasil)" }]}
        onMudar={setIdioma}
      />
      <CampoSwitch
        rotulo="Reduzir movimento"
        descricao="Desligado, o app segue a preferência de movimento do sistema."
        valor={reduzir}
        onMudar={setReduzir}
      />
      <CampoSelect
        rotulo="Tamanho da fonte"
        valor={fonte}
        opcoes={[
          { valor: "normal", rotulo: "Normal" },
          { valor: "grande", rotulo: "Grande" },
        ]}
        onMudar={setFonte}
      />
    </Secao>
  );
}
