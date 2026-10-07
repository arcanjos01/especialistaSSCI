# Fase 6.0 — Proposta de complementação do Catálogo interno de RTs

Status: PROPOSTA PARA REVISÃO SOL 6.1 — não aplicar ao Anexo A antes de PASS.
Baseline: `6f824750b7022094a96b8cbe6016297cbcc71bab`.
Branch: `feature/apps-script-engine-core`.

## Ratificação e escopo

`F6-DEC-001=OPTION_B_APPROVED`.

`RATIFICATION_SCOPE=`
> Os identificadores RT-* utilizados pela plataforma são identificadores canônicos internos. Está autorizada a complementação do Catálogo Oficial interno de Responsabilidades Técnicas a partir das normas oficiais, IRV, DTZ 26 e INs específicas, sob revisão independente Sol 6.1. Nenhuma semântica normativa pode ser criada somente a partir do nome do identificador ou do runtime existente.

RT-001, RT-002 etc. são IDs internos da Plataforma. Não são códigos atribuídos pelo CBMSC nas INs/IRV/DTZ. O histórico Git consultado para o Anexo A (`fe6a469`, `e0aa397`) não contém entradas anteriores concretas. Os sete IDs abaixo são todos os `CATALOG_IDENTIFIER` distintos encontrados em `02_requirements.txt` no baseline; Requirements/Criteria foram usados apenas para localizar as atribuições que exigem reconciliação, nunca como prova normativa da natureza da RT.

## Critérios de classificação por campo

- `EXPLICIT_SOURCE`: a fonte declara diretamente o fato ou a regra indicada.
- `DERIVED_BY_DIRECT_FORMALIZATION`: redação de catálogo que organiza uma regra/fato explícito sem ampliar sua semântica.
- `UNRESOLVED`: fonte insuficiente para afirmar o atributo ou para validar a atribuição atual.

Não se usa `INFERRED_FROM_ENTITY_NAME`. `UNRESOLVED_ATTRIBUTE` restringe apenas o atributo indicado; não invalida os outros campos da entrada.

## Usos rastreados na Base

Os Requirements/Criteria comuns de DRT registrada, assinada, regularidade profissional e dados básicos alcançam cada RT exigida no plano: `REQ_T1_DRT_REGISTERED`/`T1_DRT_REGISTERED`, `REQ_T1_DRT_SIGNED`/`T1_DRT_SIGNED` e `T4_DRT_SIGNED`, `REQ_T1_DRT_PROFESSIONAL_REGULARITY`/`T1_DRT_PROFESSIONAL_REGULARITY` e `T4_DRT_PROFESSIONAL_REGULARITY`, `REQ_T1_DRT_BASIC_DATA`/`T1_DRT_RI_LEGAL_ENTITY`, `T1_DRT_RT_NAME`, `T1_DRT_ADDRESS`, `T1_DRT_AREA`.

Usos específicos encontrados:

| ID interno | Requirement / Criterion específico | Sistema ou escopo declarado na Base |
|---|---|---|
| RT-002 | `REQ_T1_DRT_REQUIRED` / `T1_DRT_REQUIRED`; `REQ_T1_DRT_ACTIVITY_EXECUTION` / `T1_DRT_ACTIVITY_EXECUTION` | execução geral do PPCI |
| RT-003 | `REQ_T1_DRT_SMSCI` / `T1_DRT_SMSCI_COVERAGE`; `REQ_IN08_MANUAL` / `T4_IN08_MANUAL`; `REQ_IN09_DRT` / `T4_IN09_DRT`; `REQ_IN09_MANUAL` / `T4_IN09_MANUAL`; `REQ_IN19_EXECUTION` / `T4_IN19_EXECUTION`; `REQ_IN19_GROUNDING` / `T4_IN19_GROUNDING`; quatro Requirements IN34/M5 sem produção pelo applicability atual | cobertura por SMSCI; manual/execução elétrica conforme referências da Base |
| RT-005 | `REQ_IN09_DRT` / `T4_IN09_DRT` | vistoria/inspeção de pressurização, conforme a atribuição atual |
| RT-006 | `REQ_IN08_ESTANQUEIDADE` / `T4_IN08_ESTANQUEIDADE`; `REQ_IN09_TEST_REPORT` / `T4_IN09_TEST_REPORT` | laudo de estanqueidade de gás; laudo de vistoria/ensaio de pressurização, conforme as atribuições atuais |
| RT-007 | `REQ_T1_CONFORMITY_REPORT` / `T1_CONFORMITY_REPORT`; `REQ_T1_CONFORMITY_REPORT_SIGNED` / `T1_CONFORMITY_REPORT_SIGNED`; `REQ_IN18_CMAR` / `T4_IN18_CMAR`; `REQ_IN19_FINAL_VERIFICATION` / `T4_IN19_FINAL_VERIFICATION` | relatório de conformidade; declaração CMAR; DRT de verificação final elétrica |
| RT-014 | `REQ_IN07_COMMISSIONING` / `T4_IN07_COMMISSIONING`; `REQ_IN10_COMMISSIONING` / `T4_IN10_COMMISSIONING`; `REQ_IN12_COMMISSIONING` / `T4_IN12_COMMISSIONING`; `REQ_IN15_COMMISSIONING` / `T4_IN15_COMMISSIONING` | comissionamento SHP, controle de fumaça, SDAI e sprinkler |
| RT-015 | `REQ_IN09_CHECKLIST` / `T4_IN09_CHECKLIST` | lista de verificações de procedimentos de manutenção da pressurização |

