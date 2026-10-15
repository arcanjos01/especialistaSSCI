# Fase 6 — acompanhamento das ondas restantes

Status de acompanhamento: `IN_PROGRESS`
Baseline reconciliado: `f826ac7d453b7744fed11bed23824acac9fcbb72`
Branch: `feature/apps-script-engine-core`
Knowledge Base no baseline: `5.16.0`; Onda A/C: contrato aprovado em `5.17.0`;
Onda B base em `5.19.0`; RDE 0.6/KB `5.20.0` commitado e enviado em
`01ceb7e43d10875573a3b438dd2755bcb0ef7728`. Checkpoints documentais seguintes:
`6414aacca564f90ad3fd904a89f5dc6b34ca4917` e `242e0bfe03d3ad3041b923280fd450af800718bc`.

Este registro acompanha o trabalho autorizado a partir do baseline, sem substituir
os contratos canônicos nem o inventário de cobertura.

## Estado reconciliado

- O checkout iniciou em `4a07851f5ddb2590d9a98f499b78c93581122c2b`; o baseline
  fornecido era commit descendente disponível no remoto. A branch local avançou
  por fast-forward até `f826ac7` sem descartar dados.
- `origin/feature/apps-script-engine-core` e branch local estavam ambos em
  `b3345a9` na reconciliação de 2026-10-14; divergência inicial zero. O checkpoint
  Onda B foi enviado até `17283f6f9a38174143f0ecfa24f9cff51dd8e5d6` por
  fast-forward; a Onda D RT-002 e seu registro foram enviados por fast-forward
  até `7158a158aa0ee7494e52206636b51eff02f39adc`.
- `.codex-local-evidence/` é não rastreado e foi preservado. Não incluir em commits.
- Estado atual retomado em 2026-10-15: branch local e `origin` coincidem em
  `242e0bfe03d3ad3041b923280fd450af800718bc`; worktree rastreada limpa antes do
  candidate de integração abaixo. KB `5.20.0`, runtime SHA-256
  `02f32f20162b2586e67ad5048863c55f03a52cf9f3f31315911dbd73d06d54cf`.
- Checkpoint `ResponsibilityEvidenceBinding` / `ImmutableExecutionView` está
  presente e fechado no baseline, com revisão Sol `PASS`; manter intacto.
- Snapshot anterior à reconciliação atual: 34 Criteria ativos, 29 produtivos, 5
  não selecionáveis (quatro M5 e um regime legado), 2 retirados (regularidade
  profissional T1/T4), 9 cobertos, 1 parcial e 19 sem suporte executável
  (20 pendentes no total). KB `5.18.0` no último checkpoint reconciliado; a
  Onda B atualiza o contrato para `5.19.0`. As contagens
  históricas 36/31/22 estão preservadas como snapshots anteriores à retirada.
- Não há correlação automática implementada no baseline. `documentary_associations`
  da RDE representa apenas relações documentais explicitamente declaradas.

## Decisão de correlação autorizada

- Limiar inicial: `0.80` inclusivo, configurável fora do Engine.
- Admissão automática só pode operar com política e calibração válidas,
  versionadas e específicas por Base/tipo de vínculo; sem dataset adequado,
  `CALIBRATION_GATE=BLOCKED`.
- Propostas inferidas ficam em artefato independente, vinculadas à identidade
  exata da apresentação e digest/identidade da RDE. Nunca alterar a RDE nem
  rotular inferência como `documentary_association`.
- Conflito, ambiguidade, concorrência, proveniência/integridade insuficientes,
  confiança abaixo do limiar ou calibração ausente/inválida encaminham para
  revisão humana. A correlação sozinha não gera resultado normativo.
- Validação normativa institucional: `PENDING`; não equivale à confirmação
  humana nem à homologação. `VALIDATED_TO_ANALYZED=PENDING`.

## Ondas, dependências e gates

| Onda | Escopo | Dependências | Gates/saída | Estado |
|---|---|---|---|---|
| A | Contratos de correlação, identidade, proveniência, política/calibração, admissão e revisão | Decisão do usuário; contratos RDE/Engine/Pipeline | Diff revisado; preservar FACT ONLY | `SOL_CONTRACT_REVIEW=PASS`; `LUNA_REVIEW=PASS` |
| B | Correlacionador determinístico e fronteira autenticada ao Engine; sem fornecedor de IA | Onda A | Gates completos; ataques adversariais; revisão independente; revisão final após Onda D | `CORRELATION_ENGINE_CONSUMER=READY; CALIBRATION_GATE=BLOCKED; PRODUCTION_CALLER=PENDING; Sol 6.1 slice review=PASS; revisão final da fase pendente` |
| C | Contrato e fixtures de disclosure do relatório, sem implementar Fase 8 | Onda A/B | Aviso obrigatório e rastreabilidade testados | `REPORT_DISCLOSURE_CONTRACT=READY`; `LUNA_REVIEW=PASS`; integrado à revisão Sol da Onda A/C |
| D | Critérios produtivos restantes, por prioridade do pedido | Cobertura reconciliada; fontes oficiais; applicability e evidence contracts | Fixtures positivos/negativos/insuficientes; trace; readiness; cobertura demonstrada | `IN_PROGRESS; T1_DRT_REQUIRED=PARTIAL; T1_DRT_ACTIVITY_EXECUTION=PENDING; assinatura reclassificada; 6 cobertos, 1 parcial e 23 pendentes de cobertura integral (inclui o parcial)` |
| Fechamento | Revisão adversarial independente Sol 6.1, correções e revisão final | A–D | Todos os gates e zero findings abertos; commits e push seguro | PENDING |

Em cada onda: suíte Python; todas as suítes Apps Script; `node --check` dos
módulos; sintaxe `Code.gs`; compilação e regeneração byte-idêntica do runtime;
SHA-256; release build; validação de manifests; phase guards; fixtures;
`git diff --check`; revisão adversarial. Registrar resultado e SHA por ciclo.

