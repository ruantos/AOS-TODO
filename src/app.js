import "dotenv/config";
import express from "express";
import helmet from "helmet";
import {
  corsMiddleware,
  logMiddleware,
  contextMiddleware,
  notFoundMiddleware,
  errorMiddleware,
  limiterMiddleware,
} from "./middlewares/index.js";
import * as routes from "./routes/index.js";

const app = express();

app.set("trust proxy", 1);

app.use(helmet());
app.use(corsMiddleware);
app.use(limiterMiddleware);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(logMiddleware);

app.get("/", (req, res) => {
  return res.json({ message: "Servidor express executando..." });
});
app.use("/tarefas", routes.tarefas);
app.use(["/session", "/users", "/messages"], contextMiddleware);
app.use("/session", routes.session);
app.use("/users", routes.user);
app.use("/messages", routes.message);

app.use(notFoundMiddleware);

app.use(errorMiddleware);

export default app;
