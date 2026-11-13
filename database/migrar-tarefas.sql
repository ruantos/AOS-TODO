-- Execute apenas se a tabela existente ainda usa id SERIAL e finalizada.
-- Preserva as tarefas e substitui os identificadores inteiros por novos UUIDs.
-- Faça backup antes; referências externas aos IDs antigos precisam ser atualizadas.
BEGIN;

ALTER TABLE tarefas RENAME COLUMN finalizada TO concluida;
ALTER TABLE tarefas ADD COLUMN "objectId" UUID NOT NULL DEFAULT gen_random_uuid();
ALTER TABLE tarefas DROP CONSTRAINT tarefas_pkey;
ALTER TABLE tarefas ADD PRIMARY KEY ("objectId");
ALTER TABLE tarefas DROP COLUMN id;
-- Nas novas tarefas, o UUID é gerado pelo back-end (Sequelize UUIDV4).
ALTER TABLE tarefas ALTER COLUMN "objectId" DROP DEFAULT;

COMMIT;
