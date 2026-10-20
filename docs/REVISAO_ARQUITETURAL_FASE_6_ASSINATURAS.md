# Aceitação da revisão independente — contratos da Fase 6

Data: 2026-10-20. Decisão de governança: AGENTS.md §25.2, publicada na main
em `d815ca5b3a7b5268b489ae9461ca1b2633e75a54` e incorporada nesta branch.

```text
INDEPENDENT_ARCH_REVIEW=PASS
ARCHITECTURAL_REVIEW=PASS
ARCHITECTURAL_CHECKPOINT=CONSOLIDATED
TECHNICAL_REVIEW=PASS
REVIEWER_IDENTITY=Codex/GPT-6 (identidade declarada pelo revisor Zeno)
REVIEWER_EXECUTION=01a15af4-0d90-7092-83a5-292e43abf0c3
COMPLEMENTARY_REVIEWER_IDENTITY=Codex; modelo de execução gpt-5.6-terra
COMPLEMENTARY_REVIEWER_EXECUTION=01a15af2-7ac7-79c0-83be-b4c9f5feb225
REVIEWED_BASELINE=b999a1cc18afcf469db25e9fba8724e2ca490b84
REVIEWED_CANDIDATE=5534c3f43fbaf10c75d64d3ab91c12e457073426
REVIEWED_HEAD=d4339f10a7acd3b6b0829313aadacc58acc2756b
SOL_REVIEW=PENDING_IDENTITY
PROMOTION=NOT_AUTHORIZED
PRODUCTION_RELEASE=NOT_AUTHORIZED
NORMATIVE_INSTITUTIONAL_VALIDATION=PENDING
VALIDATED_TO_ANALYZED=PENDING
CALIBRATION_GATE=BLOCKED
```

## Verificação dos requisitos da seção 25.2

| Requisito | Evidência verificada | Resultado |
|---|---|---|
| Independência | Zeno e Nietzsche/Terra são execuções filhas distintas, posteriores ao candidato, iniciadas com pedido de revisão somente leitura. Ambos declararam não ter implementado qualquer parte de 5534c3f. Os registros de execução contêm inspeções próprias; nenhum dos dois alterou o candidato. A síntese do orquestrador não é usada como autoaprovação. | PASS |
| Identidade verdadeira | Zeno declarou Codex/GPT-6; a rota solicitada/metadado de modelo é gpt-6.1-sol, mas isso não é tratado como prova de identidade efetiva Sol. Nietzsche foi executado no perfil terra_worker, modelo gpt-5.6-terra. IDs, data e escopos estão registrados neste documento. | PASS, sem atribuição a Sol |
| Objeto imutável | Baseline, candidato e HEAD completos acima; diff dos 12 arquivos examinado por divisão explícita de escopo. O complemento dirigido confirmou que d4339f1 acrescenta somente 27 linhas de checkpoint no tracker, sem remoções. | PASS |
| Exame efetivo | Inspeções diretas dos contratos, Base, fontes, documentação, runtime compilado e testes, conforme matriz abaixo; não apenas logs de PASS da implementação. | PASS |
| Evidência reprodutível | Terra executou 43 testes dos módulos alterados e a POC; Zeno não executou suítes. A execução de 148 testes, nove suítes JS, 17 guards e a comparação do build foram feitas pelo orquestrador e são identificadas separadamente. | PASS |
| Achados | Zero BLOCKER/HIGH ou inconsistências materiais abertas nos pareceres independentes. Os três achados anteriores foram verificados; OPT-001 LOW permanece rastreado abaixo. | PASS |
| Aprovação explícita e limitada | Zeno manteve PASS técnico do candidato exato para contratos/docs/metadados runtime; Terra manteve PASS no escopo de POC, testes e inventário. Os escopos complementares cobrem o diff integral. | PASS |

Motivo da substituição: a rota solicitada como Sol não entregou identidade
efetiva confirmada como Sol, conforme autoidentificação do próprio revisor.
A equivalência técnica é aceita pelo exame arquitetural concreto e verificável,
com fronteiras, fontes, segurança, limitações e achados explícitos; não é
inferida apenas do nome do modelo ou da etiqueta TECHNICAL_REVIEW=PASS.

