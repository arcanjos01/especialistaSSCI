# Plano de Migração — Engine determinístico JavaScript / Apps Script

Status: ATIVO
Branch de trabalho: feature/apps-script-engine-core
Baseline arquitetural aprovado: 92e79c89e3a37ca0470b8fa42e8805842155dd53

## 1. Objetivo

Substituir completamente o Gem como ambiente operacional do Habite-se por um pipeline institucional baseado em Google Drive + Google Apps Script, mantendo LLM apenas na EXTRACTION/interpretação documental e executando Requirements/Criteria por Engine determinístico em JavaScript.

Fluxo-alvo externo:

~~~
Drive
→ Apps Script
→ EXTRACTION
→ RDE
→ VALIDATION
→ ANALYSIS / ENGINE
→ REPORT
→ decisão humana do vistoriador
~~~

Fluxo interno da execução normativa:

~~~
RDE validada
→ immutable execution view (Process Memory contract)
→ applicability
→ frozen execution plan
→ Criterion IR
→ EngineResult
→ normalização PipelineResult
→ consolidação
→ projeção operacional
→ relatório
~~~

Este plano não substitui AGENTS.md, 00_engine, 08_execution_pipeline, Documento 09, Documento 10 ou Documento 11. Em conflito, prevalecem as fontes canônicas conforme o escopo definido no AGENTS.md.

## 2. Governança

- Luna implementa, testa e corrige.
- Sol faz revisão arquitetural independente das etapas que alterem contratos, fronteiras ou semântica.
- Mudança normativa exige decisão humana; não pode ser resolvida por inferência.
- Não promover etapa com ARCHITECTURAL_CONFLICT.
- Não fazer merge/deploy automático sem etapa de revisão correspondente.
- Commits pequenos e coerentes.
- Manter .codex-local-evidence/ fora do versionamento.
- Não versionar .clasp.json ou .clasprc.json.

## 3. Estado atual confirmado

Concluído:

- [x] Drive operacional e registry técnico de workflow/fila/idempotência do
  protótipo; não é cadastro de processos do e-SCI nem fonte do protocolo.
- [x] NEW → INDEXED.
- [x] INDEXED → EXTRACTION_PENDING.
- [x] fake deterministic extraction.
- [x] RDE 0.1.0 persistida e imutável.
- [x] Fase 2.5 — contrato de identidade e projeção de registros RDE 0.2.0.
- [x] validação estrutural e SHA-256 da RDE.
- [x] processo de teste atingiu VALIDATED.
- [x] arquitetura de migração registrada no AGENTS.md.
- [x] Criterion IR mantido como contrato canônico.
- [x] Fase 1 — núcleo determinístico JavaScript.
- [x] Fase 2 — immutable execution view genérica.
- [x] Process Memory redefinido como immutable execution view, sem persistência obrigatória.
- [x] fronteira EngineResult → PipelineResult reconciliada.
- [x] UNKNOWN → MANUAL_REVIEW definido apenas como normalização operacional rastreável.
- [x] EVALUATED versus PROPAGATED definido para rastreabilidade.
- [x] NOT_APPLICABLE em predicate permitido quando declarado no result contract.
- [x] Apps Script/JavaScript definido como runtime operacional alvo.
- [x] Python mantido apenas como referência/testes.
- [x] revisão Sol arquitetural concluída com PASS.
- [x] baseline promovido à main: 92e79c8.

Ainda não concluído:

- [ ] materialização do plano de execução em JavaScript.
- [ ] integração VALIDATED → ANALYZED.
- [ ] execução de Criterion real no novo runtime.
- [ ] real EXTRACTION por LLM.
- [ ] geração operacional de relatório pelo novo pipeline.
- [ ] validação end-to-end e retirada do Gem legado.

## 4. Fase 1 — Núcleo determinístico JavaScript

Status: **CONCLUÍDA**.

Objetivo: portar o contrato do Engine, não o código Python.

Implementar em módulos pequenos e testáveis:

- EngineResult: TRUE, FALSE, UNKNOWN, NOT_APPLICABLE, MANUAL_REVIEW.
- PipelineResult: PASS, FAIL, NOT_APPLICABLE, MANUAL_REVIEW.
- TypedReference.
- ArgumentSpec / ArgumentSchema.
- PredicateContract.
- PredicateRegistry estático.
- ResolverContext.
- Criterion IR.
- Trace.
- Expression: PredicateCall, EXISTS, ALL, OR, FOR_EACH.
- composição determinística conforme Documento 10.
- validação de result contract.
- normalização EngineResult → PipelineResult.
- distinção EVALUATED / PROPAGATED.

Restrições:

- nenhuma regra específica de CBMSC no núcleo;
- nenhuma leitura de Drive/PDF;
- nenhuma chamada de IA;
- nenhuma alteração de RDE;
- nenhuma criação de Requirement/Criterion/Nonconformity;
- nenhum avanço de status de processo;
- nenhuma execução da Base real nesta fase.

Saída esperada:

- testes Node determinísticos;
- fixtures sintéticas;
- equivalência semântica documentada com o Engine Python onde ele continuar compatível;
- divergências Python classificadas como LEGACY_REFERENCE, não copiadas automaticamente.

Gate de saída:

- todos os testes JS passam;
- suíte Python existente continua passando;
- git diff --check passa;
- Sol revisa o núcleo e retorna SOL_REVIEW=PASS.

Checkpoint da execução:

- Commit funcional: `480dc2264f215b9104557139f4e0b5aec9a604e1` (`feat(engine): add JavaScript criterion IR core`).
- Revisão independente: `SOL_REVIEW=PASS`.
- Testes: `node tests/apps-script-engine-core.test.js` PASS; `node tests/apps-script-rde-core.test.js` PASS; `python -m unittest discover -s tests -p 'test*.py'` PASS (120 testes); `git diff --check` PASS.
- Benchmark sintético (sanity check): 100 Criteria = 1.496 ms; 500 = 8.685 ms; 1000 = 17.365 ms.
- Pendências: implementar a immutable execution view e etapas seguintes; predicates e resolvers de domínio continuam fora desta fase. `FOR_EACH` recebe expressões previamente vinculadas; a expansão do domínio permanece fora do núcleo.
- Próxima fase autorizada: **Fase 2 — Immutable execution view**. Nenhuma fase posterior foi iniciada.

## 5. Fase 2 — Immutable execution view

Status: **CONCLUÍDA**.

Objetivo: disponibilizar ao Engine uma view read-only da RDE validada.

Implementar:

- adapter de RDE validada para o contrato de execution view;
- acesso somente por interfaces autorizadas;
- canonicalização necessária;
- TypedReference;
- proveniência até source/evidence;
- proteção contra mutação;
- distinção entre campo ausente, null, false, zero e string vazia quando relevante ao contrato.

Restrições:

- não persistir uma segunda cópia da RDE apenas para criar Process Memory;
- predicates não podem navegar arbitrariamente pela estrutura crua da RDE;
- não reabrir documentos-fonte;
- não completar fatos ausentes.

Gate de saída:

- testes de imutabilidade;
- testes de provenance;
- testes de ausência/null/false/0;
- Sol PASS se houver mudança de contrato.

Checkpoint da execução:

- Commit funcional: `49c37d5d27ac46188ba930f06d351db90342a05c` (`feat(engine): add immutable execution view`).
- Revisão independente: `SOL_REVIEW=PASS`.
- Testes: `node tests/apps-script-execution-view.test.js` PASS; `node tests/apps-script-engine-core.test.js` PASS; `node tests/apps-script-rde-core.test.js` PASS; `python -m unittest discover -s tests -p 'test*.py'` PASS (120 testes); `git diff --check` PASS.
- Decisões: a view recebe projeções explícitas com `TypedReference`, valor e provenance opcional; expõe somente `contains`, `read` e `provenance`; a ausência no índice lança erro técnico; provenance não fornecida retorna `undefined`, e `null` explícito permanece `null`. A view não retém a RDE nem duplica sua validação.
- Limitações: RDE 0.1.0 mantém `facts` e `evidence` genéricos. A fixture `TEST_ONLY` usa projeção explícita para testar a infraestrutura; não há mapeamento produtivo desses campos para referências canônicas nem canonicalização CBMSC nesta fase.
- Próxima fase prevista à época: **Fase 3 — Applicability e frozen execution plan**, condicionada à resolução do contrato estrutural da RDE na Fase 2.5. A Fase 3 não foi iniciada.

