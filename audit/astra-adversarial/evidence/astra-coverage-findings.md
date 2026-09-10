# Cobertura, referências e release — notas do subauditor

Baseline: `9d2e7f175507a4e81e3ed80d7ef57e89d73124d1`, branch `audit/astra-adversarial-2026-09-09`. Investigação iniciada 09/09 e encerrada 10/09/2026. Produto somente leitura; scripts, build e CSV somente `/tmp`. Sem web/fontes normativas externas. Análise mecânica não equivale a validação normativa de todas as obrigações.

## Inventário e matrizes

31 arquivos versionados: 10 Base, 4 arquitetura, 4 PDFs oficiais, 6 testes, 3 engine Python, 1 builder, 3 raiz. Definições ancoradas no início da linha e nos arquivos fonte próprios: 30 Requirements, 36 Criteria, 32 Nonconformities, 84 Entities. Sem duplicações de IDs nessas quatro categorias. Nenhum Requirement sem Criterion, Criterion sem Requirement, FAIL com NC inexistente, ou NC com REF_CRITERION/REF_REQUIREMENT inexistente.

Há 7 IDs de RT referenciados (`RT-002`, `RT-003`, `RT-005`, `RT-006`, `RT-007`, `RT-014`, `RT-015`), nenhum com registro efetivo no Anexo A. O uso de `RT_...` é alias na Base, não foi contado automaticamente como criação de nova responsabilidade.

Matrizes:
- `astra-coverage-req-criterion-nc-rt.csv`: todas as 36 associações com fonte/artigo/locais/RT/NC/funções/regime.
- `astra-coverage-criterion-nc.csv`: todas as 32 NC, referências inversas e ligações FAIL.
- `astra-coverage-rt-catalog.csv`: sete RT e Requirements dependentes.
- `astra-coverage-criterion-functions.csv`: cada função usada por Criterion e presença textual em 00_engine (triagem; ausência revisada manualmente).
- `astra-coverage-technical-products.csv`: todo TECHNICAL_PRODUCT e declaração ENTITY correspondente.
- `astra-coverage-undeclared-document-symbols.csv`: seis REQUIRE DOCUMENT sem ENTITY.
- `astra-coverage-index-order.csv`: todas as posições reais do índice compilado.
- `astra-coverage-tracked-inventory.csv`: tamanho/hash SHA256 de cada arquivo versionado.
- `astra-coverage-local-case-inventory.csv`: tamanho/hash dos 15 PDFs locais, explicitamente fora do baseline.
- `astra-coverage-local-release-comparison.csv`: 40 hashes dos quatro pacotes locais e comparação com build baseline.

## CV-01 — Anexo A não contém os registros que a Base exige

Severidade proposta HIGH; arquitetura/modelo conceitual/completude; confirmado estaticamente; requer revisão independente pelo auditor-chefe.

Autoridade: AGENTS §§4/11; Anexo A §3 linhas48–62: fonte única de IDs, atividades compatíveis, evidências aceitas e demais atributos; §8: inclusão exclusivamente por revisão do catálogo. O arquivo integral tem somente estrutura/princípios, sem instância dos campos. Exemplos `RT-001, RT-002…` nas linhas50/98 são exemplos, não registros.

Uso concreto: `02_requirements:19–22` exige RT-002 com `DRT_EVIDENCE CATALOG_ACCEPTED`; `03_table1:22–26` usa `RESPONSIBILITY_HAS_ACCEPTED_DRT_EVIDENCE(RT_002_EXECUCAO_DE_OBRA)`; `01_entities:112–121` remete os registros ao Anexo. As demais seis RT também carecem de conteúdo catalográfico. Manifesto `08:18–31` só inclui os dez documentos, sem Anexo nem derivação do catálogo; mesmo carregar manualmente o arquivo não fornece registros ausentes.

Contraexemplo mínimo: processo com ART declarando execução de obra. A Base exige decidir se aquela evidência é aceita e atividade compatível com RT-002; não há conjunto oficial permitido que possa ser consultado. Esperado: definição autorizada e disponível, preservando ausência sem inventar. Observado: dependência declarada sem dados. Impacto: validações centrais não se fundamentam no catálogo e exigem interpretação externa/invenção se se pretender concluí-las.

Refutação tentada: (a) catálogo estaria em 01_entities: contém apenas conceitos, não registros; (b) Requirements conteriam dados suficientes: descrevem escolhas locais mas não conjuntos oficiais, e Anexo proíbe substituir essa autoridade; (c) arquivos fora dos dez: só o mesmo Anexo vazio está versionado. Não alego que um Gem real tenha produzido falso PASS; o defeito observado é a lacuna de autoridade.

## CV-02 — Seis funções normativas usadas sem contrato declarado

Severidade proposta HIGH ou MEDIUM conforme consolidação com CV-01; contrato/execução/completude; confirmado estaticamente, impacto operacional ainda não executado no Gem.

