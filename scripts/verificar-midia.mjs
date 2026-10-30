import { createServer } from "node:http";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PUBLIC_DIR = path.join(ROOT, "public");
const OPEN_GYM_CLIPS = "https://raw.githubusercontent.com/DuarteSantos8/openGym/main/catalogue/media/clip";
const DURACOES_ESPERADAS = { "4295.mp4": 5.5 };

function tipoConteudo(arquivo) {
  if (arquivo.endsWith(".mp4")) return "video/mp4";
  if (arquivo.endsWith(".webp")) return "image/webp";
  return "application/octet-stream";
}

async function iniciarServidor() {
  const servidor = createServer(async (requisicao, resposta) => {
    const caminho = path.normalize(requisicao.url?.split("?")[0] ?? "/").replace(/^[/\\]+/, "");
    if (!caminho) {
      resposta.writeHead(200, { "content-type": "text/html; charset=utf-8" });
      resposta.end("<!doctype html><title>Verificador de mídia</title>");
      return;
    }
    const arquivo = path.join(PUBLIC_DIR, caminho);
    if (!arquivo.startsWith(PUBLIC_DIR)) {
      resposta.writeHead(403).end();
      return;
    }
    try {
      const conteudo = await readFile(arquivo);
      resposta.writeHead(200, { "content-type": tipoConteudo(arquivo) });
      resposta.end(conteudo);
    } catch {
      resposta.writeHead(404).end();
    }
  });
  await new Promise((resolve) => servidor.listen(0, "127.0.0.1", resolve));
  return servidor;
}

async function main() {
  const stills = await readdir(path.join(PUBLIC_DIR, "midia", "still"));
  const candidatosRemotos = process.argv.slice(2);
  const clips = candidatosRemotos.length
    ? candidatosRemotos.map((id) => `${id}.mp4`)
    : await readdir(path.join(PUBLIC_DIR, "midia", "clip"));
  const origemClipes = candidatosRemotos.length ? OPEN_GYM_CLIPS : `http://127.0.0.1`;
  const servidor = await iniciarServidor();
  const porta = servidor.address().port;
  const navegador = await chromium.launch({ headless: true });
  try {
    const pagina = await navegador.newPage();
    await pagina.goto(`http://127.0.0.1:${porta}/`);
    const resultado = await pagina.evaluate(async ({ stills, clips, porta, origemClipes }) => {
      const carregarImagem = (arquivo) => new Promise((resolve, reject) => {
        const imagem = new Image();
        imagem.onload = () => resolve({ arquivo, largura: imagem.naturalWidth, altura: imagem.naturalHeight });
        imagem.onerror = () => reject(new Error(`Imagem inválida: ${arquivo}`));
        imagem.src = `http://127.0.0.1:${porta}/midia/still/${arquivo}`;
      });
      const carregarVideo = (arquivo) => new Promise((resolve, reject) => {
        const video = document.createElement("video");
        video.preload = "metadata";
        video.onloadedmetadata = () => resolve({ arquivo, largura: video.videoWidth, altura: video.videoHeight, duracao: video.duration });
        video.onerror = () => reject(new Error(`Vídeo inválido: ${arquivo}`));
        video.src = origemClipes === "http://127.0.0.1"
          ? `${origemClipes}:${porta}/midia/clip/${arquivo}`
          : `${origemClipes}/${arquivo}`;
      });
      return Promise.all([Promise.all(stills.map(carregarImagem)), Promise.all(clips.map(carregarVideo))]);
    }, { stills, clips, porta, origemClipes });
    const [imagens, videos] = resultado;
    const erros = [
      ...imagens.filter((item) => item.largura !== 180 || item.altura !== 180),
      ...videos.filter((item) => item.largura !== 180 || item.altura !== 180 || Math.abs(item.duracao - (DURACOES_ESPERADAS[item.arquivo] ?? 3)) > 0.05),
    ];
    console.log(JSON.stringify({
      stills: imagens.length,
      clips: videos.length,
      dimensoesStills: [...new Set(imagens.map((item) => `${item.largura}x${item.altura}`))],
      dimensoesClips: [...new Set(videos.map((item) => `${item.largura}x${item.altura}`))],
      duracoesClips: [...new Set(videos.map((item) => item.duracao.toFixed(3)))],
      erros,
    }, null, 2));
    if (erros.length) process.exitCode = 1;
  } finally {
    await navegador.close();
    await new Promise((resolve) => servidor.close(resolve));
  }
}

main().catch((erro) => {
  console.error(erro);
  process.exitCode = 1;
});
