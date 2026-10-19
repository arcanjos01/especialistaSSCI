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
| D | Critérios produtivos restantes, por prioridade do pedido | Cobertura reconciliada; fontes oficiais; applicability e evidence contracts | Fixtures positivos/negativos/insuficientes; trace; readiness; cobertura demonstrada | `IN_PROGRESS; T1_DRT_REQUIRED=PARTIAL; T1_DRT_ACTIVITY_EXECUTION=PARTIAL; T1_CONFORMITY_REPORT=PARTIAL; assinatura reclassificada; 6 cobertos, 3 parciais e 23 pendentes de cobertura integral (incluem os parciais)` |
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

### Análise de produtividade e trust boundary — antes da próxima onda

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

Fonte reconciliada em 2026-10-16: HEAD remoto `1b1503266abca949a25d37231fcddc3b8198208b`
mais o lote local não commitado de autenticação do `evaluateCriterion`.
Knowledge Base `5.25.0`: 34 Criteria ativos, 29 produtivos, 6 integralmente
cobertos, 4 parciais e 23 pendentes integrais; 5 não selecionáveis e 2
retirados ficam fora da matriz. Os quatro parciais são `T1_DRT_REQUIRED`,
`T1_DRT_ACTIVITY_EXECUTION`, `T1_CONFORMITY_REPORT` e
`T1_DRT_SMSCI_COVERAGE`. Nenhum dos 23 pode ser declarado integralmente coberto
apenas com o estado atual; cobertura parcial ou caminho positivo não equivale
a suporte completo.

Nenhum dos 23 está integralmente implementável somente com o estado atual:
alguns já têm caminho positivo ou contratos declarativos, mas não completam os
casos positivo, negativo/insuficiente e readiness com rastreabilidade. As
classes abaixo não são exclusivas: `T` = formalização/consumo técnico de
contrato existente; `F` = fato documental tipado ou comparando ainda ausente;
`H` = decisão humana sobre autoridade normativa; `C` = calibração ou integração
externa. `T/F/H/C` indica todas as dependências encontradas para completar o
Criterion, não uma autorização para inferir fatos ou resultados.

