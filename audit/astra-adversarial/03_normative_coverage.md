# Normative Coverage

Baseline exclusivo: `9d2e7f175507a4e81e3ed80d7ef57e89d73124d1`. Investigação:09–10/09/2026.

A matriz abaixo coteja obrigações/documentos da fonte com a Base; a [matriz completa de36 associações](evidence/astra-coverage-req-criterion-nc-rt.csv) detalha todos os IDs, artigos, RTs, estados declarados e NC. [32 NC e arestas inversas](evidence/astra-coverage-criterion-nc.csv). “Cobertura estrutural” não significa atendimento normativo integral nem resultado operacional executado.

| Obrigação ou mecanismo | Fonte local | Cadeia Base | Resultado do cotejo |
|---|---|---|---|
| T1 art108: DRT execução dos SMSCI e relatório conformidade | IN1 art108; IRV pp4–5 | REQ_T1_DRT_REQUIRED / SMSCI / CONFORMITY_REPORT | Cobertura estrutural; catálogo sem registros AS-002; não equiparar execução obra e sistema por inferência |
| T1 registro/autenticidade/assinatura | IRV p4; contratos específicos Engine | REQ_T1_DRT_REGISTERED / SIGNED / PROFESSIONAL_REGULARITY | Criteria gerais T1/T4 compartilham Requirement; MR assinatura exige distinção documental; AS-006/017 |
| T1 dados RI, RT, endereço, área e atividade | IRV pp4–5 | REQ_T1_DRT_BASIC_DATA / ACTIVITY_EXECUTION | Comparadores têm limites AS-009; identidade RT solicitante/executor não é exigência geral |
| SHP relatório comissionamento + DRT | IRV p7, cita IN7 art106 | REQ_IN07_COMMISSIONING → T4_IN07_COMMISSIONING → NC_T4_001 | Presença/cobertura; assinatura anterior pode mascarar ausência AS-008 |
| IGC laudo/ensaio estanqueidade com≤5anos + DRT | IRV p7, cita IN8 art95 | REQ_IN08_ESTANQUEIDADE → T4_IN08_ESTANQUEIDADE → NC_T4_002 | EXISTS / VALID_WITHIN_YEARS / DRT_COVERS; datas insuficientes atingem AS-004 |
| IGC manual proprietário com instruções de instalação | IRV p8, cita IN8 art80 | REQ_IN08_MANUAL → T4_IN08_MANUAL → NC_T4_003 | EXISTS declarado; suficiência do conteúdo do manual requer teste externo e semântica documental, não provada pela existência |
| Pressurização execução + vistoria/ensaio; laudo; manual; checklist | IRV p8, cita IN9 art122 | REQ_IN09_DRT / TEST_REPORT / MANUAL / CHECKLIST → NC_T4_004..007 | Quatro Criteria; HAS_DRT_ACTIVITY / REPORT_CONTAINS; símbolos sem entidade AS-007 |
| CF mecânico: comissionamento independente + DRT | IRV p9, cita IN10 art41 | REQ_IN10_COMMISSIONING → T4_IN10_COMMISSIONING → NC_T4_008 | Condição mecânica perdida AS-003 |
| AI ou DAI: relatório SDAI + DRT | IRV p9, cita IN12 art47 | REQ_IN12_COMMISSIONING → T4_IN12_COMMISSIONING → NC_T4_009 | Derivação SDAI explícita; não duplica AI/DAI no WORKLIST |
| SPK relatório comissionamento + DRT | IRV p9, cita IN15 art30 | REQ_IN15_COMMISSIONING → T4_IN15_COMMISSIONING → NC_T4_010 | Símbolo produto sem entidade AS-007; conteúdo técnico integral não validado por fonte primária dedicada |
| CMAR declaração de atendimento | IRV p9, cita IN18 art14 | REQ_IN18_CMAR → T4_IN18_CMAR → NC_T4_011 | EXISTS / assinatura; leitura apenas presença não demonstra conteúdo suficiente |
| IEL: execução, aterramento e verificação final | IN19 art18 caput; IRV p9 | REQ_IN19_EXECUTION / GROUNDING / FINAL_VERIFICATION → NC_T4_012..014 | Regime CURRENT; falha de seleção temporal AS-001 |
| IEL: alternativas imóveis concluídos até publicação | IN19 art18 parágrafo único; IRV p9 | REQ_IN19_LEGACY_DOCUMENTATION → T4_IN19_LEGACY_DOCUMENTATION | Execução ou MR; sem FAIL/NC declarada; não inventar consequência |
| IEL: incerteza de regime ou ausência no escopo registrado | Regras explícitas 02a / Requirements de revisão | REQ_IN19_REGIME_REVIEW / APPLICABILITY_REVIEW | Mecanismos de revisão, não novas obrigações documentais |
| M5: quatro DRTs específicas | IRV p10 IN34 | REQ_IN34_EXPLOSION_PROTECTION / DUST_CONTROL / HEAT_SENSORS / LIGHTNING_PROTECTION | Criteria e NC existem; derivação produtiva ausente AS-016 |

## Limites e lacunas de cobertura a decidir

A IRV T1 também contém taxa, formulário e PPCI/atestado aprovado. A Base não possui Requirements que executem PAID/APPROVED, embora extraia atributos correspondentes. É lacuna de escopo a esclarecer: parte desses itens pode depender do e-SCI ou de conferência humana anterior. Não foi demonstrado que essa plataforma recebeu responsabilidade operacional por toda essa verificação. Por isso não foi elevado a falso negativo confirmado nem criada regra. O vistoriador não deve interpretar o relatório como prova de verificação desses itens.

As tabelas físicas2/3/5–26 da IRV e artigos IN19 de PPCI/funcionamento não foram convertidos em obrigações documentais gerais. Sua ausência na Base documental não prova defeito por si só.

Primárias dedicadas de IN07/08/09/10/12/15/18/34 e CONFEA_CREA não estão no snapshot. Artigos citados foram preservados como referências da Base/IRV, mas não se confirmou integralmente texto, exceções, vigência e anexos de normas ausentes. Não se recorreu à internet nem a conhecimento externo. A matriz assinala essa limitação; não declara coverage normativa100%.

Critérios sem Requirement:0. Requirements sem Criterion:0. IDs duplicados:0. FAIL→NC inexistente:0. Isso convive com NC inexistente no Requirement AS-006, NC sem acionador AS-017, catálogo vazio AS-002 e M5 inalcançável AS-016. Contagens verdes não anulam essas lacunas.

Nenhuma DRT foi promovida a unidade normativa pela auditoria; os aliases RT foram tratados como referências ao catálogo. Relações produto/evidência/obrigação permanecem distintas, ainda que alguns vínculos atuais precisem de formalização.
