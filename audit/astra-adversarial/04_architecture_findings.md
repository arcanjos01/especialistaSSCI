# Architecture Findings

Baseline exclusivo: `9d2e7f175507a4e81e3ed80d7ef57e89d73124d1`. Investigação: 09–10/09/2026.

Achados desta camada. A decisão arquitetural/normativa permanece humana e nenhuma remediação foi implementada.

## AS-002 — Sete RTs usadas pela Base não têm registros no catálogo oficial

**Severidade:** HIGH

**Tipos:** architecture;conceptual-model;completeness

**Confiança:** confirmed

**Revisão independente:** survived — pipeline_projection / Hegel; árbitro principal

**Local:** docs/Anexo_A_Catalogo_Oficial_das_Responsabilidades_Tecnicas_Rev2.txt:48; knowledge-base/02_requirements.txt:19

**Fonte de autoridade:** Anexo A §§3/8; Documento11 §§5/6; AGENTS §§4/11

**Descrição/evidência:** O Anexo contém estrutura, definições de campos e exemplos de IDs, sem instâncias RT-002/003/005/006/007/014/015. A Base exige CATALOG_ACCEPTED e atividades compatíveis. O pacote de dez documentos também não fornece catálogo derivado.

**Contraexemplo/reprodução:** evidence/astra-coverage-rt-catalog.csv e leitura integral do Anexo; menor caso RT-002 com ART de execução a validar.

**Esperado:** Consultar registros catalográficos oficiais com atividades, evidências e demais atributos autorizados.

**Observado:** Lookup das sete RTs não encontra registro oficial; nomes locais não suprem os conjuntos de evidências/atividades aceitas.

**Impacto operacional:** Lacuna recorrente na fonte das validações centrais. Concluir atendimento exigiria preencher conhecimento não declarado; não se afirma que o Gem efetivamente o fez.

**Camada responsável:** Catálogo / Base / release

**Tentativa de refutação:** 01_entities remete ao Anexo, mas não contém os registros. O problema atinge o Gem, não apenas Python. Carregar manualmente o Anexo atual não preenche seu conteúdo. Omissão na release é agravante da mesma cadeia, sem achado duplicado.

**Correção mínima provável — não realizada:** Preencher catálogo exclusivamente com fundamento e autorização próprios; disponibilizar seus dados ao conjunto operacional preservando IDs oficiais e escopos.

## AS-004 — UNKNOWN permanece sem contrato de saída final

**Severidade:** MEDIUM

**Tipos:** architecture;state-semantics;report

**Confiança:** confirmed

**Revisão independente:** not-required — auditor-chefe

**Local:** docs/Documento 10 – Guia de Evolução da Plataforma de Sistemas Especialistas para Análise Documental do CBMSC.txt:439; knowledge-base/08_execution_pipeline.txt:547

**Fonte de autoridade:** Documento10 §20.5; 00_engine ASSERT RESULT; Pipeline fase5

**Descrição/evidência:** Documento10 reconhece DECISÃO PENDENTE e proíbe UNKNOWN→FAIL/MR automático; Pipeline só admite PASS/FAIL/NA/MR.

**Contraexemplo/reprodução:** Probes ALL/OR produzem UNKNOWN; comparar conjunto de estados em 00/08/Documento10.

**Esperado:** Transportar a insuficiência sem inventar estado ou conversão.

**Observado:** Python preserva UNKNOWN, mas não há saída final autorizada no Pipeline/relatório para ele.

**Impacto operacional:** Execuções com informação insuficiente podem parar na fronteira ou depender de conversão não autorizada. É dívida já reconhecida, não regressão nova.

**Camada responsável:** Fronteira Engine / Pipeline

**Tentativa de refutação:** A decisão pendente não é uma autorização implícita. Frase final de informação insuficiente não define correspondência formal de todos os resultados.

**Correção mínima provável — não realizada:** Decidir conjuntamente a saída de UNKNOWN e alinhar consumidores/relatório, preservando distinção de MR.

## AS-005 — Ordem literal do índice conflita com concluir T1 antes de T4

**Severidade:** MEDIUM

**Tipos:** architecture;execution;completeness

**Confiança:** confirmed

**Revisão independente:** survived — coverage_release / Herschel; pipeline_projection / Hegel

**Local:** tools/build_knowledge_base_release.py:131; knowledge-base/08_execution_pipeline.txt:471; knowledge-base/08_execution_pipeline.txt:532

**Fonte de autoridade:** Pipeline fases4C/5; 00_engine EXECUTE_IN_FILE_ORDER

**Descrição/evidência:** Blocos por Requirement contêm T1 e T4; índice começa T1_REQUIRED,T1_SIGNED,T4_SIGNED,T1_REGISTERED,T4_REGISTERED. Fase4C proíbe mudar ordem e fase5 exige todos T1 antes T4.

**Contraexemplo/reprodução:** evidence/astra-pipeline-probes.py; evidence/astra-coverage-index-order.csv.

**Esperado:** Um plano fechado que satisfaça todas as instruções obrigatórias de ordem.

