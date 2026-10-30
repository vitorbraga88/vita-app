# VITA no pulso — mini-app Zepp OS (Amazfit T-Rex 3)

Mini-app do VITA para o **Amazfit T-Rex 3** (Zepp OS 4.5, API_LEVEL 4.0, tela redonda
480×480). Mostra o treino do dia, registra séries **offline** no relógio, envia ao VITA
quando há rota até o servidor e cria os lembretes de treino como alarmes nativos.
Especificação: `docs/superpowers/specs/2026-10-30-amazfit-design.md` (contrato da API v1).

## Como funciona

```
Relógio (Device App + App Service) ──BLE/ZML──> Side Service (app Zepp no celular) ──HTTP──> VITA
                                                      ▲
                                Configurações (app Zepp) ─ settingsStorage (endereço, token)
```

- **Device App** (`page/`, `lib/`): telas *Hoje* e *Exercício*; fila offline em
  `LocalStorage`; pede ao Side Service, via ZML, para baixar o pacote e enviar a fila.
- **Side Service** (`app-side/index.js`): lê endereço e token do `settingsStorage` e chama
  `GET {endereço}/api/relogio/pacote` e `POST {endereço}/api/relogio/series` com
  `Authorization: Bearer <token>`. Aceita `res.body` como string JSON ou objeto e devolve
  `{ ok, dados }` ou `{ ok: false, erro }` ao relógio. Também grava o último resultado em
  `vitaStatus`, exibido nas Configurações.
- **Configurações** (`setting/index.js`): campos *Endereço do VITA* e *Token do relógio*.
- **App Service** (`app-service/lembrete.js`): acordado pelos alarmes; chama `notify()` com
  título e mensagem e termina (execução única, sem timers, limite de 600 ms).
- **Lógica pura** (`src/`, sem `@zos/*`): fila, lote, aplicação da resposta, agenda de
  alarmes, datas e regras HTTP — testada com Vitest.

### Telas

- **Hoje**: nome do treino (ou "Sem treino"), última sincronização, nº de pendentes, erro da
  última sincronização, botão **Sincronizar**, lista de exercícios (`feitas/alvo`, verde quando
  completo), **Finalizar treino** (dois toques para confirmar) e itens **rejeitados** com o
  motivo do servidor e botão *Limpar erros*.
- **Exercício**: "Série N de M" ("Série N (extra)" além do alvo), alvo `repsAlvo`, sugestão
  `cargaSugeridaKg (tipoSugestao)`, ± reps (1–100), ± carga em 0,5 kg e 2,5 kg (0–500 kg),
  **Concluir série**, *Voltar* (ou deslizar para a direita). Valores iniciais: último registro
  da sessão › sugestão do servidor › última carga/reps › mínimo do alvo.
- Botões com 76–96 px de altura; a página rola livremente (padrão do Zepp OS).

### Fila offline e sincronização

- Sessão começa na **primeira série concluída** (`iniciadaEm` = horário dessa série) e guarda
  uma cópia do treino, para a tela não mudar se um pacote novo chegar no meio do treino.
- Ids gerados no relógio: `s-<tempo base36>-<10 aleatórios>` (sessões) e `r-…` (séries),
  sempre dentro de `[A-Za-z0-9_-]{8,64}`.
- Envio **ao abrir** o app (envia a fila e depois baixa o pacote), **ao concluir série** e
  **ao finalizar**. Lotes com no máximo **50 sessões / 300 séries**; até 5 lotes por
  sincronização. Séries cuja sessão ainda pendente não coube no lote esperam o próximo lote.
- Só saem da fila ids presentes em `aceitas` ou `duplicadas`. Ids em `rejeitadas` saem da
  fila de envio e ficam visíveis em *Hoje* com o motivo (não são reenviados). Ids não citados
  na resposta continuam pendentes. Uma sessão finalizada enquanto o envio do seu início
  estava em andamento continua pendente e é reenviada com `finalizadaEm`.
- A resposta é aplicada sobre a fila **relida** do armazenamento, então séries registradas
  durante um envio não se perdem.

### Datas e fuso horário

Todas as datas enviadas usam **offset fixo `-03:00`** (America/Recife, sem horário de verão
em vigor), calculado a partir do instante UTC (`Date.now()`), por exemplo
`2026-10-31T18:05:00-03:00`. Motivo: o Mini Program pode não ter acesso a um fuso horário
configurado no relógio; o relógio sincroniza a hora com o celular, então o instante UTC é
confiável e a conversão fixa evita depender do fuso do dispositivo.

### Alarmes

A cada pacote recebido, o relógio cancela os ids de alarme salvos no último pacote e cria um
alarme por item de `alarmes` (futuros, um por `chave`, no máximo 14) com
`set({ url: 'app-service/lembrete', time: em, param, store: true })`. `param` leva
`{"t": título, "m": mensagem}` em JSON; o App Service decodifica e chama `notify()`.
Os ids criados ficam salvos para o próximo cancelamento.