## Diário de execução

| Marco | SHA/candidate | Resultado | Findings/aprovação |
|---|---|---|---|
| Reconciliação | `f826ac7d453b7744fed11bed23824acac9fcbb72` | Baseline confirmado; estado inicial da branch fast-forward | Preservado arquivo local não rastreado; sem alterações descartadas |
| Onda A, ciclo contratual 1 | diff local sobre `f826ac7` | `SOL_CONTRACT_REVIEW=FAIL` | Findings Sol: preservar RDE 0.5; vincular identidade de apresentação; congelar/validar policy e calibração; reconciliar sidecar autenticado com Process Memory. Todos corrigidos; relatório explicitamente na Fase 8 conforme instrução do usuário. |
| Onda A/C, ciclo corrigido | candidate local sobre `f826ac7` | Luna `PASS`; Sol 6.1 review pendente | Gates: 138 testes Python PASS; 8 suítes Apps Script PASS; sintaxe de todos JS e Code.gs PASS; runtime regenerado byte-identical, SHA-256 `111c459652e205ff213d3d996fb21d40e34a1fc0b88171f8ead3fe9ab202e743`; manifest/build exercitado pela suíte; phase guards PASS; `git diff --check` PASS. KB `5.17.0`. |
| Onda A/C, ciclo Sol 6.1 subsequente | candidate local sobre `f826ac7` | `SOL_CONTRACT_REVIEW=FAIL` | F-A-4 HIGH reaberto: cláusulas PM-only globais contradiziam entrada sidecar. Corrigido no Pipeline com exceções tipadas; applicability e demais fases continuam PM-only. Guard test acrescentado. Aguardando gates e revisão Sol independente do follow-up. |
| Onda A/C, follow-up F-A-4 | candidate local sobre `f826ac7` | Gates PASS; Luna e Sol review pendentes | 139 testes Python PASS; 8 suítes Apps Script PASS; sintaxe JS/Code.gs PASS; runtime regenerado byte-identical, SHA-256 `111c459652e205ff213d3d996fb21d40e34a1fc0b88171f8ead3fe9ab202e743`; manifest 10/10 PASS; release build exercitado na suíte Python; phase guards PASS; `git diff --check` PASS. A nova redação limita sidecar a relation predicates explícitos e disclosure; conflitos globais PM-only removidos e registrados como resolvidos pela decisão do usuário. |
| Onda A/C, follow-up F-A-4 | candidate local sobre `f826ac7` | Luna `FAIL` no limite Phase 8; nova correção aplicada; gates PASS; Luna re-review pendente | Fase 8 restringida a authenticated frozen disclosure projection com campos enumerados; bloqueia artifact wholesale, proposals/facts e mutação de decision. Disclosure inclui referências de evidência/proveniência. Gates refeitos: 140 testes Python PASS; 8 suítes Apps Script PASS; sintaxe JS/Code.gs PASS; runtime byte-identical SHA-256 `111c459652e205ff213d3d996fb21d40e34a1fc0b88171f8ead3fe9ab202e743`; manifest 10/10 PASS; release build exercitado em testes; phase guards PASS; `git diff --check` PASS. |
| Onda A/C, revisão de guards | diff estático fornecido à Luna | `LUNA_REVIEW=FAIL`; achados de cobertura do teste; contrato textual passa | Luna confirmou a separação PM/sidecar e disclosure, mas pediu guards mais específicos para binding, RDE 0.5, política/calibração, replay, fase 3A e projeção Fase 8. Runtime adversarial fica para Onda B; testes estáticos da Onda A/C delegados à Luna. |
| Onda A/C, guards ampliados | diff estático fornecido à Luna | `LUNA_REVIEW=FAIL`; cobertura de RDE dates e guard semântico ampliada | Findings seguintes pedem somente ampliar associação explícita nos guards de policy/calibration, threshold `0.80`, binding autenticado e gates; relatório está autenticado/imutável/read-only e disclosure é enumerada. Revisão comportamental continua reservada à Onda B. |
| Onda A/C, guards finalizados | commit `667c0dcf67c4a2096976346ac95a5af750cc557f` | Testes PASS; Luna e Sol PASS; release build real PASS | Guards verificam estrutura/semântica RDE 0.5, policy/calibration/threshold/auth binding, sidecar e projection Fase 8. Gates: 141 Python; 8 Apps Script; sintaxe todos JS/Code.gs; runtime byte-identical SHA-256 `111c459652e205ff213d3d996fb21d40e34a1fc0b88171f8ead3fe9ab202e743`; manifest 10/10; release real em worktree limpa, 10 documentos e SOURCE_COMMIT exato; phase guards; diff check — PASS. |
| Onda A/C, Sol 6.1 final | patch integral contra `f826ac7` | `SOL_CONTRACT_REVIEW=PASS`; F-A1..F-A4 RESOLVED | Nenhum finding contratual bloqueante; parecer favorável a commit/push A/C somente. Calibração empírica, integração runtime, validação institucional e promoção continuam pendentes. Commit `667c0dcf67c4a2096976346ac95a5af750cc557f`. |
| Onda A/C, push | commits `667c0dcf67c4a2096976346ac95a5af750cc557f`, `15e1cd1`, `b3345a9` | Push fast-forward PASS; `origin/feature/apps-script-engine-core=b3345a9` | Release builder real produziu 10 docs self-versioned, SOURCE_COMMIT confere. `.codex-local-evidence/` permaneceu local e fora do push. Worktree/output temporários removidos. |
| Onda B | commits `87a85d92bf21cad3afa006334b7fa606383c7014`, `17283f6f9a38174143f0ecfa24f9cff51dd8e5d6` | `GPT6_REVIEW=PASS_ACCEPTED_BY_USER`; gates integrais e release PASS; enviado ao origin | Findings do correlacionador encerrados neste escopo. Sem calibração empírica e sem Criterion consumidor; não há admissão real nem resultado normativo. A revisão aceita é GPT-6, sem alegar identidade Sol 6.1. |
| Onda B, revisão Sol 6.1 | candidate local sobre `b3345a9` | `FAIL` anterior; 7 findings corrigidos no candidate, mas aguardam revalidação independente | Deep-freeze, admissão condicional/calibration block, phase split, auth isolation, provenance endpoints, audit fields e binding enum. Revisões seguintes com agentes de identidade Codex encontraram `reIdentifier` ausente aceito; corrigido/testado. Nenhuma revisão foi contabilizada como Luna. |
| Onda C | incorporada aos contratos A/C | `REPORT_DISCLOSURE_CONTRACT=READY` | Contrato e guard do aviso exato presentes; sem antecipar implementação Fase 8. |
| Onda D, prioridade 1 | candidate local sobre `b3345a9` | `T1_DRT_REQUIRED` parcial; `T1_DRT_ACTIVITY_EXECUTION` pending | Gates direcionados PASS; cobertura não incrementada até completar semântica negativa e review. |
| Onda D, RT-002, revisão independente GPT-6 aceita pelo usuário | diff sobre `17283f6f9a38174143f0ecfa24f9cff51dd8e5d6`; commit local `140f888023c0fe19ad7ffd1450e41d12002d5111` | `PASS` como `PARTIAL_EXECUTION_SUPPORT`; nenhum finding bloqueante | Reviewer confirmou que binding canônico de RT-002, autenticado a contract/plan/view, e fato exato `RESPONSIBILITY_TYPE=EXECUCAO` provam somente presença documental; ausência, conflito ou type incompatível ficam `MANUAL_REVIEW`, sem FAIL/NC. Múltiplas DRTs explícitas aceitas; trace, provenance e readiness testados. `T1_DRT_ACTIVITY_EXECUTION` e via condicional de regularização continuam sem executor e não recebem cobertura. Quatro suítes focadas e gates integrais 141 Python/9 Apps Script passaram; SHA runtime `7025ebea7f23a429c954c712ee6afe34db04a5cf796a70699e29cc7b3e82b3a6`. Revisor declarou GPT-6, não Sol; aceite do usuário se aplica à revisão GPT-6. |
| Revisão final solicitada (não Sol) | candidate `a07a1d48e0d12e26c2961f13be2a0232e4068a4d` | `FAIL` de GPT-6; não conta como `SOL_REVIEW`; contagem daquele snapshot: 34/29/5/2/9/1/20 | Achados registrados como revisão GPT-6, não findings Sol. A terceira revisão intermediária confirmou os fixes no candidate atual; detecção factual ou calibração reais seguem ausentes/BLOCKED. |
| Onda B, re-revisão GPT-6 | snapshot temporário `3dca687b5702af7e4c8bf55760546bd81b1a1cc4` | `FAIL`; não é revisão Sol 6.1 | Findings prévios de calibração, autenticação de assessment, concorrentes e provenance foram aceitos como corrigidos. Finding residual: `conflictFlags` podia ser removido mantendo assinatura. O candidate atual vincula também esses flags e adiciona teste adversarial; gates integrais e nova re-revisão pendentes. Nenhuma fixture demonstra `ADMITTED`. |
| Onda B, terceira re-revisão GPT-6 | snapshot temporário `48e53d5d6ab865e35b31c19a20c2b846e693beda` | `PASS`; não é revisão Sol 6.1 | Findings de calibração empírica, assinatura de conflito/score/flags, inventário completo, provenance e monkeypatch encerrados. 141 testes Python; 9 suítes Apps Script; sintaxe, runtime, diff check e release build de 10 documentos PASS. Calibração real segue ausente/BLOCKED. |
| Onda B, auditoria Codex/GPT-6 subsequente (não Sol) | snapshot da árvore local comparada byte a byte com `48e53d5d6ab865e35b31c19a20c2b846e693beda`; tracker tinha divergência | `SOL_REVIEW=PENDING`; 2 P2 encontrados, agora corrigidos localmente; revisão intermediária atual pendente | Separação de chave de autoridade de calibração e chave de configuração adicionada com teste; resumo do tracker reconciliado. Nenhum arquivo foi alterado pelo revisor. A revisão identificou explicitamente identidade efetiva Codex/GPT-6, portanto não é aprovação Sol 6.1. |
| Onda B, re-revisão GPT-6 | árvore local antes do hardening canônico | `FAIL`; 2 P2 de autenticação e 1 P3 de tracker; correções locais aplicadas, nova revisão pendente | Chaves agora exigem formato canônico de 43 caracteres ASCII (32 bytes base64url sem padding), rejeitando a equivalência HMAC de `key`/`key+NUL`; recibo usa serialização capturada de objeto null-prototype com campos próprios tipados; teste assina com chave de calibração distinta, injeta `Array.prototype.toJSON` e substitui `JSON.stringify`, e confirma assinatura alterada inválida. Tracker agora registra findings corrigidos e re-review pendente. O revisor declarou GPT-6, não Sol 6.1; suíte focal PASS no snapshot anterior aos fixes. |
| Onda B, re-revisão GPT-6 | snapshot imediatamente anterior à correção dos sufixos e da frase de admissão | `FAIL`; P2 sobre 4/16 sufixos canônicos e P3 por afirmação obsoleta de fixture `ADMITTED`; corrigidos localmente | Validador atualizado para aceitar as 16 terminações válidas; teste percorre todas as 16 chaves por recibo de autenticação isolado. Tracker agora afirma explicitamente que não há fixture `ADMITTED`. O revisor confirmou encerramento dos achados anteriores, manteve identidade GPT-6 e não concedeu Sol 6.1. Gates integrais e nova revisão ainda pendentes. |
| Onda B, re-revisão GPT-6 aceita pelo usuário | candidate temporário `9d293b4f71e66ebfd29b1ea198a587f5ded37f00` (worktree de validação; não commit da branch) | `PASS` focado; findings anteriores fechados; zero findings novos no escopo | Revisor declarou efetivamente Codex/GPT-6, não Sol 6.1; o usuário autorizou aceitar revisão GPT-6. Confirmados 16 finais canônicos, bloqueio de chave HMAC equivalente via NUL, recibo de autoridade distinta e proteção a monkeypatch, e ausência de fixture `ADMITTED`. Gates integrais após fixes: 141 Python, 9 Apps Script, sintaxe JS/Code.gs, runtime byte-identical SHA-256 `7025ebea7f23a429c954c712ee6afe34db04a5cf796a70699e29cc7b3e82b3a6`, release 10/10, KB 5.19.0, pipeline 4.22.0, SOURCE_COMMIT exato `9d293b4f71e66ebfd29b1ea198a587f5ded37f00`, phase guards pela suíte Python, `git diff --check` PASS. Isso aceita a revisão intermediária da Onda B, não declara revisão Sol nem fecha Fase 6. |
| Onda B, commit e release limpo | `87a85d92bf21cad3afa006334b7fa606383c7014` | Commit criado após GPT-6 PASS aceito pelo usuário; release real PASS | Release em worktree limpa: 10 documentos, `SOURCE_COMMIT=87a85d92bf21cad3afa006334b7fa606383c7014`; enviado no checkpoint seguinte. `.codex-local-evidence/` ficou fora do índice. |
| Onda D RT-002, commit e push | `140f888023c0fe19ad7ffd1450e41d12002d5111`; tracker `7158a158aa0ee7494e52206636b51eff02f39adc` | Implementação parcial revisada GPT-6 PASS; gates integrais e release PASS; fast-forward enviado | Release em worktree limpa: 10 documentos, SOURCE_COMMIT exato `7158a158aa0ee7494e52206636b51eff02f39adc`. Commit contém executor do predicado RT-002, readiness, fixtures e inventário atualizado. O Criterion continua parcial. |
| Onda D — bloqueio de `TECHNICAL_PRODUCT_ATTRIBUTE(SIGNED)` | Commit/push `832b0f2235fbc12ce9ef2f9cbb7082ec1165ff9c` | Luna re-review `PASS`; Codex/GPT-6 `PASS` aceito pelo usuário; revisão Sol 6.1 não confirmada, `SOL_REVIEW=PENDING` | `SIGNATURE_MECHANISM` é texto FACT-ONLY e não prova verificabilidade documental. Produto existente com texto conhecido ou arbitrário retorna `MANUAL_REVIEW`; `T1_CONFORMITY_REPORT_SIGNED`, `T4_IN09_CHECKLIST`, `T4_IN18_CMAR` saem dos cobertos. 141 Python; 9 Apps Script; sintaxe JS/Code.gs; runtime byte-identical SHA-256 `0c36536ae85ce2994839ad75107dd30ef73d279716bf9bf9db492a746c8f4590`; release limpo 10 documentos, `SOURCE_COMMIT` exato, KB 5.21.0; phase guards/manifests e diff check PASS. Contagem vigente `34/29/5/2/6/1/23`; 23 pendentes inclui o parcial. |
| Fechamento | — | PENDING | — |