O uso sob `EACH_REQUIRED_TECHNICAL_RESPONSIBILITY` é genérico e não prova atributos individuais adicionais. O uso M5 é legado/não produtivo no applicability atual; foi incluído no rastreamento porque está declarado na Base.

## Propostas de entrada

### RT-002

IDENTIFIER=`RT-002` — `EXPLICIT_SOURCE` (identificador canônico interno ratificado pela decisão humana; não código CBMSC).

INTERNAL_IDENTIFIER=`true` — `EXPLICIT_SOURCE` (decisão humana).

DESCRIPTION=`Responsabilidade de execução geral dos SMSCI previstos no PPCI, representada no catálogo interno como escopo agregado de execução para a vistoria de habite-se.` — `DERIVED_BY_DIRECT_FORMALIZATION` (IN 01, art. 108, III; IRV Habite-se, Anexo A/Tabela 1).

PURPOSE=`Registrar a responsabilidade de execução apresentada para os SMSCI do PPCI. A DRT única de execução pode abranger todos os sistemas/medidas, exceto os que exigem RT específico.` — `EXPLICIT_SOURCE` (IN 01, art. 108, III; IRV Habite-se, Tabela 1, critério “documentos a serem apresentados conforme artigo 108”).

NATURE=`EXECUÇÃO.` — `EXPLICIT_SOURCE` (mesmas fontes). `REGULARIZAÇÃO` não é natureza equivalente nem atividade intercambiável: pode substituir a DRT de execução somente na condição composta da IN 01, art. 108, § 6º; registrar em campo próprio de alternativa condicional, não como OR simples.

APPLICABLE_SMSCI=`Todos os SMSCI previstos no PPCI como escopo agregado, ressalvados os sistemas/medidas para os quais IN específica exige RT específico.` — `EXPLICIT_SOURCE` (IN 01, art. 108, III; IRV, Tabela 1). A seleção concreta dos sistemas decorre do PPCI e dos contratos de applicability, não de uma lista inventada neste catálogo.

QUALIFIED_PROFESSIONALS=`NORMATIVELY_AUTHORIZED_PROFESSIONAL` — `DERIVED_BY_DIRECT_FORMALIZATION` (não enumerar profissões; habilitação concreta segue legislação profissional e conselho competente).

COMPATIBLE_ACTIVITIES=`EXECUÇÃO` — `EXPLICIT_SOURCE` (IRV, Tabela 1, verifica atividade declarada contra Execução). `REGULARIZAÇÃO` — `EXPLICIT_SOURCE` como via substitutiva, mas sua suficiência é `CONDITIONAL`: SMSCI executado por outro profissional ou sem acompanhamento, regularização viável, DRT de regularização e laudo de vistoria correspondente atestando funcionamento adequado nos quesitos normativos (IN 01, art. 108, § 6º). Não equivale a `EXECUÇÃO` isoladamente.

ACCEPTED_DOCUMENTARY_EVIDENCE=`DRT de execução (ou DRT de regularização somente com o pacote condicional acima); verificar registro/emissão no conselho, assinatura digital do RT ou certificação digital do conselho e dados exigidos na IRV.` — `EXPLICIT_SOURCE` (IN 01, art. 108, III e § 6º; IRV, Tabela 1). Tipos profissionais concretos de instrumento: limitar a ART/RRT/TRT quando emitidos pelo conselho competente; não afirmar outros instrumentos sem fonte autorizada.

ASSOCIATED_TECHNICAL_PRODUCTS=`Relatório de Conformidade dos SMSCI (Anexo I), como produto ligado à responsabilidade do RT pela execução dos SMSCI.` — `EXPLICIT_SOURCE` (IN 01, art. 65 e art. 108, IV; Anexo I, termo de responsabilidade/declaração do RT pela execução). O produto continua distinto da RT. A associação ao escopo agregado RT-002 é `DERIVED_BY_DIRECT_FORMALIZATION`; eventual granularidade por SMSCI RT-003 não cria relatório ou DRT adicional.

GENERAL_VALIDATION_CRITERIA=`Conferir registro/emissão e assinatura/certificação; nome do RI e RT, endereço e área; descrição de atividade/serviço; identificar os SMSCI pelos quais o RT se responsabiliza e conferir contra os do PPCI; não inferir cobertura por presença de uma DRT genérica quando a fonte exige RT específico. Para regularização, validar todos os elementos do art. 108, § 6º.` — `EXPLICIT_SOURCE` (IRV, Tabela 1; IN 01, art. 108, III e § 6º).

NORMATIVE_SOURCES=`IN 01 Parte 1, arts. 65 e 108, III–IV e § 6º; Anexo I da IN 01; IRV Habite-se, Anexo A/Tabela 1; Documento 11, §§ 4–8.` — `EXPLICIT_SOURCE`. Cada afirmação de campo acima tem sua fonte indicada junto ao campo.

