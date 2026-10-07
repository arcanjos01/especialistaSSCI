# Fase 6.0 — Inventário reconstruído e reconciliação de fontes (baseline 6f824750)

Data da auditoria: 2026-10-07. Branch `feature/apps-script-engine-core`.
Este arquivo foi reconstruído a partir do HEAD indicado. Enumeração conferida
diretamente pelo `CompiledRuntimeContract.js` (36 Criteria, 36 unidades
baseadas em UNIT_KEY) e pelas regras de `02a_applicability.txt` (31 produtivas;
5 não selecionáveis: quatro Criteria M5 e o regime UNRESOLVED legado).
No baseline 6f82475, `CriterionExecutionCore.js` só materializava CALL(EXISTS),
sem iterações nem VALIDATE: quatro Criteria produtivos tinham execução já
suportada. Dois outros (literal MANUAL_REVIEW e composição OR) eram
implementáveis por contrato fechado. Os 25 restantes dependem de
contratos de execução ou evidência ainda não formalizados; blockers se
sobrepõem entre Criteria.

O inventário anterior atribuía 8 casos a predicate-contract ausente e 17 a
evidence-contract ausente. Essa divisão foi substituída após a leitura das
fontes originais: regra ainda não codificada não é, por si, decisão humana.
Nova classificação de blockers usa exclusivamente
`SOURCE_DEFINED_NEEDS_FORMALIZATION`, `MISSING_EVIDENCE_CONTRACT` e
`HUMAN_NORMATIVE_DECISION_REQUIRED`.

## Estado após a decisão e revisão F6-DEC-001

`F6-DEC-001=OPTION_B_APPROVED`; catálogo formalizado em `e997815712782f91f38f4e43b578e5b864d7b828`.
Proposta revisada independentemente: `SOL_CATALOG_REVIEW=PASS`. Diff agregado
do Anexo A revisado por nova instância Sol 6.1: `SOL_CATALOG_DIFF_REVIEW=PASS`.
O reviewer confirmou as correções dos achados anteriores e registrou somente
`F6-CAT-R2-001` (LOW), recomendação editorial não bloqueante para separar com
mais nitidez SMSCI aplicável (PPCI/IN) da cobertura encontrada na DRT. A entrada
RT-003 também exige conferir cobertura contra PPCI, então a recomendação não
altera o universo aplicável nem bloqueia o catálogo.

`F6-DEC-001=CLOSED`. Reclassificação atual dos blockers: MC-001 e MC-004
passam a `SOURCE_DEFINED_NEEDS_FORMALIZATION` (a decisão semântica está
formalizada; faltam os contratos/predicates de execução); MC-002 permanece
`SOURCE_DEFINED_NEEDS_FORMALIZATION`; MC-003, MC-005, MC-006 e MC-007 são
`MISSING_EVIDENCE_CONTRACT`. Nenhum blocker atual exige decisão normativa
humana. A lacuna factual de RDE/view não é encerrada pela aprovação do catálogo.
Esta etapa não alterou runtime, resultado, applicability, Requirement ou
Criterion.

## Cobertura atual após a onda 1

A onda 1 estendeu `EngineCore.js`, `CriterionExecutionCore.js` e o gate
read-only de readiness para materializar os constructos declarados no contrato
compilado: literal `MANUAL_REVIEW` e `OR` de dois nós que aceita
recursivamente `EXISTS` e esse literal. Não alterou fontes normativas,
Requirement, Criterion, Nonconformity ou applicability.

| Métrica após a onda 1 | Quantidade |
|---|---:|
| Criteria produtivos | 31 |
| Criteria atualmente materializáveis pelo executor | 6 |
| Criteria restantes sem cobertura de executor | 25 |
| Criteria anteriormente `IMPLEMENTABLE_CLOSED_CONTRACT`, agora cobertos | 2 |
| Unidades planejadas cobertas nos cenários IN19 elegíveis | 2 de 2 |

As seis unidades com constructos suportados são as quatro do baseline
(`T4_IN08_MANUAL`, `T4_IN09_MANUAL`, `T4_IN19_EXECUTION`,
`T4_IN19_GROUNDING`) e as duas da onda 1 (`T4_IN19_APPLICABILITY_REVIEW`,
`T4_IN19_LEGACY_DOCUMENTATION`). Cobertura é avaliada por unidade planejada:
o caso legado só é selecionado no regime/data expressos em
`02a_applicability.txt`. Os outros 25 continuam no escopo das fichas de
blocker abaixo.

**Limite da métrica na onda 1:** “materializável pelo executor” mede somente
se o constructo ASSERT é aceito pelo executor e pelo readiness. Não comprova
que a RDE possa validar um registro da entidade referenciada. No HEAD da onda
1, cinco das seis unidades tinham as entidades referenciadas declaradas no
`entityCatalog`; `PRESSURIZATION_OPERATION_MANUAL`, de `T4_IN09_MANUAL`, era a
lacuna entre essas seis. A onda 2 abaixo adiciona essa identidade e testa sua
entrada pela RDE, applicability, frozen plan, resultado e trace. Isso não
resolve as lacunas de entidade ou evidência dos demais Criteria bloqueados.

## Revisão agregada independente da onda 1

No candidate `667d737c2a4e365372432d146cee5afccb6eb75f`, Sol 6.1 revisou
adversarialmente o intervalo desde `0260e5739ca43748708b3f0afc1fe57fb220b386`
e retornou `SOL_REVIEW=PASS`. Foram seis ciclos independentes no total; os
findings F6-001 a F6-006 foram encerrados pelo último candidate. Esse PASS
aprova a onda funcional revisada, não fecha a Fase 6 nem substitui o exame
separado de contratos necessários aos outros 25 Criteria.

A revisão contratual posterior do mesmo HEAD retornou
`SOL_CONTRACT_REVIEW=FAIL` para fechamento amplo dos contratos, sem identificar
`HUMAN_NORMATIVE_DECISION_REQUIRED` entre F6-MC-001..007. A falha aponta
formalizações e fatos ainda necessários, além de divergências entre mappings
da Base e o catálogo agora aprovado; não autoriza executar as unidades
afetadas.

## Revisão do contrato FACT-ONLY de assinatura