## Estados finais obrigatórios

`SOL_CONTRACT_REVIEW=PASS` (Onda A/C)
`SOL_REVIEW=PENDING` (aprovação final de toda Fase 6)
`AUTO_ADMISSION_THRESHOLD=0.80`
`AUTO_ADMISSION_POLICY=CONTRACT_READY; CORRELATION_ENGINE_CONSUMER=READY; PRODUCTION_CALLER=PENDING`
`CALIBRATION_GATE=BLOCKED` até calibração empírica adequada
`CORRELATION_INTEGRATION=ENGINE_CONSUMER_READY; PRODUCTION_CALLER=PENDING`
`REPORT_DISCLOSURE_CONTRACT=READY`
`NORMATIVE_INSTITUTIONAL_VALIDATION=PENDING`
`FASE_6_STATUS=IN_PROGRESS`

## Reconciliação e ciclo Onda B atual

- Runtime lido diretamente: 34 Criteria; 29 produtivos e 5 não selecionáveis.
  Os dois Criteria de regularidade profissional foram retirados e não aparecem
  no contrato compilado. Contagem daquele snapshot: 9 cobertos, 1 parcial e 20 pendentes.
- O candidate Onda B inclui o correlacionador e a fronteira pós-plano, RDE
  digest autenticado e política exata de binding. A produção mantém o registro
  empírico vazio: `CALIBRATION_GATE=BLOCKED`; não há fixture de decisão
  `ADMITTED`. As fixtures verificam gates e recibos de autenticação isolados,
  sem atribuir validação empírica a dados sintéticos.
