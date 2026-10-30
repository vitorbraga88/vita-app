# Fase 4 — Parte 2: correções, progressão, alimentação e notificações

## Proteção da produção

Backup consistente anterior às alterações: `/opt/data/projetos/gym-app/data/vita.db.bak-fase4b-20261030-135100`. Nenhuma nova migração de schema foi necessária; as novas opções usam defaults do catálogo, sem alterar as quatro configurações existentes.

Antes e após: **795 séries, 36 sessões, 28 pesagens, 1 usuário, 132 exercícios**. Após a implantação, `PRAGMA integrity_check` retornou `ok`; as configurações continuam `hidratacao.ativo=false`, `pesagem.ativo=false`, `pesagem.hora="07:00:00-03:00"` e `treino.ativo=false`.

## Correção 1 — água

A chave `hidratacao.meta_modo` ausente tinha default manual e, por isso, a meta do seed de 3.000 ml prevalecia sem escolha explícita. Agora o default é automático; uma escolha manual explícita continua prevalecendo e seu valor não é sobrescrito. O seed isolado calcula a meta a partir do peso.

Para 80,6 kg: 80,6 × 35 = 2.821 ml; arredondamento aos 250 ml mais próximos = **2.750 ml**. Máxima acima de 32 °C acrescenta 500 ml = **3.250 ml**; meta manual de 3.000 ml continua **3.000 ml**. Os três cenários foram exercitados em banco isolado. Em produção, a previsão observada foi 30,3 °C e `/agua` exibiu 2.750 ml: `screenshots/fase4b-agua.png`.

## Correção 2 — adesão histórica

Opção B aprovada: água compara histórico à meta atual e suplementos estimam adesão pelos horários e suplementos ativos atuais. As duas telas avisam que mudanças recalculam o histórico. Isso evita apresentar como fatos metas e horários históricos que não foram registrados.

## Progressão

O motor puro está em `src/lib/progressao.ts`, com cinco casos em `src/lib/progressao.test.ts`: `5 passed`. O exemplo de Epley 100 kg × 5 reps resulta em 116,67 kg.

Consulta somente de leitura para **Supino reto**: 12 sessões concluídas; maior e última carga 70,5 kg; última sessão 11/9/11 repetições, meta atual 4 × 8–12. O motor recomenda **62,5 kg**, deload após 12 sessões sem completar o alvo, arredondado ao incremento de 2,5 kg; confiança baixa e 1RM estimado 96,35 kg. O valor não é inventado nem implica uma quarta série inexistente. A sessão oferece Aceitar/Ajustar: `screenshots/fase4b-sessao.png`. Sem histórico ou referência, solicita carga inicial.

## TDEE

Perfil lido: 80,6 kg, 178 cm, nascimento 12/04/1996, masculino, 30 anos em 30/10/2026, quatro dias de treino e hipertrofia. Mifflin-St Jeor: 10×80,6 + 6,25×178 − 5×30 + 5 = **1.773,5 kcal**; × 1,55 = **2.748,925 kcal**; × 1,10 = **3.023,8175 kcal**; meta automática arredondada = **3.020 kcal**. Proteína 161 g, gordura 84 g, carboidrato 405 g. A tela mostra a conta; as metas atuais manuais de 2.600 kcal e 170/280/80 g foram preservadas. Captura: `screenshots/fase4b-nutricao.png`.

A idade é calculada na data de Recife; a meta automática persistida é recalculada ao alterar configuração/perfil ou registrar peso, não apenas pela passagem do aniversário.

## Hoje e ntfy

`/hoje` reúne água, suplementos, treino, refeições e peso no dia configurado; o PWA abre nessa rota. Capturas desktop e mobile: `screenshots/fase4b-hoje-desktop.png` e `screenshots/fase4b-hoje-mobile.png`. Em 390 px, overflow horizontal medido: 0.

A porta 8085 está ocupada por outro aplicativo; o proprietário aprovou **8185**. O código publica JSON na raiz do ntfy com tópico, título, mensagem limitada a 40 caracteres e prioridade. `DEPLOY.md` contém o comando de implantação. Na verificação, `curl` a `127.0.0.1:8185` retornou `000`: **NÃO EXERCITADO FIM-A-FIM**, nenhuma entrega real foi alegada. Testes com servidor simulado cobrem sucesso, falha, silêncio, idempotência e canais. Web Push permanece indisponível; `ambos` tenta ntfy e registra a indisponibilidade do Web Push. O botão “Testar agora” continua simulado. Resumo exige ativação e horário explícitos. Uma tentativa interrompida após reserva pode permanecer pendente e não é reenviada automaticamente.

## Verificação

- `npm test`: **100/100** testes em 26 arquivos; `src/lib/progressao.test.ts`: **5/5**.
- `npm run test:e2e`: **21/21**, banco isolado.
- ESLint nos arquivos afetados verificados: sem diagnósticos; build de produção concluído com TypeScript.
- Produção, `curl` às 14:09:33 de 30/10/2026 (-03:00): `/hoje`, `/agua`, `/nutricao` e `/treinos/1` **200**.
- Chromium em 390 px, páginas acima, aguardando rede ociosa: console warning/error e pageerror `[]`. As capturas rápidas de navegação também registraram cancelamentos de prefetch `ERR_ABORTED`; não são apresentadas como console limpo.

Sem push Git. A Fase 5 depende de validação do proprietário.
