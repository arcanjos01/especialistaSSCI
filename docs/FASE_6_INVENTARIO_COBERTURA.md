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
Nova classificação de blockers (distinta das categorias de cobertura e de
alcance produtivo) usa exclusivamente
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

## Onda funcional — assinatura do Relatório de Conformidade

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

| Estado após a revisão independente do candidate funcional | Quantidade |
|---|---:|
| Criteria compilados | 36 |
| Produtivamente alcançáveis | 31 |
| Criteria integralmente cobertos | 6 |
| Criteria integralmente bloqueados | 23 |
| Criteria com suporte parcial desta onda | 4 |
| Unidades desta onda com fixture positiva/ausência cobertas | 1 (0 ou 1 relatório) |

Contagens não somam cobertura por entidade nem por predicate: o Criterion de
assinatura permanece fora dos seis integralmente cobertos enquanto não houver
contrato suficiente para multiplicidade.

A primeira revisão funcional do candidate `237ccc19395bfcb271f94c3525ed0ff6597ce99d`
retornou `SOL_REVIEW=FAIL` com `F6-SIG-001` (MEDIUM): o guard entre o produto
do VALIDATE e do ASSERT comparava `.kind`/`.identifier` inexistentes em strings
e aceitava referências distintas. O commit `4ea8a1ae6439534f614d528c99e7443c4c2f9b2e`
compara os nomes canônicos diretamente e inclui regressão adversarial em VM
com ambos os produtos presentes e assinados; a execução agora para com erro de
integridade antes de qualquer resultado. Novo Sol 6.1 revisou o candidate
agregado desde `471a7f8d1db5626eca708d53c7c6212597fcb48f` e retornou
`SOL_REVIEW=PASS`, sem novos achados. `F6-SIG-001=CLOSED`.

Também foi encerrado `F6-SIG-R1-001` (LOW), que pedia integração do predicate
com catálogo compilado e verificação de atributo, ausência, sourceDocument,
provenance e imutabilidade; Sol confirmou que os fixtures desta onda satisfazem
esses asserts.

Gates no candidate `4ea8a1a`: 150 testes Python; todos os sete testes
`tests/apps-script-*.test.js`; `node --check` em módulos e testes JS e em
`Code.gs`; `git diff --check`; duas regenerações do contrato compilado com
SHA-256 idêntico `bed974c8570d77707acb922f2db4ff771b4a6292e587bfd6856ee6343824914d`.
Esse PASS fecha somente o recorte da onda; a multiplicidade continua sem
contrato e Fase 6 continua incompleta.

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

## Matriz por Criterion (estado reconciliado até KB 5.44.0)

As colunas estruturais acompanham a Base vigente KB 5.44.0. Criteria retirados
permanecem listados somente para rastreabilidade histórica e estão marcados
`WITHDRAWN`; não integram os 34 ativos nem os 29 produtivos. Campos: Criterion,
Requirement, Table, APPLIES_TO/CONTEXT, FOR_EACH, ASSERT, VALIDATE,
FAIL_NONCONFORMITY, entidades/predicates referenciados, estado, bloqueador e
fonte canônica.

