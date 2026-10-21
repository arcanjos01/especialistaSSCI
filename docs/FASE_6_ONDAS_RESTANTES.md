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

- Atualização corrente em 2026-10-21: branch local e remoto sincronizados em
  `816f2ec29fd4c4f62687dff4bea1153847784176`; worktree rastreada limpa e
  `.codex-local-evidence/` preservado, local e não rastreado. KB `5.34.0`, RDE
  `0.7.0`, runtime SHA-256
  `2ff633c9e4e6c9b1e671d178338b5d7a2ee0e53e9cec351c0b7cdd4cd83f64e8`.
  Cobertura vigente: 34 ativos, 29 produtivos, 10 integrais, 1 parcial,
  1 preparatório e 19 pendentes de cobertura integral; 5 não selecionáveis e 2
  retirados. Fase 6A `COMPLETE`; 6B `IN_PROGRESS`. Build técnico limpo do
  mesmo HEAD: `PASS`, 10 documentos, `SOURCE_COMMIT` exato
  `26e881c54c3034d7c892c3dc0d1912698d42c8b7`; a saída não é promoção.
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
| D | Critérios produtivos restantes, por prioridade do pedido | Cobertura reconciliada; fontes oficiais; applicability e evidence contracts | Fixtures positivos/negativos/insuficientes; trace; readiness; cobertura demonstrada | `IN_PROGRESS; vigente: 10/29 integrais, 1 parcial (T1_CONFORMITY_REPORT), 1 preparatório (T4_IN09_DRT), 19 pendentes de cobertura integral` |
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
`SOL_REVIEW=PENDING_IDENTITY` (aprovação final de toda Fase 6)
`AUTO_ADMISSION_THRESHOLD=0.80`
`AUTO_ADMISSION_POLICY=CONTRACT_READY; CORRELATION_ENGINE_CONSUMER=READY; PRODUCTION_CALLER=PENDING`
`CALIBRATION_GATE=BLOCKED` até calibração empírica adequada
`CORRELATION_INTEGRATION=ENGINE_CONSUMER_READY; PRODUCTION_CALLER=PENDING`
`REPORT_DISCLOSURE_CONTRACT=READY`
`NORMATIVE_INSTITUTIONAL_VALIDATION=PENDING`
`VALIDATED_TO_ANALYZED=PENDING`
`PROMOTION=NOT_AUTHORIZED`
`FASE_6A_STATUS=COMPLETE`
`FASE_6B_STATUS=IN_PROGRESS`
`CRITERIA_ACTIVE=34; CRITERIA_PRODUCTIVE=29; CRITERIA_COVERED=10; CRITERIA_PARTIAL=1; CRITERIA_PREPARATORY=1; CRITERIA_PENDING=19`
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

Contagem vigente vem do runtime compilado KB `5.23.0`: 34 Criteria ativos,
29 produtivos, 5 não selecionáveis, 2 retirados, 6 integralmente cobertos,
3 parciais e 23 pendentes de cobertura integral (incluem os parciais). As matrizes
de snapshots anteriores permanecem apenas como histórico.

- Prioridade 1: `T1_DRT_REQUIRED` e `T1_DRT_ACTIVITY_EXECUTION` têm suporte
  parcial. A segunda só produz TRUE com literal individual exata `EXECUÇÃO`
  proveniente do catálogo RT-002 versionado, para cada DRT autenticada vinculada;
  falta de item, valor composto/diferente, conflito ou evidência insuficiente
  produz MANUAL_REVIEW. Não há normalização nem classificação de texto livre.
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
  revisor anotou P3 sobre falta de teste que invoque diretamente a verificação
  defensiva do construtor; isso é inacessível pela API porque exige token
  privado. Disposição confirmada por revisão independente do subagente com
  role `luna_economy`, id `01a14568-5782-76c1-9742-76f31fc116af`, resultado
  `PASS`: a
  fronteira pública testa duplicata semântica no parser→projeção
  (`tests/apps-script-execution-view.test.js:273-280`) e rejeita construção
  fabricada sem token (`:366-376`, `:587-594`). Adicionar test seam público
  enfraqueceria a autenticação protegida. O P3 está fechado por cobertura da
  fronteira autorizada; nenhum finding fica aberto neste slice.
  Gates completos após esse último finding: 9 suítes
  Apps Script, 141 testes Python, sintaxe JS/Code.gs, runtime byte-identical
  SHA-256 `e4204a4a87a09f173207e3ab26d2f9e0b341614cd5e4756cb96b9b9cd65fa4c9`,
  `git diff --check` — PASS. Commit/push `745b7b182a66fa6f934b73e35ada440c5556b612`.
  Release build limpo em 10/10 documentos PASS, `SOURCE_COMMIT` exato
  `745b7b182a66fa6f934b73e35ada440c5556b612`, KB `5.22.0`, Pipeline `4.25.0`,
  RDE `1.8.0`, Documento 06 `3.10.0`. `CRITERIA_COVERED` permanece 6; a coleção
  é factual e não fornece mapeamento para `DRT_COVERS`. `SOL_REVIEW=PENDING`;
  `NORMATIVE_INSTITUTIONAL_VALIDATION=PENDING`.

## Checkpoint — reconciliação da matriz vigente e referências (2026-10-15)

- Commit da reconciliação: `c4b9495635f8df87ba724868a31a5deb316d7d77`.
  Matriz alinhada à KB 5.22.0; duas verificações de regularidade profissional
  retiradas do conjunto ativo; mapeamentos de relatório T1 corrigidos para
  RT-002. Não houve aumento artificial de cobertura.
- Contagem conferida: 36 entradas de matriz = 34 Criteria ativos + 2 retirados;
  entre os ativos, 29 produtivos e 5 não selecionáveis. Dos produtivos, 6
  cobertos integralmente, 1 parcial e 22 sem suporte integral (16 dependem de
  formalização com fontes já catalogadas e 6 carecem de evidência tipada).
  Pendentes integrais: 23, contando o parcial.
- Revisão intermediária Luna identificou inconsistências P1/P2, corrigidas.
  GPT-6/Codex fez revisão independente somente leitura, PASS no escopo deste
  checkpoint, sem P0/P1/P2. O revisor conferiu as contagens, o artefato de
  release, o gate de calibração e os limites FACT-ONLY. A revisão Sol 6.1 não
  foi confirmada: o agente disponível declarou ser Codex baseado em GPT-6,
  portanto `SOL_REVIEW=PENDING`.
- O revisor apontou P3 por insuficiência da trilha de execução; findings P2+
  eram zero. Para tornar a reexecução verificável, o script completo e seu
  transcript foram preservados fora do Git em
  `.codex-local-evidence/phase6-gates-c4b9495-verify.sh` e
  `.codex-local-evidence/phase6-gates-c4b9495-verify2.log`. O script exige o
  HEAD esperado, worktree limpa e saída de release ainda inexistente; executado
  em worktree destacada e limpa no HEAD
  `c4b9495635f8df87ba724868a31a5deb316d7d77`. O transcript registra comandos,
  corpo do script, cwd/HEAD/status e os
  resultados: 141 testes Python PASS; 9 suítes Apps Script PASS; sintaxe dos 12
  módulos JS e `Code.gs` PASS; regeneração em memória e comparação byte a byte
  do runtime PASS, SHA-256
  `e4204a4a87a09f173207e3ab26d2f9e0b341614cd5e4756cb96b9b9cd65fa4c9`;
  release de 10 documentos, KB 5.22.0, SOURCE_COMMIT exato
  `c4b9495635f8df87ba724868a31a5deb316d7d77`; `git diff --check` PASS e status
  limpo. Validações de manifests e phase guards estão na suíte Python.
  Re-review GPT-6 do transcript de gates `PASS` (P3 da trilha encerrado);
  revisão `luna_economy` acima aprovou a disposição do P3 de teste direto.
  Re-review GPT-6 integrado final `PASS`, sem findings neste escopo.
  `SOL_REVIEW=PENDING` para aprovação final da Fase 6.
- Limites técnicos remanescentes: a atividade RT-002 continua como texto
  literal sem classificador autorizado; os fatos conjuntos RDE 0.7 não
  implementam predicate normativo consumidor de SMSCI/atividade. Campos
  textuais de status/assinatura/profissional/endereço/área não autorizam FAIL
  por ausência ou comparação textual. A admissão automática real permanece
  bloqueada por calibração empírica inexistente; validação institucional
  permanece pendente.
- Sincronização do checkpoint: tracker commitado em
  `23c090f05047b83fb42ae338ee4cba1b6da07ff7` e enviado por fast-forward de
  `8872bdea3b8e118e4871751cc4e1d5a26337bdee`; push PASS. `git ls-remote`
  confirmou no servidor `23c090f05047b83fb42ae338ee4cba1b6da07ff7`, igual ao
  HEAD local no momento da checagem. `.codex-local-evidence/` foi preservado e
  permaneceu fora do Git.

## Validação do HEAD publicado — 2026-10-16

- Commit publicado e confirmado no servidor por `git ls-remote`:
  `0559e87ba649f56e04349d26b3e743da7138d7b8`. Transcript local da consulta:
  `.codex-local-evidence/phase6-push-0559.log`.
- Reexecução integral em worktree limpa desse HEAD: 141 testes Python PASS;
  9 suítes Apps Script PASS; sintaxe de 12 módulos JS e `Code.gs` PASS;
  regeneração em memória e comparação byte-identical PASS, SHA-256
  `e4204a4a87a09f173207e3ab26d2f9e0b341614cd5e4756cb96b9b9cd65fa4c9`;
  release 10/10, KB `5.22.0`, `SOURCE_COMMIT` exato
  `0559e87ba649f56e04349d26b3e743da7138d7b8`; `git diff --check` e worktree
  limpa PASS. Script/transcript completos locais, fora do Git:
  `.codex-local-evidence/phase6-gates-0559-verify.sh` e
  `.codex-local-evidence/phase6-gates-0559-verify.log`.
- Esta validação não altera os counts: 34 ativos, 29 produtivos, 6 cobertos,
  2 parciais, 23 pendentes de cobertura integral. Onda D continua em andamento;
  calibração operacional e revisão final Sol 6.1 permanecem pendentes.

## Onda D — auditoria direta das fontes da Prioridade 1/2 (2026-10-16)

- Conferi o PDF oficial local `references/irv habitese.pdf`, Tabela 1, p. 4:
  exige identificar DRT registrada e emitida no conselho, paga e não rascunho,
  além de assinatura digital do RT ou certificação digital do Conselho. A
  tabela não enumera valores canônicos de status nem um resultado de verificação
  autenticado que possa ser consumido pelo Engine.
- O Anexo A, entrada RT-002, declara `DRT_RESPONSIBILITY_TYPE: EXECUCAO` e
  `COMPATIBLE_ACTIVITIES: EXECUÇÃO, conforme atividade/serviço declarado na
  DRT`. O contrato Engine limita `RESPONSIBILITY_TYPE` ao binding declarado;
  não permite normalizar natureza para atividade. RDE `drt_activity_items`
  preserva texto literal, sem classificador normativo.
- Resultado: o catálogo já autoriza a categoria `EXECUÇÃO` para RT-002; a
  lacuna está em interpretar, sem inferência, o texto livre de atividade/
  serviço da DRT como declaração dessa categoria. A possibilidade de aceitar
  correspondência literal exata como suporte parcial está em avaliação; não se
  conclui que toda implementação parcial seja inviável.
  `T1_DRT_REGISTERED`/`T4_DRT_REGISTERED` continuam pendentes porque status
  FACT-ONLY não equivale a registro/emissão autenticados. Ausência, ambiguidade
  ou texto desconhecido permanece insuficiente; nenhum FAIL/NC é criado por
  inferência.
- Para registro/emissão, os atributos RDE atuais são FACT-ONLY e não contêm um
  resultado autenticado tipado que autorize conclusão binária; isso impede
  converter seu texto diretamente em PASS/FAIL, mas ainda será avaliado se há
  uma implementação segura de insuficiência/readiness que avance a cobertura.
  No momento da auditoria de fontes, ainda não havia alteração normativa, de
  código ou aumento de cobertura neste slice; EXTRACTION de processos
  institucionais reais permanece fora desta fase.
- Revisão independente do subagente role `luna_economy`, id
  `01a14575-8abb-79f2-bbbc-7f15d483b165`, `PASS`: fontes e limites FACT-ONLY
  conferem; não há inferência normativa na conclusão.

### Candidato de suporte parcial — em revisão independente

- Implementação local em `EngineCore.js` e `CriterionExecutionCore.js`: o
  Engine consulta `drtActivityItems` diretamente na visão imutável; não recebe
  o texto de atividade como argumento confiado. O resultado só é `TRUE` se
  cada DRT autenticada do binding RT-002 tiver pelo menos um item e todos os
  itens declararem literalmente `EXECUÇÃO`. Sem itens, com frase composta ou
  valor diferente, o resultado é `MANUAL_REVIEW`; não há FAIL/NC a partir
  desses casos. Não normaliza caixa, acento ou espaços.
- `VALIDATE RESPONSIBILITY_ACTIVITY_COMPATIBLE` é executado antes do `ASSERT`,
  conforme 00_engine; quando a validação retorna `MANUAL_REVIEW`, a asserção é
  suspensa. A trilha do resultado preserva item, literal, DRT, documento-fonte,
  trecho-fonte e proveniência disponível. Fixture positiva e casos ausentes,
  diferentes/compostos e múltiplos itens estão em testes.
- Este é suporte parcial autorizado pelo mapeamento literal no Anexo A, não
  cobertura integral de `T1_DRT_ACTIVITY_EXECUTION`. A literal está no catálogo
  versionado 2.4 com source map; o Engine recebe a lista pelo binding autenticado
  e permanece genérico. Parser e contrato compilado rejeitam lista malformada,
  valor sem correspondência exata e proveniência ausente.
- Revisor GPT-6 aceito pelo usuário avaliou a política antes da implementação
  como defensável sob condições de autenticidade, literal individual, aplicação
  a cada DRT e rastreabilidade; não avaliou nem aprovou este diff de runtime.
  Revisão final Sol 6.1 permanece `PENDING`.

### Ciclo RT-002 atual — catálogo e execução parcial

- Candidate sobre `a2de33078acb2ce4fae8bc03915916a952aae6c5`. O Anexo A 2.4
  fornece `MACHINE_COMPATIBLE_ACTIVITY_LITERALS` por lista JSON e source map;
  parser, release compiler, runtime compilado, binding autenticado e Engine
  consomem a mesma lista sem hardcode do literal no núcleo.
- Cobertura reconciliada: `CRITERIA_ACTIVE=34`, `CRITERIA_PRODUCTIVE=29`,
  `CRITERIA_NOT_SELECTABLE=5`, `CRITERIA_WITHDRAWN=2`, `CRITERIA_COVERED=6`,
  `CRITERIA_PARTIAL=2`, `CRITERIA_PENDING=23` (os parciais permanecem pendentes
  de cobertura integral). `T1_DRT_ACTIVITY_EXECUTION` não é contado como coberto.
- Revisão intermediária role `luna_economy`, revisor declarou-se Codex/GPT-6:
  `PASS` para o candidate de catálogo, binding, Engine e trace. Isso não é
  revisão Sol. A revisão final independente Sol 6.1 permanece `PENDING`.
- Próximos gates: rejeição do parser (JSON inválido, correspondência não exata
  e source map ausente), suítes integrais, release limpo e revisão independente
  GPT-6.1-Sol; corrigir findings e repetir o ciclo se houver apontamentos.

### Revisão adversarial do candidate RT-002 — correção em andamento

- Revisão solicitada ao agente `gpt-6.1-sol`, somente leitura, retornou identidade
  declarada `Codex/GPT-6`; registro honesto: GPT-6 independente, não Sol 6.1.
  Resultado `FAIL`, sem bloqueio normativo. Findings: (1) setter herdado em
  `Array.prototype[0]` podia forjar snapshot/trace e obter PASS; (2) readiness
  rejeitava o novo VALIDATE e mantinha o Criterion como unsupported; (3) faltavam
  fixtures com múltiplas DRTs; (4) uma frase de contagem ainda dizia 16 em vez de
  15 formalizações pendentes. Nenhum arquivo foi alterado pelo revisor.
- Correções locais: snapshots e array documental agora recebem índices por
  `Object.defineProperty` capturado; teste instala setter adversarial e exige
  MANUAL_REVIEW com texto/proveniência originais; readiness reconhece somente
  Requirement/VALIDATE/mapeamento/predicate canônicos de RT-002 e testa unidade
  materializável; fixtures cobrem duas DRTs compatíveis, conflitantes e sem
  atividade; inventário corrigido para 15 SOURCE_DEFINED restantes.
- Testes focais `apps-script-responsibility-evidence` e
  `apps-script-validated-execution-readiness`: PASS após as correções. Revisão
  independente de re-review e gates integrais ainda pendentes. A aprovação GPT-6
  desta rodada não é registrada como Sol; o usuário aceitou revisão GPT-6, que
  pode ser identificada separadamente caso o novo revisor declare essa identidade.
- Re-review intermediária role `luna_economy`, declarou `Codex`, `FAIL` residual:
  o teste cobria setter herdado, mas não índice de dados herdado em um array
  esparso; o resolver ainda lia `items[index]` diretamente. Readiness, casos
  de duas DRTs, proveniência e contagem atual passaram na revisão. Correção
  adicional: o Engine exige descriptor de dado próprio em cada índice; novo
  teste injeta `Array.prototype[0]` como dado forjado em coleção esparsa e exige
  rejeição por integridade. Revisão e gates após este fix pendentes.
- A revisão final subsequente, solicitada ao modelo `gpt-6.1-sol`, declarou
  identidade `Codex/GPT-6` e `FAIL` com dois achados reproduzidos: helper de
  escrita ainda substituível no escopo global permitia forjar PASS/trace; ausência
  de provenance no registro-fonte resultava em exceção. As correções substituem
  helpers por bindings `const` fechados, normalizam provenance ausente a `null`
  no trace e encaminham a situação para `MANUAL_REVIEW`; testes atacam a sombra
  global do helper e provenance ausente no documento/atividade, com resultado
  sem FAIL/NC. Nenhum arquivo foi alterado por revisores. Na ocasião do finding,
  gates e re-review estavam pendentes; seu fechamento consta no registro abaixo.
- Correções do ciclo final: `ENGINE_ARRAY_SET_OWN_`/`ENGINE_HAS_OWN_` agora são
  bindings lexicais imutáveis; teste de sombra global não altera resultado nem
  trace. Provenance documental ou do item ausente vira marcador `null` no trace
  e `MANUAL_REVIEW`, não exceção. Re-review intermediária role `luna_economy`,
  identidade declarada Codex/GPT-6: `PASS`, zero findings abertos.
- Gates integrais após estas correções: 143 testes Python PASS; 9 suítes Apps
  Script PASS; sintaxe de todos os módulos JS e `node --check < Code.gs` PASS;
  runtime byte-identical, SHA-256 `6700e5b95b49822d5149a924cd8efb4db1f077b00671a3e682ebc54083dd40a7`;
  SHA-256 `Code.gs` `7cd96549af8ad1514dcedce6728633b4b907d55ca358a93afef6369764b144c3`;
  manifests/phase guards exercitados pela suíte Python; `git diff --check` PASS.
  Build de release em worktree limpa aguarda aprovação final e commit.
- Re-review final GPT-6 seguinte: `FAIL`, dois findings adicionais, identidade
  declarada Codex/GPT-6, somente leitura. Monkeypatch global de
  `Object.defineProperty` adulterava `immutableCopy` e permitia trocar os
  `expectedActivityLiterals`; provenance herdada de `Object.prototype` era lida
  como fato próprio. Corrigido usando a intrinsic capturada na cópia de
  argumentos, e leitura de todos os campos factuais da atividade somente por
  own data descriptor; testes atacam o monkeypatch e a provenance herdada, ambos
  exigindo `MANUAL_REVIEW` sem FAIL/NC.
- Primeira leitura estreita da Luna marcou `FAIL` por não encontrar os novos
  testes na suíte de integração; a checagem dirigida abriu
  `tests/apps-script-responsibility-evidence.test.js` e confirmou os testes de
  monkeypatch, helper sombreado, provenance ausente e provenance herdada:
  `PASS`, findings anteriores encerrados. Gates integrais após os últimos fixes:
  143 Python, 9 Apps Script, sintaxe JS/Code.gs, runtime byte-identical
  `6700e5b95b49822d5149a924cd8efb4db1f077b00671a3e682ebc54083dd40a7`, manifests/
  phase guards e `git diff --check` — PASS. Revisão final independente pendente.
- A revisão final seguinte declarou Codex/GPT-6 e encontrou: setter de
  `Object.prototype.expectedActivityLiterals` podia interceptar a atribuição no
  `ArgumentSchema` e alterar os literais autenticados; o resumo de cobertura do
  inventário ainda dizia `1 parcial`. Corrigido definindo cada argumento como
  propriedade própria não gravável via intrinsic capturada, com fixture do
  setter exigindo zero chamadas e `MANUAL_REVIEW`; quantitativo vigente corrigido
  para 2 parciais. O candidato requer novo ciclo integral, re-review Luna e
  revisão final GPT-6 aceita pelo usuário.
- Re-review Luna direcionada: `PASS`, identidade declarada Codex/GPT-6, somente
  leitura; confirmou que o setter herdado não intercepta `ArgumentSchema`, o
  teste exige zero chamadas e findings anteriores/provenance e contagem vigente
  estão reconciliados. Gates integrais após o fix: 143 testes Python e 9 suítes
  Apps Script PASS; sintaxe JS/Code.gs PASS; runtime byte-identical SHA-256
  `6700e5b95b49822d5149a924cd8efb4db1f077b00671a3e682ebc54083dd40a7`; manifests/
  phase guards e `git diff --check` PASS. Build release limpo e revisão final
  GPT-6 independente pendentes naquele marco.
- Revisão final do slice RT-002: `PASS`, zero findings, somente leitura. O agente
  solicitado como `gpt-6.1-sol` declarou identidade efetiva `Codex/GPT-6`; o
  usuário aceitou revisão GPT-6. Sol Web não pôde iniciar por falha de seleção/
  verificação do modelo. Este PASS é registrado como `GPT6_PASS_USER_ACCEPTED`,
  não como aprovação Sol 6.1. Revisou catálogo, binding, Engine, readiness,
  trace/provenance, insuficiências, regressões adversariais e contagens. Foram
  confirmados 143 Python e 9 suítes Apps Script, sintaxe JS/Code.gs, runtime
  byte-identical e `git diff --check`. Build limpo, commit e push deste slice
  ainda pendentes; `SOL_REVIEW=PENDING` permanece para o fechamento integral da
  Fase 6.

### Commit e release do slice RT-002

- Commit de implementação, testes e inventário: `75e41d8c7bb8acef9a70033bee4202a8b21febba`
  (`Add partial RT-002 activity execution support`).
- Release build em clone limpo: PASS, 10/10 documentos, KB `5.22.0`,
  `SOURCE_COMMIT=75e41d8c7bb8acef9a70033bee4202a8b21febba`. O clone limpo e o
  artefato ficam em `/tmp`; `.codex-local-evidence/` foi preservado e não entrou
  no commit.
- Estado desta onda após aprovação GPT-6 aceita pelo usuário: `FINDINGS_OPEN=0`
  neste slice, `T1_DRT_ACTIVITY_EXECUTION=PARTIAL`; o Criterion continua
  pendente de cobertura integral. Contagem de fase: 34 ativos, 29 produtivos,
  5 não selecionáveis, 2 retirados, 6 cobertos, 2 parciais, 23 pendentes.
  `SOL_REVIEW=PENDING` é mantido para fechamento total da Fase 6.

### Onda D — T1_CONFORMITY_REPORT por associação documental explícita

- Candidato atual: implementação local após checkpoint `4e2adc7a8cf689a15b7203ed64b5a555471ee9f7`.
- Contrato: `00_engine` 4.6 autoriza consumo relacional apenas de associação
  FACT-ONLY já validada, única e exata entre a DRT RT-002 autenticada e o
  endpoint REPORT `CONFORMITY_REPORT`; trace preserva association id, extremos,
  documento-fonte, texto literal e provenance. A RDE não é alterada. Associação
  ausente/ambígua resulta MANUAL_REVIEW; sidecar inferido segue sujeito à
  calibração bloqueada e à autenticação existente.
- Fixtures locais: associação explícita única gera resultado do predicate com
  referência documental rastreada; duas associações ao mesmo par geram
  MANUAL_REVIEW sem Nonconformity. View não canônica e troca de RDE/view com o
  mesmo plano são rejeitadas. Associação inferida autenticada isolada permanece
  `MANUAL_REVIEW` com trace `ADMITTED_CORRELATION_CONTEXT_ONLY`, sem PASS ou NC.
- Revisão intermediária encontrou finding HIGH sobre a fronteira de confiança
  e necessidade de impedir PASS pela correlação. Contrato esclarecido: a fonte
  de confiança da associação explícita é a `ImmutableExecutionView` canônica
  derivada do RDE validado; provenance individual continua opcional conforme
  RDE. Re-review GPT-6 que declarou `PASS` referiu-se ao snapshot anterior à
  correção de replay/contexto; não é a revisão final deste candidato.
- Gates do snapshot pré-replay: 143 Python; 9 suítes Apps Script; sintaxe JS/Code.gs;
  runtime regenerado byte-identical SHA-256
  `d1078bf77917eb892a7282dfb7e8613b7dc97063e0bbebde96de5fddbfd244ec`;
  manifests/phase guards pela suíte Python; `git diff --check` — PASS. Revisão
  final independente, build limpo, commit e push ainda pendentes. Nenhuma
  calibração operacional foi criada.
- Reconciliado: KB alvo `5.23.0`; 34 ativos, 29 produtivos, 5 não selecionáveis,
  2 retirados, 6 cobertos, 3 parciais, 23 pendentes de cobertura integral.
  `SOL_REVIEW=PENDING`; correlação operacional continua `CALIBRATION_GATE=BLOCKED`;
  validação institucional permanece `PENDING`.

### Snapshot histórico de produtividade e trust boundary — KB 5.23.0

Este diagnóstico preserva o estado daquela retomada e não é a matriz vigente.
Foi supersedido pela reconciliação abaixo e pela matriz canônica em
`docs/FASE_6_INVENTARIO_COBERTURA.md`, KB `5.34.0`.

- Reconciliação da fonte operacional KB `5.23.0`: 34 Criteria ativos, 29
  produtivos, 6 cobertos integralmente, 3 parciais e 23 pendentes de cobertura
  integral. Os retirados (2) e não selecionáveis (5) não entram nos 23.
- Nenhum dos 23 pode ser integralmente concluído apenas com os contratos e
  fatos atualmente formalizados. Não há decisão normativa humana indispensável
  identificada para os 29 produtivos; os bloqueios vigentes são de formalização
  computável ou de fatos documentais estruturados.
- Suporte parcial (3): `T1_DRT_REQUIRED` comprova apenas presença de evidência
  RT-002 autenticada; `T1_DRT_ACTIVITY_EXECUTION` comprova apenas atividade
  individual literal exata; `T1_CONFORMITY_REPORT` aceita associação explícita
  única entre DRT e relatório. Nos três, lacunas e conflitos continuam em
  `MANUAL_REVIEW`, portanto não são cobertura integral.
- Apenas capacidade preparatória (14): `T1_DRT_REGISTERED`, `T1_DRT_SIGNED`,
  `T1_CONFORMITY_REPORT_SIGNED`, `T1_DRT_RI_LEGAL_ENTITY`, `T1_DRT_RT_NAME`,
  `T1_DRT_ADDRESS`, `T1_DRT_AREA`, `T1_DRT_SMSCI_COVERAGE`,
  `T4_DRT_REGISTERED`, `T4_DRT_SIGNED`, `T4_IN09_DRT`, `T4_IN09_CHECKLIST`,
  `T4_IN18_CMAR` e `T4_IN19_FINAL_VERIFICATION`. Existem fatos/tokens de origem,
  mas faltam bindings, comparandos ou resultados executáveis autorizados.
- Bloqueados por fato/contrato ausente (6): `T4_IN07_COMMISSIONING`,
  `T4_IN08_ESTANQUEIDADE`, `T4_IN09_TEST_REPORT`, `T4_IN10_COMMISSIONING`,
  `T4_IN12_COMMISSIONING` e `T4_IN15_COMMISSIONING`. Faltam principalmente
  cobertura DRT-produto-SMSCI, datas e itens de laudo estruturados, ou identidade
  e papéis documentais de participantes.
- Próxima prioridade por dependência e valor: `T1_DRT_REQUIRED`, seguido por
  `T1_DRT_ACTIVITY_EXECUTION`, mantendo a distinção explícita entre suporte
  parcial e cobertura integral. Não se antecipará contagem de cobertura por
  predicado isolado ou infraestrutura.
- Esforço desta onda de associação explícita: 143 testes Python, 9 suítes Apps
  Script, sintaxe JS/Code.gs, runtime byte-idêntico e diff check passaram antes
  da revisão final; ganho integral real até aqui: `0 Criteria` (mantém 6/29).
  Revisão intermediária GPT-6: `PASS`. Primeira revisão final GPT-6: `FAIL`, dois
  HIGH: (1) monkeypatch global de `String` ocultava associações concorrentes;
  (2) o binding apresentação-contexto era local ao novo predicate, permitindo
  replay A→B em outro Criterion. Correções e reexecução integral/revisões estão
  em andamento; este slice ainda não pode ser commitado nem promovido.
- Re-review intermediária seguinte retornou `FAIL`: identificou que omitir o
  contexto ainda permitia executar sem a checagem comum, além da cronologia de
  PASS/FAIL precisar identificar snapshots. O executor comum agora interrompe
  com `CRITERION_EXECUTION_INTEGRITY_ERROR` antes da avaliação se faltar contexto
  autenticado ou se a apresentação diferir do plano; isso impede resultado
  `EVALUATED` fabricado e segue `08_execution_pipeline` (integrity error encerra
  antes da projeção). Os testes fornecem contexto correto e exigem rejeição ao
  omiti-lo. `.codex-local-evidence/` contém logs/scripts/checkpoints locais
  preexistentes e permanece preservado, não rastreado e fora do diff.
- A re-review intermediária subsequente confirmou os dois HIGH fechados, mas
  encontrou MEDIUM na API direta do predicate quando o contexto era null. O
  resolver, quando efetivamente invocado diretamente, devolve `MANUAL_REVIEW`
  rastreado com `CURRENT_PRESENTATION_UNAVAILABLE`; fixture direta foi
  adicionada. Suítes focadas de
  correlação, pilot e ResponsibilityEvidence passaram após a correção; gates
  integrais e nova revisão independente ainda pendentes.
- A primeira revisão final GPT-6 do snapshot com os gates completos encontrou
  HIGH adicional: monkeypatch global de `isPlainObject` podia ocultar a segunda
  associação. O Engine agora captura o classificador canônico na inicialização
  para essa validação, e um teste adversarial reproduz o patch e exige que os
  dois IDs permaneçam em `MANUAL_REVIEW`. Após a correção: 143 Python, 9 suítes
  Apps Script, sintaxe JS/Code.gs, regeneração byte-identical, SHA-256
  `d1078bf77917eb892a7282dfb7e8613b7dc97063e0bbebde96de5fddbfd244ec` e
  `git diff --check` — PASS. A re-review intermediária independente Codex/GPT-6
  deste snapshot retornou `PASS`, zero findings. A revisão final independente
  GPT-6 permanece pendente; não se declara Sol. A liberação limpa, commit e push
  também permanecem pendentes; `.codex-local-evidence/` segue preservado e fora
  do diff.
- A revisão final documental GPT-6 seguinte retornou `FAIL`, HIGH: o gate de
  contexto usava `evaluatedRecord` apesar de não avaliar o Criterion, em conflito
  com a definição `EVALUATED` do Pipeline e com os contadores do relatório. O
  gate foi alterado para lançar `EXECUTION_INTEGRITY_ERROR`, que para antes da
  projeção, sem fabricar resultado nem Nonconformity. As regressões exigem
  interrupção para contexto ausente e replay A→B; a chamada direta do predicate
  ainda produz MANUAL_REVIEW somente quando o predicate é realmente executado.
  Após alinhar as expectativas ao código canônico, as suítes focadas de
  correlação documental, pilot criterion e ResponsibilityEvidence passaram;
  `git diff --check` também passou. Nenhum Criterion integralmente coberto foi
  ganho neste slice. Gates integrais, nova revisão independente, liberação
  limpa, commit e push permanecem pendentes. Checkpoint suspenso por limite de
  tokens, sem promoção e sem declarar revisão Sol.

## Reorientação de produtividade — matriz por Criterion (2026-10-16)

### Estado reconciliado e regra de classificação

Fonte original desta análise em 2026-10-16: HEAD remoto
`1b1503266abca949a25d37231fcddc3b8198208b` mais o lote local então não
commitado de autenticação do `evaluateCriterion`; esses dados são históricos.
O parágrafo de contagem acima era um snapshot histórico da KB `5.25.0`.
Reconciliação vigente pela KB `5.34.0` e por
`docs/FASE_6_INVENTARIO_COBERTURA.md`: 34 Criteria ativos, 29 produtivos,
10 integrais, 1 parcial (`T1_CONFORMITY_REPORT`), 1 preparatório
(`T4_IN09_DRT`) e 19 ainda sem cobertura integral (inclui parcial e
preparatório); 5 não selecionáveis e 2 retirados. A lista abaixo contém
somente os 19 que ainda não estão integralmente cobertos. Caminho positivo ou
preservação de insuficiência, isoladamente, não equivale a cobertura integral:
cada Criterion deve cumprir seu contrato de resultado, trace/readiness e
consequência autorizada.

