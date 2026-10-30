// Single-execution App Service woken by persistent alarms (@zos/alarm, store:
// true). Must finish within 600 ms and cannot use timers: it only decodes the
// alarm param and posts one notification.
import { notify } from '@zos/notification'
import { decodificarParam } from '../src/alarmes'

AppService({
  onInit(param) {
    const { titulo, mensagem } = decodificarParam(param)
    notify({
      title: titulo,
      content: mensagem,
      actions: [{ text: 'Abrir VITA', file: 'page/hoje' }]
    })
  },

  onDestroy() {}
})
