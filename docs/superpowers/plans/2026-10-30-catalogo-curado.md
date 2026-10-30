# Catálogo curado da VITA — plano de implementação

> **Para agentes:** subskill obrigatório: executar as tarefas em TDD; cada etapa deve permanecer limitada ao escopo da Fase 2.

**Objetivo:** ampliar a produção de 33 para 132 exercícios curados, com still, clip e instruções pt-BR locais, sem alterar séries, sessões, pesagens ou usuário.

**Arquitetura:** `data/mapa-midia.json` é o manifesto auditável. Um módulo de importação valida as entradas e aplica apenas inserções ou preenchimentos nulos; o script de linha de comando valida fontes, baixa mídia de forma atômica, faz backup e executa uma transação na produção. Seeds e E2E continuam usando suas bases isoladas.

**Stack:** Node.js, better-sqlite3, SQLite, OpenGym por `fetch`, Vitest, Playwright e FFmpeg/ffprobe quando disponível.

## Restrições globais

- Nunca executar `DELETE`, `DROP` ou `npm run seed` contra `data/vita.db`.
- Antes/depois de cada escrita na produção, as contagens devem ser `sessao_serie=795`, `sessao=36`, `peso_registro=28`, `usuario=1`.
- Todos os importados têm `sistema=1`, `fonte='opengym'`, `fonte_id` e as duas mídias locais.
- A operação é aditiva, idempotente e preserva campos preenchidos.
- O índice parcial único `(fonte, fonte_id)` é aditivo; não haverá reconstrução de tabela.
- Somente arquivos locais em `public/midia/` serão servidos em runtime.

---

### Tarefa 1: Consolidar o manifesto curado

**Arquivos:**
- Modificar: `data/mapa-midia.json`
- Criar: `src/lib/domain/catalogoCurado.ts`
- Testar: `src/lib/domain/catalogoCurado.test.ts`

**Interface:**

```ts
export type CategoriaCuradoria =
  | 'peito' | 'costas' | 'ombro' | 'biceps' | 'triceps' | 'quadriceps'
  | 'posterior_coxa' | 'gluteos' | 'panturrilha' | 'abdomen' | 'cardio';

export interface EntradaCatalogoCurado {
  og_id: string | null;
  match: string | null;
  fonte: 'opengym' | 'manual';
  instrucao_origem: 'opengym-i18n-pt-BR' | 'curado-pt-BR';
  nivel: 'iniciante' | 'intermediario' | 'avancado';
  mecanica: 'composto' | 'isolado';
  categoria_curadoria: CategoriaCuradoria;
}

export function validarManifestoCurado(mapa: Record<string, EntradaCatalogoCurado>): void;
export function contarPorCategoria(mapa: Record<string, EntradaCatalogoCurado>): Record<CategoriaCuradoria, number>;
```

- [ ] Escrever teste vermelho que recuse item OpenGym sem `og_id`/`match` e confirme 12 entradas em cada categoria.
- [ ] Executar `npx vitest run src/lib/domain/catalogoCurado.test.ts`; resultado esperado: falha porque o validador ainda não existe.
- [ ] Implementar o validador sem I/O. Ele exige `fonte='opengym'`, `og_id`, `match`, nível e mecânica em todos os 132 registros; a única exceção manual anterior, `Cadeira abdutora`, será enriquecida com OpenGym `0597` e deixa de ser exceção.
- [ ] Estender o mapa existente, sem remover as 33 chaves. Acrescentar `categoria_curadoria` a cada uma e inserir estes 100 IDs novos, por categoria:

| Categoria | IDs novos OpenGym |
|---|---|
| Peito | 0033, 0047, 0151, 0158, 0171, 0289, 0308, 0319 |
| Costas | 0049, 0150, 0180, 0197, 0237, 0293, 0327 |
| Ombro | 0091, 0178, 0215, 0286, 0290, 0311, 0326, 0380 |
| Bíceps | 0023, 0038, 0059, 0080, 0165, 0294, 0297, 0315, 0439 |
| Tríceps | 0035, 0056, 0092, 0149, 0173, 0194, 0201, 0333, 0453 |
| Quadríceps | 0024, 0042, 0054, 0114, 0291, 0336, 0410, 0534, 0739 |
| Posterior de coxa | 0085, 0116, 0157, 0300, 0339, 0432, 0496, 0578, 0749, 0795 |
| Glúteos | 1409, 2286, 3013, 3523, 3561, 3562, 0130, 0228, 0597, 0710 |
| Panturrilha | 0088, 0108, 0284, 0400, 0417, 0594, 0605, 0727, 0738, 0763, 0833 |
| Abdômen | 0001, 0175, 0212, 0242, 0260, 0262, 0464, 0472, 0507 |
| Cardio | 2138, 2141, 2311, 2331, 3224, 3637, 3656, 3666, 0501, 0684 |