O candidate `763c57e5ea4ebbce2b8c1b862cbb41869295a201` adiciona o atributo
`SIGNATURE_MECHANISM TEXT` em `SHP_COMMISSIONING_REPORT`. Sol 6.1 revisou o
diff desde `667d737c2a4e365372432d146cee5afccb6eb75f` e retornou
`SOL_CONTRACT_DIFF_REVIEW=PASS`. O único achado foi
`F6-SIG-R1-001` (LOW): quando o predicate de assinatura for implementado,
acrescentar fixture de integração usando o catálogo compilado e conferir
atributo, ausência, `sourceDocument`, `provenance` e imutabilidade. Esse ponto
não bloqueia a formalização factual. O atributo registra apenas denominação
explicitamente identificada no documento; não representa assinatura válida,
autenticidade ou atendimento normativo. A alteração não implementa predicate
nem muda resultado.

## Onda 2 — entidade documental declarada para manual de pressurização

O candidate da onda 2 adiciona `PRESSURIZATION_OPERATION_MANUAL` como identidade
de entidade do tipo `MANUAL`. A fonte é IN 09, art. 122, III, que exige
apresentação do manual de operação e manutenção do sistema de pressurização e
gradiente de pressão na vistoria de habite-se. O Criterion existente
`T4_IN09_MANUAL` mantém seu `ASSERT EXISTS`; nenhuma regra, Requirement,
Criterion, Nonconformity ou applicability foi criada ou alterada.

A fixture sintética inclui o item oficial `SPDE`, comprova que a unidade
`UNIT_KEY (REQ_IN09_MANUAL, T4_IN09_MANUAL)` é selecionada no frozen plan e
avalia o documento presente como TRUE/PASS com trace da entidade/proveniência;
sem o documento ou com outro tipo de manual, o resultado declarado é
FALSE/FAIL com `NC_T4_006`; sem o SMSCI aplicável, a unidade não é planejada
nem executada, mesmo quando o manual estiver presente. A view conserva
`provenance` e a fixture agora o verifica como imutável. Essa verificação
fecha a lacuna de entidade para essa unidade específica, mas não demonstra a
cobertura integral dos requisitos de DRT ou das outras unidades do plano.
Sol 6.1 revisou o primeiro candidate da onda 2 com `SOL_REVIEW=PASS` e apontou
`F6-W2-001` (LOW): faltavam asserts versionados para proveniência e manual
presente sem `SPDE`. Ambos foram adicionados em `afffc0e...`; a revisão
independente do follow-up retornou `SOL_REVIEW=PASS` e encerrou o finding.

## Reconciliação do Relatório de Conformidade (candidate)

Revisão independente pré-alteração `SOL_MAPPING_REVIEW=PASS` autorizou a
reconciliação dos dois Requirements e dois Criteria do Relatório de
Conformidade de RT-007 para RT-002, no escopo agregado. IN 01 art. 65 e Anexo I
atribuem o relatório ao RT pela execução dos SMSCI; Anexo A já define RT-002
como escopo agregado e associa a esse RT o Relatório de Conformidade. RT-003
permanece como representação interna de escopo por SMSCI quando o profissional
assumiu aquele sistema, sem criar relatório ou obrigação adicional.

O candidate de reconciliação alterou somente esses quatro
mappings/contextos/assert, registra no Anexo A que o mapping de relatório foi
reconciliado e mantém CMAR como `UNRESOLVED_ATTRIBUTE` por falta de identidade
normativa entre declarante e titular da DRT. A entidade `CONFORMITY_REPORT`,
os fatos RDE e os predicates necessários continuam ausentes; esta
reconciliação ainda não aumenta a cobertura de Criteria. O candidate
`8e4ebce348ae5b41b50edda9bdc56d536ce19cda` foi revisado por Sol 6.1 com
`SOL_REVIEW=PASS`. O achado `F6-RT-001` (LOW) apontou somente a descrição
desatualizada do candidate como ainda não testado, commitado ou enviado. O
follow-up `cc8a5ef6c261dc3aa13e887df29e4a0bed07e00b` atualizou o registro e
recebeu revisão independente `SOL_REVIEW=PASS`; `F6-RT-001` está encerrado,
sem novos findings.

As entidades declaradas na Base e as lacunas relatadas pela revisão contratual
devem ser resolvidas antes de afirmar que um Criterion pode receber evidência
RDE válida. A onda factual de assinatura abaixo não executa os Criteria de DRT
ou produto↔DRT e não amplia a contagem de cobertura integral.

## Onda funcional — assinatura do Relatório de Conformidade (candidate)

Revisão independente anterior à alteração retornou
`SOL_CONTRACT_REVIEW=PASS`, com recomendação `NARROW`: o Requirement existente
declara `VALIDATE TECHNICAL_PRODUCT_ATTRIBUTE` e `EVIDENCE_ATTRIBUTE SIGNED`,
e o Criterion existente chama o mesmo predicate. A entidade factual
`CONFORMITY_REPORT TYPE REPORT` declara `SIGNATURE_MECHANISM TEXT` sem herança
de atributos. O campo registra somente o mecanismo digital/eletrônico
documentalmente identificado como aplicado ao relatório; não atesta validade
criptográfica, autenticidade, identidade do signatário ou atendimento
normativo.

O candidate acrescenta ao compilador os metadados canônicos `TECHNICAL_PRODUCT`
e `EVIDENCE_ATTRIBUTE`, implementa somente `TECHNICAL_PRODUCT_ATTRIBUTE(...,
SIGNED)` e executa o `VALIDATE` declarado antes do ASSERT. Com zero relatórios
ou campo ausente/vazio, o Engine retorna `MANUAL_REVIEW` sem executar ASSERT e
sem Nonconformity. Com um relatório e mecanismo factual não vazio, validação e
ASSERT retornam TRUE com duas entradas de trace. Mais de um registro de
relatório interrompe a execução por integridade técnica antes de produzir
resultado: as fontes consultadas não definem seleção nem agregação. Essa
interrupção não conta como cobertura integral do Criterion e mantém aberto o
contrato de multiplicidade/evidência.

Fixtures verificam entidade/metadados compilados, provenance e sourceDocument,
imutabilidade da view, campo TEXT, ausência, string vazia/espaços e dois
relatórios em ordens diferentes. O escopo não acrescenta DRT_COVERS nem torna
executáveis os ASSERTs de outros Requirements que compartilhem VALIDATE.
Nenhuma regra, Requirement, Criterion, Nonconformity ou applicability foi
criada/alterada; ANALYZED não foi iniciado.

| Estado antes da revisão independente deste candidate | Quantidade |
|---|---:|
| Criteria compilados | 36 |
| Produtivamente alcançáveis | 31 |
| Criteria integralmente cobertos | 6 |
| Criteria integralmente bloqueados | 24 |
| Criteria com suporte parcial da assinatura, bloqueado por multiplicidade | 1 |
| Unidades desta onda com fixture positiva/ausência cobertas | 1 (0 ou 1 relatório) |

