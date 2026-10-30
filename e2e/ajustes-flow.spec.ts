import Database from "better-sqlite3";
import { expect, test, type Page } from "@playwright/test";
import { calcularMacros, calcularTdee, idadeEm } from "../src/lib/domain/configuracao/metasAuto";
import { dataLocalRecife } from "../src/lib/domain/configuracao/horario";
import { esperarHidratacao } from "./hidratacao";

function consultar<T>(sql: string): T {
  const db = new Database("data/vita.e2e.db", { readonly: true });
  try {
    return db.prepare(sql).get() as T;
  } finally {
    db.close();
  }
}

const metaKcal = () => consultar<{ v: number }>("SELECT valor_alvo AS v FROM meta WHERE usuario_id = 1 AND tipo = 'kcal_dia'").v;

function valorNoBanco(chave: string): string | undefined {
  const db = new Database("data/vita.e2e.db", { readonly: true });
  try {
    const linha = db.prepare("SELECT valor FROM configuracao WHERE usuario_id = 1 AND chave = ?").get(chave) as
      | { valor: string }
      | undefined;
    return linha?.valor;
  } finally {
    db.close();
  }
}

/** Settings save from React handlers; acting before hydration would edit a dead input. */
async function irParaAjustes(page: Page) {
  const resposta = await page.goto("/ajustes", { waitUntil: "networkidle" });
  expect(resposta?.status()).toBe(200);
}

async function abrir(page: Page, secao: string) {
  const detalhes = page.locator(`details#${secao}`);
  if (!(await detalhes.evaluate((el) => (el as HTMLDetailsElement).open))) await detalhes.locator("summary").click();
  await esperarHidratacao(detalhes.locator("button, input, select").first());
  return detalhes;
}

test.describe.configure({ mode: "serial" });

// Each test starts from the seed state of the isolated E2E database, so tests are
// independent of order and of --repeat-each (the web server seeds only once per run).
test.beforeEach(() => {
  const db = new Database("data/vita.e2e.db");
  try {
    db.exec("DELETE FROM configuracao; DELETE FROM notificacao_envio;");
    const meta = db.prepare("UPDATE meta SET valor_alvo = ? WHERE usuario_id = 1 AND tipo = ?");
    for (const [tipo, valor] of [["kcal_dia", 2600], ["proteina_g_dia", 170], ["carbo_g_dia", 280], ["gordura_g_dia", 80], ["agua_ml_dia", 3000]] as const) {
      meta.run(valor, tipo);
    }
  } finally {
    db.close();
  }
});

test("três toggles diferentes persistem no banco e sobrevivem ao F5", async ({ page }) => {
  const erros: string[] = [];
  page.on("console", (m) => (m.type() === "error" || m.type() === "warning") && erros.push(m.text()));
  page.on("pageerror", (e) => erros.push(e.message));

  await irParaAjustes(page);
  const alvos = [
    { secao: "hidratacao", nome: "Lembretes de hidratação", chave: "hidratacao.ativo", esperado: "true" },
    { secao: "pesagem", nome: "Lembrete de pesagem", chave: "pesagem.ativo", esperado: "true" },
    { secao: "aparencia", nome: "Reduzir movimento", chave: "aparencia.reduzir_movimento", esperado: "true" },
  ];
  for (const a of alvos) {
    const sec = await abrir(page, a.secao);
    await sec.getByRole("switch", { name: a.nome }).click();
    await expect.poll(() => valorNoBanco(a.chave)).toBe(a.esperado);
  }

  await page.reload({ waitUntil: "networkidle" });
  for (const a of alvos) {
    const sec = await abrir(page, a.secao);
    await expect(sec.getByRole("switch", { name: a.nome })).toHaveAttribute("aria-checked", "true");
  }
  await expect(page.locator("html")).toHaveAttribute("data-movimento", "reduzido");
  expect(erros).toEqual([]);
});

test("toggle desligado desabilita os dependentes sem escondê-los", async ({ page }) => {
  await irParaAjustes(page);
  const sec = await abrir(page, "treino");
  const incremento = sec.getByLabel("Incremento membros superiores (kg)");
  const mestre = sec.getByRole("switch", { name: "Ajustes de treino" });

  await expect(mestre).toHaveAttribute("aria-checked", "false");
  await expect(incremento).toBeVisible();
  await expect(incremento).toBeDisabled();

  await mestre.click();
  await expect.poll(() => valorNoBanco("treino.ativo")).toBe("true");
  await expect(incremento).toBeEnabled();

  // Sub-toggle disables only its own dependents.
  await sec.getByRole("switch", { name: "Sugestão de progressão" }).click();
  await expect(incremento).toBeDisabled();
  await expect(sec.getByRole("switch", { name: "Vibração" })).toBeEnabled();
});

