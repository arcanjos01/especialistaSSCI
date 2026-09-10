# Applicability And States

Baseline exclusivo: `9d2e7f175507a4e81e3ed80d7ef57e89d73124d1`. Investigação: 09–10/09/2026.

## AS-003 — IN10 é selecionada para CF genérico sem verificar sistema mecânico

**Severidade:** HIGH

**Tipos:** normative;applicability;false-positive

**Confiança:** confirmed

**Revisão independente:** survived — pipeline_projection / Hegel; árbitro principal

**Local:** knowledge-base/02_requirements.txt:252; knowledge-base/04_table4.txt:262; knowledge-base/02a_applicability.txt:107

**Fonte de autoridade:** IRV Habite-se p9 Tabela4 IN10; DTZ26 arts51/58

**Descrição/evidência:** A IRV condiciona comissionamento a controle de fumaça mecânico. CF ativa SMSCI_SMOKE_CONTROL; Requirement/ Criterion usam esse alvo genérico. SMSCI_SMOKE_CONTROL_MECHANICAL existe, mas não guarda o requisito.

**Contraexemplo/reprodução:** evidence/astra-normative-probes.py caso IN10-NATURAL; fonte visual IRV p9.

**Esperado:** Selecionar a obrigação de comissionamento observando a condição mecânica declarada pela IRV.

**Observado:** Comprovante CF de instalação natural seleciona REQ_IN10_COMMISSIONING no modelo local.

**Impacto operacional:** Aplicabilidade ampliada pode produzir exigência ou revisão humana indevida. HIGH refere-se à seleção normativa incorreta com impacto relevante; FAIL automático no Gem não está demonstrado.

**Camada responsável:** Base / IN10

**Tentativa de refutação:** CF não foi definido como sinônimo de mecânico. A causa NC mencionar mecânico não permite ao relatório refazer aplicabilidade. VALIDATE SIGNED pode retornar MR antes de EXISTS: refuta-se FAIL inevitável, não o defeito de seleção.

**Correção mínima provável — não realizada:** Formalizar, na camada de aplicabilidade da Base, a condição mecânica e a evidência autorizada; preservar insuficiência quando não verificável.

## Fronteiras preservadas ou não demonstradas

Seleção exige um comprovante corrente e identificadores fortes comparáveis; processo sozinho não seleciona retorno. Seção ausente/incompleta/ilegível/inverificável, código desconhecido ou conflito bloqueiam antes do Engine. Ausência de código só é negativa depois de comprovar seção completa. Alias, texto RPCI e documentos de evidência não ativam SMSCI. Os testes existentes cobrem parte desses casos; helpers têm lacunas AS-015.

AI ou DAI deriva SDAI, preservando códigos oficiais separados. WORKLIST de T1_DRT_SMSCI_COVERAGE inclui somente alvos oficiais positivos, evitando duplicação pela derivação SDAI. A ausência de IEL deriva somente revisão IN19; não dispensa IN19 nem cria IEL. Não se converte ARCHITECTURAL_BLOCKER em MR.

Tabela de estados e decisões:

| Categoria | Papel | Ressalva |
|---|---|---|
| PRESENT/ABSENT/INCOMPLETE/UNVERIFIABLE | Estados documentais antes da execução | RDE não contém conformidade |
| TRUE/FALSE/UNKNOWN | Estados internos Engine | UNKNOWN não é FAIL/MR: AS-004 |
| NOT_APPLICABLE | Aplicabilidade ou predicate com contrato expresso | Python rejeita segunda possibilidade: AS-011 |
| MANUAL_REVIEW | Consequência/estado explicitamente declarado | Não é fato documental: AS-010 |
| CURRENT/LEGACY/UNRESOLVED | Seletor interno de regime IN19 | Não são SMSCI nem resultados |
| ARCHITECTURAL_BLOCKER | Interrupção pré-Engine | Não é output de Criterion |
| EXECUTION_INTEGRITY_ERROR | Falha interna plano/resultados | Não é NC nem pendência |
| REPORT_COUNTER_INCONSISTENCY | Diagnóstico de contador | Não altera resultados |

Cobertura Base→plano: [cinco ledgers](evidence/astra-pipeline-ledgers.json). Contagens: mínimo10Req/16unidades; gás+AI+IEL CURRENT15/21; todos oficiais CURRENT23/29; IEL LEGACY10/16; IEL UNRESOLVED10/16. Os quatro Requirements M5 não são selecionáveis: AS-016. A expectativa desses ledgers é derivada da Base, não oráculo normativo.

EXECUTED_CRITERIA/RESULTS/PROJECTED_RESULTS/REPORTED_RESULTS dos ledgers ponta a ponta permanecem nulos, com motivo explícito: não houve execução real no Gem. Projeções auxiliares têm entradas FAIL sintéticas e estão rotuladas como testes isolados.
