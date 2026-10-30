import { getUsuarioAtual } from "@/lib/db/repositories/usuario";
import { listarPesoRegistros, listarMedidas } from "@/lib/db/repositories/evolucao";
import { getMeta } from "@/lib/db/repositories/meta";
import { hojeISOLocal } from "@/lib/domain/dataLocal";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PesoSecao } from "@/components/evolucao/PesoSecao";
import { MedidasSecao } from "@/components/evolucao/MedidasSecao";
import { MetaSecao } from "@/components/evolucao/MetaSecao";

export const dynamic = "force-dynamic";

export default async function EvolucaoPage() {
  const usuario = getUsuarioAtual();
  const hoje = hojeISOLocal();

  const pesoRegistros = listarPesoRegistros(usuario.id, 90);
  const medidas = listarMedidas(usuario.id);
  const metaPeso = getMeta(usuario.id, "peso_alvo_kg");
  const metaAlvoKg = metaPeso?.valor_alvo ?? null;

  return (
    <div className="flex flex-col gap-[var(--s-6)]">
      <h1 className="text-[length:var(--t-t1)] font-semibold text-fg-0">Evolução</h1>

      <Tabs defaultValue="peso">
        <TabsList>
          <TabsTrigger value="peso">Peso</TabsTrigger>
          <TabsTrigger value="medidas">Medidas</TabsTrigger>
          <TabsTrigger value="metas">Metas</TabsTrigger>
        </TabsList>
        <TabsContent value="peso">
          <PesoSecao hoje={hoje} registros={pesoRegistros} metaAlvoKg={metaAlvoKg} />
        </TabsContent>
        <TabsContent value="medidas">
          <MedidasSecao hoje={hoje} medidas={medidas} />
        </TabsContent>
        <TabsContent value="metas">
          <MetaSecao metaAlvoKg={metaAlvoKg} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
