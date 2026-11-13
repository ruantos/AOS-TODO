import Sequelize from "sequelize";
import sequelize from "../config/database.js";

import getUserModel from "./user.js";
import getMessageModel from "./message.js";
import getTarefaModel from "./tarefa.js";

const models = {
  User: getUserModel(sequelize, Sequelize),
  Message: getMessageModel(sequelize, Sequelize),
  Tarefa: getTarefaModel(sequelize, Sequelize),
};

Object.keys(models).forEach((key) => {
  if ("associate" in models[key]) {
    models[key].associate(models);
  }
});

export { sequelize };

export default models;