## 5.5 Fase 2.5 — RDE Record Identity & Projection Contract

Status: **CONCLUÍDA**.

Objetivo: formalizar identidade estrutural própria por registro RDE e sua
projeção fechada para a immutable execution view, preservando a RDE 0.1.0
persistida como histórico imutável.

Checkpoint da execução:

- Commit funcional: `968b8cf` (`feat(rde): add stable record identity contract`).
- Commit checkpoint: registrado no histórico Git após este commit.
- Schema RDE novo: `0.2.0`; coleções ordenadas de envelopes `record_id`, `entity_id`, `parent_record_id`, `source_document`, `attributes` e `provenance` opcional.
- Execution View: referência primária 1:1 por registro (`kind` derivado de `TYPE`, `identifier` igual a `record_id`); APIs estruturais `entityId`, `parent`, `sourceDocument`, `referencesByEntity` e `children`; `read` expõe somente atributos.
- Revisão independente: `SOL_REVIEW=PASS` no ciclo 3, após correções objetivas das notas do ciclo 2.
- Testes: `node tests/apps-script-engine-core.test.js` PASS; `node tests/apps-script-execution-view.test.js` PASS; `node tests/apps-script-rde-core.test.js` PASS; `python -m unittest discover -s tests -p 'test*.py'` PASS (120 testes); sintaxe Node e `git diff --check` PASS.
- Decisões: record identity é opaca, estrutural e não derivada de fatos/proveniência; pai e documento de origem são relações explícitas; valores de atributos precisam respeitar tipos declarados sem coerção ou validação de domínio ENUM; nenhum Requirement, Criterion, applicability ou resultado normativo é executado.
- RDE 0.1.0: permanece imutável e é rejeitada pelo runtime que exige o envelope 0.2.0; nenhum caminho simula as relações ausentes.
- Limitação: o parser operacional ainda não recebe catálogo de entidades; registros produtivos preenchidos dependem dessa integração futura. O fake determinístico vazio permanece compatível. A microfase não duplicou a Base no runtime.
- Débitos preservados: não há migração de RDE 0.1.0; integrar futuramente catálogo canônico ao parser antes do uso produtivo de registros preenchidos; applicability e regras normativas permanecem fora desta microfase.
- Gate: a Fase 3 permaneceu bloqueada até a conclusão e revisão desta microfase; com `SOL_REVIEW=PASS`, está agora autorizada.
- Próxima fase autorizada: **Fase 3 — Applicability e frozen execution plan**. Ainda não iniciada.

## 5.6 Fase 2.6 — Current Submission Context Contract

Status: **CONCLUÍDA**.

Decisão arquitetural confirmada para o fluxo de Habite-se do e-SCI:

- `PROTOCOL_IDENTIFIER` identifica a cadeia/processo e pode permanecer estável
  entre indeferimento e reapresentação;
- `REQUEST_DATE` identifica a data civil de cada apresentação;
- a chave operacional da apresentação é `PROTOCOL_IDENTIFIER + REQUEST_DATE`;
- `RE_IDENTIFIER`, quando disponível nos dois lados, é somente verificação de
  consistência;
- `REQUEST_IDENTIFIER` não participa do matching produtivo;
- `processId`, quando fornecido, identifica somente correlação/execução técnica;
  é opcional no contrato conceitual produtivo e não participa do matching.

