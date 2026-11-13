import models, { sequelize } from "../models/index.js";

try {
  await models.Tarefa.sync();
  console.log("Tabela tarefas disponível, sem apagar os dados existentes.");
} catch {
  console.error("Não foi possível preparar a tabela tarefas. Verifique DATABASE_URL e o acesso ao PostgreSQL.");
  process.exitCode = 1;
} finally {
  await sequelize.close();
}
