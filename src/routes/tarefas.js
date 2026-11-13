import { Router } from "express";
import { tarefasController } from "../controllers/index.js";
import { validateTarefaId, validateTarefaBody } from "../middlewares/validateTarefa.js";

const router = Router();

router.get("/", tarefasController.getTarefas);
router.post("/", validateTarefaBody, tarefasController.createTarefa);
router.get("/:tarefaId", validateTarefaId, tarefasController.getTarefa);
router.put("/:tarefaId", validateTarefaId, validateTarefaBody, tarefasController.updateTarefa);
router.delete("/:tarefaId", validateTarefaId, tarefasController.deleteTarefa);

export default router;
