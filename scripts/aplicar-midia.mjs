import Database from "better-sqlite3";
import { cpSync, existsSync } from "node:fs";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DB_PATH = path.join(ROOT, "data", "vita.db");
const MAP_PATH = path.join(ROOT, "data", "mapa-midia.json");
const OPEN_GYM = "https://raw.githubusercontent.com/DuarteSantos8/openGym/main/catalogue";

const COLUNAS_MIDIA = {
  midia_still: "TEXT",
  midia_clip: "TEXT",
  instrucoes: "TEXT",
  musculo_alvo: "TEXT",
  musculos_sec: "TEXT",
  nivel: "TEXT",
  mecanica: "TEXT",
  fonte: "TEXT",
  fonte_id: "TEXT",
  sistema: "INTEGER DEFAULT 0",
};

const INSTRUCOES_CURADAS = {
  "Puxada alta": [
    "Ajuste o apoio das pernas e selecione uma carga que permita controlar o movimento.",
    "Sente-se com o peito elevado e segure a barra com pegada aberta, um pouco além da largura dos ombros.",
    "Puxe a barra em direção à parte superior do peito, conduzindo os cotovelos para baixo.",
    "Faça uma breve pausa sem projetar os ombros para frente.",
    "Retorne a barra lentamente até estender os braços e repita.",
  ],
  "Leg press": [
    "Ajuste o banco e os apoios para manter a lombar totalmente encostada.",
    "Posicione os pés na plataforma na largura dos ombros e solte as travas com controle.",
    "Desça a plataforma até formar um ângulo confortável, sem perder o contato da lombar com o encosto.",
    "Empurre a plataforma pelos pés, sem travar os joelhos no final.",
    "Recoloque as travas antes de sair do aparelho.",
  ],
  "Avanço com halteres": [
    "Segure um halter em cada mão e mantenha o tronco alto.",
    "Dê um passo à frente e desça até os dois joelhos se aproximarem de 90 graus.",
    "Mantenha o joelho da frente alinhado ao pé e o de trás apontado para o chão.",
    "Empurre o chão com o pé da frente para voltar e alterne o lado.",
    "Repita mantendo o abdômen firme.",
  ],
  Stiff: [
    "Fique em pé com os pés na largura do quadril e segure a barra junto às coxas.",
    "Mantenha os joelhos levemente flexionados e leve o quadril para trás.",
    "Desça a barra perto das pernas até sentir alongar a parte de trás das coxas.",
    "Contraia glúteos e posteriores para estender o quadril e voltar.",
    "Evite arredondar a coluna durante todo o movimento.",
  ],
  "Desenvolvimento militar": [
    "Posicione a barra na altura superior do peito, com mãos pouco além da largura dos ombros.",
    "Contraia abdômen e glúteos antes de iniciar o movimento.",
    "Empurre a barra verticalmente até os braços ficarem estendidos sobre a cabeça.",
    "Baixe com controle até a posição inicial, sem inclinar o tronco para trás.",
    "Repita mantendo o pescoço neutro.",
  ],
  Prancha: [
    "Apoie antebraços e pontas dos pés no chão, com cotovelos abaixo dos ombros.",
    "Forme uma linha reta entre cabeça, quadril e calcanhares.",
    "Contraia abdômen e glúteos sem prender a respiração.",
    "Evite deixar o quadril cair ou subir demais.",
    "Mantenha a posição pelo tempo prescrito.",
  ],
  "Abdominal supra": [
    "Deite-se de costas com as pernas estendidas e os braços ao lado do corpo.",
    "Contraia o abdômen para elevar ombros e parte superior das costas do chão.",
    "Mantenha o pescoço relaxado e os olhos voltados para cima.",
    "Desça lentamente até quase tocar o solo.",
    "Repita sem usar impulso.",
  ],
  "Elevação de pernas": [
    "Deite-se de costas com as pernas unidas e braços ao lado do corpo.",
    "Pressione a lombar contra o chão e contraia o abdômen.",
    "Eleve as pernas até o ponto que mantiver o controle da lombar.",
    "Desça devagar sem relaxar completamente no chão.",
    "Repita sem balançar o quadril.",
  ],
  "Elevação pélvica": [
    "Apoie a parte superior das costas em um banco e posicione a barra protegida sobre o quadril.",
    "Mantenha os pés firmes no chão na largura do quadril.",
    "Empurre o chão e eleve o quadril até alinhar tronco e coxas.",
    "Contraia os glúteos no topo sem hiperestender a lombar.",
    "Desça controladamente e repita.",
  ],
  Esteira: [
    "Antes de iniciar, confira se o cadarço está firme e selecione uma velocidade confortável.",
    "Mantenha postura ereta, olhar à frente e braços relaxados ao lado do corpo.",
    "Pise no centro da esteira, com passadas naturais e controladas.",
    "Ajuste velocidade ou inclinação gradualmente quando necessário.",
    "Use as barras de apoio apenas para segurança ao iniciar e finalizar.",
  ],
  "Cadeira abdutora": [
    "Ajuste o banco para apoiar completamente as costas.",
    "Posicione a parte externa das pernas contra os apoios e mantenha os pés firmes.",
    "Afaste as pernas contra a resistência sem movimentar o tronco.",
    "Faça uma breve contração dos glúteos no final do movimento.",
    "Retorne lentamente e repita.",
  ],
};