| CRITERION_ID | REQUIREMENT_ID | TABLE | APPLIES_TO / CONTEXT | FOR_EACH | ASSERT | VALIDATE | FAIL_NONCONFORMITY | ENTIDADES / PREDICATES | ESTADO / BLOQUEADOR | FONTE |
|---|---|---:|---|---|---|---|---|---|---|---|
| T1_DRT_REQUIRED | REQ_T1_DRT_REQUIRED | 1 | ctx `REQUIRED_TECHNICAL_RESPONSIBILITY RT_002_EXECUCAO_DE_OBRA` | — | `RESPONSIBILITY_HAS_ACCEPTED_DRT_EVIDENCE(RT_002_EXECUCAO_DE_OBRA)` | — | NC_T1_001 | RT-002, DRT; accepted DRT evidence | COVERED_UNDER_USER_DECISION_C: binding tipado/autenticado enumera todas as DRTs com `RESPONSIBILITY_TYPE=EXECUCAO`; o Criterion existencial não declara cardinalidade e preserva todas as referências no trace. Evidência positiva explícita produz TRUE; vínculo vazio/incompatível, sem inventário e cobertura de extração autenticados, produz MANUAL_REVIEW, nunca FALSE/NC_T1_001 | decisão do usuário 2026-10-19 (sem fonte confiável de completude); 03_table1.txt:16-31; Anexo A RT-002; Documento 11 §6-7; apps-script/ResponsibilityEvidenceCore.js:293-376; apps-script/EngineCore.js:383-423; tests/apps-script-pilot-criterion.test.js:638-648 |
| T1_DRT_REGISTERED | REQ_T1_DRT_REGISTERED | 1 | ctx `EACH_REQUIRED_TECHNICAL_RESPONSIBILITY` | — | `RESPONSIBILITY_EVIDENCE_ATTRIBUTE(REQUIRED_TECHNICAL_RESPONSIBILITY, REGISTERED)` | — | NC_T1_004 | RT requerida, DRT, REGISTERED | PARTIAL_EXECUTION_SUPPORT: divulga separadamente os literais de registro, emissão e pagamento de cada ART/RRT/TRT com documento-fonte e provenance; o resultado permanece MANUAL_REVIEW. Não há mapeamento de estado por conselho/tipo; nenhum literal, inclusive `Aprovado`, `Válido` ou `Rascunho`, produz PASS/FAIL/NC | 03_table1.txt:34-49; 01_entities.txt:62-80; 09_Especificacao_da_RDE.txt:146-172; 00_engine.txt:265-287; IRV 2024, Tabela 1, p. 4 |
| T1_DRT_SIGNED | REQ_T1_DRT_SIGNED | 1 | ctx `EACH_REQUIRED_TECHNICAL_RESPONSIBILITY` | — | `RESPONSIBILITY_EVIDENCE_ATTRIBUTE(REQUIRED_TECHNICAL_RESPONSIBILITY, SIGNED)` | — | NC_T1_005 | RT requerida, DRT, SIGNED | PARTIAL_EXECUTION_SUPPORT: divulga SIGNATURE_PARTY e SIGNATURE_MECHANISM literais por ART/RRT/TRT com fonte/provenance para conferência humana. O texto `PAdES`, `ICP-Brasil`, imagem ou carimbo não prova validade criptográfica; resultado continua MANUAL_REVIEW e sem FAIL/NC por insuficiência | 03_table1.txt:53-68; 01_entities.txt:62-83,132-138; 00_engine.txt:293-317 |
| T1_DRT_PROFESSIONAL_REGULARITY | REQ_T1_DRT_PROFESSIONAL_REGULARITY | 1 | ctx `EACH_REQUIRED_TECHNICAL_RESPONSIBILITY` | — | `RESPONSIBILITY_EVIDENCE_PROFESSIONAL_REGULARITY(REQUIRED_TECHNICAL_RESPONSIBILITY)` | same predicate in Requirement VALIDATE | NC_T1_009 | RT requerida, DRT.COUNCIL_STATE/PROFESSIONAL_REGULARITY | WITHDRAWN: não selecionar nem reintroduzir sem decisão normativa própria | histórico da retirada autorizada; snapshot baseline 6f82475, `knowledge-base/03_table1.txt:72-88` |
| T1_CONFORMITY_REPORT | REQ_T1_CONFORMITY_REPORT | 1 | ctx `REQUIRED_TECHNICAL_RESPONSIBILITY RT_002_EXECUCAO_DE_OBRA` | — | `RESPONSIBILITY_HAS_TECHNICAL_PRODUCT(RT_002_EXECUCAO_DE_OBRA, CONFORMITY_REPORT)` | — | NC_T1_003 | RT-002, produto técnico/relatório | PARTIAL_EXECUTION_SUPPORT: TRUE somente com associação documental explícita única entre DRT vinculada e REPORT exato, com sourceDocument e literal rastreados; vínculo ausente/ambíguo fica MANUAL_REVIEW. Correlação assistida continua bloqueada sem calibração empírica válida | 03_table1.txt:76-90; 02_requirements.txt:74-84; Anexo A RT-002; Documento 11 §5,8; RDE 1.8 §DOCUMENTARY_ASSOCIATIONS; 00_engine.txt:78-94 |
| T1_DRT_RI_LEGAL_ENTITY | REQ_T1_DRT_BASIC_DATA | 1 | ctx `EACH_REQUIRED_TECHNICAL_RESPONSIBILITY` | — | `RESPONSIBILITY_EVIDENCE_MATCHES_PROCESS_RI_LEGAL_ENTITY(REQUIRED_TECHNICAL_RESPONSIBILITY)` | — | NC_T1_006_RI | PROCESS/RI, RT requerida, DRT.RI_NAME | PARTIAL_EXECUTION_SUPPORT: divulga o literal RI_NAME em cada ART/RRT/TRT com documento-fonte e provenance suficiente no trace; Requirement VALIDATE e Criterion permanecem MANUAL_REVIEW. Não existe comparando tipado suficiente para confirmar identidade ou produzir FAIL/NC | 03_table1.txt:97-111; 02_requirements.txt:97-110; 01_entities.txt:62-91,140-152; 00_engine.txt:255-266 |
| T1_DRT_RT_NAME | REQ_T1_DRT_BASIC_DATA | 1 | ctx `EACH_REQUIRED_TECHNICAL_RESPONSIBILITY` | — | `RESPONSIBILITY_RT_MATCHES_PRODUCT(REQUIRED_TECHNICAL_RESPONSIBILITY)` | — | NC_T1_006_RT | DRT.RT_NAME, produto técnico, RT requerida | PARTIAL_EXECUTION_SUPPORT: divulga o literal RT_NAME em cada ART/RRT/TRT com documento-fonte e provenance suficiente no trace; Requirement VALIDATE e Criterion permanecem MANUAL_REVIEW. Falta vínculo tipado entre o produto e a mesma RT; nomes não são associados automaticamente | 03_table1.txt:115-129; 02_requirements.txt:97-110; 01_entities.txt:62-91; 00_engine.txt:268-291 |
| T1_DRT_ADDRESS | REQ_T1_DRT_BASIC_DATA | 1 | ctx `EACH_REQUIRED_TECHNICAL_RESPONSIBILITY` | — | `RESPONSIBILITY_EVIDENCE_MATCHES_PROCESS_ATTRIBUTE(REQUIRED_TECHNICAL_RESPONSIBILITY, ADDRESS)` | — | NC_T1_006_ADDRESS | PROCESS, DRT.ADDRESS, RT requerida | PARTIAL_EXECUTION_SUPPORT: divulga o literal PROPERTY_ADDRESS_TEXT de cada ART/RRT/TRT com documento-fonte e provenance suficiente no trace; mantém MANUAL_REVIEW. Comparação com componentes do requerimento, sem normalização ou perda de provenance, ainda não está formalizada; diferença não produz FAIL/NC | 03_table1.txt:133-148; 02_requirements.txt:97-110; 01_entities.txt:62-91,708-765; IN 1 - Parte 1, Anexo B, p.46 |
| T1_DRT_AREA | REQ_T1_DRT_BASIC_DATA | 1 | ctx `EACH_REQUIRED_TECHNICAL_RESPONSIBILITY` | — | `RESPONSIBILITY_EVIDENCE_MATCHES_PROCESS_ATTRIBUTE(REQUIRED_TECHNICAL_RESPONSIBILITY, AREA)` | — | NC_T1_006_AREA | PROCESS, DRT.AREA, RT requerida | PARTIAL_EXECUTION_SUPPORT: divulga o literal PROPERTY_AREA_TEXT de cada ART/RRT/TRT com documento-fonte e provenance suficiente no trace; mantém MANUAL_REVIEW. A IRV não seleciona qual dimensão de área do Anexo B comparar; nenhuma associação ou conclusão é inferida | 03_table1.txt:152-167; 02_requirements.txt:97-110; 01_entities.txt:62-91,708-765; IN 1 - Parte 1, Anexo B, p.46 |
| T1_CONFORMITY_REPORT_SIGNED | REQ_T1_CONFORMITY_REPORT_SIGNED | 1 | ctx `REQUIRED_TECHNICAL_RESPONSIBILITY RT_002_EXECUCAO_DE_OBRA` | — | `ALL(EXISTS(CONFORMITY_REPORT), TECHNICAL_PRODUCT_ATTRIBUTE(CONFORMITY_REPORT, SIGNED))` | — | — | produto técnico/relatório, SIGNED | PARTIAL_EXECUTION_SUPPORT: produto exato presente gera `EXISTS=TRUE` rastreável e o literal `SIGNATURE_MECHANISM`, quando extraído, aparece no trace com documento-fonte/provenance; o predicado SIGNED continua no ASSERT e resulta MANUAL_REVIEW sem recibo autenticado admissível. Ausência/inventário insuficiente permanece MANUAL_REVIEW, sem FAIL/NC. Não prova a associação RT-produto, verificada separadamente por T1_CONFORMITY_REPORT | 03_table1.txt:171-187; 02_requirements.txt:86-96; Anexo A RT-002; 01_entities.txt:1475-1492; 00_engine.txt:293-317 |
| T1_DRT_ACTIVITY_EXECUTION | REQ_T1_DRT_ACTIVITY_EXECUTION | 1 | ctx `REQUIRED_TECHNICAL_RESPONSIBILITY RT_002_EXECUCAO_DE_OBRA` | — | `RESPONSIBILITY_ACTIVITY_COMPATIBLE(RT_002_EXECUCAO_DE_OBRA)` | `RESPONSIBILITY_ACTIVITY_COMPATIBLE(RT_002_EXECUCAO_DE_OBRA)` | NC_T1_008 | RT-002, DRT, atividade | COVERED_UNDER_USER_DECISION_C: ao menos uma declaração literal `EXECUÇÃO` autorizada no catálogo em cada DRT vinculada, com provenance de item/origem, produz TRUE; evidência de atividade ausente, cobertura de extração não comprovada ou binding insuficiente produz MANUAL_REVIEW. Isso registra somente a declaração documental; não avalia competência profissional ampla nem compatibilidade atividade↔SMSCI | decisão do usuário 2026-10-19; 03_table1.txt:192-206; 02_requirements.txt:50-59; Anexo A RT-002; RDE 0.6/0.7 `drt_activity_items`; Documento 11 §6; apps-script/EngineCore.js:426-540; tests/apps-script-responsibility-evidence.test.js:420-700 |
| T1_DRT_SMSCI_COVERAGE | REQ_T1_DRT_SMSCI | 1 | ctx `REQUIRED_TECHNICAL_RESPONSIBILITY RT_003_EXECUCAO_DE_SISTEMA` | `WORKLIST.SMSCI` | `RESPONSIBILITY_IS_SATISFIED_FOR_SMSCI(RT_003_EXECUCAO_DE_SISTEMA, WORKLIST.SMSCI)` | — | NC_T1_002 | RT-003, DRT, SMSCI, WORKLIST.SMSCI | COVERED_UNDER_USER_DECISION_C: declarações conjuntas explícitas em ImmutableExecutionView para cada SMSCI vinculada produzem TRUE; ausência, conflito, cobertura de extração ou autenticação insuficiente resulta em MANUAL_REVIEW sem FAIL/NC. A decisão C estabelece que não existe fonte confiável disponível para declarar inventário e extração completos | decisão do usuário 2026-10-19; 03_table1.txt:210-227; 02_requirements.txt:62-71; Anexo A RT-003; RDE 1.8 § DRT SCOPE DECLARATION ITEMS; 08_execution_pipeline.txt:503-525,574-577 |
| T4_DRT_REGISTERED | REQ_T1_DRT_REGISTERED | 4 | ctx `EACH_REQUIRED_TECHNICAL_RESPONSIBILITY` | — | `RESPONSIBILITY_EVIDENCE_ATTRIBUTE(REQUIRED_TECHNICAL_RESPONSIBILITY, REGISTERED)` | — | NC_T4_017 | RT requerida, DRT, REGISTERED | PARTIAL_EXECUTION_SUPPORT: divulga separadamente os literais de registro, emissão e pagamento de cada ART/RRT/TRT com documento-fonte e provenance; o resultado permanece MANUAL_REVIEW. Não há mapeamento de estado por conselho/tipo; nenhum literal, inclusive `Aprovado`, `Válido` ou `Rascunho`, produz PASS/FAIL/NC | 04_table4.txt:14-29; 01_entities.txt:62-80; 09_Especificacao_da_RDE.txt:146-172; 00_engine.txt:265-287; IRV 2024, Tabela 1, p. 4 |
| T4_DRT_SIGNED | REQ_T1_DRT_SIGNED | 4 | ctx `EACH_REQUIRED_TECHNICAL_RESPONSIBILITY` | — | `RESPONSIBILITY_EVIDENCE_ATTRIBUTE(REQUIRED_TECHNICAL_RESPONSIBILITY, SIGNED)` | — | — | RT requerida, DRT, SIGNED | PARTIAL_EXECUTION_SUPPORT: divulga SIGNATURE_PARTY e SIGNATURE_MECHANISM literais por ART/RRT/TRT com fonte/provenance para conferência humana. O texto `PAdES`, `ICP-Brasil`, imagem ou carimbo não prova validade criptográfica; resultado continua MANUAL_REVIEW e sem FAIL/NC por insuficiência | 04_table4.txt:33-48; 01_entities.txt:62-83,132-138; 00_engine.txt:293-317 |
| T4_DRT_PROFESSIONAL_REGULARITY | REQ_T1_DRT_PROFESSIONAL_REGULARITY | 4 | ctx `EACH_REQUIRED_TECHNICAL_RESPONSIBILITY` | — | `RESPONSIBILITY_EVIDENCE_PROFESSIONAL_REGULARITY(REQUIRED_TECHNICAL_RESPONSIBILITY)` | same predicate in Requirement VALIDATE | NC_T4_019 | RT requerida, DRT.COUNCIL_STATE/PROFESSIONAL_REGULARITY | WITHDRAWN: não selecionar nem reintroduzir sem decisão normativa própria | histórico da retirada autorizada; snapshot baseline 6f82475, `knowledge-base/04_table4.txt:52-68` |
| T4_IN07_COMMISSIONING | REQ_IN07_COMMISSIONING | 4 | APPLIES_TO `SMSCI_SHP` | — | `ALL(EXISTS(SHP_COMMISSIONING_REPORT), MANUAL_REVIEW)` | `TECHNICAL_PRODUCT_ATTRIBUTE(SIGNED)` | NC_T4_001 | SHP report, DRT, SMSCI_SHP | PARTIAL_EXECUTION_SUPPORT: existência do relatório documentado gera TRUE rastreável; o literal `SIGNATURE_MECHANISM`, quando extraído, é exibido com origem. A decisão permanece MANUAL_REVIEW para validade da assinatura e correspondência DRT/produto/SMSCI; ausência/inventário insuficiente também permanece manual, sem FAIL/NC. A declaração FACT-ONLY de escopo não é admissão | 04_table4.txt:56-84; 02_requirements.txt:117-134; 01_entities.txt:1455-1473; Documento 10:456-458,644-646 |
| T4_IN08_ESTANQUEIDADE | REQ_IN08_ESTANQUEIDADE | 4 | APPLIES_TO `SMSCI_GAS` | — | `ALL(EXISTS(GAS_TIGHTNESS_REPORT), MANUAL_REVIEW)` | `TECHNICAL_PRODUCT_ATTRIBUTE(SIGNED)` | NC_T4_002 | laudo gás, DRT, SMSCI_GAS | PARTIAL_EXECUTION_SUPPORT: existência do laudo documentado gera TRUE rastreável no trace; datas documentais literais do `TEST_REPORT` exato são agora divulgadas com rótulo, texto, documento-fonte e provenance; o literal `SIGNATURE_MECHANISM`, quando extraído, também é exposto sem alegar validade. O resultado permanece MANUAL_REVIEW: o sistema não seleciona a data pertinente, interpreta formato, fixa data de avaliação, calcula validade temporal, comprova assinatura ou correspondência DRT/produto/SMSCI. Coleção vazia/inventário insuficiente não prova ausência; sem FAIL/NC por insuficiência. DRT_COVERS não é inferido nem consumido | 04_table4.txt:86-114; 02_requirements.txt:135-167; 01_entities.txt:1494-1510; RDE 0.5.0 documentary_date_items; apps-script/CriterionExecutionCore.js; tests/apps-script-pilot-criterion.test.js |
| T4_IN08_MANUAL | REQ_IN08_MANUAL | 4 | APPLIES_TO `SMSCI_GAS` | — | `EXISTS(GAS_OWNER_MANUAL)` | — | NC_T4_003 | GAS_OWNER_MANUAL | COVERED_UNDER_USER_DECISION_C: presença explícita rastreada produz TRUE; coleção vazia sem inventário e cobertura de extração confiáveis produz MANUAL_REVIEW, nunca NC | decisão do usuário 2026-10-19; 04_table4.txt:116-138; apps-script/CriterionExecutionCore.js; tests/apps-script-pilot-criterion.test.js |
| T4_IN09_DRT | REQ_IN09_DRT | 4 | APPLIES_TO `SMSCI_PRESSURIZATION` | — | `ALL(RESPONSIBILITY_EVIDENCE_ATTRIBUTE(REQUIRED_TECHNICAL_RESPONSIBILITY, RESPONSIBILITY_TYPE), MANUAL_REVIEW)` | — | NC_T4_004 | SMSCI pressurização, RT-003, RT-005, DRT/atividade | PARTIAL_EXECUTION_SUPPORT: divulga o literal `RESPONSIBILITY_TYPE` de cada ART/RRT/TRT presente na ImmutableExecutionView, com fonte e provenance; cada item fica explicitamente `UNASSOCIATED_WITH_REQUIRED_RESPONSIBILITY`. O resultado permanece `MANUAL_REVIEW`; lista vazia/inventário incompleto não prova ausência. Não compara atividade/serviço com SMSCI para RT-005/006/014, não cria associação e não emite FAIL/NC por insuficiência | 04_table4.txt:134-157; 02_requirements.txt:168-186; IRV Habite-se 2024, Tabela 4, p. 7; Anexo A RT-005; decisão do usuário sobre escopo de verificação RT-005/006/014; RDE 0.7; apps-script/EngineCore.js; tests/apps-script-pilot-criterion.test.js |
| T4_IN09_TEST_REPORT | REQ_IN09_TEST_REPORT | 4 | APPLIES_TO `SMSCI_PRESSURIZATION` | — | `ALL(EXISTS(PRESSURIZATION_TEST_REPORT), MANUAL_REVIEW)` | `TECHNICAL_PRODUCT_ATTRIBUTE(SIGNED)` | NC_T4_005 | laudo, DRT, itens art. 122, SMSCI | PARTIAL_EXECUTION_SUPPORT: presença do relatório documentado gera TRUE rastreável; o literal `SIGNATURE_MECHANISM`, quando extraído, é exibido com a origem. Conteúdo, DRTs, correspondência produto/SMSCI e validade da assinatura permanecem para conferência humana; ausência/inventário insuficiente fica manual, sem FAIL/NC. DRT_COVERS não é inferido nem consumido | 04_table4.txt:168-196; 02_requirements.txt:187-205; 01_entities.txt:1541-1560; RDE 1.8 § DRT SCOPE DECLARATION ITEMS; decisão do responsável 2026-10-21 |
| T4_IN09_MANUAL | REQ_IN09_MANUAL | 4 | APPLIES_TO `SMSCI_PRESSURIZATION` | — | `EXISTS(PRESSURIZATION_OPERATION_MANUAL)` | — | NC_T4_006 | PRESSURIZATION_OPERATION_MANUAL | COVERED_UNDER_USER_DECISION_C: presença explícita rastreada produz TRUE; coleção vazia sem inventário e cobertura de extração confiáveis produz MANUAL_REVIEW, nunca NC | decisão do usuário 2026-10-19; 04_table4.txt:198-218; apps-script/CriterionExecutionCore.js; tests/apps-script-pilot-criterion.test.js |
| T4_IN09_CHECKLIST | REQ_IN09_CHECKLIST | 4 | APPLIES_TO `SMSCI_PRESSURIZATION` | — | `EXISTS(PRESSURIZATION_MAINTENANCE_CHECKLIST)` | `TECHNICAL_PRODUCT_ATTRIBUTE(SIGNED)` | NC_T4_007 | checklist + assinatura | PARTIAL_EXECUTION_SUPPORT: checklist presente gera `EXISTS=TRUE` no trace e o literal `SIGNATURE_MECHANISM`, quando extraído, é exibido; SIGNED continua `MANUAL_REVIEW`; produto/inventário ausente permanece `MANUAL_REVIEW`, sem FAIL/NC por insuficiência | 04_table4.txt:220-242; 02_requirements.txt:220-230; apps-script/CriterionExecutionCore.js; tests/apps-script-pilot-criterion.test.js |
| T4_IN10_COMMISSIONING | REQ_IN10_COMMISSIONING | 4 | APPLIES_TO `SMSCI_SMOKE_CONTROL_MECHANICAL` (derived from explicit, traced CF mode) | — | `MANUAL_REVIEW` | `TECHNICAL_PRODUCT_ATTRIBUTE(SIGNED)` | NC_T4_008 | commissioning report, partes, DRT, smoke control | PREPARATORY_MANUAL_REVIEW_ONLY: mensagem instrui que o sistema não conclui a independência, RT diferente do solicitante isoladamente não basta, e autoria/DRT-produto-SMSCI ficam para conferência humana. Não integral | 04_table4.txt:244-274; 02_requirements.txt:235-253; 01_entities.txt:699-743,1615-1637,1710-1725; 02a_applicability.txt:180-207; IN 1/2024 (2024), Anexo B, pp. 46-47; IRV Habite-se 2024, Anexo A, Tabela 4, p. 9; BOECBM 01/2024, FI 17, art. 67 |
| T4_IN12_COMMISSIONING | REQ_IN12_COMMISSIONING | 4 | APPLIES_TO `SMSCI_SDAI` | — | `ALL(EXISTS(SDAI_COMMISSIONING_REPORT), MANUAL_REVIEW)` | `TECHNICAL_PRODUCT_ATTRIBUTE(SIGNED)` | NC_T4_009 | SDAI report, DRT, SMSCI_SDAI | PARTIAL_EXECUTION_SUPPORT: presença do relatório documentado gera TRUE rastreável; o literal `SIGNATURE_MECHANISM`, quando extraído, é exibido com origem. Validade da assinatura e correspondência DRT/produto/SMSCI permanecem para conferência humana; applicability continua derivada conforme contrato; ausência/inventário insuficiente fica manual, sem FAIL/NC. DRT_COVERS não é inferido nem consumido | 04_table4.txt:276-315; 02_requirements.txt:254-271; 01_entities.txt:1588-1606; Documento 10:456-458,644-646 |
| T4_IN15_COMMISSIONING | REQ_IN15_COMMISSIONING | 4 | APPLIES_TO `SMSCI_SPRINKLER` | — | `ALL(EXISTS(SPRINKLER_COMMISSIONING_REPORT), MANUAL_REVIEW)` | `TECHNICAL_PRODUCT_ATTRIBUTE(SIGNED)` | NC_T4_010 | sprinkler report, DRT, SMSCI_SPRINKLER | PARTIAL_EXECUTION_SUPPORT: presença do relatório documentado gera TRUE rastreável; o literal `SIGNATURE_MECHANISM`, quando extraído, é exibido com origem. Validade da assinatura e correspondência DRT/produto/SMSCI permanecem para conferência humana; ausência/inventário insuficiente fica manual, sem FAIL/NC. DRT_COVERS não é inferido nem consumido | 04_table4.txt:317-345; 02_requirements.txt:272-289; 01_entities.txt:1633-1651; Documento 10:456-458,644-646 |
| T4_IN18_CMAR | REQ_IN18_CMAR | 4 | APPLIES_TO `SMSCI_CMAR` | — | `EXISTS(CMAR_DECLARATION)` | `TECHNICAL_PRODUCT_ATTRIBUTE(SIGNED)` | NC_T4_011 | CMAR_DECLARATION + assinatura | PARTIAL_EXECUTION_SUPPORT: declaração CMAR presente gera `EXISTS=TRUE` no trace e o literal `SIGNATURE_MECHANISM`, quando extraído, é exibido; SIGNED continua `MANUAL_REVIEW`; produto/inventário ausente permanece `MANUAL_REVIEW`, sem FAIL/NC por insuficiência | 04_table4.txt:347-365; 02_requirements.txt:290-300; apps-script/CriterionExecutionCore.js; tests/apps-script-pilot-criterion.test.js |
| T4_IN19_APPLICABILITY_REVIEW | REQ_IN19_APPLICABILITY_REVIEW | 4 | APPLIES_TO `SMSCI_IN19_APPLICABILITY_REVIEW` | — | `LITERAL MANUAL_REVIEW` | — | — | SMSCI applicability-review | EXECUTABLE_EXISTING / literal MANUAL_REVIEW é executado e coberto | 04_table4.txt:371-385; Documento 10:480-483; apps-script/CriterionExecutionCore.js |
| T4_IN19_EXECUTION | REQ_IN19_EXECUTION | 4 | APPLIES_TO `SMSCI_IEL` | — | `EXISTS(LOW_VOLTAGE_EXECUTION_DRT)` | — | NC_T4_012 | LOW_VOLTAGE_EXECUTION_DRT | COVERED_UNDER_USER_DECISION_C: presença explícita rastreada produz TRUE; coleção vazia sem inventário e cobertura de extração confiáveis produz MANUAL_REVIEW, nunca NC; teste positivo/insuficiente e integração com readiness | decisão do usuário 2026-10-19; 04_table4.txt:393-409; apps-script/CriterionExecutionCore.js; tests/apps-script-pilot-criterion.test.js; tests/apps-script-validated-execution-readiness.test.js |
| T4_IN19_GROUNDING | REQ_IN19_GROUNDING | 4 | APPLIES_TO `SMSCI_IEL` | — | `EXISTS(GROUNDING_EXECUTION_DRT)` | — | NC_T4_013 | GROUNDING_EXECUTION_DRT | COVERED_UNDER_USER_DECISION_C: presença explícita rastreada produz TRUE; coleção vazia sem inventário e cobertura de extração confiáveis produz MANUAL_REVIEW, nunca NC; teste positivo/insuficiente e integração com readiness | decisão do usuário 2026-10-19; 04_table4.txt:413-429; apps-script/CriterionExecutionCore.js; tests/apps-script-pilot-criterion.test.js; tests/apps-script-validated-execution-readiness.test.js |
| T4_IN19_FINAL_VERIFICATION | REQ_IN19_FINAL_VERIFICATION | 4 | APPLIES_TO `SMSCI_IEL` | — | `EXISTS(LOW_VOLTAGE_FINAL_VERIFICATION_DRT)` | `RESPONSIBILITY_ACTIVITY_COMPATIBLE` | NC_T4_014 | final-verification DRT, RT/activity | COVERED: atividade literal RT-007 ligada à DRT concreta ART/RRT/TRT, apresentação/RDE correntes e provenance; declaração completa produz TRUE, ausência ou insuficiência produz MANUAL_REVIEW sem NC. GPT-6 review/re-review dirigida PASS; revisão final Sol da Fase 6 pendente | 04_table4.txt:433-449; 02_requirements.txt:339-351; 01_entities.txt:1609-1631; 09_Especificacao_da_RDE.txt:156-162,479-484; Anexo A RT-007; apps-script/EngineCore.js; apps-script/CriterionExecutionCore.js; tests/apps-script-responsibility-evidence.test.js |
| T4_IN19_LEGACY_DOCUMENTATION | REQ_IN19_LEGACY_DOCUMENTATION | 4 | APPLIES_TO `SMSCI_IEL` | — | `OR(EXISTS(LOW_VOLTAGE_EXECUTION_DRT), LITERAL MANUAL_REVIEW)` | — | — | LOW_VOLTAGE_EXECUTION_DRT | EXECUTABLE_EXISTING / executor avalia OR recursivo e MANUAL_REVIEW, unidade coberta no regime legado aplicável | 04_table4.txt:455-475; Documento 10:548-554; apps-script/CriterionExecutionCore.js |
| T4_IN19_REGIME_REVIEW | REQ_IN19_REGIME_REVIEW | 4 | APPLIES_TO `SMSCI_IEL` | — | `LITERAL MANUAL_REVIEW` | — | — | SMSCI_IEL/regime | LEGACY_REFERENCE_NOT_PRODUCTIVE / UNRESOLVED não é emitido nem selecionado | 04_table4.txt:479-493; 02a_applicability.txt:214-236 |
| T4_IN34_EXPLOSION_PROTECTION | REQ_IN34_EXPLOSION_PROTECTION | 4 | APPLIES_TO `M5_EXPLOSION_PROTECTION` | — | `HAS_DRT_ACTIVITY(M5_EXPLOSION_PROTECTION, EXECUCAO)` | — | NC_T4_016_01 | M5, DRT, activity | NOT_PRODUCTIVELY_REACHABLE / sem regra de applicability M5 | 04_table4.txt:499-513; 02a_applicability.txt:182-189 |
| T4_IN34_DUST_CONTROL | REQ_IN34_DUST_CONTROL | 4 | APPLIES_TO `M5_DUST_CONTROL` | — | `HAS_DRT_ACTIVITY(M5_DUST_CONTROL, EXECUCAO)` | — | NC_T4_016_02 | M5, DRT, activity | NOT_PRODUCTIVELY_REACHABLE / sem regra de applicability M5 | 04_table4.txt:517-531; 02a_applicability.txt:182-189 |
| T4_IN34_HEAT_SENSORS | REQ_IN34_HEAT_SENSORS | 4 | APPLIES_TO `M5_HEAT_SENSORS` | — | `HAS_DRT_ACTIVITY(M5_HEAT_SENSORS, EXECUCAO)` | — | NC_T4_016_03 | M5, DRT, activity | NOT_PRODUCTIVELY_REACHABLE / sem regra de applicability M5 | 04_table4.txt:535-549; 02a_applicability.txt:182-189 |
| T4_IN34_LIGHTNING_PROTECTION | REQ_IN34_LIGHTNING_PROTECTION | 4 | APPLIES_TO `M5_LIGHTNING_PROTECTION` | — | `HAS_DRT_ACTIVITY(M5_LIGHTNING_PROTECTION, EXECUCAO)` | — | NC_T4_016_04 | M5, DRT, activity | NOT_PRODUCTIVELY_REACHABLE / sem regra de applicability M5 | 04_table4.txt:553-567; 02a_applicability.txt:182-189 |

