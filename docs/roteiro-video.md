# Roteiro de demonstração — até 1 minuto

Antes de gravar, prepare o PostgreSQL, publique ou inicie a API, importe a coleção e configure `baseUrl`. Deixe as cinco requisições abertas no Postman. A criação preencherá `taskId` automaticamente.

| Tempo | Ação no Postman | Fala sugerida |
| --- | --- | --- |
| 0–6 s | Mostrar a coleção e `baseUrl` | “Esta API REST gerencia tarefas usando Express e PostgreSQL.” |
| 6–16 s | Enviar POST `/tarefas` com o exemplo da coleção | “Crio uma tarefa. A API responde 201 e gera o ID automaticamente.” |
| 16–24 s | Enviar GET `/tarefas` | “A listagem retorna as tarefas persistidas no banco.” |
| 24–32 s | Enviar GET `/tarefas/{{taskId}}` | “Também posso consultar uma tarefa pelo ID.” |
| 32–44 s | Enviar PUT com descrição atualizada e `finalizada: true` | “Atualizo a descrição e marco a tarefa como finalizada. A resposta é 200.” |
| 44–54 s | Enviar DELETE `/tarefas/{{taskId}}` | “Excluo a tarefa e recebo a confirmação em JSON.” |
| 54–60 s | Reenviar GET por ID | “A consulta agora retorna 404, confirmando a exclusão.” |

Mostre o corpo e o status de cada resposta. Não exiba credenciais, `.env` ou a URL de conexão do banco na gravação.
