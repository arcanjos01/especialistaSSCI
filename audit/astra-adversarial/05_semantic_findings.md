# Semantic Findings

Baseline exclusivo: `9d2e7f175507a4e81e3ed80d7ef57e89d73124d1`. Investigação: 09–10/09/2026.

As verificações Python são infraestrutura de referência. Não se transferem suas limitações automaticamente para o Gem.

## AS-008 — Validação de assinatura pode impedir teste de documento ausente

**Severidade:** MEDIUM

**Tipos:** execution;state-semantics;false-negative

**Confiança:** confirmed

**Revisão independente:** survived — engine_tests / Epicurus; árbitro principal

**Local:** knowledge-base/00_engine.txt:269; knowledge-base/00_engine.txt:334; knowledge-base/02_requirements.txt:141

**Fonte de autoridade:** IRV p7 SHP; T4_IN07_COMMISSIONING; Engine regra SIGNED

**Descrição/evidência:** Requirement SHP valida SIGNED antes de ASSERT EXISTS. Contrato assinatura retorna MR se não identificável; Engine não executa ASSERT após MR.

**Contraexemplo/reprodução:** Transcrever sequência VALIDATE SIGNED→MR→ASSERT bloqueado para SHP ausente; evidence/astra-engine-findings.md E7.

**Esperado:** Distinguir produto comprovadamente ausente de documento presente com assinatura não verificável, respeitando Criterion de existência.

**Observado:** Na leitura literal, relatório ABSENT leva a MR em SIGNED e impede EXISTS/NC_T4_001.

**Impacto operacional:** Possível redução de ausência documental obrigatória a revisão, em vários produtos. Contraexemplo formal; não teste ponta a ponta do Gem.

**Camada responsável:** Contrato VALIDATE / ASSERT

**Tentativa de refutação:** Pré-condição de existência no predicate ou UNKNOWN especial não está declarada. MR para documento presente ilegível é legítimo. Não alegar que todos os caminhos do Gem necessariamente falham.

**Correção mínima provável — não realizada:** Definir localmente precedência/pré-condição entre existência e assinatura, sem converter toda assinatura ausente em FAIL.

## AS-011 — Registry rejeita NOT_APPLICABLE expressamente permitido por predicate

**Severidade:** MEDIUM

**Tipos:** architecture;state-semantics

**Confiança:** confirmed

**Revisão independente:** not-required — auditor-chefe

**Local:** engine/criterion_ir.py:221; tests/test_engine_infrastructure.py:156

**Fonte de autoridade:** Documento10 §20.5; 00_engine RESPONSIBILITY_RT_MATCHES_PRODUCT

**Descrição/evidência:** PredicateContract com allowed_results={NOT_APPLICABLE} lança EngineContractError; Documento10 permite esse contrato e Engine declara função que o retorna.

**Contraexemplo/reprodução:** evidence/astra-engine-probes.py explicit_na_contract.

**Esperado:** Representar contratos de predicate autorizados pelas fontes.

**Observado:** Construção rejeitada antes de avaliar predicate.

**Impacto operacional:** Limita equivalência da infraestrutura e futura representação dos Criteria; sem falha atual do Gem comprovada.

**Camada responsável:** Python de referência

**Tentativa de refutação:** Mover NA para applicability poderia ser decisão futura, mas não implementa o contrato atualmente permitido; piloto regularidade não usa NA.

**Correção mínima provável — não realizada:** Conciliar o contrato suportado com fontes e ajustar teste que cristaliza a proibição, somente após decisão.

## AS-012 — Registro de avaliação não inclui todas as leituras e consequência declarada

**Severidade:** MEDIUM

**Tipos:** traceability;execution

**Confiança:** confirmed

**Revisão independente:** not-required — auditor-chefe

**Local:** engine/criterion_ir.py:199; engine/criterion_ir.py:374; engine/criterion_ir.py:322

**Fonte de autoridade:** Documento10 §20.7; 00_engine EVIDENCE AND TRACEABILITY

**Descrição/evidência:** Resolver piloto lê RTR e D1; trace registra só RTR. Interface resolver retorna estado, sem refs; CriterionEvaluation não inclui nonconformity_on_false.

**Contraexemplo/reprodução:** evidence/astra-engine-probes.py pilot_cardinality e false_without_evidence_or_nc.

**Esperado:** Encadear evidências consultadas e consequência associada quando declarada.

**Observado:** FALSE de DRT SC/IRREGULAR sai com referência ao argumento RTR, sem D1 consultado nem NC no objeto devolvido.

**Impacto operacional:** Rastreabilidade direta incompleta na referência; reconstrução depende de preservar PM, IR e implementação.