## Escopo estrutural e critérios de alcance

A enumeração histórica do baseline continha 36 Criteria. A regra
02a_applicability daquele snapshot tornava produtivos 31: os 4 Criteria M5 não
tinham regra de applicability e `T4_IN19_REGIME_REVIEW` era referência
UNRESOLVED legada, não selecionada pelo regime estrito. No baseline, o executor
suportava somente ASSERT `EXISTS`; após onda 1, também aceitava literal
`MANUAL_REVIEW` e `OR` recursivo sobre as formas suportadas, ainda sem
FOR_EACH ou VALIDATE. As seis unidades cobertas naquele snapshot estão
registradas na seção histórica "Cobertura atual após a onda 1".

Os 25 Criteria restantes foram classificados na ficha abaixo no snapshot do
baseline, antes da reconciliação F6-DEC-001.
O inventário não seleciona novo alcance nem altera applicability. Os estados
do baseline 6f82475 são históricos; a matriz reconciliada acima e a seção de
cobertura agregada abaixo registram o estado atual.

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
| F6-MC-002 | atributos registrados/signed/RI/RT/endereço/área/atividade/serviços/SMSCI e atributos de produto em Criteria T1/T4 | `SOURCE_DEFINED_NEEDS_FORMALIZATION` | IRV Tabela 1 pp.4–5 enumera fatos básicos e técnicos; no snapshot do baseline, `00_engine` já definia os contratos de assinatura/regularidade e resultados operacionais aplicáveis. | No baseline, a RDE 0.2.0 e ExecutionView não materializavam os atributos/relacionamentos necessários. Incluir apenas fatos FACT-ONLY tipados com provenance; assinatura não verificável segue MANUAL_REVIEW conforme contrato existente, sem comparar RT com solicitante.
| F6-MC-003 | T4_IN07_COMMISSIONING, T4_IN08_ESTANQUEIDADE, T4_IN12_COMMISSIONING, T4_IN15_COMMISSIONING | `MISSING_EVIDENCE_CONTRACT` | IRV verifica serviços e SMSCI declarados contra PPCI e requer DRT respectiva ao produto; IN01 art.108 III admite DRT única de execução exceto sistemas de RT específico. IN07, IN08, IN12 e IN15 especificam produtos/DRTs. | No baseline, faltava distinguir cobertura de execução de associação/atividade de DRT respectiva a produto. A RDE precisava registrar DRT, atividade, SMSCI, responsável e ligação documental inequívoca. DRT genérica de execução não comprova automaticamente ensaio/comissionamento. Correção: IN01 art.105 § único não é regra de DRT genérica; a referência é art.108 III.
| F6-MC-004 | T1_DRT_ACTIVITY_EXECUTION, T4_IN09_DRT e Criteria que usam RT-005/006/014 | `AUTHORIZED_SCOPE_LIMIT` | Decisão expressa do usuário: determinar se a atividade declarada é profissionalmente compatível com SMSCI cabe aos conselhos profissionais; a orientação disponível é não conferir essa correspondência no sistema do CBMSC. RT-002 permanece exceção factual limitada: comprovar que a DRT declara a atividade exata `EXECUÇÃO`, sem julgar habilitação/escopo. | Preservar atividade/serviço literal, tipo ART/RRT/TRT, DRT e provenance. Não comparar atividade com SMSCI por catálogo, texto, sinônimo ou semelhança para produzir PASS/FAIL/NC. Para RT-005/006/014, sem outro contrato factual completo, MANUAL_REVIEW. |
| F6-MC-005 | T4_IN08_ESTANQUEIDADE / VALID_WITHIN_YEARS(report,5); temporalidade IN19 | `MISSING_EVIDENCE_CONTRACT` (IN19 também exige formalização de regra source-defined) | IN08 art.95 p.20 e IRV Tabela4 definem laudo de estanqueidade válido até 5 anos e respectiva DRT. IN19 art.18 define execução, ou para imóvel concluído até publicação, manutenção dos últimos 5 anos ou reforma dos últimos 10 anos. | IN8: data de emissão/realização, data de avaliação autorizada e identidade do laudo. IN19: conclusão do imóvel, publicação da edição, datas/natureza da DRT. RDE atual não tem esses fatos. REQUEST_DATE seleciona edição operacional em 02a; PROPERTY_COMPLETION_DATE seleciona alternativa art.18. Separar dimensões: o plano CURRENT atual omite a alternativa para pedido de 2026, imóvel concluído em 2020 e manutenção de 2026. Não confundir publicação (25/04/2024 na separata) com vigência (24/04/2024).
| F6-MC-006 | T4_IN09_TEST_REPORT / REPORT_CONTAINS(report, IN09_ART122_REQUIRED_ITEMS) | `MISSING_EVIDENCE_CONTRACT` | IN09 art.122 p.42 lista DRTs, laudo, oito componentes de inspeção, manual e lista de verificação, além de remeter a itens de NBR14880 e NBR17240/IN12. | Conteúdo factual por item e associação com a DRT de vistoria/ensaio. Parâmetros NBR referenciados não devem ser inventados. Formalizar condicional de mecanismo automático quando previsto e não tornar genericamente opcionais os componentes listados.
| F6-MC-007 | T4_IN10_COMMISSIONING / REPORT_PREPARED_BY_INDEPENDENT_PARTY(report) | `MISSING_EVIDENCE_CONTRACT` | A IRV Habite-se 2024, Anexo A, Tabela 4, p. 9, restringe o relatório a sistema de controle de fumaça mecânico; o BOECBM 01/2024, FI 17, art. 67, alterou o art. 41 da IN 10 para a mesma condição. A Base 5.31.0 restringe o Criterion ao escopo interno mecânico, derivado do item CF somente se houver fato tipado explícito e rastreável `SMOKE_CONTROL_MODE`; ausência/conflito bloqueiam applicability. Escopo teve `INDEPENDENT_ARCH_REVIEW=PASS` limitado ao candidato `ca80d4d`. A diretriz operacional esclarecida em 2026-10-22 prioriza verificar RT/equipe autora diferente do solicitante, mas isso é apenas condição auxiliar e não substitui a independência integral expressa no art. 41 da IN 10 e na IRV: ausência de vínculo técnico com projeto ou execução. Atribuição profissional e formação não são inferidas nem se exige exclusivamente engenheiro mecânico. A interpretação institucional permanece não homologada. | A KB 5.33.0 agora tipa, em `REQUERIMENTO_ESCI`, a finalidade Habite-se, nomes/CPFs e declarações literais de igualdade do requerimento, com provenance RDE; isso só representa declarações documentais e não autentica pessoas. Ainda faltam comprovação de que esse documento foi extraído e vinculado à apresentação, identidade autenticada do autor/signatário do relatório, binding DRT↔relatório e recibo de assinatura suficiente. Não comparar compatibilidade de atividade e SMSCI nem inferir modo mecânico. Nenhuma decisão normativa humana está pendente neste blocker. |

