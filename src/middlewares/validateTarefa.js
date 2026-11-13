import { AppError } from "../utils/index.js";

export const validateTarefaId = (req, res, next) => {
  const { tarefaId } = req.params;
  if (!/^[1-9]\d*$/.test(tarefaId) || Number(tarefaId) > 2147483647) {
    throw new AppError("O ID deve ser um inteiro positivo de até 2147483647.", 400);
  }
  next();
};

export const validateTarefaBody = (req, res, next) => {
  const body = req.body;
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new AppError("Envie um objeto JSON com os dados da tarefa.", 400);
  }

  const fields = Object.keys(body);
  if (!fields.length || fields.some((field) => !["descricao", "finalizada"].includes(field))) {
    throw new AppError("Informe apenas descricao e/ou finalizada.", 400);
  }

  if (req.method === "POST" || Object.hasOwn(body, "descricao")) {
    if (typeof body.descricao !== "string" || !body.descricao.trim()) {
      throw new AppError("A descricao é obrigatória e deve ser uma string não vazia.", 400);
    }
    body.descricao = body.descricao.trim();
  }

  if (Object.hasOwn(body, "finalizada") && typeof body.finalizada !== "boolean") {
    throw new AppError("O campo finalizada deve ser booleano.", 400);
  }
  next();
};
