import models from "../models/index.js";

const getAllTarefas = async () => models.Tarefa.findAll({ order: [["id", "ASC"]] });

const getTarefaById = async (id) => models.Tarefa.findByPk(id);

const createTarefa = async ({ descricao, finalizada = false }) => {
  return models.Tarefa.create({ descricao, finalizada });
};

const updateTarefa = async (id, fields) => {
  const tarefa = await getTarefaById(id);
  return tarefa ? tarefa.update(fields) : null;
};

const deleteTarefa = async (id) => {
  const count = await models.Tarefa.destroy({ where: { id } });
  return count > 0;
};

export default { getAllTarefas, getTarefaById, createTarefa, updateTarefa, deleteTarefa };