Contagens não somam cobertura por entidade nem por predicate: o Criterion de
assinatura permanece fora dos seis integralmente cobertos enquanto não houver
contrato suficiente para multiplicidade. Revisão Sol desta onda ainda
pendente para o candidate funcional.

## Resultado agregado no baseline pré-onda 1

| Cobertura | Quantidade |
|---|---:|
| Criteria compilados | 36 |
| Produtivamente alcançáveis | 31 |
| `EXECUTABLE_EXISTING` | 4 |
| `IMPLEMENTABLE_CLOSED_CONTRACT` | 2 |
| Blockers `SOURCE_DEFINED_NEEDS_FORMALIZATION` | 3 IDs (MC-001, 002, 004) |
| Blockers `MISSING_EVIDENCE_CONTRACT` | 4 IDs (MC-003, 005, 006, 007) |
| Blockers `HUMAN_NORMATIVE_DECISION_REQUIRED` | 0 |
| `LEGACY_REFERENCE_NOT_PRODUCTIVE` | 1 |
| `NOT_PRODUCTIVELY_REACHABLE` | 4 |
| UNIT_KEYs no índice compilado; máximo atual num plano | 36; 29 |

As categorias acima são por blocker ID, não por Criteria, porque vários
blockers afetam o mesmo Criterion. Não há soma disjunta das 25 unidades
bloqueadas por classe. `EXECUTABLE_EXISTING` quer dizer que o executor atual
aceita o construct; não é evidência de cobertura de todos os fixtures ou de
`VALIDATED → ANALYZED`. Os dois Criteria tecnicamente implementáveis eram
`T4_IN19_APPLICABILITY_REVIEW` e `T4_IN19_LEGACY_DOCUMENTATION`: Documento 10
define resultado MANUAL_REVIEW e composição OR; foram cobertos na onda 1.

## Matriz por Criterion (snapshot do baseline)

Campos: Criterion, Requirement, Table, APPLIES_TO/CONTEXT, FOR_EACH, ASSERT,
VALIDATE, FAIL_NONCONFORMITY, entidades/predicates referenciados, estado,
bloqueador e fonte canônica.

