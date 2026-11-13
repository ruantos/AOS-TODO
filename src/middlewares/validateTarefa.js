import { z } from "zod";
import { AppError } from "../utils/index.js";

const descricaoSchema = z.string().trim().min(1, "A descricao é obrigatória e não pode ser vazia.");
const createTarefaSchema = z.strictObject({
  descricao: descricaoSchema,
  concluida: z.boolean().default(false),
});
const updateTarefaSchema = z.strictObject({
  descricao: descricaoSchema.optional(),
  concluida: z.boolean().optional(),
}).refine((body) => Object.keys(body).length > 0, {
  message: "Informe descricao e/ou concluida para atualizar a tarefa.",
});

export const validateTarefaId = (req, res, next) => {
  const result = z.uuid().safeParse(req.params.objectId);
  if (!result.success) {
    throw new AppError("O objectId deve ser um UUID válido.", 400);
  }
  next();
};

export const validateTarefaBody = (req, res, next) => {
  const schema = req.method === "POST" ? createTarefaSchema : updateTarefaSchema;
  const result = schema.safeParse(req.body);
  if (!result.success) {
    throw new AppError(result.error.issues.map((issue) => issue.message).join("; "), 400);
  }
  req.body = result.data;
  next();
};
