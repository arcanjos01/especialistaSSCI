1. OBJETIVO SUPERIOR

A plataforma deve maximizar a qualidade, consistência, rastreabilidade e utilidade da análise documental para apoiar a decisão do vistoriador do CBMSC. O sistema não substitui o vistoriador nem produz a decisão administrativa final.

2. CRITÉRIO DE EVOLUÇÃO E PROPORCIONALIDADE

O critério superior para avaliar qualquer evolução é o benefício efetivo que chega ao vistoriador. Antes de introduzir componente, camada, parser, executor, plugin, integração ou mecanismo de determinismo, verificar se há melhoria demonstrável na qualidade da análise. A complexidade técnica deve ser proporcional ao benefício operacional; sem benefício claro, preferir a solução mais simples.

3. PRIORIDADES OPERACIONAIS

Priorizar conceitualmente, nesta ordem:

1. completude — reduzir omissões de documentos, evidências, atributos e Requirements relevantes;
2. fidelidade documental — distinguir fatos documentados de ausência, inferência e interpretação;
3. rastreabilidade — localizar a origem documental das informações e conclusões relevantes;
4. consistência — reduzir variações desnecessárias entre processos e execuções;
5. tratamento da incerteza — preservar a insuficiência e encaminhá-la adequadamente para análise humana;
6. explicabilidade — permitir compreender verificações, evidências, regras e conclusões;
7. não invenção — nunca apresentar suposição ou informação ausente como fato;
8. utilidade operacional — facilitar a localização de pendências, conferência de evidências e decisão do vistoriador.

4. FONTES E ESCOPO DE AUTORIDADE

Não tratar todos os documentos como uma única hierarquia. Cada fonte possui autoridade dentro de seu escopo.

Hierarquia operacional de autoridade:

1. normas oficiais — fonte primária do conteúdo normativo;
2. Base de Conhecimento — formalização do conteúdo normativo utilizado pelo sistema;
3. contratos arquiteturais — definem representação, execução, sequência e invariantes;
4. código/runtime — implementa os contratos e não pode criar semântica normativa própria.

Nem Apps Script, nem JavaScript, nem Python, nem Gemini/LLM, nem MCP, nem qualquer ferramenta de desenvolvimento podem criar, completar ou alterar semântica normativa que não esteja autorizada pelas fontes acima.

Normas oficiais

São a fonte primária do conteúdo normativo.

Base de Conhecimento

Formaliza o conhecimento normativo utilizado pelo sistema, incluindo entidades, Requirements, Criteria e Nonconformities.

00_engine

Define o contrato e as restrições do executor.

08_execution_pipeline

Define a sequência e as fronteiras da execução.

Documento 09-RDE — Especificação da RDE

Arquivo: knowledge-base/09_Especificacao_da_RDE.txt

Define a Representação Documental Estruturada e o contrato da EXTRACTION.

Documento 09-Diretriz — Diretriz Arquitetural

Arquivo: docs/Documento 09 Diretriz.txt

Define os princípios arquiteturais permanentes da plataforma.

Documento 10

Define princípios para evolução e preservação da arquitetura da plataforma.

Documento 11

Define o modelo conceitual das Obrigações Normativas, Responsabilidades Técnicas, Produtos Técnicos, Evidências e Documentos Obrigatórios.

Anexo A

É a fonte oficial do catálogo de Responsabilidades Técnicas e de seus atributos catalográficos.

Demais documentos de arquitetura

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

DOCUMENTO ≠ EVIDÊNCIA DOCUMENTAL ≠ OBRIGAÇÃO NORMATIVA ≠ REQUIREMENT ≠ CRITERION ≠ RESULTADO ≠ NONCONFORMITY

A unidade lógica fundamental do modelo normativo é a Obrigação Normativa, conforme o Documento 11.

Responsabilidade Técnica é uma categoria de atendimento de obrigação normativa; DRT é evidência documental aceita para comprovação de uma Responsabilidade Técnica.

Uma DRT não é, por si só:

uma Obrigação Normativa;

um Requirement;

um Criterion;

uma Nonconformity;

um resultado de conformidade.

6. RDE E EXTRACTION

O Documento 09-RDE controla a estrutura e os princípios da RDE.

A EXTRACTION deve produzir somente representação de fatos documentais.

Durante a EXTRACTION:

Pode

ler os documentos;

identificar documentos;

extrair fatos documentalmente comprovados;

extrair atributos previstos;

preservar origem e rastreabilidade;

registrar estados documentais conforme a arquitetura;

utilizar Gemini/LLM ou outro mecanismo de interpretação documental quando isso produzir benefício operacional.

Não pode

executar Requirements;

executar Criteria;

determinar conformidade;

