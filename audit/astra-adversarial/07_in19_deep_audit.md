# In19 Deep Audit

Baseline exclusivo: `9d2e7f175507a4e81e3ed80d7ef57e89d73124d1`. Investigação: 09–10/09/2026.

## Reconstrução independente

Ordem seguida: IN19 e contexto IRV/DTZ26; obrigações esperadas; matriz; Base/seleção; Pipeline/Engine; testes existentes. Página4 IN19 e página9 IRV foram renderizadas e visualmente conferidas. Nenhum teste foi usado como fonte normativa.

| Fonte/condição | Obrigação/limite esperado | Cadeia atual | Comportamento declarado |
|---|---|---|---|
| Art18 caput I | DRT execução instalação elétrica baixa tensão | REQ_IN19_EXECUTION / T4_IN19_EXECUTION / NC_T4_012 | EXISTS LOW_VOLTAGE_EXECUTION_DRT |
| Art18 caput II | DRT execução aterramento | REQ_IN19_GROUNDING / T4_IN19_GROUNDING / NC_T4_013 | EXISTS GROUNDING_EXECUTION_DRT |
| Art18 caput III | DRT verificação final | REQ_IN19_FINAL_VERIFICATION / T4_IN19_FINAL_VERIFICATION / NC_T4_014 | EXISTS + VALIDATE atividade |
| Art18 parágrafo único | Para imóveis concluídos até publicação, substituição por execução OU manutenção≤5anos OU reforma≤10anos | REQ_IN19_LEGACY_DOCUMENTATION / T4_IN19_LEGACY_DOCUMENTATION | Base aceita execução ou MR; manutenção/reforma encaminhadas à revisão |
| Data/alcance insuficientes | Preservar insuficiência sem inventar marco | REQ_IN19_REGIME_REVIEW / T4_IN19_REGIME_REVIEW | Somente MR; data solicitação é o marco errado de seleção automática |
| IEL não consta | Ausência no comprovante não é dispensa normativa automática | REQ_IN19_APPLICABILITY_REVIEW / T4_IN19_APPLICABILITY_REVIEW | Somente revisão de aplicabilidade |

## AS-001 — Regime IN19 usa solicitação no lugar de conclusão do imóvel

**Severidade:** HIGH

**Tipos:** normative;applicability;false-positive

**Confiança:** confirmed

**Revisão independente:** survived — engine_tests / Epicurus; árbitro principal

**Local:** knowledge-base/02a_applicability.txt:194; knowledge-base/01_entities.txt:505; knowledge-base/02_requirements.txt:336

**Fonte de autoridade:** references/in19.pdf p4 art18; references/irv habitese.pdf p9; references/dtz26.pdf arts51/58

**Descrição/evidência:** IN19 art18 admite substituição para imóveis concluídos até a publicação. 02a usa exclusivamente REQUEST_DATE e proíbe conclusion date. IRV p9 também descreve imóveis concluídos, não data de solicitação.

**Contraexemplo/reprodução:** evidence/astra-normative-probes.py, caso IN19-OLD-NEW-REQUEST; art18 p4; entrada IEL positivo, conclusão2020, solicitação2026, manutenção2025 e demais condições satisfeitas.

**Esperado:** Preservar a possibilidade de documentação substitutiva quando o imóvel comprovadamente satisfaz o marco normativo.

**Observado:** No modelo da Base, imóvel concluído em 2020, solicitado em 2026, entra em CURRENT e perde REQ_IN19_LEGACY_DOCUMENTATION.

**Impacto operacional:** Ampliação indevida das exigências: uma DRT de manutenção de 2025 pode satisfazer a alternativa, mas o plano pede execução, aterramento e verificação final. A seleção indevida é comprovada; não foi observado relatório real do Gem.

**Camada responsável:** Base / IN19

**Tentativa de refutação:** DTZ26 regula procedimento/IRV, não troca o marco temporal. Nome do campo e autorização histórica de implementação não provam equivalência normativa. Não se assume que vigência e publicação tenham necessariamente a mesma data; o exemplo com anos distantes não depende disso.

**Correção mínima provável — não realizada:** Decidir o marco e evidências autorizadas com fundamento normativo; ajustar somente seleção do regime, representação factual necessária e testes independentes de conclusão versus solicitação.

## Contraexemplos e fronteiras

[Sete casos reproduzíveis](evidence/astra-normative-probes.json): imóvel antigo com solicitação nova; CURRENT sem DRT; LEGACY sem DRT; LEGACY com execução; UNRESOLVED; IEL ausente; controle IN10. Cada regime IN19 tem caso adversarial. Em CURRENT sem documentos, os Criteria de execução/aterramento têm EXISTS com FAIL declarado; a aplicação integral das validações gerais permanece dependente de contratos. Não foram preenchidas saídas do Gem por simulação.

LEGACY executa EXISTS(execução) OR MANUAL_REVIEW: execução identificada retorna PASS no helper; ausência, manutenção ou reforma sem execução retornam MR. Não há FAIL/NC nesse Criterion. Isso limita automação, mas a revisão humana explícita não é, por si só, erro normativo ou falso negativo. Não criamos consequência ausente para preencher a tabela.

Fronteiras do modelo atual: 23/04/2024 e24/04/2024→LEGACY;25/04/2024→CURRENT; data inválida/ausente→UNRESOLVED. Isso verifica a implementação da regra existente, não valida a regra como normativa. A igualdade exata entre data de publicação e vigência não foi presumida como evidência independente.

A IRV p9 prevê documentação substitutiva para imóveis já concluídos; a IN19 p4 explicita conclusão até publicação. DTZ26 arts51/58 não autoriza usar solicitação como conclusão. A simplificação temporal não é corrigida pela apresentação da causa no relatório, que não pode reinterpretar seleção.

Art17 (nota no PPCI), art19 (manutenção periódica em funcionamento) e art20 (inspeção requisitada em situações de risco) foram lidos e delimitados. Não foram convertidos automaticamente em Requirements gerais de Habite-se. Não houve atualização de norma externa.
