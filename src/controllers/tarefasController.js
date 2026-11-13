import { tarefasService } from "../services/index.js";
import { AppError } from "../utils/index.js";

const getTarefas = async (req, res) => {
  return res.status(200).json(await tarefasService.getAllTarefas());
};

const getTarefa = async (req, res) => {
  const tarefa = await tarefasService.getTarefaById(req.params.objectId);
  if (!tarefa) throw new AppError("Tarefa não encontrada.", 404);
  return res.status(200).json(tarefa);
};

const createTarefa = async (req, res) => {
  const tarefa = await tarefasService.createTarefa(req.body);
  return res.status(201).json(tarefa);
};

const updateTarefa = async (req, res) => {
  const tarefa = await tarefasService.updateTarefa(req.params.objectId, req.body);
  if (!tarefa) throw new AppError("Tarefa não encontrada.", 404);
  return res.status(200).json(tarefa);
};

const deleteTarefa = async (req, res) => {
  const deleted = await tarefasService.deleteTarefa(req.params.objectId);
  if (!deleted) throw new AppError("Tarefa não encontrada.", 404);
  return res.status(200).json({ message: "Tarefa excluída com sucesso." });
};

export default { getTarefas, getTarefa, createTarefa, updateTarefa, deleteTarefa };