**Camada responsável:** Python de referência

**Tentativa de refutação:** D1 pode ser reconstruído indiretamente via RTR, e NC via IR original. Não é perda total nem prova de fabricação; nenhum renderizador operacional usa esse output automaticamente.

**Correção mínima provável — não realizada:** Preservar referências efetivamente consultadas e associação declarada no resultado quando a infraestrutura evoluir; sem interpretar domínio no núcleo.

## AS-013 — Congelamento superficial aceita aliases mutáveis em contratos/trace

**Severidade:** LOW

**Tipos:** traceability;maintainability

**Confiança:** confirmed

**Revisão independente:** not-required — auditor-chefe

**Local:** engine/criterion_ir.py:213; engine/criterion_ir.py:310; engine/criterion_ir.py:350

**Fonte de autoridade:** Documento10 contrato Registry estático e rastreabilidade; invariantes imutabilidade

**Descrição/evidência:** allowed_results aceita set mutável apesar da anotação frozenset; argumentos ANY aninhados sofrem apenas cópia externa e podem alterar trace depois da avaliação.

**Contraexemplo/reprodução:** evidence/astra-engine-probes.py allowed_result_contract_mutated_after_registry e trace_arguments_after_caller_mutation.

**Esperado:** Contratos e registros fixados sem mudanças indiretas pelo chamador.

**Observado:** Adicionar FALSE ao set após Registry muda permissões; lista aninhada alterada muda trace existente.

**Impacto operacional:** Fragilidade delimitada de API experimental; piloto usa TypedReference imutável e não demonstra esse caminho em operação.

**Camada responsável:** Python de referência

**Tentativa de refutação:** Caller tipado deveria usar frozenset; ciclo de vida mutável do resolver é explicitamente permitido. Não foi usado acesso privado para alegar corrupção da PM.

**Correção mínima provável — não realizada:** Validar/copiar tipos imutáveis na fronteira pública necessária; priorizar somente se houver uso real desses argumentos.

## AS-014 — Pluralidade de DRTs causa MR antes de verificar fatos

**Severidade:** MEDIUM

**Tipos:** execution;state-semantics;testing

**Confiança:** confirmed

**Revisão independente:** not-required — auditor-chefe

**Local:** engine/cbmsc_predicates.py:60

**Fonte de autoridade:** 00_engine regularidade profissional; Requirements por responsabilidade

**Descrição/evidência:** len(drt_evidence)!=1 retorna MR. Uma D1 irregular produz FALSE; a mesma D1 duplicada produz MR. Duas evidências distintas também não são lidas.

**Contraexemplo/reprodução:** evidence/astra-engine-probes.py pilot_cardinality.

**Esperado:** Preservar análise dos fatos presentes segundo regra explícita de cardinalidade/duplicidade.

**Observado:** Resultado depende da contagem de referências, com interrupção prévia à verificação das DRTs.

**Impacto operacional:** Limite do piloto para evidências complementares/duplicadas; não afirmar falso negativo operacional nem impor agregação normativa não declarada.

**Camada responsável:** Python de referência / piloto

**Tentativa de refutação:** A Base não fecha a agregação para múltiplas DRTs; isso impede exigir FALSE para qualquer coleção, mas não torna o gatilho cardinalidade uma regra catalográfica autorizada.

**Correção mínima provável — não realizada:** Formalizar tratamento de duplicidade e múltiplas evidências no domínio antes de ampliar piloto.

## Hipótese enfraquecida: VALIDATE sobrescrever FALSE

A leitura sequencial de 00_engine:313-328 permite FALSE→MR e MR→UNKNOWN; a leitura cumulativa de ANY VALIDATION preserva a prioridade de FALSE. Como existe interpretação alternativa autorizável, não se registrou defeito grave incondicional. O problema residual é ambiguidade a ser considerado ao tratar AS-008/004, sem achado duplicado. Probes estão explicitamente rotulados como transcrição de uma leitura, não interpretador operacional.

## Limites não confundidos com defeitos

ALL vazio/ FOR_EACH vazio retornam TRUE; OR vazio FALSE. Não se inventou obrigação sobre vazio sem regra documental. Exists verifica presença de TypedReference: isso não é validação semântica do documento. FOR_EACH recebe expressões expandidas; ausência de expansão interna é declarada e não prova omissão. CNPJ diferente isoladamente e RT solicitante distinto seguem regras expressas; não foram substituídos por pressupostos externos. DRT de Projeto versus Execução e escopos parciais requerem os contratos de domínio/catalográficos que AS-002/009 identificam como incompletos.