| CRITERION_ID | REQUIREMENT_ID | TABLE | APPLIES_TO / CONTEXT | FOR_EACH | ASSERT | VALIDATE | FAIL_NONCONFORMITY | ENTIDADES / PREDICATES | ESTADO / BLOQUEADOR | FONTE |
|---|---|---:|---|---|---|---|---|---|---|---|
| T1_DRT_REQUIRED | REQ_T1_DRT_REQUIRED | 1 | ctx `REQUIRED_TECHNICAL_RESPONSIBILITY RT_002_EXECUCAO_DE_OBRA` | — | `RESPONSIBILITY_HAS_ACCEPTED_DRT_EVIDENCE(RT_002_EXECUCAO_DE_OBRA)` | — | NC_T1_001 | RT-002, DRT; accepted DRT evidence | HUMAN_NORMATIVE_DECISION_REQUIRED / F6-MC-001: catálogo oficial sem entradas RT concretas | 03_table1.txt:16-31; 01_entities.txt:126-153,234-265,324-363; Documento 11 §6-7 |
| T1_DRT_REGISTERED | REQ_T1_DRT_REGISTERED | 1 | ctx `EACH_REQUIRED_TECHNICAL_RESPONSIBILITY` | — | `RESPONSIBILITY_EVIDENCE_ATTRIBUTE(REQUIRED_TECHNICAL_RESPONSIBILITY, REGISTERED)` | — | NC_T1_004 | RT requerida, DRT, REGISTERED | SOURCE_DEFINED_NEEDS_FORMALIZATION / F6-MC-002: atributo/ligação documental não declarado | 03_table1.txt:34-49; 01_entities.txt:62-80; 09_Especificacao_da_RDE.txt:146-152 |
| T1_DRT_SIGNED | REQ_T1_DRT_SIGNED | 1 | ctx `EACH_REQUIRED_TECHNICAL_RESPONSIBILITY` | — | `RESPONSIBILITY_EVIDENCE_ATTRIBUTE(REQUIRED_TECHNICAL_RESPONSIBILITY, SIGNED)` | — | NC_T1_005 | RT requerida, DRT, SIGNED | SOURCE_DEFINED_NEEDS_FORMALIZATION / F6-MC-002 | 03_table1.txt:53-68; 01_entities.txt:62-80; 00_engine.txt:250-274 |
| T1_DRT_PROFESSIONAL_REGULARITY | REQ_T1_DRT_PROFESSIONAL_REGULARITY | 1 | ctx `EACH_REQUIRED_TECHNICAL_RESPONSIBILITY` | — | `RESPONSIBILITY_EVIDENCE_PROFESSIONAL_REGULARITY(REQUIRED_TECHNICAL_RESPONSIBILITY)` | same predicate in Requirement VALIDATE | NC_T1_009 | RT requerida, DRT.COUNCIL_STATE/PROFESSIONAL_REGULARITY | HUMAN_NORMATIVE_DECISION_REQUIRED / F6-MC-001: catálogo oficial sem entradas RT concretas | 03_table1.txt:72-88; 01_entities.txt:62-80; 00_engine.txt:199-210 |
| T1_CONFORMITY_REPORT | REQ_T1_CONFORMITY_REPORT | 1 | ctx `REQUIRED_TECHNICAL_RESPONSIBILITY RT_007_AVALIACAO_TECNICA` | — | `RESPONSIBILITY_HAS_TECHNICAL_PRODUCT(RT_007_AVALIACAO_TECNICA, CONFORMITY_REPORT)` | — | NC_T1_003 | RT-007, produto técnico/relatório | HUMAN_NORMATIVE_DECISION_REQUIRED / F6-MC-001: catálogo oficial sem entradas RT concretas | 03_table1.txt:94-110; 02_requirements.txt:86-100; Documento 11 §5,8 |
| T1_DRT_RI_LEGAL_ENTITY | REQ_T1_DRT_BASIC_DATA | 1 | ctx `EACH_REQUIRED_TECHNICAL_RESPONSIBILITY` | — | `RESPONSIBILITY_EVIDENCE_MATCHES_PROCESS_RI_LEGAL_ENTITY(REQUIRED_TECHNICAL_RESPONSIBILITY)` | — | NC_T1_006_RI | PROCESS/RI, RT requerida, DRT RI_NAME/CNPJ | SOURCE_DEFINED_NEEDS_FORMALIZATION / F6-MC-002: campos e identidade jurídica não representados | 03_table1.txt:115-129; 02_requirements.txt:97-110; 01_entities.txt:62-80; 00_engine.txt:212-223 |
| T1_DRT_RT_NAME | REQ_T1_DRT_BASIC_DATA | 1 | ctx `EACH_REQUIRED_TECHNICAL_RESPONSIBILITY` | — | `RESPONSIBILITY_RT_MATCHES_PRODUCT(REQUIRED_TECHNICAL_RESPONSIBILITY)` | — | NC_T1_006_RT | DRT.RT_NAME, produto técnico, RT requerida | SOURCE_DEFINED_NEEDS_FORMALIZATION / F6-MC-002: RT_NAME/vínculo com produto ausentes | 03_table1.txt:133-147; 02_requirements.txt:97-110; 01_entities.txt:62-80; 00_engine.txt:225-248 |
| T1_DRT_ADDRESS | REQ_T1_DRT_BASIC_DATA | 1 | ctx `EACH_REQUIRED_TECHNICAL_RESPONSIBILITY` | — | `RESPONSIBILITY_EVIDENCE_MATCHES_PROCESS_ATTRIBUTE(REQUIRED_TECHNICAL_RESPONSIBILITY, ADDRESS)` | — | NC_T1_006_ADDRESS | PROCESS, DRT.ADDRESS, RT requerida | SOURCE_DEFINED_NEEDS_FORMALIZATION / F6-MC-002: ADDRESS não consta do catálogo RDE | 03_table1.txt:151-166; 02_requirements.txt:97-110; 01_entities.txt:62-80 |
| T1_DRT_AREA | REQ_T1_DRT_BASIC_DATA | 1 | ctx `EACH_REQUIRED_TECHNICAL_RESPONSIBILITY` | — | `RESPONSIBILITY_EVIDENCE_MATCHES_PROCESS_ATTRIBUTE(REQUIRED_TECHNICAL_RESPONSIBILITY, AREA)` | — | NC_T1_006_AREA | PROCESS, DRT.AREA, RT requerida | SOURCE_DEFINED_NEEDS_FORMALIZATION / F6-MC-002: AREA não consta do catálogo RDE | 03_table1.txt:170-185; 02_requirements.txt:97-110; 01_entities.txt:62-80 |
| T1_CONFORMITY_REPORT_SIGNED | REQ_T1_CONFORMITY_REPORT_SIGNED | 1 | ctx `REQUIRED_TECHNICAL_RESPONSIBILITY RT_007_AVALIACAO_TECNICA` | — | `TECHNICAL_PRODUCT_ATTRIBUTE(CONFORMITY_REPORT, SIGNED)` | — | — | produto técnico/relatório, SIGNED | SOURCE_DEFINED_NEEDS_FORMALIZATION / F6-MC-002: entidade sem atributo/representação de assinatura | 03_table1.txt:189-205; 02_requirements.txt:91-96; 01_entities.txt:1270-1317; 00_engine.txt:250-274 |
| T1_DRT_ACTIVITY_EXECUTION | REQ_T1_DRT_ACTIVITY_EXECUTION | 1 | ctx `REQUIRED_TECHNICAL_RESPONSIBILITY RT_002_EXECUCAO_DE_OBRA` | — | `RESPONSIBILITY_ACTIVITY_COMPATIBLE(RT_002_EXECUCAO_DE_OBRA)` | — | NC_T1_008 | RT-002, DRT, atividade | HUMAN_NORMATIVE_DECISION_REQUIRED / F6-MC-001: catálogo oficial sem entradas RT concretas | 03_table1.txt:210-224; 02_requirements.txt:73-83; Anexo A: catálogo RT-002; Documento 11 §6 |
| T1_DRT_SMSCI_COVERAGE | REQ_T1_DRT_SMSCI | 1 | ctx `REQUIRED_TECHNICAL_RESPONSIBILITY RT_003_EXECUCAO_DE_SISTEMA` | `WORKLIST.SMSCI` | `RESPONSIBILITY_IS_SATISFIED_FOR_SMSCI(RT_003_EXECUCAO_DE_SISTEMA, WORKLIST.SMSCI)` | — | NC_T1_002 | RT-003, DRT, SMSCI, WORKLIST.SMSCI | HUMAN_NORMATIVE_DECISION_REQUIRED / F6-MC-001: catálogo oficial sem entradas RT concretas | 03_table1.txt:228-245; 08_execution_pipeline.txt:503-525,574-577 |
| T4_DRT_REGISTERED | REQ_T1_DRT_REGISTERED | 4 | ctx `EACH_REQUIRED_TECHNICAL_RESPONSIBILITY` | — | `RESPONSIBILITY_EVIDENCE_ATTRIBUTE(REQUIRED_TECHNICAL_RESPONSIBILITY, REGISTERED)` | — | NC_T4_017 | RT requerida, DRT, REGISTERED | SOURCE_DEFINED_NEEDS_FORMALIZATION / F6-MC-002 | 04_table4.txt:14-29; 01_entities.txt:62-80; 09_Especificacao_da_RDE.txt:146-152 |
| T4_DRT_SIGNED | REQ_T1_DRT_SIGNED | 4 | ctx `EACH_REQUIRED_TECHNICAL_RESPONSIBILITY` | — | `RESPONSIBILITY_EVIDENCE_ATTRIBUTE(REQUIRED_TECHNICAL_RESPONSIBILITY, SIGNED)` | — | — | RT requerida, DRT, SIGNED | SOURCE_DEFINED_NEEDS_FORMALIZATION / F6-MC-002 | 04_table4.txt:33-48; 01_entities.txt:62-80; 00_engine.txt:250-274 |
| T4_DRT_PROFESSIONAL_REGULARITY | REQ_T1_DRT_PROFESSIONAL_REGULARITY | 4 | ctx `EACH_REQUIRED_TECHNICAL_RESPONSIBILITY` | — | `RESPONSIBILITY_EVIDENCE_PROFESSIONAL_REGULARITY(REQUIRED_TECHNICAL_RESPONSIBILITY)` | same predicate in Requirement VALIDATE | NC_T4_019 | RT requerida, DRT.COUNCIL_STATE/PROFESSIONAL_REGULARITY | HUMAN_NORMATIVE_DECISION_REQUIRED / F6-MC-001 | 04_table4.txt:52-68; 01_entities.txt:62-80; 00_engine.txt:199-210 |
| T4_IN07_COMMISSIONING | REQ_IN07_COMMISSIONING | 4 | APPLIES_TO `SMSCI_SHP` | — | `ALL(EXISTS(SHP_COMMISSIONING_REPORT), DRT_COVERS(SHP_COMMISSIONING_REPORT,SMSCI_SHP))` | `TECHNICAL_PRODUCT_ATTRIBUTE(SIGNED)` | NC_T4_001 | SHP report, DRT, SMSCI_SHP | MISSING_EVIDENCE_CONTRACT / F6-MC-003: contrato final de DRT_COVERS pendente; assinatura sem campo RDE | 04_table4.txt:74-102; 02_requirements.txt:120-135; Documento 10:456-458,644-646 |
| T4_IN08_ESTANQUEIDADE | REQ_IN08_ESTANQUEIDADE | 4 | APPLIES_TO `SMSCI_GAS` | — | `ALL(EXISTS(GAS_TIGHTNESS_REPORT), VALID_WITHIN_YEARS(report,5), DRT_COVERS(report,SMSCI_GAS))` | `TECHNICAL_PRODUCT_ATTRIBUTE(SIGNED)` | NC_T4_002 | laudo gás, DRT, SMSCI_GAS | MISSING_EVIDENCE_CONTRACT / F6-MC-003,005: DRT_COVERS e validade sem data de referência/atributo ISSUE_DATE | 04_table4.txt:104-132; 02_requirements.txt:148-161; 01_entities.txt:1281-1287; 00_engine.txt:185,193 |
| T4_IN08_MANUAL | REQ_IN08_MANUAL | 4 | APPLIES_TO `SMSCI_GAS` | — | `EXISTS(GAS_OWNER_MANUAL)` | — | NC_T4_003 | GAS_OWNER_MANUAL | EXECUTABLE_EXISTING / executor genérico aceita EXISTS | 04_table4.txt:134-156; apps-script/CriterionExecutionCore.js:48-90 |
| T4_IN09_DRT | REQ_IN09_DRT | 4 | APPLIES_TO `SMSCI_PRESSURIZATION` | — | `ALL(HAS_DRT_ACTIVITY(SMSCI_PRESSURIZATION,EXECUCAO), HAS_DRT_ACTIVITY(SMSCI_PRESSURIZATION,VISTORIA_ENSAIO))` | duas `RESPONSIBILITY_ACTIVITY_COMPATIBLE` | NC_T4_004 | SMSCI pressurização, RT-003, RT-005, DRT/atividade | HUMAN_NORMATIVE_DECISION_REQUIRED / F6-MC-004: catálogo oficial sem entradas RT concretas | 04_table4.txt:158-184; 02_requirements.txt:181-196; Documento 10:460-462,644-647 |
| T4_IN09_TEST_REPORT | REQ_IN09_TEST_REPORT | 4 | APPLIES_TO `SMSCI_PRESSURIZATION` | — | `ALL(EXISTS(PRESSURIZATION_TEST_REPORT), DRT_COVERS(report,SMSCI_PRESSURIZATION), REPORT_CONTAINS(report,IN09_ART122_REQUIRED_ITEMS))` | `TECHNICAL_PRODUCT_ATTRIBUTE(SIGNED)` | NC_T4_005 | laudo, DRT, itens art. 122, SMSCI | MISSING_EVIDENCE_CONTRACT / F6-MC-006: fatos para inspecionar itens a–g, portas corta-fogo e, no item h, mecanismos de fechamento apenas se previstos; associação DRT e assinatura ainda pendentes | 04_table4.txt:186-214; 02_requirements.txt:200-215; 01_entities.txt:1358-1362 |
| T4_IN09_MANUAL | REQ_IN09_MANUAL | 4 | APPLIES_TO `SMSCI_PRESSURIZATION` | — | `EXISTS(PRESSURIZATION_OPERATION_MANUAL)` | — | NC_T4_006 | PRESSURIZATION_OPERATION_MANUAL | EXECUTABLE_EXISTING / executor genérico aceita EXISTS | 04_table4.txt:216-236; apps-script/CriterionExecutionCore.js:48-90 |
| T4_IN09_CHECKLIST | REQ_IN09_CHECKLIST | 4 | APPLIES_TO `SMSCI_PRESSURIZATION` | — | `EXISTS(PRESSURIZATION_MAINTENANCE_CHECKLIST)` | `TECHNICAL_PRODUCT_ATTRIBUTE(SIGNED)` | NC_T4_007 | checklist + assinatura | SOURCE_DEFINED_NEEDS_FORMALIZATION / F6-MC-002: VALIDATE obrigatório, assinatura não representada | 04_table4.txt:238-260; 02_requirements.txt:243-244; apps-script/CriterionExecutionCore.js:121-126 |
| T4_IN10_COMMISSIONING | REQ_IN10_COMMISSIONING | 4 | APPLIES_TO `SMSCI_SMOKE_CONTROL` | — | `ALL(EXISTS(SMOKE_CONTROL_COMMISSIONING_REPORT), REPORT_PREPARED_BY_INDEPENDENT_PARTY(report), DRT_COVERS(report,SMSCI_SMOKE_CONTROL))` | `TECHNICAL_PRODUCT_ATTRIBUTE(SIGNED)` | NC_T4_008 | commissioning report, partes, DRT, smoke control | MISSING_EVIDENCE_CONTRACT / F6-MC-007: participantes/independência sem representação; DRT/signature pendentes | 04_table4.txt:262-292; 02_requirements.txt:218-230; 01_entities.txt:1290-1317; 00_engine.txt:197 |
| T4_IN12_COMMISSIONING | REQ_IN12_COMMISSIONING | 4 | APPLIES_TO `SMSCI_SDAI` | — | `ALL(EXISTS(SDAI_COMMISSIONING_REPORT), DRT_COVERS(report,SMSCI_SDAI))` | `TECHNICAL_PRODUCT_ATTRIBUTE(SIGNED)` | NC_T4_009 | SDAI report, DRT, SMSCI_SDAI | MISSING_EVIDENCE_CONTRACT / F6-MC-003: contrato de DRT_COVERS pendente; assinatura sem campo | 04_table4.txt:294-333; 02_requirements.txt:241-254; Documento 10:456-458,644-646 |
| T4_IN15_COMMISSIONING | REQ_IN15_COMMISSIONING | 4 | APPLIES_TO `SMSCI_SPRINKLER` | — | `ALL(EXISTS(SPRINKLER_COMMISSIONING_REPORT), DRT_COVERS(report,SMSCI_SPRINKLER))` | `TECHNICAL_PRODUCT_ATTRIBUTE(SIGNED)` | NC_T4_010 | sprinkler report, DRT, SMSCI_SPRINKLER | MISSING_EVIDENCE_CONTRACT / F6-MC-003: contrato de DRT_COVERS pendente; assinatura sem campo | 04_table4.txt:335-363; 02_requirements.txt:257-270; Documento 10:456-458,644-646 |
| T4_IN18_CMAR | REQ_IN18_CMAR | 4 | APPLIES_TO `SMSCI_CMAR` | — | `EXISTS(CMAR_DECLARATION)` | `TECHNICAL_PRODUCT_ATTRIBUTE(SIGNED)` | NC_T4_011 | CMAR_DECLARATION + assinatura | SOURCE_DEFINED_NEEDS_FORMALIZATION / F6-MC-002: VALIDATE obrigatório, assinatura não representada | 04_table4.txt:365-383; 02_requirements.txt:316-317; apps-script/CriterionExecutionCore.js:121-126 |
| T4_IN19_APPLICABILITY_REVIEW | REQ_IN19_APPLICABILITY_REVIEW | 4 | APPLIES_TO `SMSCI_IN19_APPLICABILITY_REVIEW` | — | `LITERAL MANUAL_REVIEW` | — | — | SMSCI applicability-review | IMPLEMENTABLE_CLOSED_CONTRACT / literal MR explicitamente declarado | 04_table4.txt:389-403; Documento 10:480-483 |
| T4_IN19_EXECUTION | REQ_IN19_EXECUTION | 4 | APPLIES_TO `SMSCI_IEL` | — | `EXISTS(LOW_VOLTAGE_EXECUTION_DRT)` | — | NC_T4_012 | LOW_VOLTAGE_EXECUTION_DRT | EXECUTABLE_EXISTING / executor genérico aceita EXISTS | 04_table4.txt:411-427; apps-script/CriterionExecutionCore.js:48-90 |
| T4_IN19_GROUNDING | REQ_IN19_GROUNDING | 4 | APPLIES_TO `SMSCI_IEL` | — | `EXISTS(GROUNDING_EXECUTION_DRT)` | — | NC_T4_013 | GROUNDING_EXECUTION_DRT | EXECUTABLE_EXISTING / executor genérico aceita EXISTS | 04_table4.txt:431-447; apps-script/CriterionExecutionCore.js:48-90 |
| T4_IN19_FINAL_VERIFICATION | REQ_IN19_FINAL_VERIFICATION | 4 | APPLIES_TO `SMSCI_IEL` | — | `EXISTS(LOW_VOLTAGE_FINAL_VERIFICATION_DRT)` | `RESPONSIBILITY_ACTIVITY_COMPATIBLE` | NC_T4_014 | final-verification DRT, RT/activity | HUMAN_NORMATIVE_DECISION_REQUIRED / F6-MC-001: catálogo oficial sem entradas RT concretas | 04_table4.txt:451-467; 02_requirements.txt:285-298; apps-script/CriterionExecutionCore.js:121-126 |
| T4_IN19_LEGACY_DOCUMENTATION | REQ_IN19_LEGACY_DOCUMENTATION | 4 | APPLIES_TO `SMSCI_IEL` | — | `OR(EXISTS(LOW_VOLTAGE_EXECUTION_DRT), LITERAL MANUAL_REVIEW)` | — | — | LOW_VOLTAGE_EXECUTION_DRT | IMPLEMENTABLE_CLOSED_CONTRACT / OR e MR definidos, demanda suporte de IR | 04_table4.txt:473-493; Documento 10:548-554 |
| T4_IN19_REGIME_REVIEW | REQ_IN19_REGIME_REVIEW | 4 | APPLIES_TO `SMSCI_IEL` | — | `LITERAL MANUAL_REVIEW` | — | — | SMSCI_IEL/regime | LEGACY_REFERENCE_NOT_PRODUCTIVE / UNRESOLVED não é emitido nem selecionado | 04_table4.txt:497-511; 02a_applicability.txt:214-236 |
| T4_IN34_EXPLOSION_PROTECTION | REQ_IN34_EXPLOSION_PROTECTION | 4 | APPLIES_TO `M5_EXPLOSION_PROTECTION` | — | `HAS_DRT_ACTIVITY(M5_EXPLOSION_PROTECTION, EXECUCAO)` | — | NC_T4_016_01 | M5, DRT, activity | NOT_PRODUCTIVELY_REACHABLE / sem regra de applicability M5 | 04_table4.txt:517-531; 02a_applicability.txt:182-189 |
| T4_IN34_DUST_CONTROL | REQ_IN34_DUST_CONTROL | 4 | APPLIES_TO `M5_DUST_CONTROL` | — | `HAS_DRT_ACTIVITY(M5_DUST_CONTROL, EXECUCAO)` | — | NC_T4_016_02 | M5, DRT, activity | NOT_PRODUCTIVELY_REACHABLE / sem regra de applicability M5 | 04_table4.txt:535-549; 02a_applicability.txt:182-189 |
| T4_IN34_HEAT_SENSORS | REQ_IN34_HEAT_SENSORS | 4 | APPLIES_TO `M5_HEAT_SENSORS` | — | `HAS_DRT_ACTIVITY(M5_HEAT_SENSORS, EXECUCAO)` | — | NC_T4_016_03 | M5, DRT, activity | NOT_PRODUCTIVELY_REACHABLE / sem regra de applicability M5 | 04_table4.txt:553-567; 02a_applicability.txt:182-189 |
| T4_IN34_LIGHTNING_PROTECTION | REQ_IN34_LIGHTNING_PROTECTION | 4 | APPLIES_TO `M5_LIGHTNING_PROTECTION` | — | `HAS_DRT_ACTIVITY(M5_LIGHTNING_PROTECTION, EXECUCAO)` | — | NC_T4_016_04 | M5, DRT, activity | NOT_PRODUCTIVELY_REACHABLE / sem regra de applicability M5 | 04_table4.txt:571-585; 02a_applicability.txt:182-189 |

