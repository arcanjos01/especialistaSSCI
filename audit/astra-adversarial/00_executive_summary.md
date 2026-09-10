# Executive Summary

Baseline exclusivo: `9d2e7f175507a4e81e3ed80d7ef57e89d73124d1`. Investigação: 09–10/09/2026.

**Classificação C — fragilidades significativas que reduzem a confiança operacional.** A conclusão refere-se à especificação e à infraestrutura local deste SHA; não é medição de confiabilidade do Gem em produção nem decisão administrativa sobre processos.

Foram consolidados **17 achados: 0 CRITICAL, 3 HIGH, 12 MEDIUM e 2 LOW**. Nenhuma correção, commit, push, PR ou alteração de baseline foi realizada.

| ID | Severidade | Risco principal |
|---|---|---|
| AS-001 | HIGH | Regime IN19 usa solicitação no lugar de conclusão do imóvel |
| AS-002 | HIGH | Sete RTs usadas pela Base não têm registros no catálogo oficial |
| AS-003 | HIGH | IN10 é selecionada para CF genérico sem verificar sistema mecânico |

Os três HIGH foram revisados independentemente e submetidos a refutação. AS-001 demonstra seleção temporal incompatível com a IN19; AS-002 demonstra dependência catalográfica sem registros; AS-003 demonstra seleção IN10 sem a condição mecânica. O possível FAIL de AS-003 foi explicitamente enfraquecido: a validação de assinatura pode encaminhar MR. Não foi inventado resultado do Gem.

Metodologia: inventário e hashes dos 31 arquivos versionados; leitura das quatro fontes normativas locais conforme escopo; reconstrução IN19 antes dos testes; cruzamento de 30 Requirements, 36 Criteria, 32 NC, 84 entidades e 7 RTs; contraexemplos e ledgers; 168 combinações ALL/OR; oito mutações em cópia isolada; revisão independente e gate final.

A suíte original passou em **120/120 testes** na rodada inicial. **Cinco de oito mutações** sobreviveram: os testes não detectam todas as violações de imutabilidade, UNKNOWN, FOR_EACH e shadowing. Isso mede lacunas desta amostra de testes, não taxa de erro operacional. O resultado do gate final está em [15_audit_manifest.md](15_audit_manifest.md).

Robustez local demonstrada: composição ALL/OR conforme Documento10 nos casos executados; isolamento público da Process Memory por deepcopy; rejeição de IDs duplicados no builder; 30/30 Requirements ligados a Criteria; nenhum FAIL referencia NC inexistente; release local 5.4 com 10/10 arquivos idênticos ao build do SHA. **Ausência de defeito nessas verificações não prova cobertura normativa completa.**

Outros riscos: UNKNOWN sem saída final; ordem de execução incompatível; NC inexistente em Requirement; símbolos sem entidade; assinatura podendo bloquear teste de ausência; contratos de predicates incompletos; quatro Requirements M5 sem caminho produtivo. Detalhes em [04](04_architecture_findings.md), [05](05_semantic_findings.md), [06](06_applicability_and_states.md) e [registro CSV](13_findings_register.csv).

Falsos positivos rejeitados ou enfraquecidos: Python não é executor operacional obrigatório; falta de parser completo não é defeito por si só; MR legítimo não equivale a FAIL; duplicação de linhas IRV pode preservar causas diferentes; aliases RT não foram automaticamente tratados como novas RTs; release local antiga disfarçada de5.4 foi refutada; prompt injection não foi demonstrada; loop ANY VALIDATION tem interpretação cumulativa alternativa; ASSERT após MR não foi apresentado como resultado real do Gem.

Limitações: não houve execução no Gemini/Gem; não foram medidos omissão probabilística, OCR, assinaturas reais, resistência a injection ou renderização final. IN07/08/09/10/12/15/18/34 e CONFEA_CREA não possuem primárias dedicadas no snapshot; a IRV sustenta cotejo operacional, não validação integral dessas normas. Quinze PDFs auxiliares ignorados foram diagnosticados, sem torná-los baseline ou verdade normativa. A execução integral RDE→relatório permanece não demonstrada.

A classificação C é sustentada pelos defeitos de conhecimento e aplicabilidade confirmados, apesar das verificações locais positivas. Não foi demonstrada falha operacional sistêmica que justifique E; tampouco há evidência para A/B sem resolver os HIGH e validar externamente os cenários.

Contagem por tipo (um achado pode ter vários tipos):

| Tipo | Quantidade |
|---|---|
| applicability | 3 |
| architecture | 6 |
| completeness | 5 |
| conceptual-model | 3 |
| execution | 6 |
| extraction | 2 |
| false-negative | 1 |
| false-positive | 2 |
| maintainability | 2 |
| normative | 2 |
| report | 1 |
| state-semantics | 6 |
| testing | 2 |
| traceability | 4 |
