# Release Integrity

Baseline exclusivo: `9d2e7f175507a4e81e3ed80d7ef57e89d73124d1`. Investigação: 09–10/09/2026.

O builder foi executado com worktree limpo para `/tmp/astra-coverage-release-5.4.0`. Produziu os dez documentos, SOURCE_COMMIT completo do SHA auditado e índice com30 Requirements / 36 Criteria. O conjunto local `/home/cbmsc/especialistaSSCI-releases/SSCI-HABITESE-5.4.0` tem **10/10 arquivos byte a byte idênticos** ao build observado.

[Comparação de hashes de quatro releases locais](evidence/astra-coverage-local-release-comparison.csv). Releases 5.1/5.2/5.3 apontam seus commits históricos, não fingem 5.4. A tag anotada v5.3.0 descasca para 9179874; objeto de tag não é SHA de commit. Nenhuma release remota foi consultada ou alterada.

O manifesto fonte usa RELEASE_BUILD_REQUIRED de maneira intencional: arquivos knowledge-base são templates e não pacote de implantação. Por isso o placeholder no repositório não é sozinho defeito. O pacote construído substitui o placeholder e declara versões por documento. Cabeçalhos legados .dsl/V4 não foram tratados como caminhos carregados ou hash quebrado sem evidência.

A hipótese de pacote local5.4 antigo foi refutada no conjunto observado. Isso não atesta que o usuário carregou esses mesmos bytes no Gem. A identidade em uso no ambiente operacional não foi observada; o protocolo11 requer registrá-la.

Lacunas semânticas passam pelo empacotamento: catálogo ausente (AS-002), referência NC inexistente (AS-006) e ordem de índice conflitante (AS-005). Build bem-sucedido garante parte da estrutura, não correção normativa. Testes de duplicação de Requirement/Criterion no builder rejeitaram os casos criados; shadowing do Registry Python nos mutantes é questão distinta.

Quinze PDFs ignorados e pacotes em diretório vizinho são auxiliares locais. Nenhuma evidência auxiliar foi promovida a conteúdo canônico do SHA. A auditoria não modifica .gitignore nem exige versionar casos reais; fixtures sintéticas podem preservar cenários relevantes sem depender dos PDFs locais.
