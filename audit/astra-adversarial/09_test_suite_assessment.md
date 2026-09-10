# Test Suite Assessment

Baseline exclusivo: `9d2e7f175507a4e81e3ed80d7ef57e89d73124d1`. Investigação: 09–10/09/2026.

## AS-015 — Suíte verde não detecta cinco mutações materiais e guardas incompletos

**Severidade:** MEDIUM

**Tipos:** testing;traceability;completeness

**Confiança:** confirmed

**Revisão independente:** not-required — auditor-chefe

**Local:** tests/test_engine_infrastructure.py; tests/test_applicability_resolution.py:67; tests/test_execution_pipeline_minimal_guard.py:38

**Fonte de autoridade:** Contratos de ordem/imutabilidade/estados; protocolo adversarial do usuário

**Descrição/evidência:** 8 mutações isoladas: 5 sobrevivem à suíte inteira. Helpers aceitam plano invertido, proveniência vazia e REQUEST_IDENTIFIER=None como vínculo forte.

**Contraexemplo/reprodução:** evidence/astra-engine-mutations.py e .json; evidence/astra-pipeline-probes.py.

**Esperado:** Detectar regressões que violem propriedades que os testes pretendem representar.

**Observado:** 120 testes continuam verdes ao remover deepcopy, liberar shadowing, trocar FOR_EACH por OR ou UNKNOWN por FALSE em ALL.

**Impacto operacional:** Confiança excessiva na validação local; testes IN19 ainda compartilham premissa temporal da implementação.

**Camada responsável:** testes de referência

**Tentativa de refutação:** Helpers são modelos pequenos, não Gem. Mutações não são defeitos presentes no baseline; são demonstrações de falta de cobertura. 37,5% é apenas taxa da amostra dirigida, não score global.

**Correção mínima provável — não realizada:** Adicionar negativos independentes para comportamento afetado, fontes normativas como oráculo e casos representativos; não duplicar implementação em asserts.

## Resultados executados e alcance

Rodada original: 120 testes,120 aprovados,0 falhos,0 erros,0 pulados;0,033s no runner/0,133s de parede. A repetição final obrigatória consta no manifest. Não foram instaladas dependências nem editados testes do produto.

Probes adicionais verificaram168 combinações não vazias ALL/OR com1–3 estados e suas permutações/duplicações, de acordo com precedência do Documento10. Também avaliaram coleções vazias, imutabilidade pública da PM, pluralidade DRT, contrato NA e rastreabilidade.

| Mutação em cópia /tmp | Resultado pela suíte | Segundos |
|---|---|---|
| drop_trace_memory_references | KILLED | 0.127 |
| memory_no_constructor_deepcopy | SURVIVED | 0.11 |
| memory_no_read_deepcopy | SURVIVED | 0.11 |
| registry_allow_duplicate_shadowing | SURVIVED | 0.111 |
| ignore_applicability | KILLED | 0.109 |
| forall_becomes_or | SURVIVED | 0.112 |
| unknown_in_all_becomes_false | SURVIVED | 0.111 |
| skip_predicate_arg_validation | KILLED | 0.111 |

As mutações são não equivalentes e foram aplicadas uma de cada vez em cópia isolada. O JSON registra alvo e texto antes/depois; logs preservam a suíte de cada mutante. Todas foram retiradas da cópia após execução, e o produto nunca recebeu mutação. Não extrapolar3/8 para score de qualidade global.

Teste FOR_EACH só TRUE+TRUE não distingue OR. UNKNOWN em ALL dominado por outro estado não cobre UNKNOWN isolado. Remoção da guarda applicability morreu por contagem de trace, não por demonstração de negativos. Teste que proíbe predicate NA consolida divergência com Documento10; teste de data IN19 consolida a premissa de solicitação. Esses são exemplos concretos de testes verdes que não validam fonte ou fronteira.

Os casos reais ignorados não são carregados automaticamente pela suíte. Há fixtures textuais mínimas ETC10/Renata versionadas; extração PDF, assinatura e combinação dos anexos não são cobertas por elas. Testes externos e oráculos independentes estão em11.