Funções ausentes de `00_engine` e sem definição noutra fonte versionada: `RESPONSIBILITY_HAS_ACCEPTED_DRT_EVIDENCE` (03:24), `RESPONSIBILITY_EVIDENCE_ATTRIBUTE` (03:42/61 e 04:22/41), `RESPONSIBILITY_HAS_TECHNICAL_PRODUCT` (03:102), `RESPONSIBILITY_EVIDENCE_MATCHES_PROCESS_ATTRIBUTE` (03:160/180), `RESPONSIBILITY_ACTIVITY_COMPATIBLE` (03:218), `RESPONSIBILITY_IS_SATISFIED_FOR_SMSCI` (03:238).

Autoridade: `00_engine:19–35` executa somente declarado, sem suposições/novas regras; AGENTS §9 obriga regras declaradas e semântica do Engine. `00_engine:110+` lista funções e fornece semântica de outras RESPONSIBILITY_*; não há regra que autorize resolver estas por seus nomes. Referência no Criterion não define estados, cardinalidade ou comportamento de evidência conflitante/ausente.

Contraexemplo: duas DRTs vinculadas à mesma RT, uma registrada e outra não. ASSERT `RESPONSIBILITY_EVIDENCE_ATTRIBUTE(...,REGISTERED)` não declara ALL/EXISTS/precedência; nome e argumento não escolhem legitimamente entre PASS/FAIL/UNKNOWN. Mesmo problema para endereço/área e evidência aceita. Refutação: regras de `TECHNICAL_PRODUCT_ATTRIBUTE` são específicas de assinatura, não definem agregação geral de `RESPONSIBILITY_EVIDENCE_ATTRIBUTE`; funções próximas de DRT têm contratos próprios, não aliases autorizados. Python é infraestrutura e sua ausência não é, sozinha, defeito operacional.

## CV-03 — Referência a NC inexistente no Requirement de assinatura

Severidade proposta MEDIUM; referência/completude; confirmado. `02_requirements:99–109`, precisamente linha108, associa `NC_T1_003_SIGNED`. Nenhuma definição no catálogo 05 nem ocorrência em outro arquivo do baseline. `03_table1:187–201` só produz MANUAL_REVIEW para esse Criterion.

Autoridade: `08:485` exige validar referências Criterion e NC antes de executar; AGENTS §16 referências existentes. Contraexemplo mínimo: Requirement aplicável de assinatura do relatório de conformidade (T1). Esperado: todas as referências resolvíveis; observado: lookup NC falha. Builder ainda gera release porque valida apenas Requirement→Criterion e FOR_EACH, não NC.

Refutação: NC não seria necessária porque falta de assinatura produz MR: isso explica por que não se deve criar automaticamente uma NC nova, mas não torna existente a referência declarada. Não afirmar FAIL gerado indevidamente; possível bloqueio do gate é consequência interpretativa, não execução Gem demonstrada.

## CV-04 — NC_T4_018 é consequência sem acionador FAIL

Severidade LOW (ou observação na matriz); manutenção/dead rule; confirmado. `05:468` define NC com REF_CRITERION `T4_DRT_SIGNED`; `04:33–48` contém ASSERT e MANUAL_REVIEW, nenhum FAIL. Nenhum Criterion do baseline aciona `NC_T4_018`.

Refutação: REF_CRITERION é ligação inversa, não acionamento; ausência de FAIL não autoriza gerar NC por inferência. Assinatura pode demandar MR legitimamente, portanto não denunciar falso negativo de assinatura nem propor obrigação nova. Aresta inversa válida distingue este caso de referência órfã. NC é inacessível pelas arestas FAIL declaradas.

## CV-05 — Sete símbolos documentais sem ENTITY canônica

Severidade MEDIUM; modelagem/rastreabilidade; presença/ausência confirmada, impacto forte mas Gem não testado. Seis `REQUIRE DOCUMENT` sem ENTITY listados no CSV: PRESSURIZATION_DRT (04:158), PRESSURIZATION_TEST_REPORT (04:186), PRESSURIZATION_OPERATION_MANUAL (04:216), PRESSURIZATION_MAINTENANCE_CHECKLIST (04:238), SMOKE_CONTROL_COMMISSIONING_REPORT (04:262), SPRINKLER_COMMISSIONING_REPORT (04:335). Além deles CONFORMITY_REPORT usado como TECHNICAL_PRODUCT/argumento (02:93,105;03:104,196) sem ENTITY.

Autoridade: `08:323–325` normaliza representação RDE usando 01_entities; `00_engine:31–35` proíbe objetos/atributos/documentos novos; RDE exige nomes/representação canônicos. Contraexemplo: extrair um relatório de comissionamento de sprinklers; 01_entities define COMMISSIONING_REPORT genérico, mas nenhuma relação canônica declara o símbolo específico que EXISTS exige.