Classes abaixo não são exclusivas: `T` = formalização/consumo técnico de
contrato existente; `F` = fato documental tipado ou comparando ainda ausente;
`H` = decisão humana sobre autoridade normativa; `C` = calibração ou integração
externa. `T/F/H/C` indica dependências para cobertura integral, não autorização
para inferir fatos ou resultados.

| Criterion | Classe | Dependência concreta que falta para cobertura integral |
|---|---|---|
| `T1_DRT_REGISTERED` | `T+F` | Consumir o status de registro da DRT exata para cada RT requerida; faltam vocabulário factual verificável e binding sem confundir registro, emissão e pagamento. |
| `T1_DRT_SIGNED` | `T+F` | Binding DRT/RT e fato que demonstre assinatura verificável; `SIGNATURE_MECHANISM` textual, isoladamente, não autentica assinatura. |
| `T1_CONFORMITY_REPORT` | `T+C` | O ramo de associação explícita exata existe no candidato; admissão de vínculo inferido ainda depende de calibração empírica válida e caller de produção. Sem esses gates, manter inferências em revisão humana. |
| `T1_DRT_RI_LEGAL_ENTITY` | `F+T` | Identidade documental suficiente da pessoa jurídica na DRT e no processo, mais comparação restrita à mesma RT; nome ou diferença de CNPJ filial/matriz não prova pessoa distinta. |
| `T1_DRT_RT_NAME` | `T+F` | Ligação explícita da DRT e do produto que satisfaz a mesma RT e identidade de RT presente em ambos; sem associação por semelhança de nomes. |
| `T1_DRT_ADDRESS` | `F+T` | Endereço factual comparável do processo/imóvel, ligado à DRT; contrato para diferença verificável e insuficiência sem normalização conjectural. |
| `T1_DRT_AREA` | `F+T` | Área factual comparável do processo/imóvel, unidade e qualificadores preservados, ligada à DRT; sem comparação textual inventada. |
| `T1_CONFORMITY_REPORT_SIGNED` | `F+T` | Evidência de assinatura verificável vinculada ao relatório exato; o campo textual atual só registra o mecanismo declarado. |
| `T4_DRT_REGISTERED` | `T+F` | Mesma dependência de status factual/binding de `T1_DRT_REGISTERED`, para a unidade produtiva da Tabela 4. |
| `T4_DRT_SIGNED` | `T+F` | Mesma dependência de assinatura verificável/binding de `T1_DRT_SIGNED`, para a unidade produtiva da Tabela 4. |
| `T4_IN07_COMMISSIONING` | `T+F` | Consumir DRT-produto-SMSCI-atividade explícitos para o relatório SHP e fato verificável de assinatura; sem cobertura inferida. |
| `T4_IN08_ESTANQUEIDADE` | `T+F` | Além do binding de cobertura e assinatura, obter datas documentais estruturadas do laudo e referência temporal autorizada para o limite de cinco anos. |
| `T4_IN09_DRT` | `T+F` | O Criterion encaminha sempre a revisão humana e o Requirement não executa compatibilidade atividade↔SMSCI. Permanecem o binding documental de RT-005 ainda não formalizado e a impossibilidade de provar ausência de DRT; não mapear `VISTORIA_ENSAIO` a RT-005 sem fonte/decisão correspondente nem gerar FAIL/NC por coleção vazia. |
| `T4_IN09_TEST_REPORT` | `T+F` | Fatos individualizados sobre os componentes requeridos pelo art. 122, vínculo explícito DRT-produto-SMSCI-atividade e assinatura verificável; não completar itens de normas NBR por inferência. |
| `T4_IN09_CHECKLIST` | `F+T` | Evidência verificável de assinatura na checklist exata e consumo pelo predicado de produto já declarado. |
| `T4_IN10_COMMISSIONING` | `F+T` | Decisão operacional do usuário: basta a equipe/profissional RT que preparou o comissionamento ser distinta da pessoa solicitante. O escopo mecânico já está formalizado; faltam fato autenticado da identidade do autor do relatório, sua assinatura verificável ligada ao relatório exato e comparação com o solicitante. CPF/nome do responsável técnico no requerimento, sem vínculo factual com a autoria do relatório, não basta. |
| `T4_IN12_COMMISSIONING` | `T+F` | Consumir cobertura explícita DRT-produto-SMSCI-atividade do relatório SDAI e evidência verificável de assinatura. |
| `T4_IN15_COMMISSIONING` | `T+F` | Consumir cobertura explícita DRT-produto-SMSCI-atividade do relatório sprinkler e evidência verificável de assinatura. |
| `T4_IN18_CMAR` | `F+T` | Evidência verificável de assinatura na declaração CMAR e consumo pelo predicado já declarado; não criar RT-007 autônoma. |

### Decisão de fundamento IN10/IRV — resolvida pelo usuário

`REQUIRE INDEPENDENT_PARTY` em `knowledge-base/02_requirements.txt`
(`REQ_IN10_COMMISSIONING`) é sustentado pela IRV Habite-se 2024, Anexo A,
Tabela 4, p. 9, e pelo art. 41 da IN 10. Em 2026-10-17, o usuário confirmou
que a IRV tem precedência sobre a IN para fins de fiscalização. A leitura
anterior de que a IN 10 não dizia independência estava incorreta: o art. 41
expressa a mesma exigência para controle de fumaça mecânico.

Para a verificação implementada no projeto, o usuário decidiu que basta a
equipe/profissional RT que preparou o comissionamento ser distinta da pessoa
solicitante. Esta é a decisão operacional do usuário para o sistema; não é
redação literal da IRV. A decisão sobre a suficiência desse critério está
encerrada. Permanecem ausentes fatos documentais estruturados e autenticados
que identifiquem o solicitante e a pessoa autora do relatório, com assinatura
verificável vinculada ao relatório exato. A applicability do controle de fumaça
mecânico já está formalizada na Base e testada; não é mais blocker deste
Criterion. Até existir evidência de autoria/assinatura e comparação, não
produzir resultado conclusivo, `FAIL` ou NC por inferência; manter revisão
humana. Não generalizar esta regra para outros SMSCI.

### Dependências compartilhadas e lotes prioritários

| Ordem | Contrato compartilhado | Critérios potencialmente afetados | Motivo/limite |
|---|---|---|---|
| 0 | Associação documental explícita exata DRT↔produto, com binding à apresentação/RDE | `T1_CONFORMITY_REPORT` | Concluído e publicado em `fc3fb760e5dc58a0fb9b381443d583c0938d2c99`; o ramo explícito pode produzir positivo com evidência única e rastreável. O Criterion continua parcial; associação inferida não é admitida sem calibração empírica válida. |
| 1 | Mapeamento versionado dos status `REGISTERED` por conselho, tipo ART/RRT/TRT e campo | 2: `T1_DRT_REGISTERED`, `T4_DRT_REGISTERED` | O vocabulário comum e a preservação literal estão formalizados; a regra-fonte da IRV descreve a condição, mas não define os mapas literais de cada conselho. Fontes oficiais consultadas mostram ciclos/status próprios. Não codificar equivalências sem mapa versionado autorizado; manter revisão humana. |
| 2 | Consumidor de declarações RDE 0.7 para relações DRT-produto e cobertura explicitamente declarada, com endpoints exatos, multiplicidade e insuficiência | Potencial teórico até 5: `T4_IN07_COMMISSIONING`, `T4_IN08_ESTANQUEIDADE`, `T4_IN09_TEST_REPORT`, `T4_IN12_COMMISSIONING`, `T4_IN15_COMMISSIONING` | `DRT_COVERS` consta como operador conceitual, mas não há executor/binding genérico para esses produtos. A RDE preserva declarações sem derivar cobertura. Não conferir compatibilidade atividade↔SMSCI para RT-005/006/014; o operador não pode ser aplicado a essas responsabilidades. Também faltam fatos de assinatura, datas ou conteúdo para vários produtos. O alcance é apenas potencial; um consumidor isolado não fecha esses Criteria. `T1_DRT_ACTIVITY_EXECUTION` e `T1_DRT_SMSCI_COVERAGE` já estão integralmente cobertos pela matriz vigente e foram excluídos desta pendência. |
| 3 | Evidência de assinatura verificável com provenance e binding ao documento exato, consumível por DRT e produto | Até 11: `T1_DRT_SIGNED`, `T4_DRT_SIGNED`, `T1_CONFORMITY_REPORT_SIGNED`, `T4_IN07_COMMISSIONING`, `T4_IN08_ESTANQUEIDADE`, `T4_IN09_TEST_REPORT`, `T4_IN09_CHECKLIST`, `T4_IN10_COMMISSIONING`, `T4_IN12_COMMISSIONING`, `T4_IN15_COMMISSIONING`, `T4_IN18_CMAR` | Maior alcance; requer contrato/fato de verificação ou integração autorizada. Não aceitar nome textual do mecanismo como prova. Avaliar capacidade local antes de assumir serviço externo. |
| 4 | Comparandos tipados de pessoa jurídica, RT, endereço e área vinculados a processo/DRT/produto | 4: `T1_DRT_RI_LEGAL_ENTITY`, `T1_DRT_RT_NAME`, `T1_DRT_ADDRESS`, `T1_DRT_AREA` | Fonte define comparações conservadoras; fatos do processo e relações exatas precisam existir. Bloquear resultado conclusivo se faltarem. |
| 5 | Datas e itens de relatório estruturados com origem, associação ao produto e escopo de exaustividade | 2 principais: `T4_IN08_ESTANQUEIDADE`, `T4_IN09_TEST_REPORT`; também requisitos de laudos/comissionamentos relacionados | Não inventar datas, conteúdo NBR ou presença de itens não extraídos. |
| 6 | Fatos RDE autenticados do solicitante e da identidade do autor do relatório, comparados com assinatura ligada ao relatório exato | 1: `T4_IN10_COMMISSIONING` | A decisão operacional do usuário está registrada e a applicability do modo mecânico já foi formalizada. Não há fato autenticado da autoria do relatório; o campo de RT no requerimento, isoladamente, não comprova quem preparou ou assinou o laudo. Manter revisão humana até existir essa evidência. |
| 7 | Dataset rotulado, calibração por Base/tipo de vínculo e caller de produção autenticado | 1: associação inferida em `T1_CONFORMITY_REPORT` | `CALIBRATION_GATE=BLOCKED`; política 0,80 não autoriza admissão operacional sem calibração empírica. |

### Modelo de ameaça por fronteira efetiva

| Origem | Capacidade plausível | Controles/prioridade |
|---|---|---|
| Documento não confiável | Texto falso, prompt injection, instrução para o extrator, arquivo malformado ou evidência contraditória | Tratar todo conteúdo como dado; extraction registra fatos e provenance, sem obedecer instruções documentais; RDE valida referências/estrutura; conflitos e insuficiência não viram fato nem `PASS`. Documento não concede execução de JavaScript. |
| Atributos extraídos | Valor inventado, tipo inválido, duplicidade, associação indevida, omissão ou source span adulterado | Validar schema, tipos, referências, literal e provenance; não classificar texto livre por semelhança; congelar view; manter trace do binding. |
| RDE/correlação | Troca de protocolo/RDE, replay, digest/endpoint adulterado, associação órfã, conflito apagado ou sidecar reutilizado | Vincular artefato e decisão à apresentação/RDE exatas e seus digests; autenticar caller; congelar policy/calibração; rejeitar replay, mutação e integridade inválida. Inferência fica fora da RDE FACT ONLY. |
| Política/calibração externa | Política substituída, score não calibrado, calibração ausente/expirada ou desvio por Base/tipo | Versões/digests imutáveis por decisão, limiar inclusivo 0,80; conflitos e concorrentes bloqueiam; `CALIBRATION_GATE=BLOCKED` impede admissão real sem dados válidos. |
| API pública do Engine | Argumentos forjados, contexto ausente, referência trocada ou chamada fora do plano congelado | Validar contrato, tipo e vínculo autenticado ao plano/view/apresentação; falha de integridade encerra antes de projetar resultado; resultado não pode ser forjado via sidecar. |
| JavaScript arbitrário no mesmo runtime | Monkeypatch, substituição de globais ou adulteração de código pelo próprio processo | Tratar como comprometimento de runtime/deployment, distinto de controle de documento. Mitigar somente vulnerabilidade concreta em API alcançável; não afirmar isolamento de realm nem ampliar hardening preventivo sem benefício contratual. Preservar testes de monkeypatch já existentes onde reproduzem superfície acessível. |

### Fluxo de revisão e medição dos lotes

Após fechar o candidato atual: Luna implementa um lote coerente; testes direcionados
durante o desenvolvimento; gates completos no candidato consolidado; uma revisão
independente do lote; regressão específica para cada finding bloqueante;
re-review somente dos findings e efeitos colaterais; Sol 6.1 revisa mudanças
arquiteturais antes da promoção. Se duas revisões encontrarem a mesma classe,
revisar a fronteira compartilhada antes de novos patches locais. Cada registro
de lote indicará cobertura integral antes/depois, parciais, blockers encerrados
e adicionados, testes, esforço aproximado, número de revisões e benefício
operacional. Não contar infraestrutura ou predicate isolado como Criterion
coberto.

Manter invariantes: RDE FACT ONLY; Engine determinístico e sem IA; associações
inferidas em sidecar vinculado à apresentação/RDE exatas; nenhuma criação de
Requirement/Criterion/Nonconformity/resultado por correlação; política e
calibração versionadas; `CALIBRATION_GATE=BLOCKED` sem dataset suficiente;
`NORMATIVE_INSTITUTIONAL_VALIDATION=PENDING`;
`VALIDATED_TO_ANALYZED=PENDING`; sem merge/deploy. Esforço aproximado desta
reconciliação documental: cerca de 20 minutos; 0 Criteria ganhos; 0 revisões
independentes consumidas; 1 candidato de dependência compartilhada priorizado.

### Fechamento do checkpoint de associação explícita — pré-commit

- Base de revisão: branch `feature/apps-script-engine-core`, HEAD
  `4e2adc7a8cf689a15b7203ed64b5a555471ee9f7`; candidato local manteve o binding
  de associação explícita DRT↔relatório e fez o executor interromper com
  `EXECUTION_INTEGRITY_ERROR` antes da avaliação quando a apresentação não está
  autenticada ao plano/view.
- Ganho funcional integral: `6/29 → 6/29`; parciais continuam 3; blockers
  solucionados: nenhum Criteria completo. Benefício: associação explícita agora
  pode ser consumida somente pelo Criterion exato e por apresentação/RDE
  vinculadas, com trace; lado inferido continua em `MANUAL_REVIEW` enquanto
  calibração não for válida.
- Gates: 143 testes Python PASS; 9 suítes Apps Script PASS; `node --check` em
  todos os módulos JS e `Code.gs` PASS; regeneração de
  `CompiledRuntimeContract.js` byte-identical PASS, SHA-256
  `d1078bf77917eb892a7282dfb7e8613b7dc97063e0bbebde96de5fddbfd244ec`; teste
  Python valida manifests/guards; `git diff --check` PASS. Após corrigir a
  contagem humana IN10, 143 testes Python e integridade da matriz (23 linhas)
  foram repetidos e passaram. Release build real em worktree limpa ainda
  pendente.
- Revisões: Luna independente `PASS`, zero findings materiais; Sol 6.1
  `PASS`, sem findings HIGH/MEDIUM; finding LOW documental de decisão humana
  corrigido para 1 (IN10) e re-review Sol `PASS`, finding fechado. Não equivale
  à revisão final da Fase 6.
- Esforço deste checkpoint: cerca de 35 minutos de análise, testes e revisões;
  uma revisão Luna, uma revisão Sol e uma re-review restrita. A mudança de
  integridade e a matriz não aumentaram cobertura integral.
- Commit `658fa33ae9f280d758d447407c345b7a1ad5cbdd` criado após a aprovação Sol
  e enviado por fast-forward a `origin/feature/apps-script-engine-core`.
  Release build real PASS em clone limpo, 10 documentos; `SOURCE_COMMIT` exato
  `658fa33ae9f280d758d447407c345b7a1ad5cbdd`. SHA runtime permanece
  `d1078bf77917eb892a7282dfb7e8613b7dc97063e0bbebde96de5fddbfd244ec`.
- `HUMAN_DECISIONS_REQUIRED=1` para `T4_IN10_COMMISSIONING`; calibração
  operacional `BLOCKED`; validação institucional da correlação `PENDING`.
  Checkpoint técnico local promovido, sem fechar a Fase 6. Próximo lote priorizado:
  consumidor compartilhado das declarações explícitas de escopo RDE 0.7,
  respeitando somente literais RT já autorizados.

## Lote RT-003 — consumidor explícito de escopo por SMSCI (2026-10-16)

### Fronteira de confiança após revisão Codex/GPT-6 (não Sol 6.1)

O Engine mantém uma única porta autenticada para `RESPONSIBILITY_IS_SATISFIED_FOR_SMSCI`:
o resolver deriva o binding RT-003 completo e ordenado de `contract/plan/view` e
recusa qualquer conjunto de referências diferente. A mesma validação é usada
por `executePlannedCriterion`, `evaluateCriterion` e chamadas diretas ao
resolver. Isso cobre conjuntamente a memória sintética e a omissão de DRT:
sem view imutável autenticada, ou sem todo o binding canônico, o resultado é
`MANUAL_REVIEW`; somente depois são avaliadas as declarações documentais.
Também foi fixado no consumidor RT-003 que `source_document` deve ser a origem
da DRT exata, preservando declarações de terceiro como fato RDE sem cobertura
normativa.

- Base: `315104a5fd629fdd640073655f729becd3e2ff9b`; candidato local ainda
  sem commit. KB `5.25.0`, Engine `4.8`, catálogo RT `2.5`.
- Resultado: `T1_DRT_SMSCI_COVERAGE` continua **parcial**. A cobertura integral
  permanece `6/29`; parcial `3 → 4`; pendente integral `23 → 23`. Nenhum
  Criterion integral foi fechado. Dependência técnica compartilhada encerrada:
  consumir `drt_scope_declaration_items` da memória imutável para unidades
  autenticadas de `WORKLIST.SMSCI`, com atividade literal do catálogo e trace
  dos DRTs, produtos e fontes. Ausência/conflito fica em `MANUAL_REVIEW` sem
  criar FAIL/NC.
- Bloqueios: nenhum novo. Permanece uma decisão humana sobre a independência
  de `T4_IN10_COMMISSIONING`; calibração inferida segue `BLOCKED`; validação
  normativa institucional e transição `VALIDATED_TO_ANALYZED` seguem `PENDING`.
- Gates após as correções da fronteira: 143 testes Python PASS; nove suítes
  Apps Script PASS; sintaxe de todos os módulos/testes JS e `apps-script/Code.gs`
  PASS; duas regenerações byte-idênticas PASS, SHA-256
  `c0442776cc32be0cb10841d891f98623248cf6716734285f48b0379d0099f80d`;
  `git diff --check` PASS. Release limpo PASS, 10 documentos, KB `5.25.0`,
  `SOURCE_COMMIT=db65f23708eecdb8d9fecc9e0ff0d336f3551af9`.
- Revisões: a primeira revisão independente Luna retornou `FAIL`, com um
  finding HIGH (memória sintética podia satisfazer o predicate pela API do
  Engine) e um MEDIUM (teste tratava item RDE idêntico duplicado como válido).
  Correção local: autenticação exige ImmutableExecutionView, contrato, plano e
  CurrentSubmissionContext canônicos e apresentação igual ao comprovante do
  plano; memória sintética resulta em `MANUAL_REVIEW`. A duplicidade não é mais
  aceita no teste; a RDE rejeita IDs repetidos e a regressão verifica o código
  de erro. Re-review independente focado Luna retornou `PASS`: os dois
  findings foram fechados, com zero achados bloqueantes novos. Uma revisão
  adversarial Codex/GPT-6 (não Sol) retornou `FAIL`: dois HIGH (omissão de DRT
  na API pública e declaração de terceiro aceita como cobertura) e um LOW
  documental. A fronteira comum foi corrigida; re-review independente Luna
  confirmou os dois HIGH fechados. A revisão arquitetural final GPT-6 retornou
  `PASS` para promoção deste lote parcial, sem findings HIGH/MEDIUM; o revisor
  confirmou a identidade como GPT-6, não Sol. A revisão também apontou um LOW
  de rastreabilidade no tracker (status de commit desatualizado e linha de
  correção incompleta), corrigido nesta atualização. Este GPT-6 foi aceito pelo
  usuário como alternativa de revisão; `SOL_6_1=PENDING` permanece explícito.
  `FINDINGS_OPEN=0`.
- Esforço aproximado: 95 minutos entre implementação assistida, análise de
  produtividade, integração, testes e ciclos de revisão. Benefício demonstrado: declarações
  válidas do sistema em análise são rastreáveis na execução do Criterion
  explícito, inclusive com múltiplas DRTs/produtos; cobertura integral não
  aumentou.
- Re-review do finding MEDIUM de rastreabilidade: Luna independente `PASS`;
  declaração conflitante, produto e fonte estão no trace e o resultado segue
  `MANUAL_REVIEW`, sem FAIL/Nonconformity ou mutação da RDE.
- Snapshot limpo revisado: `511a5dc02bc5d0cae57d8421ee6bade1195cef54`. Commit
  promovido e enviado por fast-forward: `17b6ba9c179416c7f73dc46650e9598a1f04e049`.
  O release build exato desse commit passou em
  `/tmp/phase6-rt003-pushed-release-rfZWjr/output`, contendo os dez documentos
  da Base, `KNOWLEDGE_BASE_VERSION=5.25.0` e `SOURCE_COMMIT` igual ao SHA
  promovido. Hash do runtime regenerado:
  `c0442776cc32be0cb10841d891f98623248cf6716734285f48b0379d0099f80d`.
- A revisão arquitetural GPT-6 foi aceita pelo usuário para promover este lote;
  a identidade não é registrada como Sol 6.1 e `SOL_6_1=PENDING` permanece para
  a consolidação final da Fase 6. Próximo passo funcional: prosseguir pelos
  Criteria independentes priorizados na matriz.

### Fechamento da fronteira pública de avaliação — candidato local (2026-10-16)

- Base: HEAD remoto `1b1503266abca949a25d37231fcddc3b8198208b`; alterações ainda
  não commitadas. Re-review independente focada encontrou inicialmente HIGH:
  `evaluateCriterion` avaliava sem binding quando a API pública era chamada
  diretamente.
- Correção de fronteira: a função passou a `evaluateCriterion_` (privada para
  clientes `google.script.run`); o pipeline continua chamando-a somente com
  binding e contexto autenticados. `executePlannedCriterion` é a entrada
  pública e mantém validação do plano, view e apresentação. Teste verifica que
  o símbolo `evaluateCriterion` não está exposto. Re-review Luna independente:
  `PASS`; finding HIGH fechado. Limite: revisão estática e de testes, sem
  execução do Apps Script implantado.
- Cobertura e benefício: integral `6/29 → 6/29`; parcial `4 → 4`; pendentes
  integrais `23 → 23`. Nenhum Criterion ganho; fecha uma rota direta de
  avaliação sem plano/contexto e mantém a execução operacional autenticada.
- Gates neste candidato: Python `143/143`; Apps Script `9/9`; `node --check`
  nos módulos e testes JS, sintaxe de `Code.gs`, manifests/guards cobertos pela
  suíte Python e `git diff --check`: `PASS`. Runtime SHA-256
  `c0442776cc32be0cb10841d891f98623248cf6716734285f48b0379d0099f80d`; teste
  Python de regeneração byte-identical: `PASS`. Release build `PASS` em
  worktree temporária limpa, com dez documentos e KB `5.25.0`; snapshot fonte
  `f048b13cc16722a939830b36308be49f80f4ccff` e saída
  `/tmp/phase6-release-candidate.ZICjDu/release-output`. Esse commit existe
  somente na worktree temporária de validação e não promove o branch de trabalho.
  `SOL_6_1=PENDING`.
- Revisões desta correção: uma revisão independente encontrou o HIGH e uma
  re-review focada confirmou o fechamento. Esforço adicional aproximado:
  15 minutos. Nenhum novo blocker; findings abertos neste escopo: zero.
- A revisão arquitetural selecionada via modelo `gpt-6.1-sol` retornou
  `PASS`, mas o próprio revisor identificou sua execução como GPT-6, não Sol
  6.1. O resultado é registrado como GPT-6 independente aceito previamente
  pelo usuário, mas não satisfaz o gate atual que exige Sol 6.1. Sem commit ou
  push; `SOL_6_1=PENDING`. O release build da árvore exata foi posteriormente
  validado em worktree temporária limpa, sem promover o branch.
- Tentativas via `chatgpt-web/gpt-5.6-sol` e `chatgpt-web/gpt-5.6-sol-instant`
  terminaram sem executar: o serviço informou capacidade esgotada. Não são
  aprovações nem findings; o gate Sol 6.1 continua pendente. A árvore e os
  checkpoints foram preservados para retomada.
- Nova tentativa `chatgpt-web/gpt-5.6-sol` também retornou capacidade
  esgotada; nenhuma revisão Sol foi realizada neste ciclo.

### Blocker factual/técnico identificado — `T4_IN09_DRT`

- A IRV Habite-se 2024, Tabela 4, p. 7, declara DRT de execução e DRT de
  vistoria/ensaio para pressurização/gradiente de pressão. O Requirement usa
  RT-003 e RT-005; o Criterion usa os tokens `EXECUCAO` e `VISTORIA_ENSAIO`.
- O Anexo A define para RT-005 `COMPATIBLE_ACTIVITIES: VISTORIA/INSPEÇÃO` e
  não declara `MACHINE_COMPATIBLE_ACTIVITY_LITERALS`. O contrato do Anexo diz
  que cada machine literal deve ser uma string exata já declarada em
  `COMPATIBLE_ACTIVITIES`, sem sinônimos ou normalização. A IRV descreve a
  exigência documental, mas não formaliza o mapeamento de extração do token
  `VISTORIA_ENSAIO` para uma expressão literal na DRT.
- Alternativas: (A) autoridade da Base/catalogação formaliza um literal exato
  de RT-005 e seu vínculo ao token do Criterion, com fonte e teste; (B) manter
  a validação RT-005 em `MANUAL_REVIEW` até existir essa formalização. Recomenda-se
  B enquanto A não for aprovada. Não alterar Requirement/Criterion, não mapear
  por semelhança e não produzir FAIL/NC por coleção RDE vazia. T4_IN09_DRT
  permanece pendente de cobertura integral.
- Executor Luna confirmou o blocker e não acrescentou código para RT-005;
  testes focalizados de responsabilidade, Criterion piloto e Engine Core
  passaram. Ganho integral deste lote: zero; não houve novo blocker normativo
  confirmado, mas há uma formalização de Base pendente e uma revisão Sol 6.1
  indisponível.

### Dependência compartilhada de status DRT — `T1_DRT_REGISTERED` e `T4_DRT_REGISTERED`

- A IRV Habite-se 2024, Tabela 1, p. 4, descreve a condição composta: DRT
  registrada e emitida no Conselho, paga e não rascunho; a causa menciona falta
  de registro de emissão/rascunho. A Base declara `REGISTERED` nos dois
  Criteria. A RDE já preserva `COUNCIL_REGISTRATION_STATUS`,
  `COUNCIL_ISSUANCE_STATUS` e `COUNCIL_PAYMENT_STATUS` como fatos TEXT
  distintos, sem inferência entre eles.
- A revisão de implementação Luna parou antes de codificar: o contrato não
  define vocabulário literal fechado para esses campos. Strings positivas
  usadas em fixtures (`registrada`, `emitida`, `paga`) não são autoridade para
  criar mapeamento. Alternativas: (A) formalizar vocabulário controlado e
  mapeamento de extração, preservando o literal original e provenance; (B)
  manter o resultado em `MANUAL_REVIEW` até o contrato de status ser aprovado.
  Recomenda-se B até formalizar A; nunca inferir emissão/pagamento do registro
  isolado nem gerar NC quando algum status estiver ausente/ambíguo.
- Ganho desta análise: zero Criteria; dependência de um único contrato
  compartilhado para dois Criteria, agora priorizado como primeiro lote
  funcional depois de resolvido o vocabulário. Não altera `HUMAN_DECISIONS_REQUIRED`
  por enquanto; é blocker de formalização técnica, distinto da decisão IN10.
- `python -m unittest discover -s tests -p 'test*.py'`: `143/143 PASS` após a
  atualização do inventário. Sem código alterado nesta análise; o lote anterior
  mantém os gates completos registrados acima.

### Blocker de binding e completude — `T4_IN19_FINAL_VERIFICATION`

- Revisão independente somente leitura confirmou que o Criterion não pode ser
  concluído pelo executor atual sem contrato adicional: a entidade
  `LOW_VOLTAGE_FINAL_VERIFICATION_DRT` está tipada como `DRT`, enquanto a RDE
  materializa evidências concretas como documentos `ART`/`RRT`/`TRT` que estendem
  DRT; o binding de responsabilidade existente suporta apenas RT-002/RT-003.
- RT-007 consta do Anexo A, mas não possui `MACHINE_COMPATIBLE_ACTIVITY_LITERALS`.
  A RDE não define que coleção vazia seja completa nem prova ausência de DRT.
  Logo, não é seguro transformar `EXISTS` ou ausência do item em resultado
  positivo/negativo, nem gerar NC_T4_014 por inferência.
- Alternativas: (A) formalizar a ligação da declaração factual da RDE à evidência
  documental concreta e à RT-007/atividade, incluindo literal autorizado e
  regra de completude/insuficiência; (B) manter MANUAL_REVIEW até esse contrato
  ser autorizado. Recomenda-se B. A fonte normativa confirma o requisito de
  verificação final, mas não resolve o contrato de representação/binding.
- Resultado do lote de diagnóstico: cobertura integral +0; parcial +0; blocker
  técnico confirmado +1; decisão normativa humana nova +0. A revisão não alterou
  código nem critérios. O inventário registra a limitação e mantém o Criterion
  pendente de cobertura integral.

### Checagem do menor lote funcional — `T1_DRT_REQUIRED`

- Reauditoria do código e da fonte: `T1_DRT_REQUIRED` declara
  `RESPONSIBILITY_HAS_ACCEPTED_DRT_EVIDENCE(RT_002_EXECUCAO_DE_OBRA)`. O binder
  percorre todas as formas concretas ART/RRT/TRT e inclui cada documento com o
  fato exato `RESPONSIBILITY_TYPE=EXECUCAO`; o Engine valida e preserva todas as
  referências. A Base não declara cardinalidade máxima nem seleção de uma
  DRT. Portanto, multiplicidade por si só não é ambiguidade nem exige nova
  regra: havendo uma ou mais evidências exatas, a verificação existencial é
  `TRUE`.
- Evidência executável já existente: `tests/apps-script-pilot-criterion.test.js`
  cria duas DRTs RT-002, confirma que ambas entram no binding, que o resultado
  é `TRUE` e que as duas referências aparecem no trace. Não há fundamento para
  abrir novo executor ou contrato de cardinalidade neste Criterion.
- Blocker residual único: zero DRTs vinculadas não prova que a DRT não foi
  submetida. Sem inventário completo/autenticado, o resultado permanece
  `MANUAL_REVIEW`; só uma prova explícita de `DOCUMENT_ABSENCE` poderia
  sustentar `FALSE` e `NC_T1_001`. A cobertura integral continua bloqueada pelo
  contrato compartilhado de inventário, não por multiplicidade.
- Esta reauditoria não altera código, Requirement ou Criterion. Ganho de
  cobertura: zero; reduz um blocker previamente superestimado (cardinalidade/
  conflito) ao blocker real da prova de ausência. O teste focal será executado
  para confirmar o comportamento descrito.
- Resultado: integral `6/29 → 6/29`; parcial `4 → 4`; pendentes integrais
  `23 → 23`; blocker técnico compartilhável +1; decisão normativa humana +0.
  Luna executou `node tests/apps-script-pilot-criterion.test.js`,
  `node tests/apps-script-responsibility-evidence.test.js` e `git diff --check`;
  todos passaram. Sem implementação ou revisão adversarial adicional neste
  lote; esforço limitado à auditoria do caminho RT-002 e às suítes focadas.

### Revisão arquitetural independente do candidato — 2026-10-16

- O revisor solicitado como GPT-6.1 Sol identificou-se como GPT-6. Resultado:
  `FAIL` para o candidato local; não é registrado como Sol 6.1. A revisão foi
  somente leitura e abrangeu Engine, pipeline, RDE, documentos arquiteturais,
  integração de correlação e readiness.
- `P2 / MEDIUM`: `evaluateCriterion_` converte binding inválido ou falha de
  materialização em registro EVALUATED/MANUAL_REVIEW com `evaluationPerformed`
  verdadeiro e trace vazio. Isso mascara falha de integridade como resultado
  executado, contrariando `08_execution_pipeline.txt` § consolidação. A entrada
  pública ainda rejeita binding inválido antes da avaliação; nenhum PASS público
  não autorizado foi demonstrado.
- `P3 / LOW`: o teste de referência trocada omite `unitKey`/`role` e termina na
  rejeição preliminar, sem exercer a divergência da referência. O revisor
  reproduziu rejeição correta com contexto completo; falta fixar essa regressão
  na suíte.
- Demais superfícies revisadas: fronteira pública autenticada, sidecar de
  correlação separado de associações explícitas, correlação incapaz de gerar
  PASS isoladamente e readiness sem permitir análise foram consideradas
  compatíveis nos cenários examinados. Calibração real continua bloqueada.
