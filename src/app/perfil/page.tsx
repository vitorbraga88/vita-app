import { getUsuarioAtual } from "@/lib/db/repositories/usuario";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormularioPerfil } from "@/components/perfil/FormularioPerfil";
import { ToggleAparencia } from "@/components/perfil/ToggleAparencia";

export default async function PerfilPage() {
  const usuario = getUsuarioAtual();

  return (
    <div className="flex flex-col gap-[var(--s-6)]">
      <div className="flex flex-col gap-1">
        <h1 className="text-[var(--t-t1)] font-semibold text-fg-0">Perfil</h1>
        <p className="text-[var(--t-fn)] text-fg-1">Seus dados e preferências do app.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dados pessoais</CardTitle>
        </CardHeader>
        <CardContent>
          <FormularioPerfil usuario={usuario} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Aparência</CardTitle>
        </CardHeader>
        <CardContent>
          <ToggleAparencia usuarioId={usuario.id} />
        </CardContent>
      </Card>
    </div>
  );
}
