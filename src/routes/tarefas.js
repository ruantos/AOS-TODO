import { Router } from "express";
import { tarefasController } from "../controllers/index.js";
import { validateTarefaId, validateTarefaBody } from "../middlewares/validateTarefa.js";

const router = Router();

router.get("/", tarefasController.getTarefas);
router.post("/", validateTarefaBody, tarefasController.createTarefa);
router.get("/:objectId", validateTarefaId, tarefasController.getTarefa);
router.put("/:objectId", validateTarefaId, validateTarefaBody, tarefasController.updateTarefa);
router.delete("/:objectId", validateTarefaId, tarefasController.deleteTarefa);

export default router;
