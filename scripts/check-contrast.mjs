#!/usr/bin/env node
// Computes WCAG 2.x contrast ratio for every text/background pair actually
// used in the VITA design system (src/styles/tokens.css) and prints a table.
// Run with `node scripts/check-contrast.mjs`. Exits 1 if any pair that is
// used for normal-size text falls below 4.5:1.

const TOKENS = {
  dark: {
    "bg-0": "#0A0B0F", "bg-1": "#12141A", "bg-2": "#1A1D26", "bg-3": "#232734",
    "fg-0": "#F5F7FA", "fg-1": "#A0A8B8", "fg-2": "#8891A1",
    accent: "#B6F53C", "accent-dim": "#8FCC22", "accent-ink": "#0A0B0F", "accent-text": "#B6F53C",
    ok: "#34D399", warn: "#FBBF24", err: "#F87171",
  },
  light: {
    "bg-0": "#F7F8FA", "bg-1": "#FFFFFF", "bg-2": "#F0F2F5", "bg-3": "#E5E8ED",
    "fg-0": "#14161B", "fg-1": "#4A5160", "fg-2": "#5D6574",
    accent: "#B6F53C", "accent-dim": "#8FCC22", "accent-ink": "#0A0B0F", "accent-text": "#4B6F06",
    ok: "#1D845F", warn: "#986E03", err: "#ED0C0C",
  },
};

// [text token, bg token, normal-size-text?] — every pair actually rendered as TEXT
// somewhere in the UI (components/*.tsx). SVG ring/bar fills use raw --accent and
// are data-visualization graphics, not text — out of scope for the 4.5:1 text rule.
const PARES = [
  ["fg-0", "bg-0", true], ["fg-0", "bg-1", true], ["fg-0", "bg-2", true], ["fg-0", "bg-3", true],
  ["fg-1", "bg-0", true], ["fg-1", "bg-1", true], ["fg-1", "bg-2", true],
  ["fg-2", "bg-0", true], ["fg-2", "bg-1", true], ["fg-2", "bg-2", true], ["fg-2", "bg-3", true],
  ["accent-ink", "accent", true], ["accent-ink", "accent-dim", true],
  ["accent-text", "bg-0", true], ["accent-text", "bg-1", true], ["accent-text", "bg-2", true],
  ["ok", "bg-1", true], ["warn", "bg-1", true], ["err", "bg-1", true],
];

function hexToRgb(hex) {
  const n = parseInt(hex.replace("#", ""), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function relativeLuminance([r, g, b]) {
  const [sr, sg, sb] = [r, g, b].map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * sr + 0.7152 * sg + 0.0722 * sb;
}

function contrastRatio(hexA, hexB) {
  const lA = relativeLuminance(hexToRgb(hexA));
  const lB = relativeLuminance(hexToRgb(hexB));
  const [lighter, darker] = lA > lB ? [lA, lB] : [lB, lA];
  return (lighter + 0.05) / (darker + 0.05);
}

let algumaFalha = false;

for (const [tema, tokens] of Object.entries(TOKENS)) {
  console.log(`\n=== tema: ${tema} ===`);
  console.log("texto".padEnd(12), "fundo".padEnd(12), "razão".padEnd(8), "resultado");
  for (const [textoTok, fundoTok, textoNormal] of PARES) {
    const ratio = contrastRatio(tokens[textoTok], tokens[fundoTok]);
    const limite = textoNormal ? 4.5 : 3;
    const passou = ratio >= limite;
    if (textoNormal && !passou) algumaFalha = true;
    console.log(
      textoTok.padEnd(12),
      fundoTok.padEnd(12),
      `${ratio.toFixed(2)}:1`.padEnd(8),
      passou ? "✅ OK" : "❌ FALHA"
    );
  }
}

if (algumaFalha) {
  console.error("\nFALHA: algum par de texto normal ficou abaixo de 4.5:1.");
  process.exit(1);
} else {
  console.log("\nOK: todos os pares de texto normal atingem ao menos 4.5:1 (WCAG AA).");
}