**Classificação revisada naquela etapa inicial (histórica, posteriormente
substituída pela reconciliação F6-DEC-001):** MC-001 e MC-004 foram então
marcados como decisão humana; MC-002 como source-defined; MC-003, MC-005,
MC-006 e MC-007 como missing-evidence. A classificação não é uma partição das
25 unidades, pois os blockers se sobrepõem. O estado vigente consta no início
deste documento e na seção de revisão contratual agregada.

**Reconciliação vigente após F6-DEC-001 e RDE 0.7:** MC-001 e MC-004 são
`SOURCE_DEFINED_NEEDS_FORMALIZATION`; o Anexo A Rev. 2 contém entradas
concretas RT-002/003/005/006/007/014/015. RDE 0.7 também representa declarações
conjuntas literais DRT-produto-SMSCI-atividade. Para
`T1_DRT_SMSCI_COVERAGE`, o Engine consome integralmente a declaração explícita
no escopo autorizado: binding RT-003, cada SMSCI oficial da `WORKLIST` e a
atividade literal do catálogo. Casos positivos produzem TRUE; ausência,
conflito, proveniência insuficiente ou cobertura de extração não comprovada
permanece `MANUAL_REVIEW`, sem FAIL/NC. Esse suporte completo é específico ao
Criterion declarado; não classifica texto livre, não altera a RDE e não é
generalizado às demais verificações de atividade/SMSCI. A matriz vigente acima
e a contagem reconciliada abaixo registram o estado atual; as fichas MC-001/004
imediatamente anteriores preservam somente o snapshot histórico pré-decisão.

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
- A IRV Habite-se Anexo A, Tabela 4, p. 9 define independência para controle
  mecânico de fumaça. O art. 41 da IN 10 também expressa essa exigência. A
  leitura anterior que dizia o contrário está supersedida pela conferência da
  fonte e pela decisão do usuário de 2026-10-17 sobre a precedência da IRV na
  fiscalização. Faltam fatos documentais e predicate executável para prová-la
  (`MISSING_EVIDENCE_CONTRACT`); a decisão de fundamento não está pendente.

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

## Onda factual — atributos documentais da DRT

Pré-revisão Sol 6.1 da proposta: `SOL_CONTRACT_REVIEW=PASS` para formalizar
somente fatos documentais da DRT. A fonte direta é a IRV Habite-se, Anexo A,
Tabela 1, p. 4: conferir registro/emissão no Conselho (pagamento; não ser
rascunho) e assinatura digital do RT ou certificação digital do Conselho
emissor. `DRT_IDENTIFIER` registra o identificador impresso, distinguindo-o do
`record_id` opaco da RDE conforme o Documento 09-RDE. Nenhum desses campos é
conclusão de autenticidade, validade, assinatura válida ou satisfação de RT.

Foram formalizados como `TEXT` e estritamente FACT-ONLY:
`DRT_IDENTIFIER`, `COUNCIL_REGISTRATION_STATUS`, `COUNCIL_ISSUANCE_STATUS`,
`COUNCIL_PAYMENT_STATUS`, `SIGNATURE_PARTY` e `SIGNATURE_MECHANISM`. Cada
atributo registra apenas informação explicitamente apresentada na DRT
correspondente; ausência permanece ausência, registro/emissão/pagamento não se
inferem uns dos outros, e assinatura/certificação não verifica identidade ou
validade criptográfica. `SIGNATURE_PARTY` limita-se ao papel explicitamente
identificado como RT ou Conselho emissor.

Os seis atributos foram declarados diretamente em `DRT`, `ART`, `RRT` e `TRT`.
O catálogo compilado e `RdeCore.js` validam os atributos diretamente na
entidade do registro e não herdam atributos de `TYPE`; não se introduziu uma
mudança geral de herança no gerador/runtime. Testes verificam os quatro
catálogos, admissão dos valores textuais com provenance/source document,
ausência, rejeição de tipo incompatível e rejeição em entidade não DRT.

Esta onda não implementa predicate, não associa DRT à Responsabilidade exigida
ou a produto, não define cardinalidade/seleção e não converte os estados
textuais em `REGISTERED` ou `SIGNED`. Portanto não aumenta a cobertura
executável: permanecem 6/31 Criteria produtivos cobertos, 24 integralmente
bloqueados e 1 parcialmente suportado mas bloqueado por multiplicidade. Os
Criteria `T1/T4_DRT_REGISTERED` e `T1/T4_DRT_SIGNED` continuam sem executor até
que associação responsabilidade↔DRT, cardinalidade/pareamento e semântica de
estado estejam contratados. O candidate
`770da61dd6d33e05a79c8a781d6a6d9921b233a3` recebeu
`SOL_CONTRACT_DIFF_REVIEW=PASS`; Sol registrou o achado LOW `F6-DRT-001` para
delimitadores `END` redundantes e uma observação INFO sobre combinação
inconsistente de parte/mecanismo na fixture. Ambos foram corrigidos no
follow-up `660fdfaaf76a4b01cd1d91e4c01586f3936a1d80`; nova instância Sol 6.1
retornou `SOL_CONTRACT_DIFF_REVIEW=PASS`, encerrou `F6-DRT-001` e não abriu
achados. Confirmou que o diff do follow-up preserva somente os seis campos
`TEXT` e que o contrato compilado permaneceu idêntico. Após a correção, os gates
foram executados novamente: 150 testes Python, sete testes JS, sintaxe de todos
os módulos/testes e `Code.gs`, duas gerações com SHA-256
`3f17937ba479da50102007211100f92d15bebe958f246a70a542b8743f96e58e` e
`git diff --check`.

## Formalização factual RDE 0.4.0 — em revisão de implementação

Revisão independente de contratos no HEAD `55a72005aa83c55483340554d0eba4564b15e363`
retornou `SOL_CONTRACT_REVIEW=FAIL` para execução de DRT. Sol não identificou
decisão normativa humana pendente; registrou que seleção/cobertura, associação
DRT-produto, temporalidade e independência ainda exigem contratos computáveis
e/ou fatos. Como avanço factual mínimo, uma segunda revisão independente
aprovou (`SOL_SCHEMA_REVIEW=PASS`) a proposta de coleção RDE 0.4.0
`drt_declaration_items`: unidade documental explicitamente agrupada na própria
DRT, textos literais, DRT e origem estruturalmente autenticados, provenance e
ordem preservadas. A aprovação não cobre `DRT_COVERS`, mapeamento de valores,
seleção de evidência, compatibilidade, resultados ou Criteria.

A implementação candidata adiciona a versão 0.4.0 mantendo validação de 0.2.0
e 0.3.0 sem migração, conserva a coleção imutável na ExecutionView e não a
consome em execução normativa. Rejeita chaves/versões incompatíveis, relações
pendentes ou de tipo errado, textos ausentes/não literais e provenance
inválida. Naquele snapshot, cobertura registrada era 9/31 Criteria produtivos; não foram adicionados
predicates nem capacidade de Criterion. Revisão Sol 6.1 do diff efetivo ainda
pendente naquele momento; a revisão do candidate
`3fe96004912dde5f356d6ce1a23cf511f1ffc5f0` encontrou e abriu F6-040. O finding
foi corrigido em `ef6cd5a9c294e9d777cfbdde654d8b88795f737c`, revisado contra
`3fe96004912dde5f356d6ce1a23cf511f1ffc5f0` e aprovado por Sol 6.1 com
`SOL_REVIEW=PASS`, sem findings novos. Esta aprovação fecha somente F6-040 e
aprova a formalização factual RDE 0.4.0; não fecha os contratos DRT-COVERS ou
os outros blockers da Fase 6.

### Finding Sol F6-040

Na revisão independente do candidate `3fe96004912dde5f356d6ce1a23cf511f1ffc5f0`,
Sol retornou `SOL_REVIEW=FAIL` com um finding MEDIUM: o construtor público da
ExecutionView aceitava propriedades não enumeráveis na coleção nova e podia
descartar campos ocultos da provenance durante a cópia imutável. A correção
local exige array estritamente denso e valida provenance recursivamente como
JSON estrito antes da cópia; testes reproduzem propriedades ocultas e
accessors. Sol revisou o candidate `ef6cd5a9c294e9d777cfbdde654d8b88795f737c`,
reproduziu a rejeição dos ataques e retornou `SOL_REVIEW=PASS`; F6-040 está
encerrado. Gates completos passaram nesse candidate.

## Onda factual — dados básicos identificados na DRT

Pré-revisão independente Sol 6.1: `SOL_CONTRACT_REVIEW=PASS` para a proposta
de registrar quatro textos documentais: `RI_NAME`, `RT_NAME`,
`PROPERTY_ADDRESS_TEXT` e `PROPERTY_AREA_TEXT`. A fonte direta é IRV Habite-se,
Anexo A, Tabela 1, p. 4, que manda identificar e conferir no DRT o nome do RI,
nome do RT, endereço da edificação e área informada do imóvel. Os campos são
TEXT: preservam os valores como apresentados, inclusive unidade e
qualificadores da área. A proposta proíbe inferir os papéis de RI/RT,
normalizar ou comparar nomes, identidade jurídica, endereços ou áreas, e não
escolher ou concatenar valores ambíguos. Os campos foram declarados diretamente
em DRT/ART/RRT/TRT, sem introduzir herança no gerador/RDE. O `source_document`
dos subtipos continua apontando para entidade efetivamente `TYPE DOCUMENT`.

Esta formalização FACT-ONLY não implementa os predicados atuais de comparação
nem mapeia implicitamente `PROPERTY_ADDRESS_TEXT`/`PROPERTY_AREA_TEXT` para os
seletores `ADDRESS`/`AREA`. Assim, os Criteria de dados básicos continuam
bloqueados por associação responsabilidade↔DRT e contratos de comparação; a
cobertura permanece 6/31 (24 bloqueados e 1 parcialmente suportado, ainda
bloqueado por multiplicidade).

O candidate `21f8cc37cc9b8746f267322ffbd5cf0a55d1700d` recebeu
`SOL_CONTRACT_DIFF_REVIEW=PASS` em revisão independente read-only contra o
baseline `a7d0ba6108a0bd102a289d42eec19f54fe56fd3f`. Sol confirmou suporte
direto da IRV para os quatro fatos e os limites FACT-ONLY acima; não encontrou
achados bloqueantes nem decisão humana adicional. A revisão confirmou que
somente `entityCatalog` mudou no artefato gerado. Os gates completos desta
onda passaram: 150 testes Python, sete testes JS, `node --check` de todos os
módulos/testes e validação sintática de `Code.gs`, duas gerações byte-idênticas
com SHA-256 `a4778f934ded0eb46397bce325aeb7a55739ba10d28022f470fca2cee254b5dc`,
e `git diff --check`. Nenhum Requirement, Criterion, Nonconformity, predicate,
executor ou resultado foi alterado; ANALYZED não foi iniciado.