/** Adds missing exercise media columns without modifying or dropping existing data. */
export function garantirColunasMidia(db) {
  const existentes = new Set(db.prepare("PRAGMA table_info(exercicio)").all().map((coluna) => coluna.name));
  for (const [nome, definicao] of Object.entries(COLUNAS_MIDIA)) {
    if (!existentes.has(nome)) db.exec(`ALTER TABLE exercicio ADD COLUMN ${nome} ${definicao}`);
  }
}

/** Applies only values that were not already curated in the local exercise record. */
export function aplicarMetadadosMidia(db, registros) {
  const atualizar = db.prepare(`
    UPDATE exercicio SET
      midia_still = COALESCE(midia_still, @midia_still),
      midia_clip = COALESCE(midia_clip, @midia_clip),
      instrucoes = COALESCE(instrucoes, @instrucoes),
      musculo_alvo = COALESCE(musculo_alvo, @musculo_alvo),
      musculos_sec = COALESCE(musculos_sec, @musculos_sec),
      nivel = COALESCE(nivel, @nivel),
      mecanica = COALESCE(mecanica, @mecanica),
      fonte = COALESCE(fonte, @fonte),
      fonte_id = COALESCE(fonte_id, @fonte_id),
      sistema = CASE
        WHEN fonte IS NULL OR (fonte = @fonte AND fonte_id IS @fonte_id) THEN @sistema
        ELSE sistema
      END
    WHERE nome = @nome
  `);
  db.transaction((itens) => {
    for (const item of itens) atualizar.run({ sistema: item.fonte === "opengym" ? 1 : 0, ...item });
  })(registros);
}

async function obterJson(url) {
  const resposta = await fetch(url);
  if (!resposta.ok) throw new Error(`${url}: HTTP ${resposta.status}`);
  return resposta.json();
}

async function baixarSeAusente(url, destino) {
  if (existsSync(destino)) return false;
  await mkdir(path.dirname(destino), { recursive: true });
  const resposta = await fetch(url);
  if (!resposta.ok) throw new Error(`${url}: HTTP ${resposta.status}`);
  const temporario = `${destino}.tmp`;
  await writeFile(temporario, Buffer.from(await resposta.arrayBuffer()));
  await rename(temporario, destino);
  return true;
}

async function montarRegistros(mapa) {
  const i18n = await obterJson(`${OPEN_GYM}/i18n/pt-BR.json`);
  const registros = [];
  for (const [nome, item] of Object.entries(mapa)) {
    if (!item.og_id) {
      registros.push({
        nome,
        midia_still: null,
        midia_clip: null,
        instrucoes: JSON.stringify(INSTRUCOES_CURADAS[nome]),
        musculo_alvo: "glutes",
        musculos_sec: JSON.stringify(["hip abductors"]),
        nivel: item.nivel,
        mecanica: item.mecanica,
        fonte: item.fonte,
        fonte_id: null,
      });
      continue;
    }
    const traducao = i18n[item.og_id];
    if (!traducao || traducao.name !== item.match) throw new Error(`O mapa de ${nome} não confere com o i18n ${item.og_id}.`);
    const metadata = await obterJson(`${OPEN_GYM}/exercises/${item.og_id}.json`);
    const instrucoes = traducao.instructions ?? INSTRUCOES_CURADAS[nome];
    if (!Array.isArray(instrucoes) || instrucoes.length === 0) throw new Error(`Sem instruções pt-BR para ${nome}.`);
    await baixarSeAusente(`${OPEN_GYM}/media/still/${item.og_id}.webp`, path.join(ROOT, "public", "midia", "still", `${item.og_id}.webp`));
    await baixarSeAusente(`${OPEN_GYM}/media/clip/${item.og_id}.mp4`, path.join(ROOT, "public", "midia", "clip", `${item.og_id}.mp4`));
    registros.push({
      nome,
      midia_still: `/midia/still/${item.og_id}.webp`,
      midia_clip: `/midia/clip/${item.og_id}.mp4`,
      instrucoes: JSON.stringify(instrucoes),
      musculo_alvo: metadata.target,
      musculos_sec: JSON.stringify(metadata.secondaryMuscles ?? []),
      nivel: item.nivel,
      mecanica: item.mecanica,
      fonte: item.fonte,
      fonte_id: item.og_id,
    });
  }
  return registros;
}

async function main() {
  const mapa = JSON.parse(await readFile(MAP_PATH, "utf8"));
  const registros = await montarRegistros(mapa);
  const db = new Database(DB_PATH);
  db.pragma("foreign_keys = ON");
  garantirColunasMidia(db);
  aplicarMetadadosMidia(db, registros);
  const preenchidos = db.prepare("SELECT COUNT(*) AS total FROM exercicio WHERE midia_still IS NOT NULL").get().total;
  db.close();
  console.log(JSON.stringify({ exerciciosMapeados: registros.length, comMidia: preenchidos }, null, 2));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((erro) => {
    console.error(erro);
    process.exitCode = 1;
  });
}