O Especialista e-SCI é stateless quanto aos processos administrativos: o
e-SCI/SCI institucional é o system of record. Cada invocação fornece o caso e
um `CurrentSubmissionContext` transitório, imutável e com proveniência
`sourceKind`/`sourceReference`; o contexto não integra a RDE nem é evidência.
O especialista não mantém cadastro/histórico de protocolos nem consulta
execuções anteriores. Cada execução analisa um snapshot fechado de contexto,
documentos/RDE e Base versionada; uma reapresentação é uma nova execução.

A fronteira alvo é `e-SCI invocation / case intake → CurrentSubmissionContext
→ immutable input da execução`. A integração poderá fornecer contexto junto
com documentos, sem definir aqui API ou formato definitivo. O registry do
protótipo permanece apenas infraestrutura técnica de workflow/fila/idempotência:
não é cadastro de processos, histórico administrativo, fonte canônica do
protocolo ou memória do especialista, e seu schema não será ampliado nesta
etapa.

O matcher consome a ImmutableExecutionView e o contexto daquela invocação,
compara protocolo e data civil canônica, aplica a consistência opcional do RE
e bloqueia zero ou múltiplos candidatos. Não usa `processId` nem consulta
resultado de execução anterior; não executa applicability nem produz
`PROCESS.SMSCI`.

Implementação: `apps-script/CurrentSubmissionContextCore.js`, marca de
autenticidade da view em `apps-script/ExecutionViewCore.js` e
`tests/apps-script-current-submission-context.test.js`. O fixture Python de
referência foi alinhado ao protocolo + data e mantém `REQUEST_IDENTIFIER`
somente como campo legado sem efeito de seleção.

Checkpoint da execução:

- Commit funcional: `d50cfbf64620a3c90885f13321947434987783fb`
  (`feat(engine): add current submission context contract`).
- Revisão independente: `SOL_REVIEW=PASS` no ciclo 4.
- Testes: `node tests/apps-script-engine-core.test.js` PASS;
  `node tests/apps-script-execution-view.test.js` PASS;
  `node tests/apps-script-rde-core.test.js` PASS;
  `node tests/apps-script-current-submission-context.test.js` PASS;
  `python -m unittest discover -s tests -p 'test*.py'` PASS (121 testes);
  `node --check apps-script/CurrentSubmissionContextCore.js` PASS;
  `git diff --check` PASS.
- Decisões: submission identity é `PROTOCOL_IDENTIFIER + REQUEST_DATE`;
  `RE_IDENTIFIER` é consistency check; `processId` e `REQUEST_IDENTIFIER` não
  selecionam. Contexto e provenance operacional ficam fora da RDE. A entidade
  usa `RE_IDENTIFIER`; o campo `REQUEST_IDENTIFIER` permanece legado/opcional
  por compatibilidade, mas deixou de ser extraído como requisito ou usado no
  matching. RDE 0.2.0 foi preservada.
- Limitações: a integração futura ainda deverá entregar o contexto transitório
  junto ao caso, por invocation/intake do e-SCI ou captura operacional
  confirmada. O registry permanece técnico e não foi ampliado.
- Ciclos Luna→Sol: 4; SOL_REVIEW final: PASS.
- Arquitetural conflict: 0. Não houve mudança normativa nem alteração de
  Requirement, Criterion, Nonconformity ou Anexo A.

Dívida para integração: receber `PROTOCOL_IDENTIFIER`, `REQUEST_DATE`,
`RE_IDENTIFIER` quando disponível e provenance operacional junto ao caso em
cada invocation/intake do e-SCI, antes de `VALIDATED → ANALYZED`. Não persistir
esses valores como cadastro no registry e não derivar contexto de filename.

Fase 3 permanece autorizada e não iniciada; nenhuma applicability ou
PROCESS.SMSCI foi executada nesta microfase.

## 6. Fase 3 — Applicability e frozen execution plan

Status: **CONCLUÍDA**.

Commit funcional: `9f577646cf00f91c94fc3ea0f7cca8f96fba44d4`
(`feat(engine): add applicability and frozen execution plan`).

