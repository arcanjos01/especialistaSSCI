4. FONTES E ESCOPO DE AUTORIDADE

Não tratar todos os documentos como uma única hierarquia. Cada fonte possui autoridade dentro de seu escopo.

Normas oficiais

São a fonte primária do conteúdo normativo.

Base de Conhecimento

Formaliza o conhecimento normativo utilizado pelo sistema, incluindo entidades, Requirements, Criteria e Nonconformities.

00_engine

Define o contrato e as restrições do executor.

08_execution_pipeline

Define a sequência e as fronteiras da execução.

Documento 09 — RDE

Define a Representação Documental Estruturada e o contrato da EXTRACTION.

Documento 10

Define princípios para evolução e preservação da arquitetura da plataforma.

Documento 11

Define o modelo conceitual das Obrigações Normativas, Responsabilidades Técnicas, Produtos Técnicos, Evidências e Documentos Obrigatórios.

Anexo A

É a fonte oficial do catálogo de Responsabilidades Técnicas e de seus atributos catalográficos.

demais documentos de arquitetura

Devem ser considerados conforme o escopo e a vigência definidos neles.

Relatórios

Definem apresentação dos resultados e não devem criar ou alterar resultados.

Se houver conflito:

identificar a fonte e o trecho envolvidos;

identificar o escopo de autoridade de cada fonte;

não escolher arbitrariamente;

não usar conhecimento externo para resolver o conflito;

corrigir somente após decisão ou fundamento autorizado.

5. ARQUITETURA QUE DEVE SER PRESERVADA

A arquitetura deve manter separadas estas categorias:

DOCUMENTO≠EVIDÊNCIA DOCUMENTAL≠OBRIGAÇÃO NORMATIVA≠REQUIREMENT≠CRITERION≠RESULTADO≠NONCONFORMITY

A unidade lógica fundamental do modelo normativo é a Obrigação Normativa,conforme o Documento 11.

Responsabilidade Técnica é uma categoria de atendimento de obrigação normativa; DRT é evidência documental aceita para comprovação de uma Responsabilidade Técnica.

Uma DRT não é, por si só:

uma Obrigação Normativa;

um Requirement;

um Criterion;

uma Nonconformity;

um resultado de conformidade.

6. RDE E EXTRACTION

O Documento 09 controla a estrutura e os princípios da RDE.

A EXTRACTION deve produzir somente representação de fatos documentais.

Durante a EXTRACTION:

Pode

ler os documentos;

identificar documentos;

extrair fatos documentalmente comprovados;

extrair atributos previstos;

preservar origem e rastreabilidade;

registrar estados documentais conforme a arquitetura.

Não pode

executar Requirements;

executar Criteria;

determinar conformidade;

determinar não conformidade;

criar Nonconformities;

criar conclusões técnicas;

interpretar requisitos para produzir resultados;

usar conhecimento externo;

completar informação ausente por inferência.

Princípios da RDE

A RDE deve obedecer ao Documento 09, especialmente:

fact only;

representação canônica;

rastreabilidade;

imutabilidade após a extração;

ausência de conteúdo normativo ou de resultado.

Não duplicar no AGENTS.md a estrutura detalhada da RDE. O Documento 09 é a fonte dessa definição.

7. RDE × PROCESS MEMORY

Não assumir que RDE e Process Memory são o mesmo artefato.

RDE: representação documental definida pelo Documento 09.

Process Memory: representação utilizada pelas fases de execução conforme definida no 08_execution_pipeline.

A transformação entre essas representações deve preservar os fatos e suarastreabilidade e não pode criar conhecimento normativo.

Se o Documento 09 e o 08_execution_pipeline apresentarem semânticas incompatíveis sobre essa fronteira, isso é uma inconsistência arquitetural aser reportada, não algo a ser resolvido por inferência do agente.

8. IMUTABILIDADE E NÃO RETROCESSO

Depois que a representação documental for encerrada conforme o contrato da arquitetura:

não adicionar fatos;

não remover fatos;

não alterar fatos;

não reinterpretar fatos;

não retornar ao documento original para obter uma informação que deveria ter sido extraída na fase anterior.