As execuções de revisão iniciaram em 2026-10-20 às 20:15:06 UTC (Zeno) e
20:13:23 UTC (Terra). Os metadados locais identificam execuções distintas do
orquestrador `01a1554e-206c-7612-8d9f-d328a37a0dcb`. Os logs locais são
auxiliares e não são versionados; este registro preserva os IDs e as evidências
necessárias para rastrear a decisão. Não se reivindica atestação do backend do
fornecedor além dos metadados e da identidade declarada acima.

## Escopo dos pareceres independentes

| Arquivos do candidato | Exame independente |
|---|---|
| AGENTS.md; 00_engine; 06_reports; 08_execution_pipeline; 09-RDE | Zeno: diff e fronteiras canônicas, FACT ONLY, autenticação, confiança, insuficiência e decisão humana |
| Plano de Migração; ondas restantes; inventário de cobertura | Zeno: divisão gerencial 6A/6B, gates, cobertura, calibração e não antecipação de fases |
| apps-script/CompiledRuntimeContract.js | Zeno: complemento estruturado; wrapper e todas as chaves idênticos ao baseline, exceto knowledgeBase; versões conferidas nas fontes |
| tests/test_compiled_runtime_contract.py; tests/test_knowledge_base_identity.py | Terra: diffs e execução efetiva dos dois módulos, 43 testes OK |
| tools/poc_pdf_signature_byte_range.py | Terra: inspeção integral e execução local positiva/adulterada; confiança e limites explícitos |

Zeno conferiu também a exigência RT/conselho na IRV Habite-se 2024, Anexo A,
Tabela 1, página 4. A PHASE 2A apenas verifica bytes antes do fechamento da
view; recibos não alteram a RDE. Perfis indefinidos, confiança desconhecida,
recibos ausentes ou confirmação humana sem autoridade aprovada não produzem
aprovação automática. No runtime vigente SIGNED continua MANUAL_REVIEW.

## Evidências técnicas do candidato

- Terra: `PYTHONDONTWRITEBYTECODE=1 python3 -m unittest tests.test_compiled_runtime_contract tests.test_knowledge_base_identity`: 43 OK.
- Terra: `PYTHONDONTWRITEBYTECODE=1 python3 tools/poc_pdf_signature_byte_range.py`: CMS/ByteRange íntegro na fixture, certificado autoassinado não confiável e adulteração com Digest Mismatch.
- Inventário direto de Terra: 11 dependências SIGNED, 3 ASSERTs e 8 VALIDATEs.
- Orquestrador, execução anterior: 148 testes Python, nove suítes JS em Node e 17 guards PASS; sintaxe dos 12 módulos JS e Code.gs; manifest JSON PASS.
- Orquestrador: regeneração em memória byte-idêntica. SHA-256 do runtime: `d296f3dedda77689685e495fdd3cc1273818b475afcd96b7423a5e13e9353417`.
- Build anterior em worktree limpa: SOURCE_COMMIT=5534c3f43fbaf10c75d64d3ab91c12e457073426. O orquestrador comparou os dez arquivos existentes em /tmp à geração canônica; não reexecutou esse build na revisão.
- Cobertura mantida: 34 ativos, 29 produtivos, 10 integrais, um parcial, 19 pendentes integrais e cinco não selecionáveis.

Esses resultados pertencem ao candidato acima. Não demonstram execução GAS,
PAdES completo, cadeia institucional confiável, identidade profissional,
revogação, admissão automática real ou cobertura adicional de Criterion.

## Achados e continuidade

Os três achados anteriores estão encerrados tecnicamente: PHASE 8 agora
admite as duas projeções congeladas; inventário contém as 11 dependências;
fixture corrige Length e recurso de fonte. A aprovação é da arquitetura
preparatória exata, não de verificador produtivo ou de fase inteira.

OPT-001 — LOW, não bloqueante: em
`tests/test_knowledge_base_identity.py:322` no candidato, o teste fixa os onze
IDs, sem provar exaustividade para dependências futuras. Uma adição fora da
lista poderia escapar. Correção mínima: descobrir os conjuntos completos e
comparar igualdade, incluindo teste de adição sintética. Estado na aceitação
do candidato: OPEN; tratamento no próximo lote de testes, com revisão dirigida.

A consolidação deste checkpoint satisfaz o gate de revisão arquitetural do
candidato 5534c3f, conforme §25.2. Não encerra toda a Fase 6A/6B nem a revisão
final da Fase 6, não promove cobertura e não autoriza merge na main, deploy,
uso real ou promoção operacional. Mudança material posterior terá análise de
impacto e revisão própria; este PASS não é transferido automaticamente.