## Onda factual — atividade, serviços e escopo declarado na DRT

Proposta revisada independentemente antes da alteração:
`SOL_FACT_PROPOSAL_REVIEW=PASS`. A IRV Habite-se, Anexo A, Tabela 1, p. 5,
determina identificar na DRT a descrição das atividades profissionais,
especificando os serviços, e os SMSCI pelos quais o RT declara
responsabilidade. Foram formalizados dois fatos textuais em `DRT`, `ART`,
`RRT` e `TRT`: `DECLARED_ACTIVITY_SERVICE_TEXT` e
`DECLARED_SMSCI_SCOPE_TEXT`.

Os valores preservam o texto da DRT e seus qualificadores, com provenance no
registro. A declaração genérica permanece literal; não é expandida pela lista
do PPCI. Não se resumem nem normalizam atividades/serviços, não se associam
itens entre si e não se deduz compatibilidade, cobertura, execução,
regularização, validade, atendimento de RT ou vínculo com produto técnico.
Se a atribuição à DRT for ambígua ou houver declarações incompatíveis sem
vínculo documental inequívoco, não selecionar nem concatenar candidatos. A
RDE atual não representa cardinalidade/vínculos por item; associação entre
atividade, serviço, SMSCI, profissional, produto e responsabilidade permanece
`MISSING_EVIDENCE_CONTRACT`.

Esta onda não acrescenta predicate, Requirement, Criterion, Nonconformity ou
resultado e não aumenta cobertura: permanecem 6/31 Criteria produtivos cobertos
(24 integralmente bloqueados e 1 parcialmente suportado, ainda bloqueado por
multiplicidade). A pré-revisão Sol confirmou a fonte e os limites, mas não
atestou extração confiável nem cobertura executável. Gates locais passaram
antes do registro final: 150 testes Python, sete testes JS, sintaxe de todos os
módulos/testes e `Code.gs`, duas gerações byte-idênticas com SHA-256
`a68906db309d35e3c495f2ccbc25b53393ab520004149b79b2057a4a7fdc79e0`, e
`git diff --check`. Revisão Sol do diff efetivo e candidato commit/push estão
registrados como concluídos: o candidate
`c67e1eafed1062eb39222460d00b3f5d1f8f9454`, revisado contra baseline
`deafe5a01bf3bfda1cd3b4e341eb6b080ad25ecf`, recebeu
`SOL_CONTRACT_DIFF_REVIEW=PASS`, sem findings e sem decisão humana. Sol
confirmou que apenas `entityCatalog` mudou com os dois atributos nas quatro
entidades DRT e que os fixtures respeitam o envelope RDE. A cobertura continua
6/31. O candidato está publicado no branch; ANALYZED não foi iniciado.

## Onda factual — emissão, cancelamento e distrato da DRT

Proposta revisada independentemente antes da alteração:
`SOL_FACT_PROPOSAL_REVIEW=PASS`. A IN 19, art. 18, parágrafo único,
alíneas b/c, usa expressamente a data de emissão para as alternativas de
manutenção (últimos 5 anos) e reforma (últimos 10 anos); a IRV Habite-se,
Tabela 4, p. 9, reproduz a verificação. A DTZ OP nº 26/2026, art. 74, caput,
incisos I e II(b), menciona comunicação de revogação/cancelamento, DRT de
baixa por distrato total ou DRT de distrato de contrato e serviços
efetivamente realizados e sob responsabilidade.

Foram formalizados como campos opcionais `TEXT` em DRT/ART/RRT/TRT:
`DRT_ISSUE_DATE_TEXT`, `DRT_DOCUMENT_ROLE_TEXT`,
`DRT_CANCELLATION_STATUS_TEXT` e `DRT_TERMINATION_SERVICES_TEXT`. Preservam o
conteúdo e os rótulos literais, sem normalizar datas, inferir papel ou
cancelamento, ou concluir invalidade perante o CBMSC. A associação da
comunicação externa do RT à DRT, datas de cancelamento, períodos de execução,
vínculo entre DRTs sucessivas, continuidade temporal e comparação de prazos
permanecem fora desta formalização e sem executor.

Nenhum predicate, Requirement, Criterion, Nonconformity ou resultado foi
alterado; a cobertura continua 6/31 (24 bloqueados e 1 parcialmente
suportado, ainda bloqueado por multiplicidade). Os gates passaram: 150 testes
Python, sete testes JS, sintaxe de todos os módulos/testes e `Code.gs`, duas
gerações byte-idênticas com SHA-256
`77b4e53117788dc784218fe2045c7ca845ca3dcece5dd6399bfc5ee224979a57`, e
`git diff --check`. O candidate
`8103ca758397552673f650eac803126cc65228ba`, revisado contra baseline
`2b00b3de03a43ca1b61600b7741cef20e4176723`, recebeu
`SOL_CONTRACT_DIFF_REVIEW=PASS` sem decisão humana, com o finding LOW
`F6-DATE-001` aberto sobre a clareza/coerência dos exemplos: a fixture
compartilhava fatos de distrato com uma ART de execução. O finding é restrito
aos exemplos sintéticos e não altera a semântica; a correção separa DRT de
execução, DRT de distrato e registro documental de cancelamento. Os gates
foram repetidos após a correção e passaram; o follow-up aguarda novo commit,
push e revisão independente. O follow-up
`6be19ce463bf0984914ba04010d46d1bfcede1ef`, revisado contra baseline
`8103ca758397552673f650eac803126cc65228ba`, recebeu
`SOL_FOLLOWUP_REVIEW=PASS`; `F6-DATE-001=CLOSED`, sem novos achados. Sol
confirmou que execução, distrato e registro de cancelamento estão separados e
que nenhum resultado normativo foi introduzido.

## Onda estrutural — associações documentais explícitas na RDE 0.3.0

O bloqueio de pareamento entre documentos pode ser resolvido parcialmente sem
inferência: o Documento 09-RDE passa a formalizar, na versão 0.3.0, uma coleção
ordenada `documentary_associations` de declarações documentais literais entre
dois registros, com documento-fonte e provenance opcional. A pré-revisão Sol
6.1 da proposta do contrato retornou `SOL_FACT_PROPOSAL_REVIEW=PASS`, sem
decisão humana. A relação mantém-se FACT-ONLY: afirma somente que a fonte
explicitamente associa aqueles registros; não determina DRT_COVERS, validade,
SMSCI, compatibilidade, suficiência, atendimento, funcionamento ou resultado.

A RDE 0.3.0 exige o campo, que pode estar vazio; o validador verifica endpoints
distintos e resolvidos na mesma RDE, documento-fonte `TYPE DOCUMENT`, IDs
únicos e ausência de repetição estruturalmente idêntica. Não impõe hierarquia
nem rejeita ciclos de associações. A ImmutableExecutionView preserva a versão e
expõe associações tipadas, imutáveis e em ordem de origem. RDE 0.2.0 continua
legível sem associação fabricada; qualquer futura unidade que dependa dessa
relação deverá exigir 0.3.0. Identificadores ausentes ou ambíguos não são
resolvidos por nome de arquivo, ordem, proximidade ou LLM.

Esta onda não altera predicate, Requirement, Criterion, Nonconformity ou
resultado e não amplia a execução. Cobertura permanece 6/31 Criteria
produtivos: 24 bloqueados e 1 parcialmente suportado, ainda bloqueado por
multiplicidade/evidência. O contrato explícito resolve somente a lacuna de
representação quando a fonte declara a relação; estados/atributos da DRT,
identidade de produto, cardinalidade e fatos para provar atividade, cobertura,
regularização e suficiência continuam a exigir contratos/fatos próprios.

A candidata local está em implementação e ainda não foi commitada nem revisada
no diff efetivo. Gates da rodada: 150 testes Python; sete testes Apps Script;
`node --check` em todos os módulos/testes e `Code.gs`; duas regenerações
byte-idênticas de `CompiledRuntimeContract.js`, SHA-256
`77b4e53117788dc784218fe2045c7ca845ca3dcece5dd6399bfc5ee224979a57`; testes
focados RDE/view passaram antes da última adição de casos para ciclos e
endpoint dangling. `git diff --check` passou. Repetirei os gates após concluir
esses casos e antes do commit/push e revisão Sol do diff.

### Revisão adversarial e correção de findings — associações RDE

A revisão independente do candidate `733dfb4d7a10ee6d192557f574050085c0a21049`,
contra baseline `7dbeb976affe00fc8c5c65e3d1215326e8233125`, retornou
`SOL_CONTRACT_DIFF_REVIEW=FAIL` sem decisão humana. Achados: `F6-ASSOC-001`
MEDIUM (projeção pública podia aceitar e normalizar associação inválida),
`F6-ASSOC-002` MEDIUM (Code.gs só buscava o filename da versão corrente, apesar
de core/view aceitarem 0.2.0), `F6-ASSOC-003` LOW (array esparso de associação
passava validação) e `F6-ASSOC-004` LOW (evidência do inventário ainda marcava
gates/revisão como pendentes). O Sol confirmou que a proposta FACT-ONLY
continuava válida; não identificou regra normativa nova.

Correções no follow-up em andamento: a projeção valida a coleção original
antes de criar referências/view e rejeita campo de associação em RDE 0.2.0;
validação de associations rejeita holes, propriedades extras e accessors; o
adaptador Apps Script lê `rde-v[versão registrada].json`, suporta
0.2.0/0.3.0 sem reescrever o artifact e confere a versão do conteúdo contra o
registro; entrega o catálogo compilado ao validador operacional para que RDE
com registros de qualquer uma dessas versões seja estruturalmente validada.
Testes exercitam getter/campo extra, versão conflitante, associação em 0.2.0 e
array esparso. Não houve mudança de semântica das relações. A
revisão independente do follow-up ainda está pendente. Os gates deste
follow-up já passaram: 150 testes Python; sete suítes Apps Script; `node
--check` nos módulos/testes e `Code.gs`; duas regenerações byte-idênticas do
runtime com SHA-256
`77b4e53117788dc784218fe2045c7ca845ca3dcece5dd6399bfc5ee224979a57`; e
`git diff --check`. Coverage permanece 6/31. O resultado Sol do follow-up será
registrado após a nova revisão independente.

### Finding residual de envelope — acesso calculado a `documentary_associations`

A revisão do follow-up `3bd2286c6391506b21ad0d456081bae72b4d82a5`, contra
`733dfb4d7a10ee6d192557f574050085c0a21049`, retornou FAIL com os findings
anteriores `F6-ASSOC-001..004` fechados e um novo MEDIUM,
`F6-ASSOC-005`: a propriedade raiz `documentary_associations` podia ser getter
e devolver arrays diferentes durante validação e projeção. O Sol reproduziu
quatro leituras e uma view que continha uma associação não validada.

Correção local: envelope exato rejeita propriedades não-dado (incluindo
accessors e símbolos); validação captura/usa o descriptor de versão e a
coleção; projeção valida o envelope, captura a coleção uma única vez e a mesma
referência é usada na validação e materialização. Testes exigem que o getter
raiz seja rejeitado sem ser chamado. Os gates completos desta correção, o
commit/push e nova revisão independente ainda estão pendentes. Os gates agora
passaram: 150 testes Python; sete suítes Apps Script; sintaxe de todos os
módulos/testes JS e `Code.gs`; duas regenerações byte-idênticas com SHA-256
`77b4e53117788dc784218fe2045c7ca845ca3dcece5dd6399bfc5ee224979a57`; e
`git diff --check`. Os fixtures de applicability/pilot foram atualizados para
usar envelope RDE completo, conforme exigido pela projeção fechada. Cobertura
permanece 6/31 e a revisão Sol do novo candidate ainda não ocorreu.

A revisão independente seguinte encontrou `F6-ASSOC-006` MEDIUM no candidate
`a278766a1009a9a3646c8540921cad52af382a95`: prototype customizado da coleção
vazia podia fornecer `map()` herdado e fabricar uma associação durante a
projeção. Correção local: materialização de associações e processamento de
`associationEntries` usam loops indexados e descriptors de valores próprios,
sem chamar `map`/`forEach` herdados. O mesmo padrão de callbacks herdados foi
removido de `records` na validação estrutural e projeção. Fixtures adversariais
de `map` e `forEach` herdados verificam que os métodos não são executados e
nenhum registro ou associação é criado. Gates completos, commit/push e nova
revisão Sol dessa correção ainda estão pendentes. Gates locais passaram:
150 testes Python; sete suítes Apps Script; sintaxe de todos os módulos/testes
JS e `Code.gs`; duas gerações byte-idênticas com SHA-256
`77b4e53117788dc784218fe2045c7ca845ca3dcece5dd6399bfc5ee224979a57`; e
`git diff --check`. Cobertura continua 6/31.

