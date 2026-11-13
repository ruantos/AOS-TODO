const getTarefaModel = (sequelize, { DataTypes }) => {
  return sequelize.define("tarefa", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    descricao: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: { notEmpty: true },
    },
    finalizada: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  }, {
    tableName: "tarefas",
    timestamps: false,
  });
};

export default getTarefaModel;