- Correção: binding inválido, divergência de unidade/Criterion e falha de
  materialização agora encerram a execução com `EXECUTION_INTEGRITY_ERROR`, sem
  fabricar resultado ou trace. MANUAL_REVIEW emitido por predicates para
  insuficiência documental preserva sua semântica. Testes herdados foram
  atualizados para exigir erro de integridade; o teste P3 agora fornece contexto
  autenticado completo e exercita a referência/expressão divergente.
- Re-review Luna independente: `P2 PASS`, `P3 PASS`; sem regressão observada em
  MANUAL_REVIEW documental, exceções, caminhos ASSERT/VALIDATE ou fronteira
  pública. As três suítes focadas passaram.
- Gates completos após a correção: Python `143/143`; Apps Script `9/9`;
  `node --check` em módulos e testes JS e sintaxe de `Code.gs`; regeneração
  byte-idêntica e testes de manifests/phase guards; `git diff --check` — PASS.
  SHA-256 de `CompiledRuntimeContract.js`:
  `c0442776cc32be0cb10841d891f98623248cf6716734285f48b0379d0099f80d`.
  Release build PASS na worktree temporária limpa do snapshot técnico
  `e26ac898ade491e122c9240f7fae74aadebec3ae`; compilou os dez documentos da KB.
  A análise `DRT_COVERS` abaixo alterou somente este tracker; não alterou as
  entradas do release nem o código coberto pelos gates.
- Findings deste review: `FINDINGS_OPEN=0`. O candidato ainda não foi
  promovido: revisor identificou-se como GPT-6, não Sol 6.1; revisão arquitetural
  final Sol 6.1 permanece `PENDING`. Não houve ganho de Criteria neste lote.
- Tentativas de revisão final via `chatgpt-web/gpt-5.6-sol`,
  `chatgpt-web/gpt-5.6-sol-instant` e nova tentativa Sol web retornaram
  `Selected model is at capacity`; nenhuma foi tratada como revisão concluída.
  O GPT-6 independente foi usado conforme aceite anterior do usuário e a
  re-review Luna encerrou os achados; ambos os registros permanecem distintos
  do gate final Sol 6.1.
- Nova tentativa nesta retomada, após liberar agentes concluídos e com o diff
  reconciliado, também falhou com `Selected model is at capacity`; nenhum agente
  Sol executou a revisão. `SOL_6_1=PENDING`, sem commit/push.
- A tentativa repetida após fechar os agentes ambientais Hubble/Popper também
  retornou indisponibilidade/capacidade; a ferramenta não iniciou Sol 6.1. Para
  retomar promoção: revisão arquitetural Sol 6.1 disponível e `PASS`. Para
  cobertura: decisões/fatos catalográficos pendentes para RT-005/006/014,
  vocabulário de status DRT, semântica de cardinalidade/insuficiência RT-002,
  evidências de assinatura/datas/conteúdo; `T4_IN10_COMMISSIONING` depende de
  decisão normativa humana. Critérios afetados permanecem na matriz sem FAIL
  inferido. Calibração real continua `BLOCKED`.

### Limite real de alcance do contrato `DRT_COVERS`

- `00_engine.txt` já define o resultado positivo de `DRT_COVERS`: a DRT deve
  declarar explicitamente o documento, SMSCI e atividade requeridos. RDE 0.7
  preserva esses quatro endpoints como fatos, mas declara que o item não é
  cobertura normativa e que texto de terceiro não prova sozinho o escopo da
  DRT. Portanto, a coleção RDE isolada não autoriza `PASS`.
- A análise de Requirements limita o alcance funcional imediato: IN07, IN10,
  IN12 e IN15 requerem RT-014; IN08 e IN09 test report requerem RT-006; IN09
  também separa RT-003 e RT-005. O Anexo A traz literal máquina para RT-002 e
  RT-003, mas não resolve a compatibilidade de atividade de RT-006, registra
  RT-005 sem literal e exige código/descrição específica em parte do escopo, e
  dá condições diferentes por SMSCI para RT-014. Logo, a estimativa “até 8” é
  apenas potencial após formalização catálogo/fonte, não cobertura desbloqueável
  apenas codificando o leitor da RDE.
- Alternativas: (A) formalizar, com fonte autorizada, os literais/compatibilidade
  por RT e SMSCI e a autoridade da declaração que pode provar o escopo da DRT;
  (B) manter DRT_COVERS em MANUAL_REVIEW para esses casos até existir esse
  mapeamento. Recomenda-se B; não inferir pelo nome do produto ou por atividade
  semanticamente parecida. A exceção RT-003 já consumida por
  `T1_DRT_SMSCI_COVERAGE` permanece restrita ao Criterion e aos tokens exatos
  que seu contrato declara.
- Lote de análise: Criteria integrais antes/depois `6/29 → 6/29`; parciais
  `4 → 4`; novo código `0`; revisão independente/re-review `0` (análise local
  das fontes); benefício: remove alcance superestimado e evita implementar um
  executor que só produziria MANUAL_REVIEW sem cobrir as exigências vigentes.
  A pendência técnica/catálogo continua registrada por Criterion na matriz.

### Retomada da revisão final — 2026-10-17

- Worktree conferido: branch `feature/apps-script-engine-core`, HEAD local e
  remoto `1b1503266abca949a25d37231fcddc3b8198208b`; alterações locais e
  `.codex-local-evidence/` preservados.
- Gates reexecutados no candidato: 9/9 suítes Apps Script, 143/143 testes
  Python, sintaxe de módulos/testes JS e `Code.gs`, `git diff --check` — PASS.
- Revisão final solicitada a `chatgpt-web/gpt-5.6-sol` após liberar slots de
  agentes terminou antes de iniciar com `Selected model is at capacity`; não é
  revisão, finding ou aprovação. `SOL_6_1=PENDING`; nenhum commit/push ou ganho
  de Criterion nesta retomada.
- HISTÓRICO SUPERSEDIDO (decisão do usuário em 2026-10-17): o texto anterior
  dizia que a segunda atividade explícita na DRT RT-002 obrigava
  `MANUAL_REVIEW`. O usuário decidiu que o literal exato `EXECUÇÃO` basta para
  o fato requerido mesmo quando a DRT declara outras atividades. A
  implementação e os testes foram ajustados para essa decisão; isso não
  atesta competência profissional. `T1_DRT_ACTIVITY_EXECUTION` segue parcial
  por lacunas independentes de binding, ausência/conflito e completude da
  extração.
- HISTÓRICO SUPERSEDIDO: tentativas anteriores de revisão Sol terminaram por
  indisponibilidade do modelo. Em 2026-10-17 o usuário respondeu às questões
  sobre independência em IN10/IRV, limite do sistema nas RT-005/006/014 e
  atividades adicionais em RT-002. As decisões estão registradas nesta
  documentação; a revisão Sol atual do lote e seu resultado devem ser
  registrados no fechamento desta etapa.

### Fechamento da formalização factual e documental — 2026-10-17

- Decisões formalizadas: (1) a exigência de independência para o Criterion
  IN10 tem fundamento na IRV Habite-se 2024, Anexo A, Tabela 4, p. 9, e no
  art. 41 da IN 10; a precedência da IRV em fiscalização foi confirmada pelo
  usuário; (2) compatibilidade atividade↔SMSCI em RT-005/006/014 não é
  verificada pelo sistema; fatos e proveniência permanecem documentais;
  (3) em RT-002, a literal exata `EXECUÇÃO` sustenta o fato requerido mesmo
  junto de atividades adicionais, sem atestar competência profissional;
  (4) vocabulário controlado de status considera ART/RRT/TRT sem interpretar
  texto bruto da RDE nem criar regularização normativa.
- Foram corrigidos os registros históricos contraditórios de IN10 e RT-002.
  Primeira re-review Sol encontrou P2/P3 documentais e um marcador `H` ainda
  ativo na matriz. Correções foram aplicadas; re-review independente Sol 6.1
  final: `PASS`, achados anteriores fechados nos quatro pontos examinados,
  `NOVOS_ACHADOS=0` no recorte.
- Critérios integrais antes/depois: `6/29 → 6/29`; parciais: `4 → 4`;
  pendentes de cobertura integral: `23 → 23`; blockers de decisão normativa
  humana nesta questão: `1 → 0`. `T4_IN10_COMMISSIONING` segue bloqueado por
  evidência/contrato técnico, não por decisão humana. Nenhum Criterion foi
  promovido por formalização de vocabulário ou texto.
- Testes/gates no candidato final: Python `143/143`; Apps Script `9/9`;
  sintaxe de todos os módulos/testes JS e `Code.gs`; runtime regenerado duas
  vezes byte-identical, SHA-256
  `0551faa198e7d78526b9ed8a185c4f3ff04cefc264ff0e18f39358d5b30b3dc6`;
  manifests e guards exercitados pela suíte Python; `git diff --check` — PASS.
  Release build real PASS após consolidação do commit `158021bb3f74f8c9b54776bafe8eda1a83e1b3da`, em worktree limpa: 10 documentos e `SOURCE_COMMIT` exato.
- Esforço: uma revisão Sol inicial (FAIL documental) e uma re-review Sol
  focada (PASS); uma rodada consolidada de gates após correções, além dos
  testes direcionados anteriores de RT-002/readiness/status. Benefício
  operacional: não computar competência por atividade excedente, não fazer
  julgamento atividade↔SMSCI reservado aos conselhos, e eliminar a falsa
  pendência normativa de IN10, preservando as lacunas reais de evidência.
- `NORMATIVE_INSTITUTIONAL_VALIDATION=PENDING` (correlação IA),
  `VALIDATED_TO_ANALYZED=PENDING` e `CALIBRATION_GATE=BLOCKED` permanecem
  inalterados. Esta formalização não fecha a Fase 6.

### Retomada — auditoria de status e vetor DRT×múltiplos produtos — 2026-10-19

- Estado no início: HEAD local/upstream `158021bb3f74f8c9b54776bafe8eda1a83e1b3da`,
  branch `feature/apps-script-engine-core`; `.codex-local-evidence/` preservado.
- Reconciliado o caminho de menor alcance da matriz (`T1_DRT_REGISTERED` e
  `T4_DRT_REGISTERED`) com fonte oficial. A IRV Habite-se 2024, Anexo A,
  Tabela 1, p. 4, determina identificar DRTs registradas e emitidas no conselho
  “(pagos, não são rascunhos)” e também conferir assinatura digital do RT ou
  certificação do Conselho. Texto oficial:
  https://documentoscbmsc.cbm.sc.gov.br/uploads/007b6741900db4f57a80d467023bfead.pdf
  (vigência indicada no documento: 24/04/2024).
