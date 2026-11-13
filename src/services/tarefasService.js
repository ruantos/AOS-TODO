import models from "../models/index.js";

const getAllTarefas = async () => models.Tarefa.findAll({ order: [["objectId", "ASC"]] });

const getTarefaById = async (objectId) => models.Tarefa.findByPk(objectId);

const createTarefa = async ({ descricao, concluida = false }) => {
  return models.Tarefa.create({ descricao, concluida });
};

const updateTarefa = async (objectId, fields) => {
  const tarefa = await getTarefaById(objectId);
  return tarefa ? tarefa.update(fields) : null;
};

const deleteTarefa = async (objectId) => {
  const count = await models.Tarefa.destroy({ where: { objectId } });
  return count > 0;
};

export default { getAllTarefas, getTarefaById, createTarefa, updateTarefa, deleteTarefa };
