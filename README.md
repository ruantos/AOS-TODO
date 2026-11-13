# API de gerenciamento de tarefas

Atividade individual de Aplicações Orientadas a Serviços da UNICAP. API REST em JavaScript para criar, consultar, atualizar e excluir tarefas com persistência em PostgreSQL.

A implementação reaproveita o Express, Sequelize, PostgreSQL e os middlewares do projeto original. As rotas de usuários, mensagens e sessão foram mantidas. Não há frontend nem autenticação real: `/session` continua usando o usuário fixo `rwieruch`, enquanto `/tarefas` funciona independentemente dele.

## Tecnologias

- Node.js 24.x e npm.
- Express 5, Sequelize 6 e driver `pg`.
- PostgreSQL, com credenciais fornecidas por variável de ambiente.
- Zod para validação; Helmet, CORS, express-rate-limit e dotenv.
- Babel e Nodemon para build e desenvolvimento.
- Vercel para hospedagem e Postman para demonstração.

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
| `objectId` | UUID | Chave primária UUID v4 gerada pelo back-end (Sequelize) |
| `descricao` | String / TEXT | Obrigatória, sem aceitar texto vazio ou apenas espaços |
| `concluida` | Boolean | Obrigatória no banco; padrão `false` quando omitida na criação |

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
| GET | `/tarefas/:objectId` | Retorna uma tarefa; HTTP 200 |
| PUT | `/tarefas/:objectId` | Atualiza os campos fornecidos; HTTP 200 |
| DELETE | `/tarefas/:objectId` | Exclui e confirma em JSON; HTTP 200 |

O `objectId` deve ser um UUID válido. IDs inválidos retornam 400 e tarefas inexistentes retornam 404. No PUT, envie pelo menos um dos campos `descricao` e `concluida`; os campos omitidos são preservados. Campos desconhecidos, tipos incorretos, descrição vazia e JSON malformado retornam 400. `concluida` deve ser um booleano JSON (`true` ou `false`), nunca uma string.

### Criar

```bash
curl -X POST http://localhost:4001/tarefas \
  -H 'Content-Type: application/json' \
  -d '{"descricao":"Estudar Node.js"}'
```

Resposta HTTP 201 (o ID é apenas um exemplo):

```json
{"objectId":"550e8400-e29b-41d4-a716-446655440000","descricao":"Estudar Node.js","concluida":false}
```

### Listar e consultar

```bash
curl http://localhost:4001/tarefas
curl http://localhost:4001/tarefas/550e8400-e29b-41d4-a716-446655440000
```

A listagem retorna um array de objetos com o mesmo formato. A consulta por ID retorna um objeto.

### Atualizar

```bash
curl -X PUT http://localhost:4001/tarefas/550e8400-e29b-41d4-a716-446655440000 \
  -H 'Content-Type: application/json' \
  -d '{"descricao":"Estudar Express.js","concluida":true}'
```

Resposta HTTP 200:

```json
{"objectId":"550e8400-e29b-41d4-a716-446655440000","descricao":"Estudar Express.js","concluida":true}
```

### Excluir