Módulos e artefato:

- `apps-script/CompiledRuntimeContract.js`: artefato derivado, marcado
  `GENERATED_DERIVED_ARTIFACT` / `DO_NOT_EDIT_AS_NORMATIVE_SOURCE`, regenerável
  com `python tools/build_knowledge_base_release.py --write-runtime-contract`.
- `apps-script/CbmscApplicabilityCore.js`: applicability específica CBMSC,
  consumindo somente `ImmutableExecutionView`, `CurrentSubmissionContext` e o
  contrato compilado.
- `apps-script/ExecutionPlanCore.js`: resolução de Requirements, Worklist,
  unidades planejadas, integridade e congelamento do plano.
- `tools/build_knowledge_base_release.py`: estende o compilador canônico para
  derivar os metadados runtime e o índice estruturado sem substituir a
  compilação existente de `UNIT_KEY`.

Contrato derivado: identifica a versão da Base e as versões dos documentos
canônicos; inclui 84 entidades, 28 códigos oficiais, 30 Requirements, 36
Criteria, referências de Nonconformity e os 30 blocos na ordem do
`COMPILED_EXECUTION_INDEX`. O build e o teste comparam a regeneração por bytes;
drift, associação inválida, referência órfã ou inconsistência de tabela falham.
`ENTITY_CATALOG` alimenta validação da RDE, projeção da Execution View e
applicability. O mapa oficial é fechado contra `02a_applicability.txt` e
`01_entities.txt`.

Decisões e invariantes implementados:

- A entrada operacional inclui `CurrentSubmissionContext` transitório da
  invocação. O comprovante é selecionado exclusivamente por
  `PROTOCOL_IDENTIFIER + REQUEST_DATE` civil canônica; `RE_IDENTIFIER` é apenas
  verificação de consistência. A seleção não consulta estado anterior e não
  usa `REQUEST_IDENTIFIER`, `processId`, filename, ordem ou timestamps.
- A seção de segurança precisa ser única, completa, legível e verificável.
  Seus itens estruturais usam somente `OFFICIAL_ESCI_CODE`. As 28 decisões
  oficiais são completas e atômicas; ausência, ambiguidade ou código
  desconhecido bloqueiam sem emitir conjunto parcial.
- `SMSCI_SDAI` e `SMSCI_IN19_APPLICABILITY_REVIEW` são decisões derivadas
  separadas e rastreadas. As seis regras/dependências M5 seguem sem regra e sem
  decisão inferida.
- Com `SMSCI_IEL` positivo, a data da apresentação já validada seleciona
  somente `LEGACY` até 2024-04-24 ou `CURRENT` após essa data. `UNRESOLVED`,
  `REQ_IN19_REGIME_REVIEW` e `T4_IN19_REGIME_REVIEW` permanecem na Base como
  `LEGACY_REFERENCE / NOT_PRODUCTIVELY_REACHABLE`; a rota produtiva de
  `SMSCI_IN19_APPLICABILITY_REVIEW` quando IEL é negativo permanece ativa.
- Requirements gerais são preservados; Requirements com SMSCI e regime IN19
  seguem a aplicabilidade declarada e a ordem canônica. `WORKLIST.SMSCI` é
  limitada a `REQ_T1_DRT_SMSCI / T1_DRT_SMSCI_COVERAGE`, inclui somente
  positivos oficiais e exclui scopes derivados.
- O índice estruturado reutiliza a geração canônica: `UNIT_KEY` permanece
  literalmente `(requirement_id, criterion_id)`. `T1_DRT_SMSCI_COVERAGE`
  permanece uma unidade com bindings para o domínio congelado. O plano termina
  antes de executar qualquer Criterion e não contém resultados, evidência ou
  Nonconformities disparadas.
- Integridade também exige que `APPLIES_TO` coincida com o SMSCI do Requirement
  associado e que `Nonconformity.TABLE` coincida com `Criterion.TABLE`.
  Nenhuma exceção ou allowlist de referência órfã foi introduzida.

