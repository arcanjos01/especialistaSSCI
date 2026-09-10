# Auditoria Engine / testes — notas independentes

Baseline: `9d2e7f175507a4e81e3ed80d7ef57e89d73124d1`. Repositório intacto; apenas `/tmp/astra-engine*` escrito. Engine Python é infraestrutura de referência/piloto, não executor operacional do Gem. Nenhuma inferência de resultado observado no Gem é feita.

## Evidências executadas

- Suíte original: `PYTHONDONTWRITEBYTECODE=1 python3 -m unittest discover -s tests -v`, 120 testes, todos OK, 0,033 s unittest / 0,133 s parede. Log `/tmp/astra-engine-suite.log`, métrica `/tmp/astra-engine-suite-result.json`.
- Probes independentes: `/tmp/astra-engine-probes.py`, resultados `/tmp/astra-engine-probes.json`.
- ALL/OR: 168 combinações não vazias de 1–3 estados conferidas contra oráculo de precedência explicitamente derivado do Documento 10, linhas 466–472. Todas concordaram. Permutações e duplicações abrangidas pelo produto cartesiano.
- Coleções vazias: ALL e FOR_EACH retornam TRUE; OR FALSE. Não há semântica documental específica para vazio demonstrada. Reportar fronteira não especificada, não falso positivo confirmado. FOR_EACH recebe expressões previamente expandidas e não expande coleção (criterion_ir.py classe ForEach); expansão completa permanece responsabilidade externa.
- Memória, pela API pública: deepcopy na entrada e na leitura preserva nested dict/list contra alteração do original ou do valor devolvido. Tentativas por atributos privados não usadas como prova de defeito operacional.
- Mutation testing: cópia isolada `/tmp/astra-engine-mutation-copy`, 8 mutações, rodando a suíte inteira em cada uma. Resultados exatos antes/depois/duração em `/tmp/astra-engine-mutations.json`. 3 mortos, 5 sobreviventes. Taxa desta amostra dirigida: 37,5%; não extrapolar como score global.
- Sobreviventes: retirar deepcopy entrada; retirar deepcopy saída; permitir shadowing de ID duplicado; transformar FOR_EACH em OR; transformar UNKNOWN em FALSE na composição ALL.
- Mortos: apagar referências do trace; ignorar applicability; pular validação de argumentos. Ignorar applicability morreu pela contagem de trace, não por cenário de applicability FALSE/UNKNOWN.

## E1 — MEDIUM: Python proíbe NOT_APPLICABLE mesmo quando declarado pelo contrato

Fontes: `engine/criterion_ir.py:221-224`; Documento 10 §20.5, linhas 433–435 permite NA por condição de aplicabilidade **ou predicate cujo result_contract declare**; `knowledge-base/00_engine.txt:235-236` declara NA para RESPONSIBILITY_RT_MATCHES_PRODUCT sem produto requerido.

Menor caso: construir PredicateContract com allowed_results={NOT_APPLICABLE} e resolver que devolve NA. Observado EngineContractError antes da avaliação. O motor não pode representar um contrato explicitamente admitido pelas fontes. `tests/test_engine_infrastructure.py:156-165` consolida justamente a proibição incompatível, exemplo concreto de teste verde com premissa não conciliada.

Refutação tentada: NA pode ser transferido para applicability do Criterion; isso é possibilidade futura, mas a fonte expressamente permite predicate e o motor não possui tal exceção. Não autoriza alegar que o piloto atual de regularidade profissional falha por isso: esse predicate não declara NA. Escopo: lacuna da formalização genérica, sem falha operacional Gem demonstrada.

## E2 — MEDIUM: trace não representa as evidências efetivamente consultadas pelo resolver

Fontes: Documento 10 §20.7 (linhas 494–505) exige referências das entidades/atributos/evidências consultadas e que resolver devolva referências; `engine/criterion_ir.py:199-205` resolver retorna apenas EngineResult; `:374` coleta referências nos argumentos, não nas leituras; `engine/cbmsc_predicates.py:53,80` lê RTR e DRT.

Caso real do piloto: RTR com drt_evidence=(D1,), D1 SC/IRREGULAR. Resultado FALSE, trace.memory_references contém somente RTR. D1 consultado não está no trace; NC declarada no CriterionIR tampouco é campo de CriterionEvaluation (`:322-328`).