| Criterion | Classe | Dependência concreta que falta para cobertura integral |
|---|---|---|
| `T1_DRT_REQUIRED` | `T` | Binding por RT-002 já prova presença; fechar seleção/consumo de todos os vínculos documentais e estados de conflito/insuficiência sem tratar vínculo ausente como prova de ausência de DRT. |
| `T1_DRT_REGISTERED` | `T+F` | Consumir o status de registro da DRT exata para cada RT requerida; faltam vocabulário factual verificável e binding sem confundir registro, emissão e pagamento. |
| `T1_DRT_SIGNED` | `T+F` | Binding DRT/RT e fato que demonstre assinatura verificável; `SIGNATURE_MECHANISM` textual, isoladamente, não autentica assinatura. |
| `T1_CONFORMITY_REPORT` | `T+C` | O ramo de associação explícita exata existe no candidato; admissão de vínculo inferido ainda depende de calibração empírica válida e caller de produção. Sem esses gates, manter inferências em revisão humana. |
| `T1_DRT_RI_LEGAL_ENTITY` | `F+T` | Identidade documental suficiente da pessoa jurídica na DRT e no processo, mais comparação restrita à mesma RT; nome ou diferença de CNPJ filial/matriz não prova pessoa distinta. |
| `T1_DRT_RT_NAME` | `T+F` | Ligação explícita da DRT e do produto que satisfaz a mesma RT e identidade de RT presente em ambos; sem associação por semelhança de nomes. |
| `T1_DRT_ADDRESS` | `F+T` | Endereço factual comparável do processo/imóvel, ligado à DRT; contrato para diferença verificável e insuficiência sem normalização conjectural. |
| `T1_DRT_AREA` | `F+T` | Área factual comparável do processo/imóvel, unidade e qualificadores preservados, ligada à DRT; sem comparação textual inventada. |
| `T1_CONFORMITY_REPORT_SIGNED` | `F+T` | Evidência de assinatura verificável vinculada ao relatório exato; o campo textual atual só registra o mecanismo declarado. |
| `T1_DRT_ACTIVITY_EXECUTION` | `T` | O literal individual `EXECUÇÃO` já pode sustentar o positivo; fechar binding por RT e estados de ausência, multiplicidade e conflito permitidos pelo contrato, sem mapear atividade por nome parecido. |
| `T1_DRT_SMSCI_COVERAGE` | `T+F` | Consumir a declaração conjunta literal e vinculá-la ao `WORKLIST.SMSCI` canônico e à RT requerida; não converter texto livre em cobertura. |
| `T4_DRT_REGISTERED` | `T+F` | Mesma dependência de status factual/binding de `T1_DRT_REGISTERED`, para a unidade produtiva da Tabela 4. |
| `T4_DRT_SIGNED` | `T+F` | Mesma dependência de assinatura verificável/binding de `T1_DRT_SIGNED`, para a unidade produtiva da Tabela 4. |
| `T4_IN07_COMMISSIONING` | `T+F` | Consumir DRT-produto-SMSCI-atividade explícitos para o relatório SHP e fato verificável de assinatura; sem cobertura inferida. |
| `T4_IN08_ESTANQUEIDADE` | `T+F` | Além do binding de cobertura e assinatura, obter datas documentais estruturadas do laudo e referência temporal autorizada para o limite de cinco anos. |
| `T4_IN09_DRT` | `T+F` | Comparar declarações explícitas de execução e vistoria/ensaio, DRTs e SMSCI de pressurização com tokens autorizados; preservar múltiplos profissionais e insuficiência. |
| `T4_IN09_TEST_REPORT` | `T+F` | Fatos individualizados sobre os componentes requeridos pelo art. 122, vínculo explícito DRT-produto-SMSCI-atividade e assinatura verificável; não completar itens de normas NBR por inferência. |
| `T4_IN09_CHECKLIST` | `F+T` | Evidência verificável de assinatura na checklist exata e consumo pelo predicado de produto já declarado. |
| `T4_IN10_COMMISSIONING` | `F+T` | Decisão operacional do usuário: basta a equipe/profissional RT do comissionamento ser distinta da pessoa solicitante; faltam fatos estruturados e autenticados para identificar esses papéis, distinguir controle de fumaça mecânico e vincular DRT/assinatura ao relatório. |
| `T4_IN12_COMMISSIONING` | `T+F` | Consumir cobertura explícita DRT-produto-SMSCI-atividade do relatório SDAI e evidência verificável de assinatura. |
| `T4_IN15_COMMISSIONING` | `T+F` | Consumir cobertura explícita DRT-produto-SMSCI-atividade do relatório sprinkler e evidência verificável de assinatura. |
| `T4_IN18_CMAR` | `F+T` | Evidência verificável de assinatura na declaração CMAR e consumo pelo predicado já declarado; não criar RT-007 autônoma. |
| `T4_IN19_FINAL_VERIFICATION` | `T+F` | Binding da DRT de verificação final ao serviço/atividade autorizados para RT-007; manter separado de checklist IN09 e sem criar associação por nome. |

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
que identifiquem solicitante e RT autor do relatório, além de um fato que
distinga controle de fumaça mecânico de outros casos de `SMSCI_SMOKE_CONTROL`.
Até esses fatos existirem, não produzir resultado conclusivo, `FAIL` ou NC por
inferência; manter revisão humana. Não generalizar esta regra para outros
SMSCI. `NORMATIVE_INSTITUTIONAL_VALIDATION` da correlação continua
separadamente `PENDING`.

### Dependências compartilhadas e lotes prioritários