- Fontes oficiais de conselho consultadas: o Confea informa que a ART é
  válida somente quando quitada, mas não define nessa página um contrato
  completo e tipado de registro/emissão/pagamento
  (https://www.confea.org.br/servicos-prestados/anotacao-de-responsabilidade-tecnica-art).
  O CAU/BR FAQ descreve formulário RRT final numerado e sem tarja de rascunho
  após pagamento; a página atual do CAU Digital (publicada em 31/07/2026)
  também diz que o RRT Simples passa a ter validade após compensação do
  pagamento, mas não fornece uma tabela completa de literais por campo e
  modalidade
  (https://transparencia.caubr.gov.br/perguntas-frequentes-registro-de-responsabilidade-tecnica-rrt/;
  https://caubr.gov.br/cau-digital-concentra-emissao-de-rrt-simples-para-arquitetos-e-urbanistas/).
  Para o CFT, material público de 2025 confirma número único após aprovação
  do sistema e pagamento de taxas para emissão, mas não define os status
  atuais, campo a campo, no documento TRT
  (https://cft.org.br/termo-de-responsabilidade-tecnica-seguranca-e-transparencia-no-exercicio-legal-da-profissao/;
  https://cft.org.br/pagamento-via-pix-esta-disponivel-em-todo-o-sistema-cft-crts/).
  O manual público que enumera estados do workflow TRT é de 2018 e descreve
  estados como “aguardando validação”, “aguardando pagamento”, “aprovado” e
  “válido”; o CFT também documenta exceção normativa de taxa do TRT-Solidário
  (https://www.cft.org.br/wp-content/uploads/2018/10/MANUAL-DE-GERACAO-DE-TRT-v1_2.pdf;
  https://www.cft.org.br/conselho-federal-isenta-tecnicos-industriais-em-acoes-solidarias-nos-estados-e-municipios-em-situacao-de-emergencia-ou-calamidade/).
- Resultado: vocabulário versionado continua preparatório; não foi criada
  tabela operacional de equivalências ART/RRT/TRT. Em particular, não mapear
  status CFT de fonte antiga nem equiparar taxa legalmente isenta a `PAID` sem
  fundamento explícito do CBMSC. Literal desconhecido, estado não confirmado
  ou possível exceção permanecem em revisão humana. Critérios integrais não
  mudam; implementação de parser/mapeador agora não demonstraria cobertura
  integral nem seria segura para todos os três documentos.
- Pesquisa complementar em fontes oficiais atuais em 2026 confirmou apenas
  fragmentos de condições substantivas e de emissão para ART/RRT/TRT; não
  encontrou um contrato público atual, versionado e completo que associe cada
  literal de cada campo às categorias Engine em todos os três conselhos. As
  páginas Confea/CAU e materiais CFT citados acima não bastam para classificar
  status brutos sem aproximação. `STATUS_MAPPING_ART_RRT_TRT=BLOCKED` e
  `T1_DRT_REGISTERED`/`T4_DRT_REGISTERED` permanecem sem cobertura integral.
- Revisão independente Luna, dirigida apenas às fontes e afirmações novas:
  `PASS`, sem findings materiais. A re-review ressalvou que a pesquisa não é
  prova de inexistência absoluta de outras fontes; o registro mantém a
  formulação restrita ao material encontrado.
- Gates no candidato documental: Python `143/143`; Apps Script `9/9`; sintaxe
  de todos os módulos/testes JS e `Code.gs`; runtime regenerado duas vezes
  byte-identical, SHA-256
  `0551faa198e7d78526b9ed8a185c4f3ff04cefc264ff0e18f39358d5b30b3dc6`;
  phase guards/manifests pela suíte Python; `git diff --check` — PASS. Release
  build em worktree limpa do commit deste registro ainda pendente.
- Esforço aproximado: 10 minutos entre pesquisa, registro e revisão dirigida;
  um ciclo de revisão independente; Criteria integrais `6/29 → 6/29`, parciais
  `4 → 4`, pendentes `23 → 23`; ganho funcional zero. Blocker factual de status
  não fechado; nenhum blocker normativo novo. Próximo passo: avançar ao próximo
  Criterion independente, sem presumir equivalência de status.
- Feasibility check independente Luna para `T4_IN19_FINAL_VERIFICATION`:
  não integralmente implementável no HEAD sem adicionar representação de
  documento concreto ART/RRT/TRT, binding RT-007, literal autorizado e
  completude/ausência. A ausência na coleção RDE continua sem autorizar FAIL ou
  NC_T4_014. A análise não alterou código nem fontes canônicas.
- Auditoria Luna da lista de 20 vetores adversariais encontrou uma lacuna
  explícita: uma DRT associada a dois produtos distintos. O teste foi
  acrescentado em `tests/apps-script-documentary-correlation.test.js` (uma
  DRT, duas associações documentais válidas e dois candidatos), esperando
  `HUMAN_REVIEW_REQUIRED`, `COMPETING_CANDIDATES` e candidato automático nulo;
  a coleção incompleta espera `INCOMPLETE_CANDIDATE_SET`. Todos os outros 19
  vetores da lista solicitada foram localizados por nome/evidência na suíte.
- Revisão independente Luna do teste: `PASS`, nenhuma incerteza material; a
  revisão confirmou candidatos para os dois pares e compatibilidade com a
  regra DRT×produtos em `CorrelationCore.js:245-268`. Teste focal
  `apps-script-documentary-correlation.test.js` e `git diff --check` passaram.
  Gates pós-lote completos: 143 Python, 9 suítes Apps Script, sintaxe JS e
  Code.gs, regeneração byte-identical (SHA-256
  `0551faa198e7d78526b9ed8a185c4f3ff04cefc264ff0e18f39358d5b30b3dc6`),
  manifests/guards pela suíte Python e diff check — PASS. Commit/push
  `c22d0b7568e371996cb57fb254feb8fbe986fff4` enviados por fast-forward.
  Release real PASS em worktree limpa: 10 documentos,
  `SOURCE_COMMIT=c22d0b7568e371996cb57fb254feb8fbe986fff4`. A revisão final
  independente Sol 6.1 da Fase 6 continua `PENDING`.
- Ganho: Criteria integrais `6/29 → 6/29`; parciais `4 → 4`; pendentes
  integrais `23 → 23`. Blockers fechados: 0 Criteria; cobertura adversarial
  obrigatória `19/20 → 20/20` vetores explicitamente demonstrados. Benefício:
  impede seleção automática de um entre produtos concorrentes quando uma DRT
  está explicitamente ligada a ambos. Esforço aproximado: 25 minutos entre
  pesquisa, triagem, fixture e revisão; uma execução Luna, uma revisão Luna
  do teste e uma triagem Luna independente.
- `CALIBRATION_GATE=BLOCKED`, `NORMATIVE_INSTITUTIONAL_VALIDATION=PENDING` e
  `VALIDATED_TO_ANALYZED=PENDING` permanecem inalterados. Nenhuma admissão
  automática real foi validada.

### Fechamento da formalização preparatória de status ART/RRT/TRT — 2026-10-19

- Formalização canônica confirmada em `knowledge-base/00_engine.txt` (vocabulário
  de classificação de status) e `knowledge-base/09_Especificacao_da_RDE.txt`
  (preservação de fatos literais): categorias separadas para registro,
  emissão e pagamento; preservação do literal e proveniência; mapeamento
  versionado explicitamente por tipo documental, conselho emissor e campo;
  valor ausente/ambíguo/não mapeado permanece insuficiente, com revisão
  humana, sem `FAIL`/Nonconformity automática. O contrato aplica-se a ART,
  RRT e TRT.
- Adicionado teste focal em `tests/apps-script-rde-core.test.js`: status
  distintos e ambíguos de ART/RRT/TRT permanecem literalmente inalterados e
  com proveniência, sem campo de classificação sintetizado pela RDE. Isso
  verifica a fronteira FACT ONLY; não testa nem cria equivalências por
  conselho.
- Estado desta etapa: `STATUS_VOCABULARY_CONTRACT=FORMALIZED_PREPARATORY`;
  `STATUS_MAPPING_ART_RRT_TRT=BLOCKED` até existirem mapeamentos versionados
  sustentados por fonte autorizada para cada conselho/tipo/campo. A IRV
  sustenta a condição composta de fiscalização, mas não enumera esses
  mapeamentos. Critérios `T1_DRT_REGISTERED` e `T4_DRT_REGISTERED` não ganham
  cobertura integral com esta formalização.
- Ganho funcional: Criteria integrais `6/29 → 6/29`; parciais `4 → 4`;
  pendentes integrais `23 → 23`. Benefício contratual: os status distintos
  seguem rastreáveis como fatos; o contrato proíbe equiparar, por exemplo,
  “isenta de taxa” a `PAID` ou mapear “rascunho” entre conselhos sem regra
  explícita versionada. O teste demonstra preservação no parse/validação da
  RDE, não valida um pipeline de EXTRACTION nem classifica esses textos.
- Gates: teste focal RDE PASS; Python `143/143`; Apps Script `9/9`; sintaxe
  de todos os módulos/testes JS e `Code.gs`; runtime regenerado duas vezes
  byte-identical, SHA-256
  `0551faa198e7d78526b9ed8a185c4f3ff04cefc264ff0e18f39358d5b30b3dc6`;
  manifests/guards validados pela suíte Python; `git diff --check` PASS.
- Revisão independente Luna: primeira rodada `FAIL` (teste inicial não cobria
  round trip RDE nem toda a proveniência; claim de benefício amplo). Correções
  aplicadas; re-review dos findings `PASS`, efeitos colaterais zero no escopo.
  Um ciclo de revisão/correção/re-review; nenhum finding aberto.
- Release build: não repetido neste lote, pois não houve alteração de fonte
  compilada da Base nem do runtime; o build real do HEAD funcional anterior
  `c22d0b7568e371996cb57fb254feb8fbe986fff4` foi validado em worktree limpa
  (10 documentos e SOURCE_COMMIT exato), conforme registrado acima.
- Commit `c45e756d0a875340f0785b474739d7347613f465` enviado por fast-forward
  para `origin/feature/apps-script-engine-core`; contagem ahead/behind `0/0`.
  Revisão Sol 6.1 final da Fase 6 permanece `PENDING`.

### Validação de HEAD após reconciliação da decisão IN10 — 2026-10-19

- HEAD remoto/local `c503285099476f6cf4b52d3a94c7debd32cfb702`; release build
  executado em worktree limpa destacada: `PASS`, 10 documentos,
  `SOURCE_COMMIT` exatamente igual ao HEAD. Python `143/143`, Apps Script
  `9/9` e `git diff --check` passaram após a reconciliação documental da
  decisão do usuário. SHA-256 do runtime permaneceu
  `0551faa198e7d78526b9ed8a185c4f3ff04cefc264ff0e18f39358d5b30b3dc6`.
- Esse lote corrigiu a rastreabilidade da decisão IN10; não alterou runtime
  ou Base nem aumentou cobertura: `CRITERIA_COVERED=6/29`, `PARTIAL=4`,
  `PENDING=23`. Falta confirmar identidade do solicitante/RT e o modo mecânico
  por fatos documentais autorizados. `SOL_REVIEW` final permanece `PENDING`.

### Retomada e release da auditoria dos status dos conselhos — 2026-10-19

- O HEAD `c23bbdca41ddd7c62e9ed8dd671dbb9eecc231c6` foi validado em worktree
  limpa destacada: release build `PASS`, 10 documentos e `SOURCE_COMMIT`
  exatamente igual ao commit. A auditoria confirmou que as fontes públicas
  consultadas não estabelecem um vocabulário completo e seguro para classificar
  todos os estados ART/RRT/TRT; `STATUS_MAPPING_ART_RRT_TRT=BLOCKED` e os
  Criteria de registro permanecem pendentes. Não houve ganho de cobertura.
- O estado local e `origin/feature/apps-script-engine-core` estavam alinhados
  nesse HEAD; `.codex-local-evidence/` permanece preservado e não versionado.
  Cobertura segue `CRITERIA_COVERED=6/29`, `PARTIAL=4`, `PENDING=23`.
  `SOL_REVIEW` final da Fase 6 permanece `PENDING`.
- Na retomada, os gates completos passaram sem alteração do runtime: 143 testes
  Python; 9/9 suítes Apps Script; `node --check` em módulos e testes JS;
  sintaxe de `Code.gs`; duas regenerações consecutivas byte-idênticas de
  `CompiledRuntimeContract.js`, SHA-256
  `0551faa198e7d78526b9ed8a185c4f3ff04cefc264ff0e18f39358d5b30b3dc6`;
  manifests e phase guards cobertos pela suíte Python; `git diff --check` PASS.
- Depois do push, o release build foi repetido em worktree limpa no commit
  `cca3a9f7f62c7794974d0a25f4e9a0ca7d3718ce`: `PASS`, 10 documentos,
  `SOURCE_COMMIT` exato e Base `5.26.0`.
- Rechecagem funcional dos Criteria prioritários RT-002: ganhos integrais
  `0`; `T1_DRT_REQUIRED` continua parcial porque a RDE/view não certifica
  completude da coleção documental, então binding vazio ou multiplicidade não
  autorizam ausência/FAIL; `T1_DRT_ACTIVITY_EXECUTION` preserva o positivo
  factual do literal `EXECUÇÃO`, mas não dispõe de fato de completude que
  permita concluir o negativo. Não foi introduzida semântica nova nem rodada
  revisão geral redundante. O próximo trabalho funcional depende de contrato
  de completude factual autorizado ou de outro conjunto de evidências já
  tipado; cobertura permanece `6/29`, `PARTIAL=4`, `PENDING=23`.

### Divergência contratual sobre estado e inventário documental — 2026-10-19

- `08_execution_pipeline.txt` § PHASE 2/DOCUMENT STATE manda atribuir
  `PRESENT`/`ABSENT`/`INCOMPLETE`/`UNVERIFIABLE` a cada documento exigido pela
  Base, enquanto § DOCUMENTARY EXTRACTION proíbe classificar relevância. O
  Documento 09-RDE 0.7 não define coleção/estado de inventário por arquivo; suas
  coleções factuais vazias não declaram completude, e `00_engine.txt` admite
  `DOCUMENT_ABSENCE` como evidência para resultado.
- Efeito direto: sem uma fonte autenticada que enumere todos os documentos da
  apresentação e identifique itens não processados/não classificados, o Engine
  não pode converter a ausência de DRT RT-002 em `FALSE`/NC_T1_001. Isso afeta
  diretamente `T1_DRT_REQUIRED`. Um inventário de arquivos, sozinho, não prova
  que todas as atividades foram extraídas de cada DRT; `T1_DRT_ACTIVITY_EXECUTION`
  precisaria de garantia separada de completude por DRT/atributo e continua
  parcial.
- Ponto de código verificado: `criterionExecutionBindExists_` em
  `apps-script/CriterionExecutionCore.js` cria atualmente uma referência
  `DOCUMENT_ABSENCE` sempre que `referencesByEntity` retorna coleção vazia, sem
  consultar inventário/completude. Antes de promover novos resultados
  negativos, esse binder precisa consumir estado autenticado de ausência ou
  encaminhar a falta de inventário para insuficiência; os testes atuais incluem
  expectativas de ausência que deverão ser revistas conforme a decisão.
- A mesma função executa cinco dos seis Criteria atualmente listados como
  `EXECUTABLE_EXISTING`: `T4_IN08_MANUAL`, `T4_IN09_MANUAL`,
  `T4_IN19_EXECUTION`, `T4_IN19_GROUNDING` e
  `T4_IN19_LEGACY_DOCUMENTATION`. Um novo gate deve preservar esses positivos
  e somente permitir `DOCUMENT_ABSENCE`/FAIL quando o inventário autenticado
  provar ausência; a falta de inventário não pode regredir para FAIL.
- `ARCHITECTURAL_CONFLICT=OPEN`: foi solicitada decisão ao usuário entre
  (A) inventário FACT-ONLY completo na EXTRACTION e avaliação de ausência em
  EXECUTION, com não classificados/incompletos encaminhados a revisão, ou
  (B) manter os estados `DOCUMENT_STATE` na Fase 2 e formalizá-los na RDE.
  Nenhum contrato ou código foi alterado enquanto a decisão aguarda resposta.
- Escopo provável se a alternativa A for autorizada: pode desbloquear a rota
  negativa de um Criterion parcial, `T1_DRT_REQUIRED`, condicionado a
  classificação documental fechada e inventário divergente/incompleto sempre
  encaminhado a revisão. Fixtures devem cobrir arquivo não classificado,
  falha/parcialidade de leitura, multiplicidade e ausência comprovada. Não
  resolve completude de atividades em DRT, status ART/RRT/TRT, assinatura,
  correlação calibrada ou cobertura DRT-produto-SMSCI; não se atribui ganho
  antecipadamente.

### Retomada dirigida — preservação integral da RDE e regra IN09/RT-005 (2026-10-19)

- Checkpoint preservado: branch `feature/apps-script-engine-core`, HEAD local e
  remoto `fcf39dc4d8fd7c8fde54cc9989bc9156db99d433`; `.codex-local-evidence/`
  permanece local e não rastreado.
- O P2 da preservação dos literais de status e proveniência no parse/validação
  round trip da RDE já estava corrigido no commit `c45e756` e sua re-review Luna
  dirigida, gates completos e push estão registrados acima. Reexecução focal
  nesta retomada: `node tests/apps-script-rde-core.test.js` — PASS. Nenhuma
  segunda correção ou revisão geral foi aberta.
- Auditoria da decisão do usuário de não verificar compatibilidade
  atividade↔SMSCI para RT-005/006/014 encontrou contradição ainda presente na
  Base: `REQ_IN09_DRT` lista RT-003 e RT-005, com dois
  `VALIDATE RESPONSIBILITY_ACTIVITY_COMPATIBLE`; o compilador agrega esses
  campos em uma lista global do Requirement, sem escopo por responsabilidade.
  `T4_IN09_DRT` também declara
  `HAS_DRT_ACTIVITY(SMSCI_PRESSURIZATION,"VISTORIA_ENSAIO")`, vinculando a
  atividade da RT-005 ao SMSCI.
- Não foi alterada a Base. Uma tentativa local de formalizar o Criterion como
  revisão humana para presença documental exigiria retirar seu `FAIL NC_T4_004`;
  a revisão automática bloqueou precisamente essa remoção por risco de suprimir
  consequência normativa. A tentativa foi desfeita por completo. Nenhuma
  mudança do usuário foi descartada.
- Ponto de decisão ainda necessário: definir a transição para `T4_IN09_DRT`
  que remova o julgamento atividade↔SMSCI, mas preserve a consequência NC apenas
  se ausência de DRT puder ser comprovada por fato/binding completo. Até existir
  esse contrato, manter o Criterion fora de promoção automática; não inferir
  ausência nem gerar `NC_T4_004` por atividade incompatível.
- Não há ganho de cobertura nesta retomada. O teste focal RDE passou; as gates
  completas e o release build continuam válidos para o checkpoint publicado
  `fcf39dc`.

### Revalidação dos gates no HEAD `23807d5` (2026-10-19)

- Estado reconciliado: HEAD local/remoto
  `23807d5b83a7cc8003381e177e38099733df0fec`; worktree rastreada limpa;
  `.codex-local-evidence/` preservado. Nenhuma alteração de código ou Base
  desde os checkpoints anteriores.
- Python `143/143 PASS`; suítes Apps Script `9/9 PASS`; `node --check` em todos
  os módulos/testes JavaScript e em `Code.gs` — PASS.
- Runtime regenerado duas vezes byte-identical; SHA-256
  `0551faa198e7d78526b9ed8a185c4f3ff04cefc264ff0e18f39358d5b30b3dc6`.
- Release build PASS em worktree destacada e limpa, com os dez documentos do
  manifest, `KNOWLEDGE_BASE_VERSION=5.26.0` e
  `SOURCE_COMMIT=23807d5b83a7cc8003381e177e38099733df0fec` exato. Guards de
  manifest/fase cobertos pela suíte Python; `git diff --check` PASS.
- A validação apenas confirma o checkpoint publicado: cobertura continua
  `6/29` integral, `4` parcial e `23` pendentes; não houve revisão de candidato
  nem aprovação Sol nova. `CALIBRATION_GATE=BLOCKED`,
  `NORMATIVE_INSTITUTIONAL_VALIDATION=PENDING` e
  `VALIDATED_TO_ANALYZED=PENDING` permanecem.

### Retomada local dirigida — ausência sem inventário (2026-10-19)

- Base de retomada: branch `feature/apps-script-engine-core`, HEAD
  `1aa958852c730a0cd1d06689c8fde3e6a5218831`, sincronizado com `origin` antes
  da edição; `.codex-local-evidence/` permaneceu intocado e não rastreado.
- O P2 do teste de preservação integral da RDE permanece corrigido e aprovado
  no commit `c45e756`; reexecução `node tests/apps-script-rde-core.test.js` —
  PASS. Esta retomada não reabriu sua revisão.
- Correção deste lote: coleção vazia de `EXISTS` e ausência de
  produto em `RESPONSIBILITY_HAS_TECHNICAL_PRODUCT` agora resulta em
  `MANUAL_REVIEW` com referência ao documento selecionado e motivo
  `DOCUMENT_INVENTORY_UNAVAILABLE`; não fabrica `DOCUMENT_ABSENCE` nem emite
  Nonconformity. Positivos permanecem inalterados.
- Regressões focadas: `node tests/apps-script-pilot-criterion.test.js` e
  `node tests/apps-script-documentary-correlation.test.js` — PASS. Os testes
  mantêm os casos antes negativos e verificam insuficiência, ausência de NC e
  ausência de referências fabricadas; o caso de composição `ALL` permanece
  coberto e agora exige revisão quando um membro não tem inventário.
- Primeira re-review Luna dirigida encontrou um P2: o caminho vazio de
  `RESPONSIBILITY_HAS_TECHNICAL_PRODUCT` preservava a referência selecionada,
  mas omitia sua proveniência/sourceDocument. Corrigido no trace de
  `documentaryEvidence.selectedDocument`; a regressão agora compara reference,
  sourceDocument e provenance exatos.
- Re-review Luna dirigida apenas a esse P2: `PASS`; finding encerrado, sem
  regressão imediata no shape do trace. O revisor não executou testes; os gates
  abaixo foram executados após a correção.
- Gates executados no candidate local: `python -m unittest discover -s tests
  -p 'test*.py'` — `143/143 PASS`; nove suítes Apps Script — PASS; `node
  --check` para todos `apps-script/*.js` e `tests/*.js`, sintaxe de
  `apps-script/Code.gs` e `git diff --check` — PASS. Regeneração duas vezes
  byte-identical; SHA-256 de `CompiledRuntimeContract.js`:
  `0551faa198e7d78526b9ed8a185c4f3ff04cefc264ff0e18f39358d5b30b3dc6`.
- Build de release em clone limpo do HEAD publicado `1aa958852c730a0cd1d06689c8fde3e6a5218831`
  — PASS, dez documentos e manifest íntegro. O builder recusa o worktree local
  sujo; portanto este resultado valida o checkpoint publicado, não promove o
  candidate local.
- `LUNA_TARGETED_RE_REVIEW=PASS` para o finding de proveniência. Isso encerra a
  revisão do candidate deste lote; a revisão Sol final da Fase 6 continua
  pendente e ainda não há promoção final da fase.
- Checkpoint do lote consolidado e publicado em
  `fe8b68ca4c525df0141f2dc37ddd13ba18f38f28`; `origin/feature/apps-script-engine-core`
  foi verificado no mesmo SHA. `.codex-local-evidence/` continua não rastreado
  e fora do commit.
- Reconcilei a cobertura candidate em `docs/FASE_6_INVENTARIO_COBERTURA.md`:
  `CRITERIA_ACTIVE=34`, `PRODUCTIVE=29`, `COVERED=2`, `PARTIAL=8`,
  `PENDING=27`. Quatro Criteria antes marcados integrais passam a parciais,
  pois sua rota negativa depende de inventário autenticado que ainda não existe;
  nenhum Criterion foi contado como ganho. Permanecem 19 Criteria sem suporte
  parcial, e os demais bloqueios da Fase 6 seguem abertos.

### Candidate contratual — prova de ausência documental (2026-10-19)

- O usuário decidiu que coleção ou vínculo ausente não prova ausência de DRT.
  O `00_engine.txt` também declara `DOCUMENT_ABSENCE` evidência válida, enquanto
  `08_execution_pipeline.txt` § Phase 2 exige estados `PRESENT`/`ABSENT`/
  `INCOMPLETE`/`UNVERIFIABLE` sem definir sua representação, teste de
  completude ou autenticação no Process Memory. O Documento 09-RDE não contém
  inventário documental completo. A divergência, portanto, permanece aberta
  quanto à representação e à prova de completude.
- Candidate local não altera a RDE: `00_engine.txt` 4.10 e
  `08_execution_pipeline.txt` 4.29 formalizam que `DOCUMENT_ABSENCE` só pode ser
  consumida quando ligada a inventário autenticado, completo e exato da
  apresentação/RDE. Até resolver a representação da Phase 2, coleção vazia,
  vínculo ausente ou lookup inconclusivo encaminha para `MANUAL_REVIEW`, sem
  `FALSE`/NC. `06_reports.txt` foi atualizado para refletir KB 5.27.0 e versão
  3.15.0; contrato compilado regenerado.
- Esse ajuste formaliza o comportamento fail-closed já implementado no commit
  `fe8b68c`; não cria uma fonte de inventário nem autoriza ausência automática.
  Ganho integral deste candidate: zero; cobertura continua 2/29, oito parciais,
  27 pendentes. A capacidade de provar ausência continua bloqueada até
  reconciliar `DOCUMENT_STATE` com um artefato completo/autenticado.
- O primeiro review Sol 6.1 encontrou P2: a redação atribuía
  `MANUAL_REVIEW` ao Requirement e podia obscurecer composição/precedência dos
  Criteria. A correção limita o estado não resolvido ao input documental e ao
  Criterion afetado, exige a lógica declarada, preserva composição e `FALSE`
  independente, mantém a normalização UNKNOWN→MANUAL_REVIEW existente e veda
  resultado agregado de Requirement. A seção equivalente de `00_engine.txt`
  recebeu a mesma delimitação.
- A re-review Luna estritamente dirigida à preservação da RDE encontrou uma
  lacuna P2 na asserção: status e proveniência eram comparados, mas o envelope
  inteiro não. O teste agora compara por JSON o envelope RDE completo de
  entrada e saída do parse/validate para ART, RRT e TRT. Re-review Luna dirigida
  `PASS`; teste `node tests/apps-script-rde-core.test.js` `PASS`.
- Re-review Sol 6.1 dirigida somente ao P2 contratual `PASS`; preservação da
  composição e precedência confirmadas; zero findings residuais nesse escopo.
  Revisões não executaram testes além do informado em cada re-review.
- Gates integrais no candidate: Python `144/144 PASS`; Apps Script `9/9 PASS`;
  `node --check` em todos os módulos/testes JS e `Code.gs` `PASS`; runtime
  regenerado duas vezes byte-identical, SHA-256
  `10d31381af23800e1156bcaf573813abc82103b2ee781910ed74cdd3c5263cd8`;
  manifests/guards cobertos pela suíte Python; `git diff --check` `PASS`.
  Release build em clone limpo do checkpoint `fc3fb760e5dc58a0fb9b381443d583c0938d2c99`
  `PASS`: dez documentos; parser canônico confirmou manifest `10/10`;
  `KNOWLEDGE_BASE_VERSION=5.27.0` e `SOURCE_COMMIT` igual ao SHA do checkpoint.
- Achados do lote: `0` abertos. Ganho integral deste candidate: zero; cobertura
  permanece 2/29, oito parciais, 27 pendentes. Segue bloqueada a representação
  autenticada de inventário completo e a prova operacional de ausência.

### Triagem do próximo lote após `fb42061` (2026-10-19)

- Antes de abrir outro lote de implementação, foram reavaliados os próximos
  candidatos de menor dependência no inventário. `T1_DRT_REGISTERED`/
  `T4_DRT_REGISTERED`: o vocabulário factual comum para ART, RRT e TRT está
  formalizado e os literais são preservados; a IRV descreve a condição
  semântica, mas não fornece mapeamento versionado dos textos de status por
  conselho/tipo/campo. Não converter status textual nem fixtures em
  `REGISTERED`; manter revisão humana.
- `T1_DRT_RI_LEGAL_ENTITY`, `T1_DRT_RT_NAME`, `T1_DRT_ADDRESS` e
  `T1_DRT_AREA`: `DRT` contém os comparandos do lado DRT, mas `ENTITY PROCESS`
  não declara fatos estruturados de RI/RT/endereço/área contra os quais
  comparar. Os Criteria e Requirements já declaram comparações, mas não há
  fato processual canônico a consumir. Nenhum comparando foi inventado.
- A dependência compartilhada de ausência permanece sem fonte de completude:
  Phase 2 enumera `PRESENT`/`ABSENT`/`INCOMPLETE`/`UNVERIFIABLE`; o envelope RDE
  0.7 tem `source.file_id` singular e não contém inventário completo nem
  estado de completude da extração; `CurrentSubmissionContextCore` autentica a
  identidade exata da apresentação e seleciona um comprovante, mas não atesta
  o conjunto completo de arquivos submetidos nem a cobertura da extração. Logo
  coleção vazia, falta de associação e falta de registro continuam
  insuficientes para concluir `ABSENT`.
- Próximo desbloqueio compartilhado recomendado: formalizar a origem confiável
  e a representação do inventário completo da apresentação, com identidade de
  cada arquivo, digest, declaração de enumeração completa e cobertura de
  extração, todos ligados à identidade exata da apresentação e ao digest da
  RDE. Item não implementado nesta triagem: a interface de intake que atestaria
  completude ainda não está identificada no contrato operacional e não deve
  ser simulada com fixtures.
- A ficha histórica “Blocker factual/técnico identificado — `T4_IN09_DRT`” que
  sugeria mapear um token literal de RT-005 está supersedida pela decisão do
  usuário: o sistema não verifica compatibilidade atividade↔SMSCI para
  RT-005/006/014. Não buscar nem criar esse mapeamento. O Requirement atual
  ainda declara validators globais e o Criterion associa `VISTORIA_ENSAIO` a
  pressurização; o caminho permanece em revisão humana até reconciliar a
  execução e NC_T4_004 sem automatizar a compatibilidade nem suprimir a
  consequência de ausência comprovada.
- Resultado da triagem: zero Criteria ganhos; nenhuma alteração de Requirement,
  Criterion ou Nonconformity. A cobertura permanece `2/29` integral, `8`
  parciais e `27` pendentes. Esta dependência afeta especialmente as rotas
  negativas dos oito parciais; não encerra os demais blockers de fatos,
  assinatura, comparandos, produtos ou mapeamentos de status.
- Busca dirigida de fontes primárias oficiais para o próximo lote de status:
  a Resolução Confea nº 1.137/2023 trata registro, baixa, cancelamento e
  anulação da ART; a Resolução CAU/BR nº 91/2014 distingue requerimento de RRT
  de documento final condicionado a pagamento/deferimento; o manual CFT de
  geração de TRT (2018) lista estados próprios do sistema TRT, incluindo
  validação, pagamento, aprovação, validade, bloqueio e baixa. Esses textos
  não fornecem um mapa literal comum nem, por si, uma versão operacional atual
  para `REGISTERED`. Não foi criado mapa por analogia. Referências consultadas:
  [Confea, Resolução nº 1.137/2023](https://normativos.confea.org.br/Ementas/Visualizar?id=76099),
  [CAU/BR, Resolução nº 91/2014](https://transparencia.caubr.gov.br/resolucao91/),
  [CFT, Manual de Geração de TRT v1.2](https://www.cft.org.br/wp-content/uploads/2018/10/MANUAL-DE-GERACAO-DE-TRT-v1_2.pdf).

### Retomada dirigida — P2 da preservação integral da RDE (2026-10-19)

- Estado inicial preservado: branch `feature/apps-script-engine-core`, HEAD
  `a839af50cea797a5d5b909358c2b883ceaf0c9ec`, sincronizado com `origin`;
  alterações locais de documentação mantidas e `.codex-local-evidence/`
  preservado fora do Git.
- A correção do P2 já está no histórico do HEAD (`c45e756`): o teste compara
  por JSON o envelope RDE completo antes/depois de
  `parseAndValidateOperationalRdeJson_` para ART, RRT e TRT. O teste focal foi
  executado nesta retomada — `node tests/apps-script-rde-core.test.js` — PASS.
- Re-review independente, somente leitura e limitada ao finding P2, pelo
  agente Schrodinger: `PASS`, zero findings. O revisor confirmou os três casos
  e a comparação do envelope completo em
  `tests/apps-script-rde-core.test.js:857-890`, e a implementação de
  parse/validação que devolve a RDE congelada em
  `apps-script/RdeCore.js:1485-1503`. A criação de Luna retornou limite de
  threads; portanto a re-review específica de Luna fica `PENDING`, sem atribuir
  a ela ou a Sol 6.1 o PASS de Schrodinger. Nenhuma revisão geral foi reaberta
  e não houve tentativas repetidas de criação de revisor.
- Gates no candidato local, que contém apenas documentação além do HEAD
  publicado: Python `144/144 PASS`; suítes Apps Script `9/9 PASS`; `node
  --check` em todos os módulos/testes JS e `Code.gs` PASS; regeneração do
  runtime PASS e byte-idêntica, SHA-256
  `10d31381af23800e1156bcaf573813abc82103b2ee781910ed74cdd3c5263cd8` antes e
  depois; `git diff --check` PASS. Build de release do novo SHA publicado será
  registrado após o commit.
- A reauditoria focal de `T1_DRT_REQUIRED` corrigiu o inventário: multiplicidade
  não é blocker, pois o Criterion é existencial e o binder/trace preserva todas
  as DRTs explicitamente classificadas como RT-002. O único blocker residual
  para cobertura integral é prova autenticada de ausência/inventário completo;
  cobertura continua sem ganho. Atualizados o inventário e a matriz de
  dependências, sem alterar código ou semântica normativa.
- `.codex-local-evidence/` permaneceu não rastreado e fora do commit. As duas
  atualizações de documentação foram publicadas em `f2e247c38974b374634845066afa27ef67df5f99`.
  Release build em worktree limpa desse SHA: `PASS`; dez arquivos e manifest
  `10/10`, KB `5.27.0`, `SOURCE_COMMIT` exato. A branch local/remota foi
  conferida sincronizada nesse checkpoint.

### Onda D — fixture mista de atividade RT-002 para ART/RRT/TRT (2026-10-19)

- Base: HEAD `53d2766f84c0c2be342ab7cce96fc950c177d3f7`, branch sincronizada;
  `.codex-local-evidence/` preservado. Alteração restrita ao teste de
  `T1_DRT_ACTIVITY_EXECUTION`; nenhum executor, contrato normativo, Requirement,
  Criterion ou Nonconformity foi alterado.
- Fixture coerente usa ART, RRT e TRT com `RESPONSIBILITY_TYPE=EXECUCAO` e
  atividade exata `EXECUÇÃO` em cada documento. Confirma `TRUE/PASS`, os três
  bindings e referências, tipo de cada DRT, source document, provenance do item
  e provenance do documento. A regressão insuficiente omite o item de atividade
  somente do TRT e confirma `MANUAL_REVIEW`, trace dos três documentos e ausência
  de FAIL/Nonconformity.
- Resultado independente: Luna, re-review limitada ao teste, `PASS`; recomendou
  verificar explicitamente `sourceProvenance` e `memoryReferences`. As duas
  asserções foram incluídas e re-review dirigida confirmou encerramento (`PASS`).
  Nenhuma revisão arquitetural Sol foi necessária para essa alteração de teste;
  aprovação final Sol 6.1 da Fase 6 continua pendente.
- Teste focal `node tests/apps-script-responsibility-evidence.test.js` — PASS.
  Gates consolidados: Python `144/144`; Apps Script `9/9`; sintaxe de todos os
  módulos/testes JS e `Code.gs` PASS; runtime regenerado duas vezes byte-idêntico
  com SHA-256 `10d31381af23800e1156bcaf573813abc82103b2ee781910ed74cdd3c5263cd8`;
  `git diff --check` PASS. Release build limpo do commit
  `01faeaf9091d0e2e32fb56a1dfd4a7c820d362b4` PASS: 10 documentos, manifest
  `10/10`, KB `5.27.0`, `SOURCE_COMMIT` exato. Phase guards foram exercitados
  pela suíte Python. O teste não altera código/runtime.
- Ganho de Criteria integrais: `2/29 → 2/29`; parciais: `8 → 8`; pendentes
  integrais: `19 → 19`. Blockers encerrados: `0`; novos: `0`. Benefício
  verificável: cobre a execução positiva e a insuficiência para os três tipos
  de DRT no caminho RT-002, preservando rastreabilidade e incerteza. A cobertura
  integral continua dependente de completude autenticada da extração; atividade
  omitida não prova que a DRT não a declare. Esforço automatizado foi inferior
  a um minuto de execução; uma revisão e uma re-review dirigidas, sem revisão
  geral.

### Diagnóstico do intake para prova de inventário completo (2026-10-19)

- No HEAD `846a531564e30d0600b01c257b71e5d920eaabc8`, `scanInputFolder()` em
  `apps-script/Code.gs:288-377` enumera arquivos da pasta `00_ENTRADA`, cria
  `PROCESS_ID` a partir do `fileId` e registra cada arquivo como uma linha e um
  processo individual. O registro contém um único `SOURCE_FILE_ID`; não agrupa
  anexos por protocolo nem emite declaração de fechamento do conjunto ou de
  cobertura completa da extração. A indexação subsequente move esse arquivo
  para a pasta associada ao seu próprio processo.
- Portanto, a enumeração atual da pasta, a ausência de binding na RDE e a linha
  individual do registro não provam que todos os documentos daquele processo
  institucional foram recebidos ou extraídos. Não usar esse snapshot como
  `DOCUMENT_ABSENCE` nem implementar consequência negativa com base nele.
- A decisão/fonte ainda pendente é qual artefato confiável poderá atestar a
  completude do conjunto e da extração: manifesto autenticado de intake; estado
  explícito emitido pelo sistema institucional; ou nenhuma fonte disponível,
  mantendo ausência em revisão humana. Não houve resposta à consulta; nenhum
  desses cenários foi assumido e nenhum processo institucional real foi
  acessado.
- Sem mudança de código ou de cobertura. O registro estreita o blocker
  compartilhado para os Criteria cuja rota negativa exige ausência comprovada;
  o restante da Fase 6 segue em trabalho independente onde houver contrato e
  fato suficientes.

### Triagem independente Luna — menor Criterion integral disponível (2026-10-19)

- Luna (`luna_economy`) examinou somente a matriz produtiva e os contratos
  apontados no HEAD `846a531`; conclusão: nenhum Criterion restante pode ser
  integralmente concluído sem novo fato documental, semântica/decisão humana,
  calibração ou integração externa. Isso confirma os blockers da matriz, mas não
  é revisão de código nem aprovação Sol.
- O candidato superficial `T4_IN09_CHECKLIST` também exige
  `TECHNICAL_PRODUCT_ATTRIBUTE(..., SIGNED)`; `SIGNATURE_MECHANISM` textual não
  autentica assinatura, então o Engine encaminha para `MANUAL_REVIEW`. Registro
  e `DRT_COVERS` têm igualmente dependências factuais/semânticas versionadas.
- Resultado: nenhuma implementação autorizada que aumente Criteria integrais
  foi identificada nessa matriz; não se introduziu camada preparatória. A
  análise foi read-only. A Onda D continua aberta à resposta do usuário sobre a
  fonte de inventário e às dependências específicas já enumeradas.
- O registro de intake/Luna foi publicado no commit
  `3d738dae7f8eba6bf78a6891d9489b5c0328245f`; release build em worktree limpa
  desse SHA `PASS`, dez arquivos, manifest `10/10`, KB `5.27.0` e
  `SOURCE_COMMIT` exato. Branch local/remota sincronizada; evidência local
  continua fora do Git.

### Decisão C e cobertura de ausência não comprovada (2026-10-19)

- Decisão do usuário: não há fonte confiável disponível para atestar inventário
  documental completo do processo nem cobertura completa da EXTRACTION. Casos
  sem documento/vínculo/declaração esperada permanecem `MANUAL_REVIEW`; não são
  convertidos em `DOCUMENT_ABSENCE`, `FALSE`, FAIL ou Nonconformity.
- Essa decisão elimina o requisito de emitir resultado negativo nos sete
  Criteria cujo único blocker residual era a prova de ausência: `T1_DRT_REQUIRED`,
  `T1_DRT_ACTIVITY_EXECUTION`, `T1_DRT_SMSCI_COVERAGE`, `T4_IN08_MANUAL`,
  `T4_IN09_MANUAL`, `T4_IN19_EXECUTION` e `T4_IN19_GROUNDING`. Evidência positiva
  explícita continua rastreada e pode produzir TRUE; incerteza permanece revisão
  humana. `T1_CONFORMITY_REPORT` continua parcial, pois a correlação inferida
  não pode ser admitida sem calibração empírica válida.
- Os dois Criteria de DRT da IN19 agora têm fixtures positivas e insuficientes:
  item IEL + DRT tipada com proveniência preservada dá `TRUE/PASS`; sem DRT,
  mesmo com IEL em applicability, dá `MANUAL_REVIEW`, traceia documento atual e
  não emite NC. O teste de readiness comprova planejamento/materialização das
  unidades; não executa o Engine. Tests separados cobrem resultado, trace e
  provenance. Outros cinco Criteria liberados já tinham execução/insuficiência
  testadas; readiness comprova seleção/materialização quando aplicável.
- Re-review independente inicial: `FAIL`, um P1 de consistência entre a nova
  matriz e uma frase de snapshot histórico, e dois P2 de prova de provenance e
  delimitação do readiness. Os P2 foram corrigidos e re-revistos; o P1 foi
  rotulado inequivocamente como histórico. Re-review final estritamente dirigida
  ao achado residual: `PASS`, finding encerrado. Revisor independente Socrates,
  leitura somente; não é registrado como Luna nem Sol. Testes dirigidos: pilot
  criterion, readiness, responsibility evidence e RDE core — PASS. Nenhuma
  revisão arquitetural foi reaberta.
- Cobertura real reconciliada: `CRITERIA_ACTIVE=34`, `PRODUCTIVE=29`,
  `COVERED=9` (antes 2), `PARTIAL=1` (antes 8), `PENDING=20` (antes 27),
  `WITHDRAWN=2`, não selecionáveis=5.
  O ganho foi `2/29 → 9/29`, sete Criteria integrais após decisão humana de
  tratamento da incerteza, sem novas regras normativas nem emissão de
  Nonconformity por ausência. Gates completos, commit/push e release build deste
  candidate completos: Python 144/144; Apps Script 9/9; `node --check` em todos
  JS e sintaxe `Code.gs`; `git diff --check`; regeneração dupla byte-idêntica,
  SHA-256 `10d31381af23800e1156bcaf573813abc82103b2ee781910ed74cdd3c5263cd8`.
  Manifests/phase guards passaram pela suíte Python. Commit funcional/documental
  `fb881455483ac352ad4dd3a73e09a267bca2bf31` foi enviado por fast-forward.
  Release build em worktree limpa desse SHA: `PASS`, 10 documentos, manifest
  `10/10`, KB `5.27.0`, `SOURCE_COMMIT` exato. O artefato foi construído do
  commit candidato que contém todas as alterações funcionais; o checkpoint
  subsequente deste tracker é somente documental.

### Onda D — DRT de verificação final elétrica IN 19 (candidate local 2026-10-19)

- O contrato de `T4_IN19_FINAL_VERIFICATION` já exigia `LOW_VOLTAGE_FINAL_VERIFICATION_DRT`
  e validava `RESPONSIBILITY_ACTIVITY_COMPATIBLE`; a fonte oficial mapeia essa
  verificação final de instalação elétrica de baixa tensão à RT-007. A mudança
  delimita a atividade literal a esse Requirement IN19 e preserva fora desse
  mapping CMAR e checklist IN 09.
- Implementado binding tipado, autenticado ao plano/contexto/apresentação atual,
  RDE e documento ART/RRT/TRT exatos; atividade, documento, proveniência e
  evidências constam no trace. Declaração positiva exata produz TRUE/PASS;
  item ausente ou atividade não correspondente resulta MANUAL_REVIEW, sem
  Nonconformity. Sem fato inventado ou regra de competência profissional.
- Readiness agora reconhece somente o unit/Requirement/RT-007 canônico. A fixture
  IEL comprova planejamento e materialização; os testes separados exercitam
  execução positiva, atividade ausente e literal diferente. Houve ganho
  operacional verificável: a unidade antes não era materializável e agora pode
  ser executada quando a RDE validada contém o vínculo explícito.
- Cobertura provisória do candidate: `CRITERIA_COVERED=10/29` (ganho +1),
  `PARTIAL=1`, `PENDING=19`; nenhum blocker normativo novo. O benefício não
  comprova correspondência normativa além da literal documental formalizada.
- Gates consolidados: Python `144/144`; Apps Script `9/9`; sintaxe de todos os
  módulos JS/testes e `Code.gs`; runtime regenerado duas vezes byte-idêntico,
  SHA-256 `c89480ab54b030996c7678bf72ef94b45ad3ddfd4ac83de10e872cec21952aa0`;
  `git diff --check` PASS. Testes de manifest/versões passaram dentro da suíte
  Python. Nenhum script de phase guard separado existe neste checkout.
- Revisão arquitetural independente inicial (GPT-6, somente leitura) apontou
  um P2: provenance ausente lançava exceção ao congelar o trace. Correção e
  regressões dirigidas para provenance ausente do registro e do documento ART
  foram re-revistos pelo GPT-6: `PASS`, P2 fechado; casos insuficientes resultam
  `MANUAL_REVIEW`/sem NC e o caso completo permanece `TRUE/PASS`. Revisão Sol
  6.1 final da Fase 6 permanece pendente; este parecer não é registrado como Sol.
  A revisão intermediária Luna (`luna_economy`) do mesmo slice foi `PASS`, sem
  achados; foi inspeção somente leitura e não executou testes. A suíte completa
  abaixo foi executada pelo orquestrador após o P2.
  Após a re-review, os gates completos passaram: Python 144/144; Apps Script
  9/9; sintaxe todos JS/testes e `Code.gs`; runtime duplamente regenerado e
  byte-idêntico, SHA-256 `c89480ab54b030996c7678bf72ef94b45ad3ddfd4ac83de10e872cec21952aa0`;
  `git diff --check` PASS; validadores de manifest/versão PASS. O commit
  `295a144cc8c765a5eb9b24aedc3eac7e94a7b0bd` foi enviado por fast-forward.
  Release build limpo desse SHA: PASS, dez documentos, manifest 10/10, KB
  `5.28.0`, `SOURCE_COMMIT` exato. Não há script de phase guard separado neste
  checkout. A pasta `.codex-local-evidence/` foi preservada e não faz parte das
  alterações rastreadas.

### Retomada após o checkpoint `a34b05c` — integração oficial de conselhos

- Estado local/remoto reconciliado em `a34b05c61a25621467afe120d0c9ca09dbe42ad0`;
  branch `feature/apps-script-engine-core`; apenas `.codex-local-evidence/`
  permanece não rastreada e foi preservada.
- A resposta do usuário `C` foi interpretada como escolha de integração oficial
  com os conselhos para validação de ART/RRT/TRT. Pesquisa read-only em fontes
  oficiais localizou: (a) Confea Resolução 1.137/2023 e notícia de atualização
  aprovada em 2025; (b) Resolução CAU/BR 91/2014, com alterações, distinguindo
  rascunho de documento final/definitivo e relacionando a efetivação do RRT à
  validação do pagamento; (c) páginas públicas CAU e CFT de verificação de
  autenticidade de RRT/TRT. Não foi localizada especificação pública de API
  autenticada, comum e versionada para consultas operacionais ART/RRT/TRT.
  Fontes: https://normativos.confea.org.br/Ementas/Visualizar?id=76099 ;
  https://www.confea.org.br/confea-atualiza-regras-de-art-e-acervo-tecnico-e-moderniza-o-sistema ;
  https://transparencia.caubr.gov.br/resolucao91/ ;
  https://transparencia.caubr.gov.br/perguntas-frequentes-registro-de-responsabilidade-tecnica-rrt/ ;
  https://cft.org.br/servicos/ .
- Consequência operacional: a opção C não permite implementar consulta real
  sem contrato/API oficial e credenciais autorizadas. Os dados status FACT-ONLY
  existentes não serão convertidos em confirmação autenticada; `T1_DRT_REGISTERED`
  e `T4_DRT_REGISTERED` continuam `MANUAL_REVIEW` quando insuficientes.
- Reavaliação de `T4_IN09_DRT`: a IRV 2024, Tabela 4, p. 7, exige DRT de
  execução e DRT de vistoria/ensaio; a Base atual representa as duas com
  `HAS_DRT_ACTIVITY` para o SMSCI e `RESPONSIBILITY_ACTIVITY_COMPATIBLE`.
  A instrução do usuário proíbe essa conferência de correspondência. RT-005 no
  Anexo A descreve vistoria/inspeção, mas não possui `DRT_RESPONSIBILITY_TYPE`
  nem `MACHINE_COMPATIBLE_ACTIVITY_LITERALS`; sua separação da RT-006 também
  não está integralmente individualizada pela norma. Sem relação por nome ou
  atividade↔SMSCI, não há binding factual para atribuir uma DRT específica a
  RT-005. `NC_T4_004` permanece na Base; ausência de DRT não demonstrável não
  pode produzi-la. Criterion permanece pendente, sem ajuste artificial de
  cobertura.
- Reconciliado com a matriz mais recente: 34 Criteria ativos, 29 produtivos,
  10 integralmente cobertos, 1 parcial (`T1_CONFORMITY_REPORT`) e 19 ainda sem
  cobertura integral; desses, 18 estão sem suporte integral e 1 parcial.
  Cinco não selecionáveis e dois retirados permanecem fora dos 29 produtivos.
  Nenhum Criterion adicional foi encontrado integralmente implementável só
  com os contratos/fatos atuais nesta checagem dirigida. O ganho funcional
  deste intervalo é zero; não houve alteração de código nem revisão geral.
- Estado de governança inalterado: `CALIBRATION_GATE=BLOCKED`,
  `NORMATIVE_INSTITUTIONAL_VALIDATION=PENDING`,
  `VALIDATED_TO_ANALYZED=PENDING`, revisão final Sol 6.1 da Fase 6 `PENDING`.
  Próximo avanço funcional requer contrato oficial utilizável de consulta dos
  conselhos ou formalização factual autorizada que identifique DRT-RT-005 sem
  avaliar compatibilidade atividade↔SMSCI. Em paralelo, seguem abertos os
  Criteria com evidências verificáveis ainda ausentes na matriz de cobertura.

### Triagem independente de produtividade no HEAD `d664b1d` (2026-10-19)

- Luna (`luna_economy`), inspeção somente leitura e sem execução de testes,
  confirmou no checkout `d664b1d34654103aa7ac06f788e47ca82f5138b0` que nenhum
  dos 18 Criteria sem suporte integral pode ser fechado integralmente apenas
  com os contratos e fatos atuais. A contagem foi conferida: 34 ativos,
  29 produtivos, 10 integrais, 1 parcial e 19 sem cobertura integral.
- Blockers compartilhados confirmados: os 12 `SOURCE_DEFINED_NEEDS_FORMALIZATION`
  dependem de resultados tipados/comparandos/vínculos ainda ausentes; os 6
  `MISSING_EVIDENCE_CONTRACT` dependem de `DRT_COVERS`, conteúdo estruturado,
  datas ou independência. A readiness atual rejeita as combinações não
  suportadas de `DRT_COVERS`, `VALID_WITHIN_YEARS` e `REPORT_CONTAINS`.
- O menor bloqueio aparente, `T1_DRT_REGISTERED` e `T4_DRT_REGISTERED`, ainda
  exige mapeamento versionado por modalidade/conselho. Nenhum Criterion foi
  artificialmente promovido. Ganho de cobertura: zero; testes executados pelo
  revisor: nenhum; mudança de código: nenhuma.
- Este parecer é somente a triagem intermediária Luna. Não é revisão Sol 6.1,
  não substitui os gates integrais de um lote funcional e não altera
  `SOL_REVIEW=PENDING` nem `FASE_6_STATUS=PARTIAL`.

### Dependência compartilhada confirmada — assinatura documental verificável

- O contrato canônico `knowledge-base/00_engine.txt` define os mecanismos
  aceitos por `SIGNED` (ICP-Brasil, PAdES, assinatura eletrônica de CREA/CAU/CFT
  ou outro mecanismo digital explicitamente identificado). Resultado positivo
  exige assinatura documentalmente verificável; sem essa prova, o resultado é
  `MANUAL_REVIEW`, e sua ausência isolada não produz `FALSE`.
- `SIGNATURE_MECHANISM` na RDE e nas entidades é texto FACT-ONLY; não atesta
  validade criptográfica, autenticidade ou identidade do signatário. O Engine
  respeita essa fronteira e devolve `MANUAL_REVIEW` mesmo quando o texto nomeia
  ICP-Brasil/PAdES. Não há hoje evidência tipada de verificação emitida por
  componente confiável e vinculada ao digest exato do documento.
- Critérios afetados: `T1_DRT_SIGNED`, `T4_DRT_SIGNED`,
  `T1_CONFORMITY_REPORT_SIGNED`, `T4_IN09_CHECKLIST` e `T4_IN18_CMAR`.
  Não foi criado um fato `VERIFIED` que pudesse ser preenchido por EXTRACTION
  probabilística ou aceito sem validação criptográfica/consulta oficial.
- Para desbloquear esse grupo é necessário disponibilizar um verificador
  determinístico confiável de assinatura com integração ao pipeline e prova
  vinculada ao conteúdo/documento exato, ou uma interface/recibo oficial
  equivalente de cada emissor. A formalização de interface autenticada deve
  passar por revisão Sol antes de ser consolidada; validação institucional
  permanece independente e pendente.
- Não houve alteração de código, Base ou gates nesta checagem. O bloqueio
  confirma a dependência externa já observada nas rodadas anteriores; os 18
  Criteria sem suporte integral não têm incremento funcional seguro sem
  evidências/fatos novos ou contratos adicionais autorizados.

## Decisão arquitetural — divisão gerencial da Fase 6 e verificação local de assinaturas (2026-10-19)

Estado inicial reconciliado: branch `feature/apps-script-engine-core`, HEAD e
upstream `b999a1cc18afcf469db25e9fba8724e2ca490b84`; worktree rastreada limpa.
`.codex-local-evidence/` permanece não rastreada e preservada. A decisão do
usuário autoriza APIs externas como não obrigatórias e estabelece verificação
híbrida local/humana, sem alterar a RDE.

### Gate gerencial aprovado

| Gate | Escopo | Condição de encerramento | Estado neste candidate |
|---|---|---|---|
| Fase 6A — núcleo e contratos | Engine determinístico, Criteria já suportados, predicates/resolvers, RDE/ImmutableExecutionView, evidência tipada, interfaces de verificação, integridade, proveniência, insuficiências, testes e trace | Escopo implementado, testado e aprovado independentemente. Os 29 Criteria produtivos não são requisito isolado; capacidade preparatória não conta como cobertura; não promove operação | `COMPLETE` no checkpoint registrado abaixo |
| Fase 6B — integrações e evidências | Verificação local, confirmação humana auditável, comparandos, vínculos autorizados, fatos de ausência, consumo pelo Engine, Criteria restantes e testes integrados; calibração quando empiricamente válida | Evidências representativas, gates e aprovação final independentes; APIs externas não são pré-requisito | `IN_PROGRESS` |

Os nomes gerenciais 6A/6B não renumeram fases do pipeline. `PHASE 6A` em
`08_execution_pipeline.txt` permanece a projeção operacional IRV após
consolidação de resultados.

### Assinaturas — contrato candidato para revisão Sol 6.1

- Recibo de verificação é artefato separado, autenticado, imutável e ligado à
  identidade da apresentação, identidade/digest da RDE e documento/digest dos
  bytes exatos. Não escreve nem altera fatos da RDE.
- Saídas separadas para integridade do byte range e assinatura, identidade do
  signatário, cadeia/confiança, revogação e validação global. “Íntegra” não
  significa “integralmente validada”; revogação sem evidência fica UNKNOWN.
  Imagem, carimbo, QR Code ou texto não são prova criptográfica.
- Evidência ausente/inconclusiva encaminha a MANUAL_REVIEW conforme Criterion.
  Digest incompatível, recibo adulterado ou replay bloqueia admissão automática
  e gera diagnóstico de integridade, sem PASS/FAIL/Nonconformity automático.
- Confirmação humana é recibo independente autenticado e imutável com documento
  e hash, responsável, data, método, evidências e decisão; não atesta validade
  criptográfica. Engine só o consome sob perfil de autoridade expresso e
  aprovado; sem perfil, mantém MANUAL_REVIEW.
- Apps Script nativo oferece digest e funções de geração de assinatura, mas o
  V8 não fornece `crypto`/`SubtleCrypto` nem verificação nativa CMS/PAdES/X.509.
  Assim, GAS nativo isolado não fecha a validação completa; um verificador
  local controlado pelo projeto só poderá admitir o nível validado por provas
  reproduzíveis. `EXTERNAL_API_DEPENDENCY=NONE_REQUIRED`.
- A fonte IRV Habite-se 2024, Anexo A, Tabela 1, requer identificar assinatura
  digital do RT ou certificação digital do conselho emissor. O art. 57 da DTZ
  26 localizado no PDF do repositório trata do encaminhamento de denúncias à
  ouvidoria; não o registramos como fundamento textual da verificação de
  assinatura. A decisão arquitetural do usuário e a IRV sustentam o contrato.

### Reconciliação de cobertura preservada

No último snapshot de cobertura compilado: 34 Criteria ativos, 29 produtivos,
10 integralmente cobertos, 1 parcial (`T1_CONFORMITY_REPORT`), 18 sem suporte
integral, 5 não selecionáveis e 2 retirados. Logo, pendentes para cobertura
integral = 19 (18 sem suporte + 1 parcial). Nenhum indicador é promovido por
esta alteração contratual. Calibração continua `BLOCKED`;
`NORMATIVE_INSTITUTIONAL_VALIDATION=PENDING` e
`VALIDATED_TO_ANALYZED=PENDING`.

### Revisão e checkpoints

O diff desta decisão está preparado para revisão arquitetural independente
Sol 6.1 antes da consolidação. Nenhuma revisão ou aprovação Sol está
contabilizada ainda. Gates de runtime, suíte completa e release build serão
executados no candidate consolidado depois da revisão e das correções.

### Ciclo de revisão dirigido — findings e disponibilidade

- Revisão inicial por subagente solicitado como `gpt-6.1-sol` retornou
  `FAIL`, mas o próprio relatório se identificou como GPT-6; não é contabilizado
  como Sol. Findings: (1) extração e consumo do recibo misturados; (2) perfil,
  papel do signatário e binding ao contrato/plano/view insuficientes; (3)
  rodapé ainda em KB 5.28.0. Os três foram corrigidos neste candidate.
- O pedido de re-review dirigida a `chatgpt-web/gpt-5.6-sol` falhou antes de
  iniciar com `Selected model is at capacity`. Resultado: `SOL_REVIEW=PENDING`,
  sem aprovação e sem consolidação.
- Regressões direcionadas adicionadas para separar PHASE 2/2A/5, verificar
  chaves/política/binding e garantir recibos humanos apenas como contexto
  até existir autoridade aprovada. `python -m unittest
  tests.test_knowledge_base_identity -v`: 19/19 PASS; suíte Python completa:
  147/147 PASS. Nove suítes Apps Script PASS; sintaxe de todos os módulos JS
  e `apps-script/Code.gs` PASS; runtime regenerado duas vezes byte-identical;
  `git diff --check` PASS.
- POC local autocontido sem rede: OpenSSL verificou CMS detached contra
  certificado local explicitamente fornecido e rejeitou conteúdo adulterado.
  Isso não verifica PDF ByteRange/PAdES, cadeia de confiança real, conselho,
  revogação nem o runtime Apps Script; não promove Criteria.
- `CompiledRuntimeContract.js` regenerado das fontes, SHA-256
  `b4216bc661a79e1e84ca45bd363f0f567303638e5647e240645582e6d7be1a49`;
  sintaxe Node PASS. Sol Web não iniciou a re-review por limite de capacidade;
  `SOL_REVIEW=PENDING`. Os três findings foram corrigidos no candidate, mas
  permanecem abertos para confirmação independente (`FINDINGS_OPEN=3`). Não
  houve commit, push, consolidação, deploy ou alteração de cobertura. O release
  build real permanece pendente: o builder exige worktree limpa e a aprovação
  Sol é requisito prévio à consolidação/commit; não foi criado commit
  temporário para contornar esse gate.

### Revisão intermediária independente Luna — 2026-10-19

Luna (`luna_economy`) revisou somente leitura o diff completo local e retornou
`PASS`, sem findings. Confirmou sequência EXTRACTION → recibo PHASE 2A → binding
após congelar contract/plan/view → consumo restrito ao SIGNED na PHASE 5;
identidade/digest de apresentação, RDE, documento e contexto de execução;
perfil autenticado e papel RT/conselho; recibo humano sem PASS; alinhamento de
versões; cobertura inalterada 10 integral/1 parcial/19 pendentes; e precisão da
nota DTZ/IRV. Luna não executou testes e este parecer não é revisão Sol. Os
gates locais já registrados passaram; esforço aproximado desta revisão: 1
leitura dirigida, 0 testes adicionais. `SOL_REVIEW=PENDING`, findings materiais
seguem à espera de validação Sol, sem commit/push.

### Triagem funcional independente do checkpoint — RT-002/IN 09

A matriz atual confirma `T1_DRT_ACTIVITY_EXECUTION` já integralmente coberto
entre os dez Criteria; não foi reimplementado nem contado como ganho. A
releitura de `T4_IN09_DRT` confirma que o Criterion declara duas validações
`RESPONSIBILITY_ACTIVITY_COMPATIBLE` e requer escopos RT-003 e RT-005. O Anexo A
descreve vistoria/inspeção e indica que a individualização RT-005/RT-006 é
interna e não integralmente definida pela fonte. Executar a segunda validação
ou ligar a atividade ao SMSCI inferiria justamente a compatibilidade que o
usuário excluiu; executar só a primeira não cobre o Criterion ALL nem autoriza
o FAIL/NC declarado. Resultado: `COVERAGE_GAIN=0`; `T4_IN09_DRT` segue para
revisão humana, sem alteração de código, Requirement ou Nonconformity.

### POC local de assinatura PDF — 2026-10-19

- Inventário local: Poppler `pdfsig 24.02.0`, OpenSSL e Python `cryptography`
  estão disponíveis; `pyHanko`, `pypdf`, `PyPDF2`, `pikepdf`, `fitz` e
  `asn1crypto` não estão instalados. Os quatro PDFs normativos presentes em
  `references/` não contêm assinaturas incorporadas.
- Adicionado `tools/poc_pdf_signature_byte_range.py`, ferramenta opt-in e
  independente do runtime. Ela cria em diretório temporário uma chave e
  certificado autossinados, um PDF com assinatura CMS detached sobre os bytes
  declarados em ByteRange e uma cópia com byte assinado adulterado. Não usa
  rede, dados de processo nem APIs de terceiros.
- Execução com Poppler/OpenSSL locais: `PASS` para integridade CMS/ByteRange do
  fixture; o verificador declara o emissor do certificado como não confiável;
  a cópia alterada resulta em `Digest Mismatch`. `py_compile` e
  `git diff --check`: `PASS`.
- Alcance: prova que um verificador local pode separar integridade da
  assinatura da confiança do certificado e detectar alteração do conteúdo.
  Não prova conformidade PAdES, confiança institucional, identidade de
  conselho/RT, revogação, política de certificado nem capacidade equivalente
  no Apps Script. Não cria recibo de produção, não altera RDE e não promove
  SIGNED ou qualquer Criterion.
- Ganho de cobertura integral: `0`; critérios parcialmente afetados: nenhum;
  bloqueadores encerrados: nenhum; novos bloqueadores: nenhum. Dependência
  técnica delimitada: escolher/integrar verificador local controlado pelo
  projeto e validar níveis de confiança com fixtures adequadas. Nenhuma API
  externa de conselho é requerida. Esforço desta prova: aproximadamente 20
  minutos; testes: uma execução funcional com fixture positiva e adulterada,
  mais compilação sintática e verificação de diff; revisão técnica dirigida
  deste lote ainda pendente.
- Governança inalterada: Fase 6A aguarda aprovação independente do pacote de
  contratos; Fase 6B permanece pendente. A revisão final Sol 6.1 continua
  `PENDING` (capacidade do modelo indisponível nas tentativas registradas);
  não há commit, push, promoção operacional ou novo ganho de Criteria.

### Revisão e gates do POC — 2026-10-19

- Luna independente (`luna_economy`) revisou somente leitura o script e este
  registro: `PASS`, sem achados acionáveis. Registrou que a ausência de rede é
  comprovada pela inspeção das chamadas locais fixas; o script não cria uma
  sandbox de rede própria. Não identificou exagero das capacidades. Esforço:
  uma revisão dirigida, sem alterações posteriores no código revisado.
- Suíte Python completa: 147/147 `PASS`; guard de execução/pipeline:
  17/17 `PASS`; suítes Apps Script: 9/9 `PASS`; `node --check` em todos os
  módulos `apps-script/*.js` e `Code.gs`: `PASS`.
- Regeneração por `tools/build_knowledge_base_release.py
  --write-runtime-contract`: byte-identical, SHA-256
  `b4216bc661a79e1e84ca45bd363f0f567303638e5647e240645582e6d7be1a49`;
  manifest Apps Script parseável; `git diff --check`: `PASS`.
- O release build promocional não foi executado porque depende de worktree
  limpa/consolidação e a revisão Sol 6.1 ainda está pendente. Não se usou
  commit temporário para contornar a ordem de governança.

### Viabilidade documentada do runtime Apps Script para verificação local

Consulta às referências oficiais do Google em 2026-10-19: o V8 do Apps Script
não disponibiliza `crypto` nem `SubtleCrypto`, enquanto `Utilities` documenta
digest, HMAC e geração de assinatura RSA. A documentação do V8 também lista
WebAssembly como exceção disponível. Portanto, verificação CMS/PAdES puramente
JavaScript não é fornecida nativamente; um módulo WASM empacotado e controlado
no projeto é uma possibilidade técnica a prototipar, não capacidade já
demonstrada no GAS. Ainda precisam ser provados parsing PDF/ByteRange, CMS,
cadeia de certificados e desempenho dentro do runtime GAS; revogação e raízes
de confiança continuam dependentes de política e evidência próprias. Não
requer serviço externo, mas nenhum Criterion passa a coberto por esta
possibilidade.

Referências técnicas primárias:

- [Apps Script V8 runtime — APIs não disponíveis e exceção WebAssembly](https://developers.google.com/apps-script/guides/v8-runtime#limitations)
- [Apps Script Utilities — digest, HMAC e geração de assinatura RSA](https://developers.google.com/apps-script/reference/utilities)

Inventário local complementar: disponíveis GCC nativo, Node.js 22 com
`WebAssembly.instantiate`, OpenSSL e Poppler; indisponíveis `clang`,
`wasm-ld`, `emcc`, `wasmtime`, `wasmer` e pacotes Python WASM pesquisados.
Assim, este ambiente não permite construir nem executar agora um módulo WASM
verificador; o teste de WASM em Node, mesmo se construído, não provaria o
comportamento em Apps Script. `WASM_VERIFIER_POC=NOT_RUN_TOOLCHAIN_UNAVAILABLE`.
Nenhuma dependência foi instalada nem baixada.

### Revisão adversarial GPT-6 e correções dirigidas — 2026-10-19

O reviewer solicitado via `gpt-6.1-sol` declarou identidade efetiva
`Codex/GPT-6`; portanto este resultado é registrado como revisão GPT-6, não
Sol 6.1. Retornou `FAIL` com três achados concretos:

1. MÉDIO: PHASE 8 enumerava somente campos de correlação embora `06_reports`
   também exigisse disclosure da verificação de assinatura. Corrigido o
   contrato para autorizar duas projeções congeladas, separadas e enumerar os
   campos de assinatura; teste de identidade agora verifica ambas e proíbe
   consumir artefatos completos ou recalcular.
2. MÉDIO: inventário dizia cinco Criteria com dependência `SIGNED`. Recontagem
   direta de `03_table1`, `04_table4` e `02_requirements` encontrou onze:
   três `ASSERT` (`T1_DRT_SIGNED`, `T4_DRT_SIGNED`,
   `T1_CONFORMITY_REPORT_SIGNED`) e oito `VALIDATE` de produto
   (`T4_IN07_COMMISSIONING`, `T4_IN08_ESTANQUEIDADE`, `T4_IN09_CHECKLIST`,
   `T4_IN09_TEST_REPORT`, `T4_IN10_COMMISSIONING`,
   `T4_IN12_COMMISSIONING`, `T4_IN15_COMMISSIONING`, `T4_IN18_CMAR`). O
   inventário foi corrigido e o teste deriva/valida a lista contra as fontes.
3. BAIXO: o stream PDF sintético declarava `/Length` incompatível e usava
   `/F1` sem recurso de fonte. A fixture agora calcula o comprimento dos bytes
   do stream e declara Helvetica em `/Resources`; Poppler valida assinatura e
   distingue o certificado não confiável, e rejeita conteúdo adulterado.

Nenhum arquivo foi alterado pelo reviewer. Re-review dirigida por Luna retornou
`PASS` nos três findings, sem achados restantes; executou o teste de identidade
20/20 e o POC local positivo/negativo. Pós-correções: 148 testes
Python, 9 suítes Apps Script, sintaxe de todos os módulos JS e `Code.gs`,
17 phase guards, manifest e `git diff --check` `PASS`; runtime regenerado duas
vezes byte-identicamente, SHA-256
`d296f3dedda77689685e495fdd3cc1273818b475afcd96b7423a5e13e9353417`. KB
`5.30.0`, `06_reports.txt` `3.18.0`, pipeline `4.32.0`. Release build,
commit e push aguardam re-review/governança Sol. Coverage permanece 10/29,
um parcial e 19 pendentes integrais; este lote corrige consistência e prova
preparatória, sem ganho funcional de Criterion.

A revisão final solicitada a `chatgpt-web/gpt-5.6-sol`, depois das correções e
dos gates, encerrou antes de iniciar com `Selected model is at capacity`.
`SOL_REVIEW=PENDING`; esta falha não é revisão nem aprovação. Permanecem
`FINDINGS_OPEN=3` achados arquiteturais anteriores corrigidos no candidate,
aguardando confirmação Sol 6.1. Release build, commit e push não executados;
nenhuma promoção ou deploy.

### Checkpoint de revisão sem promoção — 2026-10-20

Registro do estado imediatamente anterior à autorização permanente do
responsável, recebida em 2026-10-20. As decisões de bloqueio de commit e build
abaixo são históricas e ficam supersedidas pela autorização registrada ao fim
desta seção; a revisão Sol continua obrigatória para consolidação e promoção.

- Branch local de revisão: `review/phase6a-signature-pending-sol`, criada
  sobre o baseline `b999a1cc18afcf469db25e9fba8724e2ca490b84`. A branch conserva
  o diff na worktree; não foi criado commit nem enviada branch remota.
- Governança aplicada: `AGENTS.md` §25 veda promover mudança arquitetural a
  arquitetura consolidada sem revisão Sol. Além disso, este tracker estabelece
  expressamente que Sol é requisito prévio à consolidação/commit (seção
  “Ciclo de revisão dirigido — findings e disponibilidade”). Assim, o
  checkpoint provisório commitado/pushável aguardava a autorização permanente
  que ainda não havia sido emitida naquele momento.
- `SOL_REVIEW=PENDING_CAPACITY`; não houve tentativa adicional de acesso a Sol.
  `PROMOTION=NOT_AUTHORIZED`. A re-review Luna dos três findings corrigidos
  permanece `PASS`; para a decisão arquitetural geral, `FINDINGS_OPEN=3`
  aguardam confirmação Sol e não são apresentados como findings reabertos por
  Luna.
- Pacote para Sol: diff integral nos onze arquivos versionados do candidate e
  `tools/poc_pdf_signature_byte_range.py`; decisões de divisão 6A/6B, recibo
  autenticado separado da RDE e verificação local/humana; os três findings e
  respectivas correções listados acima; testes e gates registrados acima; e
  limites técnicos da POC/Apps Script descritos em “Viabilidade documentada do
  runtime Apps Script”. Cobertura segue 10/29 Criteria produtivos, 1 parcial e
  19 pendentes integrais.
- Release builder deliberadamente não executado neste candidate: `build()`
  recusa qualquer worktree suja (`tools/build_knowledge_base_release.py`,
  “a release exige um worktree limpo”) e grava `git rev-parse HEAD` como
  `SOURCE_COMMIT`. Criar o commit exigido pela worktree limpa violaria a
  condição explícita de revisão Sol prévia; construir apenas o HEAD-base não
  validaria este candidate. Naquele momento `RELEASE_BUILD` estava bloqueado;
  a decisão foi supersedida pela autorização registrada abaixo, que permite
  build técnico antes da revisão Sol.
- Verificação independente isolada executada localmente:
  `python tools/poc_pdf_signature_byte_range.py` — PASS para assinatura
  ByteRange/CMS da fixture; certificado autoassinado explicitamente não
  confiável; alteração de byte coberto rejeitada como `Digest Mismatch`.
  Limites: fixture sintética, sem política PAdES, identidade de conselho,
  cadeia confiável, revogação ou prova de capacidade no Apps Script. É apenas
  protótipo de verificação, não é integrado ao Engine e não altera Criteria.
- `.codex-local-evidence/` permanece intocado e fora do Git; credenciais e
  artefatos privados não foram adicionados ao índice. Sem merge, deploy,
  promoção ou mudança de cobertura.
- Rechecagem técnica em 2026-10-20 da documentação oficial: Apps Script V8
  continua sem `crypto`/`SubtleCrypto`; a exceção documentada é WebAssembly,
  mas isso não demonstra que um módulo CMS/PAdES possa ser carregado e executado
  corretamente no GAS. `Utilities` documenta digest, HMAC e assinatura RSA,
  não uma API de verificação CMS/PAdES. A POC depende de `pdfsig`/Poppler e
  OpenSSL locais, portanto prova ByteRange/CMS na fixture e serve para testes
  de contrato, mas não é componente executável no GAS. Próximo trabalho
  independente seguro: protótipo controlado pelo projeto (por exemplo, parser
  + verificador WASM) em alvo local com vetores conhecidos, seguido de prova
  específica no GAS; até ambas as etapas e revisão arquitetural, nenhuma
  evidência é confiável para consumo pelo Engine.
  Fontes primárias: [limitações do Apps Script V8](https://developers.google.com/apps-script/guides/v8-runtime#limitations)
  e [Utilities](https://developers.google.com/apps-script/reference/utilities).

### Checkpoint técnico publicado — 2026-10-20

- `BASELINE=b999a1cc18afcf469db25e9fba8724e2ca490b84`;
  `CANDIDATE=5534c3f43fbaf10c75d64d3ab91c12e457073426`.
- Commit `5534c3f` contém 12 arquivos pertinentes e foi enviado por
  fast-forward para `origin/feature/apps-script-engine-core`. `.codex-local-evidence/`
  permaneceu local, não rastreado e fora do commit; nenhum arquivo de credencial
  foi incluído.
- Regressão dirigida após incorporar a autorização: testes Python de identidade
  da Base e contrato runtime `43/43 PASS`; `git diff --check` PASS. Gates
  completos do candidate funcional antes da atualização apenas documental de
  governança: Python `148/148`, Apps Script `9/9`, sintaxe JS/Code.gs, guards
  `17/17`, regeneração byte-identical e manifest — PASS; SHA-256 runtime
  `d296f3dedda77689685e495fdd3cc1273818b475afcd96b7423a5e13e9353417`.
- Release build técnico em worktree detached limpa do SHA exato: `PASS`, 10/10
  documentos, Base `5.30.0`, `SOURCE_COMMIT=5534c3f43fbaf10c75d64d3ab91c12e457073426`.
  Saída local em `/tmp/phase6a-signature-release-5534c3f`; validação não
  promocional.
- Estado: `SOL_REVIEW=PENDING_CAPACITY`,
  `ARCHITECTURAL_REVIEW=PENDING`, `PROMOTION=NOT_AUTHORIZED`,
  `PRODUCTION_RELEASE=NOT_AUTHORIZED`. Os três achados corrigidos aguardam
  confirmação Sol; a revisão Luna dirigida já havia retornado PASS.
- Cobertura inalterada: 34 Criteria ativos; 29 produtivos; 10 cobertos
  integralmente; 1 parcial; 19 pendentes integrais; 5 não selecionáveis; 2
  retirados. Fase 6A e 6B permanecem pendentes de seus respectivos gates; este
  checkpoint não declara encerramento nem ganho de cobertura.

### Autorização permanente do responsável — 2026-10-20

O responsável autorizou commits, pushes em branches de desenvolvimento e
revisão, worktrees temporárias e builds de validação em todas as fases de
desenvolvimento já autorizadas, sem aprovação Sol prévia ou confirmação
mecânica adicional. Esta autorização elimina bloqueio administrativo de
versionamento; não é revisão Sol e não autoriza consolidação arquitetural,
promoção, merge em `main`, deploy, uso real, decisão normativa ou início de
fase não autorizada.

Regra permanente: “Commits, pushes e builds de validação são atividades de
desenvolvimento e não constituem promoção arquitetural. A revisão independente
Sol é obrigatória para consolidação da arquitetura e promoção, não para
versionamento provisório de candidatos.” Commits/pushes candidatos devem
registrar `ARCHITECTURAL_REVIEW=PENDING`, `PROMOTION=NOT_AUTHORIZED` e,
enquanto Sol indisponível, `SOL_REVIEW=PENDING_CAPACITY`. Builds técnicos serão
executados em worktree limpa do commit candidato exato, com `SOURCE_COMMIT`
igual ao SHA testado; `BUILD_VALIDATION=PASS` não significa
`PRODUCTION_RELEASE=AUTHORIZED`.


### Aceitação da revisão independente conforme §25.2 — 2026-10-20

Governança incorporada de `d815ca5b3a7b5268b489ae9461ca1b2633e75a54`:
seções 25, 25.1 e 25.2 do AGENTS, preservadas as demais seções e os contratos
do candidato. Esta decisão supersede a exigência histórica de identidade Sol
como bloqueio absoluto para este checkpoint.

A aceitação não se baseia só na etiqueta TECHNICAL_REVIEW=PASS. Foram
verificados metadados, execuções independentes read-only, escopos
complementares, testes efetivamente executados e achados do candidato exato.
O [registro completo](REVISAO_ARQUITETURAL_FASE_6_ASSINATURAS.md) contém matriz
dos sete requisitos, identidades, IDs e limites de cada parecer. A síntese do
orquestrador não substitui a prova de independência dos revisores.

```text
REVIEWED_BASELINE=b999a1cc18afcf469db25e9fba8724e2ca490b84
REVIEWED_CANDIDATE=5534c3f43fbaf10c75d64d3ab91c12e457073426
REVIEWED_HEAD=d4339f10a7acd3b6b0829313aadacc58acc2756b
REVIEWER_IDENTITY=Codex/GPT-6 (declarada; execução Zeno)
REVIEWER_EXECUTION=01a15af4-0d90-7092-83a5-292e43abf0c3
COMPLEMENTARY_REVIEWER_EXECUTION=01a15af2-7ac7-79c0-83be-b4c9f5feb225
INDEPENDENT_ARCH_REVIEW=PASS
ARCHITECTURAL_REVIEW=PASS
ARCHITECTURAL_CHECKPOINT=CONSOLIDATED
SOL_REVIEW=PENDING_IDENTITY
PROMOTION=NOT_AUTHORIZED
PRODUCTION_RELEASE=NOT_AUTHORIZED
```

Zeno confirmou contratos/docs, os metadados runtime sem alteração de regras e
o acréscimo exclusivamente documental no HEAD. Terra confirmou POC, testes
alterados (43 OK) e inventário de onze dependências. Três findings anteriores
encerrados; nenhum BLOCKER/HIGH ou conflito material aberto; OPT-001 LOW do
teste de exaustividade fica rastreado para correção dirigida.

Gates técnicos do candidato continuam válidos conforme evidências segregadas
no registro; não foram declarados como todos executados pelos subrevisores.
O checkpoint de contratos está consolidado na branch de desenvolvimento.
Fase 6 permanece IN_PROGRESS; 6A/6B não são declaradas encerradas. Cobertura
34/29/10/1/19/5 inalterada; CALIBRATION_GATE=BLOCKED,
NORMATIVE_INSTITUTIONAL_VALIDATION=PENDING e VALIDATED_TO_ANALYZED=PENDING.
Nenhum merge na main, deploy, uso real ou promoção operacional autorizado.
Continuidade: fechar OPT-001 e ampliar evidência local de assinatura para
revisão incremental não assinada, sem habilitar consumo produtivo pelo Engine.


### Continuidade da Fase 6 — inventário e revisão PDF incremental (2026-10-20)

- Governança e aceitação §25.2 versionadas em
  `c66ec116528e48b0eb055ceec6f7c01fa2555c56`: checkpoint arquitetural do
  candidato 5534c3f consolidado, sem declarar revisão efetiva Sol.
- Lote de continuidade: `f82edba9e6f771011b6bde70c86453f91baa60a5`, três
  arquivos de testes/POC; nenhum diff em knowledge-base ou apps-script.
- Revisão independente dirigida Zeno/Codex-GPT-6, execução
  `01a15af4-0d90-7092-83a5-292e43abf0c3`: PASS no SHA exato; 45 testes e POC
  executados pelo revisor; nenhum achado pendente. OPT-001=CLOSED após
  corrigir também o caso de ASSERT SIGNED sem FAIL/MANUAL_REVIEW.
- Prova local ampliada: assinatura CMS da revisão original permanece íntegra
  após uma revisão incremental não assinada adicionar conteúdo visível. Isso
  demonstra a necessidade de distinguir cobertura dos bytes da validade do
  documento atual; não demonstra validação PAdES ou capacidade GAS.
- Gates do orquestrador: 150 testes Python (incluindo os 17 guards), nove
  suítes JS, POC real, sintaxe JS/Code.gs, manifest, regeneração runtime
  byte-idêntica e diff check PASS. SHA-256 runtime preservado:
  `d296f3dedda77689685e495fdd3cc1273818b475afcd96b7423a5e13e9353417`.
- BUILD_VALIDATION=PASS em worktree temporária limpa do commit f82edba;
  SOURCE_COMMIT=f82edba9e6f771011b6bde70c86453f91baa60a5; dez documentos,
  KB 5.30.0. Release técnico em `/tmp/ssci-phase6-validation-zl1nlmlm-release`.
  Nenhuma promoção operacional, deploy ou merge na main.
- Detalhes e distinção dos papéis no
  [registro de revisão](REVISAO_ARQUITETURAL_FASE_6_ASSINATURAS.md).
  SOL_REVIEW=PENDING_IDENTITY; INDEPENDENT_ARCH_REVIEW=PASS para o checkpoint
  original, FOLLOWUP_INDEPENDENT_REVIEW=PASS para o lote de testes.
  Fases 6A/6B continuam IN_PROGRESS, cobertura 34/29/10/1/19/5 inalterada,
  SIGNED=MANUAL_REVIEW sem comprovação suficiente, CALIBRATION_GATE=BLOCKED,
  VALIDATED_TO_ANALYZED=PENDING, NORMATIVE_INSTITUTIONAL_VALIDATION=PENDING e
  PRODUCTION_RELEASE=NOT_AUTHORIZED. Próximo passo técnico é verificador local
  validado, perfil/recibo autenticados e prova GAS; a POC não os substitui.

### Reavaliação documental oficial dos status ART/RRT/TRT — 2026-10-20

- Consulta dirigida a fontes públicas dos emissores, sem chamadas a API e sem
  uso de dados de processos. A página do CREA-SC informa que o registro da ART
  se efetiva após cadastro eletrônico e recolhimento, mas também descreve
  emissão da ART e do boleto; não publica uma tabela versionada e completa de
  literais para os campos RDE de registro, emissão e pagamento:
  <https://portal.crea-sc.org.br/profissional/art/anotacao-de-responsabilidade-tecnica-art/>.
- A Portaria Normativa CAU/BR 25/2014 distingue rascunho, documento final
  numerado acompanhado de comprovante de pagamento e registro definitivo com
  numeração e valor preenchido pelo SICCAU. É fonte oficial útil para essa
  modalidade documental, mas é ato de 2014 e não constitui mapeamento atual e
  completo de todos os literais/estados do CAU para os três atributos RDE:
  <https://transparencia.caubr.gov.br/portarianormativa25/>.
- O manual de geração de TRT do CFT lista estados distintos — aguardando
  validação, aguardando pagamento, cancelado, aprovado, válido, bloqueado e
  baixado — e descreve consulta de autenticidade após geração, validação e
  impressão. Não define equivalência universal entre esses estados e as três
  categorias semânticas do Engine; além disso, é um manual de 2018:
  <https://www.cft.org.br/wp-content/uploads/2018/10/MANUAL-DE-GERACAO-DE-TRT-v1_2.pdf>.
- Conclusão restrita: as fontes reforçam que estados, etapas e nomes variam
  entre conselho, documento e fluxo. Não autorizam normalização global ou
  dedução por palavra. Não foi estabelecido um catálogo completo, vigente e
  versionado por tipo documental/conselho/campo/literal, nem comprovada a
  proveniência autenticada desses atributos nos PDFs do processo. Portanto,
  nenhuma implementação de classificador foi feita; `T1_DRT_REGISTERED` e
  `T4_DRT_REGISTERED` seguem pendentes/MANUAL_REVIEW quando insuficientes.
  Cobertura permanece `10/29`, sem ganho; nenhum Requirement, Criterion ou
  Nonconformity foi alterado. A evidência não substitui validação normativa
  institucional nem confirmação oficial do documento individual.
- Revisões: nenhuma revisão arquitetural solicitada, pois este registro não
  altera contrato nem comportamento. Testes: nenhum necessário para a nota de
  pesquisa; `git diff --check` executado no checkpoint documental.

### Encerramento do gate gerencial Fase 6A — 2026-10-20

```text
FASE_6A_STATUS=COMPLETE
FASE_6B_STATUS=IN_PROGRESS
REVIEWED_CANDIDATE=1473edd2fe659b875167871d1df0a2882045d04c
INDEPENDENT_6A_GATE_REVIEW=PASS
REVIEWER_IDENTITY=Codex/GPT-6 (declared; effective Sol identity unconfirmed)
REVIEWER_SESSION=01a15b47-e8c3-7110-9ff6-a8ab80fd8ac8
SOL_REVIEW=NOT_PERFORMED
PROMOTION=NOT_AUTHORIZED
```

- A revisão independente read-only no SHA exato concluiu PASS para o gate 6A,
  sem achados bloqueantes no escopo. A re-review dirigida separou a interface
  tipada e o fallback determinístico de insuficiência da integração produtiva:
  contrato/interface autenticada e `SIGNED → MANUAL_REVIEW` pertencem à 6A;
  verificador local, perfil operacional, recibos efetivos e binding integrado
  ao Engine pertencem à 6B. O reviewer declarou Codex/GPT-6; a rota solicitada
  foi `gpt-6.1-sol`, mas a identidade Sol efetiva não foi confirmada. O parecer
  é registrado sob §25.2 como revisão independente equivalente, sem qualquer
  atribuição de revisão ou PASS a Sol.
- A arquitetura dos contratos-base foi independentemente aprovada conforme
  §25.2 no candidato `5534c3f`; a re-review dos testes/POC no candidato
  `f82edba` fechou OPT-001. Desde esses candidatos, o HEAD atual contém apenas
  documentação de acompanhamento. A review Luna examinou o candidato atual e
  registrou que não há alteração de código/Base/testes posterior.
- No candidato revisado foram executados: Python `150/150`; Apps Script `9/9`;
  `node --check` em 21 arquivos JS e `Code.gs`; regeneração do runtime
  byte-idêntica, SHA-256
  `d296f3dedda77689685e495fdd3cc1273818b475afcd96b7423a5e13e9353417`;
  release build em worktree limpa, 10 documentos, KB `5.30.0`,
  `SOURCE_COMMIT=0264157ebe6a106fdadf61fb3c51382ce95f1d1e`; e
  `git diff --check`: PASS. O primeiro build na worktree de desenvolvimento
  foi corretamente recusado por causa do diretório local não rastreado; a
  validação foi repetida com sucesso em worktree limpa, preservando
  `.codex-local-evidence/`.
- Cobertura não foi ampliada: 34 Criteria ativos, 29 produtivos, 10 integrais,
  1 parcial, 18 sem suporte integral, 5 não selecionáveis e 2 retirados.
  Capacidade preparatória não conta como Criterion coberto.
- O gate gerencial 6A está encerrado; verificação operacional de assinatura,
  integração de recibos, cobertura restante, correlação calibrada e
  gates/revisão final da Fase 6 permanecem na 6B. `CALIBRATION_GATE=BLOCKED`,
  `NORMATIVE_INSTITUTIONAL_VALIDATION=PENDING`,
  `VALIDATED_TO_ANALYZED=PENDING`, `SOL_REVIEW=PENDING_IDENTITY` e
  `PROMOTION=NOT_AUTHORIZED`.

### POC isolada de inspeção local de assinatura PDF — 2026-10-20

- Criados `tools/verify_pdf_signatures_local.py` e
  `tests/test_local_pdf_signature_verifier.py` como ferramenta experimental
  local. Ela não integra o Engine, não emite recibo autenticado, não acessa
  APIs externas e não altera a RDE ou o PDF de origem.
- A ferramenta lê um snapshot dos bytes uma vez; Poppler `pdfsig 24.02.0`
  executa dump e inspeção sobre a mesma cópia temporária. Saída inesperada,
  divergência entre registros textuais e contagem de assinaturas extraídas,
  alteração/adulteração e falhas técnicas não são admitidas como prova.
  A POC separa integridade criptográfica e cobertura de bytes de confiança,
  cadeia, revogação, PAdES, identidade profissional e validade jurídica, que
  permanecem `UNKNOWN/NOT_EVALUATED`.
- A fixture adversarial de metadados PDF com linhas injetadas é rejeitada pelo
  vínculo de contagem entre `pdfsig -dump` e registros do relatório. A
  regressão de escape terminal usa ESC ANSI real e verifica que a exceção não
  ecoa o caractere. A POC anterior também confirma que conteúdo acrescentado
  em revisão incremental não assinada fica fora da cobertura dos bytes
  originais; isso não demonstra validade integral do documento atual.
- Gates no candidato `e41c5b5c0bc318157d98265ce77d296f1b398a5a`: Python `167`
  executados, `163 PASS` e `4` skips
  opt-in; suítes Apps Script `9/9 PASS`; `node --check` em módulos e testes
  JavaScript e `Code.gs`; testes unitários da ferramenta `17` (4 skips sem
  opt-in) e integração local opt-in `17/17 PASS`; POC de ByteRange/CMS PASS;
  regeneração de `CompiledRuntimeContract.js` byte-idêntica, SHA-256
  `d296f3dedda77689685e495fdd3cc1273818b475afcd96b7423a5e13e9353417`;
  `git diff --check` PASS. `BUILD_VALIDATION=PASS` em worktree limpa no
  `SOURCE_COMMIT=e41c5b5c0bc318157d98265ce77d296f1b398a5a`: dez documentos,
  Knowledge Base `5.30.0`; saída em
  `/tmp/ssci-phase6-signature-e41c5b5-release`. A primeira tentativa chamou
  o script a partir do checkout principal, cujo diretório local causou a
  recusa de worktree suja; a validação foi corretamente repetida executando
  o builder a partir da raiz limpa do worktree, sem limpar qualquer arquivo.
- Revisão read-only independente dirigida por Arendt (execução
  `01a15b55-84d2-70f3-afd2-b6d76376b809`, role `terra_worker`; modelo/versão
  efetiva não expostos): sem findings de correção. A re-review dirigida
  confirmou a regressão ESC real. Isso não é revisão Sol nem aprovação da
  arquitetura de integração/produto.
- Nenhum Criterion novo é contado como integralmente coberto: cobertura
  permanece `10/29`; 6B continua `IN_PROGRESS`. A integração confiável requer
  validação criptográfica suficiente, contrato de recibo autenticado,
  identidade/digest e fronteira de autoridade revisados. GAS não foi provado
  capaz de validar PAdES/CMS/X.509. `CALIBRATION_GATE=BLOCKED`,
  `NORMATIVE_INSTITUTIONAL_VALIDATION=PENDING`,
  `VALIDATED_TO_ANALYZED=PENDING`, `SOL_REVIEW=PENDING_IDENTITY` e
  `PROMOTION=NOT_AUTHORIZED` permanecem.

### Avaliação documental da criptografia nativa Apps Script — 2026-10-20

- O manifesto do projeto confirma `runtimeVersion=V8`. A documentação oficial
  de limitações V8 enumera `crypto` e `SubtleCrypto` entre APIs indisponíveis;
  orienta o uso de `Utilities` para operações criptográficas compatíveis.
  A classe oficial `Utilities` documenta digest, HMAC e geração de assinatura
  RSA, mas não documenta verificação RSA, decodificação/verificação CMS,
  validação de cadeia X.509 ou PAdES:
  [limitações V8](https://developers.google.com/apps-script/guides/v8-runtime),
  [Utilities](https://developers.google.com/apps-script/reference/utilities/utilities).
- Conclusão limitada ao que a plataforma documenta: `Utilities.computeDigest`
  pode calcular digest dos bytes, mas não verifica por si só a assinatura
  CMS/PAdES desses bytes. A ausência de uma API nativa documentada não prova
  impossibilidade de implementar um verificador criptográfico próprio em
  JavaScript; isso exigiria componente controlado pelo projeto, testes
  criptográficos compatíveis e validação independente. Nenhum verificador
  desse tipo foi implementado ou considerado confiável neste lote.
- Não foi feita chamada de API externa, uso de dados reais ou execução GAS.
  O CLI local Poppler segue apenas ferramenta experimental isolada. Próximo
  passo útil: provar capacidade e limites de um componente controlado pelo
  projeto sobre fixtures, incluindo CMS/ByteRange, antes de considerar
  integração de recibo autenticado; até lá `SIGNED → MANUAL_REVIEW` e nenhum
  Criterion recebe cobertura adicional.

### Cross-check CMS local com OpenSSL — 2026-10-20

- A ferramenta experimental agora valida CMS detached em paralelo com Poppler
  para PDF de uma assinatura: usa os bytes do mesmo snapshot, recompõe o
  conteúdo pela ByteRange validada, aceita apenas comprimento DER canônico e
  padding final zero, e chama `openssl cms -verify -binary -noverify
  -verify_retcode`. OpenSSL `-noverify` não valida a cadeia do signatário;
  a documentação oficial separa verificação CMS/conteúdo da validação da
  cadeia: [CMS_verify](https://docs.openssl.org/3.0/man3/CMS_verify/) e
  [openssl-cms](https://docs.openssl.org/3.0/man1/openssl-cms/).
- Proveniência da execução local: Poppler `24.02.0`; OpenSSL
  `3.0.13 30 Jan 2024`. Na fixture assinada, ambos confirmam integridade CMS;
  certificado autoassinado continua sem confiança. Na fixture adulterada,
  Poppler reporta `Digest Mismatch` (`integrity=INVALID`), enquanto o
  cross-check OpenSSL permanece `INCONCLUSIVE` porque o código de erro do
  OpenSSL, sozinho, não distingue mismatch de erro técnico. Na revisão
  incremental, CMS original continua válido para sua ByteRange, mas
  `full_document_current_revision=false`.
- Finding de revisão: a re-review independente exigiu não classificar erro
  OpenSSL como inválido, rejeitar comprimento DER não canônico e padding não
  zero, registrar a versão efetiva do Poppler e evitar pareamento presumido em
  PDFs com várias assinaturas. Correções aplicadas: toda falha OpenSSL e todos
  os documentos com mais de uma assinatura resultam `CMS_SIGNATURE_INTEGRITY
  =INCONCLUSIVE`; o status Poppler permanece separado. Nada foi integrado ao
  Engine, à RDE ou a recibos autenticados.
- Revisão dirigida read-only: **PASS**, sem findings HIGH/MEDIUM pendentes ou
  novos erros exploráveis nos dois arquivos. Revisor declarou Codex/GPT-5,
  sessão independente `01a15b61-8480-7982-bca9-a84abe03282e`, role Luna; é
  revisão do CLI experimental, não Sol, nem aprovação arquitetural ou final da
  Fase 6.
- Gates do candidato local: Python `174` (169 PASS, 5 skips); Apps Script
  `9/9`; sintaxe JS/testes e `Code.gs`; teste focal `24` (5 skips sem opt-in),
  integração opt-in `24/24`; POC ByteRange/CMS; `py_compile`; runtime
  byte-identical SHA-256
  `d296f3dedda77689685e495fdd3cc1273818b475afcd96b7423a5e13e9353417`;
  `git diff --check` — PASS. Commit `584253c088533b18ef3bbf617fdc28f98cd3c2f4`
  publicado; `BUILD_VALIDATION=PASS` em worktree limpa, com dez documentos,
  KB `5.30.0` e `SOURCE_COMMIT` exato. Saída em
  `/tmp/ssci-phase6-signature-584253c-release`. A primeira invocação do
  builder a partir do checkout principal foi corretamente recusada como
  worktree suja; a execução dentro da raiz da worktree destacada passou.
- Limites: cadeia de confiança, identidade profissional, revogação, PAdES e
  capacidade de execução GAS continuam `UNKNOWN/NOT_EVALUATED`; múltiplas
  assinaturas são encaminhadas como inconclusivas. Cobertura continua `10/29`,
  sem ganho de Criterion; `SIGNED → MANUAL_REVIEW` permanece até verificador,
  perfil e recibo autenticado satisfazerem os contratos da PHASE 2A.

### Diagnóstico de produtividade — escopo documental IN10 — 2026-10-20

- Worktree e remoto estavam sincronizados em `c349e109a359926c2f262e372e4087e41ad36c5e`; `.codex-local-evidence/` permaneceu não rastreado e intocado.
- A matriz vigente mantém 29 Criteria produtivos, 10 integrais, um parcial (`T1_CONFORMITY_REPORT`) e 18 sem cobertura integral; portanto 19 permanecem sem cobertura integral contando o parcial. Nenhum dos 19 restantes está integralmente fechável apenas com as evidências/contratos disponíveis: o caminho positivo de uma declaração documental não resolve a ausência de inventário/completude, vinculação exata, autenticidade ou casos de conflito exigidos pelo Criterion. Não contabilizar preparação como cobertura.
- Achado documental: `T4_IN10_COMMISSIONING` é selecionado por `SMSCI_SMOKE_CONTROL` genérico. A IRV Habite-se 2024, Anexo A, Tabela 4, p. 9, condiciona relatório e comissionamento ao controle de fumaça mecânico. O BOECBM 01/2024, FI 17, art. 67, alterou o art. 41 da IN 10 para “sistema de controle de fumaça mecânico”. A fonte oficial da [IRV Habite-se 2024](https://documentoscbmsc.cbm.sc.gov.br/uploads/007b6741900db4f57a80d467023bfead.pdf) e do [BOECBM 01/2024](https://documentoscbmsc.cbm.sc.gov.br/uploads/8b199194752d76c3ccf9b8cf698c3ba4.pdf) confirma o escopo. A Base hoje não possui fato tipado de modo mecânico nem regra de applicability condicional; a existência de `SMSCI_SMOKE_CONTROL_MECHANICAL` como entidade derivada interna não é fato de processo nem evidência de aplicabilidade.
- A regra do usuário sobre independência (RT/equipe do comissionamento diferente do solicitante) permanece resolvida. Este achado não reabre essa decisão e não requer decisão normativa humana: trata-se de formalização factual/aplicabilidade. Proposta técnica para futuro lote: definir fato FACT-ONLY com provenance que só possa ser afirmado a partir de fonte explícita, e resultado conservador para ausência/ambiguidade; só então ajustar applicability para não selecionar requisito fora do escopo mecânico. Não classificar texto livre automaticamente, nem produzir `NOT_APPLICABLE`, `FAIL` ou Nonconformity na falta do fato.
- Outros bloqueios de IN10 permanecem: papel e identidade autenticados de solicitante e RT/equipe autora, associação explícita DRT↔relatório conforme os limites decididos pelo usuário, e evidência de assinatura verificável. O Criterion não ganha cobertura neste diagnóstico.
- Métrica do lote: Criteria integrais antes/depois `10/29 → 10/29`; parcial `1 → 1`; blockers encerrados `0`; bloqueio documental explicitado `T4_IN10_COMMISSIONING`; código/Base/runtime inalterados. Testes de execução não aplicáveis à anotação; `git diff --check` passou para este registro documental. Revisões arquiteturais: zero, pois não há mudança de contrato ou comportamento.

### Lote funcional — escopo mecânico explícito de IN10 — 2026-10-20

- Candidate iniciado sobre `7c53f81a5c17628eaba88fc56379aa0af04fbdf4`. O requisito foi restringido ao escopo interno `SMSCI_SMOKE_CONTROL_MECHANICAL`, derivado do código oficial CF apenas por um fato `SMOKE_CONTROL_MODE` explícito, acompanhado de `SMOKE_CONTROL_MODE_SOURCE_TEXT`, `SOURCE_LOCATION` e provenance do item da RDE. O texto RPCI orientativo permanece excluído.
- O contrato documenta `MECHANICAL` e `NON_MECHANICAL` somente como declarações explícitas da fonte. Não deduz `NON_MECHANICAL` da ausência de “mecânico”. CF sem modo, com valor inválido, sem texto/localização/provenance, ou com itens CF conflitantes bloqueia antes do Engine. CF ausente na seção completa produz decisão derivada negativa com o trace oficial CF negativo.
- A Applicability preserva a decisão oficial CF, registra o escopo derivado com referências e literal-fonte e nunca produz `PASS`, `FAIL`, `NOT_APPLICABLE` ou Nonconformity por si. O plano valida a derivação e a proveniência do trace. O Requirement/entidade de relatório de comissionamento IN10 passam a referir o escopo mecânico.
- Fontes: IN 10 art. 41 alterado pelo BOECBM 01/2024 FI 17 art. 67; IRV Habite-se 2024, Anexo A, Tabela 4, p. 9. Este ajuste alinha escopo da Base ao texto fonte e não decide a identidade de solicitante/autor.
- O lote foi autorizado no escopo 6B como formalização factual e regra de applicability para corrigir a seleção indevida de IN10. A revisão arquitetural independente deste candidate ainda está pendente; `ARCHITECTURAL_REVIEW=PENDING`, `PROMOTION=NOT_AUTHORIZED`.
- Testes focados executados: `apps-script-applicability-plan` PASS; 60 testes Python de identidade da KB, contrato compilado e guard mínimo passaram após atualizar expectations de versão; `node --check` dos dois módulos alterados passou. Um primeiro ensaio revelou que `ExecutionPlanCore` exigia lista fechada de duas derivações; o guard foi ampliado para validar a terceira derivação e seu trace, e a suíte passou. A compilação atual é KB `5.31.0`, documentos alterados: 01 `3.9.0`, 02 `3.6.0`, 02a `1.4.0`, 04 `3.4.0`, 06 `3.19.0`, pipeline `4.33.0`.
- Ganho de Criteria integrais: `10/29 → 10/29`; parcial `1 → 1`. F6-MC-007 foi parcialmente encerrado no subproblema de escopo (aguardando revisão); blockers de autoria/solicitante, DRT e assinatura continuam. Benefício operacional: evitar selecionar a exigência de comissionamento mecânico para CF explicitamente declarado não mecânico; quando o modo não é conhecido, a execução para sem criar resultado normativo.
- Gates consolidados no `fb4734a5eca181bcd09b75e4b264fa0c2fc1e0b1`: Python `175` (`170` pass, `5` skipped); Apps Script `9/9 PASS`; `node --check` em todos `apps-script/*.js` e `tests/apps-script-*.test.js`; sintaxe `Code.gs`; runtime byte-identical SHA-256 `59e7b70c52ffb9118943240af2ca5f603925bff73c382d9a2b3c98ac92afb619`; manifesto e phase guards PASS; `git diff --check` PASS. `BUILD_VALIDATION=PASS` na worktree destacada e limpa, `SOURCE_COMMIT=fb4734a5eca181bcd09b75e4b264fa0c2fc1e0b1`, KB `5.31.0`, 10 documentos. O candidato técnico foi publicado na branch de desenvolvimento.
- Revisão: `INDEPENDENT_ARCH_REVIEW=PENDING_CAPACITY`, pois não há ferramenta/sessão de revisor independente disponível nesta execução; `SOL_REVIEW=PENDING_IDENTITY`; não houve parecer atribuído a Sol nem aprovação arquitetural. O checkpoint segue `ARCHITECTURAL_REVIEW=PENDING`, `PROMOTION=NOT_AUTHORIZED`. Re-review deverá ser dirigida ao candidato exato antes de consolidar o fix.

### Correção da fonte oficial de identidade do solicitante e RT — 2026-10-20

- A referência anterior ao Anexo C/páginas 36–37 estava incorreta: o URL
  consultado apontava para uma edição anterior da IN 1, publicada em 2019. A
  edição oficial vigente consultada é a IN 1 - Parte 1 de 2024, Separata ao
  BOECBM nº 1 de 25/04/2024. O formulário de requerimentos é o **Anexo B**,
  páginas impressas 46–47 (PDF pp. 47–48), e não o Anexo C.
- Na seção “Identificação Nominal”, o Anexo B tem campos `CPF` e `Nome` para
  `Solicitante` e `Responsável Técnico`, além de opções declaradas de igualdade
  entre papéis. Fonte oficial: [IN 1 - Parte 1 (2024), Anexo B](https://documentoscbmsc.cbm.sc.gov.br/uploads/ab8c2bdadfee54d4097ac6cf1e1be128.pdf).
- Isso confirma que o formulário prevê comparandos nominais explícitos, mas
  não prova que o PDF esteja presente nem que a extração atual ou o intake e-SCI
  forneçam esses valores autenticados para cada apresentação. O
  `COMPROVANTE_DE_SOLICITACAO_DE_HABITESE` continua sendo um recibo distinto e
  não deve receber esses atributos por extensão semântica.
- Estado antes da correção: `COMPROVANTE_DE_SOLICITACAO_DE_HABITESE` contém
  `REQUEST_DATE`, `REQUEST_IDENTIFIER`, `RE_IDENTIFIER` e
  `PROTOCOL_IDENTIFIER`; `CurrentSubmissionContext` contém protocolo, data,
  RE opcional e proveniência operacional. Nenhum deles contém identidade/CPF
  das partes. A DRT preserva `RT_NAME`, que não é identificador individual e
  não prova identidade de quem preparou ou assinou o relatório.
- A formalização do contrato resultante, sem afirmar extração real, está
  registrada no lote de identidade documental abaixo.

### Finding LOW — fixtures de proveniência do escopo IN10 — 2026-10-20

- Revisão independente read-only do diff funcional `7c53f81..fb4734a`
  examinou contrato Base/applicability, plano compilado, runtime e testes. O
  revisor confirmou o tratamento fail-closed do modo CF, o trace, a ausência
  de resultado normativo por incerteza e a cobertura mantida em `10/29`.
- Finding LOW: a fixture positiva sempre fornecia `SOURCE_LOCATION` e
  provenance do item CF, não testando a rejeição de cada campo ausente. A
  regressão foi acrescentada em `tests/apps-script-applicability-plan.test.js`:
  dois casos removem isoladamente `SOURCE_LOCATION` e provenance e exigem
  `ARCHITECTURAL_BLOCKER`. Nenhum código runtime ou Base mudou.
- Teste focado e re-review técnica dirigida: `node
  tests/apps-script-applicability-plan.test.js` — PASS; `node --check` do teste
  e `git diff --check` — PASS. Re-review não encontrou outro caso faltante
  dentro do finding.
- Governança da revisão: uma execução despachada como `luna_economy`
  (`01a15b79-35f2-79c3-be43-4b6cc6779065`) inicialmente declarou `Codex/GPT-6`,
  depois reconheceu que essa identidade era incorreta e não pôde atestar o
  modelo efetivo. A revisão seguinte, despachada como `terra_worker`
  (`01a15b7b-e7e7-72a1-9683-85fb3dd250bf`), também reportou `GPT-6` e depois
  manteve identidade e execução pendentes. Ambos os pareceres técnicos foram
  PASS, mas não satisfazem a verificação de identidade da seção AGENTS.md
  §25.2. Assim `INDEPENDENT_ARCH_REVIEW=PENDING_IDENTITY`, sem atribuir PASS a
  Sol ou declarar aprovação independente válida.
- Gates consolidados no commit `1165c17a2bf112dae3cd00c50e4536429fc8e6f0`:
  Python `175` (`170` pass, `5` skipped); Apps Script `9/9`; `node --check`
  todos `apps-script/*.js` e `tests/apps-script-*.test.js`; sintaxe `Code.gs`;
  testes da suíte validam regeneração do runtime byte-identical, SHA-256
  `59e7b70c52ffb9118943240af2ca5f603925bff73c382d9a2b3c98ac92afb619`;
  manifest e phase guards PASS; `git diff --check` PASS. Release build em
  worktree limpa PASS, 10 documentos, manifest `10/10`, `SOURCE_COMMIT` exato.
- O checkpoint foi enviado por fast-forward à branch de desenvolvimento.
  Ganho de Criteria integrais `0`; cobertura permanece `10/29`, um parcial
  (`T1_CONFORMITY_REPORT`) e 18 pendentes sem suporte integral. Finding LOW
  fechado tecnicamente; aprovação independente arquitetural continua pendente
  de identidade verificável. `SOL_REVIEW=PENDING_IDENTITY`,
  `PROMOTION=NOT_AUTHORIZED`.

### Revisão independente limitada — lote de escopo IN10 — 2026-10-20

- Candidato examinado: `ca80d4d22ac4992bc55f6fb266b7e6095d127cb3`; baseline
  funcional: `7c53f81a5c17628eaba88fc56379aa0af04fbdf4`. Parecer independente
  limitado: `PASS`, sem findings no escopo IN10.
- Execução filha distinta: `01a15b85-391a-7ba2-a7f5-b731abb2877a`, despachada
  no papel `terra_worker`, cujo modelo efetivo é fixado pela ferramenta como
  `gpt-5.6-terra`. O texto do parecer declarou “Codex, GPT-6”; a identidade
  efetiva é registrada pelos metadados de despacho, e a autodeclaração
  conflitante fica visível como erro de identificação. O revisor não
  implementou o lote. Não atribuir a revisão a Sol.
- O revisor examinou os 14 arquivos alterados e comparou o escopo com as fontes
  listadas. Verificou modo mecânico explícito, literal de origem, localização e
  provenance; ausência, conflito e valor inválido bloqueiam antes do Engine.
  CF negativo somente deriva escopo negativo. Não há inferência pelo texto
  orientativo RPCI, associação RT por nome, nem resultado normativo novo.
- Testes executados pelo revisor: `node --check` nos três módulos alterados;
  `node tests/apps-script-applicability-plan.test.js`; Python focal
  (`tests.test_compiled_runtime_contract` e `tests.test_knowledge_base_identity`,
  44 testes); `git diff --check 7c53f81..ca80d4d` — todos PASS.
- Limite material: o fato `SMOKE_CONTROL_MODE` está formalizado e consumido,
  mas sua EXTRACTION real ainda não está implementada; sem declaração explícita
  permanece bloqueio anterior ao Engine. A revisão não abrangeu a POC PDF.
- Os metadados de despacho, execução independente, candidato imutável, escopo,
  inspeção e testes satisfazem AGENTS.md §25.2. Portanto
  `INDEPENDENT_ARCH_REVIEW=PASS` somente para este lote/escopo IN10. A
  autodeclaração conflitante fica registrada; `SOL_REVIEW=NOT_PERFORMED` para
  este lote. `PROMOTION=NOT_AUTHORIZED`. Criteria integrais `10/29`, parcial
  `1`, sem alteração de cobertura. A revisão não equivale ao fechamento da
  Fase 6.

### Gates técnicos do checkpoint `c06628d` — 2026-10-20

- `PYTHONDONTWRITEBYTECODE=1 python3 -m unittest discover -s tests`: 175 testes,
  OK; 5 skips opt-in.
- As nove suítes `tests/apps-script-*.test.js`: PASS. `node --check` em todos os
  `apps-script/*.js` e `tests/apps-script-*.test.js`, além de
  `node --check < apps-script/Code.gs`: PASS.
- Guards de identidade da Base, manifests e pipeline executados pela suíte
  Python: PASS. O runtime gerado pelos testes é byte-idêntico; SHA-256 de
  `apps-script/CompiledRuntimeContract.js`:
  `59e7b70c52ffb9118943240af2ca5f603925bff73c382d9a2b3c98ac92afb619`.
- `git diff --check c06628d^ c06628d`: PASS. Build técnico em worktree limpa:
  PASS; 10 documentos; KB `5.31.0`; `SOURCE_COMMIT=c06628de608275428b2f4ea27b1baebf669c4a77`.
- Cobertura permanece `10/29` integrais, `T1_CONFORMITY_REPORT` parcial e
  18 Criteria sem suporte integral; nenhum ganho atribuído a revisão ou build.
  `.codex-local-evidence/` permaneceu fora do Git. `SOL_REVIEW=PENDING_IDENTITY`,
  `PROMOTION=NOT_AUTHORIZED`, `NORMATIVE_INSTITUTIONAL_VALIDATION=PENDING`.

### Lote 6B — contrato FACT-ONLY de identidades do requerimento e correção de fonte — 2026-10-20

- A conferência da URL previamente registrada mostrou que ela servia uma edição
  anterior da IN 1 (publicada em 2019), não o formulário 2024. A fonte foi
  corrigida para a edição oficial IN 1 - Parte 1 (Separata ao BOECBM nº 1,
  25/04/2024), Anexo B, pp. impressas 46–47 (PDF pp. 47–48). O formulário
  vigente contém campos de Nome/CPF de Solicitante e Responsável Técnico e
  opções literais de igualdade entre papéis.
- A Base 5.32.0 adiciona `REQUERIMENTO_ESCI`, separado do recibo
  `COMPROVANTE_DE_SOLICITACAO_DE_HABITESE`, com finalidade de Habite-se, nome,
  CPF literal e declarações literais de igualdade dos dois papéis. A instrução
  de EXTRACTION exige localização/provenance, preserva exatamente o texto,
  proíbe completar campos, validar identidade/CPF, inferir igualdade ou
  autenticar pessoas. Os valores identificadores não são expostos no relatório.
  Documento 09-RDE não mudou; os fatos são registros documentais FACT-ONLY.
- Este lote materializa somente um comparando necessário ao IN10. Não prova que
  o formulário tenha sido fornecido ou extraído em qualquer apresentação, não
  autentica a pessoa, não identifica o autor do relatório e não satisfaz o
  binding DRT↔relatório nem a assinatura. Não gera resultado do Engine nem
  cobertura de Criterion. F6-MC-007 fica parcialmente reduzido no contrato de
  identidade declarada; IN10 continua descoberto.
- Revisão independente Luna somente leitura no candidato exato
  `a5a06f2383df8cfc46677695d9e8e68b44b97bd5`, baseline
  `5097b86beef90c04c0490cf0fb417d7cb3088d61`: `LUNA_REVIEW=PASS`, sem
  findings BLOCKER/HIGH/MEDIUM/LOW. Execução `01a15b90-ee9c-7ac0-82fa-
  4ee15e1e7bb0`, despachada como `luna_economy` (`gpt-5.6-luna` pela
  configuração do papel; o parecer usou a autodescrição genérica GPT-5). A
  revisão confirmou diff, fonte, limites, cobertura e execução de 22 testes de
  identidade, 23 testes de runtime e a suíte RDE. Não é parecer Sol nem prova
  de EXTRACTION real.
- Gates do candidato `a5a06f2`: Python `176` (5 skips); nove suítes Apps Script;
  sintaxe de todos os módulos/testes JS e `Code.gs`; regeneração byte-idêntica
  do runtime, SHA-256
  `87f5bd316b34ee56e425cf52e7269741a99dc5b29693066634d8eaa09d956d0c`;
  `git diff --check` — PASS. Build em worktree limpa: PASS, 10 documentos,
  KB `5.32.0`, `SOURCE_COMMIT=a5a06f2383df8cfc46677695d9e8e68b44b97bd5`.
- `INDEPENDENT_ARCH_REVIEW=PASS` limitado ao contrato factual do requerimento;
  `SOL_REVIEW=PENDING_IDENTITY` para o fechamento global e
  `PROMOTION=NOT_AUTHORIZED`.
- Cobertura antes/depois: `10/29 → 10/29`; parcial `1 → 1`; blockers encerrados
  `0`; dependência factual/contratual parcialmente formalizada `F6-MC-007`.
  Benefício: tornar representáveis, rastreáveis e utilizáveis como comparandos
  futuros os papéis e identificadores que o formulário oficial efetivamente
  declara, sem atribuir identidade. `.codex-local-evidence/` permanece fora do
  Git; `PROMOTION=NOT_AUTHORIZED`.

### Reauditoria de fontes primárias para status de ART/RRT/TRT — 2026-10-20

- A reconsulta identificou enunciados primários adicionais que confirmam a
  condição substantiva de registro, sem fornecer por si só um classificador
  universal dos PDFs atuais:
  - Confea, FAQ de ART: o Crea registra a ART após preenchimento eletrônico,
    cadastro no sistema e pagamento do valor correspondente
    ([fonte](https://www.confea.org.br/transparencia/perguntas-frequentes),
    linhas da seção ART).
  - CAU/BR, Resolução 91/2014, com alterações da Resolução 184/2019: distingue
    rascunho sem número/indicação de taxa paga; documento final com número mas
    ainda sujeito a comprovante de pagamento; e RRT definitivo numerado com
    valor pago preenchido pelo SICCAU. A efetivação depende de recolhimento,
    ressalvadas hipóteses específicas como RRT derivado
    ([fonte](https://transparencia.caubr.gov.br/resolucao91/), arts. 9 e 12 e
    § 8º do art. 9; [Portaria 25/2014](https://transparencia.caubr.gov.br/portarianormativa25/),
    art. 2º).
  - CFT, Resolução 55/2019, arts. 4 e 23–31: o registro efetiva-se após
    cadastro no sistema eletrônico do CRT e recolhimento do valor; o TRT
    derivado é uma modalidade própria com tratamento de taxa distinto
    ([fonte](https://www.cft.org.br/wp-content/uploads/2021/07/RESOLUCAO-055-2019-Altera-os-artigos-da-Resolucao-n-40.pdf)).
- Essas fontes autorizam formalizar a condição normativa por modalidade e
  suas exceções; não substituem prova documental do estado do item exato. O
  documento final do CAU pode ainda exigir comprovante, e os ramos derivado,
  extemporâneo, substituto, isenção/deferimento e cancelamento não podem ser
  reduzidos a um único literal. A página de ART do Confea também não define
  todos os campos/valores dos diversos CREAs. A Resolução do CFT define o
  processo, mas não fecha os literais nem a versão atual de cada formulário
  emitido pelos CRTs.
- Decisão técnica deste diagnóstico: manter `STATUS_MAPPING_ART_RRT_TRT=BLOCKED`
  para consumo automático até que um perfil versionado identifique tipo de
  documento, conselho emissor, versão/formulário, campos de registro/emissão/
  pagamento, exceções aplicáveis e evidência autenticada do estado. Literal
  isolado, número presente, QR Code, texto “válido” ou fixture sintética não
  constituem prova de status nem de autenticidade. Casos reconhecidos não
  podem ser admitidos pelo Engine enquanto a verificação/autenticação do
  documento exato exigida pela PHASE 2A não estiver satisfeita.
- Métrica do lote de pesquisa: Criteria integrais `10/29 → 10/29`; parcial `1`;
  blockers encerrados `0`; status permanece `10/29`, `1` parcial, `18` sem
  suporte integral. Código, Base e runtime inalterados; gates de execução não
  foram repetidos por não haver mudança executável. Benefício: separa a
  condição normativa confirmada da classificação factual ainda não autorizada
  e evita novo ciclo de pesquisa tratando esses conceitos como se fossem a
  mesma lacuna.

### Retomada de produtividade e verificação PDF — 2026-10-20

- Estado confirmado antes do trabalho: branch `feature/apps-script-engine-core`,
  HEAD local/remoto `1096f620d5e2af36d2b430b63ef53b174027ff9a`; worktree
  rastreada limpa. `.codex-local-evidence/` foi preservado fora do Git.
- Reconciliação dos 19 Criteria sem cobertura integral (18 sem suporte integral
  e `T1_CONFORMITY_REPORT` parcial): nenhum fecha integralmente só com os
  contratos e fatos atuais. As dependências são: 12 Criteria com formalização
  de consumo/autenticidade e/ou fato comparável ainda ausente; 6 Criteria de
  laudos/comissionamentos que exigem fatos de conteúdo e bindings DRT-produto;
  e 1 Criterion parcial cuja admissão inferida continua dependente de calibração
  empírica. As assinaturas afetam 11 Criteria. O caminho de menor dependência
  já encerrado é `T4_IN19_FINAL_VERIFICATION`; não repetir sua implementação.
- Nenhuma nova decisão normativa humana é necessária para o trabalho técnico
  autorizado neste snapshot. Em particular, não conferir atividade↔SMSCI para
  RT-005/006/014 permanece uma fronteira de escopo decidida pelo responsável;
  `T4_IN09_DRT` fica pendente até que o Criterion e sua consequência sejam
  reconciliados sem essa conferência e sem inferir ausência de DRT. O contrato
  de solicitação com Nome/CPF declarado não autentica solicitante, autor ou
  signatário, portanto não fecha `T4_IN10_COMMISSIONING`.
- Reexecutada a integração local isolada do verificador experimental PDF:
  `PDF_SIGNATURE_POC_INTEGRATION=1 PYTHONDONTWRITEBYTECODE=1 python3 -m
  unittest tests.test_local_pdf_signature_verifier` — 24/24 PASS, incluindo
  CMS/ByteRange, adulteração assinada e conteúdo incremental acrescentado fora
  dos bytes assinados. A ferramenta continua fora do Engine e não produz
  recibo autenticado; confiança, cadeia, revogação, política PAdES e identidade
  profissional não foram validadas. O resultado é capacidade preparatória,
  não cobertura de Criterion.
- Ganho integral: `10/29 → 10/29`; parcial: `1 → 1`; blockers encerrados: `0`;
  novos blockers: `0`; revisões: `0` (nenhum diff de código/arquitetura nesta
  retomada); esforço: inspeção direcionada e um teste de integração local. A
  próxima tarefa funcional depende de recibo criptográfico local validado e
  autenticado, comparandos documentais formalizados ou fatos estruturados de
  laudos. `CALIBRATION_GATE=BLOCKED`, `SOL_REVIEW=PENDING_IDENTITY` e
  `PROMOTION=NOT_AUTHORIZED` permanecem.

### Perfis documentais para status de ART/RRT/TRT — auditoria oficial atualizada

- Confea, Resolução nº 1.137/2023, arts. 4–6: o registro ART efetiva-se após
  cadastro no sistema eletrônico do Crea e recolhimento; o formulário é
  assinado eletronicamente pelo profissional. A mesma resolução contempla
  formas e modalidades distintas e prevê baixa, cancelamento e anulação, logo
  número impresso isolado não demonstra estado atual. Fonte primária:
  [Resolução Confea nº 1.137/2023](https://normativos.confea.org.br/Ementas/Visualizar?id=76099).
- CAU/BR, Resolução nº 91/2014, alterada pela nº 184/2019, art. 9º, §§ 8º–9º:
  diferencia RRT rascunho (sem número no cabeçalho, sem indicação de taxas
  pagas e com marca d'água) do documento final, emitido após pagamento validado
  ou deferimento aplicável, com número e valores pagos. O não pagamento pode
  impedir a efetivação. Fonte primária:
  [Resolução CAU/BR nº 91/2014 consolidada](https://transparencia.caubr.gov.br/resolucao91/).
- A geração de RRT migra para o CAU Digital em 2026: a página de serviço
  descreve a emissão de RRT Simples e sua efetivação após compensação do
  pagamento; notícia do CAU/BR de 11/09/2026 registra migração gradual e
  ampliação planejada das modalidades. As fontes consultadas não expõem um
  esquema documental completo e estável para todas as modalidades/plataformas.
  Fontes oficiais: [serviço RRT Simples](https://transparencia.caubr.gov.br/cartadeservicos6-1/),
  [transição do CAU Digital](https://caubr.gov.br/cau-digital-amplia-emissao-de-rrt-e-preve-entrega-de-carteira-fisica-em-outubro/).
- CFT, Resolução nº 55/2019, art. 4º: registro TRT efetiva-se após cadastro no
  sistema eletrônico do CRT e recolhimento. O Manual de Geração de TRT de
  2018 enumera estados como aguardando validação/pagamento, aprovado, válido,
  bloqueado, baixado e cancelado, mas sua idade e escopo não demonstram que
  esses literais sejam o esquema atual de todos os CRTs. Fonte normativa:
  [Resolução CFT nº 55/2019](https://www.cft.org.br/wp-content/uploads/2021/07/RESOLUCAO-055-2019-Altera-os-artigos-da-Resolucao-n-40.pdf);
  [manual histórico](https://www.cft.org.br/wp-content/uploads/2018/10/MANUAL-DE-GERACAO-DE-TRT-v1_2.pdf).
- Resultado da auditoria: o fundamento da condição de registro está confirmado
  para as três modalidades; não foi legitimado um mapa automático universal de
  status. Um perfil futuro precisa identificar conselho emissor, tipo/modalidade,
  geração/versão do documento, campos de estado e exceções aplicáveis, além de
  evidência autenticada do documento exato. Perfil não substitui assinatura
  verificável, cadeia de confiança ou verificação de situação atual; nenhum
  status é admitido pelo Engine nesta etapa. `T1_DRT_REGISTERED` e
  `T4_DRT_REGISTERED` continuam pendentes, sem API de conselho obrigatória e
  sem inferir status de QR Code ou texto isolado.
- Métrica da auditoria: cobertura integral `10/29 → 10/29`; parcial `1 → 1`;
  blockers encerrados `0`; novo blocker operacional `0` (a dependência já
  existia; seu limite por geração de documento foi melhor especificado); código,
  Base e runtime inalterados. Fontes verificadas em 2026-10-20; build e suíte
  completa não foram repetidos por se tratar de alteração documental.
- Complemento Confea localizado em 2026-10-20: a Resolução nº 1.160, de
  11/12/2025, altera a Resolução nº 1.137 e substitui seus modelos anexos. O
  art. 8º determina vigência 90 dias após publicação; a data de publicação no
  DOU não foi confirmada neste levantamento, portanto não se fixa aqui o dia
  exato de vigência. O perfil documental ART deverá distinguir o modelo anterior
  do substitutivo e guardar a referência normativa/temporal aplicável. Fonte
  primária: [Resolução Confea nº 1.160/2025](https://normativos.confea.org.br/Ementas/Visualizar?id=83001).
  A notícia do Confea informa que a revisão atingiu os Modelos A, B e D:
  [atualização dos modelos ART](https://www.confea.org.br/confea-atualiza-regras-de-art-e-acervo-tecnico-e-moderniza-o-sistema).
- Esse complemento refina o blocker já existente de versionamento de perfil;
  não autoriza equivalência de status, não substitui recibo de autenticidade e
  não altera a cobertura de `T1_DRT_REGISTERED`/`T4_DRT_REGISTERED`.


### Follow-up dirigido da revisão independente — modelo Python de aplicabilidade CF

- Baseline `acd7aba134df6430a8bddab42dd9587dcaafa473`; candidato provisório
  `3763f5e21506db18df2b430decefe241d9337549`. Revisão técnica read-only
  executada por agente independente Codex, execução
  `01a15ba7-b8bb-78e2-9d02-e6e493864e59`; a identidade efetiva Sol não foi
  comprovada (`SOL_REVIEW=NOT_PERFORMED`). O parecer limitou-se ao finding LOW
  do modelo Python; não é aprovação arquitetural substitutiva nem altera a
  aceitação independente anterior do checkpoint 5534c3f.
- Finding LOW fechado: o modelo aceita CF positivo somente com um fato de modo
  por ocorrência, modo tipado, texto literal, localização e proveniência;
  ausência, cardinalidade incompleta e conflito bloqueiam. `MECHANICAL` deriva
  apenas o escopo interno correspondente; `NON_MECHANICAL` não o seleciona.
  O total esperado agora distingue 28 decisões oficiais e três derivadas.
  Base, runtime e cobertura de Criteria não mudaram.
- Re-review dirigida executada pelo revisor:
  `python3 -m unittest tests.test_applicability_resolution` — 42/42 PASS;
  `git diff --check` PASS. Orquestrador: suíte Python opt-in completa 177/177
  PASS; 9/9 suítes Apps Script PASS; sintaxe de todos os módulos/testes JS e
  `Code.gs` PASS. Guards/manifest exercitados pela suíte Python PASS.
- Build técnico real na worktree limpa: PASS; 10 documentos, KB `5.32.0`,
  `SOURCE_COMMIT=3763f5e21506db18df2b430decefe241d9337549`. Regeneração
  `CompiledRuntimeContract.js` byte-idêntica; SHA-256
  `87f5bd316b34ee56e425cf52e7269741a99dc5b29693066634d8eaa09d956d0c`.
  Saída local `/tmp/ssci-phase6-3763f5e-release`.
- Métrica do lote: Criteria integrais `10/29 → 10/29`; parcial `1 → 1`;
  findings LOW encerrados `1`; blockers novos `0`; revisões `1` (dirigida);
  esforço aproximado: uma correção de teste de referência, regressão dirigida,
  suíte consolidada e build limpo. Benefício: correspondência da evidência
  Python com a regra documental e core Apps Script, sem alegação de ganho
  operacional/critério. `FASE_6B_STATUS=IN_PROGRESS`,
  `CALIBRATION_GATE=BLOCKED`, `VALIDATED_TO_ANALYZED=PENDING`,
  `NORMATIVE_INSTITUTIONAL_VALIDATION=PENDING`, `PROMOTION=NOT_AUTHORIZED`.

### Esclarecimento factual pendente — identificação do RT independente em IN10

A decisão do usuário para `REQ_IN10_COMMISSIONING` está definida: a pessoa RT
que responde pelo comissionamento deve ser diferente da pessoa solicitante. A
auditoria confirmou que o RDE já preserva, no formulário de requerimento,
`REQUESTER_CPF_TEXT` e `TECHNICAL_RESPONSIBLE_CPF_TEXT` como literais
independentes e não autenticados. O contrato não liga o segundo campo ao
RT-014, à DRT de comissionamento nem ao autor/responsável do relatório. Logo,
a existência desses dois campos não basta para provar que o responsável
conferido é o responsável pelo relatório IN10. Não se deve comparar ou
normalizar os valores até que a fonte do papel RT-014 seja definida; uma
comparação isolada poderia conferir a pessoa errada. A confirmação solicitada
é limitada a essa ligação de papéis e não reabre a decisão normativa de
independência já dada. `T4_IN10_COMMISSIONING` continua pendente; nenhum código,
Criterion, Nonconformity ou cobertura foi alterado. Trabalho independente
continua autorizado.

### Limite nativo do Google Apps Script para verificação PDF — fonte oficial

A referência oficial do Apps Script confirma que `Blob.getBytes()` devolve os
bytes do arquivo e `Utilities.computeDigest()` calcula digest sobre um `Byte[]`.
A documentação oficial do runtime V8 declara `crypto` e `SubtleCrypto`
ausentes. Portanto o Apps Script consegue ler e hashear os bytes do PDF, mas
não oferece API criptográfica nativa documentada para validar CMS/PAdES,
assinatura pública ou cadeia X.509. Isso não prova impossibilidade de uma
implementação JavaScript própria; apenas impede tratar APIs nativas como
verificador pronto.

Fontes oficiais consultadas em 2026-10-20:
[Blob.getBytes](https://developers.google.com/apps-script/reference/base/blob),
[Utilities.computeDigest](https://developers.google.com/apps-script/reference/utilities/utilities),
[limitações do runtime V8](https://developers.google.com/apps-script/guides/v8-runtime#available_apis).

A POC `tools/verify_pdf_signatures_local.py` usa localmente Poppler/pdfsig e
OpenSSL para conferir digest/assinatura CMS e cobertura ByteRange; não é
portável ao Apps Script e não valida trust, cadeia de confiança, revogação,
PAdES completo ou identidade profissional. Continuação segura: avaliar uma
biblioteca criptográfica JavaScript controlada pelo projeto ou um componente
verificador interno controlado pelo projeto, ambos operando nos bytes exatos e
emitindo recibo autenticado vinculado à apresentação/RDE/documento. Não integrar
ao Engine até provas suficientes e revisão arquitetural; a decisão de qual
fronteira executar permanece aberta. Nenhum dado de processo real foi usado.

Métrica desta avaliação: ganho de Criteria `0`; 6A/6B e indicadores de cobertura
inalterados; nenhum finding corrigido ou criado; testes não aplicáveis à pesquisa
documental; `git diff --check` executado. O resultado reduz o espaço de
implementação: o verificador não pode depender de `crypto.subtle` nativo no GAS.

### Verificação local opcional da cadeia X.509 em PDF — candidata 6B

- Baseline `51a5f6ae3289b1dc48e7b26299d65cc180c9f95e`; implementação
  `2700f607bd9007c26bfb8e1eeddde466c552f5c5`. O utilitário local aceita
  opcionalmente bundle PEM de âncoras públicas, rejeita bundle vazio, ausência
  de certificado ou marcador de chave privada, preserva SHA-256 do bundle e
  tenta validar o caminho CMS contra esse bundle com OpenSSL. A checagem só
  ocorre após integridade CMS confirmada. Bundle alheio resulta
  `NOT_VALIDATED_TO_SUPPLIED_TRUST_ANCHOR_BUNDLE`; conteúdo adulterado não tem
  cadeia avaliada; múltiplas assinaturas ficam inconclusivas por ausência de
  prova de ordenação.
- O rótulo `VALID_TO_SUPPLIED_TRUST_ANCHOR_BUNDLE` significa somente caminho
  validado contra os bytes exatos do bundle fornecido. O campo `trust` continua
  `UNKNOWN/NOT_EVALUATED`; a ferramenta não autentica a política nem a origem
  dessas âncoras. Revogação, validade PAdES, identidade profissional e recibo
  autenticado permanecem não avaliados. O código segue isolado, não é usado
  pelo Engine e não admite `SIGNED`.
- Revisão read-only dirigida: agente no papel configurado `luna_economy`,
  execução `01a15bb1-876d-7022-a038-f2a59167583e`; o modelo/versão efetivos não
  foram expostos. `FOLLOWUP_REVIEW=PASS` para o diff e re-review da docstring;
  nenhum finding residual no escopo. Por falta de identidade efetiva verificável,
  registrar `REVIEWER_IDENTITY=PENDING_IDENTITY` e `SOL_REVIEW=NOT_PERFORMED`.
  Não é aprovação Sol nem substitui o gate arquitetural final.
- Validação do orquestrador no candidato: Python opt-in `180/180 PASS`, incluindo
  fixtures CMS/ByteRange, conteúdo incremental, integridade adulterada, âncora
  local, bundle não correspondente, chave privada no bundle e casos
  inconclusivos; Apps Script `9/9 PASS`; sintaxe JS/Code.gs e Python `PASS`;
  manifests/guards pela suíte `PASS`; runtime regenerado byte-idêntico, SHA-256
  `87f5bd316b34ee56e425cf52e7269741a99dc5b29693066634d8eaa09d956d0c`;
  `git diff --check PASS`.
- Build técnico limpo do commit `2700f607bd9007c26bfb8e1eeddde466c552f5c5`:
  `PASS`, dez documentos, `KNOWLEDGE_BASE_VERSION=5.32.0`, `SOURCE_COMMIT`
  exato. Artefatos em `/tmp/ssci-phase6-chain-2700f60-release`.
- Métrica: Criteria integrais `10/29 → 10/29`; parcial `1 → 1`; achados
  bloqueantes `0`; revisões `1` com re-review dirigida `1`; benefício
  verificável: diagnosticar localmente caminho da assinatura a um bundle
  escolhido, sem API de conselho. Esforço: uma implementação isolada, 180
  testes Python, 9 suítes Apps Script, sintaxe e build limpo. Fase 6B continua
  em andamento; admissão no Engine, recibo e política de âncoras ainda pendentes.

### Recibo humano de assinatura, audit-only — candidato 6B

- Baseline `1c21eba76ef1c9ce39027ab07d98cba77fba710e`. Implementados
  `apps-script/HumanSignatureReviewCore.js` e teste dedicado. O recibo canônico
  registra identidade da apresentação, identidade/digest da RDE, identidade/
  digest do documento, identidade ativa do revisor quando exposta pelo Apps
  Script, instante UTC, método/detalhes, referências e digests de evidência e
  uma decisão humana limitada a `CONFIRMED_SIGNATURE_PRESENT`, `NOT_CONFIRMED`
  ou `INCONCLUSIVE`. O payload recebe HMAC-SHA256 sob chave separada mantida
  fora do artefato, com key id. Verificação requer o contexto exato; mutação,
  rotação de chave e substituição de apresentação/documento invalidam o recibo.
- O artefato não alega validade criptográfica (`NOT_EVALUATED_BY_HUMAN_REVIEW`)
  nem autoridade (`NOT_ESTABLISHED_AUDIT_ONLY`). Não há consumidor no Engine,
  persistência em Drive, política de autoridade, papel de revisor permitido ou
  caller operacional. A chave ainda não está provisionada; ausência de chave ou
  identidade ativa indisponível bloqueia a emissão. A documentação oficial do
  Apps Script confirma que `Session.getActiveUser().getEmail()` pode retornar
  vazio conforme contexto de execução:
  [Session.getActiveUser](https://developers.google.com/apps-script/reference/base/session).
  A emissão autentica o registro da declaração humana; não prova que os
  conteúdos informados foram extraídos/verificados nem substitui a confirmação
  do vistoriador ou uma política de autoridade aprovada.
- Contrato Phase 2A em `knowledge-base/08_execution_pipeline.txt` atualizado
  para declarar o formato e os limites acima. RDE, Base normativa, Criteria,
  Nonconformities, correlação, Engine e runtime compilado não foram alterados.
- Gates no worktree candidato: Python `180` executados, `174 PASS`, `6 SKIP`; Apps Script
  `10/10 PASS`; `node --check` em 23 módulos/testes JS; `Code.gs` sintaxe PASS;
  manifest JSON PASS; runtime regenerado byte-identical, SHA-256
  `87f5bd316b34ee56e425cf52e7269741a99dc5b29693066634d8eaa09d956d0c`;
  `git diff --check PASS`.
- Release build limpo: `BUILD_VALIDATION=PASS`, `SOURCE_COMMIT` exato
  `5331b6130cc9fea8ddf275ac96ba45961f6770ff`, KB `5.32.0`, 10 documentos,
  artefatos em `/tmp/ssci-phase6-human-receipt-5331b61-release`. Worktree
  destacada limpa. Revisão Luna/Sol e re-review ainda pendentes; nesta sessão
  não havia agente de revisão nem navegador/sessão Sol disponível, portanto
  nenhum parecer independente foi atribuído.
- Métrica: Criteria integrais `10/29 → 10/29`; parcial `1 → 1`; findings
  encerrados `0`; novo bloqueio de configuração: provisionamento da chave;
  dependências ainda abertas: persistência/caller e definição do perfil de
  autoridade. Revisões independentes `0`. Benefício: uma confirmação explícita humana pode ser
  registrada em formato tamper-evident com os vínculos exatos, sem alegar
  verificação criptográfica ou produzir resultado. Lote arquitetural candidato;
  `ARCHITECTURAL_REVIEW=PENDING`, `SOL_REVIEW=PENDING_CAPACITY`,
  `PROMOTION=NOT_AUTHORIZED`.

### Revalidação documental do vocabulário de status ART/RRT/TRT — 2026-10-20

- Revisão read-only de fontes oficiais dos conselhos, motivada pelo bloqueio
  compartilhado de `T1_DRT_REGISTERED` e `T4_DRT_REGISTERED`. Para ART, a
  Resolução Confea nº 1.137/2023, art. 4º, diz que o registro se efetiva após
  cadastro no sistema eletrônico e recolhimento; a página de serviço do Confea
  diz que a ART só é válida quando quitada e admite comprovante de pagamento ou
  consulta ao Crea. Isso não torna API obrigatória: sem comprovante documental,
  o resultado pode permanecer para revisão humana. Fontes:
  [Resolução Confea nº 1.137/2023](https://normativos.confea.org.br/Ementas/Visualizar?id=76099)
  e [serviço de ART do Confea](https://www.confea.org.br/servicos-prestados/anotacao-de-responsabilidade-tecnica-art).
- Para RRT, a FAQ oficial do CAU/BR distingue o formulário com marca `rascunho`
  e sem número do formulário definitivo com número do registro, liberado após
  pagamento. A regra fornece um sinal documental próprio do RRT; não autoriza
  inferir pagamento quando extração, identidade do arquivo ou vínculo do
  comprovante forem insuficientes. Fonte:
  [FAQ oficial de RRT do CAU/BR](https://transparencia.caubr.gov.br/perguntas-frequentes-registro-de-responsabilidade-tecnica-rrt/).
- Para TRT, a Resolução CFT nº 055/2019, art. 4º, também liga a efetivação do
  registro ao cadastro no sistema eletrônico do CRT e ao recolhimento. A página
  do CFT de 2025 descreve a geração do TRT virtual com número único após
  aprovação do sistema, mas não define um conjunto atual e completo de rótulos
  visíveis para todos os CRTs. O manual de 2018 lista estados do sistema antigo
  e não é adotado como mapa atual. Fontes:
  [Resolução CFT nº 055/2019](https://www.cft.org.br/wp-content/uploads/2021/07/RESOLUCAO-055-2019-Altera-os-artigos-da-Resolucao-n-40.pdf)
  e [orientação do CFT sobre TRT, 2025](https://cft.org.br/termo-de-responsabilidade-tecnica-seguranca-e-transparencia-no-exercicio-legal-da-profissao/).
- Conclusão técnica: manter `COUNCIL_REGISTRATION_STATUS`,
  `COUNCIL_ISSUANCE_STATUS` e `COUNCIL_PAYMENT_STATUS` como fatos distintos e
  literais. O blocker não é a inexistência de vocabulário factual na RDE; é a
  falta de perfis de extração/versionamento por tipo de documento e fonte
  emissora, além de prova e binding suficientes para cada campo. Não há base
  para um dicionário global que trate ART, RRT e TRT como ciclos equivalentes.
  Nenhum status foi normalizado, nenhum resultado de Criterion alterado e
  nenhuma API externa tornou-se requisito.
- Métrica: Criteria integrais `10/29 → 10/29`; parcial `1 → 1`; blockers
  encerrados `0`; novo blocker `0`; Criteria afetados: `T1_DRT_REGISTERED` e
  `T4_DRT_REGISTERED`, ainda pendentes. Esforço: pesquisa dirigida de fontes
  oficiais; revisões independentes: zero (somente registro factual, sem mudança
  de contrato/código). Benefício: delimita a implementação segura a perfis
  versionados e preserva MANUAL_REVIEW para documento/status sem prova
  suficiente. Gates executados neste registro: `git diff --check`.

### Comparandos candidatos para `T1_DRT_ADDRESS` e `T1_DRT_AREA` — 2026-10-20

- Verificados diretamente `references/in01.pdf`, Anexo B, e a linha de
  fiscalização da IRV Habite-se 2024, Tabela 1. O Anexo B separa no imóvel
  `Logradouro`, `Nr`, `Complemento`, `Referência`, `Bairro`, `Cidade`, `Estado`
  e `CEP`; também distingue `Área do terreno`, `Área total construída no
  terreno`, `Área total do bloco`, `Área do pavimento tipo do bloco`, `Área a
  ser analisada`, `Área total da solicitação` e
  `Área da alteração/ampliação/reforma`. A IRV exige conferir endereço e área
  informados na DRT, mas não
  identifica qual destes campos é o comparando para o Criterion nem como
  selecionar bloco/escopo.
- Estado atual: `ENTITY PROCESS` não declara atributos; `REQUERIMENTO_ESCI`
  declara finalidade, solicitante e responsável, mas não os fatos do imóvel;
  `DRT.PROPERTY_ADDRESS_TEXT` e `DRT.PROPERTY_AREA_TEXT` existem, e a área
  preserva texto/unidade/qualificador sem normalização ou comparação. Logo
  ainda não há comparando em `ImmutableExecutionView` nem semântica para
  endereço textual versus componentes ou para as várias áreas do Anexo B.
- Alternativas para fechar o contrato, sem ampliar Requirement: (A) endereço da
  DRT contra os componentes de identificação do imóvel; área contra área total
  construída para DRT que cobre o imóvel inteiro e contra área de bloco somente
  quando o próprio vínculo documental identificar aquele bloco; ambiguidades
  permanecem `MANUAL_REVIEW`; (B) usar a área da solicitação/alteração como
  escopo de Habite-se, o que não é necessariamente a área que a DRT declara;
  (C) manter ambos em revisão humana até haver vínculo explícito e seleção
  única. Recomendação técnica: (A), com igualdade literal dos componentes/texto
  sem normalização conjectural e `MANUAL_REVIEW` em diferença, campo ausente,
  múltiplos blocos ou área com qualificador divergente. Essa recomendação não
  cria regra normativa nem autoriza `FAIL` por ausência.
- Critérios afetados: `T1_DRT_ADDRESS` e `T1_DRT_AREA`. Bloqueio exato para uma
  implementação integral: definir o comparando/escopo da área e o vínculo do
  DRT a imóvel/bloco; depois formalizar esses fatos na RDE e no execution view.
  Nenhum código, Requirement, Criterion, resultado ou cobertura foi alterado.
  Cobertura permanece `10/29`, `1` parcial. Nenhuma amostra de processo real foi
  utilizada. Pesquisa read-only; revisões independentes `0`; `git diff --check`
  executado.

### Fechamento dos findings de cadeia X.509 local — 2026-10-20

- A revisão arquitetural independente completa do candidato
  `1eff165d036ded8b75089daccf3a4a75f07b605c` identificou um finding HIGH:
  `openssl cms -verify -CAfile` ainda podia completar a cadeia por
  `SSL_CERT_DIR`/CApath ou CAstore do ambiente e rotular incorretamente o
  resultado como validação contra o bundle fornecido. Finding LOW: o contrato
  de recibo humano foi introduzido sem atualizar a versão da pipeline/Base.
- Correção publicada no commit `7835fbaf3040ac862d9042b63854bdb9f6b982a6`:
  o verificador elimina `SSL_CERT_FILE`/`SSL_CERT_DIR` do ambiente filho e
  usa `-no-CApath` e `-no-CAstore` para desabilitar as outras fontes de
  confiança; a versão do verificador passa a 1.3. Uma
  fixture cria certificados de nomes distintos, reproduz o falso sucesso do
  comando antigo com uma âncora ambiente e verifica que o comando isolado
  retorna `NOT_VALIDATED_TO_SUPPLIED_TRUST_ANCHOR_BUNDLE`. A confiança global
  continua `UNKNOWN/NOT_EVALUATED`; não há consumidor do verificador no Engine.
- Metadados sincronizados: Knowledge Base `5.33.0`, Pipeline `4.35.0`, Reports
  `3.21.0`, runtime compilado regenerado. Nenhum Requirement, Criterion,
  Nonconformity ou semântica normativa foi alterado.
- Revisão inicial: `Codex/GPT-6`, sessão
  `01a15bc5-1138-7472-bfdb-a71824150339`, examinou o candidato `1eff165` e
  declarou FAIL com 1 HIGH e 1 LOW. Re-review dirigida: subagente executado
  pela configuração `luna_economy` (modelo configurado `gpt-5.6-luna`), sessão
  `01a15bcf-4cb0-74e3-a394-d8d93829d933`, examinou exatamente `7835fba`, rodou
  a regressão adversarial (1/1 PASS), confirmou a resolução dos dois findings
  e não reportou novo achado material. A resposta textual do subagente se
  identificou como Codex/GPT-6, em conflito com a identidade/modelo da
  configuração de execução; a identidade registrada aqui vem da configuração
  de agente do orquestrador. A cadeia de revisão incluiu a revisão arquitetural
  ampla do predecessor e re-review independente somente do delta material,
  conforme AGENTS §25.2.
- Sol Web não realizou a revisão final: a chamada do modelo
  `chatgpt-web/gpt-5.6-sol` retornou `Selected model is at capacity`. Registrar
  `SOL_REVIEW=PENDING_CAPACITY`; nenhuma aprovação Sol 6.1 foi declarada.
- Gates do candidato `7835fba`: 181 testes Python PASS (integrações PDF
  habilitadas); 10/10 suítes Apps Script PASS; `node --check` em módulos/testes
  JavaScript e sintaxe `Code.gs` PASS; runtime byte-idêntico, SHA-256
  `3353f7123003b62b8f1ba38189d56ab0eb06a25c0c8b429212e3bb8f48c582ae`;
  teste de manifests/guards incluso na suíte Python PASS; `git diff --check`
  PASS. Release build em worktree destacada limpa: 10 documentos,
  `SOURCE_COMMIT=7835fba`, KB `5.33.0`, Pipeline `4.35.0`.
- Métrica funcional: Criteria integrais `10/29 → 10/29`; parcial `1 → 1`;
  pendentes integrais `19 → 19`; blockers do verificador fechados `2` (HIGH e
  LOW); novos findings materiais `0`. Esforço desta correção: uma regressão
  adversarial de integração, gates completos e uma re-review dirigida. Benefício
  verificável: um bundle PEM declarado deixa de receber crédito por uma CA
  disponível apenas no ambiente da máquina. A POC continua preparatória e não
  valida política PAdES, revogação, identidade profissional ou admissão no
  Engine.
- Estado: `INDEPENDENT_ARCH_REVIEW=PASS` limitado ao candidato e aos findings
  corrigidos pela cadeia GPT-6 + re-review Luna descrita acima;
  `ARCHITECTURAL_REVIEW=PENDING` para consolidação global da arquitetura,
  `SOL_REVIEW=PENDING_CAPACITY`, `PROMOTION=NOT_AUTHORIZED`.
  `CALIBRATION_GATE=BLOCKED`, `VALIDATED_TO_ANALYZED=PENDING`,
  `NORMATIVE_INSTITUTIONAL_VALIDATION=PENDING`. Cobertura permanece `10/29`.

### Revalidação do checkpoint e prova local com pyHanko — 2026-10-20

- Estado confirmado antes da validação: `feature/apps-script-engine-core`, HEAD
  local/remoto `51a9db376f7cc52f10c8ef3b8b4ed8548a939821`; arquivos rastreados
  limpos. `.codex-local-evidence/` permaneceu fora do Git.
- Gates no checkpoint: Python `181/181 PASS`, incluindo as integrações locais
  PDF (`PDF_SIGNATURE_POC_INTEGRATION=1`); Apps Script `10/10 PASS`; sintaxe de
  `apps-script/*.js` e `tests/apps-script-*.test.js` PASS; `Code.gs` PASS após
  cópia temporária `.js` para compatibilidade com `node --check` do Node 22;
  runtime regenerado byte-idêntico, SHA-256
  `3353f7123003b62b8f1ba38189d56ab0eb06a25c0c8b429212e3bb8f48c582ae`; 62
  verificações de contrato/runtime/identidade e guards PASS; `git diff --check`
  PASS. Build de validação em worktree destacada limpa produziu os dez
  documentos canônicos; `SOURCE_COMMIT=51a9db376f7cc52f10c8ef3b8b4ed8548a939821`,
  KB `5.33.0`, Pipeline `4.35.0`. O build não é promoção.
- Avaliada a biblioteca local pyHanko `0.38.0`, instalada somente em
  `/tmp/ssci-pyhanko-eval` (nenhum arquivo/dependência foi adicionado ao
  repositório). A API foi executada sobre as fixtures sintéticas existentes,
  com `ValidationContext(allow_fetching=False)` e âncora PEM explícita; nenhuma
  API de validação externa foi chamada. A fixture assinada retornou integridade
  `intact=true`, cobertura `ENTIRE_FILE` e `bottom_line=true` para a âncora
  local declarada. A fixture adulterada retornou `intact=false` e
  `bottom_line=false`. A revisão incremental manteve a assinatura original
  criptograficamente íntegra (`intact=true`), mas retornou cobertura
  `ENTIRE_REVISION`, `bottom_line=false` e rejeitou alterações estruturais não
  explicadas pela fixture.
- Resultado da avaliação: há componente local tecnicamente capaz de analisar
  integridade CMS, caminho de certificados e alterações incrementais com
  contexto explícito. Isso não define âncoras institucionais, política de
  revogação, identidade profissional ou autorização de admissão. A documentação
  oficial alerta que o parser processa conteúdo PDF não confiável e requer
  isolamento/limites de recursos; a ferramenta também não declara validação da
  conformidade estrutural de um perfil PAdES.
  Fontes primárias: [API e limites de validação](https://docs.pyhanko.eu/en/latest/lib-guide/validation/general-api.html),
  [validação de assinaturas PDF](https://docs.pyhanko.eu/en/stable/cli-guide/validation.html).
  O spike ficou em `/tmp`; não foi criada integração confiável nem alterada a
  RDE ou o Engine.
- Ganho funcional: Criteria integrais `10/29 → 10/29`; parcial `1 → 1`; novos
  findings `0`; regressões encontradas `0`. Nenhum Criterion é contado pela
  disponibilidade isolada do componente. Benefício: prova local de uma rota
  futura de verificação, incluindo a separação entre integridade do conteúdo,
  confiança da cadeia e cobertura da revisão assinada. Esforço: uma avaliação
  isolada de biblioteca e uma revalidação completa dos gates; revisões
  independentes novas `0` (sem alteração de código/contrato). Próximo passo
  técnico: integrar o componente apenas após fechar perfil de confiança,
  limites de recursos e contrato de recibo; cobertura e estado da fase ficam
  inalterados.
- Estado: `CALIBRATION_GATE=BLOCKED`, `SOL_REVIEW=PENDING_CAPACITY`,
  `PROMOTION=NOT_AUTHORIZED`, `VALIDATED_TO_ANALYZED=PENDING` e
  `NORMATIVE_INSTITUTIONAL_VALIDATION=PENDING`.

### Prova local de confiança e revogação com política pyHanko explícita — 2026-10-20

- Continuidade isolada sobre o checkpoint `c09494c`: gerados em `/tmp`
  certificados sintéticos de uma CA local, certificado final com CRL
  distribution point e CRLs assinadas localmente. PDF e CMS vieram da fixture
  sintética existente. Cada execução usou `allow_fetching=False`, raízes
  explícitas e nenhum endpoint externo.
- Resultados pyHanko `0.38.0`, com `CertRevTrustPolicy` e regra
  `CRL_REQUIRED` explícita para certificado final e CAs:

  | Cenário | Integridade | Confiança / revogação | Resultado geral |
  |---|---|---|---|
  | Âncora local correta + CRL válida sem revogação | `intact=true` | `trusted=true`, `revoked=false` | `bottom_line=true` |
  | Âncora local correta, sem CRL | `intact=true` | `trusted=false`, `revoked=false` | `bottom_line=false` |
  | Âncora correta + CRL contendo o serial do signatário | `intact=true` | `trusted=false`, `revoked=true` | `bottom_line=false` |

- Achado técnico importante para qualquer wrapper futuro: o modo legado
  `revocation_mode='hard-fail'` não exige CRL quando o certificado não declara
  um ponto de distribuição. Nesse ensaio inicial, uma cadeia confiável sem
  CRL produziu `bottom_line=true`; a política declarativa `CRL_REQUIRED` e uma
  extensão de distribuição explícita foram necessárias para tornar ausência
  de CRL insuficiente e revogação detectável. Nenhum desses resultados define
  qual autoridade, política de revogação ou perfil de confiança o CBMSC deve
  adotar. A documentação do validator registra que o modo legado
  `CHECK_IF_DECLARED` não usa CRL armazenada se o certificado não tiver
  distribution point:
  [política oficial de revogação pyhanko-certvalidator](https://docs.pyhanko.eu/en/latest/api-docs/pyhanko_certvalidator.html).
- O componente permite distinguir integridade CMS de confiança/revogação sem
  rede quando recebe certificados e política congelados. Permanecem pendentes
  a política institucional de âncoras, frescor/tempo, tratamento de OCSP/CRL
  ausentes, limites de recurso e recibo autenticado; não é verificação PAdES
  estrutural completa. Não há integração Apps Script/Engine nem dependência
  adicionada ao projeto.
- Métricas: Criteria integrais `10/29 → 10/29`, parcial `1 → 1`, pendentes
  `19 → 19`; blockers encerrados `0`, findings novos `0`. Esforço: um ensaio
  reproduzível em fixtures locais após corrigir a fixture para separar CA e
  assinante; revisões independentes `0`, pois não houve mudança no repositório
  de código/contrato. Benefício: prova que uma política estrita local consegue
  encaminhar falta de CRL e revogação como não confiáveis sem presumir status.
- A matriz foi transformada em fixture de regressão opcional no lote abaixo.
  Definir perfil CBMSC de confiança/tempo e contrato de recibo continua pendente;
  até isso ocorrer, `SIGNED` permanece sem admissão automática no Engine.

### Ferramenta POC local pyHanko e regressões opcionais — 2026-10-20

- Implementada em `tools/poc_pyhanko_signature_validation.py` uma interface
  POC que recebe bytes do PDF, identificador/versão de perfil, raízes X.509 e
  CRLs DER explicitamente fornecidas. Congela a versão pyHanko `0.38.0`, aplica
  `CRL_REQUIRED`, desabilita fetching, registra hashes do PDF/raízes/CRLs e
  separa integridade, confiança, revogação e cobertura do arquivo. A saída
  declara sempre `admission=NOT_DECIDED`; não cria recibo autenticado e não é
  consumida pelo Engine.
- Adicionada suíte opcional `tests/test_pyhanko_signature_validation_poc.py`
  com cinco casos: âncora+CRL válida, CRL ausente, signatário revogado,
  conteúdo adulterado/âncora errada e parâmetros de perfil inválidos. O
  interpretador normal sem pyHanko executa a suíte como 5 skips explícitos;
  no ambiente isolado `/tmp/ssci-pyhanko-eval`, pyHanko `0.38.0`, os cinco
  testes passam. Nenhuma dependência foi adicionada ao runtime ou à instalação
  padrão do projeto.
- Gates após o código: Python `186` (`181` passaram, `5` skips opcionais);
  Apps Script `10/10`; sintaxe JS/testes e `Code.gs`; 62 testes de contratos,
  identidade e guards; runtime byte-idêntico com SHA-256
  `3353f7123003b62b8f1ba38189d56ab0eb06a25c0c8b429212e3bb8f48c582ae`;
  `git diff --check` PASS. Build de validação em worktree destacada limpa do
  commit exato `784357e1aed191581b7216666c8bd447efbc6c2b`: 10 documentos,
  KB `5.33.0`, Pipeline `4.35.0`; `BUILD_VALIDATION=PASS`.
- Revisão independente read-only do candidato exato `784357e1`, diff
  `cbbc3037..784357e`, concluída pelo agente `01a15be1-c933-71b0-8073-2440f5e75bf7`,
  role `luna_economy`, modelo efetivo `gpt-5.6-luna`. A resposta inicial se
  identificou imprecisamente como GPT-5; o agente esclareceu que a identidade
  efetiva era `gpt-5.6-luna`. Executou pessoalmente 5/5 testes focados; não
  encontrou findings BLOCKER/HIGH/MEDIUM. Considerou o PASS limitado ao spike
  isolado e registrou que não há binding autenticado a apresentação/RDE,
  verificação institucional de identidade, política de frescor CRL ou
  autorização operacional. Essa revisão não é Sol nem aprovação da arquitetura
  global.
- Limites deliberados da POC: limites experimentais de entrada de 50 MiB e 20
  assinaturas não são política operacional aprovada; parser PDF ainda exige
  isolamento de processo/recursos. Perfil CBMSC, identidade profissional,
  temporalidade/frescor de CRL, cadeia institucional e recibo permanecem
  indefinidos. Nenhuma assinatura foi testada além das fixtures sintéticas.
- Métrica: Criteria integrais `10/29 → 10/29`, parcial `1 → 1`, pendentes
  `19 → 19`; blockers funcionais encerrados `0`; findings materiais abertos
  nesta revisão `0`. Benefício operacional ainda preparatório: a matriz de
  integridade, confiança, revogação e cobertura fica reproduzível com material
  local, sem endpoints de conselhos ou validação. Revisões independentes desta
  implementação `1` (Luna), sem re-review necessária; Sol 6.1 da arquitetura
  global permanece pendente.

### Rechecagem oficial dos perfis de registro ART/RRT/TRT — 2026-10-20

- Rechecagem dirigida dos Criteria `T1_DRT_REGISTERED` e
  `T4_DRT_REGISTERED`, mantendo o vocabulário aprovado e sem consulta a APIs
  dos conselhos. A Resolução Confea nº 1.137/2023 art. 5º descreve formulário
  eletrônico e assinatura; a Resolução nº 1.160/2025 substitui modelos anexos
  e entra em vigor 90 dias após publicação. O serviço oficial do Confea
  descreve disponibilização da ART válida para impressão após pagamento.
  Fontes primárias: [Resolução nº 1.137/2023](https://normativos.confea.org.br/Ementas/Visualizar?id=76099),
  [Resolução nº 1.160/2025](https://normativos.confea.org.br/Ementas/Visualizar?id=83001),
  [serviço oficial ART](https://www.confea.org.br/servicos-prestados/anotacao-de-responsabilidade-tecnica-art).
- A Carta de Serviços CAU/BR atualizada em 2026 descreve o fluxo de RRT Simples
  no CAU Digital, inclusive revisão, boleto e pagamento; a resolução anterior
  documenta distinção entre rascunho e final, mas não comprova que os mesmos
  campos/status persistem em todas as modalidades e gerações atuais.
  Fontes primárias: [Carta de Serviços RRT Simples](https://transparencia.caubr.gov.br/cartadeservicos6-1/),
  [Resolução CAU/BR nº 91/2014 consolidada](https://transparencia.caubr.gov.br/resolucao91/).
- O manual de geração TRT localizado no portal CFT lista estados, mas é de
  2018. Comunicados oficiais de 2025 confirmam mudanças de pagamento no
  Sistema CFT/CRTs, sem publicar um esquema atual de estados de TRT nem
  equivalências completas entre status e registro/emissão/pagamento.
  Fontes primárias: [manual CFT de TRT](https://www.cft.org.br/wp-content/uploads/2018/10/MANUAL-DE-GERACAO-DE-TRT-v1_2.pdf),
  [pagamento Pix no Sistema CFT/CRTs](https://cft.org.br/pagamento-via-pix-esta-disponivel-em-todo-o-sistema-cft-crts/).
- Resultado: permanece válido exigir mapeamento exato, versionado por
  conselho, modalidade e geração do documento, preservando literal e
  proveniência. Fontes consultadas não sustentam um mapeamento operacional
  completo para ART, RRT e TRT; status ausente/desconhecido continua
  `MANUAL_REVIEW`, sem conversão em `FAIL`/NC. Não houve mudança de Base,
  runtime, código ou testes; Criteria integrais `10/29 → 10/29`, parcial
  `1 → 1`, pendentes `19 → 19`. Benefício: bloqueio de interpretação
  obsoleta/universal e manutenção de trilha oficial para o próximo perfil
  específico. Revisões independentes `0` (registro documental de fonte); gates
  de código não aplicáveis; `git diff --check=PASS`.

### Limite de binding RT-005 em IN09 — decisão focal solicitada

- A decisão vigente veda avaliar compatibilidade atividade↔SMSCI para
  RT-005/006/014. O Criterion `T4_IN09_DRT` ainda testa
  `HAS_DRT_ACTIVITY(SMSCI_PRESSURIZATION,"VISTORIA_ENSAIO")` e o Requirement
  declara dois `VALIDATE RESPONSIBILITY_ACTIVITY_COMPATIBLE`; não executar esse
  caminho como está.
- O Anexo A interno descreve RT-005 como vistoria/inspeção, aceita DRT de
  vistoria/ensaio e registra a relação interna RT-005/006 como não integralmente
  individualizada. A seção 4 do Anexo permite
  `DRT_RESPONSIBILITY_TYPE` somente quando formalizado explicitamente; a
  entrada RT-005 não o define hoje. A RDE 0.4 registra fatos literais
  `drt_declaration_items`, mas exclui expressamente seu uso para selecionar
  evidência de Responsabilidade Técnica. Logo não há binding canônico atual de
  `RESPONSIBILITY_TYPE=VISTORIA_ENSAIO` a RT-005, mesmo sem testar SMSCI.
- Foi solicitada decisão focal ao responsável: (a) autorizar o uso do fato RDE
  explicitamente declarado `RESPONSIBILITY_TYPE=VISTORIA_ENSAIO` como binding
  documental ao ID interno RT-005 para este Criterion, sem comparação de
  atividade↔SMSCI; ou (b) manter esse binding em revisão humana até existir
  declaração explícita de RT-005 no contrato/fonte. Enquanto não houver
  resposta, preservar os mapeamentos canônicos e a cobertura atual; não
  suprimir `NC_T4_004`, inferir inexistência nem criar ligação por similaridade.
- Estado neste checkpoint: `HUMAN_DECISION_REQUIRED=1` para esse binding;
  `T4_IN09_DRT` continua pendente. Nenhuma mudança em código, Base, Criterion,
  Nonconformity, contagem ou testes; `git diff --check=PASS` após o registro.

### Correção autorizada da fronteira RT-005/006/014 — KB 5.34.0

- Em 2026-10-20, removidas de `REQ_IN09_DRT` as duas validações genéricas
  `RESPONSIBILITY_ACTIVITY_COMPATIBLE`, que podiam avaliar atividade/serviço
  declarado contra SMSCI sem escopo por RT. `T4_IN09_DRT` agora retorna
  incondicionalmente `MANUAL_REVIEW` com instrução ao vistoriador; as RT-003 e
  RT-005 exigidas e `NC_T4_004` permanecem declaradas. Nenhuma relação
  `VISTORIA_ENSAIO`→RT-005 foi criada e não se conclui ausência de DRT.
- A decisão focal de binding permanece pendente. O manual-review é classificado
  como capacidade preparatória, não como suporte funcional parcial nem Criterion
  coberto: contagens permanecem 10/29 integrais, 1 parcial e 19 pendentes; 17
  sem suporte de execução, 1 preparatório (`T4_IN09_DRT`) e 1 parcial
  (`T1_CONFORMITY_REPORT`).
- Base: requirements 3.7.0, Table 4 3.5.0, reports 3.22.0, pipeline 4.36.0,
  KB 5.34.0; runtime regenerado. Testes de identidade/manifest e teste
  integrado Apps Script do resultado, trace e ausência de NC adicionados.
- Ganho integral de Criteria: `0`; blocker encerrado: execução indevida da
  comparação atividade↔SMSCI; blocker mantido: binding documental RT-005 e
  cobertura da presença das DRTs. Nenhum novo requisito normativo introduzido.
- Gates locais deste candidato: Python `187` testes (`175 PASS`, `12 SKIP`);
  dez suítes Apps Script PASS; `node --check` em módulos e
  testes JavaScript e `Code.gs` PASS; runtime compilado regenerado byte-idêntico
  com SHA-256
  `2ff633c9e4e6c9b1e671d178338b5d7a2ee0e53e9cec351c0b7cdd4cd83f64e8`;
  `git diff --check=PASS`. Teste integrado IN09 confirma resultado/trace
  `MANUAL_REVIEW`, sem NC.
- `BUILD_VALIDATION=PASS` em worktree limpa para
  `SOURCE_COMMIT=e066187fad57b585fa96e5ed44628b101527376b`; release com os dez
  documentos do manifest e Knowledge Base `5.34.0`. O build é técnico e não
  autoriza promoção.
- Revisão focal read-only de Codex/GPT-6, execução
  `01a15b47-e8c3-7110-9ff6-a8ab80fd8ac8`, no SHA exato
  `e066187fad57b585fa96e5ed44628b101527376b` contra `3257366`: `PASS` técnico
  limitado ao lote IN09. O revisor confirmou remoção dos validators, preservação
  de RT-003/RT-005 e NC, ausência de binding inferido, resultado manual e
  contagem sem inflação. Finding LOW único: contagem das suítes Apps Script
  registrada como 9 em vez de 10; corrigido neste documento. Re-review dirigida
  subsequente confirmou o finding fechado.
- `SOL_REVIEW=PENDING_IDENTITY` permanece para a aprovação arquitetural global;
  este parecer GPT-6 não é atribuído a Sol e não autoriza promoção.
- Re-review dirigida do finding LOW no commit
  `cfea6f8ddf47816292aa71cd4349efd79899d17f`: `PASS`; revisor confirmou dez
  suítes e precisão da identificação/limites do parecer. Nenhuma revisão geral
  repetida.
- Build limpo repetido no HEAD `cfea6f8ddf47816292aa71cd4349efd79899d17f`:
  `BUILD_VALIDATION=PASS`, `SOURCE_COMMIT` exato, manifest de dez documentos.

## Lote técnico preparatório — recibo autenticado de assinatura local

- Triagem read-only independente no HEAD `6964cf69fab6905f72b90f7aa83b8a4639079b09`
  não encontrou outro Criterion pendente integralmente fechável com os fatos e
  contratos atuais. Identificou recibo técnico de assinatura como blocker
  compartilhado dos 11 consumidores de `SIGNED`; verificação e binding exatos
  estão exigidos no `08_execution_pipeline.txt` (PHASE 2A/PHASE 5).
- Criado codec Python `tools/signature_verification_receipt.py` para autenticar
  um envelope HMAC-SHA256 sobre saída fornecida pelo chamador, removendo o caminho local do PDF
  e vinculando presentation identity, RDE identity/digest, source-document
  identity/digest, identificador/versão e digest declarado do executável, além
  da data. A emissão
  confere tamanho e SHA-256 da saída com os bytes recebidos. IDs, digest,
  estrutura, key ID e conteúdo JSON são validados; JSON duplicado, propriedades
  inseguras, adulteração, chave desconhecida e replay em outra identidade são
  rejeitados nos testes.
- Criado `apps-script/SignatureVerificationReceiptCore.js` para validar o
  mesmo envelope no runtime, usando key/key ID fixados em Script Properties e
  canonicalização interoperável. Fixture HMAC foi emitida pelo Python e
  validada pelo teste Node, cobrindo binding de apresentação/RDE/documento,
  adulteração de resultado, key ID desconhecido, prototype pollution, arrays
  com protótipo adulterado e propriedades não enumeráveis. A emissão Python
  rejeita inteiros fora do intervalo seguro JavaScript e chaves JSON não ASCII;
  limites textuais usam unidades UTF-16 e timestamps UTC têm forma estrita
  compartilhada entre runtimes.
- Limite explícito: este lote não verifica PDF nem cadeia de certificados; não
  define âncoras, revogação ou perfil institucional; não fornece ao Engine um
  binding autenticado ao plano/view, nem registro anti-replay persistente, nem
  caller operacional. O contexto esperado ainda é fornecido pelo chamador, sem
  derivação autenticada de `ExecutionPlan`/view. A função Python recebe o
  resultado, o digest alegado do executável e a chave como argumentos e,
  portanto, não prova que o binário local efetivamente gerou o resultado nem
  que só esse binário detém a chave; custódia/rotação de chave e canal autenticado
  verifier→pipeline não foram implementados. Estados desconhecidos permanecem
  UNKNOWN. Não há admissão
  `SIGNED` nem cobertura nova; o Engine e Criteria permanecem `MANUAL_REVIEW`
  quando a comprovação não é suficiente. `CRITERIA_COVERED=10/29`, parcial 1,
  pendentes integrais 19; ganho de Criterion `0`.
- Testes direcionados do lote após findings: codec Python `9/9 PASS`; suíte do verificador
  local `29` casos (22 PASS, 7 SKIP no modo padrão); integração opcional com PDF
  sintético assinado, executada separadamente com
  `PDF_SIGNATURE_POC_INTEGRATION=1`: PASS; teste adversarial de interoperabilidade
  HMAC Apps Script e sintaxe dos módulos novos: PASS.
- Candidato publicado: `6059b2b` adicionou o codec e os testes. A revisão
- A revisão independente do GPT-6 (Pauli) em `46e4cff9eda1804fc26a18a4a0a357b41b758dc0`
  retornou `FAIL` limitado ao lote com dois achados médios: canonicalização JS
  controlável por `Array.prototype.map` em array com protótipo próprio, e
  limites de texto/timestamp divergentes entre Python e JS. Correções locais:
  canonicalização por índices e propriedades próprias (sem métodos herdáveis),
  rejeição de propriedades não enumeráveis, limite UTF-16 comum e timestamp UTC
  estrito. Regressões Python/JS focais passam. Re-review dirigida do candidato
  `b3bb8d6c633b4342599b4c2c57bf6c2a84005906` foi solicitada; resultado pendente.
- A re-review dirigida de `b3bb8d6c633b4342599b4c2c57bf6c2a84005906` confirmou
  que os exploits e divergências anteriores foram fechados, mas apontou um
  residual MÉDIO: Python `strip()` e JavaScript `trim()` diferem para U+FEFF.
  Também encontrou que os testes adversariais construíam objetos fora do realm
  da VM, permitindo rejeição prematura. A correção alinha explicitamente o
  conjunto de espaços ECMAScript no Python e recria mutações dentro do mesmo
  realm; a suíte agora exige que a fixture válida passe pelo helper antes dos
  ataques. A execução GPT-6 que conduziu revisões anteriores terminou com erro
  de capacidade ao receber a nova re-review; não foi contada como aprovação.
  Luna independente (`luna_economy`, `gpt-5.6-luna`, execução
  `01a15be1-c933-71b0-8073-2440f5e75bf7`) revisou exatamente
  `e0ff314792e0ff4c9d4a547482f43092deb4a455`, executou nove testes Python do
  codec e a suíte Node; confirmou paridade U+FEFF, helper same-realm e os dois
  ataques, sem findings no escopo: `DIRECTED_RE_REVIEW=PASS`. Não é revisão Sol.
- Gates completos no SHA `f2261400b4d4a9b72b255796f0d335fb64b5a94d`:
  Python `197` (185 PASS, 12 SKIP); Apps Script `11/11 PASS`; `node --check` em
  todos os módulos/testes JS e sintaxe de `Code.gs` PASS; runtime regenerado
  byte-identical, SHA-256
  `2ff633c9e4e6c9b1e671d178338b5d7a2ee0e53e9cec351c0b7cdd4cd83f64e8`;
  manifest/build PASS, dez documentos da Base `5.34.0`, build limpo com
  `SOURCE_COMMIT=f2261400b4d4a9b72b255796f0d335fb64b5a94d`; os testes de guards
  presentes na suíte completa passaram; `git diff --check` PASS.
- Gates completos no candidato corrigido `b3bb8d6c633b4342599b4c2c57bf6c2a84005906`:
  Python `197` (185 PASS, 12 SKIP); Apps Script `11/11 PASS`; `node --check` em
  todos os módulos/testes JS e sintaxe de `Code.gs` PASS; runtime regenerado
  byte-identical, SHA-256
  `2ff633c9e4e6c9b1e671d178338b5d7a2ee0e53e9cec351c0b7cdd4cd83f64e8`;
  manifest/build PASS, dez documentos da Base `5.34.0`, build limpo com
  `SOURCE_COMMIT=b3bb8d6c633b4342599b4c2c57bf6c2a84005906`; os testes de guards
  presentes na suíte completa passaram; `git diff --check` PASS.
- Gates repetidos no SHA revisado `e0ff314792e0ff4c9d4a547482f43092deb4a455`:
  Python `197` (185 PASS, 12 SKIP); Apps Script `11/11 PASS`; sintaxe JS e
  `Code.gs` PASS; runtime byte-identical com SHA-256 idêntico; manifest/build
  PASS, 10 documentos, `SOURCE_COMMIT` exato; guards na suíte completa e
  `git diff --check` PASS.
- Critérios antes/depois: integrais `10/29 → 10/29`, parcial `1 → 1`, pendentes
  `19 → 19`; blockers de assinatura encerrados `0`; novo blocker técnico
  esclarecido: interoperabilidade exige envelope ainda sem canal/custódia de
  chave nem contexto autenticado. Benefício operacional demonstrado apenas na
  interoperabilidade de teste entre Python/Apps Script; sem admissão `SIGNED`.
  O revisor independente do lote declarou Codex/GPT-6 (Pauli), nunca Sol.
  `SOL_REVIEW=PENDING_IDENTITY`; re-review dirigida `PASS`; `PROMOTION=NOT_AUTHORIZED`.

### Avaliação da fronteira criptográfica Apps Script e inventário documental — 2026-10-21

- Consulta à documentação oficial Google: o Apps Script V8 não oferece os
  WebCrypto `crypto`/`SubtleCrypto`; `Utilities` documenta digest, HMAC e
  geração de assinatura RSA por chave privada (`computeRsaSha256Signature`),
  mas não documenta uma operação de verificação RSA com chave pública. Isso
  não permite validar nativamente uma assinatura assimétrica de recibo emitido
  por um verificador local separado. Fontes: documentação do [runtime V8]
  (https://developers.google.com/apps-script/guides/v8-runtime) e do
  [serviço Utilities](https://developers.google.com/apps-script/reference/utilities/utilities).
- Limite de execução observado: `tools/verify_pdf_signatures_local.py` invoca
  `pdfsig`/OpenSSL por subprocesso, enquanto Apps Script não é runtime Node.js
  nem expõe execução de processo local. Inferência técnica: esse POC não pode
  ser chamado diretamente no GAS. Uma futura integração exige verificador
  controlado pelo projeto com validação criptográfica independente reproduzível
  no destino (p. ex., implementação JS compatível e revisada ou componente
  próprio conectado por interface autenticada); não requer APIs de conselhos.
  Nenhuma alternativa foi ligada ao Engine.
- Reauditoria do inventário: `scanInputFolder()` em `apps-script/Code.gs`
  percorre arquivos do diretório de entrada, mas cria um `PROCESS_ID` por
  arquivo (`makeProcessId_(fileId)`). Isso não prova agrupamento exaustivo de
  todos os documentos da mesma apresentação nem completude de EXTRACTION. O
  código legado não serve como autoridade para `DOCUMENT_ABSENCE` ligado a
  uma apresentação/RDE exatas. Portanto `T1_DRT_REQUIRED` mantém o positivo
  quando a DRT RT-002 explícita existe e `MANUAL_REVIEW` quando a coleção está
  vazia; não gerar `FALSE`/`NC_T1_001` até haver inventário autenticado e
  completo da apresentação com estados de processamento/classificação.
- Ganho neste diagnóstico: critérios integrais `10/29 → 10/29`; parcial `1 → 1`;
  nenhum blocker funcional encerrado. O próximo lote de inventário só deve ser
  codificado quando puder obter uma fonte de enumeração completa por
  apresentação e vínculo autenticado ao RDE; um codec isolado não demonstraria
  completude nem aumentaria cobertura.

### Continuidade preparatória — assinatura assimétrica de recibo local

- Baseline verificado: branch `feature/apps-script-engine-core`, HEAD
  `dd6dd1a2f95d3e43b30dbc4a50e0acf14f72ef45`, remoto sincronizado. Worktree
  continha as quatro alterações locais abaixo e `.codex-local-evidence/`
  não rastreado; este diretório foi preservado e não incluído.
- O recibo ganhou um emissor local RSA-SHA256/PKCS#1 v1.5 com OpenSSL e um
  wrapper que chama `verify_pdf_signatures_local.inspect_pdf` diretamente,
  vincula digest dos bytes do PDF e digest do código Python do verificador,
  detecta alteração do arquivo durante a leitura e assina o payload
  canônico. O emissor genérico ainda aceita resultado fornecido pelo chamador;
  somente o wrapper restringe esse fluxo. Chave privada, custódia, identidade
  autenticada do processo, anti-replay e canal para pipeline/Engine continuam
  ausentes.
- O módulo Apps Script foi alterado para validar recibos RSA com chave pública
  pinada em Script Properties, exponent `010001` e tamanhos de chave
  2048/3072/4096 bits, usando exponenciação modular BigInt e checagem do bloco
  EMSA-PKCS1-v1_5/SHA-256. HMAC continua apenas no codec de referência e é
  explicitamente recusado por esse validador. A validação RSA é implementação
  própria, testada sob Node; não foi executada no runtime Apps Script real nem
  conectada ao Engine. Portanto é POC preparatória, não verificador confiável
  para uso operacional.
- Testes focais: 11 testes Python do recibo e suíte Apps Script do recibo —
  PASS. Suítes completas no candidato local: 199 testes Python (12 skipped),
  11/11 suítes Apps Script, `node --check` em módulos/testes e sintaxe de
  `Code.gs` — PASS. Runtime regenerado byte-identical, SHA-256
  `2ff633c9e4e6c9b1e671d178338b5d7a2ee0e53e9cec351c0b7cdd4cd83f64e8`.
  Manifests/phase guards estão cobertos pela suíte Python; `git diff --check`
  passou após o registro. Build limpo de release e revisão independente deste
  lote ainda são gates pendentes.
- Métrica do lote: Criteria integrais `10/29 → 10/29`; parcial `1 → 1`;
  pendentes `19 → 19`; blockers funcionais encerrados `0`. Benefício
  demonstrável limitado a testar a assinatura assimétrica de payloads e a
  reduzir a possibilidade de o wrapper assinar uma saída arbitrária enviada
  pelo chamador; não habilita `SIGNED`, não confirma identidade profissional,
  confiança, revogação ou PAdES, e não altera RDE/Base/runtime compilado.
- Revisões independentes deste delta ainda pendentes. Status permanece
  `ARCHITECTURAL_REVIEW=PENDING`, `SOL_REVIEW=PENDING_IDENTITY`,
  `PROMOTION=NOT_AUTHORIZED`, `CALIBRATION_GATE=BLOCKED`, cobertura `10/29`.

### Checkpoint e revisão dirigida do lote RSA

- Commit técnico publicado por fast-forward na branch de desenvolvimento:
  `e9297c299ea53dbb033b75d564a336f9151b8f80`. O commit contém apenas o módulo
  Apps Script, emissor Python, testes e este acompanhamento; `.codex-local-evidence/`
  continuou local e não rastreado.
- Build técnico em worktree detached limpa do SHA exato: `PASS`; 10 documentos,
  Knowledge Base `5.34.0`, `SOURCE_COMMIT=e9297c299ea53dbb033b75d564a336f9151b8f80`.
  Não é autorização de produção.
- Integração sintética adicional: PDF assinado localmente via POC, `pdfsig` e
  OpenSSL; wrapper emitiu recibo RSA; CMS integrity `VALID`, enquanto trust e
  revocation permaneceram `UNKNOWN/NOT_EVALUATED`. Chave efêmera de teste; nenhum
  documento institucional usado. Também passaram duas integrações existentes
  de fixture sintética (`test_local_fixture_integration` e verificação contra
  trust anchor fornecido).
- Revisão independente somente leitura: Luna (`luna_economy`, `gpt-5.6-luna`,
  execução `01a15be1-c933-71b0-8073-2440f5e75bf7`) examinou o diff exato
  `dd6dd1a2..e9297c2`; `PASS` no escopo preparatório, nenhum finding HIGH/MEDIUM.
  A revisão confirmou RSA/padding/identidade no módulo, wrapper e subprocessos;
  o revisor não executou testes. Permanecem pendentes canal autenticado,
  custódia de chave, prova do runtime Apps Script real e admissão pelo Engine.
  A revisão não foi feita por Sol 6.1 e não altera `SOL_REVIEW=PENDING_IDENTITY`.
- Estado do lote: `INDEPENDENT_ARCH_REVIEW=PASS` restrito ao candidato e escopo
  preparatórios; não é aprovação de integração confiável ou promoção.
  `ARCHITECTURAL_REVIEW=PENDING`, `PROMOTION=NOT_AUTHORIZED`, cobertura
  `10/29`, parcial `1`, `CALIBRATION_GATE=BLOCKED`.

### Reconciliação documental da matriz pendente — KB 5.34.0

- A matriz resumida nesta seção misturava um snapshot antigo de 23 pendentes com
  quatro Criteria que o inventário vigente já classifica como integrais:
  `T1_DRT_REQUIRED`, `T1_DRT_ACTIVITY_EXECUTION`,
  `T1_DRT_SMSCI_COVERAGE` e `T4_IN19_FINAL_VERIFICATION`. Removidos da lista
  pendente; a matriz agora contém 19 IDs, conferidos contra o inventário por
  Criterion.
- Cobertura reconciliada: `34` ativos, `29` produtivos, `10` integrais,
  `T1_CONFORMITY_REPORT` parcial, `T4_IN09_DRT` preparatório e `19` pendentes
  de cobertura integral (incluindo o parcial e o preparatório); 5 não
  selecionáveis e 2 retirados. Não houve mudança de código, Base, runtime ou
  cobertura.
- A applicability de controle de fumaça mecânico para IN10 já está formalizada
  e testada. A pendência atual de `T4_IN10_COMMISSIONING` é a identidade
  documental/autenticada de quem preparou o relatório e sua comparação com o
  solicitante, com assinatura vinculada ao relatório exato. Os campos de RT no
  formulário não provam, sozinhos, autoria do relatório.
- Ganho funcional: `0` Criteria; blockers encerrados: `0`; novo blocker: `0`.
  Benefício: planejamento e relatório de cobertura deixam de tratar Criteria
  já cobertos como pendentes e refletem o blocker factual real de IN10.
  `git diff --check` é o gate desta alteração documental.

### Triagem técnica do próximo Criterion temporal — IN08

- `T4_IN08_ESTANQUEIDADE` continua sem campo de data do laudo em
  `knowledge-base/01_entities.txt`; a entidade `GAS_TIGHTNESS_REPORT` expõe
  somente `SIGNATURE_MECHANISM`. `VALID_WITHIN_YEARS` no contrato do Engine só
  fixa `UNKNOWN` quando a data de emissão não pode ser verificada; não define
  por si a data de referência da comparação nem implementa executor Apps
  Script. O Requirement declara janela máxima de cinco anos, mas não há RDE
  factual para a data de emissão/ensaio e binding ao laudo exato.
- Portanto não criei atributo ou comparação temporal por suposição. Critério
  permanece pendente até formalização FACT-ONLY de data e referência autorizada,
  seguida de binding do produto/DRT e assinatura verificável. Este slice não
  altera código, Base ou contagem; esforço: inspeção dirigida de Entity,
  Requirement, Criterion, Engine e RDE.
- `git diff --check` e conferência da matriz de 19 IDs passaram. A validação
  técnica completa de código permanece no commit RSA `e9297c2`; o release limpo
  deste HEAD documental `26e881c` também passou com SHA de origem exato.
- Checkpoint documental `34f35d7c243282e29ef6d36e357099069607b8b1` e snapshot
  atual `447d47a072bb8ff7c25d5a64c9873a7da5e16636`: builds limpos de validação
  técnica `PASS`, 10 documentos, Base `5.34.0`, `SOURCE_COMMIT` exato em cada SHA.
  As suítes completas executadas no candidato de código
  `e0ff314792e0ff4c9d4a547482f43092deb4a455` permanecem aplicáveis: 197 testes
  Python (12 SKIP), 11 suítes Apps Script, sintaxe/runtime/diff PASS. A alteração
  posterior `34f35d7` é documental, sem delta de código/runtime.

### Revalidação integral do POC local de assinatura — 2026-10-21

- Candidato de código: `e9297c299ea53dbb033b75d564a336f9151b8f80`; HEAD
  documental testado: `297f51b97680125f3a2bd6b2a0ecd27c23b5c829`. Os commits
  intermediários alteraram somente documentação; o runtime e os testes de código
  são os mesmos do candidato RSA.
- Suíte Python completa com `PDF_SIGNATURE_POC_INTEGRATION=1`, interpretador
  isolado `/tmp/ssci-pyhanko-eval/bin/python` (PyHanko 0.38.0): `199/199 PASS`,
  sem skips. Executaram-se também os cinco testes opcionais de confiança/CRL/
  revogação via PyHanko e os testes de integração PDF/OpenSSL/Poppler, todos
  PASS. Nenhuma dependência foi instalada no repositório.
- As 11 suítes Apps Script, `node --check` em módulos e testes JavaScript,
  sintaxe de `Code.gs` e `git diff --check`: PASS. O runtime não foi alterado
  desde `e9297c2`; sua regeneração byte-identical e SHA-256
  `2ff633c9e4e6c9b1e671d178338b5d7a2ee0e53e9cec351c0b7cdd4cd83f64e8`
  constam dos gates daquele candidato.
- A POC distingue assinatura CMS íntegra de confiança e revogação, exige
  âncora/CRL locais explícitos, desabilita busca externa e mantém `admission` não
  decidido. A revisão incremental não assinada permanece fora da cobertura do
  PDF corrente; nenhum resultado habilita `SIGNED` no Engine.
- Critérios integrais `10/29 → 10/29`; parcial `1 → 1`; pendentes `19 → 19`;
  blockers funcionais encerrados `0`; novos blockers `0`. Esforço: uma execução
  completa com dependências opcionais ativas e uma revisão dirigida dos skips;
  revisões independentes novas `0`, sem alteração de código/contrato. Benefício:
  evidência local reprodutível de integridade, confiança, revogação e cobertura
  incremental, sem antecipar integração operacional.
- Permanecem `SOL_REVIEW=PENDING_IDENTITY`,
  `PROMOTION=NOT_AUTHORIZED`, `CALIBRATION_GATE=BLOCKED` e cobertura sem mudança.