As fases posteriores devem consumir a representação de evidências disponível para execução.

Se uma informação necessária não estiver disponível:

não inventar;

não inferir;

não escolher arbitrariamente um resultado;

aplicar somente a semântica declarada pelo Engine/Criterion;

registrar insuficiência ou conflito quando a arquitetura não definir o comportamento.

9. ENGINE E EXECUTION PIPELINE

O agente deve respeitar integralmente o 00_engine e o 08_execution_pipeline.

Não duplicar no AGENTS.md a definição completa das funções, estados ou regras desses documentos.

Princípios que devem ser preservados:

executar somente regras declaradas;

não criar Requirements;

não criar Criteria;

não criar Nonconformities;

não criar evidências;

não usar conhecimento externo na execução;

não fazer inferência normativa não declarada;

não alterar resultados já consolidados;

não modificar a Base durante a execução.

O 08_execution_pipeline define a ordem de execução. O agente não deve:

pular fases;

inverter fases;

executar uma fase antecipadamente;

retornar a uma fase anterior para alterar evidências;

alterar o resultado de uma fase já concluída.

Se houver diferença entre a semântica do Engine e do Pipeline, registrar a inconsistência antes de alterar qualquer um deles.

10. REQUIREMENTS, CRITERIA E NONCONFORMITIES

Requirements

Representam Obrigações Normativas formalizadas pela Base.

Não criar ou alterar Requirement sem fundamento autorizado.

Criteria

Representam verificações declaradas para Requirements.

Um Criterion não pode:

ampliar a obrigação;

criar obrigação nova;

criar Nonconformity;

utilizar conhecimento externo;

inventar regra de aplicabilidade.

Nonconformities

Representam consequências declaradas de resultados FAIL.

Não criar Nonconformity durante a execução.

A ausência de evidência somente pode gerar FAIL/Nonconformity quando a Base declarar essa consequência para o Requirement e Criterion aplicáveis.

11. RESPONSABILIDADES TÉCNICAS E ANEXO A

O Anexo A é a fonte oficial do catálogo de Responsabilidades Técnicas.

Não:

criar identificador local;

duplicar uma Responsabilidade Técnica;

redefinir seus atributos em Requirement, Criterion ou Engine;

criar uma Responsabilidade Técnica fora do catálogo.

Ao precisar de uma Responsabilidade Técnica:

verificar se ela existe no Anexo A;

utilizar o identificador oficial;

verificar as dependências;

se não existir, tratar a inclusão no catálogo como alteração própria,sujeita a fundamento e autorização.

A DRT deve ser tratada como evidência documental, não como unidade normativa.

12. ESTADOS E INCERTEZA

Não criar estados durante a execução.

A semântica dos estados deve ser obtida do 00_engine,08_execution_pipeline e Criteria aplicáveis.

Em particular, não assumir que:

UNKNOWN = MANUAL_REVIEW

ou que ausência de evidência equivale automaticamente a FAIL.

Quando houver divergência entre documentos sobre estados ou sua conversão,reportar a inconsistência antes de corrigi-la.

13. RASTREABILIDADE

Preservar a cadeia:

SOURCE DOCUMENT→ DOCUMENTARY EVIDENCE→ REPRESENTAÇÃO DOCUMENTAL→ PROCESS MEMORY, quando aplicável→ REQUIREMENT→ CRITERION→ EXECUTION RESULT→ NONCONFORMITY, quando aplicável

A implementação deve permitir reconstruir por que um resultado foi produzido.

Nenhum relatório deve introduzir informação que não possa ser rastreadaaos resultados consolidados e às evidências correspondentes.

14. RELATÓRIOS

Os relatórios são camada de apresentação.

Não devem:

descobrir novas evidências;

reabrir documentos;

executar novos Criteria;

criar Requirements;

criar Nonconformities;

alterar resultados.

Se um relatório exigir uma informação que não esteja disponível nos resultados consolidados, isso deve ser tratado como problema de arquitetura,não resolvido por nova inferência no relatório.

15. EVOLUÇÃO DA PLATAFORMA

Respeitar o Documento 10.

Preferir:

evolução da Base de Conhecimento;