## Escopo estrutural e critérios de alcance

A matriz acima registra metadados de todos os 36 Criteria compilados. A regra
02a_applicability torna produtivos 31: os 4 Criteria M5 não têm regra de
applicability; `T4_IN19_REGIME_REVIEW` é referência UNRESOLVED legada, não
selecionada pelo regime estrito. No baseline, o executor suportava somente
ASSERT `EXISTS`; após onda 1, também aceita literal `MANUAL_REVIEW` e `OR`
recursivo sobre as formas suportadas, ainda sem FOR_EACH ou VALIDATE. As seis
unidades cobertas estão listadas na seção "Cobertura atual após a onda 1".

Os 25 Criteria restantes foram classificados na ficha abaixo no snapshot do
baseline, antes da reconciliação F6-DEC-001.
O inventário não seleciona novo alcance e não altera applicability. A matriz
preserva os estados do baseline 6f82475; o estado após onda 1 está registrado
na seção anterior.

## Reconciliação das fontes originais e revisão independente Sol

Fontes consultadas diretamente: `references/dtz26.pdf` (DTZ OP 26-CMDOG/2026),
`references/irv habitese.pdf` (IRV Habite-se/2024), `references/in01.pdf`,
`references/in19.pdf`, `knowledge-base/09_Especificacao_da_RDE.txt`, Documento
11 e Anexo A oficial. Para os Criteria que citam INs técnicas não presentes
em `references/`, foram consultadas as cópias oficiais CBMSC 2024 da IN 7, 8,
9, 10, 12, 15 e 18. A IRV Tabela 4 foi lida como fonte operacional de verificação; ela
remete aos arts. 95 da IN 8, 122 da IN 9, 41 da IN 10, 47 da IN 12, 30 da IN
15 e 14 da IN 18.