Testes: os quatro testes Apps Script existentes, o novo teste integrado
`tests/apps-script-applicability-plan.test.js`, `tests/test_compiled_runtime_contract.py`,
`python -m unittest discover -s tests -p 'test*.py'` (133 testes), geração do
artefato runtime, verificações `node --check` e `git diff --check` passaram.

Revisão independente: `SOL_REVIEW=PASS`. Ciclos Luna→Sol da Fase 3: 2; o
primeiro review identificou os dois gaps de integridade acima, ambos corrigidos
e cobertos antes do novo PASS. Commit funcional enviado apenas para
`origin/feature/apps-script-engine-core`.

Limitações e dívidas preservadas: a integração ainda precisa fornecer o
`CurrentSubmissionContext` transitório em cada intake antes de
`VALIDATED → ANALYZED`; o registry permanece infraestrutura técnica e não
armazena cadastro ou histórico de processos. Dívidas de aplicabilidade M5
permanecem sem conclusão. Critérios de regime IN19 marcados como referências
legadas não são removidos da Base nesta fase. Não houve execução de Criterion,
mudança normativa, mudança de Anexo A ou conflito arquitetural pendente.

Próxima fase autorizada: **Fase 4 — Primeiro Criterion piloto**. Não iniciada.

## 7. Fase 4 — Primeiro Criterion piloto

Status: **IMPLEMENTADA — AGUARDANDO REVISÃO SOL INDEPENDENTE**.

Objetivo: executar um Criterion real da Base no runtime JavaScript sem ainda promover processos reais automaticamente.

Seleção do piloto deve privilegiar:

- regra simples;
- boa cobertura documental;
- predicate já formalizado;
- baixo risco semântico;
- rastreabilidade completa;
- nenhuma dependência de decisão arquitetural pendente.

Antes de selecionar:

- auditar Requirement → Criterion → predicate → Nonconformity;
- confirmar applicability;
- confirmar evidência necessária;
- confirmar que o Anexo A não é afetado.

Executar o mesmo conjunto de fixtures no Python de referência quando comparável.

Gate de saída:

- resultado equivalente dentro do contrato;
- trace completo;
- nenhum acesso fora da execution view;
- Sol PASS.

Checkpoint de implementação:

- Baseline de entrada: `a84237843f52483813601b95fc5edef283a3b619`.
- Criterion piloto selecionado: `T4_IN08_MANUAL`, associado a
  `REQ_IN08_MANUAL`, com `ASSERT EXISTS(GAS_OWNER_MANUAL)` e
  `FAIL NC_T4_003`.
- A seleção substituiu a hipótese inicial de `T1_DRT_REQUIRED` porque o
  primeiro Criterion possui cadeia executável fechada no contrato canônico,
  sem exigir criação de binding ou predicate de responsabilidade técnica ainda
  não materializado no runtime.
- O compilador de release passou a derivar estruturalmente `ASSERT` para
  Criterion IR no `CompiledRuntimeContract.js`; o compilador não atribui
  semântica nova às expressões.
- `apps-script/CriterionExecutionCore.js` materializa exclusivamente uma
  unidade já presente no frozen plan e, nesta fase, aceita somente o operador
  canônico direto `EXISTS`. Não há IDs normativos específicos hardcoded no
  módulo.
- O resultado preserva `UNIT_KEY`, identidade Requirement/Criterion,
  EngineResult, PipelineResult, trace, fonte declarativa e evidência ou
  `DOCUMENT_ABSENCE`. `FALSE` associa somente a Nonconformity declarada.
- Fixtures usadas são exclusivamente `TEST_ONLY` em RDE 0.2.0. Nenhum
  processo administrativo real foi utilizado.
- Casos executados nesta sessão contra os módulos da branch: presença do
  manual → `TRUE/PASS`; ausência → `FALSE/FAIL + NC_T4_003`; Requirement
  não aplicável → unidade não planejada e execução bloqueada; adulteração da
  referência de Nonconformity → `CRITERION_EXECUTION_INTEGRITY_ERROR`.
