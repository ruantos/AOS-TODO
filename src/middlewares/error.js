import { AppError } from "../utils/index.js";

const errorMiddleware = (err, req, res, next) => {
  if (res.headersSent) return next(err);

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ status: err.status, message: err.message });
  }

  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ status: "fail", message: "O corpo da requisição contém JSON inválido." });
  }

  if (err.type === "entity.too.large") {
    return res.status(413).json({ status: "fail", message: "O corpo da requisição excede o tamanho permitido." });
  }

  if (err.name === "SequelizeUniqueConstraintError") {
    return res.status(409).json({ status: "fail", message: "Registro duplicado." });
  }

  if (err.name === "SequelizeValidationError") {
    return res.status(400).json({ status: "fail", message: "Dados inválidos. Verifique os campos informados." });
  }

  if (err.name === "SequelizeDatabaseError" && err.original?.code === "22P02") {
    return res.status(400).json({ status: "fail", message: "Identificador (ID) fornecido possui formato inválido." });
  }

  console.error("Erro interno ao processar a requisição.");
  return res.status(500).json({ status: "error", message: "Algo deu errado no servidor." });
};

export default errorMiddleware;