Refutação: símbolos aparecem em Requirements e, por isso, não são totalmente desconhecidos pela Base; não chamar simples nome ausente de prova de execução impossível. Entretanto `REQUIRE DOCUMENT` é uso/requisito e não declaração ENTITY/TYPE/SMSCI, enquanto outros produtos recebem ENTITY específica. Um LLM pode associar pela descrição, mas não há transformação explícita. NÃO relatar ausência de todos os ATTRIBUTE em 01_entities: Pipeline declara atributos comuns e isso é fonte válida.

## CV-06 — Revisão independente: índice e ordem das tabelas incompatíveis

Severidade MEDIUM; arquitetura/execução; revisão independente SURVIVED. Build real compilado a partir do SHA baseline em `/tmp/astra-coverage-release-5.4.0` produz: posição2 T1_DRT_SIGNED,3 T4_DRT_SIGNED,4 T1_DRT_REGISTERED,5 T4_DRT_REGISTERED,6 T1_DRT_PROFESSIONAL_REGULARITY,7 T4_DRT_PROFESSIONAL_REGULARITY; T1 permanece até posição15.

Autoridades em conflito no mesmo escopo: builder:131–145 agrupa por Requirement; Pipeline:471–492 copia blocos/ordem literal e rejeita alteração; Pipeline:528 manda executar plano congelado; Pipeline:532 manda completar todo T1 antes de iniciar T4. Contraexemplo mínimo são dois Requirements mistos aplicáveis (SIGNED e REGISTERED).

Refutação: mudar ordem de Requirements não resolve — qualquer grupo misto executado primeiro põe seu T4 antes do T1 do segundo. Filtrar T4 por contexto também não é declarado: os três Criteria T4 compartilhados usam EACH_REQUIRED_TECHNICAL_RESPONSIBILITY, sem APPLIES_TO que os exclua. Reordenar só no executor viola ordem congelada. Sem falso resultado demonstrado, MEDIUM é suficiente; não inflacionar HIGH.

## Release e reprodutibilidade

Build real: `python tools/build_knowledge_base_release.py /tmp/astra-coverage-release-5.4.0`, passou com worktree limpo. Dez arquivos, índices completos 30/36 e SOURCE_COMMIT exato. Pacote local `/home/cbmsc/especialistaSSCI-releases/SSCI-HABITESE-5.4.0`: dez hashes idênticos ao build. Os pacotes locais 5.1,5.2,5.3 têm respectivamente commits 391ed7e,dd8c261,9179874, coerentes com suas identidades. Tag v5.3.0 é anotada: objeto 87c4cdb descasca para 9179874; não confundir objeto tag com commit divergente. Não há pacotes versionados dentro do repositório. Releases locais são evidência auxiliar, não conteúdo do baseline.

Hipótese 'release 5.4 local com conteúdo antigo': REFUTADA para os dez arquivos observados. A presença de arquivos iguais entre versões decorre de documentos não alterados; versões individuais no manifesto observadas são coerentes. Cabeçalhos legados `00_engine.dsl`, `05_nonconformities.dsl`, `BASECONHECIMENTO_V4` não são caminhos de carregamento ativos e não constituem referência quebrada operacional demonstrada. Falta de hashes no manifesto, por si só, não foi elevada a achado.

Quinze PDFs locais em audit-cases/ (cinco etc10, dez renata) estão ignorados por `.gitignore:19`, confirmado por `git check-ignore -v`; nenhum pertence ao Git. Suíte contém teste versionado `tests/test_applicability_resolution.py:754–795` com fixtures textuais mínimas ETC-10/Renata (data e IEL), logo não é correto dizer que casos não têm nenhuma cobertura. Porém essa fixture não cobre extração PDF, assinaturas, documentos complementares e anexos reais. Risco de reprodutibilidade INFO: outra máquina roda suíte e matrizes baseline, mas não repete os casos reais sem esses 15 PDFs; preservar proveniência/separação é necessário. Não demonstrado ocultamento de defeito conhecido ou teste dependente de ignorados.

Limitação normativa: quatro PDFs versionados são IN01, IN19, DTZ26 e IRV. Sources IN07, IN08, IN09, IN10, IN12, IN15, IN18, IN34 e CONFEA_CREA não têm primária dedicada no snapshot; IRV permite cotejo operacional, não substitui reconstrução normativa integral das INs. Coluna primary_source_versioned explicita esse limite.

## Reprodução e integridade

Script `/tmp/astra-coverage-audit.py` lê os arquivos versionados, conta só definições no arquivo dono (não referências nem rótulos), gera CSVs/hashes. Build em /tmp é o único produto executado nesta trilha. Não foi invocado Gem nem conexão externa; não foi alegado resultado normativo dinâmico. Auditor-chefe realizará gate global final. Todos os achados são candidatos para reconciliação; nenhum foi corrigido.