- Onda D, prioridade 1: `T1_DRT_REQUIRED` executa TRUE somente com binding
  autenticado e DRT(s) com fato tipado exato `RESPONSIBILITY_TYPE=EXECUCAO`;
  binding vazio ou divergente resulta em `MANUAL_REVIEW`, sem FAIL/NC. Fixtures
  positiva, ausência, tipo divergente, multiplicidade e binding forjado/trocado
  passaram. `T1_DRT_ACTIVITY_EXECUTION` permanece pendente por falta de fato
  estruturado de atividade compatível; texto livre não é classificado.
- Finding de revisão com identidade/modelo não confirmado: iterator pollution
  poderia aparentar calibração no registry de produção; corrigido usando
  indexação sobre o registry e teste adversarial com iterator adulterado. A
  exigência de RE presente em ambos os lados foi revertida após confronto com
  `02a_applicability.txt` e `08_execution_pipeline.txt`: RE só é comparado
  quando ambos fornecem valor; ausência não completa nem exclui identidade.
  Ambos os testes direcionados passaram.
- Gates completos refeitos no snapshot KB 5.19.0: 141 testes Python PASS; 9
  suítes Apps Script PASS; `node --check` em todos os módulos JS e sintaxe de
  `Code.gs` PASS; regeneração byte-identical PASS; SHA-256 do runtime
  `7025ebea7f23a429c954c712ee6afe34db04a5cf796a70699e29cc7b3e82b3a6`;
  validação do artefato compilado/manifests/phase guards pela suíte PASS;
  `git diff --check` PASS. GPT-6 intermediário PASS; Sol 6.1 final continua
  pendente. Release build limpo passou no candidate temporário listado abaixo;
  repetir com SOURCE_COMMIT do commit da branch após revisão Sol.