OBSERVATIONS=`A distinção RT-002/RT-003 é somente convenção de modelagem interna: RT-002 denota o escopo agregado do requerimento documental; não cria categoria profissional ou espécie normativa diferente da execução. Uma mesma DRT pode servir como evidência compartilhada aos escopos interno agregado e por SMSCI, sem duplicar documento nem reduzir a lista de responsabilidades normativamente exigíveis. RT-002/003 e execução/regularização não podem ser colapsados em um predicate não qualificado. O Relatório de Conformidade acompanha a responsabilidade do RT pela execução (IN 01 art. 65/Anexo I), sem converter produto em RT.` — `DERIVED_BY_DIRECT_FORMALIZATION`. Para substituição por outra DRT durante a obra, preservar a composição documental descrita na DTZ OP 26-CMDOG art. 74, II(b); sem regra temporal adicional.

### RT-003

IDENTIFIER=`RT-003` — `EXPLICIT_SOURCE` (identificador canônico interno ratificado; não código CBMSC).

INTERNAL_IDENTIFIER=`true` — `EXPLICIT_SOURCE` (decisão humana).

DESCRIPTION=`Responsabilidade de execução de SMSCI em escopo individualizado para rastrear a cobertura documental por sistema, mantendo a possibilidade de uma única DRT genérica de execução quando permitida.` — `DERIVED_BY_DIRECT_FORMALIZATION` (IN 01, art. 108, III; IRV, Tabela 1).

PURPOSE=`Associar o(s) SMSCI documentalmente assumido(s) pelo RT ao PPCI e conferir cobertura sem presumir qual profissional assume sistema não indicado.` — `EXPLICIT_SOURCE` (IRV, Tabela 1, DRT de execução dos SMSCI previstos no PPCI).

NATURE=`EXECUÇÃO de SMSCI.` — `EXPLICIT_SOURCE` (IN 01, art. 108, III; IRV, Tabela 1). Não significa que deve haver uma DRT separada por sistema: a IN admite DRT única genérica salvo RT específico.

APPLICABLE_SMSCI=`Somente sistemas declarados no PPCI e identificados na DRT ou cobertos por DRT genérica válida, respeitada a exceção de RT específico. Referências atualmente ligadas na Base: SMSCI_GAS, SMSCI_PRESSURIZATION e SMSCI_IEL; os quatro M5 aparecem somente em Requirements legados não produtivos.` — primeira regra `EXPLICIT_SOURCE` (IN 01, art. 108, III; IRV, Tabela 1); lista de referências `DERIVED_BY_DIRECT_FORMALIZATION` dos Requirements existentes, sem afirmar que a norma atribui esses nomes internos.

QUALIFIED_PROFESSIONALS=`NORMATIVELY_AUTHORIZED_PROFESSIONAL` — `DERIVED_BY_DIRECT_FORMALIZATION`; as fontes do projeto não dão base para enumerar profissões por RT.

COMPATIBLE_ACTIVITIES=`EXECUÇÃO do(s) SMSCI declarados.` — `EXPLICIT_SOURCE` (IRV, Tabela 1). `REGULARIZAÇÃO` somente como rota substitutiva condicional do art. 108, § 6º, acompanhada da DRT de regularização e laudo de vistoria correspondente; não compatível/intercambiável isoladamente.

ACCEPTED_DOCUMENTARY_EVIDENCE=`DRT de execução com declaração de serviços/SMSCI; DRT genérica quando permitida; ou DRT de regularização + laudo correspondente apenas sob art. 108, § 6º.` — `EXPLICIT_SOURCE` (IN 01, art. 108, III e § 6º; IRV, Tabela 1). Datas, identidade, escopo e origem continuam fatos documentais.

ASSOCIATED_TECHNICAL_PRODUCTS=`Relatório de Conformidade dos SMSCI (Anexo I), como produto do RT responsável pela execução, no limite dos SMSCI que assume.` — vínculo geral com execução `EXPLICIT_SOURCE` (IN 01, art. 65 e Anexo I); associar a granularidade interna RT-003 por SMSCI `DERIVED_BY_DIRECT_FORMALIZATION`, sem segunda DRT. Manuais que Requirements atuais ligam a RT-003: `UNRESOLVED_ATTRIBUTE ASSOCIATED_TECHNICAL_PRODUCTS`, pois IN 08 art. 80 e IN 09 art. 122 os exigem como documentos sem determinar que sejam produtos decorrentes desta responsabilidade de execução.

GENERAL_VALIDATION_CRITERIA=`Conferir registro/emissão e assinatura/certificação; nome RI/RT, endereço/área; atividade/serviços e SMSCI declarados; comparar lista documental com PPCI; uma DRT pode cobrir vários SMSCI; não aplicar cobertura genérica aos SMSCI com RT específico nem aos documentalmente atribuídos a outro RT; ambiguidade não prova cobertura. Na rota de regularização, exigir os pressupostos e o laudo do § 6º.` — `EXPLICIT_SOURCE` (IRV Tabela 1; IN 01 art. 108 III e § 6º; DTZ art. 74 II(b) para sucessão durante obra).

NORMATIVE_SOURCES=`IN 01 Parte 1, arts. 65 e 108, III–IV e § 6º; Anexo I da IN 01; IRV Habite-se, Anexo A/Tabela 1; DTZ OP 26-CMDOG, art. 74, II(b); Documento 11, §§ 4–8.` — `EXPLICIT_SOURCE`.