test("horário é salvo com o offset de Recife, nunca em UTC", async ({ page }) => {
  await irParaAjustes(page);
  const sec = await abrir(page, "perfil");
  const campo = sec.getByLabel("Horário habitual de treino");
  await campo.fill("06:45");
  await campo.press("Enter");
  await expect.poll(() => valorNoBanco("perfil.horario_treino")).toBe('"06:45:00-03:00"');
});

test("chave apagada do banco volta ao default sem quebrar a tela", async ({ page }) => {
  const db = new Database("data/vita.e2e.db");
  db.prepare("DELETE FROM configuracao WHERE usuario_id = 1 AND chave = 'pesagem.ativo'").run();
  db.close();

  await irParaAjustes(page);
  const sec = await abrir(page, "pesagem");
  await expect(sec.getByRole("switch", { name: "Lembrete de pesagem" })).toHaveAttribute("aria-checked", "false");
  await expect(sec.getByLabel("Hora da pesagem")).toHaveValue("07:00");
});

test("modo automático de kcal e macros grava as metas lidas pelo Dashboard e /nutricao", async ({ page }) => {
  const u = consultar<{ altura_cm: number; data_nascimento: string; sexo: "masculino" }>(
    "SELECT altura_cm, data_nascimento, sexo FROM usuario WHERE id = 1"
  );
  const peso = consultar<{ p: number }>("SELECT peso_kg AS p FROM peso_registro WHERE usuario_id = 1 ORDER BY data DESC LIMIT 1").p;
  const kcal = calcularTdee({ pesoKg: peso, alturaCm: u.altura_cm, idade: idadeEm(u.data_nascimento, dataLocalRecife()), sexo: u.sexo, diasTreino: 4, objetivo: "hipertrofia" });
  const macros = calcularMacros(kcal, peso);
  expect(metaKcal()).not.toBe(kcal);

  const erros: string[] = [];
  page.on("pageerror", (e) => erros.push(e.message));
  page.on("console", (m) => m.type() === "error" && erros.push(m.text()));
  await irParaAjustes(page);
  const sec = await abrir(page, "nutricao");
  await sec.getByRole("switch", { name: "Ajustes de nutrição" }).click();
  await expect.poll(() => valorNoBanco("nutricao.ativo")).toBe("true");
  await sec.getByLabel("Meta de calorias").selectOption("auto");
  await expect.poll(metaKcal).toBe(kcal);
  await expect(sec.getByText("Não foi possível carregar os ajustes")).toHaveCount(0);
  await sec.getByLabel("Macros P/C/G").selectOption("auto");
  await expect
    .poll(() => consultar<{ p: number }>("SELECT valor_alvo AS p FROM meta WHERE usuario_id = 1 AND tipo = 'proteina_g_dia'").p)
    .toBe(macros.proteinaG);
  expect(erros).toEqual([]);

  await page.reload({ waitUntil: "networkidle" });
  const depois = await abrir(page, "nutricao");
  await expect(depois.getByLabel("Calorias por dia (kcal)")).toHaveValue(String(kcal));
  await expect(depois.getByLabel("Calorias por dia (kcal)")).toBeDisabled();
});

test("Testar agora registra envio simulado no histórico e Limpar testes remove só testes", async ({ page }) => {
  await irParaAjustes(page);
  const sec = await abrir(page, "notificacoes");
  await sec.getByRole("button", { name: "Testar agora: Pesagem" }).click();
  await expect(sec.getByText("teste simulado · ntfy")).toBeVisible();
  const envio = consultar<{ teste: number; status: string; enviado_em: string }>(
    "SELECT teste, status, enviado_em FROM notificacao_envio ORDER BY id DESC LIMIT 1"
  );
  expect(envio).toMatchObject({ teste: 1, status: "simulado" });
  expect(envio.enviado_em).toMatch(/-03:00$/);

  page.once("dialog", (d) => d.accept());
  const dados = await abrir(page, "dados");
  await dados.getByRole("button", { name: "Limpar testes" }).click();
  await expect.poll(() => consultar<{ n: number }>("SELECT COUNT(*) AS n FROM notificacao_envio WHERE teste = 1").n).toBe(0);
});

test("falha de rede ao salvar reverte o controle e avisa, sem derrubar a seção", async ({ page }) => {
  await irParaAjustes(page);
  const sec = await abrir(page, "hidratacao");
  const mestre = sec.getByRole("switch", { name: "Lembretes de hidratação" });
  await expect(mestre).toHaveAttribute("aria-checked", "false");

  // Server Actions are POSTs to the page URL; drop them like a server restart would.
  await page.route("**/ajustes", (rota) => (rota.request().method() === "POST" ? rota.abort("connectionreset") : rota.continue()));
  await mestre.click();

  await expect(page.getByText("Sem conexão com o servidor. Nada foi salvo.")).toBeVisible();
  await expect(mestre).toHaveAttribute("aria-checked", "false");
  await expect(page.getByText("Não foi possível carregar os ajustes")).toHaveCount(0);
  expect(valorNoBanco("hidratacao.ativo")).toBeUndefined();
});
