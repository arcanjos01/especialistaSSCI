# Baseline And Inventory

Baseline exclusivo: `9d2e7f175507a4e81e3ed80d7ef57e89d73124d1`. Investigação: 09–10/09/2026.

HEAD e origin/main observados: `9d2e7f175507a4e81e3ed80d7ef57e89d73124d1`. Branch: `audit/astra-adversarial-2026-09-09`. Worktree limpo nas confirmações anteriores à escrita dos artefatos. Não houve pull/reset/rebase/merge/checkout/cherry-pick ou atualização de dependências/normas.

Inventário: 31 arquivos rastreados; 10 documentos da Base, 4 de arquitetura, 4 PDFs normativos, 6 arquivos de testes, 3 arquivos do pacote engine, 1 builder e 3 da raiz. [Inventário com tamanho/SHA256](evidence/astra-coverage-tracked-inventory.csv).

Definições: 30 Requirements, 36 Criteria, 32 Nonconformities, 84 entidades. Sete IDs catalográficos usados e nenhum registro oficial encontrado no Anexo. Contagem considera declaração no arquivo responsável, não referências repetidas. [Resumo mecânico](evidence/astra-coverage-summary.json).

Domínios realmente modelados: DRT e relatório gerais T1; SHP/IN07; gás/IN08; pressurização/IN09; controle de fumaça/IN10; SDAI/IN12 derivado de AI ou DAI; sprinkler/IN15; CMAR/IN18; IEL/IN19; quatro escopos M5/IN34 sem derivação produtiva. Há 28 códigos oficiais no catálogo, o que não implica 28 domínios integralmente modelados.

Arquivos ignorados: `audit-cases/` por `.gitignore:19`, além de caches Python. Quinze PDFs em dois casos auxiliares; nenhum versionado. As fixtures textuais mínimas ETC10/Renata já existem nos testes, portanto não se presume ocultamento de casos. [Inventário auxiliar](evidence/astra-coverage-local-case-inventory.csv) e [diagnóstico textual](evidence/astra-local-cases-diagnostic.json).

Os PDFs auxiliares foram extraídos somente em /tmp. Identificou-se comprovante com IEL/AI e outro com IGC; uma ART contém atividades de Projeto e outra Projeto/Execução em múltiplos sistemas. Esses fatos servem para escolher cenários de teste, não para concluir conformidade dos processos. Não houve validação criptográfica das assinaturas nem análise integral desses casos no Gem.

`audit/` não é ignorado. Foi usado o diretório pedido `audit/astra-adversarial/`; não houve alteração de .gitignore nem uso do fallback astra-audit.