OBSERVATIONS=`RT-002 e RT-003 compartilham a mesma natureza normativa de execução e podem compartilhar a mesma DRT. A separação é convenção interna de rastreio agregado versus por SMSCI, não categoria externa. A IN não define uma lista completa de quais sistemas demandam RT específico; essa exceção deve vir da IN técnica de cada sistema. O relatório de conformidade se liga ao RT pela execução (IN 01 art. 65/Anexo I); os manuais não ficam associados à RT por inferência. Não converter `HAS_DRT_ACTIVITY` em decisão de cobertura/satisfação.` — `DERIVED_BY_DIRECT_FORMALIZATION`.

### RT-005

IDENTIFIER=`RT-005` — `EXPLICIT_SOURCE` como ID interno ratificado; não código CBMSC.

INTERNAL_IDENTIFIER=`true` — `EXPLICIT_SOURCE`.

DESCRIPTION=`Responsabilidade técnica de vistoria/inspeção de SMSCI, no escopo normativo em que essa atividade é exigida.` — `DERIVED_BY_DIRECT_FORMALIZATION` (IN 09, art. 122, I–II, usa “DRT de vistoria/ensaio” e exige inspeções especificadas).

PURPOSE=`Documentar a responsabilidade profissional pela vistoria/ensaio de sistemas de pressurização, gradiente de pressão, alarme e detecção no escopo e itens expressamente previstos.` — `DERIVED_BY_DIRECT_FORMALIZATION` da IN 09 art. 122; não estender o propósito a outras inspeções sem fonte.

NATURE=`INSPEÇÃO/VISTORIA.` — `EXPLICIT_SOURCE` (IN 09, art. 122). O mesmo artigo combina DRT de vistoria/ensaio; não declara duas categorias de DRT distintas para inspeção e ensaio.

APPLICABLE_SMSCI=`Sistema de pressurização e gradiente de pressão, alarme e detecção de incêndio, no escopo do art. 122, I; não criar identificadores SMSCI adicionais no catálogo.` — `EXPLICIT_SOURCE` (IN 09 art. 122, I).

QUALIFIED_PROFESSIONALS=`NORMATIVELY_AUTHORIZED_PROFESSIONAL` — `DERIVED_BY_DIRECT_FORMALIZATION`; não enumerar categorias sem fonte.

COMPATIBLE_ACTIVITIES=`VISTORIA/INSPEÇÃO dos itens do sistema de pressurização discriminados na IN 09, art. 122, II; o documento deve indicar código ou descrição específica para escadas pressurizadas e gradiente de pressão conforme art. 122, I.` — `EXPLICIT_SOURCE`.

ACCEPTED_DOCUMENTARY_EVIDENCE=`DRT de vistoria/ensaio correspondente e laudo que acompanha a vistoria/ensaio, conforme IN 09 art. 122, I–II; instrumento ART/RRT/TRT conforme conselho competente.` — `EXPLICIT_SOURCE` (IN 01 art. 108 § 4º complementa a exigência de DRT para inspeção/mensuração).

ASSOCIATED_TECHNICAL_PRODUCTS=`Laudo de vistoria/ensaio do sistema de pressurização/gradiente de pressão e sistemas relacionados indicados no art. 122, I.` — `EXPLICIT_SOURCE` (IN 09 art. 122, I–II). O mesmo produto e a DRT de vistoria/ensaio podem servir à decomposição interna RT-005/RT-006; não exigir DRT duplicada. A delimitação de escopo entre os dois IDs permanece registrada em OBSERVATIONS.

GENERAL_VALIDATION_CRITERIA=`Verificar DRT de vistoria/ensaio e laudo; código/descrição de escadas pressurizadas/gradiente; inspecionar os itens a–g do art. 122, II, e as portas corta-fogo do item h; verificar seus mecanismos automáticos de fechamento somente se previstos; não exigir DRT independente adicional apenas pelo ID interno.` — `EXPLICIT_SOURCE` (IN 09 art. 122, I–II).

NORMATIVE_SOURCES=`IN 09, art. 122, I–II; IN 01 Parte 1, art. 108, § 4º; Documento 11, §§ 4–8.` — `EXPLICIT_SOURCE`.

OBSERVATIONS=`A Base usa RT-005 para a parte “inspeção” e RT-006 para o laudo/teste do mesmo art. 122. A norma declara uma DRT de vistoria/ensaio com o laudo correspondente e inclui pressurização, gradiente de pressão, alarme e detecção; não exige DRT separada para cada componente ou ID interno. `UNRESOLVED_ATTRIBUTE RESPONSIBILITY_RELATION_TO_RT006`: identidade funcional da decomposição interna precisa ser reconciliada sem criar obrigação/registro adicional.` — classificação `EXPLICIT_SOURCE` para cardinalidade documental e `UNRESOLVED` para a relação dos IDs.

### RT-006

IDENTIFIER=`RT-006` — `EXPLICIT_SOURCE` como ID interno ratificado; não código CBMSC.

INTERNAL_IDENTIFIER=`true` — `EXPLICIT_SOURCE`.

