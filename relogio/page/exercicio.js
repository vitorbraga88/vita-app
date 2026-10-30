// "Exercício" screen: series N of M, target, suggestion, ± reps, ± load
// (0.5 and 2.5 kg) and Concluir série. Opened with `replace` from Hoje and
// returns to Hoje with `replace`, so the page stack is always one page deep.
import { replace } from '@zos/router'
import { showToast } from '@zos/ui'
import { onGesture, offGesture, GESTURE_RIGHT } from '@zos/interaction'
import { BasePage } from '@zeppos/zml/base-page'
import { Tela, COR, centro, mudarTexto } from '../lib/ui'
import * as store from '../lib/armazenamento'
import { enviarAgora } from '../lib/conexao'
import { proximaSerie, registrarSerie, ultimoRegistro } from '../src/fila'
import {
  ajustarCarga,
  ajustarReps,
  descreverAlvo,
  descreverSerie,
  descreverSugestao,
  valoresIniciais
} from '../src/pacote'
import { formatKg } from '../src/datas'

function lerParametros(params) {
  try {
    const p = typeof params === 'string' ? JSON.parse(params) : params
    return p && Number.isInteger(p.exercicioId) ? p.exercicioId : null
  } catch {
    return null
  }
}

function voltar() {
  replace({ url: 'page/hoje' })
}

Page(
  BasePage({
    state: {
      treino: null,
      exercicio: null,
      reps: 10,
      cargaKg: 0,
      tela: null,
      textoSerie: null,
      textoReps: null,
      textoCarga: null
    },

    onInit(params) {
      const exercicioId = lerParametros(params)
      const fila = store.carregarFila()
      const pacote = store.carregarPacote()
      const treino = fila.sessaoAtiva ? fila.sessaoAtiva.treino : pacote && pacote.treino
      const exercicio =
        treino && treino.exercicios.find((e) => e.exercicioId === exercicioId)
      this.state.treino = treino || null
      this.state.exercicio = exercicio || null
      if (exercicio) {
        const v = valoresIniciais(exercicio, ultimoRegistro(fila, exercicio.exercicioId))
        this.state.reps = v.reps
        this.state.cargaKg = v.cargaKg
      }
      onGesture({
        callback: (event) => {
          if (event === GESTURE_RIGHT) {
            voltar()
            return true
          }
          return false
        }
      })
    },

    onDestroy() {
      offGesture()
      this.state.tela = null
    },

    build() {
      const tela = new Tela()
      this.state.tela = tela
      const ex = this.state.exercicio
      if (!ex) {
        tela.texto({ x: 60, y: 140, w: 360, h: 100, texto: 'Exercício não encontrado', tamanho: 30, quebra: true })
        tela.botao({ x: centro(240), y: 280, w: 240, h: 80, texto: 'Voltar', aoTocar: voltar })
        return
      }

      tela.texto({ x: 70, y: 30, w: 340, h: 44, texto: ex.nome, tamanho: 30, cor: COR.destaque })
      this.state.textoSerie = tela.texto({ x: 50, y: 76, w: 380, h: 54, texto: '', tamanho: 40 })
      tela.texto({ x: 50, y: 132, w: 380, h: 34, texto: descreverAlvo(ex), tamanho: 26, cor: COR.secundario })
      tela.texto({ x: 40, y: 166, w: 400, h: 34, texto: descreverSugestao(ex), tamanho: 24, cor: COR.aviso })

      // Reps row
      tela.botao({ x: 40, y: 210, w: 110, h: 90, texto: '-', tamanho: 48, aoTocar: () => this.mudarReps(-1) })
      this.state.textoReps = tela.texto({ x: 150, y: 210, w: 180, h: 90, texto: '', tamanho: 40 })
      tela.botao({ x: 330, y: 210, w: 110, h: 90, texto: '+', tamanho: 48, aoTocar: () => this.mudarReps(1) })

      // Load row (fine steps)
      tela.botao({ x: 40, y: 316, w: 110, h: 90, texto: '-0,5', tamanho: 30, aoTocar: () => this.mudarCarga(-0.5) })
      this.state.textoCarga = tela.texto({ x: 150, y: 316, w: 180, h: 90, texto: '', tamanho: 38 })
      tela.botao({ x: 330, y: 316, w: 110, h: 90, texto: '+0,5', tamanho: 30, aoTocar: () => this.mudarCarga(0.5) })

      // Load row (coarse steps)
      tela.botao({ x: 70, y: 422, w: 160, h: 84, texto: '-2,5', tamanho: 32, aoTocar: () => this.mudarCarga(-2.5) })
      tela.botao({ x: 250, y: 422, w: 160, h: 84, texto: '+2,5', tamanho: 32, aoTocar: () => this.mudarCarga(2.5) })

      tela.botao({
        x: centro(360),
        y: 524,
        w: 360,
        h: 96,
        texto: 'Concluir série',
        tamanho: 34,
        cor: COR.sucesso,
        corPress: COR.sucessoPress,
        aoTocar: () => this.concluir()
      })
      tela.botao({ x: centro(240), y: 636, w: 240, h: 80, texto: 'Voltar', tamanho: 30, aoTocar: voltar })
      tela.texto({ x: 0, y: 716, w: 480, h: 140, texto: ' ' })

      this.atualizar()
    },

    atualizar() {
      const ex = this.state.exercicio
      const numero = proximaSerie(store.carregarFila(), ex.exercicioId)
      mudarTexto(this.state.textoSerie, descreverSerie(numero, ex.seriesAlvo))
      mudarTexto(this.state.textoReps, `${this.state.reps} reps`)
      mudarTexto(this.state.textoCarga, formatKg(this.state.cargaKg))
    },

    mudarReps(delta) {
      this.state.reps = ajustarReps(this.state.reps, delta)
      mudarTexto(this.state.textoReps, `${this.state.reps} reps`)
    },

    mudarCarga(delta) {
      this.state.cargaKg = ajustarCarga(this.state.cargaKg, delta)
      mudarTexto(this.state.textoCarga, formatKg(this.state.cargaKg))
    },

    concluir() {
      const ex = this.state.exercicio
      let serie
      try {
        const r = registrarSerie(store.carregarFila(), {
          treino: this.state.treino,
          exercicioId: ex.exercicioId,
          reps: this.state.reps,
          cargaKg: this.state.cargaKg,
          agoraMs: Date.now()
        })
        store.salvarFila(r.estado)
        serie = r.serie
      } catch (e) {
        showToast({ text: e && e.message ? e.message : 'Erro ao salvar' })
        return
      }
      showToast({ text: `Série ${serie.numeroSerie} salva` })
      this.atualizar()
      // Background upload; failures stay in the queue and show on Hoje.
      enviarAgora(this)
    }
  })
)
