// "Hoje" screen: workout of the day, last sync, pending items, Sincronizar,
// exercise list, Finalizar treino and rejected items.
import { replace } from '@zos/router'
import { showToast } from '@zos/ui'
import { BasePage } from '@zeppos/zml/base-page'
import { Tela, COR, centro, abreviar } from '../lib/ui'
import * as store from '../lib/armazenamento'
import { sincronizarTudo, enviarAgora } from '../lib/conexao'
import { contarPendentes, finalizarSessao, limparRejeitadas } from '../src/fila'
import { formatShortRecife } from '../src/datas'

const ALTURA_ITEM = 88
const ESPACO = 12
const MAX_REJEITADAS_VISIVEIS = 5

Page(
  BasePage({
    state: {
      tela: null,
      sincronizando: false,
      confirmarFim: false
    },

    build() {
      this.state.tela = new Tela()
      this.desenhar()
      this.sincronizar(false)
    },

    onDestroy() {
      // Late sync callbacks must not draw on the next page.
      this.state.tela = null
    },

    sincronizar(avisar) {
      if (this.state.sincronizando) return
      this.state.sincronizando = true
      this.agendarDesenho()
      sincronizarTudo(this).then(({ erro }) => {
        this.state.sincronizando = false
        this.agendarDesenho()
        if (avisar) showToast({ text: erro ? `Erro: ${erro}` : 'Sincronizado' })
      })
    },

    finalizar() {
      if (!this.state.confirmarFim) {
        this.state.confirmarFim = true
        this.agendarDesenho()
        return
      }
      this.state.confirmarFim = false
      store.salvarFila(finalizarSessao(store.carregarFila(), { agoraMs: Date.now() }))
      showToast({ text: 'Treino finalizado' })
      this.agendarDesenho()
      enviarAgora(this).then(() => this.agendarDesenho())
    },

    limparErros() {
      store.salvarFila(limparRejeitadas(store.carregarFila()))
      this.agendarDesenho()
    },

    abrirExercicio(exercicioId) {
      replace({ url: 'page/exercicio', params: JSON.stringify({ exercicioId }) })
    },

    // Redraw outside the current click callback: `desenhar` deletes every
    // widget, including the button whose handler is running.
    agendarDesenho() {
      setTimeout(() => this.desenhar(), 0)
    },

    desenhar() {
      const tela = this.state.tela
      if (!tela) return
      tela.limpar()

      const fila = store.carregarFila()
      const pacote = store.carregarPacote()
      const status = store.carregarStatus()
      const ativa = fila.sessaoAtiva
      const treino = ativa ? ativa.treino : pacote && pacote.treino
      const pendentes = contarPendentes(fila).total

      tela.texto({ x: 140, y: 24, w: 200, h: 40, texto: 'VITA', tamanho: 28, cor: COR.destaque })
      tela.texto({
        x: 60,
        y: 66,
        w: 360,
        h: 56,
        texto: treino ? treino.nome : 'Sem treino',
        tamanho: 40
      })
      tela.texto({
        x: 50,
        y: 124,
        w: 380,
        h: 34,
        texto: ativa ? 'Treino em andamento' : `Sync: ${formatShortRecife(store.carregarUltimaSync())}`,
        tamanho: 26,
        cor: ativa ? COR.aviso : COR.secundario
      })
      tela.texto({
        x: 50,
        y: 158,
        w: 380,
        h: 34,
        texto: pendentes === 1 ? '1 pendente' : `${pendentes} pendentes`,
        tamanho: 26,
        cor: pendentes > 0 ? COR.aviso : COR.secundario
      })

      let y = 196
      if (status && status.erro) {
        tela.texto({ x: 60, y, w: 360, h: 60, texto: status.erro, tamanho: 22, cor: COR.erro, quebra: true })
        y += 64
      }

      tela.botao({
        x: centro(300),
        y,
        w: 300,
        h: 84,
        texto: this.state.sincronizando ? 'Sincronizando...' : 'Sincronizar',
        cor: COR.primario,
        corPress: COR.primarioPress,
        aoTocar: () => this.sincronizar(true)
      })
      y += 84 + 2 * ESPACO

      if (!treino) {
        tela.texto({
          x: 60,
          y,
          w: 360,
          h: 100,
          texto: 'Nenhum treino no relógio. Configure o VITA no app Zepp e sincronize.',
          tamanho: 24,
          cor: COR.secundario,
          quebra: true
        })
        y += 110
      } else {
        for (const ex of treino.exercicios) {
          const feitas = ativa ? ativa.seriesFeitas[ex.exercicioId] || 0 : 0
          tela.botao({
            x: centro(400),
            y,
            w: 400,
            h: ALTURA_ITEM,
            texto: `${abreviar(ex.nome, 18)}  ${feitas}/${ex.seriesAlvo}`,
            tamanho: 28,
            cor: feitas >= ex.seriesAlvo ? COR.sucesso : COR.botao,
            corPress: feitas >= ex.seriesAlvo ? COR.sucessoPress : COR.botaoPress,
            aoTocar: () => this.abrirExercicio(ex.exercicioId)
          })
          y += ALTURA_ITEM + ESPACO
        }
      }

      if (ativa) {
        y += ESPACO
        tela.botao({
          x: centro(360),
          y,
          w: 360,
          h: 84,
          texto: this.state.confirmarFim ? 'Tocar de novo p/ finalizar' : 'Finalizar treino',
          tamanho: this.state.confirmarFim ? 26 : 32,
          cor: COR.perigo,
          corPress: COR.perigoPress,
          aoTocar: () => this.finalizar()
        })
        y += 84 + ESPACO
      }

      if (fila.rejeitadas.length > 0) {
        y += ESPACO
        tela.texto({
          x: 60,
          y,
          w: 360,
          h: 40,
          texto: `Rejeitadas: ${fila.rejeitadas.length}`,
          tamanho: 28,
          cor: COR.erro
        })
        y += 44
        for (const r of fila.rejeitadas.slice(-MAX_REJEITADAS_VISIVEIS).reverse()) {
          tela.texto({
            x: 50,
            y,
            w: 380,
            h: 64,
            texto: `${r.motivo} - ${r.descricao}`,
            tamanho: 22,
            cor: COR.erro,
            quebra: true
          })
          y += 68
        }
        tela.botao({
          x: centro(260),
          y,
          w: 260,
          h: 76,
          texto: 'Limpar erros',
          tamanho: 28,
          aoTocar: () => this.limparErros()
        })
        y += 76
      }

      // Bottom padding so the last control can scroll away from the round edge.
      tela.texto({ x: 0, y, w: 480, h: 140, texto: ' ' })
    }
  })
)
