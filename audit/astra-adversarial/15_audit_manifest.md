# Audit Manifest

Baseline exclusivo: `9d2e7f175507a4e81e3ed80d7ef57e89d73124d1`. Investigação:09–10/09/2026.

## Identidade e escopo

Data: início09/09/2026; retomada/encerramento10/09/2026 (America/Sao_Paulo). Branch:`audit/astra-adversarial-2026-09-09`. HEAD e origin/main observados:`9d2e7f175507a4e81e3ed80d7ef57e89d73124d1`. Sem sincronização remota. Codex CLI observado:`codex-cli 0.153.4` (`codex --version`; o cache de versão também indica0.153.4).

Auditor-chefe solicitado: GPT-6 Astra. A auditoria não fez atestação independente do backend/modelo servido; o nome solicitado não é métrica técnica de execução. Subagentes com contexto/modelo herdados: coverage_release/Herschel (inventário/catálogo/release), engine_tests/Epicurus (contrato/testes/mutações), pipeline_projection/Hegel (sequência/projeção/revisões). Não houve delegação a terceiros externos. Sessão recuperada:`01a08744-274b-7170-84e9-7c00c63fc357`.

A interrupção por limite de uso ocorreu em09/09; evidências temporárias foram preservadas e rechecadas na retomada. A investigação encerrou antes de criar o diretório final. O sandbox inicialmente falhou ao iniciar bwrap (RTM_NEWADDR); comandos de leitura/auditoria foram executados com escalonamento aprovado. Após o gate, a revisão automática bloqueou uma ressalva editorial no protocolo por limite de uso. O usuário solicitou continuação; o ajuste foi retomado sem alteração do produto.

Destino:`audit/astra-adversarial/`, não ignorado. .gitignore permaneceu intacto. Artefatos adicionais em evidence/ sustentam16 entregáveis principais. Nenhum arquivo original modificado; gate detalhado abaixo é atualizado após a execução final.

## Comandos e evidências

Comandos efetivamente usados, agrupados por finalidade; scripts preservam inputs e operações detalhadas:

```bash
git branch --show-current
git rev-parse HEAD
git rev-parse origin/main
git status --short
git log -8 --oneline --decorate
rg --files
cat AGENTS.md
git status --ignored --short
git check-ignore -v audit/astra-adversarial/00_executive_summary.md audit-cases/etc10/CBMSC_03-08-2026_15731490.pdf
pdftotext -layout references/in19.pdf /tmp/astra-in19.txt
pdftotext -layout references/in01.pdf /tmp/astra-in01.txt
pdftotext -layout references/dtz26.pdf /tmp/astra-dtz26.txt
pdftotext -layout 'references/irv habitese.pdf' /tmp/astra-irv.txt
pdftoppm -f 4 -l 5 -scale-to 1800 -png references/in19.pdf /tmp/astra-in19
pdftoppm -f 9 -l 9 -scale-to 1800 -png 'references/irv habitese.pdf' /tmp/astra-irv-page
python3 tools/build_knowledge_base_release.py /tmp/astra-coverage-release-5.4.0
PYTHONDONTWRITEBYTECODE=1 python3 /tmp/astra-coverage-audit.py
PYTHONDONTWRITEBYTECODE=1 python3 /tmp/astra-engine-probes.py
PYTHONDONTWRITEBYTECODE=1 python3 /tmp/astra-engine-mutations.py
PYTHONDONTWRITEBYTECODE=1 python3 /tmp/astra-pipeline-probes.py
PYTHONDONTWRITEBYTECODE=1 python3 /tmp/astra-normative-probes.py
PYTHONDONTWRITEBYTECODE=1 python3 -m unittest discover -s tests -v
codex --version
git diff -- . ':!audit/astra-adversarial/**' ':!astra-audit/**'
```

Leituras adaptativas adicionais usaram cat/sed/rg nos arquivos do inventário e extrações temporárias, git show/log para histórico de release e Python para hashes/JSON/CSV. Páginas normativas renderizadas foram inspecionadas visualmente; base64 serviu apenas para leitura da imagem quando view_image falhou no sandbox. Não houve web, instalação de pacotes, alteração de norma, acesso operacional ao Gemini ou mensagem a terceiros.

