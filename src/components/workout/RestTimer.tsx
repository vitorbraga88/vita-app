"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Minus, Pause, Play, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

const DURACAO_PADRAO_SEG = 90;
const RAIO = 72;
const CIRCUNFERENCIA = 2 * Math.PI * RAIO;

function formatarMMSS(segundos: number): string {
  const m = Math.floor(segundos / 60);
  const s = segundos % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/** Short beep via Web Audio API — works without any audio file asset. */
function tocarBeep() {
  try {
    // webkitAudioContext: legacy Safari prefix, not in the DOM lib types.
    const janela = window as unknown as { webkitAudioContext?: typeof AudioContext };
    const AudioCtx = window.AudioContext || janela.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = 880;
    osc.connect(gain);
    gain.connect(ctx.destination);
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc.start();
    osc.stop(ctx.currentTime + 0.4);
  } catch {
    // Web Audio indisponível (ex.: ambiente sem permissão de áudio) — silencioso, sem quebrar o timer.
  }
}

export function RestTimer({ duracaoInicialSeg = DURACAO_PADRAO_SEG }: { duracaoInicialSeg?: number }) {
  const [duracaoTotal, setDuracaoTotal] = useState(duracaoInicialSeg);
  const [tempoRestante, setTempoRestante] = useState(duracaoInicialSeg);
  const [rodando, setRodando] = useState(false);
  const fimEmRef = useRef<number | null>(null);

  const recalcular = useCallback(() => {
    if (fimEmRef.current === null) return;
    const restante = Math.max(0, Math.round((fimEmRef.current - Date.now()) / 1000));
    setTempoRestante(restante);
    if (restante === 0) {
      setRodando(false);
      fimEmRef.current = null;
      tocarBeep();
    }
  }, []);

  useEffect(() => {
    if (!rodando) return;
    const intervalo = setInterval(recalcular, 250);
    document.addEventListener("visibilitychange", recalcular);
    return () => {
      clearInterval(intervalo);
      document.removeEventListener("visibilitychange", recalcular);
    };
  }, [rodando, recalcular]);

  function alternarRodando() {
    if (rodando) {
      setRodando(false);
      fimEmRef.current = null;
      return;
    }
    fimEmRef.current = Date.now() + tempoRestante * 1000;
    setRodando(true);
  }

  function ajustar(delta: number) {
    const novoTempo = Math.max(0, tempoRestante + delta);
    setTempoRestante(novoTempo);
    setDuracaoTotal((atual) => Math.max(atual, novoTempo));
    if (rodando) fimEmRef.current = Date.now() + novoTempo * 1000;
  }

  const percentual = duracaoTotal > 0 ? (tempoRestante / duracaoTotal) * 100 : 0;
  const offset = CIRCUNFERENCIA * (1 - percentual / 100);

  return (
    <div className="flex flex-col items-center gap-[var(--s-4)]">
      <svg width={168} height={168} viewBox="0 0 168 168" role="timer" aria-label={`Descanso: ${formatarMMSS(tempoRestante)} restantes`}>
        <circle cx={84} cy={84} r={RAIO} stroke="var(--bg-3)" strokeWidth={10} fill="none" />
        <circle
          cx={84}
          cy={84}
          r={RAIO}
          stroke="var(--accent)"
          strokeWidth={10}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={CIRCUNFERENCIA}
          strokeDashoffset={offset}
          transform="rotate(-90 84 84)"
          style={{ transition: "stroke-dashoffset 220ms linear" }}
        />
        <text x={84} y={84} textAnchor="middle" dominantBaseline="central" className="font-num" fontSize={34} fontWeight={700} fill="var(--fg-0)">
          {formatarMMSS(tempoRestante)}
        </text>
      </svg>
      <div className="flex items-center gap-[var(--s-3)]">
        <Button variant="ghost" size="icon" aria-label="Diminuir 15 segundos" onClick={() => ajustar(-15)}>
          <Minus className="size-4" />
        </Button>
        <Button size="icon" aria-label={rodando ? "Pausar descanso" : "Iniciar descanso"} onClick={alternarRodando}>
          {rodando ? <Pause className="size-5" /> : <Play className="size-5" />}
        </Button>
        <Button variant="ghost" size="icon" aria-label="Adicionar 15 segundos" onClick={() => ajustar(15)}>
          <Plus className="size-4" />
        </Button>
      </div>
      <p className="max-w-xs text-center text-[length:var(--t-cap)] text-fg-2">
        O som pode atrasar se esta aba ficar em segundo plano — o tempo exibido se corrige sozinho ao voltar o foco.
      </p>
    </div>
  );
}