Refutação: é possível reconstruir D1 indiretamente pelo RTR se toda memória e implementação forem preservadas. Portanto não alegar perda total de rastreabilidade ou resultado inventado. Achado limitado à violação do contrato explícito de devolver/registrar referências consultadas; trace atual é lista de argumentos, não read-set. Suíte mata remoção completa do trace, mas não verifica DRT efetivamente consultada.

## E3 — LOW/MEDIUM: imutabilidade de contratos/trace é superficial para argumentos públicos mutáveis

`PredicateContract.allowed_results` anotado frozenset (`criterion_ir.py:213`), mas construtor aceita set e preserva alias; após registrar, allowed.add(FALSE) passa a autorizar FALSE. `PredicateCall:350-352` e `TraceEntry:310-313` só copiam dict externo. Um argumento ANY contendo dict/list pode ser alterado pelo chamador depois da avaliação e modifica o trace consolidado.

Probes demonstram public aliases, sem object.__setattr__ nem acesso a _values. Refutação: callers tipados devem passar frozenset e piloto usa TypedReference imutável; nenhum caminho operacional concreto com nested ANY está demonstrado. Logo risco delimitado a robustez do contrato genérico, não corrupção corrente da PM. Registry declara explicitamente que não congela lifecycle de resolvers (`:240-242`); mutar estado interno do resolver não é por si só achado.

## E4 — MEDIUM / lacuna do piloto: várias DRTs evitam avaliação e retornam MR sem regra catalográfica de cardinalidade

`engine/cbmsc_predicates.py:60-63` retorna MR se len(evidence)!=1. Mesmo DRT SC/IRREGULAR repetida: (D1,) → FALSE; (D1,D1) → MR. (D1 irregular,D2 regular) e ordem inversa também MR, sem ler nenhuma DRT. Empty também MR.

Autoridade: 00_engine define regularidade por fatos COUNCIL_STATE e PROFESSIONAL_REGULARITY, não declara que pluralidade seja gatilho MR. Requirement `02_requirements:49-59` usa EACH_REQUIRED_TECHNICAL_RESPONSIBILITY; Criterion `03_table1:72-90` contexto por responsabilidade. AGENTS exige evidência múltipla preservada e proíbe inferência de estados.

Refutação: Base não define formalmente agregação desta função para DRTs complementares; piloto pode deliberadamente não suportar pluralidade. Isso impede afirmar que a resposta correta de toda coleção é FALSE. O fato comprovado é MR categórico para pluralidade, com perda da verificação dos fatos presentes e dependência da cardinalidade duplicada. Classificar como limite de referência, não falso negativo operacional confirmado. Caso outra UF+IRREGULAR retornar MR não foi tratado como bug: 00_engine declara MR para UF diversa e não resolve precedência de fatos conflitantes de maneira inequívoca.

## E5 — MEDIUM: ambiguidade do loop VALIDATE versus composição declarada

00_engine:313-328 está dentro de FOR EACH VALIDATE; sob leitura sequencial por validação corrente, FALSE seguido MR termina MR e MR seguido UNKNOWN termina UNKNOWN. Python ALL e Documento 10:466-472 preservam FALSE>MR>UNKNOWN. Probes contêm transcrição mínima explicitamente rotulada, não execução do pseudocódigo por interpretador do produto.

Refutação decisiva: texto diz `IF ANY VALIDATION`, que pode ser lido cumulativamente sobre todas as validações já executadas. Nessa leitura, FALSE prevalece. Portanto o achado defensável é ambiguidade contratual de agregação, e não defeito incondicional de sobrescrita. Não promover HIGH sem resolver essa interpretação pela fonte autorizada.

## E6 — MEDIUM: UNKNOWN não tem saída final contratada

Documento 10:439-444 registra explicitamente DECISÃO PENDENTE, proíbe conversão automática UNKNOWN→FAIL/MR. Engine o mantém; Pipeline `08_execution_pipeline:547-557` limita resultados a PASS/FAIL/NA/MR. Lacuna já reconhecida pela arquitetura, não nova implementação errada. Probes confirmam preservação correta em Python. Critérios que podem UNKNOWN não têm normalização final demonstrada. Não converter a lacuna em estado inventado na auditoria.

## E7 — revisão independente do bloqueio ASSERT por assinatura: conflito formal confirmado, comportamento Gem não observado

Requirement SHP `02_requirements:131-143` exige relatório e VALIDATE TECHNICAL_PRODUCT_ATTRIBUTE/SIGNED. Criterion `04_table4:74-96` ASSERT ALL EXISTS(relatório), DRT_COVERS(...), FAIL NC_T4_001. `00_engine:269-274` assinatura não identificável retorna MR; `:334-335` não executa ASSERT após MR.