Arquivos analisados e hashes: [inventário versionado](evidence/astra-coverage-tracked-inventory.csv). As quatro normas foram extraídas; a leitura normativa focalizou trechos pertinentes a documentos/escopos. A existência de uma extração integral não é alegação de validação normativa exaustiva de todos os artigos. Código, testes e contratos foram divididos entre as três trilhas; notas de revisão originais estão em evidence/.

Temporários: `/tmp/astra-audit-request.txt`; extrações `/tmp/astra-in19.txt`, `astra-in01.txt`, `astra-irv.txt`, `astra-dtz26.txt`; PNGs normativos; `/tmp/astra-local-case-01.txt` a15; scripts/JSON/CSV/logs astra-coverage,astra-engine,astra-pipeline,astra-normative; `/tmp/astra-coverage-release-5.4.0`; cópia isolada `/tmp/astra-engine-mutation-copy`; scripts de emissão/QA desta auditoria. Os temporários foram criados pela auditoria, sem editar originais. As mutações foram revertidas na cópia após cada teste.

Reprodução: executar scripts evidence/ a partir do checkout no SHA indicado; os scripts preservados usam o caminho local original e /tmp. O build relatado ocorreu antes da criação dos artefatos, com worktree limpo; não confundir a presença posterior de arquivos novos de auditoria com sujeira do produto naquele build. Outra máquina precisa ajustar ROOT e disponibilizar cópia limpa do mesmo snapshot, além dos arquivos auxiliares se quiser repetir os diagnósticos reais/release local. Não são necessários arquivos reais para rodar a suíte versionada.

## Testes e revisões

Inicial:120 testes aprovados,0 falhas/erros/pulados;0,033s runner/0,133s parede. Adicionais:168 combinações ALL/OR;7 casos normativos/seleção;5 ledgers plano;4 projeções sintéticas;2 rejeições duplicidade builder;8 mutações isoladas (3 mortas/5 sobreviventes). Não somar cenários de contagem diferente em um total artificial.

HIGH AS-001: revisão engine_tests, survived. HIGH AS-002: revisão pipeline_projection, survived. HIGH AS-003: revisão pipeline_projection, survived quanto à seleção; alegação FAIL inevitável rejeitada. Ordem AS-005 teve revisão coverage_release; assinatura AS-008 teve revisão engine_tests. Seis funções sem contrato foram rebaixadas de candidato HIGH para MEDIUM pelo árbitro, em razão de limites da evidência operacional.

## Trilhas

