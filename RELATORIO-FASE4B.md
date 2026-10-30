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

**Revisão após reprovação.** A primeira versão contava séries abaixo do alvo como falha. Como nenhuma das 36 sessões tem 4 séries em todos os exercícios (consulta retornou 0), o motor mandava deload em tudo; no Supino sugeria 62,5 kg. Regras atuais, com critério de topo estrito escolhido pelo proprietário:

- **Aumentar:** ao menos 2 séries válidas na carga da última sessão, todas no topo da faixa.
- **Volume:** séries executadas abaixo do alvo apenas sugerem +1 série; nunca causam deload.
- **Deload:** somente após `treino.deload_apos_falhas` sessões seguidas, na mesma carga, com série abaixo do piso da faixa.
- **1RM:** Epley sobre a melhor série da última sessão; a tela mostra série, carga, repetições e conta.

Push em produção (somente leitura), motor atual:

| Exercício | Última carga | Últimas reps | Séries | Sugestão | 1RM |
|---|---|---|---|---|---|
| Supino reto | 70,5 kg | 11/9/11 | 3/4 | MANTER 70,5 kg, +1 série | 70,5 × (1 + 11/30) = 96,35 |
| Supino inclinado | 28 kg | 12/10/8/10 | 4/4 | MANTER 28 kg | 28 × (1 + 12/30) = 39,2 |
| Desenvolvimento militar | 47 kg | 10/11/8/8 | 4/4 | MANTER 47 kg | 47 × (1 + 11/30) = 64,23 |
| Elevação lateral | 11,5 kg | 9/8/12 | 3/4 | MANTER 11,5 kg, +1 série | 11,5 × (1 + 12/30) = 16,1 |
| Tríceps corda | 29,5 kg | 9/9/8/10 | 4/4 | MANTER 29,5 kg | 29,5 × (1 + 10/30) = 39,33 |
| Tríceps testa | 23,5 kg | 8/8/11/10 | 4/4 | MANTER 23,5 kg | 23,5 × (1 + 11/30) = 32,12 |

O Supino não recebe aumento: a última sessão foi 11/9/11, não 3 × 11, e o topo da faixa é 12. Com 3 × 12 a 70,5 kg, o motor sugere 73,0 kg (teste unitário). O 1RM de 64,23 kg do militar vem da série 2 da mesma sessão (11 reps); antes a tela não identificava a série, agora identifica.

`src/lib/progressao.test.ts`: **7 testes**. Os dois casos novos — 3 × 12 com alvo 4 × 8–12 aumenta e menos séries não causam deload — falharam no motor anterior (`manter` e `deload`) e passam no atual.

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