- Durante revisão no mesmo ciclo foram encontrados e corrigidos dois gaps:
  validação insuficiente das referências de Nonconformity do plano e ausência
  de `UNIT_KEY` no registro de resultado.
- Commits da implementação:
  `1e63262f844f6f8085915e811620d0c5c66ad3f1`,
  `bfcd9eba254003f5aea6d1434d2a9c1383cd6595`,
  `dc61adbd8e012a7f292af561df5e64ba573e10a6` e
  `6f68179f3273715b41581d06481df169fcd8ef97`.
- O último hardening exige contrato compilado e plano profundamente congelados
  antes da execução do Criterion.
- Validação nativa executada em GitHub Actions sobre
  `6f68179f3273715b41581d06481df169fcd8ef97`: 135 testes Python PASS; todos
  os 6 testes `apps-script-*.test.js` PASS; `node --check` para todos os
  módulos Apps Script PASS; regeneração byte-identical do
  `CompiledRuntimeContract.js` PASS; `git diff --check` desde o baseline da
  Fase 3 PASS.
- O workflow temporário usado exclusivamente para executar esses gates foi
  removido após a validação; não integra o runtime nem altera a arquitetura.
- Primeira revisão Sol independente: `SOL_REVIEW=FAIL`, com F4-001 e F4-002
  HIGH e F4-003 MEDIUM. Foram corrigidos exclusivamente esses achados.
- Correção funcional: `cf4480eecdf75f6b9e3a2eee4bdb208d4114a986`.
  O frozen plan agora recebe provenance privada via `WeakMap`, vinculada à
  instância exata do contrato usada pelo planejador; o executor aceita somente
  plano assim autenticado. O executor também exige identidade de objeto com
  `COMPILED_RUNTIME_CONTRACT`, rejeitando clones alterados mesmo quando
  profundamente congelados. O parser de `ASSERT` rejeita conteúdo residual
  antes de `FAIL`, `MANUAL_REVIEW` ou `END`.
- Validação das correções em GitHub Actions sobre
  `8c444e26c3961a8f0e1b25e19f17187a33c960f7`: 137 testes Python PASS;
  todos os 6 testes `apps-script-*.test.js` PASS; `node --check` PASS;
  regeneração byte-identical do runtime contract PASS; `git diff --check`
  desde o baseline da Fase 3 PASS. O workflow temporário desta validação também
  foi removido após o gate.
- Segunda revisão Sol independente permanece pendente; o FAIL anterior não foi
  convertido em PASS automaticamente.
- Não iniciados: `VALIDATED → ANALYZED`, execução em massa de Criteria,
  relatório, EXTRACTION real por LLM e OpenAI Decisions.

Gate ainda pendente para declarar a Fase 4 **CONCLUÍDA**:

- revisão Sol arquitetural **independente** com `SOL_REVIEW=PASS`.

Enquanto esse gate não for satisfeito, a Fase 5 não está autorizada.

## 8. Fase 5 — Integração VALIDATED → ANALYZED

Objetivo: conectar o Engine ao workflow Apps Script.

Implementar somente após as fases 1–4:

- leitura da RDE validada;
- construção da execution view;
- applicability;
- frozen plan;
- execução;
- normalização;
- consolidação;
- persistência do artefato de análise, se o contrato exigir;
- transição atômica VALIDATED → ANALYZED.

Requisitos:

- idempotência;
- não reprocessar ANALYZED;
- erro não pode corromper RDE;
- erro não pode fabricar resultado;
- status só muda após validação completa da saída;
- manter ERROR separado de resultado normativo.

Primeiro teste: somente processo controlado/fixture. Não usar a fake RDE vazia para produzir conclusão normativa.

## 9. Fase 6 — Cobertura progressiva da Base

Objetivo: migrar Criteria reais individualmente.

Para cada Criterion:

1. verificar contrato canônico;
2. verificar predicate(s);
3. verificar argumentos tipados;
4. verificar applicability;
5. verificar Nonconformity associada;
6. criar fixtures positivas, negativas e insuficientes;
7. testar TRUE/FALSE/UNKNOWN/MANUAL_REVIEW/NOT_APPLICABLE quando aplicável;
8. verificar trace;
9. comparar com referência quando útil;
10. promover somente após testes.

Não fazer migração em massa sem evidência de estabilidade.

## 10. Fase 7 — EXTRACTION real por LLM

Objetivo: substituir o extractor fake mantendo a fronteira arquitetural.

A IA pode:

- ler documentos;
- identificar tipos;
- extrair fatos explícitos;
- preencher atributos previstos;
- preservar origem/página/trecho;
- registrar incerteza documental.

A IA não pode:

- executar Requirement/Criterion;
- produzir conformidade;
- produzir Nonconformity;
- completar dado ausente;
- usar conhecimento externo para inferir fatos;
- decidir applicability normativa.

Requisitos antes de uso institucional:

- política de privacidade e tratamento de dados aprovada;
- structured output;
- validação de schema;
- provenance;
- tratamento explícito de conflitos;
- testes com documentos reais anonimizados/controlados;
- estratégia para assinatura: indicação documental separada de validação criptográfica.

## 11. Fase 8 — Relatório operacional

Objetivo: gerar relatório somente a partir de resultados consolidados.

Implementar:

- STATUS;
- pendências e-SCI;
- tratamento humano;
- identificação disponível;
- documentos analisados;
- resumo das verificações;
- observações;
- rodapé e versão da Base.

Proibido:

- reabrir PDF;
- criar evidência;
- executar Criterion;
- modificar resultado;
- inventar causa/subcausa;
- converter FAIL em MANUAL_REVIEW.

Gate de saída:

- projeção determinística;
- contadores consistentes;
- testes de FAIL sem projeção IRV;
- testes de MANUAL_REVIEW;
- testes de UNKNOWN normalizado;
- nenhum identificador interno indevido no relatório operacional.

## 12. Fase 9 — End-to-end e promoção operacional

Cenários mínimos:

- processo conforme;
- processo com FAIL;
- processo com MANUAL_REVIEW;
- processo com UNKNOWN normalizado;
- processo com NOT_APPLICABLE;
- documento ausente;
- documento ilegível/inconclusivo;
- conflito documental;
- falha de integridade;
- reexecução idempotente.

Validar:

~~~
NEW
→ INDEXED
→ EXTRACTION_PENDING
→ EXTRACTED
→ VALIDATED
→ ANALYZED
→ REPORT_GENERATED
→ DONE
~~~

Somente depois:

- revisão Sol completa;
- homologação humana;
- comparação com processos analisados manualmente;
- decisão explícita de promoção;
- retirada do Gem como executor operacional legado.

## 13. Estratégia de commits

Preferir commits por capacidade:

- feat(engine): add JavaScript criterion IR core
- feat(engine): add immutable execution view adapter
- feat(engine): materialize deterministic execution plan
- feat(engine): execute pilot criterion
- feat(apps-script): analyze validated processes
- feat(extraction): add real RDE extraction provider
- feat(report): generate operational analysis report

Não usar esses nomes obrigatoriamente se o conteúdo real pedir divisão menor.

## 14. Regra de checkpoint

Ao final de cada fase, atualizar este arquivo apenas com:

- status da fase;
- commit promovido;
- testes principais;
- decisão Sol;
- pendências abertas;
- próxima fase autorizada.

Não transformar este plano em changelog detalhado.

## 15. Próxima ação autorizada

Próxima etapa:

Fase 1 — Núcleo determinístico JavaScript.

Escopo imediato:

- implementação isolada;
- fixtures sintéticas;
- sem Drive;
- sem Apps Script orchestration;
- sem mudança de status;
- sem Base normativa real;
- Luna implementa em ciclos;
- Sol revisa antes de promover.
