import assert from "node:assert/strict";
import { after, before, test } from "node:test";

process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test";
process.env.ALLOWED_ORIGINS = "http://localhost:3000";
const { default: app } = await import("../src/app.js");
const { default: models, sequelize } = await import("../src/models/index.js");
let server;
let baseUrl;
let nextId = 1;
const tarefas = new Map();

before(async () => {
  models.User.findByLogin = async () => ({ id: "usuario-legado" });
  models.User.findAll = async () => [{ id: "usuario-legado" }];
  models.Message.findAll = async () => [];
  models.User.findByPk = async () => ({ id: "usuario-legado" });
  models.Tarefa.findAll = async () => [...tarefas.values()];
  models.Tarefa.findByPk = async (id) => tarefas.get(Number(id)) || null;
  models.Tarefa.create = async (fields) => {
    const tarefa = { id: nextId++, ...fields };
    Object.defineProperty(tarefa, "update", {
      value: async (values) => Object.assign(tarefa, values),
    });
    tarefas.set(tarefa.id, tarefa);
    return tarefa;
  };
  models.Tarefa.destroy = async ({ where }) => Number(tarefas.delete(Number(where.id)));
  server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  if (server) await new Promise((resolve) => server.close(resolve));
  await sequelize.close();
});

const request = async (path, method = "GET", body) => {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  assert.match(response.headers.get("content-type"), /application\/json/);
  return { status: response.status, body: await response.json() };
};

test("CRUD HTTP completo, valor padrão, atualização parcial e exclusão", async () => {
  assert.deepEqual(await request("/tarefas"), { status: 200, body: [] });
  const created = await request("/tarefas", "POST", { descricao: " Estudar Node.js " });
  assert.equal(created.status, 201);
  assert.deepEqual(created.body, { id: 1, descricao: "Estudar Node.js", finalizada: false });
  assert.deepEqual((await request("/tarefas/1")).body, created.body);
  assert.equal((await request("/tarefas")).body.length, 1);
  const updated = await request("/tarefas/1", "PUT", { descricao: "Estudar Express", finalizada: true });
  assert.equal(updated.status, 200);
  assert.equal(updated.body.finalizada, true);
  const partial = await request("/tarefas/1", "PUT", { finalizada: false });
  assert.equal(partial.body.descricao, "Estudar Express");
  assert.equal(partial.body.finalizada, false);
  const removed = await request("/tarefas/1", "DELETE");
  assert.equal(removed.status, 200);
  assert.equal(removed.body.message, "Tarefa excluída com sucesso.");
  assert.deepEqual((await request("/tarefas")).body, []);
});

test("POST aceita finalizada explicitamente", async () => {
  const response = await request("/tarefas", "POST", { descricao: "Concluída", finalizada: true });
  assert.equal(response.status, 201);
  assert.equal(response.body.finalizada, true);
});

test("IDs inválidos retornam 400 em todas as operações por ID", async () => {
  for (const id of ["0", "-1", "1.5", "abc", "2147483648", "1e2"]) {
    for (const method of ["GET", "PUT", "DELETE"]) {
      const response = await request(`/tarefas/${id}`, method, method === "PUT" ? { finalizada: true } : undefined);
      assert.equal(response.status, 400, `${method} ${id}`);
      assert.equal(response.body.status, "fail");
    }
  }
});

test("tarefas inexistentes retornam 404", async () => {
  for (const method of ["GET", "PUT", "DELETE"]) {
    const response = await request("/tarefas/999", method, method === "PUT" ? { finalizada: true } : undefined);
    assert.equal(response.status, 404);
    assert.equal(response.body.message, "Tarefa não encontrada.");
  }
});

test("validação rejeita corpos inválidos e tipos incorretos", async () => {
  for (const body of [{}, [], { descricao: "" }, { descricao: "  " }, { descricao: 5 }, { descricao: null }, { descricao: "Teste", finalizada: "false" }, { descricao: "Teste", finalizada: null }, { descricao: "Teste", id: 50 }]) {
    assert.equal((await request("/tarefas", "POST", body)).status, 400, JSON.stringify(body));
  }
  for (const body of [{}, [], { descricao: null }, { descricao: " " }, { finalizada: 0 }, { extra: true }]) {
    assert.equal((await request("/tarefas/2", "PUT", body)).status, 400);
  }
  assert.equal((await request("/tarefas", "POST")).status, 400);
});

test("JSON malformado recebe erro JSON sem detalhes internos", async () => {
  const response = await fetch(`${baseUrl}/tarefas`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: '{"descricao":',
  });
  assert.equal(response.status, 400);
  const body = await response.json();
  assert.equal(body.stack, undefined);
  assert.equal(body.status, "fail");
});

test("falhas do banco retornam 500 sem expor a causa", async () => {
  const original = models.Tarefa.findAll;
  try {
    models.Tarefa.findAll = async () => { throw new Error("postgresql://senha-secreta SQL SELECT"); };
    const response = await request("/tarefas");
    assert.deepEqual(response, { status: 500, body: { status: "error", message: "Algo deu errado no servidor." } });
  } finally {
    models.Tarefa.findAll = original;
  }
});

test("raiz, rotas antigas e rota desconhecida continuam respondendo", async () => {
  assert.equal((await request("/")).status, 200);
  assert.equal((await request("/users")).status, 200);
  assert.equal((await request("/messages")).status, 200);
  assert.equal((await request("/session")).body.id, "usuario-legado");
  assert.equal((await request("/inexistente")).status, 404);
});
