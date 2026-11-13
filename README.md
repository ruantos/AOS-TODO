# API de gerenciamento de tarefas

Atividade individual de Aplicações Orientadas a Serviços da UNICAP. API REST em JavaScript para criar, consultar, atualizar e excluir tarefas com persistência em PostgreSQL.

A implementação reaproveita o Express, Sequelize, PostgreSQL e os middlewares do projeto original. As rotas de usuários, mensagens e sessão foram mantidas. Não há frontend nem autenticação real: `/session` continua usando o usuário fixo `rwieruch`, enquanto `/tarefas` funciona independentemente dele.

## Tecnologias

- Node.js 20 ou superior e npm (verificado com Node.js 24).
- Express 5, Sequelize 6 e driver `pg`.
- PostgreSQL, com credenciais fornecidas por variável de ambiente.
- Helmet, CORS, express-rate-limit e dotenv.
- Babel e Nodemon para build e desenvolvimento.
- Vercel para hospedagem e Postman para demonstração.
- Testes com o executor nativo do Node.js, sem novas dependências.

## Estrutura

```text
src/
├── app.js                         Configura Express e exporta a aplicação
├── index.js                       Inicia o servidor local
├── config/
│   ├── database.js                Conexão PostgreSQL compartilhada
│   └── setupDatabase.js           Criação não destrutiva da tabela tarefas
├── controllers/tarefasController.js
├── routes/tarefas.js
├── services/tarefasService.js
├── models/tarefa.js
├── middlewares/                   Validação, CORS, limites, logs e erros
└── utils/                         AppError
 database/tarefas.sql              SQL de criação da tabela
 postman/tarefas.postman_collection.json
 tests/                           Testes HTTP e integração opcional
 docs/roteiro-video.md             Demonstração em até um minuto
```

As demais entidades continuam nas mesmas camadas. O fluxo das tarefas é: rota → validação → controller → service → model → PostgreSQL. O Sequelize parametriza os valores nas operações de persistência.

## Instalação e variáveis de ambiente

```bash
npm ci
cp .env.sample .env
```

Edite `.env` com os dados reais do seu PostgreSQL. O arquivo é ignorado pelo Git.

| Variável | Configuração |
| --- | --- |
| `DATABASE_URL` | Obrigatória: URL do PostgreSQL fornecida pelo seu servidor/provedor |
| `PORT` | Porta local; o exemplo usa `4001`. Sem configuração, usa `3000` |
| `NODE_ENV` | `development` localmente; `production` na Vercel |
| `SYNC_DATABASE` | `false` por padrão. `true` cria tabelas ausentes dos modelos na inicialização local, sem `force` ou `alter` |
| `ALLOWED_ORIGINS` | Origens do navegador separadas por vírgula; padrão `http://localhost:3000,http://localhost:3001` |
| `TEST_DATABASE_URL` | Opcional, apenas para executar integração em um banco de testes separado |

A Vercel define `VERCEL` automaticamente. Não defina essa variável no ambiente local. Requisições sem `Origin`, como Postman e cURL, são aceitas pelo CORS.

Use os parâmetros SSL exigidos pelo provedor em `DATABASE_URL`; o exemplo contém `sslmode=verify-full&channel_binding=require`. Não desative a verificação de certificados. Para PostgreSQL local sem TLS, use uma URL compatível com sua instalação, sem esses parâmetros.

## Preparação do banco

Reutilize o PostgreSQL existente, sem recriar o banco. Após configurar `DATABASE_URL`, execute:

```bash
npm run db:setup
```

Esse comando cria somente a tabela `tarefas` caso ela não exista, sem apagar registros e sem modificar as tabelas antigas. Pode ser executado novamente. Não corrige automaticamente uma tabela preexistente com estrutura incompatível.

Como alternativa, execute [database/tarefas.sql](database/tarefas.sql) no editor SQL do seu provedor ou usando `psql` com uma conexão configurada. O script também é não destrutivo e inclui uma restrição contra descrições vazias.

A entidade contém somente:

| Campo | Tipo | Regra |
| --- | --- | --- |
| `id` | Integer / SERIAL | Chave primária gerada automaticamente |
| `descricao` | String / TEXT | Obrigatória, sem aceitar texto vazio ou apenas espaços |
| `finalizada` | Boolean | Obrigatória no banco; padrão `false` quando omitida na criação |

Não é necessário criar usuários para usar tarefas. Para experimentar as rotas antigas em um banco vazio, use `SYNC_DATABASE=true` localmente para criar suas tabelas e cadastre `rwieruch` por `POST /users` com `username` e `email`. A inicialização não insere mais dados de exemplo nem recria tabelas. A antiga opção `ERASE_DATABASE_ON_SYNC=true` bloqueia a inicialização local para impedir exclusão acidental de dados.

## Execução local

```bash
npm run dev
```

Com o `.env.sample`, a API fica em `http://localhost:4001`. Para executar a versão compilada:

```bash
npm run build
npm start
```

O servidor local verifica a conexão antes de começar a escutar. A criação da tabela é uma etapa explícita; na Vercel, a aplicação não executa sincronização de esquema nem depende de `app.listen()`.

## Endpoints de tarefas

| Método | Caminho | Resultado |
| --- | --- | --- |
| POST | `/tarefas` | Cria uma tarefa; HTTP 201 |
| GET | `/tarefas` | Retorna um array; HTTP 200, incluindo `[]` quando vazio |
| GET | `/tarefas/:tarefaId` | Retorna uma tarefa; HTTP 200 |
| PUT | `/tarefas/:tarefaId` | Atualiza os campos fornecidos; HTTP 200 |
| DELETE | `/tarefas/:tarefaId` | Exclui e confirma em JSON; HTTP 200 |