DESCRIPTION=`Responsabilidade interna de ensaio técnico, limitada aos ensaios cuja norma exige DRT correspondente.` — `DERIVED_BY_DIRECT_FORMALIZATION` (IN 01 art. 108 § 4º; IN 08 art. 95; IN 09 art. 122).

PURPOSE=`Documentar o ensaio técnico de estanqueidade da instalação de gás ou o ensaio/vistoria da pressurização exigido pelas fontes aplicáveis.` — `DERIVED_BY_DIRECT_FORMALIZATION`; para pressurização, observar a relação com RT-005 não resolvida.

NATURE=`ENSAIO; para IN 09, a norma formula conjuntamente “vistoria/ensaio”.` — `EXPLICIT_SOURCE`.

APPLICABLE_SMSCI=`SMSCI_GAS (estanqueidade) e SMSCI_PRESSURIZATION (ensaio/vistoria prevista); nenhuma extensão a outro SMSCI.` — `EXPLICIT_SOURCE` (IN 08 art. 95; IN 09 art. 122) para atividade e sistemas.

QUALIFIED_PROFESSIONALS=`NORMATIVELY_AUTHORIZED_PROFESSIONAL` — `DERIVED_BY_DIRECT_FORMALIZATION`.

COMPATIBLE_ACTIVITIES=`Ensaio de estanqueidade da instalação de gás combustível; vistoria/ensaio do sistema de pressurização conforme escopo e itens da IN 09.` — `EXPLICIT_SOURCE` para as atividades e fontes acima. Código literal de atividade profissional além do expressamente requerido no art. 122 fica `UNRESOLVED`.

ACCEPTED_DOCUMENTARY_EVIDENCE=`Laudo ou ensaio de estanqueidade acompanhado do respectivo DRT; laudo de vistoria/ensaio da pressurização acompanhado da DRT de vistoria/ensaio correspondente ao escopo no art. 122.` — `EXPLICIT_SOURCE` (IN 08 art. 95 admite laudo ou ensaio; IRV Tabela 4, item IN08; IN 01 art. 108 § 4º; IN 09 art. 122, I–II).

ASSOCIATED_TECHNICAL_PRODUCTS=`Laudo ou ensaio de estanqueidade da instalação de gás; laudo de vistoria/ensaio do sistema de pressurização/gradiente e sistemas relacionados.` — produtos `EXPLICIT_SOURCE` (IRV Tabela 4, item IN08; IN 08 art. 95; IN 09 art. 122, I–II). A DRT e laudo de pressurização são compartilháveis com o escopo interno RT-005; não declarar associação exclusiva a RT-006.

GENERAL_VALIDATION_CRITERIA=`Verificar DRT que acompanha o produto; identificar o produto/sistema; aplicar validade de até cinco anos somente ao laudo ou ensaio de estanqueidade conforme IN 08/IRV; para pressurização aplicar itens e conteúdo exigidos no art. 122 da IN 09; não inferir cobertura por atividade genérica.` — `EXPLICIT_SOURCE`.

NORMATIVE_SOURCES=`IN 01 Parte 1, art. 108, § 4º; IN 08, art. 95; IRV Habite-se, Tabela 4 (item IN08); IN 09, art. 122, I–II; Documento 11, §§ 4–8.` — `EXPLICIT_SOURCE`.

OBSERVATIONS=`O uso atual de um mesmo ID para estanqueidade de gás e vistoria/ensaio de pressurização representa generalização interna de “ensaio”, não nomenclatura das normas. Em IN 09 a DRT de vistoria/ensaio e o laudo são a composição documental correspondente, que pode atender aos escopos internos RT-005/RT-006; `UNRESOLVED_ATTRIBUTE RESPONSIBILITY_RELATION_TO_RT005` limita a semântica da decomposição, não a exigência documental. A validade de até cinco anos aplica-se ao laudo ou ensaio de estanqueidade.` — classificação `DERIVED_BY_DIRECT_FORMALIZATION`; limite `UNRESOLVED`.

### RT-007

IDENTIFIER=`RT-007` — `EXPLICIT_SOURCE` como ID interno ratificado; não código CBMSC.

INTERNAL_IDENTIFIER=`true` — `EXPLICIT_SOURCE`.

DESCRIPTION=`Responsabilidade técnica interna de verificação final da instalação elétrica de baixa tensão no escopo do habite-se.` — `DERIVED_BY_DIRECT_FORMALIZATION` da IN 19, art. 18, III. O nome atual `RT_007_AVALIACAO_TECNICA` não é fonte normativa nem determina a descrição.

PURPOSE=`Documentar a verificação final da instalação elétrica de baixa tensão exigida para habite-se.` — `EXPLICIT_SOURCE` (IN 19, art. 18, III).

NATURE=`VERIFICAÇÃO FINAL.` — `EXPLICIT_SOURCE` para a DRT exigida pela IN 19, art. 18, III. IN 01 Relatório de Conformidade e IN 18 declaração CMAR são usos atuais diferentes e não integram esta entrada sem fonte de vínculo.

APPLICABLE_SMSCI=`Instalação elétrica de baixa tensão do imóvel para fins de habite-se.` — `EXPLICIT_SOURCE` (IN 19, art. 18, III). Os usos em relatório de conformidade e declaração CMAR ficam fora do escopo resolvido desta entrada.

