import app from "./app.js";
import { sequelize } from "./models/index.js";

const startServer = async () => {
  try {
    if (process.env.ERASE_DATABASE_ON_SYNC === "true") {
      throw new Error("A recriação destrutiva do banco está desabilitada.");
    }
    await sequelize.authenticate();
    if (process.env.SYNC_DATABASE === "true") {
      await sequelize.sync();
    }
    const port = process.env.PORT || 3000;
    app.listen(port, () => console.log(`Servidor executando na porta ${port}.`));
  } catch {
    console.error("Não foi possível iniciar o servidor. Verifique a configuração e a conexão com o banco.");
    await sequelize.close();
    process.exitCode = 1;
  }
};

if (!process.env.VERCEL) {
  await startServer();
}

export default app;
