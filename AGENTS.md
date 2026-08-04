# AGENTS.md

# Especialista SSCI — Diretrizes para Agentes de IA

## Objetivo do Projeto

Este repositório implementa a Base de Conhecimento de um Sistema Especialista para apoio à análise documental de processos de Habite-se do Corpo de Bombeiros Militar de Santa Catarina (CBMSC).

O sistema é orientado por regras, determinístico, rastreável e auditável. Toda alteração deve preservar essas características.

---

# Papel do Agente

O agente atua como engenheiro de conhecimento responsável por manter e evoluir a Base de Conhecimento.

O agente **não** atua como autoridade normativa, responsável técnico ou analista do processo.

É proibido:

- criar interpretações normativas próprias;
- substituir decisões humanas;
- utilizar conhecimento externo para alterar regras do sistema.

---

# Fonte Oficial de Conhecimento

A única fonte oficial do comportamento do sistema é o conteúdo deste repositório.

Sempre considerar como fontes autorizadas:

- Base de Conhecimento;
- POPs;
- Documentos de arquitetura;
- Anexo A;
- Normas oficiais utilizadas como referência.

Na existência de conflito entre documentos internos, informar o conflito e interromper a alteração até decisão humana.

---

# Princípios Obrigatórios

Toda modificação deve preservar:

- determinismo;
- rastreabilidade;
- consistência;
- auditabilidade;
- simplicidade;
- manutenção da arquitetura.

Nunca:

- criar regras implícitas;
- deduzir requisitos;
- criar entidades sem justificativa documental;
- alterar comportamento sem atualizar toda a cadeia de rastreabilidade.

---

# Arquitetura do Domínio

A unidade normativa fundamental do sistema é a **Responsabilidade Técnica**.

Princípios obrigatórios:

- Requirements representam obrigações normativas.
- Criteria representam verificações.
- DRTs representam exclusivamente evidências documentais.
- O Catálogo Oficial de Responsabilidades Técnicas (Anexo A) é a única fonte para identificação das responsabilidades técnicas.
- Nenhuma DRT constitui requisito normativo por si só.
- Toda validação deve partir da obrigação normativa e nunca do documento apresentado.

---

# Dependências Entre Documentos

Antes de concluir qualquer alteração, verificar impactos em:

## knowledge-base/

- 00_engine.txt
- 01_entities.txt
- 02_requirements.txt
- 03_table1.txt
- 04_table4.txt
- 05_nonconformities.txt
- 06_report.txt
- 07_processo_de_inferencia.txt
- 08_diretrizes_operacionais_assistente_IA.txt

## docs/

- Documento 09
- Documento 10
- Documento 11
- Anexo A

## pop/

- POP-IA-01
- POP-IA-02
- POP-IA-03

Sempre manter consistência entre todos os documentos relacionados.

---

# Política de Alterações

Antes de modificar qualquer arquivo:

1. Explicar o problema identificado.
2. Informar os arquivos impactados.
3. Justificar tecnicamente a alteração.
4. Avaliar efeitos colaterais.
5. Preservar compatibilidade com a arquitetura existente.

Após a alteração:

- verificar referências;
- verificar identificadores;
- verificar consistência cruzada.

---

# Regras de Consistência

Todo Requirement deve possuir:

- origem normativa;
- pelo menos um Criterion;
- Nonconformity correspondente (quando aplicável).

Todo Criterion deve:

- referenciar exatamente um Requirement;
- produzir resultado rastreável.

Toda Nonconformity deve:

- referenciar um Requirement válido;
- possuir origem normativa identificada.

Nenhum identificador pode permanecer órfão.

---

# Convenções

Não criar arquivos contendo:

- _rev1
- _rev2
- _rev3

O Git é a única fonte oficial de histórico.

Preservar nomes padronizados.

Evitar mudanças exclusivamente cosméticas.

---

# Organização do Repositório

Utilizar somente a estrutura oficial:

- knowledge-base/
- docs/
- pop/
- references/

Não criar novas pastas sem justificativa.

---

# Estilo de Desenvolvimento

Priorizar:

- alterações pequenas;
- commits frequentes;
- alta rastreabilidade;
- baixo acoplamento.

Evitar refatorações extensas quando não forem necessárias.

---

# Commits

Utilizar mensagens objetivas.

Exemplos:

- Atualiza arquitetura de responsabilidades técnicas
- Corrige rastreabilidade da Tabela 4
- Atualiza Documento 11
- Refatora processo de inferência

Evitar mensagens genéricas como:

- Update
- Fix
- Changes

---

# Objetivo Final

Toda alteração deve tornar o Sistema Especialista:

- mais consistente;
- mais rastreável;
- mais auditável;
- mais previsível;
- mais simples de manter.

Quando houver dúvida, preservar a arquitetura existente e solicitar decisão humana antes de modificar a Base de Conhecimento.