QUALIFIED_PROFESSIONALS=`NORMATIVELY_AUTHORIZED_PROFESSIONAL` — `DERIVED_BY_DIRECT_FORMALIZATION`; categorias específicas `UNRESOLVED` nas fontes consultadas.

COMPATIBLE_ACTIVITIES=`Verificação final da instalação elétrica de baixa tensão.` — `EXPLICIT_SOURCE` (IN 19, art. 18, III). Atribuição a esta mesma RT dos usos de relatório de conformidade e declaração CMAR é `UNRESOLVED_ATTRIBUTE COMPATIBLE_ACTIVITIES`.

ACCEPTED_DOCUMENTARY_EVIDENCE=`DRT de verificação final da instalação elétrica.` — `EXPLICIT_SOURCE` (IN 19, art. 18, III). Associação da DRT de execução ao relatório de conformidade ou declaração CMAR a RT-007: `UNRESOLVED_ATTRIBUTE ACCEPTED_DOCUMENTARY_EVIDENCE`; as fontes relacionam ambos à execução/instalação, não a esta RT interna.`

ASSOCIATED_TECHNICAL_PRODUCTS=`UNRESOLVED_ATTRIBUTE ASSOCIATED_TECHNICAL_PRODUCTS` — `UNRESOLVED`: IN 19, art. 18, III, exige DRT (evidência), não define um Produto Técnico próprio desta RT. Não catalogar DRT como produto.`

GENERAL_VALIDATION_CRITERIA=`Para a verificação final elétrica, conferir a DRT de atividade expressamente exigida pela IN 19, art. 18, III, e as alternativas temporais do parágrafo único somente quando seus requisitos se aplicarem. Não aplicar essa validação ao relatório de conformidade ou CMAR por analogia.` — `EXPLICIT_SOURCE`/limitação `DERIVED_BY_DIRECT_FORMALIZATION`.

NORMATIVE_SOURCES=`IN 19, art. 18, III e parágrafo único; IN 01, art. 65 e art. 108, IV/Anexo I; IN 18, art. 14, I–II; IRV Habite-se, Tabela 1/Tabela 4; Documento 11, §§ 4–8.` — `EXPLICIT_SOURCE`.

OBSERVATIONS=`A Base liga hoje RT-007 ao relatório de conformidade, à declaração CMAR e à verificação final elétrica, mas a fonte só sustenta aqui a atividade de verificação final elétrica. IN 01, art. 65/Anexo I, liga o Relatório de Conformidade ao RT pela execução; IN 18, art. 14, I–II, exige declaração do RT e DRT de instalação/execução, sem declarar que o subscritor da declaração e o titular da DRT sejam a mesma pessoa. Portanto esses dois produtos não comprovam uma RT-007 de avaliação nem identidade automática de profissionais. `UNRESOLVED_ATTRIBUTE CURRENT_REQUIREMENT_TO_RT007_MAPPINGS` para os dois usos até reconciliação contratual; não inferir RT de produto ou nome interno.` — `EXPLICIT_SOURCE` para os vínculos normativos citados e `UNRESOLVED` para as atribuições atuais.

### RT-014

IDENTIFIER=`RT-014` — `EXPLICIT_SOURCE` como ID interno ratificado; não código CBMSC.

INTERNAL_IDENTIFIER=`true` — `EXPLICIT_SOURCE`.

DESCRIPTION=`Responsabilidade técnica interna de comissionamento do SMSCI quando a IN específica exige comissionamento.` — `DERIVED_BY_DIRECT_FORMALIZATION` das INs específicas listadas abaixo.

PURPOSE=`Documentar o comissionamento quando exigido para o SMSCI correspondente, com o relatório e DRT requeridos pela regra aplicável.` — `DERIVED_BY_DIRECT_FORMALIZATION` (INs específicas e IRV, Tabela 4, itens IN07/10/12/15).

NATURE=`COMISSIONAMENTO.` — `EXPLICIT_SOURCE` nas INs de sistema citadas.

APPLICABLE_SMSCI=`SHP, controle de fumaça mecânico, SDAI e SPK, nos escopos documentais das INs específicas. Os nomes SMSCI_* são referências internas dos Requirements e não nomes/códigos normativos.` — existência de cada escopo `EXPLICIT_SOURCE` nas INs correspondentes; associação aos identificadores internos `DERIVED_BY_DIRECT_FORMALIZATION`. Aplicação concreta obedece applicability e versão da fonte.

QUALIFIED_PROFESSIONALS=`NORMATIVELY_AUTHORIZED_PROFESSIONAL` — `DERIVED_BY_DIRECT_FORMALIZATION`; não enumerar profissões sem texto autorizador. Para SPK, a IN 15, art. 30, atribui o comissionamento ao RT de execução/manutenção do sistema; para controle de fumaça mecânico, aplicar a independência prevista na IRV, Tabela 4, item IN10.

COMPATIBLE_ACTIVITIES=`Comissionamento SHP conforme IN 07, Anexo C, sob RT de execução/manutenção conforme IRV Habite-se, Tabela 4, item IN07; comissionamento do controle de fumaça mecânico conforme IN 10, art. 41 e Anexo B, por equipe/profissional independente sem vínculo técnico com projeto ou execução conforme IRV Tabela 4, item IN10; comissionamento do SDAI conforme IN 12, art. 47; comissionamento do SPK pelo RT de execução/manutenção conforme IN 15, art. 30.` — `EXPLICIT_SOURCE`. As condições são locais ao SMSCI e não se generalizam para todo RT-014.