determinar não conformidade;

criar Nonconformities;

criar conclusões técnicas;

interpretar requisitos para produzir resultados;

usar conhecimento externo para completar lacunas documentais;

completar informação ausente por inferência.

Princípios da RDE

A RDE deve obedecer ao Documento 09-RDE, especialmente:

fact only;

representação canônica;

rastreabilidade;

imutabilidade após a extração;

ausência de conteúdo normativo ou de resultado.

Não duplicar no AGENTS.md a estrutura detalhada da RDE. O Documento 09-RDE é a fonte dessa definição.

7. RDE E CONTEXTO DE EXECUÇÃO

A RDE é a representação documental canônica produzida pela EXTRACTION. A
execução consome uma immutable execution view (contrato Process Memory), não
uma cópia persistida obrigatória:

RDE VALIDADA → immutable execution view / Process Memory adapter → applicability → frozen execution plan → ENGINE

Quando não houver transformação necessária, a view pode ser um adaptador
read-only diretamente sobre a RDE. Uma representação normalizada em memória é
permitida quando necessária, desde que preserve fatos e rastreabilidade. Não
persistir uma segunda cópia da RDE apenas para materializar Process Memory.

A view deve ser derivada exclusivamente da RDE validada e de metadados
operacionais autorizados; não pode criar, remover, reinterpretar ou corrigir
fatos, introduzir conhecimento normativo ou tornar-se fonte de verdade
paralela à RDE. A view deve estar completa e imutável antes de applicability e
execução.

8. IMUTABILIDADE E NÃO RETROCESSO

Depois que a representação documental for encerrada conforme o contrato da arquitetura:

não adicionar fatos;

não remover fatos;

não alterar fatos;

não reinterpretar fatos;

não retornar ao documento original para obter uma informação que deveria ter sido extraída na fase anterior.

As fases posteriores devem consumir a RDE validada ou, quando justificadamente existente, representação operacional derivada sem alteração semântica.

Se uma informação necessária não estiver disponível:

não inventar;

não inferir;

não escolher arbitrariamente um resultado;

aplicar somente a semântica declarada pelo Engine/Criterion;

registrar insuficiência ou conflito quando a arquitetura não definir o comportamento.

9. ENGINE E EXECUTION PIPELINE

O agente deve respeitar integralmente os contratos do 00_engine e do 08_execution_pipeline quando alterar ou utilizar componentes que os implementem.

A direção operacional aprovada é:

- runtime operacional em JavaScript/Google Apps Script;
- Engine determinístico para execução de Requirements e Criteria;
- Gemini/LLM restrito à EXTRACTION e tarefas documentais compatíveis com essa camada;
- Engine Python mantido somente como infraestrutura de referência, experimentação, testes e validação arquitetural;
- substituição completa do Gemini/Gem como ambiente operacional final após a migração e promoção do novo pipeline.

Não portar automaticamente o Engine Python para JavaScript. Reutilizar seus contratos, testes, semântica e ideias somente quando compatíveis com as fontes canônicas e com benefício operacional demonstrável.

O núcleo do Engine deve permanecer agnóstico ao modelo, fornecedor, interface de IA e armazenamento.

Não duplicar no AGENTS.md a definição completa das funções, estados ou regras do 00_engine e do 08_execution_pipeline.

Princípios que devem ser preservados:

executar somente regras declaradas;

não criar Requirements;

não criar Criteria;

não criar Nonconformities;

não criar evidências;

não usar conhecimento externo na execução;

não fazer inferência normativa não declarada;

não alterar resultados já consolidados;

não modificar a Base durante a execução;

não ler PDF ou documento-fonte durante EXECUTION;

não depender de chamadas de IA para executar regra normativa declarada.

O 08_execution_pipeline define a ordem de execução. O agente não deve:

pular fases;

inverter fases;

executar uma fase antecipadamente;

retornar a uma fase anterior para alterar evidências;

alterar o resultado de uma fase já concluída.

Se houver diferença entre a semântica do Engine, do Pipeline ou das decisões de migração aprovadas, registrar ARCHITECTURAL_CONFLICT antes de alterar a semântica afetada.

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

se não existir, tratar a inclusão no catálogo como alteração própria, sujeita a fundamento e autorização.

A DRT deve ser tratada como evidência documental, não como unidade normativa.

12. ESTADOS E INCERTEZA

Não criar estados durante a execução.

O fluxo operacional reconhecido durante a migração é:

NEW
→ INDEXED
→ EXTRACTION_PENDING
→ EXTRACTED
→ VALIDATED
→ ANALYZED
→ REPORT_GENERATED
→ DONE

ERROR é estado operacional de falha e não resultado normativo.

Estados do workflow não devem ser confundidos com estados de resultado do Engine.