- Release builder real passou no snapshot limpo do candidate temporário
  `48e53d5d6ab865e35b31c19a20c2b846e693beda`: 10 documentos, KB `5.19.0`,
  pipeline `4.22.0` e `SOURCE_COMMIT` correspondente. O SHA é objeto temporário de
  validação, não commit da branch.
- Snapshot histórico dos gates da Onda B antes do slice D: 141 testes Python; 9
  suítes Apps Script; sintaxe JavaScript e `Code.gs`; runtime byte-identical,
  SHA-256
  `35e48150910eaeb7e243632bb84a0dc0df0f84d07ac2ae266cfd62721057e183`;
  `git diff --check` — PASS. Release builder real passou em worktree limpa de
  validação temporária: dez documentos self-versioned, KB `5.18.0`, SHA do
  candidate temporário `ebf466fff9f7d181d1453bbdbe1233bb78d8d1a1`. Após o slice D:
  suítes `pilot-criterion` e
  `validated-execution-readiness`, syntax dos três módulos alterados e
  `Code.gs`, `git diff --check` — PASS; gates integrais precisam ser repetidos.
  Build de release em worktree limpa e revisão Sol 6.1 ainda pendentes.
- Revisões delegadas antigas não confirmaram identidade/modelo e não contam
  como revisão Luna. O ciclo intermediário GPT-6 autorizado pelo usuário
  confirmou PASS após corrigir iterator pollution, preservando o rótulo GPT-6.
  A revisão posterior do perfil `luna_economy` alterou apenas configuração e
  testes, com `node --check`, suíte focal e `git diff --check` PASS.
  Um follow-up independente GPT-6 apontou P1: outros `for...of` no
  `CorrelationCore.js` ainda dependiam de `Array.prototype[Symbol.iterator]`.
  O candidate atual substitui todos esses percursos por indexação e acrescenta
  ataques isolados para spoof do registry e exceção de iterator global. Os
  testes direcionados passam; a re-revisão GPT-6 posterior encontrou quatro
  novos achados, agora corrigidos no candidate atual. Gates integrais e nova
  revisão independente pendentes. Revisão final Sol 6.1 continua pendente.
- O usuário solicitou administrar o limite reportando 3% restante no limite
  de 5 h, reset em cerca de 30 min. Este checkpoint foi retomado após novo
  turno/orientação do usuário; a worktree e `.codex-local-evidence/` continuam
  preservados.
- Revisão adversarial final solicitada com override `gpt-6.1-sol` declarou-se
  efetivamente Codex/GPT-6; portanto não conta como `SOL_REVIEW`. Findings
  acionáveis: P1 ausência de autoridade/configuração produtiva autenticada para
  atualizar calibração por Base/tipo sem rebuild; P1 flags de conflito vêm do
  candidato e não são verificadas contra fatos documentais; P2 a fixture de
  prompt injection não cobre conteúdo extraído sob admissão; P2 este tracker
  mantinha estado intermediário pendente após aceitação do usuário. Contagens
  confirmadas pelo reviewer para aquele snapshot: 34/29/5/2/9/1/20. Verificações daquele candidate antes dos
  findings: 141 Python, 9 Apps Script, sintaxe 11 JS e Code.gs, runtime
  byte-identical e diff check PASS; release limpo PASS.
- Correção subsequente da configuração: removido o registry de calibração
  embutido em `CorrelationCore.js`; novo módulo `CorrelationConfigurationCore.js`
  lê bundle versionado de política/calibração em Script Properties, verifica
  HMAC-SHA256, congela o snapshot e autentica sua identidade em WeakMap. O
  correlacionador recarrega esse bundle por decisão e exige política configurada
  exata; ausência, HMAC incorreto ou política alterada bloqueia a admissão.
  Gate de calibração também exige digest/referência de validação e assinatura
  de autoridade separada da chave de configuração; assinatura de policy não
  aprova a própria calibração. Hash e recibo sintéticos sem essa chave não
  admitem. A versão atual remove do teste a admissão sintética. Após a última
  edição, 141 Python, 9 suítes Apps Script, sintaxe, runtime, phase guards,
  release build e `git diff --check` passaram; terceira re-revisão GPT-6 PASS.
  Sol 6.1 continua pendente.
- Prompt injection: fixture ampliada com texto de instrução no campo documental
  livre da DRT sob o cenário sintético; o texto não é copiado ao artefato nem
  altera a decisão do correlacionador, que não invoca modelo de IA. Política
  alterada por texto injetado diverge do bundle autenticado e termina em revisão
  humana. Isso não valida robustez de EXTRACTION/modelo, que não é iniciada nesta
  fase.
- Correções do finding de conflito: assessment agora tem HMAC vinculado ao
  outcome, score, `conflictFlags`, detector/version, evidências, digest de
  policy, apresentação e RDE;
  adulteração ou replay encaminha a revisão humana. O conjunto de candidatos
  compara todas as combinações DRT×produto elegíveis presentes na RDE; omissão,
  duplicidade ou concorrência bloqueia admissão. A provenance só passa com
  localizador/origem reconhecível segundo 08. Ainda não há detector ou dataset
  institucional no projeto, portanto `CALIBRATION_GATE=BLOCKED` e nenhuma
  correlação real pode ser admitida. GPT-6 confirmou os fixes; aguarda-se Sol
  6.1. Não inferir serviço DRT↔produto por nomes ou texto: a Base não fornece
  campos equivalentes.