A revisão estática do candidate `b5ae932c6b83abfd99af52d0cfa08d33bb3b09ae`
fechou `F6-ASSOC-001..006`, mas abriu `F6-ASSOC-007` MEDIUM (array de
provenance ainda passava por `map()` herdado) e `F6-ASSOC-008` MEDIUM
(accessors em campos de record poderiam fornecer novos `attributes` ou
`provenance` depois de validações). Correção local em andamento: canonicalização
de arrays usa descriptors/índices próprios, envelope de record rejeita campos
calculados, e `attributes`/`provenance` são validados recursivamente como dados
JSON antes de serem lidos pela projeção. Fixtures verificam que getters e
`map()` herdados não executam. Gates locais deste estado passaram:
150 testes Python; sete suítes Apps Script; sintaxe de todos os módulos/testes
JS e `Code.gs`; duas gerações byte-idênticas com SHA-256
`77b4e53117788dc784218fe2045c7ca845ca3dcece5dd6399bfc5ee224979a57`; e
`git diff --check`. Commit/push e revisão independente deste candidate ainda
estão pendentes. Cobertura continua 6/31.

A revisão independente do candidate `a9d986c1a118008a82d0972b4a5d69f61bc226cd`
fechou `F6-ASSOC-001..008` e abriu `F6-ASSOC-009` MEDIUM: os helpers de
classificação de objeto consultavam `Object.prototype.toString`, que pode
invocar um getter de `Symbol.toStringTag` antes da rejeição de símbolos.
Correção: os dois helpers verificam tipo e cadeia de protótipos sem consultar
`toStringTag`; fixtures em RDE e projeção confirmam rejeição e zero chamadas do
getter. Os gates completos desta correção passaram: 150 testes Python, sete
suítes Apps Script, sintaxe de todos os módulos/testes JS e `Code.gs`, duas
gerações byte-idênticas de `CompiledRuntimeContract.js` com SHA-256
`77b4e53117788dc784218fe2045c7ca845ca3dcece5dd6399bfc5ee224979a57`, e
`git diff --check`. A revisão independente do candidate corrigido e seu
commit/push ainda estão pendentes. Cobertura permanece 6/31; esta correção de
integridade não acrescenta predicate nem amplia execução normativa.

A revisão independente do candidate `51a061ad8c6f9ecd0b649ac841bdbab061b0a711`
confirmou o fechamento de `F6-ASSOC-009`, mas abriu `F6-ASSOC-010` MEDIUM:
objetos nativos sem protótipo poderiam ser classificados como objetos simples
e normalizados para `{}`. A correção mantém a classificação intrínseca de
`Object.prototype.toString` somente depois de percorrer a cadeia de protótipos
por descriptors próprios e rejeitar qualquer `Symbol.toStringTag`, sem invocar
accessors. Regressões cobrem getter não executado, `Date` e `Number` encapsulado
com protótipo removido em validação RDE, e `Date` em provenance de associação
na projeção. Os gates completos passaram: 150 testes Python, sete suítes
Apps Script, `node --check` em módulos/testes e `Code.gs`, duas regenerações
byte-idênticas do contrato compilado com SHA-256
`77b4e53117788dc784218fe2045c7ca845ca3dcece5dd6399bfc5ee224979a57`, e
`git diff --check`. Commit/push e nova revisão Sol deste candidato ainda
pendentes; cobertura permanece 6/31 e não houve execução normativa ampliada.

A revisão independente do candidate `e03ed749b3a39d769fb2078467538a97af444818`
fechou `F6-ASSOC-009`, mas manteve `F6-ASSOC-010` MEDIUM aberto: `Map` e
`Set` com protótipo removido não expõem tag intrínseca por
`Object.prototype.toString` e podiam ser convertidos silenciosamente em `{}`.
Correção local: os helpers agora exigem a cadeia de protótipos dos objetos
JSON e rejeitam protótipo nulo, além de percorrer descriptors de
`Symbol.toStringTag` antes da classificação intrínseca. Fixtures cobrem `Map`
e `Set` sem protótipo na validação RDE e na projeção, além das regressões de
`Date`, `Number` e getter. Gates completos passaram: 150 Python, sete suítes
Apps Script, sintaxe JS/`Code.gs`, duas gerações byte-idênticas com SHA-256
`77b4e53117788dc784218fe2045c7ca845ca3dcece5dd6399bfc5ee224979a57`, e
`git diff --check`. Este candidato corrigido ainda aguarda commit/push e nova
revisão independente Sol; cobertura continua 6/31.

A revisão independente do candidate `f00afbf31b8bfa2969b0394983e95fbb1751eeb6`
identificou a mesma falha residual em `Map`/`Set` quando o protótipo era
substituído por `Object.prototype`, mantendo `F6-ASSOC-010` MEDIUM aberto.
Este candidato acrescenta verificações de marca sem mutação usando os métodos
nativos `has` de `Map`, `Set`, `WeakMap` e `WeakSet`, antes de inspecionar
`Symbol.toStringTag`. As fixtures agora testam as quatro coleções com protótipo
nulo e com `Object.prototype` tanto na validação RDE quanto na projeção de
provenance; os testes de `Date`, `Number` e getter permanecem. Gates completos
passaram: 150 testes Python, sete suítes Apps Script, sintaxe de módulos/testes
JS e `Code.gs`, duas regenerações byte-idênticas do contrato com SHA-256
`77b4e53117788dc784218fe2045c7ca845ca3dcece5dd6399bfc5ee224979a57`, e
`git diff --check`. O candidato corrigido ainda aguarda commit/push e revisão
independente Sol; cobertura permanece 6/31.

A revisão independente do candidate `4cabd534ac050dcad42be5efdee78129d1723247`
confirmou a correção dos bypasses das quatro coleções, mas encontrou outro
caso da mesma fronteira: `ArrayBuffer` e `DataView` com protótipo substituído
por `Object.prototype` podiam perder seus slots internos na canonicalização e
projeção. F6-ASSOC-010 continua aberto. Este candidate estende os brand checks
para views via `ArrayBuffer.isView`, `ArrayBuffer`/`SharedArrayBuffer` via
getters nativos de `byteLength` e `DataView` via seu getter nativo, todos sem
ler campos fornecidos pelo objeto nem mutá-lo. Fixtures cobrem ArrayBuffer,
DataView e typed array em ambos os protótipos na validação RDE e na projeção.
Gates completos passaram: 150 testes Python, sete suítes Apps Script, sintaxe
de módulos/testes JS e `Code.gs`, duas regenerações byte-idênticas com SHA-256
`77b4e53117788dc784218fe2045c7ca845ca3dcece5dd6399bfc5ee224979a57`, e
`git diff --check`. O candidato corrigido aguarda commit/push e nova revisão
Sol; cobertura continua 6/31.

A revisão independente do candidate `5c0425c2b97ebb7ad5bfcbd5a4d41b422ea85e40`
retornou `SOL_CONTRACT_DIFF_REVIEW=PASS`. Sol confirmou `F6-ASSOC-009` e
`F6-ASSOC-010` fechados, sem novo finding e sem regressão para objetos JSON
válidos. `F6-ASSOC-001..010=CLOSED`. As 150 verificações Python, sete suítes
Apps Script, checagem sintática de todos os módulos/testes JS e `Code.gs`,
dupla regeneração byte-idêntica (`77b4e53117788dc784218fe2045c7ca845ca3dcece5dd6399bfc5ee224979a57`)
e `git diff --check` foram executados antes da revisão neste SHA. A onda trata
somente integridade da RDE/view; cobertura normativa continua 6/31 e nenhuma
transição para `ANALYZED` foi iniciada.

## Fechamento da integridade da associação documental

O candidate `5c0425c2b97ebb7ad5bfcbd5a4d41b422ea85e40` recebeu
`SOL_CONTRACT_DIFF_REVIEW=PASS` contra `4cabd534ac050dcad42be5efdee78129d1723247`.
Sol confirmou `F6-ASSOC-009` e `F6-ASSOC-010` encerrados e não encontrou
regressões em objetos JSON válidos. A revisão verificou as quatro marcas de
coleção, buffers, DataView e typed arrays com protótipos substituídos. Gates
completos passaram no candidate revisado: 150 Python, sete suítes Apps Script,
sintaxe de todos os módulos/testes JS e `Code.gs`, regeneração dupla
byte-idêntica com SHA-256
`77b4e53117788dc784218fe2045c7ca845ca3dcece5dd6399bfc5ee224979a57` e
`git diff --check`. Os findings de integridade `F6-ASSOC-001..010` estão
fechados; nenhuma regra normativa ou resultado foi adicionado. Cobertura segue
6/31 e a Fase 5B/`ANALYZED` não foi iniciada.

## Onda factual — mecanismo de assinatura em produtos técnicos

Revisão Sol 6.1 pré-alteração: `SOL_CONTRACT_REVIEW=PASS` para disponibilizar
`SIGNATURE_MECHANISM TEXT` nos produtos já vinculados a Requirements com
`EVIDENCE_ATTRIBUTE SIGNED`. A fonte geral de assinatura em processo eletrônico
é IN 01, art. 30: documento autônomo produzido por RT e posteriormente
inserido requer assinatura digital; declaração/documento produzido dentro do
portal tem autenticação por usuário e senha, com as alternativas expressas do
artigo. Para laudos, ensaios, inspeções e mensurações, IN 01, art. 108, § 3º,
exige nome e assinatura do RT. As INs específicas identificam os produtos:
IN 07, art. 106/Anexo C; IN 08, art. 95; IN 09, art. 122, II e IV; IN 10,
art. 41/Anexo B; IN 12, art. 47; IN 15, art. 30/Anexo B; e IN 18, art. 14.

O Anexo `01_entities.txt` declara o atributo opcional nos produtos FACT-ONLY
vinculados a Requirements com assinatura. Foram incluídas identidades ausentes
para `PRESSURIZATION_TEST_REPORT`, `PRESSURIZATION_MAINTENANCE_CHECKLIST`,
`SMOKE_CONTROL_COMMISSIONING_REPORT` e `SPRINKLER_COMMISSIONING_REPORT`, com
tipos documentais genéricos existentes e SMSCI-fonte. O checklist permanece
`DOCUMENT`, sem categoria nova nem reclassificação como manual ou laudo.
`GAS_TIGHTNESS_REPORT`, `SDAI_COMMISSIONING_REPORT` e `CMAR_DECLARATION`
receberam o atributo. Os tipos com atributo preexistente (`CONFORMITY_REPORT`
e `SHP_COMMISSIONING_REPORT`) foram preservados.

O atributo registra somente denominação de mecanismo digital/eletrônico
explicitamente identificada no próprio produto e mantém provenance. Não
registra autenticidade criptográfica, identidade do signatário, rota de
criação ou autenticação do e-SCI. A validação `SIGNED` não foi ampliada para
inferir autenticação de portal; sem mecanismo documentalmente identificável,
o contrato do Engine mantém `MANUAL_REVIEW`. A rota de autenticação e a
associação exata entre evidência de submissão e produto continuam
`MISSING_EVIDENCE_CONTRACT`. O mapping RT-015/checklist permanece independente
e não foi resolvido pela identidade documental.

Fixtures sintéticas cobrem produto assinado, produto sem atributo e produto
ausente para checklist e declaração CMAR, incluindo seleção do UNIT_KEY,
trace/sourceDocument/provenance e resultado `MANUAL_REVIEW` sem
Nonconformity quando o mecanismo não está identificado. O executor foi
generalizado somente para permitir `VALIDATE TECHNICAL_PRODUCT_ATTRIBUTE`
seguido de `ASSERT EXISTS` no mesmo produto canônico; a checagem de âncora
recusa referências diferentes. A unicidade de Criterion por Requirement e os
constructs não suportados permanecem bloqueados, pois o executor ainda não tem
contexto compartilhado que garanta VALIDATE único no Requirement. O trace
preserva o binding/provenance de VALIDATE junto ao binding do ASSERT.
Requirements, Criteria, Nonconformities e applicability não foram alterados.
Não aumenta a contagem de cobertura completa: permanecem 6/31; assinatura
isolada não resolve associação DRT-produto, multiplicidade, validade, conteúdo
de relatório, independência ou mapping RT-015. Revisão do diff final por Sol
6.1 no candidate `69320169c2c28e29deee3f60b75e00f437f17000` retornou
`SOL_REVIEW=PASS`, sem findings. A revisão confirmou o limite independente do
gate read-only de readiness: `VALIDATE` ainda não é aceito nele, portanto esta
onda não aumenta a cobertura operacional e permanece 6/31. Os gates executados
no mesmo candidate passaram: 150 testes Python, sete suítes Apps Script,
`node --check` nos módulos e testes JS e em `Code.gs`, regeneração dupla
byte-idêntica do contrato (`8e0f715f44c677497527f27c2f9ec294f5d0aa109b2860199f9dd84e6fbb56d6`)
e `git diff --check`. Nenhum finding foi aberto; a autenticação de portal e
os demais contratos de evidência continuam pendentes.

## Onda readiness — `VALIDATE TECHNICAL_PRODUCT_ATTRIBUTE(SIGNED)`