ACCEPTED_DOCUMENTARY_EVIDENCE=`DRT respectiva ao relatório de comissionamento e relatório de comissionamento correspondente.` — `EXPLICIT_SOURCE` (IN 01 art. 108 § 4º para produto técnico; INs específicas/IRV exigem produto e DRT). A associação precisa ser documentalmente explícita quando há documentos múltiplos.

ASSOCIATED_TECHNICAL_PRODUCTS=`Relatório de comissionamento SHP; relatório do comissionamento do controle de fumaça mecânico; relatório de comissionamento SDAI; relatório de comissionamento SPK.` — produtos `EXPLICIT_SOURCE` (IN 07 Anexo C; IN 10 art. 41/Anexo B; IN 12 art. 47; IN 15 arts. 30 e 32; IRV Habite-se, Tabela 4, itens IN07/10/12/15). Associação à atividade de comissionamento `DERIVED_BY_DIRECT_FORMALIZATION`. DRT é evidência/documento próprio, não produto.

GENERAL_VALIDATION_CRITERIA=`Confirmar SMSCI e IN específica; atividade e agente exigidos para esse sistema; existência e conteúdo/assinatura do relatório segundo a fonte; DRT respectiva ligada documentalmente ao relatório; para controle mecânico de fumaça aplicar independência da IRV Tabela 4, item IN10; para SPK observar que a IN15 atribui comissionamento ao RT de execução/manutenção. Não generalizar essas condições a outros sistemas.` — `EXPLICIT_SOURCE`.

NORMATIVE_SOURCES=`IN 01 Parte 1, art. 108, § 4º; IN 07, Anexo C; IN 10, art. 41 e Anexo B; IN 12, art. 47; IN 15, arts. 30 e 32; IRV Habite-se, Tabela 4 (itens IN07/10/12/15; páginas impressas 7–9) e Tabela 9 para critérios técnicos do sistema de fumaça; Documento 11, §§ 4–8.` — `EXPLICIT_SOURCE`.

OBSERVATIONS=`RT-014 é uma categoria interna reutilizada para comissionamento. As condições expressas variam por sistema: execução/manutenção para SHP e SPK; independência somente para fumaça mecânica; requisitos próprios nas demais INs. Não transformar essas condições em predicado global sem discriminar o SMSCI.` — `DERIVED_BY_DIRECT_FORMALIZATION`.

### RT-015

IDENTIFIER=`RT-015` — `EXPLICIT_SOURCE` como ID interno ratificado; não código CBMSC.

INTERNAL_IDENTIFIER=`true` — `EXPLICIT_SOURCE`.

DESCRIPTION=`Responsabilidade interna de manutenção de sistemas de segurança contra incêndio, nos casos e escopos em que a IN exige DRT de manutenção.` — `DERIVED_BY_DIRECT_FORMALIZATION` da IN 09, art. 123, I; a associação ao checklist do art. 122, IV segue não resolvida.

PURPOSE=`Documentar a manutenção periódica e a vistoria de funcionamento anual no escopo expresso pela IN 09, art. 123, I.` — `EXPLICIT_SOURCE`.

NATURE=`MANUTENÇÃO.` — `EXPLICIT_SOURCE` (IN 09, art. 123, I, exige DRT de manutenção e laudo anual de vistoria dos sistemas de pressurização/gradiente de pressão, alarme e detecção). Essa natureza é distinta do checklist de habite-se do art. 122, IV.

APPLICABLE_SMSCI=`Sistemas de pressurização, gradiente de pressão, alarme e detecção de incêndio no escopo de vistoria de funcionamento do art. 123, I.` — `EXPLICIT_SOURCE`. A associação com checklist de habite-se (art. 122, IV) permanece `UNRESOLVED_ATTRIBUTE` separada.

QUALIFIED_PROFESSIONALS=`NORMATIVELY_AUTHORIZED_PROFESSIONAL` — `DERIVED_BY_DIRECT_FORMALIZATION`; profissão específica não definida no material consultado.

COMPATIBLE_ACTIVITIES=`Manutenção dos sistemas pressurização/gradiente de pressão, alarme e detecção, no escopo do art. 123, I.` — `EXPLICIT_SOURCE`. A atribuição desse catálogo interno ao checklist art. 122, IV permanece não demonstrada.

ACCEPTED_DOCUMENTARY_EVIDENCE=`DRT de manutenção e laudo de manutenção anual apresentado na vistoria de funcionamento, conforme IN 09 art. 123, I.` — `EXPLICIT_SOURCE`. Para a lista de verificação do art. 122, IV, se ela exige DRT própria de manutenção: `UNRESOLVED_ATTRIBUTE DRT_REQUIREMENT_FOR_CHECKLIST`; o texto atribui seu fornecimento aos responsáveis pela instalação.