A semântica dos resultados do Engine deve ser obtida do 00_engine, do 08_execution_pipeline e dos Criteria aplicáveis.

Em particular, não assumir que:

UNKNOWN = MANUAL_REVIEW

como identidade semântica, ou que ausência de evidência equivale
automaticamente a FAIL. Na fronteira Engine/Pipeline, UNKNOWN é normalizado
para PipelineResult MANUAL_REVIEW apenas para encaminhamento operacional; o
trace preserva EngineResult UNKNOWN e identifica essa normalização. Isso não
gera FAIL ou Nonconformity nem altera ou reinterpreta evidência.

Quando houver divergência entre documentos sobre estados ou sua conversão, reportar a inconsistência antes de corrigi-la.

13. RASTREABILIDADE

Preservar a cadeia:

SOURCE DOCUMENT → DOCUMENTARY EVIDENCE → RDE → REQUIREMENT → CRITERION → EXECUTION RESULT → NONCONFORMITY, quando aplicável

Inserir entre RDE e applicability a immutable execution view (contrato Process
Memory), que pode ser um adaptador read-only sobre a RDE validada. Ela é uma
view lógica de execução, não cópia persistida ou fonte documental paralela.

A implementação deve permitir reconstruir por que um resultado foi produzido.

Nenhum relatório deve introduzir informação que não possa ser rastreada aos resultados consolidados e às evidências correspondentes.

14. RELATÓRIOS

Os relatórios são camada de apresentação.

Não devem:

descobrir novas evidências;

reabrir documentos;

executar novos Criteria;

criar Requirements;

criar Nonconformities;

alterar resultados.

Se um relatório exigir uma informação que não esteja disponível nos resultados consolidados, isso deve ser tratado como problema de arquitetura, não resolvido por nova inferência no relatório.

15. EVOLUÇÃO DA PLATAFORMA

Respeitar o Documento 10 e aplicar proporcionalidade arquitetural: a evolução deve ser justificada pelo benefício efetivo para o vistoriador, não pela busca de determinismo absoluto ou sofisticação técnica.

Preferir:

evolução da Base de Conhecimento;

reutilização do núcleo;

baixo acoplamento;

componentes genéricos quando realmente reutilizáveis;

alterações locais quando o comportamento for específico de um domínio;

adaptação incremental do runtime Apps Script;

substituição de componentes legados somente quando a nova solução estiver validada e promover benefício claro.

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

Documento 09-RDE;

Documento 09-Diretriz;

Documento 10;

Documento 11;

Anexo A;

runtime Apps Script;

Engine Python de referência, quando houver equivalência ou teste relevante;

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

possibilidade de reabrir documentos após a extração;

dependência indevida de Gemini/LLM na execução normativa;

divergência semântica entre Engine Python de referência e runtime JavaScript.

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

papel do Documento 09-RDE sobre a RDE;

papel do 00_engine sobre o executor;

papel do 08_execution_pipeline sobre a sequência;

execução normativa determinística no runtime JavaScript/Apps Script;

uso de Gemini/LLM somente em funções compatíveis com EXTRACTION ou interpretação documental não normativa.

Se uma alteração quebrar uma dessas invariantes, tratá-la como alteração arquitetural e não como simples manutenção.

LLMs são probabilísticos. Na arquitetura alvo, sua função principal é EXTRACTION e interpretação documental. Requirements e Criteria devem ser executados pelo Engine determinístico. A separação EXTRACTION/EXECUTION não exige determinismo absoluto do LLM, mas exige que sua saída seja validada antes de ingressar na execução normativa.

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

verificar que nenhuma regra não relacionada foi alterada;

testar idempotência das transições operacionais quando aplicável;

testar que a RDE não é modificada após validação;

testar que o Engine não lê documento-fonte nem chama IA;

comparar o runtime JavaScript com fixtures/contratos de referência relevantes do Engine Python quando isso ajudar a detectar regressões semânticas.

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

Credenciais e arquivos locais de autenticação, incluindo .clasp.json e .clasprc.json, não devem ser versionados.

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

O objetivo do AGENTS.md é controlar o comportamento do agente e proteger a arquitetura. Ele não deve duplicar a Base de Conhecimento nem substituir os documentos técnicos que são suas fontes de verdade.

22. AMBIENTE OPERACIONAL E MIGRAÇÃO ATUAL

A plataforma está em migração para substituir completamente o Google Gemini Gem como ambiente operacional.

Arquitetura operacional alvo:

Google Drive
→ Google Apps Script
→ EXTRACTION
→ RDE
→ VALIDATION
→ ENGINE DETERMINÍSTICO
→ REPORT
→ decisão humana do vistoriador

Responsabilidades:

Google Drive

Armazena documentos e artefatos operacionais. Não é fonte normativa.

Google Apps Script / JavaScript

É o runtime operacional alvo. Orquestra estados, persistência, validação, execução determinística e geração dos artefatos operacionais.

Gemini/LLM

É componente de EXTRACTION/interpretação documental. Não executa Requirements ou Criteria, não produz decisão normativa e não substitui o Engine.

Engine determinístico JavaScript

É o executor operacional alvo de Requirements e Criteria declarados na Base.

Engine Python

Permanece somente como referência, infraestrutura de testes, experimentação e validação arquitetural. Não é runtime operacional obrigatório e não deve receber novas integrações operacionais sem decisão explícita.

Gemini/Gem legado

Pode permanecer temporariamente disponível apenas durante a migração e comparação. Não é o destino arquitetural e deve ser retirado do fluxo operacional quando o novo pipeline estiver validado e promovido.

Codex

É utilizado para desenvolvimento, auditoria e evolução do repositório. Não é ambiente operacional da solução.

A decisão final continua sendo do vistoriador.

23. ECONOMIA DE CONTEXTO NO CODEX

Antes de abrir arquivos extensos:

usar fd para localizar arquivos;

usar rg para localizar símbolos, IDs, conceitos e referências;

usar ast-grep para buscas estruturais em código quando aplicável;

usar jq para JSON;

preferir leitura de trechos relevantes em vez de carregar arquivos completos;

expandir o contexto somente quando o trecho encontrado não for suficiente para uma decisão segura;

não carregar normas completas quando a busca localizada e o contexto adjacente forem suficientes.

Exceções:

contratos arquiteturais podem exigir leitura integral quando a alteração puder afetar sua semântica;

mudanças normativas ou arquiteturais exigem contexto suficiente para verificar dependências e conflitos;

economia de tokens nunca justifica reduzir rastreabilidade, omitir dependências ou ignorar fonte autorizada.

Antes de implementar nova abstração, procurar primeiro implementação, contrato, teste ou padrão equivalente já existente no repositório.

24. MCP E FERRAMENTAS DE CONTEXTO

MCPs read-only podem ser utilizados para reduzir custo de contexto e fornecer acesso dirigido a:

estado do projeto;

contratos;

Requirements;

Criteria;

rastreabilidade;

planos de teste;

metadados operacionais.

Um MCP:

não é fonte normativa;

não substitui os arquivos canônicos;

não pode criar ou alterar Requirements, Criteria, Nonconformities ou fatos;

não deve ocultar a origem do dado retornado;

deve preferencialmente ser read-only quando seu objetivo for consulta e economia de contexto.

Não criar MCP por sofisticação. Criar ou ampliar ferramentas somente quando houver benefício concreto de redução de contexto, repetição ou risco operacional.

25. GOVERNANÇA DE IMPLEMENTAÇÃO E REVISÃO

O modelo operacional de desenvolvimento é:

Luna pode implementar alterações de código, testes, refatorações e adaptações seguindo contratos já aprovados.

Mudança arquitetural inclui, entre outros:

alterar semântica do 00_engine;

alterar sequência ou fronteiras do 08_execution_pipeline;

alterar contrato da RDE;

alterar modelo de Obrigação Normativa;

alterar semântica de Requirement, Criterion, Nonconformity ou estados;

alterar separação EXTRACTION × EXECUTION;

introduzir ou remover camada obrigatória do pipeline;

alterar autoridade das fontes;

alterar papel operacional de IA, Engine ou runtime.

Mudanças arquiteturais podem ser implementadas por Luna quando explicitamente autorizadas, mas não devem ser promovidas como arquitetura consolidada sem revisão independente por Sol.

A revisão Sol deve verificar:

compatibilidade com fontes canônicas;

preservação das invariantes;

ausência de regra implícita;

efeitos colaterais;

rastreabilidade;

compatibilidade entre documentação, código e testes;

necessidade real da complexidade introduzida.

Aprovação técnica de Sol não substitui decisão humana quando a questão for normativa.

26. REGRA DE MIGRAÇÃO

Durante a migração:

preferir evolução incremental;

manter cada transição de estado testável e idempotente;

não introduzir IA antes de estabilizar os contratos de persistência e validação correspondentes;

não promover etapa seguinte antes de validar a anterior;

manter o documento-fonte preservado;

manter a RDE imutável após sua consolidação;

não misturar regra normativa com orquestração do Apps Script;

não manter duas arquiteturas operacionais permanentes para a mesma responsabilidade.

Quando o novo pipeline atingir equivalência funcional e confiabilidade suficientes para uso operacional, remover dependências do Gem legado em vez de mantê-lo como segundo executor permanente.