**Observado:** Todos os cinco ledgers têm Criteria T1 após início de T4.

**Impacto operacional:** O executor deve violar uma ordem ou interromper. Não se demonstrou resultado normativo errado por essa causa.

**Camada responsável:** Builder / Pipeline

**Tentativa de refutação:** Reordenar Requirements não resolve três grupos mistos; excluir T4 quebra cobertura; mudar só execução quebra plano congelado.

**Correção mínima provável — não realizada:** Decidir uma ordem canônica única e alinhar materialização, índice e fase5 com teste misto T1/T4.

## AS-006 — Requirement referencia NC_T1_003_SIGNED inexistente

**Severidade:** MEDIUM

**Tipos:** architecture;completeness

**Confiança:** confirmed

**Revisão independente:** not-required — auditor-chefe

**Local:** knowledge-base/02_requirements.txt:108

**Fonte de autoridade:** Pipeline fase4C item4; AGENTS §16

**Descrição/evidência:** Esse ID é declarado no Requirement, mas não definido em 05; Criterion T1_CONFORMITY_REPORT_SIGNED contém somente orientação MR.

**Contraexemplo/reprodução:** rg NC_T1_003_SIGNED knowledge-base; evidence/astra-coverage-audit.py.

**Esperado:** Referências existentes e consequência coerente com Criterion.

**Observado:** Lookup não encontra NC; builder permite produzir release porque sua validação não cobre essa aresta.

**Impacto operacional:** Potencial bloqueio do gate de referências; não há FAIL indevido observado.

**Camada responsável:** Base / referências

**Tentativa de refutação:** Não precisar NC para MR explica remoção possível, mas não torna válida a referência existente; não criar NC automaticamente.

**Correção mínima provável — não realizada:** Conciliar a referência com a decisão de assinatura já autorizada; verificar arestas Requirement→NC no gate de release.

## AS-007 — Sete símbolos documentais consumidos não têm entidade canônica declarada

**Severidade:** MEDIUM

**Tipos:** conceptual-model;extraction;traceability

**Confiança:** confirmed

**Revisão independente:** not-required — auditor-chefe

**Local:** knowledge-base/01_entities.txt; knowledge-base/04_table4.txt:158; knowledge-base/02_requirements.txt:93

**Fonte de autoridade:** 09-RDE representação canônica; Pipeline fase3; 00 NO_NEW_OBJECTS

**Descrição/evidência:** Seis REQUIRE DOCUMENT e CONFORMITY_REPORT não têm ENTITY em 01; incluem pressurização, fumaça e sprinkler. CSV lista todos.

**Contraexemplo/reprodução:** evidence/astra-coverage-undeclared-document-symbols.csv e astra-coverage-technical-products.csv.

**Esperado:** Uma representação e vínculo declarado entre fato extraído e símbolo consumido por EXISTS/TECHNICAL_PRODUCT.

**Observado:** Documentos são mencionados como requisitos, mas sem declaração canônica/transformação específica correspondente.

**Impacto operacional:** Associação por interpretação do nome pode variar, perder evidência ou criar objetos implícitos. Consequência operacional ainda não observada.

**Camada responsável:** Entidades / RDE / Base

**Tentativa de refutação:** Símbolos não são totalmente desconhecidos da Base: aparecem nos Requirements. Isso enfraquece alegar impossibilidade absoluta. Genéricos REPORT/COMMISSIONING_REPORT existem, mas não declaram a relação específica. Atributos comuns no Pipeline não foram considerados ausentes.

**Correção mínima provável — não realizada:** Declarar apenas as entidades/relações necessárias, sem recriar obrigações nem alterar contratos fora do domínio afetado.

## AS-009 — Seis predicates de responsabilidade não têm semântica declarada suficiente

**Severidade:** MEDIUM

**Tipos:** architecture;execution;state-semantics

**Confiança:** confirmed

**Revisão independente:** not-required — auditor-chefe

**Local:** knowledge-base/03_table1.txt:24; knowledge-base/03_table1.txt:42; knowledge-base/03_table1.txt:238

**Fonte de autoridade:** 00_engine funções declaradas; AGENTS §§9/10

**Descrição/evidência:** HAS_ACCEPTED_DRT_EVIDENCE, EVIDENCE_ATTRIBUTE, HAS_TECHNICAL_PRODUCT, EVIDENCE_MATCHES_PROCESS_ATTRIBUTE, ACTIVITY_COMPATIBLE e IS_SATISFIED_FOR_SMSCI, todos com prefixo RESPONSIBILITY_, são usados sem contrato de estados/cardinalidade.

**Contraexemplo/reprodução:** evidence/astra-coverage-criterion-functions.csv; comparar nomes com 00_engine e demais fontes versionadas.

**Esperado:** Executar regras declaradas para evidências ausentes, múltiplas e contraditórias.

**Observado:** Duas DRTs, uma registrada e outra não, não têm composição definida por RESPONSIBILITY_EVIDENCE_ATTRIBUTE.

