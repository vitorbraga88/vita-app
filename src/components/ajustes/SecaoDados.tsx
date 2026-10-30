"use client";

import { useId, useRef, useState, useTransition } from "react";
import { DatabaseBackup, Download, Eraser, Upload } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { backupManualAction, importarConfiguracoesAction, limparDadosTesteAction } from "@/app/ajustes/actions";
import { Secao } from "./Secao";
import { avisarResultado, chamarAcao } from "./useSalvavel";

function Acao({ titulo, descricao, children }: { titulo: string; descricao: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-[var(--s-3)] sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col gap-0.5">
        <span className="text-[length:var(--t-fn)] font-medium text-fg-0">{titulo}</span>
        <span className="text-[length:var(--t-cap)] text-fg-2">{descricao}</span>
      </div>
      {children}
    </div>
  );
}

export function SecaoDados() {
  const idArquivo = useId();
  const arquivo = useRef<HTMLInputElement>(null);
  const [pendente, iniciar] = useTransition();
  const [ultimoBackup, setUltimoBackup] = useState<string | null>(null);

  async function importar(file: File) {
    const conteudo = await file.text();
    const r = await chamarAcao(() => importarConfiguracoesAction(conteudo));
    avisarResultado(r, r.ok ? `${r.valor} ajustes importados` : undefined);
    if (r.ok) window.location.reload();
  }

  return (
    <Secao id="dados" titulo="Dados">
      <p className="text-[length:var(--t-fn)] text-fg-1">Exportar, importar e limpar afetam apenas os ajustes. Treinos, pesagens e refeições não são alterados.</p>
      <Acao titulo="Exportar ajustes" descricao="Baixa um JSON com todos os ajustes (valores salvos e padrões).">
        <a href="/ajustes/exportar" download className={buttonVariants({ variant: "ghost" })}>
          <Download aria-hidden="true" /> Exportar JSON
        </a>
      </Acao>
      <Acao titulo="Importar ajustes" descricao="Aceita o JSON exportado. Um valor inválido cancela a importação inteira.">
        <label htmlFor={idArquivo} className="sr-only">Arquivo JSON de ajustes</label>
        <input
          ref={arquivo}
          id={idArquivo}
          type="file"
          accept="application/json,.json"
          className="sr-only"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) iniciar(() => importar(f));
            e.target.value = "";
          }}
        />
        <Button type="button" variant="ghost" loading={pendente} onClick={() => arquivo.current?.click()}>
          <Upload aria-hidden="true" /> Importar JSON
        </Button>
      </Acao>
      <Acao titulo="Limpar dados de teste" descricao="Remove do histórico os envios simulados por “Testar agora”.">
        <Button
          type="button"
          variant="danger"
          onClick={() => {
            if (!confirm("Remover todos os envios de teste do histórico?")) return;
            iniciar(async () => {
              const r = await chamarAcao(limparDadosTesteAction);
              avisarResultado(r, r.ok ? `${r.valor} envios de teste removidos` : undefined);
            });
          }}
        >
          <Eraser aria-hidden="true" /> Limpar testes
        </Button>
      </Acao>
      <Acao titulo="Backup manual" descricao={ultimoBackup ?? "Cópia consistente do banco inteiro (.db) na pasta data/."}>
        <Button
          type="button"
          variant="ghost"
          onClick={() =>
            iniciar(async () => {
              const r = await chamarAcao(backupManualAction);
              avisarResultado(r, "Backup criado");
              if (r.ok) setUltimoBackup(`Último: ${r.valor.arquivo} (${Math.round(r.valor.bytes / 1024)} KB)`);
            })
          }
        >
          <DatabaseBackup aria-hidden="true" /> Fazer backup
        </Button>
      </Acao>
    </Secao>
  );
}
