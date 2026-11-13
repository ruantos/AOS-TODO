CREATE TABLE IF NOT EXISTS tarefas (
  id SERIAL PRIMARY KEY,
  descricao TEXT NOT NULL CHECK (length(trim(descricao)) > 0),
  finalizada BOOLEAN NOT NULL DEFAULT FALSE
);