A readiness read-only passa a reconhecer VALIDATE somente quando o Requirement
declara exatamente `TECHNICAL_PRODUCT_ATTRIBUTE`, `SIGNED`, um único produto
técnico canônico e um único Criterion não iterativo. A materialização continua
delegada ao executor, que verifica âncora entre validação e ASSERT. Readiness
aceita ASSERT `EXISTS` ou `TECHNICAL_PRODUCT_ATTRIBUTE(SIGNED)` no mesmo
produto e rejeita constructos compostos ainda sem executor, como `ALL` com `DRT_COVERS`,
`VALID_WITHIN_YEARS` ou `REPORT_CONTAINS`.

`VALIDATE TECHNICAL_PRODUCT_ATTRIBUTE(SIGNED)` permanece apenas como suporte de
materialização/readiness. A presença de texto em `SIGNATURE_MECHANISM` não
prova assinatura documentalmente verificável; por isso os três Criteria
`T1_CONFORMITY_REPORT_SIGNED`, `T4_IN09_CHECKLIST` e `T4_IN18_CMAR` retornam
`MANUAL_REVIEW` e não integram a contagem de cobertura produtiva. O snapshot
funcional desta subseção era de 31 Criteria produtivos; no runtime atual, a
cobertura é 6 dos 29 Criteria produtivos. A existência e a rastreabilidade dos
produtos continuam testadas, mas nenhum Criterion assinado gera `PASS` apenas
por esse texto. Não foram adicionados predicates, allowlists ou semântica à
Base. O fluxo de resultados não mudou e `ANALYZED` continua fora da Fase 6.

Candidate histórico `a3d9e0432814c381aca82fff054f48538a6331e4`, revisado por
Sol 6.1 contra `805ee9ce9c483e447fb96634cb17b21c5f2e0716`, recebeu
`SOL_REVIEW=PASS` sem findings para aquele snapshot. A declaração histórica de
9/31 foi superada pela auditoria atual do predicate de assinatura e pela
reconciliação do runtime atual abaixo.
Gates no candidate: 150 testes Python, sete suítes Apps Script, sintaxe de
módulos/testes JS e `Code.gs`, regeneração dupla byte-idêntica (SHA-256
`8e0f715f44c677497527f27c2f9ec294f5d0aa109b2860199f9dd84e6fbb56d6`) e
`git diff --check`.

## Onda técnica — composição genérica `ALL`

Revisão independente pré-implementação por Sol 6.1 no HEAD
`707ca971ab07bc907108d2ca8ad90edb1b8d753b`: as opções de DRT avaliadas
continuam sem binding computacional suficiente entre responsabilidade e
evidência. Sol identificou `ALL` como constructo já definido e composição
genérica segura, mas sem Criterion adicional coberto enquanto suas folhas
permanecerem não suportadas.

O materializador agora aceita `ALL` com uma ou mais expressões, exige o objeto
IR sem campos residuais, materializa recursivamente todos os filhos e preserva
o binding/trace de cada um. A readiness aplica a mesma regra recursiva e só
marca a unidade suportada quando todos os filhos são suportados. Assim,
`T4_IN07_COMMISSIONING` segue explicitamente unsupported porque sua folha
`DRT_COVERS` não tem executor; nenhuma unidade é declarada coberta por aceitar
somente o nó pai `ALL`.

Fontes: Documento 10, §§20.3 e 20.6, define `ALL` como composição universal e
declara a precedência de resultados já implementada no Engine; `00_engine.txt`
define o ASSERT como árvore de chamadas/composição; `08_execution_pipeline.txt`
proíbe inventar composição para `NOT_APPLICABLE`. Parser/artefato compilado já
reconheciam `ALL`; não houve alteração de fonte canônica, parser nem gerador.

Fixtures sintéticas exercitam `ALL` com resultados TRUE/FALSE, cardinalidade de
um ou mais filhos, determinismo, trace dos filhos, associação de NC apenas no
FALSE, rejeição de expressão vazia, campo residual e folha `DRT_COVERS` ainda
não executável. A readiness confirma que um `ALL` com folha não suportada não
se torna materializável. Naquele snapshot, cobertura registrada era 9/31; nenhum predicate, Criterion,
Requirement ou Nonconformity foi adicionado. O candidate
`22a4665fa5958becbfd996b84cad28d5a6ca1201` foi commitado e enviado à branch.
Revisão independente Sol 6.1 contra o baseline
`707ca971ab07bc907108d2ca8ad90edb1b8d753b` retornou `SOL_REVIEW=PASS`, sem
findings. Sol confirmou ordem dos operandos, trace dos filhos, cardinalidade
de um resultado por Criterion, NC apenas em FALSE, autenticações preservadas e
`T4_IN07_COMMISSIONING` ainda bloqueado pela folha `DRT_COVERS`.

Gates no mesmo candidate: 150 testes Python; sete suítes Apps Script; sintaxe
de todos os módulos/testes JS e `Code.gs` (stdin); duas regenerações
byte-idênticas de `CompiledRuntimeContract.js`, SHA-256
`8e0f715f44c677497527f27c2f9ec294f5d0aa109b2860199f9dd84e6fbb56d6`; e
`git diff --check`.

## Snapshot histórico e reconciliação do runtime atual

Contagens anteriores nesta subseção e nas ondas anteriores são registros
históricos do estado de cada candidate. Após a decisão do usuário de manter em
revisão humana toda ausência sem prova confiável de inventário e cobertura da
EXTRACTION, e aos lotes de divulgação factual de 2026-10-22, o quantitativo
vigente em KB 5.46.0 é: 34 ativos, 29 produtivos, 10 cobertos, 18 parciais,
1 preparatório e 19 pendentes de cobertura integral.

As linhas 252–290 da matriz refletem os contratos e estados reconciliados até
a KB 5.46.0, incluindo duas entradas `WITHDRAWN` apenas para rastreabilidade.
Somente as contagens 36/31 são snapshots anteriores à retirada dos dois
Criteria de regularidade profissional. A fonte operacional atual é `CompiledRuntimeContract.js`,
regenerada da RDE Schema `0.8.0` e da KB `5.46.0`; ela contém 34 Criteria e
não contém os dois Criteria de regularidade. A applicability atual mantém cinco
Criteria não selecionáveis, portanto 29 são produtivamente alcançáveis.

| Categoria atual | Quantidade | Criteria |
|---|---:|---|
| `EXECUTABLE_EXISTING` | 10 | `T4_IN19_APPLICABILITY_REVIEW`, `T4_IN19_LEGACY_DOCUMENTATION`, `T1_DRT_REQUIRED`, `T1_DRT_ACTIVITY_EXECUTION`, `T1_DRT_SMSCI_COVERAGE`, `T4_IN08_MANUAL`, `T4_IN09_MANUAL`, `T4_IN19_EXECUTION`, `T4_IN19_GROUNDING`, `T4_IN19_FINAL_VERIFICATION`. Para os Criteria cobertos sob a decisão C, presença/declaracão documental explícita pode produzir TRUE; ausência ou cobertura de extração sem comprovação permanece MANUAL_REVIEW, sem FALSE/NC. Testes focados verificam resultado, trace e provenance; readiness comprova somente seleção e materialização da unidade. |
| `PARTIAL_EXECUTION_SUPPORT` | 18 | `T1_DRT_SIGNED` e `T4_DRT_SIGNED`: signatário e mecanismo textual são divulgados, mas não provam autenticidade; assinatura segue MANUAL_REVIEW. `T1_DRT_REGISTERED` e `T4_DRT_REGISTERED`: literais de registro/emissão/pagamento são exibidos separadamente para revisão humana, sem classificação de estado. `T1_DRT_RI_LEGAL_ENTITY`, `T1_DRT_RT_NAME`, `T1_DRT_ADDRESS` e `T1_DRT_AREA`: literais da DRT com fonte/provenance são exibidos para revisão humana; comparações não são automatizadas e resultados permanecem MANUAL_REVIEW. `T1_CONFORMITY_REPORT`: uma associação documental explícita pode satisfazer o predicado da relação; relação ausente/ambígua fica MANUAL_REVIEW; admissão de correlação inferida permanece bloqueada sem calibração empírica válida. `T1_CONFORMITY_REPORT_SIGNED`: presença do relatório e literal `SIGNATURE_MECHANISM` quando extraído são exibidos, mas SIGNED permanece no ASSERT e em MANUAL_REVIEW sem recibo autenticado admissível. `T4_IN09_DRT`: o literal RESPONSIBILITY_TYPE por ART/RRT/TRT presente é exibido com provenance, sem associação à responsabilidade de pressurização; resultado permanece MANUAL_REVIEW. `T4_IN09_CHECKLIST` e `T4_IN18_CMAR`: existência e literal `SIGNATURE_MECHANISM` quando extraído são reportados no trace, mas assinatura não autenticada mantém o resultado final em MANUAL_REVIEW. `T4_IN07_COMMISSIONING`, `T4_IN08_ESTANQUEIDADE`, `T4_IN09_TEST_REPORT`, `T4_IN12_COMMISSIONING` e `T4_IN15_COMMISSIONING`: presença documental e literal `SIGNATURE_MECHANISM` quando extraído são reportados no trace, mas cada Criterion permanece MANUAL_REVIEW para os demais controles declarados; ausência não gera FAIL/NC. |
| `PREPARATORY_MANUAL_REVIEW_ONLY` | 1 | `T4_IN10_COMMISSIONING`: encaminhamento integral à revisão humana sem avaliação automática de identidade/autoria; conserva a decisão e os limites registrados. |
| `SOURCE_DEFINED_NEEDS_FORMALIZATION` | 0 | nenhum Criterion desta categoria após disclosure parcial dos dois Criteria SIGNED; a verificação criptográfica permanece bloqueada e classificada como revisão humana |
| `MISSING_EVIDENCE_CONTRACT` | 0 | nenhum Criterion fica sem encaminhamento preparatório; as lacunas factuais/contratuais dos Criteria pendentes estão descritas nas respectivas linhas |
| `NOT_PRODUCTIVELY_REACHABLE` / `LEGACY_REFERENCE_NOT_PRODUCTIVE` | 5 | os quatro Criteria `T4_IN34_*` de M5 e `T4_IN19_REGIME_REVIEW` |
| `HUMAN_NORMATIVE_DECISION_REQUIRED` | 0 | A decisão sobre o fundamento de independência em `T4_IN10_COMMISSIONING` foi respondida em 2026-10-17 e está registrada em `docs/FASE_6_ONDAS_RESTANTES.md` (“Decisão de fundamento IN10/IRV — resolvida pelo usuário”). A pendência factual e de formalização executável permanece; não há decisão normativa humana aberta para este ponto. |

Contagem operacional reconciliada: `CRITERIA_ACTIVE=34` no runtime, dos quais
`CRITERIA_PRODUCTIVE=29`, `CRITERIA_NOT_SELECTABLE=5`,
`CRITERIA_WITHDRAWN=2` (os dois Criteria de regularidade, ausentes do contrato
ativo), `CRITERIA_COVERED=10`, `CRITERIA_PARTIAL=18` (`T1_DRT_SIGNED`,
`T4_DRT_SIGNED`, `T1_DRT_REGISTERED`, `T4_DRT_REGISTERED`,
`T1_DRT_RI_LEGAL_ENTITY`, `T1_DRT_RT_NAME`,
`T1_DRT_ADDRESS`, `T1_DRT_AREA`, `T1_CONFORMITY_REPORT`,
`T1_CONFORMITY_REPORT_SIGNED`, `T4_IN09_DRT`, `T4_IN09_CHECKLIST`, `T4_IN18_CMAR`, `T4_IN07_COMMISSIONING`,
`T4_IN08_ESTANQUEIDADE`, `T4_IN09_TEST_REPORT`, `T4_IN12_COMMISSIONING`,
`T4_IN15_COMMISSIONING`), `CRITERIA_PREPARATORY=1` (`T4_IN10_COMMISSIONING`)
e `CRITERIA_PENDING=19`, contando o
parcial e o preparatório como pendentes de cobertura integral. Há 0 Criteria sem suporte de execução, um apenas preparatório e dezoito parciais. A contagem de retirados
é histórica e não compõe os 34 Criteria ativos. A tabela acima exclui os dois
retirados. A correção fail-closed anterior reduziu os critérios integrais de 6
para 2; a decisão C agora reconhece os Criteria cujas rotas completas
consistem em TRUE para evidência explícita e MANUAL_REVIEW quando completude não
pode ser provada. Na matriz vigente, são 10 Criteria integrais, 18 parciais e 1
preparatório. A
formalização RDE 0.4.0 não aumentou a cobertura no checkpoint em que foi
aprovada; esse número é histórico e não representa o total atual. A contagem
anterior de 11 casos `SOURCE_DEFINED_NEEDS_FORMALIZATION` também é histórica;
na matriz vigente os Criteria de registro, dados básicos e SIGNED têm somente
divulgação factual parcial; prova criptográfica e recibo autenticado continuam
impeditivos de cobertura integral. Os demais bloqueios aparecem como
suporte parcial ou preparação humana, sem serem contados como cobertos.

