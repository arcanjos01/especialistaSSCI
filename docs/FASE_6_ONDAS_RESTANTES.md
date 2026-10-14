# Fase 6 — acompanhamento das ondas restantes

Status de acompanhamento: `IN_PROGRESS`
Baseline reconciliado: `f826ac7d453b7744fed11bed23824acac9fcbb72`
Branch: `feature/apps-script-engine-core`
Knowledge Base no baseline: `5.16.0`; Onda A: `5.17.0`; checkpoint Onda B:
`5.19.0`, commitado e enviado; Onda D prioridade 1 em `140f888`.

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
- Checkpoint `ResponsibilityEvidenceBinding` / `ImmutableExecutionView` está
  presente e fechado no baseline, com revisão Sol `PASS`; manter intacto.
- Reconciliação do runtime candidate: 34 Criteria ativos, 29 produtivos, 5
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
| B | Correlacionador determinístico e fronteira autenticada ao Engine; sem fornecedor de IA | Onda A | Gates completos; ataques adversariais; revisão intermediária aceita pelo usuário; revisão final após Onda D | `GPT6_REVIEW=PASS_ACCEPTED_BY_USER; Onda B FINDINGS_OPEN=0; calibração e integração real bloqueadas/pendentes; revisão final da fase pendente` |
| C | Contrato e fixtures de disclosure do relatório, sem implementar Fase 8 | Onda A/B | Aviso obrigatório e rastreabilidade testados | `REPORT_DISCLOSURE_CONTRACT=READY`; `LUNA_REVIEW=PASS`; integrado à revisão Sol da Onda A/C |
| D | Critérios produtivos restantes, por prioridade do pedido | Cobertura reconciliada; fontes oficiais; applicability e evidence contracts | Fixtures positivos/negativos/insuficientes; trace; readiness; cobertura demonstrada | `IN_PROGRESS; PRIORIDADE 1 T1_DRT_REQUIRED=PARTIAL; T1_DRT_ACTIVITY_EXECUTION=PENDING; 19 sem suporte integral; pending=20; GPT6_REVIEW=PASS_ACCEPTED_BY_USER` |
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
| Revisão final solicitada (não Sol) | candidate `a07a1d48e0d12e26c2961f13be2a0232e4068a4d` | `FAIL` de GPT-6; não conta como `SOL_REVIEW`; contagem reconciliada pelo revisor: 34/29/5/2/9/1/20 | Achados registrados como revisão GPT-6, não findings Sol. A terceira revisão intermediária confirmou os fixes no candidate atual; detecção factual ou calibração reais seguem ausentes/BLOCKED. |
| Onda B, re-revisão GPT-6 | snapshot temporário `3dca687b5702af7e4c8bf55760546bd81b1a1cc4` | `FAIL`; não é revisão Sol 6.1 | Findings prévios de calibração, autenticação de assessment, concorrentes e provenance foram aceitos como corrigidos. Finding residual: `conflictFlags` podia ser removido mantendo assinatura. O candidate atual vincula também esses flags e adiciona teste adversarial; gates integrais e nova re-revisão pendentes. Nenhuma fixture demonstra `ADMITTED`. |
| Onda B, terceira re-revisão GPT-6 | snapshot temporário `48e53d5d6ab865e35b31c19a20c2b846e693beda` | `PASS`; não é revisão Sol 6.1 | Findings de calibração empírica, assinatura de conflito/score/flags, inventário completo, provenance e monkeypatch encerrados. 141 testes Python; 9 suítes Apps Script; sintaxe, runtime, diff check e release build de 10 documentos PASS. Calibração real segue ausente/BLOCKED. |
| Onda B, auditoria Codex/GPT-6 subsequente (não Sol) | snapshot da árvore local comparada byte a byte com `48e53d5d6ab865e35b31c19a20c2b846e693beda`; tracker tinha divergência | `SOL_REVIEW=PENDING`; 2 P2 encontrados, agora corrigidos localmente; revisão intermediária atual pendente | Separação de chave de autoridade de calibração e chave de configuração adicionada com teste; resumo do tracker reconciliado. Nenhum arquivo foi alterado pelo revisor. A revisão identificou explicitamente identidade efetiva Codex/GPT-6, portanto não é aprovação Sol 6.1. |
| Onda B, re-revisão GPT-6 | árvore local antes do hardening canônico | `FAIL`; 2 P2 de autenticação e 1 P3 de tracker; correções locais aplicadas, nova revisão pendente | Chaves agora exigem formato canônico de 43 caracteres ASCII (32 bytes base64url sem padding), rejeitando a equivalência HMAC de `key`/`key+NUL`; recibo usa serialização capturada de objeto null-prototype com campos próprios tipados; teste assina com chave de calibração distinta, injeta `Array.prototype.toJSON` e substitui `JSON.stringify`, e confirma assinatura alterada inválida. Tracker agora registra findings corrigidos e re-review pendente. O revisor declarou GPT-6, não Sol 6.1; suíte focal PASS no snapshot anterior aos fixes. |
| Onda B, re-revisão GPT-6 | snapshot imediatamente anterior à correção dos sufixos e da frase de admissão | `FAIL`; P2 sobre 4/16 sufixos canônicos e P3 por afirmação obsoleta de fixture `ADMITTED`; corrigidos localmente | Validador atualizado para aceitar as 16 terminações válidas; teste percorre todas as 16 chaves por recibo de autenticação isolado. Tracker agora afirma explicitamente que não há fixture `ADMITTED`. O revisor confirmou encerramento dos achados anteriores, manteve identidade GPT-6 e não concedeu Sol 6.1. Gates integrais e nova revisão ainda pendentes. |
| Onda B, re-revisão GPT-6 aceita pelo usuário | candidate temporário `9d293b4f71e66ebfd29b1ea198a587f5ded37f00` (worktree de validação; não commit da branch) | `PASS` focado; findings anteriores fechados; zero findings novos no escopo | Revisor declarou efetivamente Codex/GPT-6, não Sol 6.1; o usuário autorizou aceitar revisão GPT-6. Confirmados 16 finais canônicos, bloqueio de chave HMAC equivalente via NUL, recibo de autoridade distinta e proteção a monkeypatch, e ausência de fixture `ADMITTED`. Gates integrais após fixes: 141 Python, 9 Apps Script, sintaxe JS/Code.gs, runtime byte-identical SHA-256 `7025ebea7f23a429c954c712ee6afe34db04a5cf796a70699e29cc7b3e82b3a6`, release 10/10, KB 5.19.0, pipeline 4.22.0, SOURCE_COMMIT exato `9d293b4f71e66ebfd29b1ea198a587f5ded37f00`, phase guards pela suíte Python, `git diff --check` PASS. Isso aceita a revisão intermediária da Onda B, não declara revisão Sol nem fecha Fase 6. |
| Onda B, commit e release limpo | `87a85d92bf21cad3afa006334b7fa606383c7014` | Commit criado após GPT-6 PASS aceito pelo usuário; release real PASS | Release em worktree limpa: 10 documentos, `SOURCE_COMMIT=87a85d92bf21cad3afa006334b7fa606383c7014`; enviado no checkpoint seguinte. `.codex-local-evidence/` ficou fora do índice. |
| Onda D RT-002, commit e push | `140f888023c0fe19ad7ffd1450e41d12002d5111`; tracker `7158a158aa0ee7494e52206636b51eff02f39adc` | Implementação parcial revisada GPT-6 PASS; gates integrais e release PASS; fast-forward enviado | Release em worktree limpa: 10 documentos, SOURCE_COMMIT exato `7158a158aa0ee7494e52206636b51eff02f39adc`. Commit contém executor do predicado RT-002, readiness, fixtures e inventário atualizado. O Criterion continua parcial. |
| Fechamento | — | PENDING | — |

## Estados finais obrigatórios

`SOL_CONTRACT_REVIEW=PASS` (Onda A/C)
`SOL_REVIEW=PENDING` (aprovação final de toda Fase 6)
`AUTO_ADMISSION_THRESHOLD=0.80`
`AUTO_ADMISSION_POLICY=CONTRACT_READY; RUNTIME_INTEGRATION=PENDING`
`CALIBRATION_GATE=BLOCKED` até calibração empírica adequada
`CORRELATION_INTEGRATION=PENDING`
`REPORT_DISCLOSURE_CONTRACT=READY`
`NORMATIVE_INSTITUTIONAL_VALIDATION=PENDING`
`FASE_6_STATUS=IN_PROGRESS`

## Reconciliação e ciclo Onda B atual

- Runtime lido diretamente: 34 Criteria; 29 produtivos e 5 não selecionáveis.
  Os dois Criteria de regularidade profissional foram retirados e não aparecem
  no contrato compilado. Contagem atual: 9 cobertos, 1 parcial e 20 pendentes.
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
  confirmadas pelo reviewer: 34/29/5/2/9/1/20. Verificações atuais antes dos
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