- Retomada de 2026-10-14 no HEAD `2182751d873ee068c7cc434998cf723805170ce7`:
  branch e origin coincidem; worktree rastreada limpa; `.codex-local-evidence/`
  continua preservado e fora do Git. O release build real registrado no
  checkpoint anterior tem `SOURCE_COMMIT=2182751d873ee068c7cc434998cf723805170ce7`.
  O usuário autorizou aceitar revisões GPT-6, mantendo a identidade declarada;
  isso não equivale a Sol 6.1. O parecer GPT-6 do slice RT-002 mantém
  `T1_DRT_REQUIRED=PARTIAL` e confirma que `T1_DRT_ACTIVITY_EXECUTION` não é
  executado.
- Reconciliação da prioridade 2: RDE contém `COUNCIL_REGISTRATION_STATUS`,
  `COUNCIL_ISSUANCE_STATUS`, `COUNCIL_PAYMENT_STATUS`, `SIGNATURE_PARTY` e
  `SIGNATURE_MECHANISM` somente como texto FACT-ONLY; a decisão contratual
  anterior explicitamente não os converte em `REGISTERED`/`SIGNED`. A fronteira
  autenticada `ResponsibilityEvidenceBinding` seleciona atualmente somente
  RT-002 por `RESPONSIBILITY_TYPE=EXECUCAO`; esse fato não resolve pareamento
  para cada responsabilidade, nem identidade/autenticidade do signatário.
  PROCESS não expõe comparandos tipados para RI legal, endereço ou área. Logo
  `T1/T4_DRT_REGISTERED`, `T1/T4_DRT_SIGNED` e os quatro Criteria básicos
  permanecem pendentes até existir contrato explícito para seleção factual e
  comparandos, sem rebaixar ausência ou conflito a FAIL.
- Revisão arquitetural do próximo slice, snapshot `64b0504b1d323db099b5751d6d0d14ae21664395`:
  o parecer independente identificou-se como Codex/GPT-6 (aceito pelo usuário,
  não Sol 6.1). `T1_DRT_ACTIVITY_EXECUTION` e `HAS_DRT_ACTIVITY` não podem
  derivar associação individual atividade↔SMSCI dos campos livres nem da mera
  coocorrência de `drt_declaration_items`; `DRT_COVERS` exige documento, SMSCI e
  atividade explícitos. Recomendada representação RDE aditiva FACT-ONLY de
  atividades/serviços individualizados, preservando texto literal e proveniência,
  sem criar vínculo atividade↔SMSCI ou produto. Isso não cria compatibilidade, cobertura,
  resultado, evidência de ausência nem admissão de correlação. A triagem Luna
  dos cinco Criteria de comissionamento confirmou contratos/fatos ainda
  insuficientes: presença de produto, assinatura textual ou associação isolada
  não completa `DRT_COVERS`, validade ou independência. Implementação apenas da
  representação factual foi delegada à Luna; executor e cobertura não foram
  declarados. A revisão final Sol 6.1 da Fase 6 permanece pendente.
- Ciclo corretivo após `GPT6_REVIEW=FAIL` do RDE 0.6 candidate sobre o commit
  `64b0504b1d323db099b5751d6d0d14ae21664395`: helper de validação de atividade
  agora é imutável e usa descritor intrínseco capturado; `drt_activity_items`
  deixou de aceitar/projetar `smsci_scope_text`, pois coocorrência textual não
  prova pareamento. RDE 0.6 representa apenas atividade literal, sem associação
  a SMSCI/produto. Teste focal RDE PASS, inclusive tentativa de monkeypatch e
  helpers globais. Gates integrais e re-revisão independente GPT-6 pendentes;
  nenhuma cobertura de Criterion foi reivindicada.
- Re-revisão GPT-6 do candidate encontrou dois novos findings: o parser não
  autenticava associações documentais em RDE 0.4; e uma edição de Documento 09
  havia enfraquecido a exigência histórica de ocorrência literal dos dois campos
  em `drt_declaration_items`. Corrigidos com inclusão explícita de RDE 0.4 na
  validação estrutural e restauração da regra documental, cada qual com
  regressão específica. Após correção: 141 testes Python, 9 suítes Apps Script,
  sintaxe JS/Code.gs e `git diff --check` PASS; runtime SHA-256
  `02f32f20162b2586e67ad5048863c55f03a52cf9f3f31315911dbd73d06d54cf`.
  Re-revisão GPT-6 seguinte pendente; ainda sem commit/release limpo.
- Reconciliação histórica por inventário independente da Base/runtime: 34 Criteria ativos,
  29 produtivos, 5 não selecionáveis, 2 retirados; 9 cobertos integralmente,
  1 parcial (`T1_DRT_REQUIRED`) e 20 pendentes. O RDE 0.6 não aumenta cobertura.
- Re-revisão GPT-6 estática final deste slice: `PASS`, identidade efetiva Codex
  baseado em GPT-6, não Sol 6.1. Confirmou alinhamento da ImmutableExecutionView
  e Documento 09 para RDE 0.6, limites de `drtActivityItems`, regressões RDE 0.4
  (associações e ambos os literais) e fechamento dos quatro findings do ciclo.
  Uma tentativa anterior de revisão de segurança foi bloqueada pelo controle
  automático por possível risco cibernético; a revisão estreita, somente leitura,
  passou sem execução de cenários operacionais. O reviewer não rodou testes.
  Gates executados pelo executor após correções: 141 Python, 9 Apps Script,
  sintaxe JS/Code.gs, runtime byte-identical SHA-256
  `02f32f20162b2586e67ad5048863c55f03a52cf9f3f31315911dbd73d06d54cf`,
  manifest/phase guards e `git diff --check` PASS. `SOL_REVIEW` permanece PENDING.