## Instalar no relógio

Pré-requisitos: Node 22 (`export PATH=/usr/local/bin:$PATH`), conta de desenvolvedor Zepp
(<https://console.zepp.com/>), app Zepp no celular pareado com o T-Rex 3.

```bash
cd /opt/data/projetos/gym-app/relogio
npm ci                     # instala zeus-cli 1.9.3, device-types 4.0.0 e zml 0.0.43
npx zeus login             # abre o login da conta de desenvolvedor Zepp
npx zeus preview           # compila e mostra um QR code no terminal
```

No celular: app Zepp › **Perfil › T-Rex 3 › Modo desenvolvedor** e leia o QR code
(se o *Modo desenvolvedor* não aparecer, veja <https://docs.zepp.com/docs/guides/faq/developer-mode/>).
O `appId` `27391` foi sorteado na faixa usada pelo `zeus create` (20000–30000); se a conta
exigir um appId registrado, crie o app no console Zepp e troque `app.appId` em `app.json`.

> `zeus-cli` 1.9.3 publica a dependência `zeppos-app-utils` em `private-modules/` sem
> vinculá-la; o `package.json` a vincula com
> `file:node_modules/@zeppos/zeus-cli/private-modules/zeppos-app-utils`. O pacote homônimo
> público do npm **não** é usado.

## Configurar endereço e token

1. No VITA, em **Ajustes › Amazfit T-Rex 3**, ligue o Amazfit, ligue *sincronizar treino* e
   gere o token (ele aparece **uma única vez**).
2. No app Zepp: **Perfil › T-Rex 3 › Apps › VITA › Configurações**.
   - *Endereço do VITA*: `http://192.168.101.4:3900` (rede de casa) ou
     `http://100.74.176.72:3900` (Tailscale). Sem `http://` o app completa sozinho; a barra
     final é removida.
   - *Token do relógio*: o token gerado no passo 1.
3. Abra o VITA no relógio: ele sincroniza ao abrir. O resultado da última chamada aparece em
   *Último contato* nas Configurações e o erro (se houver) na tela *Hoje*.

## Desenvolvimento

```bash
# Testes da lógica pura (Vitest do projeto raiz, config em relogio/vitest.config.mjs)
cd /opt/data/projetos/gym-app && npx vitest run --root relogio

# Pacote instalável (não exige login)
cd relogio && npx zeus build     # gera dist/<appId>-VITA-<versão>-<data>.zab
```

Os testes usam os *globals* do Vitest (sem `import ... from 'vitest'`) porque o `zeus build`
passa **todo** arquivo `.js` do projeto pelo rollup — inclusive testes — e o import do Vitest
quebra esse passo ("when building multiple chunks…"). Os testes não entram no `.zab`.

Origem da estrutura: template `os3.0/app/empty` do `@zeppos/zeus-cli` 1.9.3
(`private-modules/zeppos-app-utils/dist/public/template/`, de onde vêm `jsconfig.json` e o
ícone; o `global.d.ts` do template foi omitido porque o `tsc`/ESLint da raiz o incluiriam e
injetariam os tipos globais do Zepp no projeto Next), com comunicação ZML e Configurações baseadas em
`application/4.0/todo-list` e App Service/alarme/notificação baseados em
`application/3.0/3.0-feature` do repositório oficial
<https://github.com/zepp-health/zeppos-samples> (commit `7cee748`).

## Limitações

- **Não testado em relógio real** nem no simulador: exige `zeus login`/`zeus preview` com a
  conta do dono. Foram exercitados apenas os testes da lógica pura e o `zeus build`.
- **App Service**: execução única com limite de **600 ms** e sem timers; por isso só decodifica
  o `param` e chama `notify()`. Se o `param` não chegar, a notificação usa "VITA / Hora do
  treino". Os alarmes só são atualizados quando um pacote é recebido (abrir o app ou tocar em
  *Sincronizar*).
- **Offline**: séries ficam no relógio até haver Bluetooth com o celular **e** rota do celular
  até o VITA (Wi-Fi de casa ou Tailscale). O pacote baixado fica salvo, então o treino aparece
  sem conexão. Sem nenhuma sincronização prévia não há treino para mostrar.
- O Side Service só roda com o app Zepp ativo no celular; o tempo-limite de cada pedido do
  relógio é 30 s.
- O botão físico de voltar pode fechar o app em vez de voltar para *Hoje* (as telas trocam por
  `replace`); nada se perde, a fila está salva.
- `@zeppos/device-types` 4.0.0 não declara `showToast`/`deleteWidget` em `@zos/ui`, embora a
  documentação oficial os documente nesse módulo; o código segue a documentação.
- Um relógio por usuário (gerar token novo no VITA invalida o anterior).

## APIs Zepp usadas (documentação oficial)

| API | Uso | Documentação |
|---|---|---|
| `app.json` (v3, `targets`, `permissions`, `app-service`) | Configuração, alvo T-Rex 3 (`deviceSource` 8716544/8716545/8716547) | <https://docs.zepp.com/docs/reference/app-json/> · <https://docs.zepp.com/docs/reference/related-resources/device-list/> |
| Permissões | `device:os.alarm`, `device:os.notification`, `device:os.local_storage`, `device:os.bg_service`, `data:os.device.info` | <https://docs.zepp.com/docs/guides/framework/device/permission/> |
| `fetch` (Side Service) | GET pacote / POST séries; `res.body` string ou objeto (não há código de permissão de rede documentado) | <https://docs.zepp.com/docs/reference/side-service-api/fetch/> |
| ZML (`BaseApp`, `BasePage.request`, `BaseSideService.onRequest`) | Mensagens relógio ↔ Side Service | <https://docs.zepp.com/docs/guides/architecture/arc/> · <https://docs.zepp.com/docs/guides/tools/npm/officially-recommended/> · <https://github.com/zepp-health/zml> |
| `settings.settingsStorage` | Endereço/token lidos pelo Side Service | <https://docs.zepp.com/docs/reference/side-service-api/settings-storage/> |
| `AppSettingsPage`, `View`, `Section`, `Text`, `TextInput` | Tela de Configurações | <https://docs.zepp.com/docs/guides/framework/app-settings/register/> · <https://docs.zepp.com/docs/reference/app-settings-api/ui/view/> · <https://docs.zepp.com/docs/reference/app-settings-api/ui/section/> · <https://docs.zepp.com/docs/reference/app-settings-api/ui/text/> · <https://docs.zepp.com/docs/reference/app-settings-api/ui/textinput/> |
| `@zos/storage` `LocalStorage` | Fila, pacote, ids de alarme, status | <https://docs.zepp.com/docs/reference/device-app-api/newAPI/storage/localStorage/> |
| `@zos/alarm` `set` / `cancel` | Alarmes persistentes (`store: true`) que acordam o App Service | <https://docs.zepp.com/docs/reference/device-app-api/newAPI/alarm/set/> · <https://docs.zepp.com/docs/reference/device-app-api/newAPI/alarm/cancel/> |
| `@zos/notification` `notify` | Notificação do lembrete | <https://docs.zepp.com/docs/reference/device-app-api/newAPI/notification/notify/> |
| `AppService` | Serviço de execução única | <https://docs.zepp.com/docs/guides/framework/device/app-service/> · <https://docs.zepp.com/docs/reference/device-app-api/newAPI/global/AppService/> |
| `App`, `Page` | Ciclo de vida | <https://docs.zepp.com/docs/reference/device-app-api/newAPI/global/App/> · <https://docs.zepp.com/docs/reference/device-app-api/newAPI/global/Page/> |
| `@zos/ui` `createWidget` (`TEXT`, `BUTTON`), `deleteWidget`, `setProperty`, `showToast` | Interface | <https://docs.zepp.com/docs/reference/device-app-api/newAPI/ui/createWidget/> · <https://docs.zepp.com/docs/reference/device-app-api/newAPI/ui/widget/TEXT/> · <https://docs.zepp.com/docs/reference/device-app-api/newAPI/ui/widget/BUTTON/> · <https://docs.zepp.com/docs/reference/device-app-api/newAPI/ui/deleteWidget/> · <https://docs.zepp.com/docs/reference/device-app-api/newAPI/ui/setProperty/> · <https://docs.zepp.com/docs/reference/device-app-api/newAPI/ui/showToast/> |
| `@zos/utils` `px` | Escala pelo `designWidth` 480 | <https://docs.zepp.com/docs/reference/device-app-api/newAPI/utils/px/> |
| `@zos/router` `replace` | Navegação Hoje ↔ Exercício | <https://docs.zepp.com/docs/reference/device-app-api/newAPI/router/replace/> |
| `@zos/interaction` `onGesture` / `offGesture` | Deslizar para a direita volta para Hoje | <https://docs.zepp.com/docs/reference/device-app-api/newAPI/interaction/onGesture/> · <https://docs.zepp.com/docs/reference/device-app-api/newAPI/interaction/offGesture/> |
| `setTimeout` (só nas páginas) | Redesenhar fora do callback do botão | <https://docs.zepp.com/docs/reference/device-app-api/newAPI/global/setTimeout/> |
| Rolagem padrão da página | `SCROLL_MODE_FREE` é o padrão | <https://docs.zepp.com/docs/reference/device-app-api/newAPI/page/setScrollMode/> |
| Zeus CLI (`login`, `preview`, `build`) | Instalação e pacote | <https://docs.zepp.com/docs/guides/tools/cli/overview/> |