Reconciliação de decisões do usuário em 2026-10-17: a linha histórica acima que
apontava decisão normativa pendente para independência em IN10/IRV foi
supersedida. A IRV (Anexo A, Tabela 4, p. 9) e o art. 41 da IN 10 expressam a
exigência; a decisão do usuário confirma a precedência da IRV para fiscalização.
O Criterion continua pendente por falta de fatos e formalização executável,
não por falta de autoridade normativa. A verificação de compatibilidade entre
atividade profissional e SMSCI nas RT-005/006/014 está fora do escopo do
sistema, conforme decisão do usuário; preservar declarações documentais sem
avaliá-las. Para RT-002, a atividade literal `EXECUÇÃO` pode satisfazer o fato
declarado mesmo quando há outras atividades na mesma DRT, sem inferir
competência profissional. Snapshot histórico do lote de formalização, anterior
à decisão C: `6/29` cobertos, `4` parciais e `23` pendentes de cobertura
integral. As métricas vigentes estão na reconciliação atual acima.
Logo `PHASE_6_CONTRACTS=READY` ainda não foi declarado e a cobertura da Fase 6
permanece incompleta.

## Formalização factual de datas — RDE 0.5.0

Após a revisão Sol do domínio ajustado (`SOL_DATE_SCHEMA_REVIEW=PASS`, sem
findings), a especificação da RDE e o contrato factual de entidades autorizam
`documentary_date_items` em RDE 0.5.0. A coleção preserva pares literais
rótulo/valor explicitamente associados dentro da unidade documental e somente
para registros de tipo canônico `TEST_REPORT`, com documento de origem
coincidente. Mantém ordem, multiplicidade e conflitos. RDE 0.2.0–0.4.0 retém
seus envelopes históricos.

A `ImmutableExecutionView` expõe os itens somente por
`documentaryDateItems(TEST_REPORT)`. A coleção não interpreta formato ou rótulo,
seleciona datas, determina data de avaliação, compara janelas, associa DRT,
avalia validade nem determina resultado. A regra de cinco anos do laudo de
estanqueidade de gás não se aplica genericamente aos demais `TEST_REPORT`.

No snapshot histórico daquela onda, esta mudança formalizou fatos documentais
para apoiar futuramente os Criteria temporais. `T4_IN08_ESTANQUEIDADE` e
`F6-MC-005` continuam bloqueados por
seleção da data pertinente, formato/interpretação, referência autorizada de
avaliação, produto quando houver vários relatórios e associação ao DRT. Esta
mudança não altera Requirement, Criterion, predicate, applicability, resultado
ou Nonconformity, e naquele snapshot não aumentava a cobertura então registrada
como 9/31. A revisão Sol da
implementação efetiva no candidate `2ac2018e2be2b9243ff00c8db40db27c30fc6588`
retornou `SOL_REVIEW=FAIL` com o finding MEDIUM `F6-DATE-001`: referências
`TypedReference` mutáveis ou com accessors podiam entrar pela construção direta
da view e alterar a identidade de produto/origem depois da construção. A
correção rejeita referências não congeladas ou com campos que não sejam dados,
e armazena cópias canônicas imutáveis. Testes reproduzem produto/origem
forjados e getter que não pode ser executado. Revisão independente nova do
baseline `625e2af4d482d8d453cad7b57a90cd738d679bb9` ao candidate
`74ae7455cc05d6242a9c8425f678a821b12c10b1` retornou `SOL_REVIEW=PASS`:
`F6-DATE-001=CLOSED`, nenhum finding novo e nenhuma severidade residual.
O Sol confirmou que as referências retornadas são cópias canônicas congeladas,
campos ocultos e accessors são rejeitados sem execução, envelopes 0.2–0.4 foram
preservados e nenhum contrato normativo ou cobertura foi acrescentado. Os gates
no candidate passaram: 150 testes Python, sete suítes Apps Script, sintaxe JS e
Code.gs, `git diff --check` e regeneração byte-idêntica do runtime compilado
(SHA-256 `d810712fe6a527386f8db1f93b85defc5e40ddfb564c246f1263c0b6602139f4`).


## Closeout — ResponsibilityEvidenceBinding / ImmutableExecutionView

Esta onda da Fase 6 foi concluída no functional candidate `87daa0c8d4d1823bc1260c14f644aa1b734d1f1c`, sobre a árvore funcional derivada da revisão iniciada em `b165e8077092374e8145ab5ffe8ac4366a0734f6`. A revisão Sol independente final comparou `b24dc194a3f26dbb57236d226ccccdde45243f31` → `87daa0c8d4d1823bc1260c14f644aa1b734d1f1c` e retornou `SOL_REVIEW=PASS`. O SHA final do closeout é o commit que contém esta seção.

Achados da onda fechados após revisão independente: `F6-001`, `F6-001R1`, `F6-001R2`, `F6-001R3`, `F6-002`, `F6-002R1` e `F6-003`. As regressões adversariais cobrem proveniência e catálogo canônico, adulteração de helpers e intrínsecos, iteradores/species, setters herdados em arrays, projeção factual ART e acumulação privada de evidências. `NOVOS_ACHADOS=0` na revisão final.

Gates no functional candidate: 137 testes Python; oito suítes Apps Script; sintaxe de todos os `apps-script/*.js` e `Code.gs`; regeneração byte-idêntica de `CompiledRuntimeContract.js`; release build; phase guards; `git diff --check`. SHA-256 do runtime: `0aa193089407300efec8e7f9872ec358a71d9ab2c3ad37a843bde2a353248344`.

Cobertura antes/depois: `9/31` → `9/31` (`COVERAGE_GAIN=0`). Nenhum Criterion integral foi fechado por esta infraestrutura; KB permanece em `5.16.0`. `FASE_6_STATUS=PARTIAL`; `PROMOTION=NOT_AUTHORIZED`. Próxima ação autorizada: continuar a cobertura progressiva da Fase 6 dentro dos contratos normativos existentes. Fase 7, processos reais, EXTRACTION real e OpenAI Decisions não foram iniciados.

## Candidate de cobertura — T4_IN19_FINAL_VERIFICATION (2026-10-19)

O executor materializa a validação documental explícita da DRT de verificação
final da instalação elétrica de baixa tensão, com vínculo autenticado à
apresentação corrente, documento ART/RRT/TRT, item de atividade e proveniência.
Fixture positiva reproduz `TRUE/PASS`; item ausente ou atividade diferente
permanece `MANUAL_REVIEW`, sem Nonconformity. Readiness comprova somente
planejamento/materialização do unit IEL. A validação refere-se ao fato documental
declarado e não certifica competência profissional nem, isoladamente,
atendimento normativo.

Cobertura provisória do candidate: `CRITERIA_ACTIVE=34`, `PRODUCTIVE=29`,
`COVERED=10`, `PARTIAL=1`, `PENDING=19`, `WITHDRAWN=2`, não selecionáveis=5.
Ganho integral nesta onda: +1 (`T4_IN19_FINAL_VERIFICATION`). Sol 6.1 ainda deve
revisar o slice antes de promoção; portanto, essas contagens são de candidate e
não constituem fechamento arquitetural da onda. `CALIBRATION_GATE=BLOCKED`,
`NORMATIVE_INSTITUTIONAL_VALIDATION=PENDING` e `VALIDATED_TO_ANALYZED=PENDING`
permanecem inalterados.

O candidate foi commitado em `295a144cc8c765a5eb9b24aedc3eac7e94a7b0bd` e
enviado à branch de trabalho; o tracker foi atualizado em
`b4a3f373cc185b5d5b62fed27327cfad8109aae6`. A revisão GPT-6 inicial identificou
P2 sobre proveniência ausente; a correção normaliza proveniência ausente para
`null`, preserva `MANUAL_REVIEW` sem NC e foi aprovada em re-review GPT-6
estritamente dirigida. A suíte completa pós-correção passou: Python 144/144,
Apps Script 9/9, sintaxe JS/Code.gs, regeneração runtime byte-idêntica (SHA-256
`c89480ab54b030996c7678bf72ef94b45ad3ddfd4ac83de10e872cec21952aa0`) e
`git diff --check`. Release limpo do commit funcional contém 10 documentos,
manifest 10/10, KB 5.28.0 e `SOURCE_COMMIT` exato. A aprovação Sol final da
Fase 6 permanece pendente.

## Snapshot de cobertura vigente após divulgação factual DRT — 2026-10-22

| Categoria | Quantidade | Definição |
|---|---:|---|
| Criteria ativos | 34 | runtime/base compilada |
| Produtivos | 29 | selecionáveis para execução |
| Cobertos integralmente | 10 | executor, facts/binding, resultado, trace, readiness e testes completos |
| Parciais | 18 | `T1_DRT_SIGNED`, `T4_DRT_SIGNED`, `T1_DRT_REGISTERED`, `T4_DRT_REGISTERED`, `T1_DRT_RI_LEGAL_ENTITY`, `T1_DRT_RT_NAME`, `T1_DRT_ADDRESS`, `T1_DRT_AREA`, `T1_CONFORMITY_REPORT`, `T1_CONFORMITY_REPORT_SIGNED`, `T4_IN09_DRT`, `T4_IN09_CHECKLIST`, `T4_IN18_CMAR`, `T4_IN07_COMMISSIONING`, `T4_IN08_ESTANQUEIDADE`, `T4_IN09_TEST_REPORT`, `T4_IN12_COMMISSIONING`, `T4_IN15_COMMISSIONING` |
| Preparatórios | 1 | `T4_IN10_COMMISSIONING` |
| Pendentes de cobertura integral | 19 | 0 sem suporte de execução + 1 preparatório + 18 parciais |
| Não selecionáveis | 5 | quatro M5 e um regime legado UNRESOLVED |
| Retirados | 2 | regularidade profissional T1/T4 |

Os lotes de cinco relatórios, do Criterion `T1_CONFORMITY_REPORT_SIGNED` e da
divulgação factual de identificação, status e assinatura da DRT melhoram o trace, mas
mantêm revisão humana para os controles restantes. Os totais ativos, integrais
e pendentes de cobertura integral não mudam.
Para a
divisão gerencial aprovada, os 10 Criteria integralmente cobertos e os parciais permanecem estado de entrada;
interfaces ou testes preparatórios não mudam `COVERED`. Fase 6A encerra-se
pelos entregáveis e gates de núcleo/contratos listados no Plano de Migração,
sem promover cobertura fictícia. Verificação local/humana de assinatura,
integrações e cobertura restante pertencem ao escopo 6B.

O contrato de assinatura separa RDE FACT ONLY de recibos técnicos posteriores
vinculados a documento e digest exatos. Até existir verificador local validado
e recibo autenticado aceito pelo Engine, os onze Criteria dependentes de
`SIGNED` não ganham cobertura por esta formalização: dois ASSERTs de DRT
(`T1_DRT_SIGNED`, `T4_DRT_SIGNED`), um ASSERT de produto
(`T1_CONFORMITY_REPORT_SIGNED`) e oito VALIDATEs de produto
(`T4_IN07_COMMISSIONING`, `T4_IN08_ESTANQUEIDADE`,
`T4_IN09_CHECKLIST`, `T4_IN09_TEST_REPORT`, `T4_IN10_COMMISSIONING`,
`T4_IN12_COMMISSIONING`, `T4_IN15_COMMISSIONING`, `T4_IN18_CMAR`). A distinção
vem das fontes atuais `03_table1.txt`, `04_table4.txt` e `02_requirements.txt`;
o contrato é testado contra esses identificadores. Confirmação humana não é
validação criptográfica e não altera a RDE.

Estado do diff arquitetural submetido à revisão Sol 6.1: `PENDING`. O snapshot
de cobertura acima não é fechamento da Fase 6 nem promoção operacional.

## Atualização preparatória de evidências literais IN09 — candidata RDE 0.8

Contrato candidato registra trechos literais genéricos, vinculados ao registro
e documento-fonte exatos, sem rotulagem normativa. Para
`T4_IN09_TEST_REPORT`, o trace pode exibir trechos e provenance da RDE
`documentary_text_excerpt_items`; completude não é afirmada, e uma coleção
vazia ou indisponível em schema histórico não prova ausência de itens no laudo.
O resultado permanece `MANUAL_REVIEW`; não há cobertura integral nova.

| Medida | Antes | Depois deste lote |
|---|---:|---:|
| Criteria ativos | 34 | 34 |
| Produtivos | 29 | 29 |
| Integrais | 10 | 10 |
| Parciais | 18 | 18 |
| Preparatórios | 1 | 1 |
| Pendentes de cobertura integral | 19 | 19 |
| Não selecionáveis | 5 | 5 |
| Retirados | 2 | 2 |

`T4_IN09_TEST_REPORT` continua parcial porque a camada não declara quais
componentes normativos foram documentados, não determina completude/exatidão,
não valida assinatura e não liga uma DRT ao produto. A futura EXTRACTION e os
contratos específicos de evidência permanecem necessários. Este contrato
preparatório não antecipa a Fase 8 e não altera Requirements, Criteria ou
Nonconformities. A base candidata passa a KB `5.45.0`, RDE `0.8.0`; os dados
de cobertura permanecem inalterados.
