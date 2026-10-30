# Catálogo curado da VITA — desenho da Fase 2

## Objetivo

Ampliar a biblioteca de 33 para aproximadamente 132 exercícios curados, todos com still, clip e instruções em pt-BR verificadas na fonte OpenGym. A aplicação de produção continuará usando `data/vita.db`; seeds e E2E permanecerão isolados em `data/vita.dev.db` e `data/vita.e2e.db`.

## Fonte e seleção

A única fonte é o repositório privado aprovado `DuarteSantos8/openGym`: tradução em `catalogue/i18n/pt-BR.json`, metadados em `catalogue/exercises/<id>.json`, still em `catalogue/media/still/<id>.webp` e clip em `catalogue/media/clip/<id>.mp4`.

Um manifesto versionado em `data/mapa-midia.json` preservará as 33 entradas existentes e acrescentará entradas explícitas para cada exercício. Cada entrada terá nome pt-BR, `og_id`, nome correspondente no i18n, categoria de curadoria, nível, mecânica e a fonte `opengym`. Só entram candidatos cuja tradução tenha instruções, cujo metadata exista e cujos dois arquivos de mídia estejam disponíveis.

O objetivo de curadoria é no mínimo 12 exercícios em cada família: peito, costas, ombros, bíceps, tríceps, quadríceps, posterior de coxa, glúteos, panturrilha, core/abdômen e cardio. O schema existente só aceita `pernas`; quadríceps e posterior serão persistidos como `grupo_muscular='pernas'`, diferenciados por `musculo_alvo` e pela categoria do manifesto. Isso evita reconstruir tabela ou editar os 33 registros existentes, preservando a regra de migration aditiva.

## Importação

Um importador dedicado fará a operação em quatro etapas:

1. Ler e validar integralmente o manifesto contra i18n, metadata e os dois assets remotos, sem modificar SQLite.
2. Baixar somente assets ausentes para caminhos temporários e publicar cada arquivo após download completo.
3. Antes da primeira escrita na produção, criar um backup datado de `data/vita.db` e registrar o SHA-256 e as contagens protegidas: `sessao_serie=795`, `sessao=36`, `peso_registro=28`, `usuario=1`.
4. Em uma transação SQLite, criar um índice único parcial aditivo para `(fonte, fonte_id)`, inserir apenas fontes OpenGym inexistentes e completar somente campos nulos de registros existentes. Nenhuma operação de remoção, recriação de schema ou alteração em sessões, séries, pesagens e usuário é permitida.

A `Cadeira abdutora`, hoje a única entrada sem mídia, será enriquecida apenas se houver correspondência OpenGym validada com still, clip e instruções pt-BR. Caso a fonte não tenha um candidato inequívoco, a importação para e o relatório declara o bloqueio em vez de inventar uma equivalência.

## Idempotência e contratos

A chave parcial única `(fonte, fonte_id)` impede duplicação de importados. Atualizações usam `COALESCE` para não substituir campos curados existentes. O importador deve resultar no mesmo total após duas execuções e nunca executar contra os bancos de seed/E2E sem uma opção explícita de ambiente.

O catálogo importado terá `sistema=1`, `fonte='opengym'` e `fonte_id=<id>`. Still, clip e instruções ficam armazenados localmente em `public/midia/`; não haverá busca de mídia em runtime.

## Verificação

A entrega prova: total entre 120 e 150; distribuição por família; igualdade entre total, still e clip; tamanho de `public/midia`; total de `sistema=1`; ffprobe de três clips; SHA-256, `PRAGMA integrity_check` e as quatro contagens protegidas; screenshot da biblioteca; e `curl` com `200 video/mp4` para um clip novo servido pela aplicação de produção.

Testes unitários cobrem: rejeição de fonte incompleta, correspondência exata i18n, idempotência por `(fonte, fonte_id)`, preenchimento sem sobrescrita e rejeição de destino fora da produção explicitamente autorizada. Playwright confirma catálogo maior e thumbnails locais.
