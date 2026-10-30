// Settings App (rendered inside the Zepp app): VITA address and watch token.
// Values go to settingsStorage, which the Side Service reads on every request.
import { CHAVE_ENDERECO, CHAVE_TOKEN, CHAVE_STATUS } from './chaves'

const EXEMPLOS =
  'Exemplos: http://192.168.101.4:3900 (rede de casa) ou http://100.74.176.72:3900 (Tailscale).'

AppSettingsPage({
  build(props) {
    const storage = props.settingsStorage
    const endereco = storage.getItem(CHAVE_ENDERECO) || ''
    const token = storage.getItem(CHAVE_TOKEN) || ''
    const status = storage.getItem(CHAVE_STATUS) || 'Nenhuma sincronização ainda.'

    return View({ style: { padding: '12px 20px' } }, [
      Section({ title: 'VITA' }, [
        TextInput({
          label: 'Endereço do VITA',
          placeholder: 'http://192.168.101.4:3900',
          value: endereco,
          onChange: (valor) => storage.setItem(CHAVE_ENDERECO, String(valor).trim())
        }),
        Text({ paragraph: true, style: { fontSize: '12px', color: '#666' } }, EXEMPLOS),
        TextInput({
          label: 'Token do relógio',
          placeholder: 'Gerado em Ajustes › Amazfit T-Rex 3',
          value: token,
          onChange: (valor) => storage.setItem(CHAVE_TOKEN, String(valor).trim())
        }),
        Text(
          { paragraph: true, style: { fontSize: '12px', color: '#666' } },
          'O token aparece uma única vez ao gerar o pareamento no VITA.'
        )
      ]),
      Section({ title: 'Último contato' }, [
        Text({ paragraph: true, style: { fontSize: '12px' } }, status)
      ])
    ])
  }
})