reutilização do núcleo;

baixo acoplamento;

componentes genéricos quando realmente reutilizáveis;

alterações locais quando o comportamento for específico de um domínio.

Não incorporar ao núcleo permanente uma regra específica de domínio sem justificativa arquitetural.

Não transformar uma necessidade de uma Base específica em regra global apenas porque isso parece conveniente.

16. AUDITORIA ANTES DE ALTERAR

Antes de uma alteração estrutural, verificar o impacto mínimo necessário em:

00_engine;

01_entities;

02_requirements;

Tables/Criteria aplicáveis;

05_nonconformities;

relatórios;

08_execution_pipeline;

Documento 09;

Documento 10;

Documento 11;

Anexo A;

Demais documentos efetivamente dependentes.

Não presumir nomes ou caminhos de arquivos. Confirmar a estrutura real do repositório.

A auditoria deve procurar, no mínimo:

Requirements sem Criteria;

Criteria sem Requirement;

Nonconformities sem Criterion;

identificadores órfãos;

referências inexistentes;

funções incompatíveis entre Engine e Base;

divergências entre RDE e Pipeline;

divergências entre Pipeline e Engine;

divergências entre Documento 11 e Base;

divergências entre Anexo A e Base;

resultados sem evidência;

FAIL sem Nonconformity quando exigida;

Nonconformity sem FAIL;

possibilidade de reabrir documentos após a extração.

17. POLÍTICA DE ALTERAÇÃO

Antes de modificar:

identificar o problema;

localizar a camada responsável;

identificar a fonte que sustenta a alteração;

mapear dependências;

avaliar efeitos colaterais;

propor a menor alteração suficiente;

verificar rastreabilidade;

testar o comportamento afetado.

Não alterar outras partes do sistema somente porque parecem melhoráveis.

Quando outro problema for encontrado fora do escopo:

registrar;

explicar o impacto;

não corrigir automaticamente.

18. PRESERVAÇÃO E INVARIANTES

Toda alteração deve preservar, salvo mudança explicitamente autorizada:

separação EXTRACTION × EXECUTION;

imutabilidade da representação de evidências após a fase correspondente;

ausência de regras implícitas;

ausência de conhecimento externo na execução;

rastreabilidade;

correspondência Requirement → Criterion;

correspondência FAIL → Nonconformity quando aplicável;

autoridade do Anexo A sobre Responsabilidades Técnicas;

papel do Documento 09 sobre a RDE;

papel do 00_engine sobre o executor;

papel do 08_execution_pipeline sobre a sequência.

Se uma alteração quebrar uma dessas invariantes, tratá-la como alteração arquitetural e não como simples manutenção.

19. TESTES

Depois de alterações relevantes:

validar sintaxe;

validar referências cruzadas;

validar identificadores;

verificar cobertura Requirement → Criterion;

verificar Criterion → Nonconformity;

verificar rastreabilidade;

executar testes representativos;

comparar com o comportamento anterior quando apropriado;

testar ausência/incompletude de documentos;

testar evidência não verificável;

testar MANUAL_REVIEW e NOT_APPLICABLE quando aplicáveis;

verificar que nenhuma regra não relacionada foi alterada.

Um teste isolado passando não prova consistência arquitetural.

20. GIT E ORGANIZAÇÃO

Não criar arquivos de versão como:

_rev1;

_rev2;

_rev3.

Usar o Git para histórico.

Não renomear ou mover arquivos sem verificar referências e dependências.

Quando autorizado a fazer commits:

manter commits pequenos e coerentes;

não misturar alterações independentes;

usar mensagens objetivas.

21. REGRA FINAL

Quando houver dúvida:

não inventar;

não ampliar o escopo;

não usar plausibilidade como regra;

localizar a fonte autorizada;

identificar a camada responsável;

preservar as invariantes;

escolher a menor alteração, quando autorizada;

solicitar decisão humana quando a questão for normativa ou arquitetural.

O objetivo do AGENTS.md é controlar o comportamento do agente e protegera arquitetura. Ele não deve duplicar a Base de Conhecimento nem substituiros documentos técnicos que são suas fontes de verdade.
