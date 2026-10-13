# Correlação automática entre DRT e produto técnico

## Decisão do projeto

O projeto adota admissão automática de vínculo sem referência cruzada textual
explícita entre DRT e produto técnico, desde que a resolução esteja calibrada
para a Base e o tipo de vínculo e todos os controles abaixo sejam satisfeitos.
O componente é comum à plataforma; limiar, calibração e política são
específicos de cada par Base/tipo de vínculo.

A validação normativa institucional desta diretriz continua pendente. Toda
decisão admitida automaticamente deve aparecer no relatório para ciência do
vistoriador, com a pendência normativa expressa.

## Fronteira dos dados

- A extração continua produzindo somente fatos documentais na RDE.
- O resolver recebe candidatos e referências de evidência depois da RDE
  validada. Ele não altera nem regrava a RDE.
- A decisão fica em artefato separado, vinculado ao identificador exato da
  apresentação, à Base e ao SHA-256 da RDE validada.
- O plano congelado do Engine pode carregar uma cópia imutável desse artefato
  como entrada contextual. O artefato não muda o texto nem os fatos da RDE.
- O relatório apresenta a decisão automática e a pendência normativa. A
  apresentação da decisão não pode, por si só, criar ou substituir resultado
  PASS/FAIL ou Nonconformity.

## Política e controles

Uma política só pode admitir candidatos quando estiver `ACTIVE` e houver
calibração validada para a mesma Base e tipo de vínculo, com limiar, tamanho de
amostra, taxa de falsa aceitação, limite máximo, versão, digest do conjunto de
calibração, aprovador e data de validação. O limiar deve estar entre 0 e 1 e a
taxa observada não pode ultrapassar o limite máximo.

São controles obrigatórios: proveniência verificada, ausência de conflito e
ambiguidade, contexto exato vinculado, auditoria habilitada e divulgação no
relatório. O candidato precisa ter referências válidas de origem e destino,
proveniência verificada e pontuação igual ou superior ao limiar calibrado.
Uma rejeição humana prevalece e bloqueia a admissão.

Se qualquer condição faltar, o resultado é `NOT_ADMITTED` com códigos de
motivo. A capacidade global fica em `ACTIVE_FAIL_CLOSED`: isso habilita a
resolução automática onde existe política elegível; não cria calibração
implícita para Bases sem política.

## Contrato implementado

`apps-script/AssociationResolutionCore.js` implementa o resolvedor puro e
emite artefatos congelados e autenticados em memória. O materializador do
plano (`ExecutionPlanCore.js`) só aceita artefato produzido pelo resolver e o
mantém separado em `ASSOCIATION_DECISIONS`. Uma cópia forjada não é aceita.

O contrato deliberadamente não transforma a correlação em fato da RDE nem
altera a semântica dos critérios `DRT_COVERS`. A conexão com a execução
produtiva exige que a etapa de extração forneça candidatos/proveniência, que
as políticas calibradas por Base sejam carregadas de uma fonte governada, e
que o gerador de relatório consuma `reportNotice` e `decisions`.

## Estado de ativação

O modo do componente está habilitado e falha fechado. A ativação operacional
no Apps Script ainda depende do pipeline de extração real, armazenamento e
governança de políticas calibradas, execução de critérios, persistência do
artefato e geração do relatório. Esses serviços não estão implementados no
baseline atual; portanto, não há admissão automática em processos reais até
que essa integração e o deploy sejam concluídos.