- Checkpoint RDE 0.6 commitado e enviado por fast-forward: `01ceb7e43d10875573a3b438dd2755bcb0ef7728`.
  Release real em worktree limpa PASS: 10 documentos, `SOURCE_COMMIT` exato
  `01ceb7e43d10875573a3b438dd2755bcb0ef7728`; KB `5.20.0`, pipeline `4.23.0`.
  `SOL_REVIEW` da Fase 6 segue PENDING; Criteria e correlação operacional não
  foram declarados concluídos por este slice.
- Retomada/checkpoint de 2026-10-15 anterior ao commit `9e8462b`: branch local e `origin` confirmadas em
  `6414aacca564f90ad3fd904a89f5dc6b34ca4917`; worktree rastreada limpa e
  `.codex-local-evidence/` não rastreado preservado. KB `5.20.0`, RDE `0.6`,
  runtime SHA-256 `02f32f20162b2586e67ad5048863c55f03a52cf9f3f31315911dbd73d06d54cf`.
  Não houve mudança de código nesta retomada. Inspeção confirmou que
  `T4_IN09_TEST_REPORT` exige `DRT_COVERS` além da presença/conteúdo/assinatura;
  acrescentar somente fatos sobre itens inspecionados não cobriria o Criterion
  e não resolveria a semântica documental de cobertura. `T1_DRT_ACTIVITY_EXECUTION`
  também continua sem predicado seguro: RDE 0.6 conserva atividade literal,
  enquanto o catálogo RT-002 requer atividade/serviço declarado e compatível;
  não há mapeamento literal autorizado da extração para a categoria. A
  integração da sidecar ao Engine continua pendente porque não há consumidor
  declarado para correlação nos Criteria produtivos; expor a sidecar sem
  predicate de relação violaria o contrato do Engine. Manter contagens em
  naquela retomada, `34/29/5/2/9/1/20`, `SOL_REVIEW=PENDING`, `CALIBRATION_GATE=BLOCKED` e
  `CORRELATION_INTEGRATION=PENDING`. Próxima retomada: obter as decisões/dados
  listados na revisão de blockers, implementar apenas os slices autorizados,
  repetir gates completos, obter revisão independente corretamente identificada
  e atualizar o checkpoint. A sessão foi pausada pela sinalização de uso
  limitado; isto não encerra nem aprova a Fase 6.
- Nova retomada: inventário Luna confirmou que `T1_DRT_ACTIVITY_EXECUTION`
  permanece sem classificação segura: o Anexo A exige conferir atividade/
  serviço literal, mas `drt_activity_items` é FACT-ONLY e não há vocabulário
  negativo tipado autorizado. O único resultado seguro com os fatos atuais é
  `MANUAL_REVIEW`, sem `FAIL`/NC. O Anexo A versionado atual contém entrada
  concreta RT-002, inclusive produto `CONFORMITY_REPORT`; isso permite avançar
  a integração relação-only já aprovada para o Criterion declarado
  `T1_CONFORMITY_REPORT`. Candidate de implementação ainda não revisado em
  `CorrelationCore.js`, `EngineCore.js`, `CriterionExecutionCore.js` e teste
  de correlação. Não altera o bloqueio real de calibração. Inventário naquele
  checkpoint: `34/29/5/2/9/1/20`. O primeiro candidate de integração já incluía consumidor
  no Engine, mas readiness e E2E positivo ainda estavam pendentes naquele
  checkpoint. Após fechamento dos gaps, revisão Luna independente e revisão
  arquitetural Sol 6.1 do slice retornaram PASS; um finding HIGH de ordem de
  validação e dois findings de rastreabilidade foram corrigidos e re-revisados.
  O Engine valida RT-002 única e fato EXECUCAO antes de decidir produto: RT
  ausente/ambígua fica MANUAL_REVIEW sem DOCUMENT_ABSENCE; produto ausente,
  após RT válida, produz FALSE/NC_T1_003 com referência DOCUMENT_ABSENCE. A
  projeção de correlação só expõe metadados depois de autenticação; a âncora de
  revisão é o selectedComprovante exato do plano. Gates integrais no candidate
  final do slice RT-002: 141 testes Python; 9 suítes Apps Script; sintaxe JS/Code.gs; runtime
  byte-identical SHA-256 `0c36536ae85ce2994839ad75107dd30ef73d279716bf9bf9db492a746c8f4590`;
  phase guards/manifests pelos testes Python e `git diff --check` PASS. A fixture
  ADMITTED é TEST_ONLY; calibração empírica real segue BLOCKED, portanto não há
  admissão operacional validada. A contagem daquele snapshot era
  `34/29/5/2/9/1/20`; a reclassificação de assinatura desta retomada deixa como
  estado vigente `34/29/5/2/6/1/23`. Revisão Sol 6.1 da Fase 6 continua PENDING.

## Onda D — dependências atuais das prioridades restantes

Contagem vigente vem do runtime compilado KB `5.22.0`: 34 Criteria ativos,
29 produtivos, 5 não selecionáveis, 2 retirados, 6 integralmente cobertos,
1 parcial e 23 pendentes de cobertura integral (inclui o parcial). As matrizes
de snapshots anteriores permanecem apenas como histórico.

- Prioridade 1: `T1_DRT_REQUIRED` continua parcial. `T1_DRT_ACTIVITY_EXECUTION`
  requer atividade/serviço declarado e compatível. RDE 0.6 preserva a atividade
  literal ligada à DRT, mas não classifica compatibilidade; `RESPONSIBILITY_TYPE`
  por si só não prova a atividade.