```bash
curl -X DELETE http://localhost:4001/tarefas/550e8400-e29b-41d4-a716-446655440000
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

## Publicação na Vercel

O `vercel.json` declara `src/app.js` como entrada do builder `@vercel/node` e encaminha todas as URLs para essa função. O arquivo exporta a aplicação Express; `app.listen()` fica restrito à execução local em `src/index.js`. A Vercel executa a API como uma função serverless Node.js, mantendo caminhos como `/tarefas`, `/users` e `/messages`.

A configuração é explícita, baseada em `builds` e `routes`, documentados pela Vercel. O arquivo de referência da disciplina não foi fornecido para comparação literal. Referências: [configuração Vercel](https://vercel.com/docs/project-configuration/vercel-json) e [runtime Node.js](https://vercel.com/docs/functions/runtimes/node-js).

1. Mantenha o mesmo repositório GitHub que contém usuários e mensagens e envie as alterações, incluindo `package-lock.json` e `vercel.json`.
2. No [Neon Console](https://console.neon.tech), reutilize o projeto/banco existente. Se ainda não houver um banco, crie um projeto PostgreSQL. Em **Connect**, copie a connection string com **Connection pooling** habilitado, preservando os parâmetros SSL fornecidos pelo Neon. Consulte a [documentação de pooling](https://neon.com/docs/connect/connection-pooling).
3. Configure essa URL em `DATABASE_URL` no `.env` local. Crie a tabela executando `npm run db:setup` ou aplicando `database/tarefas.sql` no editor SQL do Neon. Se já existir a tabela antiga, siga a migração descrita abaixo antes de usar a nova API.
4. Acesse [Vercel](https://vercel.com), escolha **Add New → Project** e importe o mesmo repositório GitHub. Defina **Root Directory** como a pasta que contém `package.json` e `vercel.json`. Para esta configuração explícita, use **Framework Preset: Other** e Node.js **24.x**. Não configure `dist` como Output Directory nem sobrescreva os comandos de build; o builder `@vercel/node` empacota a entrada diretamente de `src/app.js`.
5. Em **Environment Variables**, adicione `DATABASE_URL` com a conexão do Neon, `NODE_ENV=production` e `SYNC_DATABASE=false`. Configure `ALLOWED_ORIGINS` se houver um frontend. Selecione Production e, se for usar URLs de preview, Preview. Não cadastre `PORT` nem envie `.env` ao Git.
6. Clique em **Deploy**. Após concluir, abra `https://SEU-PROJETO.vercel.app/` e `https://SEU-PROJETO.vercel.app/tarefas`. A raiz deve retornar a mensagem do servidor, e a listagem deve retornar um array. Confira erros na aba de logs da função caso necessário.
7. Na coleção Postman, substitua `baseUrl` pela URL HTTPS publicada, sem barra final. Execute o POST, os GETs, o PUT e o DELETE. Para testar o padrão `false`, omita `concluida` no POST. Um UUID válido inexistente deve retornar 404 nas operações por identificador.
8. Após mudar variáveis de ambiente na Vercel, faça um novo deploy para aplicá-las. Novos commits enviados ao repositório conectado também podem disparar deploys automáticos.

Não foi realizado deploy por esta alteração. A criação/migração da tabela é executada separadamente, nunca a cada requisição serverless. O PostgreSQL permanece externo e persistente.

### Migração da tabela antiga

`CREATE TABLE IF NOT EXISTS` e `npm run db:setup` não atualizam uma tabela existente com estrutura antiga. Se a tabela ainda tiver `id SERIAL` e `finalizada`, faça backup e execute uma única vez [database/migrar-tarefas.sql](database/migrar-tarefas.sql) no editor SQL do Neon, antes do deploy.

A migração preserva descrições e estados, renomeia `finalizada` para `concluida` e substitui os IDs inteiros por UUIDs. Os IDs antigos deixam de existir: referências externas devem ser atualizadas. O script é exclusivo para o esquema antigo e não deve ser executado novamente nem usado em uma tabela já atualizada. Nas novas tarefas, o UUID é gerado pelo back-end.

## Postman e entrega

1. Importe [postman/tarefas.postman_collection.json](postman/tarefas.postman_collection.json).
2. Na aba de variáveis da coleção, configure `baseUrl` como `http://localhost:4001` ou a URL real da Vercel, sem barra final. Não há uma URL publicada registrada no repositório.
3. Execute as cinco requisições na ordem apresentada. O POST salva automaticamente o ID criado na variável `taskId`; as demais requisições por ID reutilizam esse valor.
4. Confira manualmente o status HTTP e o JSON das respostas. Após excluir, repetir a consulta por ID deve retornar 404.
5. Grave a demonstração seguindo [docs/roteiro-video.md](docs/roteiro-video.md). Para a entrega, disponibilize o repositório, a URL publicada, a coleção e o vídeo conforme as orientações da disciplina.