ASSOCIATED_TECHNICAL_PRODUCTS=`Laudo anual de vistoria de funcionamento acompanhado da DRT de manutenção para pressurização/gradiente/alarme/detecção.` — `EXPLICIT_SOURCE` (IN 09, art. 123, I). A lista de verificações de manutenção do art. 122, IV, é documento dado aos proprietários pelos responsáveis pela instalação; sua associação à RT-015 é `UNRESOLVED_ATTRIBUTE ASSOCIATED_TECHNICAL_PRODUCTS`.

GENERAL_VALIDATION_CRITERIA=`No escopo de funcionamento, conferir DRT de manutenção e laudo anual nos limites da IN 09 art. 123, I. Separadamente, conferir a existência/entrega do checklist do art. 122, IV, sem exigir DRT própria com base apenas no Requirement/ID RT-015.` — `EXPLICIT_SOURCE` e `DERIVED_BY_DIRECT_FORMALIZATION` para separar os dois escopos.

NORMATIVE_SOURCES=`IN 09, art. 123, I (manutenção e laudo anual); art. 122, III–IV (manual/lista de verificação fornecida pelos responsáveis da instalação); IN 01 Parte 1, art. 108, § 4º; Documento 11, §§ 4–8.` — `EXPLICIT_SOURCE`.

OBSERVATIONS=`A natureza manutenção é fonte-definida pelo art. 123, I. A ligação atual `REQ_IN09_CHECKLIST`/RT-015 refere-se ao checklist de habite-se do art. 122, IV, cujo fornecimento é atribuído aos responsáveis pela instalação e não se confunde com a DRT/laudo anual do art. 123, I. `UNRESOLVED_ATTRIBUTE CHECKLIST_TO_RT015_RELATION` e `UNRESOLVED_ATTRIBUTE DRT_REQUIREMENT_FOR_CHECKLIST`; a lacuna limita apenas essa associação atual.` — `EXPLICIT_SOURCE` para manutenção e checklist; `UNRESOLVED` para relação RT/checklist.

## Revisão independente da proposta

`SOL_CATALOG_REVIEW=PASS` foi emitido por revisão Sol 6.1 independente da
proposta, antes da edição do Anexo A. Foram aplicadas as recomendações sobre:
redação exata do laudo anual da RT-015; ausência de limite/cardinalidade
máxima de DRT na decomposição interna RT-005/RT-006; e não inferência de
identidade entre declarante CMAR e titular da DRT.

Após commit/push do catálogo, uma segunda revisão independente do diff
agregado retornou `SOL_CATALOG_DIFF_REVIEW=PASS` em
`e997815712782f91f38f4e43b578e5b864d7b828`. Os achados materiais do primeiro
parecer de diff foram corrigidos. O parecer final registrou somente
`F6-CAT-R2-001` (LOW), recomendação editorial não bloqueante em
`APPLICABLE_SMSCI` RT-003; a cobertura da DRT continua conferida contra o PPCI
nos critérios gerais. A decisão F6-DEC-001 foi então encerrada. Esse PASS não
resolve mappings atuais ou contratos factuais de evidência da Fase 6.

## Referências primárias conferidas nesta proposta

- IN 01 Parte 1, arts. 65, 108, III–IV e § 6º (`references/in01.pdf`): atribuição ao RT pela execução do Relatório de Conformidade; DRT de execução geral; DRT para laudo/ensaio/inspeção/mensuração; rota excepcional de regularização com laudo de vistoria correspondente.
- IRV Habite-se, Anexo A, Tabela 1 (`references/irv habitese.pdf`, páginas impressas 4–5): uma DRT de execução geral salvo RT específico; registro/emissão; assinatura/certificação; RI/RT/endereço/área; atividade/serviços; SMSCI assumidos versus PPCI.
- IN 09, arts. 122–123 (fonte oficial CBMSC 2024): art. 122 exige DRT de execução e DRT de vistoria/ensaio e atribui checklist aos responsáveis pela instalação; art. 123, I, exige DRT de manutenção e laudo anual no escopo de funcionamento.
- IN 19, art. 18 (fonte oficial CBMSC 2024): DRT de verificação final e alternativas de execução/manutenção/reforma conforme conclusão/data. A DRT exigida é evidência, não Produto Técnico.
- IRV Habite-se, Tabela 4 (itens IN07/08/09/10/12/15/18), páginas impressas 7–9: lista os documentos da vistoria, com os documentos de comissionamento/laudo e DRT correspondentes. Tabelas 6, 9, 11 e 14 são critérios técnicos dos respectivos sistemas, não a localização primária dos requisitos documentais.
- DTZ OP 26-CMDOG, art. 74, II(b) (`references/dtz26.pdf`): distrato deve descrever os serviços efetivamente realizados e ser apresentado com a DRT do sucessor que assumiu/finalizou a obra. Isto admite mais de uma DRT por processo; não define, por si, regra adicional de validade temporal.
- Documento 11, §§ 4–8: separa Responsabilidade Técnica, Produto Técnico e evidência/DRT.

## Formalização autorizada no Anexo A

As alterações estão aplicadas em `docs/Anexo_A_Catalogo_Oficial_das_Responsabilidades_Tecnicas_Rev2.txt` e aprovadas na revisão Sol independente do diff efetivo. As entradas preservam `UNRESOLVED_ATTRIBUTE`, distinguem execução da via condicional de regularização e mantêm DRT como evidência documental.