- [ ] Executar o teste novamente; resultado esperado: aprovado e total de 132 chaves distribuídas em 12 por categoria.
- [ ] Commit: `git commit -m "feat: define catálogo curado de exercícios"`.

### Tarefa 2: Importar metadados de forma aditiva e idempotente

**Arquivos:**
- Criar: `src/lib/db/catalogoCurado.ts`
- Testar: `src/lib/db/catalogoCurado.test.ts`
- Modificar: `scripts/aplicar-midia.mjs`

**Interface:**

```ts
export interface RegistroCatalogoCurado {
  nome: string;
  grupoMuscular: GrupoMuscular;
  equipamento: Equipamento;
  tipo: TipoExercicio;
  midiaStill: string;
  midiaClip: string;
  instrucoes: string;
  musculoAlvo: string;
  musculosSec: string;
  nivel: NivelExercicio;
  mecanica: MecanicaExercicio;
  fonteId: string;
}

export function garantirIndiceFonte(db: Database.Database): void;
export function aplicarCatalogoCurado(db: Database.Database, registros: RegistroCatalogoCurado[]): { inseridos: number; enriquecidos: number };
```

- [ ] Escrever teste vermelho com banco em memória: primeira execução insere uma entrada OpenGym; segunda não duplica; uma entrada manual com mídia preenchida permanece intacta; e as contagens protegidas não são tocadas.
- [ ] Executar `npx vitest run src/lib/db/catalogoCurado.test.ts`; resultado esperado: falha porque o módulo não existe.
- [ ] Criar índice `CREATE UNIQUE INDEX IF NOT EXISTS idx_exercicio_fonte_id ON exercicio(fonte, fonte_id) WHERE fonte IS NOT NULL AND fonte_id IS NOT NULL`.
- [ ] Implementar uma transação que procura primeiro `(fonte='opengym', fonte_id)`. Se existe, preenche apenas campos nulos; se não existe, insere `sistema=1`. Mapeie `bodyPart` para os valores do schema: chest→peito, back→costas, shoulders→ombro, upper arms→bíceps/tríceps conforme target, upper legs→pernas/glúteos conforme categoria, lower legs→panturrilha, waist→abdômen, cardio/full body→cardio.
- [ ] Adaptar `scripts/aplicar-midia.mjs` para montar registros tanto para os 33 existentes quanto para os novos, usando o nome e as instruções exatamente do i18n pt-BR e target/secondaryMuscles do metadata OpenGym.
- [ ] Executar os testes do módulo e da migration; resultado esperado: aprovados.
- [ ] Commit: `git commit -m "feat: importa catálogo OpenGym de forma idempotente"`.

### Tarefa 3: Validar fonte, baixar mídia e aplicar em produção com backup

**Arquivos:**
- Criar: `scripts/importar-catalogo-curado.mjs`
- Modificar: `package.json`
- Testar: `e2e/exercicio-catalogo.spec.ts`

- [ ] Escrever teste vermelho que exija 132 cards e thumbnail para um exercício importado na rota `/exercicios`.
- [ ] Executar o teste; resultado esperado: falha antes da importação.
- [ ] Implementar script que: valida todas as 132 entradas contra i18n/metadata; rejeita instruções ausentes ou mídia não-200; baixa cada still/clip ausente via arquivo `.tmp` seguido de rename; mede as contagens protegidas; copia `data/vita.db` para um backup datado; aplica `aplicarCatalogoCurado` na transação; mede novamente as contagens e `PRAGMA integrity_check`; falha se alguma contagem protegida divergir.
- [ ] Expor o script como `npm run importar:catalogo`. Ele deve exigir `VITA_CATALOGO_APLICAR=1` para gravar na produção; sem a variável, apenas valida fonte e baixa assets. Seeds continuam sem acesso à produção.
- [ ] Executar a importação uma vez com `VITA_CATALOGO_APLICAR=1`, depois uma segunda vez. Resultado esperado: 132 exercícios, 132 stills, 132 clips e nenhum novo registro na segunda execução.
- [ ] Executar `npx vitest run`, `npm run test:e2e`, `npm run build`; iniciar `npm run start`; tirar screenshot de `/exercicios`; usar `ffprobe` em três clips e `curl` em um clip novo. Resultado esperado: aprovação e conteúdo `200 video/mp4`.
- [ ] Commit: `git commit -m "feat: adiciona catálogo curado de exercícios"`.

### Tarefa 4: Registrar a entrega da Fase 2

**Arquivos:**
- Modificar: `RELATORIO-SKILLS.md`, `PROGRESS.md`, `progresso.md`, `README.md`

- [ ] Registrar total, tabela de categorias, mídia still/clip, tamanho de `public/midia`, total `sistema=1`, três resultados `ffprobe`, integridade e quatro contagens protegidas.
- [ ] Registrar a licença/uso privado já aprovado da mídia OpenGym e confirmar que não houve upload externo.
- [ ] Verificar `git diff --check`, criar tag local `fase-2-catalogo-curado-20261030` e commit final em português.
