// Small helpers over @zos/ui for the 480x480 round screen (designWidth 480,
// so px() is 1:1 on the T-Rex 3). Touch targets are at least 76 px tall.
import { createWidget, deleteWidget, widget, align, text_style, prop } from '@zos/ui'
import { px } from '@zos/utils'

export const LARGURA = px(480)

export const COR = {
  texto: 0xffffff,
  secundario: 0xb0b0b0,
  destaque: 0xfc6950,
  aviso: 0xffc107,
  erro: 0xff5252,
  botao: 0x333333,
  botaoPress: 0x5c5c5c,
  primario: 0xfc6950,
  primarioPress: 0xfeb4a8,
  sucesso: 0x2e7d32,
  sucessoPress: 0x60ad5e,
  perigo: 0xb71c1c,
  perigoPress: 0xe57373
}

/** x for a horizontally centered box of width `w`. */
export function centro(w) {
  return Math.round((LARGURA - w) / 2)
}

/** Cuts long names so they fit a button label. */
export function abreviar(texto, max) {
  const t = String(texto)
  return t.length > max ? `${t.slice(0, max - 3)}...` : t
}

/** Tracks created widgets so a screen can be redrawn from scratch. */
export class Tela {
  constructor() {
    this.widgets = []
  }

  texto({ x, y, w, h, texto, tamanho = 28, cor = COR.texto, quebra = false, alinhar = align.CENTER_H }) {
    const t = createWidget(widget.TEXT, {
      x: px(x),
      y: px(y),
      w: px(w),
      h: px(h),
      text: texto,
      text_size: px(tamanho),
      color: cor,
      align_h: alinhar,
      align_v: align.CENTER_V,
      text_style: quebra ? text_style.WRAP : text_style.ELLIPSIS
    })
    this.widgets.push(t)
    return t
  }

  botao({ x, y, w, h, texto, aoTocar, tamanho = 32, cor = COR.botao, corPress = COR.botaoPress }) {
    const b = createWidget(widget.BUTTON, {
      x: px(x),
      y: px(y),
      w: px(w),
      h: px(h),
      text: texto,
      text_size: px(tamanho),
      color: COR.texto,
      radius: px(Math.min(24, Math.floor(h / 2))),
      normal_color: cor,
      press_color: corPress,
      click_func: aoTocar
    })
    this.widgets.push(b)
    return b
  }

  limpar() {
    for (const w of this.widgets) deleteWidget(w)
    this.widgets = []
  }
}

export function mudarTexto(w, texto) {
  w.setProperty(prop.TEXT, texto)
}