- Prioridade 2: `T1/T4_DRT_REGISTERED`, `T1/T4_DRT_SIGNED`, `T1_DRT_RI_LEGAL_ENTITY`,
  `T1_DRT_RT_NAME`, `T1_DRT_ADDRESS` e `T1_DRT_AREA` precisam de seleção
  autenticada da DRT para cada responsabilidade e comparandos factuais no
  processo. Status de registro/emissão e assinatura atuais são texto FACT-ONLY;
  ausência/confusão entre registro, emissão e pagamento não vira FAIL.
- Prioridade 3: `T1_DRT_SMSCI_COVERAGE`, `T4_IN09_DRT` e folhas `DRT_COVERS`
  de IN07/08/09/10/12/15 exigem escopo explícito DRT↔SMSCI↔atividade/produto.
  A RDE 0.6 não contém essas ligações; `documentary_associations` declara
  relação documental literal, mas não afirma cobertura normativa.
- Prioridade 4: IN08 precisa de contrato verificável de data/janela de cinco
  anos e DRT correspondente; IN09 precisa dos itens do relatório e DRT de
  vistoria/ensaio; IN10 exige provar independência; IN12/15 exigem cobertura
  explícita. `T4_IN19_FINAL_VERIFICATION` continua dependente de
  `RESPONSIBILITY_ACTIVITY_COMPATIBLE`, não executado integralmente.

Essas dependências mantêm os Criteria em revisão humana/insuficiência conforme
os contratos; ausência de associação não comprova ausência de DRT. Nenhuma
fixture institucional ou extração real foi iniciada. Não há decisão normativa
humana adicional registrada como requisito imediato nesta reconciliação; a
validação institucional da correlação permanece separadamente `PENDING`.

## Retomada do checkpoint `832b0f2` — RDE 0.7.0

- Diff contratual RDE 0.7.0 submetido a revisão independente GPT-6. Resultado
  inicial `FAIL`, sem P0/P1: (1) duas frases históricas podiam sugerir ordem
  de propriedades JSON; (2) não havia critério suficiente para distinguir
  repetição literal de duas ocorrências reais sem localização. Ambos foram
  corrigidos localmente no Documento 09. Re-revisão GPT-6 `PASS`, sem achados
  remanescentes no escopo contratual; revisão registrada como GPT-6, nunca Sol.
- A mesma revisão confirmou que a RDE 0.7 ainda não é aceita pelo runtime
  0.6.0. O parser e `ImmutableExecutionView` precisam acompanhar o contrato
  antes de release/build. A coleção factual não pode ser consumida como
  `DRT_COVERS` nem elevar cobertura de Criterion sem mapeamento autorizado.
- Estado desta retomada: HEAD `832b0f2235fbc12ce9ef2f9cbb7082ec1165ff9c`;
  diff local em Documento 08/09 e este tracker; `.codex-local-evidence/`
  permanece não rastreado e fora de qualquer staging. `SOL_REVIEW=PENDING`;
  `CALIBRATION_GATE=BLOCKED`; cobertura vigente segue `34/29/5/2/6/1/23` até
  nova compilação e reconciliação verificável.
- Implementação 0.7 em progresso: `RdeCore.js` valida o envelope e os itens;
  `ImmutableExecutionView` projeta a coleção somente leitura por DRT, preserva
  referência ao produto/documento, origem, textos e provenance. Atualizado
  Documento 06 para refletir a release 5.22.0 (versão 3.10.0), sem implementar
  geração de relatório. Gates focais RDE/view PASS; gates completos após o
  último ajuste: 9 suítes Apps Script, 141 testes Python, sintaxe JS e `Code.gs`,
  runtime byte-identical e `git diff --check` PASS; SHA
  `e4204a4a87a09f173207e3ab26d2f9e0b341614cd5e4756cb96b9b9cd65fa4c9`.
  Revisão Luna inicial `FAIL` (P1: o trecho não tinha referências literais aos
  endpoints; P2: construtor de view validava só densidade). Corrigido com
  `drt_reference_text`/`product_reference_text` obrigatórios, checks literais,
  clarificação de `source_document` como origem da declaração conjunta e
  autovalidação/resolução de endpoints pela view. Fixture inclui declaração
  em terceiro documento explicitamente identificando ambos os endpoints.
  Re-revisão Luna `PASS`, sem findings. Revisão GPT-6 seguinte `FAIL` com dois
  P2: whitelist incompleta de tipos para produto e equivalência de provenance
  ausente/null na assinatura de duplicidade. Corrigidos com tipos canônicos
  `DOCUMENT` concreto não DRT/`REPORT`/`TEST_REPORT`/`COMMISSIONING_REPORT`,
  rejeição de provenance null/vazio, assinatura sem flag de presença e testes
  negativos. Re-revisão GPT-6 `PASS`, com os dois P2 encerrados. GPT-6 foi
  registrado como GPT-6/Codex, nunca Sol.
- A re-revisão Luna final encontrou um P2 de consistência: construtor da view
  não repetia a detecção canônica de duplicata semântica feita pelo parser.
  Corrigido com assinatura canônica idêntica em `ExecutionViewCore`; testes
  adicionais cobrem proveniência `null`/vazia e item duplicado com ID diferente.
  Re-review Luna `PASS`; re-review GPT-6 `PASS` (Codex/GPT-6, não Sol). O
  revisor anotou P3: a verificação no construtor não tem teste direto de
  duplicata porque o token é privado; a suíte testa a construção não
  autorizada e a duplicata semântica na fronteira parser→view. Não há finding
  P2+ aberto. Gates completos após esse último finding: 9 suítes
  Apps Script, 141 testes Python, sintaxe JS/Code.gs, runtime byte-identical
  SHA-256 `e4204a4a87a09f173207e3ab26d2f9e0b341614cd5e4756cb96b9b9cd65fa4c9`,
  `git diff --check` — PASS. Release build limpo, commit/push e revisão Sol 6.1
  continuam pendentes.