Contraexemplo: SMSCI_SHP positivo, relatório comprovadamente ABSENT ao fechar extração. Sem documento, assinatura digital não pode ser identificada; leitura literal gera MR no VALIDATE e impede EXISTS de produzir FALSE/NC de documento obrigatório ausente. Fonte da obrigação reportada pelo principal: IRV p7; cadeia declarada confirmada localmente em `05_nonconformities:190-201`.

Tentativa de refutação: (a) predicate só seria chamado para produto existente — pré-condição não declarada; (b) ausência do produto devolveria UNKNOWN — não há essa exceção no contrato; (c) devolver FALSE por assinatura — explicitamente proibido quando somente assinatura não verificável. Para documento presente ilegível MR é coerente; para ABSENT comprovado há conflito com Criterion de existência. Avaliação: no mínimo MEDIUM contratual; HIGH exige destacar que é risco formal em múltiplos domínios, não execução observada. Engine Python não implementa esta função nem pipeline completo, logo não há reprodução real de ponta a ponta.

## Revisão independente HIGH IN19 — conclusão versus solicitação

Fonte primária: `references/in19.pdf`, art.18, página 4 (texto independente lido em /tmp/astra-in19.txt:156-186; render revisto visualmente pelo auditor principal). Caput pede execução, aterramento, verificação final. Parágrafo único permite substituição por uma das DRTs para **imóveis concluídos até a publicação**: execução; manutenção emitida nos últimos5 anos; reforma nos últimos10 anos.

Base: `knowledge-base/02a_applicability.txt:194-202` seleciona LEGACY/CURRENT pela REQUEST_DATE do comprovante, proíbe conclusion date; `:212-215` CURRENT seleciona somente três Requirements e LEGACY somente alternativa. Datas descrevem fatos distintos, sem implicação bidirecional.

Contraexemplo: imóvel concluído em2020; vistoria solicitada em2026; DRT de manutenção em2025; IEL positivo. Parágrafo único admite a DRT alternativa dentro5 anos; Base resolve CURRENT e cobra cadeia de execução/aterramento/verificação final. Erro começa em applicability e pode chegar às NC; não depende de parser Python nem da ordem dos arquivos.

Refutações tentadas: DTZ26 arts51/58 regulam escopo pela IRV vigente e etapas documental/SMSCI, sem substituir conclusão por protocolo. Busca em texto completo DTZ26 por IN19/data2024/conclusão não encontrou autorização específica. Commits são origem da implementação, não fonte normativa. Uma autorização do usuário para implementar REQUEST_DATE não demonstra equivalência normativa e deve ser distinguida da fidelidade à fonte; eventual documento oficial externo não fornecido é limitação, não fundamento presumido. Se invocada IRV com data de solicitação explícita, haveria conflito de fontes a registrar, não escolha automática; auditor principal deve concluir esse cotejo.

Decisão independente: candidato HIGH sobrevive como ampliação normativa demonstrada na Base contra art18. Hipóteses explícitas: data de conclusão é fato documental verificável e DRT alternativa satisfaz os demais atributos exigidos. Não alegar que DRT2025 satisfaz os três incisos; satisfaz a substituição do parágrafo único.

## Qualidade dos testes e limitações

Testes de infraestrutura comprovam dispatch, alguns contratos e precedência; não cobrem uniformemente UNKNOWN, negative applicability, cardinalidade ou deep immutability. 5 sobreviventes demonstram a lacuna com defeitos não equivalentes. `test_for_each_is_structural_all` usa só TRUE+TRUE, indistinguível de OR. UNKNOWN em ALL foi sempre acompanhado por estado dominante nos testes existentes.

Testes de applicability/plano/projeção incluem funções próprias de simulação e asserts sobre texto; verdes demonstram coerência da transcrição, não cumprimento pelo Gem. Testes IN19 que impõem somente REQUEST_DATE (`test_applicability_resolution.py:728`) compartilham a premissa divergente da fonte primária. A suíte não constitui oráculo normativo independente.

Falta executor completo RDE→PM→VALIDATE→Critérios→NC→relatório: não medir robustez operacional real por testes de referência. Assinatura/IN19 formal e múltiplas evidências não foram executados em Gemini. Não há teste live de prompt injection nesta trilha. Nenhuma correção realizada.