**Impacto operacional:** O Gem pode precisar preencher regra implícita; não inferir ALL/EXISTS pelo nome. Ausência de implementação Python, isoladamente, não é falha operacional.

**Camada responsável:** Contratos da Base

**Tentativa de refutação:** Contratos de funções parecidas não são aliases autorizados. Gravidade rebaixada de HIGH proposto: não há saída Gem errada reproduzida e parte depende do catálogo AS-002.

**Correção mínima provável — não realizada:** Declarar a menor semântica necessária na Base, incluindo pluralidade e estados; não construir executor externo como pré-requisito.

## AS-010 — Atributo documental PROFESSIONAL_REGULARITY admite estado de execução

**Severidade:** MEDIUM

**Tipos:** extraction;state-semantics;conceptual-model

**Confiança:** confirmed

**Revisão independente:** not-required — auditor-chefe

**Local:** knowledge-base/01_entities.txt:70

**Fonte de autoridade:** 09-RDE FACT ONLY/PROHIBITED CONTENT; Documento10 §20.5; Pipeline fase2

**Descrição/evidência:** Descrição de DRT enumera REGULAR, IRREGULAR ou MANUAL_REVIEW como resultado documental da verificação; Documento10 diz MR nunca fato nem produzido na EXTRACTION.

**Contraexemplo/reprodução:** Comparar 01_entities:70-78 com 09-RDE e Documento10 §20.5.

**Esperado:** Separar fato documentado de necessidade operacional de revisão.

**Observado:** Fontes permitem e proíbem MR no mesmo atributo documental.

**Impacto operacional:** Favorece contaminação da RDE por resultado operacional; não há RDE real com esse erro demonstrada.

**Camada responsável:** Schema documental

**Tentativa de refutação:** Documento pode conter literalmente uma expressão semelhante, mas schema a qualifica como resultado da verificação, sem campo de citação que remova ambiguidade.

**Correção mínima provável — não realizada:** Conciliar representação de insuficiência documental com estados operacionais sem redefinir globalmente UNKNOWN.

## AS-016 — Quatro Requirements IN34 não têm caminho produtivo de seleção

**Severidade:** MEDIUM

**Tipos:** completeness;applicability

**Confiança:** confirmed

**Revisão independente:** not-required — auditor-chefe

**Local:** knowledge-base/02a_applicability.txt:162; knowledge-base/02_requirements.txt:387

**Fonte de autoridade:** IRV Tabela4 IN34 p10; contrato 02a DERIVED-INTERNAL DEBT

**Descrição/evidência:** M5_EXPLOSION_PROTECTION/DUST_CONTROL/HEAT_SENSORS/LIGHTNING_PROTECTION são alvos derivados sem regra; 02a declara a dívida. Nem o caso com todos28 códigos os seleciona.

**Contraexemplo/reprodução:** evidence/astra-pipeline-ledgers.json all_official_current; leitura 02a DERIVED-INTERNAL DEBT.

**Esperado:** Uma análise com escopo suficiente deve avaliar obrigações aplicáveis ou tornar visível a incompletude de cobertura.

**Observado:** Requirements existem e têm Criteria/NC, mas não são alcançáveis pelo catálogo produtivo atual.

**Impacto operacional:** Completude de plano relativo à Base selecionada não prova cobertura normativa de M5. Não se afirma dispensa/NOT_APPLICABLE automática nem caso real perdido.

**Camada responsável:** Base / dívida M5

**Tentativa de refutação:** Dívida explicitamente reconhecida: não é omissão escondida no código. A aplicabilidade normativa de imóvel concreto não foi inventada sem IN34 completa.

**Correção mínima provável — não realizada:** Definir escopo suportado e, mediante fundamento, derivação específica M5; testes para cada dependente, sem usar menção textual como gatilho.

## AS-017 — NC_T4_018 não possui acionador FAIL

**Severidade:** LOW

**Tipos:** maintainability;execution

**Confiança:** confirmed

**Revisão independente:** not-required — auditor-chefe

**Local:** knowledge-base/05_nonconformities.txt:468; knowledge-base/04_table4.txt:33

**Fonte de autoridade:** Criterion→FAIL→Nonconformity; AGENTS §10

**Descrição/evidência:** NC refere T4_DRT_SIGNED, mas Criterion contém ASSERT e MR, sem FAIL; nenhuma outra aresta a aciona.

**Contraexemplo/reprodução:** evidence/astra-coverage-criterion-nc.csv, linha NC_T4_018.

**Esperado:** Consequências usadas e coerentes ou claramente retiradas após decisão autorizada.

**Observado:** Definição com referência inversa válida, porém inacessível pelas arestas FAIL declaradas.

**Impacto operacional:** Artefato morto de manutenção; não demonstra que assinatura deva gerar FAIL.

**Camada responsável:** Base / consequências

**Tentativa de refutação:** REF_CRITERION não é acionamento e MR não cria NC. A auditoria rejeita criar FAIL para tornar NC alcançável.

**Correção mínima provável — não realizada:** Conciliar ou retirar a definição obsoleta após confirmar decisão de assinatura; não criar exigência.