| Trilha | Tema | Estado | Limite/evidência |
|---|---|---|---|
| A | Cobertura normativa | Parcial | Cotejo IN19/IRV/IN1; primárias dedicadas de8 INs ausentes |
| B | Modelo conceitual | Concluída localmente | Catálogo/entidades/obrigações: AS-002/007 |
| C | EXTRACTION/RDE | Parcial | Contrato lido; extração Gem não executada |
| D | RDE×PM | Parcial | Fronteira declarada auditada; transformação operacional não observada |
| E | Applicability | Parcial | Contraexemplos seleção; comportamento Gem pendente |
| F | Engine formal | Concluída no escopo local | 168 combinações, contratos, piloto; sem executor completo |
| G | Pipeline | Parcial | Índice/ordem/cobertura locais; sequência Gem não observada |
| H | RT | Parcial | 7 referências/0 registros; piloto pluralidade; suficiência normativa aberta |
| I | Domínios/SMSCI | Parcial | Todos domínios inventariados; fontes dedicadas e execução integral faltantes |
| J | Rastreabilidade reversa | Parcial | Arestas estáticas e piloto; documento→RDE→resultado real não executado |
| K | Relatórios | Parcial | Contrato auditado; renderização Gem não executada |
| L | Projeção IRV | Parcial | Helpers e mapeamentos; dados sintéticos apenas |
| M | Testes existentes | Concluída localmente | Suíte completa +8 mutações |
| N | Metamórficos | Parcial | Estados/DRTs/plano locais; layout/nomes reais no Gem externos |
| O | Prompt injection | Não executável nesta sessão operacional | Fixtures/protocolo preparados; sem Gem atestado |
| P | Ignorados | Concluída localmente | 15 PDFs identificados/hashes/diagnóstico; fora baseline |
| Q | Robustez probabilística | Não executada | Protocolo externo18 cenários; nenhuma métrica inventada |
| R | Release | Concluída localmente | Build limpo e10/10 hashes pacote 5.4; implantação Gem não atestada |
| S | Referências cruzadas | Concluída localmente | Matrizes36 ligações/32 NC/84 entidades |
| T | Completude execução | Parcial | 5 ledgers até plano; resultados ponta a ponta nulos |
| U | Falso negativo | Parcial | Assinatura formal/piloto; sem taxa operacional |
| V | Falso positivo | Parcial | IN19/IN10 seleção confirmada; saídas Gem não medidas |
| W | Contradição documental | Parcial | Pluralidade piloto e protocolo; sem conflito real resolvido no Gem |
| IN19 | Foco especial | Concluída para comparação local; operação parcial | Fonte lida antes dos testes; revisão independente;7 casos |
| Reais | ETC10/Renata | Diagnóstico parcial | 15 extrações textuais; não homologação dos processos |


## Limitações e hipóteses abertas

- Sem execução Gem, extração/OCR/validação de assinatura real, teste de injection live, observação do modelo ativo ou renderer operacional.
- Fontes INs dedicadas ausentes e catálogo não preenchido impedem fechar integralmente certos oráculos; não foram supridos por conhecimento externo.
- Process Memory imutável de referência não prova transformação operacional RDE→PM íntegra.
- Ledgers resultados/projeção/relatório ponta a ponta permanecem não observados; projeções locais são sintéticas.
- Taxa/formulário/PPCI aprovado e conteúdo completo de manuais/relatórios têm cobertura de escopo/suficiência a decidir; não foram classificados como falsos negativos confirmados sem oráculo completo.
- Relação exata publicação/vigência IN19, possível fundamento oficial externo e configuração Gem real permanecem não atestadas.
- Nenhuma taxa de falha LLM ou resistência de segurança é inferida de testes Python. Riscos não demonstrados continuam hipóteses, mesmo quando relevantes.

## Gate final

Gate executado em 10/09/2026: **120 aprovados / 0 falhos / 0 erros / 0 pulados**, comando `PYTHONDONTWRITEBYTECODE=1 python3 -m unittest discover -s tests -v`. Duração runner: **0.043s**; parede: **0.135s**. [Log completo](evidence/final-test-suite.log), [métricas JSON](evidence/final-gate.json).

Sintaxe: 10 arquivos Python originais analisados sem erro. Hashes: **31/31 arquivos originais idênticos** ao inventário anterior à escrita; 0 divergências. Diff do produto vazio; staging vazio. A cópia temporária de mutação contém novamente o Engine original.

HEAD final:`9d2e7f175507a4e81e3ed80d7ef57e89d73124d1`. origin/main observado:`9d2e7f175507a4e81e3ed80d7ef57e89d73124d1`. `git status --short`:

```text
?? audit/
```

O único conteúdo novo é a pasta de auditoria. `git diff -- . ':!audit/astra-adversarial/**' ':!astra-audit/**'` não produziu saída. Nenhum arquivo original modificado. Nenhum commit/push/PR/merge. Dezesseis entregáveis principais e 17 IDs de achado validados; links locais dos relatórios conferidos. Inventário/hash dos próprios artefatos em [artifact_hashes.csv](evidence/artifact_hashes.csv); esse CSV é excluído do próprio hash por autorreferência.

A missão termina com a auditoria e a classificação C. O protocolo externo permanece explicitamente não executado, e o backlog não representa correções autorizadas nesta sessão.
