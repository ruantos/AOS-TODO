import assert from "node:assert/strict";
import { test } from "node:test";

test("CRUD HTTP e persistência em PostgreSQL real", { skip: !process.env.TEST_DATABASE_URL }, async () => {
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
  const { default: app } = await import("../src/app.js");
  const { default: models, sequelize } = await import("../src/models/index.js");
  let server;
  let taskId;
  const listen = async () => {
    server = app.listen(0, "127.0.0.1");
    await new Promise((resolve) => server.once("listening", resolve));
    return `http://127.0.0.1:${server.address().port}/tarefas`;
  };
  try {
    await models.Tarefa.sync();
    let url = await listen();
    const created = await fetch(url, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ descricao: "Verificação automatizada de persistência" }),
    });
    assert.equal(created.status, 201);
    const tarefa = await created.json();
    taskId = tarefa.id;
    assert.equal(tarefa.finalizada, false);
    const [rows] = await sequelize.query("SELECT descricao, finalizada FROM tarefas WHERE id = $1", { bind: [taskId] });
    assert.equal(rows[0].descricao, tarefa.descricao);
    assert.equal(rows[0].finalizada, false);
    await new Promise((resolve) => server.close(resolve));
    url = await listen();
    const found = await fetch(`${url}/${taskId}`);
    assert.equal(found.status, 200);
    assert.deepEqual(await found.json(), tarefa);
    const list = await fetch(url);
    assert.equal(list.status, 200);
    assert.ok((await list.json()).some((item) => item.id === taskId));
    const updated = await fetch(`${url}/${taskId}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ descricao: "Verificação concluída", finalizada: true }),
    });
    assert.equal(updated.status, 200);
    assert.equal((await updated.json()).finalizada, true);
    const deleted = await fetch(`${url}/${taskId}`, { method: "DELETE" });
    assert.equal(deleted.status, 200);
    assert.equal((await fetch(`${url}/${taskId}`)).status, 404);
  } finally {
    if (taskId) await models.Tarefa.destroy({ where: { id: taskId } });
    if (server?.listening) await new Promise((resolve) => server.close(resolve));
    await sequelize.close();
  }
});