O ID deve ser um inteiro positivo de até `2147483647`, em representação decimal sem zeros à esquerda. IDs inválidos retornam 400 e tarefas inexistentes retornam 404. No PUT, envie pelo menos um dos campos `descricao` e `finalizada`; os campos omitidos são preservados. Campos desconhecidos, tipos incorretos, descrição vazia e JSON malformado retornam 400. `finalizada` deve ser um booleano JSON (`true` ou `false`), nunca uma string.

### Criar

```bash
curl -X POST http://localhost:4001/tarefas \
  -H 'Content-Type: application/json' \
  -d '{"descricao":"Estudar Node.js"}'
```

Resposta HTTP 201 (o ID é apenas um exemplo):

```json
{"id":1,"descricao":"Estudar Node.js","finalizada":false}
```

### Listar e consultar

```bash
curl http://localhost:4001/tarefas
curl http://localhost:4001/tarefas/1
```

A listagem retorna um array de objetos com o mesmo formato. A consulta por ID retorna um objeto.

### Atualizar

```bash
curl -X PUT http://localhost:4001/tarefas/1 \
  -H 'Content-Type: application/json' \
  -d '{"descricao":"Estudar Express.js","finalizada":true}'
```

Resposta HTTP 200:

```json
{"id":1,"descricao":"Estudar Express.js","finalizada":true}
```

### Excluir

```bash
curl -X DELETE http://localhost:4001/tarefas/1
```

Resposta HTTP 200:

```json
{"message":"Tarefa excluída com sucesso."}
```

### Erros

Exemplo HTTP 404:

```json
{"status":"fail","message":"Tarefa não encontrada."}
```

Erros de entrada usam `status: "fail"`. Falhas inesperadas retornam HTTP 500 e `{"status":"error","message":"Algo deu errado no servidor."}`, sem SQL, credenciais ou stack traces. Os limites existentes continuam ativos: 100 requisições por IP em 15 minutos e 5 em `/session`, com HTTP 429 ao exceder. Exclusões nas rotas antigas mantêm o HTTP 204 sem corpo.

## Testes

```bash
npm test
```

Os testes HTTP usam a aplicação, validações, controllers e services reais, substituindo os métodos dos models por operações em memória. Cobrem CRUD, valor padrão, atualização parcial, IDs inválidos, validação, 404, JSON malformado, falha interna sem vazamento e respostas das rotas antigas. Não comprovam a conexão PostgreSQL.

Para habilitar o teste de integração real, forneça uma URL de um banco separado, dedicado a testes:

```bash
TEST_DATABASE_URL='postgresql://usuario:senha@localhost:5432/todo_test' npm test
```

A integração cria a tabela se necessário, executa o CRUD HTTP, consulta o PostgreSQL diretamente e verifica a leitura após reiniciar o listener HTTP. Limpa somente a tarefa que criou, mantendo a tabela. Sem `TEST_DATABASE_URL`, esse teste é explicitamente pulado.

## Publicação na Vercel

A aplicação exporta o Express por `src/app.js`, entrada reconhecida pelo suporte nativo da Vercel. O `vercel.json` deixa de tratar `dist` como saída estática; as rotas mantêm os mesmos caminhos, incluindo `/tarefas`, sem prefixo `/api`. Referência: [documentação oficial de Express na Vercel](https://vercel.com/docs/frameworks/backend/express).

1. Envie o repositório ao seu provedor Git e importe-o como projeto na Vercel.
2. Use a raiz deste projeto e confirme a detecção de Express. Remova qualquer sobrescrita antiga de Output Directory para `dist` no painel. Selecione uma versão Node.js suportada, como 24.x.
3. Configure `DATABASE_URL`, `NODE_ENV=production`, `SYNC_DATABASE=false` e as origens necessárias em `ALLOWED_ORIGINS` para os ambientes utilizados (Preview/Production). Não envie `.env` ao Git.
4. Permita o acesso da Vercel ao banco externo e use a URL SSL/pooler recomendada pelo provedor para funções serverless.
5. Execute `npm run db:setup` localmente com a conexão do banco de destino, ou aplique o SQL no painel do banco, antes da primeira chamada.
6. Faça o deploy pelo painel e teste `https://SEU-PROJETO.vercel.app/tarefas` com a coleção Postman.

Não houve publicação automática. O banco deve ser externo e persistente; nenhuma tarefa é salva no sistema de arquivos da função. Não execute migrações ou recriações de tabelas em cada requisição.

## Postman e entrega

1. Importe [postman/tarefas.postman_collection.json](postman/tarefas.postman_collection.json).
2. Na aba de variáveis da coleção, configure `baseUrl` como `http://localhost:4001` ou a URL real da Vercel, sem barra final. Não há uma URL publicada registrada no repositório.
3. Execute as cinco requisições na ordem apresentada. O POST salva automaticamente o ID criado na variável `taskId`; as demais requisições por ID reutilizam esse valor.
4. Confira os testes de status e JSON da coleção. Após excluir, repetir a consulta por ID deve retornar 404.
5. Grave a demonstração seguindo [docs/roteiro-video.md](docs/roteiro-video.md). Para a entrega, disponibilize o repositório, a URL publicada, a coleção e o vídeo conforme as orientações da disciplina.
