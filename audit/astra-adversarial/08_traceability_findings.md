# Traceability Findings

Baseline exclusivo: `9d2e7f175507a4e81e3ed80d7ef57e89d73124d1`. Investigação: 09–10/09/2026.

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

## O que foi verificado

O contrato RDE exige source_document, com página/identificador quando possível. Pipeline fase3 consome RDE imutável, permite normalização apenas em representação derivada e preserva origem. Proíbe reabertura em todas as fases posteriores e relatório. A interpretação de “encerrar EXTRACTION” como fronteira de modo é compatível com retomada EXECUTION; não foi inventado conflito apenas dessa frase.

Não existe transformador RDE→PM operacional executado localmente nesta auditoria. Assim, perda real de cardinalidade, blocos, signatários, SMSCI ou fatos em Gem não foi demonstrada. A API pública de ImmutableProcessMemory resistiu a alterações do input e do valor lido. Já argumentos/trace têm fragilidade de cópia superficial (AS-013) e helpers aceitam proveniência vazia (AS-015).

As referências Requirement→Criterion→FAIL→NC foram conferidas. Não há Criterion órfão nem FAIL com NC inexistente; há referência Requirement→NC inexistente AS-006 e NC sem FAIL AS-017. O catálogo faltante e os símbolos sem ENTITY rompem resolução de conhecimento/representação antes de medir rastreabilidade operacional.

## Projeção e relatório

Testes isolados preservam folhas distintas IN08 e causas de artigo108, sem agrupar tudo pelo mesmo item IRV. NC_T1_009 e NC_T4_019 sem projeção são destinadas ao tratamento humano mantendo FAIL; falta de mapeamento não foi denunciada como perda automática. A renderização não foi executada no Gem.

Contadores são derivados do conjunto canônico; inconsistência de contador não autoriza inventar resultado nem impedir relatório íntegro. Status COM PENDÊNCIAS/NECESSITA ANÁLISE HUMANA/SEM PENDÊNCIAS DOCUMENTAIS não é decisão administrativa. Entretanto a saída de UNKNOWN continua sem contrato fechado (AS-004).

O exemplo de DESCREVER que compara RT do processo e anexos em 06_reports:179 pode induzir confusão com a proibição de exigir identidade do solicitante e executor. Como a política só permite descrição rastreável a FAIL já declarado, o exemplo isolado não prova nova regra; registrar para revisão de texto, sem novo HIGH.