| Ordem | Contrato compartilhado | Critérios potencialmente afetados | Motivo/limite |
|---|---|---|---|
| 0 | Fechar o candidato já aberto: execução exata da associação documental explícita e binding autenticado à apresentação/RDE | `T1_CONFORMITY_REPORT` | Corrige a trilha de correlação já em andamento; não gera cobertura integral sem calibração válida para inferências. Revisar uma vez após gates completos; re-review somente dos achados. |
| 1 | Predicado compartilhado de estado DRT `REGISTERED`, com binding por RT e preservação separada de registro, emissão e pagamento | 2: `T1_DRT_REGISTERED`, `T4_DRT_REGISTERED` | Menor alcance, porém usa os três fatos já tipados na RDE e tem regra-fonte explícita na IRV. Próximo lote de menor dependência após formalizar vocabulário exato; não assumir que fixture seja vocabulário canônico. |
| 2 | Consumidor de declarações RDE 0.7: DRT↔produto↔SMSCI↔atividade, endpoints exatos, múltiplas responsabilidades e insuficiência | Potencial teórico até 8: `T1_DRT_ACTIVITY_EXECUTION`, `T1_DRT_SMSCI_COVERAGE`, `T4_IN09_DRT`, `T4_IN07_COMMISSIONING`, `T4_IN08_ESTANQUEIDADE`, `T4_IN09_TEST_REPORT`, `T4_IN12_COMMISSIONING`, `T4_IN15_COMMISSIONING` | RDE não determina cobertura; `DRT_COVERS` está definido no Engine, mas os Criteria de produtos exigem RT-014/RT-006 e RT-005, cujas compatibilidades/literais não estão completamente mapeadas no catálogo. Sem essa formalização autorizada, novo consumidor não aumentaria cobertura segura. Não prova assinatura, conteúdo ou validade temporal. |
| 3 | Evidência de assinatura verificável com provenance e binding ao documento exato, consumível por DRT e produto | Até 11: `T1_DRT_SIGNED`, `T4_DRT_SIGNED`, `T1_CONFORMITY_REPORT_SIGNED`, `T4_IN07_COMMISSIONING`, `T4_IN08_ESTANQUEIDADE`, `T4_IN09_TEST_REPORT`, `T4_IN09_CHECKLIST`, `T4_IN10_COMMISSIONING`, `T4_IN12_COMMISSIONING`, `T4_IN15_COMMISSIONING`, `T4_IN18_CMAR` | Maior alcance; requer contrato/fato de verificação ou integração autorizada. Não aceitar nome textual do mecanismo como prova. Avaliar capacidade local antes de assumir serviço externo. |
| 4 | Comparandos tipados de pessoa jurídica, RT, endereço e área vinculados a processo/DRT/produto | 4: `T1_DRT_RI_LEGAL_ENTITY`, `T1_DRT_RT_NAME`, `T1_DRT_ADDRESS`, `T1_DRT_AREA` | Fonte define comparações conservadoras; fatos do processo e relações exatas precisam existir. Bloquear resultado conclusivo se faltarem. |
| 5 | Datas e itens de relatório estruturados com origem, associação ao produto e escopo de exaustividade | 2 principais: `T4_IN08_ESTANQUEIDADE`, `T4_IN09_TEST_REPORT`; também requisitos de laudos/comissionamentos relacionados | Não inventar datas, conteúdo NBR ou presença de itens não extraídos. |
| 6 | Fatos RDE autenticados de solicitante e RT autor do relatório, mais aplicabilidade mecânica | 1: `T4_IN10_COMMISSIONING` | A decisão operacional do usuário está registrada; não há atributos estruturados para provar os papéis/identidades nem distinguir controle mecânico. Manter revisão humana até formalizar e extrair esses fatos. |
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

- A verificação delimitada Luna confirmou que o Criterion não pode ser fechado
  integralmente sem contrato adicional para cardinalidade, conflito e
  insuficiência. O binding autenticado de RT-002 comprova presença positiva;
  binding vazio não carrega semântica de ausência da DRT. A fixture de
  multiplicidade RT-002 atual resulta `TRUE`, embora não exista contrato que
  determine quando múltiplas evidências são inequívocas ou exigem
  `MANUAL_REVIEW`.
- Alternativas: (A) formalizar no contrato da Base/RDE a semântica para múltiplas
  DRTs e completude da coleção; (B) deixar o caso múltiplo e a ausência de
  binding em `MANUAL_REVIEW`. Recomenda-se B até A ser autorizada. Não se altera
  o Requirement nem se converte ausência em FAIL/NC_T1_001.
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
