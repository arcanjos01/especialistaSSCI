# Fase 6 — acompanhamento das ondas restantes

Status de acompanhamento: `IN_PROGRESS`
Baseline reconciliado: `f826ac7d453b7744fed11bed23824acac9fcbb72`
Branch: `feature/apps-script-engine-core`
Knowledge Base no baseline: `5.16.0`; candidate Onda A: `5.17.0`

Este registro acompanha o trabalho autorizado a partir do baseline, sem substituir
os contratos canônicos nem o inventário de cobertura.

## Estado reconciliado

- O checkout iniciou em `4a07851f5ddb2590d9a98f499b78c93581122c2b`; o baseline
  fornecido era commit descendente disponível no remoto. A branch local avançou
  por fast-forward até `f826ac7` sem descartar dados.
- `origin/feature/apps-script-engine-core` continua em `4a07851`; branch local
  está 33 commits à frente. Push somente após gates e revisões.
- `.codex-local-evidence/` é não rastreado e foi preservado. Não incluir em commits.
- Checkpoint `ResponsibilityEvidenceBinding` / `ImmutableExecutionView` está
  presente e fechado no baseline, com revisão Sol `PASS`; manter intacto.
- Inventário vigente: 36 Criteria compilados, 31 produtivamente selecionáveis,
  9 cobertos integralmente, 22 pendentes de cobertura integral, 5 não
  selecionáveis (quatro M5 e um regime legado). KB `5.16.0`.
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
| B | Correlacionador determinístico e fronteira autenticada ao Engine; sem fornecedor de IA | Onda A | Gates completos; ataques adversariais; revisão Luna independente | PENDING |
| C | Contrato e fixtures de disclosure do relatório, sem implementar Fase 8 | Onda A/B | Aviso obrigatório e rastreabilidade testados | `REPORT_DISCLOSURE_CONTRACT=READY`; `LUNA_REVIEW=PASS`; integrado à revisão Sol da Onda A/C |
| D | Critérios produtivos restantes, por prioridade do pedido | Cobertura reconciliada; fontes oficiais; applicability e evidence contracts | Fixtures positivos/negativos/insuficientes; trace; readiness; cobertura demonstrada | PENDING |
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
| Onda A/C, push | commit `667c0dcf67c4a2096976346ac95a5af750cc557f` | `RELEASE_BUILD=PASS`; push seguro pendente | Release builder real produziu 10 docs self-versioned, SOURCE_COMMIT confere. Worktree/output temporários removidos. |
| Onda B | — | PENDING | — |
| Onda C | — | PENDING | — |
| Onda D | — | PENDING | — |
| Revisão final Sol 6.1 | — | PENDING | Não promover antes de PASS independente |
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