### Classificação original por blocker (snapshot pré F6-DEC-001)

| BLOCKER_ID | CRITERIA / REQUIREMENTS | CLASSIFICATION | O QUE A FONTE JÁ DEFINE | O QUE FALTA PARA PROVA COMPUTÁVEL |
|---|---|---|---|---|
| F6-MC-001 | T1_DRT_REQUIRED, regularidade, RT→produto, cobertura de SMSCI e Criteria com identificadores RT-002/003/005/006/007/014/015 | `HUMAN_NORMATIVE_DECISION_REQUIRED` | IN 01 art.108 III, §§3–4 e §6 define documentos/vias; Anexo A §§3,5,8 reserva catálogo, IDs, atividades compatíveis, evidências e produtos ao próprio Anexo A; Documento 11 §§5–7 mantém DRT como evidência. | O Anexo A versionado contém só template e não tem entradas concretas. Faltam as entradas autorizadas para os IDs RT referenciados. A ausência impede validar mapeamentos RT→atividade/produto; as relações factuais RDE↔view são uma lacuna separada. Não completar catálogo a partir dos nomes em `01_entities`.
| F6-MC-002 | atributos registrados/signed/RI/RT/endereço/área/atividade/serviços/SMSCI e atributos de produto em Criteria T1/T4 | `SOURCE_DEFINED_NEEDS_FORMALIZATION` | IRV Tabela 1 pp.4–5 enumera fatos básicos e técnicos; IN01 art.108 §§3–4 identifica fatos de RT/empresa e DRT do produto. `00_engine` já define os contratos de assinatura/regularidade e resultados operacionais aplicáveis. | A RDE 0.2.0 e ExecutionView atuais não materializam os atributos/relacionamentos necessários. Incluir apenas fatos FACT-ONLY tipados com provenance; assinatura não verificável segue MANUAL_REVIEW conforme contrato existente, sem comparar RT com solicitante.
| F6-MC-003 | T4_IN07_COMMISSIONING, T4_IN08_ESTANQUEIDADE, T4_IN12_COMMISSIONING, T4_IN15_COMMISSIONING | `MISSING_EVIDENCE_CONTRACT` | IRV verifica serviços e SMSCI declarados contra PPCI e requer DRT respectiva ao produto; IN01 art.108 III admite DRT única de execução exceto sistemas de RT específico. IN07, IN08, IN12 e IN15 especificam produtos/DRTs. | Distinguir cobertura de execução de associação/atividade de DRT respectiva a produto. RDE precisa registrar DRT, atividade, SMSCI, responsável e ligação documental inequívoca. DRT genérica de execução não comprova automaticamente ensaio/comissionamento. Correção: IN01 art.105 § único não é regra de DRT genérica; a referência é art.108 III.
| F6-MC-004 | T1_DRT_ACTIVITY_EXECUTION, T4_IN09_DRT; HAS_DRT_ACTIVITY e RESPONSIBILITY_ACTIVITY_COMPATIBLE | `HUMAN_NORMATIVE_DECISION_REQUIRED` | Ler atividade declarada é factual; julgar compatibilidade com RT exige as entradas do Anexo A, que não existem no arquivo versionado. IN09 arts.93 e 122 separam RT de projeto, execução e vistoria/ensaio e declaram códigos/descrições específicas. | Atividade, serviço, pessoa e SMSCI factuais mais as compatibilidades catalográficas autorizadas. Preservar assinatura existente `(SMSCI, activity)`; não alterar silenciosamente para `(drt, activity)`. HAS_DRT_ACTIVITY só relata declaração documental.
| F6-MC-005 | T4_IN08_ESTANQUEIDADE / VALID_WITHIN_YEARS(report,5); temporalidade IN19 | `MISSING_EVIDENCE_CONTRACT` (IN19 também exige formalização de regra source-defined) | IN08 art.95 p.20 e IRV Tabela4 definem laudo de estanqueidade válido até 5 anos e respectiva DRT. IN19 art.18 define execução, ou para imóvel concluído até publicação, manutenção dos últimos 5 anos ou reforma dos últimos 10 anos. | IN8: data de emissão/realização, data de avaliação autorizada e identidade do laudo. IN19: conclusão do imóvel, publicação da edição, datas/natureza da DRT. RDE atual não tem esses fatos. REQUEST_DATE seleciona edição operacional em 02a; PROPERTY_COMPLETION_DATE seleciona alternativa art.18. Separar dimensões: o plano CURRENT atual omite a alternativa para pedido de 2026, imóvel concluído em 2020 e manutenção de 2026. Não confundir publicação (25/04/2024 na separata) com vigência (24/04/2024).
| F6-MC-006 | T4_IN09_TEST_REPORT / REPORT_CONTAINS(report, IN09_ART122_REQUIRED_ITEMS) | `MISSING_EVIDENCE_CONTRACT` | IN09 art.122 p.42 lista DRTs, laudo, oito componentes de inspeção, manual e lista de verificação, além de remeter a itens de NBR14880 e NBR17240/IN12. | Conteúdo factual por item e associação com a DRT de vistoria/ensaio. Parâmetros NBR referenciados não devem ser inventados. Formalizar condicional de mecanismo automático quando previsto e não tornar genericamente opcionais os componentes listados.
| F6-MC-007 | T4_IN10_COMMISSIONING / REPORT_PREPARED_BY_INDEPENDENT_PARTY(report) | `MISSING_EVIDENCE_CONTRACT` | IRV Habite-se Tabela4 p.9 exige independência no sistema de controle de fumaça mecânico. IN10 art.41 e AnexoB exigem comissionamento/relatório, profissional habilitado e DRT, mas as duas cópias consultadas não mencionam a independência. | Evidências de sistema mecânico, identidades de comissionador/projetista/executor e vínculo/ausência de vínculo. Diferença de nomes não prova independência; `SMSCI_SMOKE_CONTROL` não demonstra sozinho que o sistema é mecânico.

