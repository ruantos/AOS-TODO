CREATE TABLE IF NOT EXISTS tarefas (
  "objectId" UUID PRIMARY KEY,
  descricao TEXT NOT NULL CHECK (length(trim(descricao)) > 0),
  concluida BOOLEAN NOT NULL DEFAULT FALSE
);