**Classificação revisada naquela etapa inicial (histórica, posteriormente
substituída pela reconciliação F6-DEC-001):** MC-001 e MC-004 foram então
marcados como decisão humana; MC-002 como source-defined; MC-003, MC-005,
MC-006 e MC-007 como missing-evidence. A classificação não é uma partição das
25 unidades, pois os blockers se sobrepõem. O estado vigente consta no início
deste documento e na seção de revisão contratual agregada.

### Modelo contratual submetido a Sol

- Execução e regularização são vias separadas. IN 01 art. 108, §6º, admite
  DRT de regularização em substituição à DRT de execução somente quando um ou
  mais SMSCI foram executados por outro profissional ou sem acompanhamento
  profissional, for viável regularizá-los e houver laudo de vistoria que
  ateste funcionamento adequado em relação aos quesitos normativos. DRT de
  regularização isolada, laudo isolado ou mera compatibilidade de atividade
  não satisfazem a responsabilidade.
- A assinatura declarada no Requirement é `HAS_DRT_ACTIVITY(SMSCI, activity)`;
  o predicate somente lê atividade/serviço documentalmente declarado no
  contexto correspondente e não conclui cobertura ou satisfação normativa.
  A satisfação exige predicado composto com DRT válida, escopo SMSCI, RT
  aplicável e via normativa completa. A regularização exige ainda laudo
  correspondente ao SMSCI e atestado funcional.
- `DRT_COVERS` deve distinguir escopo específico de genérico. DRT específica
  cobre apenas serviços/SMSCI assumidos documentalmente. DRT genérica de
  execução cobre os SMSCI sob aquele RT, salvo sistemas que exigem RT
  específico ou SMSCI documentalmente assumido por outro profissional. A
  cobertura não decorre de filename, ordem, parent arbitrário, proximidade,
  embeddings ou LLM.
- O vínculo produto técnico↔DRT é obrigatório conforme IN 01 art. 108, §4º;
  com múltiplos documentos, só se automatiza quando a própria evidência
  oferece associação inequívoca.
- DTZ 26 art. 74, II(b), contempla DRT de distrato com serviços efetivamente
  realizados e DRT do profissional que assumiu/finalizou a obra. Isso permite
  cobertura documental por múltiplas DRTs; não autoriza regra temporal
  adicional. Correção de referência: art. 73 trata de retirada de PPCI físico.
- IN 19 art. 18 define expressamente execução/manutenção emitida nos últimos
  5 anos/reforma nos últimos 10 anos para imóveis concluídos até a publicação.
  IN 19 art. 19 define periodicidade de manutenção por risco. O conteúdo pode
  ser formalizado quando as datas e regime forem fatos disponíveis.
- A IRV Habite-se Tabela 4 p. 9 define independência para controle mecânico de
  fumaça. IN 10 art. 41 e Anexo B exigem comissionamento/relatório, mas não
  mencionam independência. A regra operacional está definida pela IRV; faltam
  fatos documentais para prová-la (`MISSING_EVIDENCE_CONTRACT`).

### Divergência 34 × 36

`CompiledRuntimeContract.js` tem 36 Criteria e 36 UNIT_KEYs no baseline. O
conteúdo em `520b029` (2026-08-10) tinha 34, como registra Documento 10 §20.9.
Histórico: `9179874` (2026-08-25) acrescentou
`T4_IN19_APPLICABILITY_REVIEW` (34→35); `9d2e7f1` (2026-08-26) acrescentou
`T4_IN19_REGIME_REVIEW` (35→36) e substituiu `T4_IN19_MAINTENANCE` por
`T4_IN19_LEGACY_DOCUMENTATION` (sem aumento líquido pela substituição). Os dois
IDs novos têm Requirement e fonte IN19. O applicability review é produtivo; o
regime review é UNRESOLVED legado e não produtivo. A diferença é drift
documental de Documento 10 §20.9, não conflito material demonstrado. Os 36
UNIT_KEYs são o índice acumulado; o plano atual seleciona no máximo 29 unidades,
pois os regimes IN19 são mutuamente exclusivos. Nenhuma fonte foi alterada.

### Contratos factuais/PREDICATES: lacunas para formalizar

Predicates atuais identificados por IR compilada: `RESPONSIBILITY_HAS_ACCEPTED_DRT_EVIDENCE`,
`RESPONSIBILITY_EVIDENCE_ATTRIBUTE`, `RESPONSIBILITY_EVIDENCE_PROFESSIONAL_REGULARITY`,
`RESPONSIBILITY_HAS_TECHNICAL_PRODUCT`, `RESPONSIBILITY_EVIDENCE_MATCHES_PROCESS_RI_LEGAL_ENTITY`,
`RESPONSIBILITY_RT_MATCHES_PRODUCT`, `RESPONSIBILITY_EVIDENCE_MATCHES_PROCESS_ATTRIBUTE`,
`RESPONSIBILITY_ACTIVITY_COMPATIBLE`, `RESPONSIBILITY_IS_SATISFIED_FOR_SMSCI`,
`TECHNICAL_PRODUCT_ATTRIBUTE`, `DRT_COVERS`, `VALID_WITHIN_YEARS`,
`HAS_DRT_ACTIVITY`, `REPORT_CONTAINS` e `REPORT_PREPARED_BY_INDEPENDENT_PARTY`.
Suas assinaturas posicionais existentes são preservadas no inventário. Nenhum
dos contratos de runtime pode ser completado por este inventário: antes da
implementação, cada um exige argumentos/tipos, fonte de fatos na view,
semântica TRUE/FALSE/UNKNOWN/NOT_APPLICABLE/MANUAL_REVIEW quando aplicável e
trace. Em particular, ausência, conflito, nulidade e proveniência incompleta
não viram FALSE sem regra declarada.

As alterações FACT-ONLY e a reconciliação RT descritas acima atualizam as
fontes canônicas e manifests somente dentro de regras já determinadas pelas
fontes; os artefatos derivados são regenerados. O mapping de Relatório de
Conformidade e o follow-up documental receberam `SOL_REVIEW=PASS`;
`F6-RT-001` está encerrado. `ANALYZED` e Fase 5B permanecem pendentes.
