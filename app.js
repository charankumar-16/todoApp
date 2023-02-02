const express = require("express");
const path = require("path");

const { format, isValid } = require("date-fns");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "todoApplication.db");
let db;

const intializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DBError: ${e.message}`);
    process.exit(1);
  }
};

intializeDBAndServer();

function object(todo) {
  return {
    id: todo.id,
    todo: todo.todo,
    priority: todo.priority,
    status: todo.status,
    category: todo.category,
    dueDate: todo.due_date,
  };
}

app.get("/todos/", async (request, response) => {
  const {
    status = "",
    priority = "",
    search_q = "",
    category = "",
  } = request.query;
  if (
    priority !== "HIGH" &&
    priority !== "MEDIUM" &&
    priority != "LOW" &&
    priority != ""
  ) {
    response.status(400);
    response.send("Invalid Todo Priority");
  }
  if (
    status != "TO DO" &&
    status != "IN PROGRESS" &&
    status != "DONE" &&
    status != ""
  ) {
    response.status(400);
    response.send("Invalid Todo Status");
  }
  if (
    category != "WORK" &&
    category != "HOME" &&
    category != "LEARNING" &&
    category != ""
  ) {
    response.status(400);
    response.send("Invalid Todo Category");
  }

  const Query = `SELECT * FROM todo WHERE 
                   status LIKE '%${status}%' AND 
                   priority LIKE '%${priority}%' AND 
                   todo LIKE '%${search_q}%' AND 
                   category LIKE '%${category}%' ;`;

  console.log(Query);

  const todoArray = await db.all(Query);
  console.log(todoArray);
  const updatedArray = todoArray.map(object);
  response.send(updatedArray);
});

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;

  const Query = `SELECT * FROM todo WHERE id = '${todoId}' ; `;
  const todo = await db.get(Query);
  console.log(todo);
  response.send(object(todo));
});

app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  const dueDate = format(new Date(date), "yyyy-MM-dd");
  console.log(dueDate);
  const Query = `SELECT * FROM todo WHERE 
                   due_date LIKE '%${dueDate}%' `;

  const todo = await db.all(Query);
  const UpdatedTodo = todo.map(object);
  console.log(todo);
  response.send(UpdatedTodo);
});

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  let date = format(new Date(dueDate), "yyyy-MM-dd");
  console.log(date);
  console.log(priority != "HIGH");
  console.log(priority != "MEDIUM");
  console.log(priority != "LOW");
  console.log(priority != "HIGH" || priority != "MEDIUM" || priority != "LOW");
  if (priority !== "HIGH" && priority && "MEDIUM" && priority != "LOW") {
    response.status(400);
    response.send("Invalid Todo Priority");
  }
  if (status != "TO DO" && status != "IN PROGRESS" && status != "DONE") {
    response.status(400);
    response.send("Invalid Todo Status");
  }
  if (category != "WORK" && category != "HOME" && category != "LEARNING") {
    response.status(400);
    response.send("Invalid Todo Category");
  }
  if (isValid(new Date(date)) === false) {
    response.status(400);
    response.send("Invalid Todo DueDate");
  }
  const Query = `INSERT INTO todo (id,todo,category,priority,status,due_date)
                    VALUES ('${id}','${todo}','${category}','${priority}','${status}','${dueDate}') ; `;
  await db.run(Query);
  response.send("Todo Successfully Added");
});

app.delete("/todos/:todoId", async (request, response) => {
  const { todoId } = request.params;
  const Query = `DELETE FROM todo WHERE id = '${todoId}' ;`;
  await db.run(Query);
  response.send("Todo Deleted");
});

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const previousQuery = ` SELECT * FROM todo WHERE id = ${todoId} ;`;
  const todoList = await db.get(previousQuery);

  const {
    status = todoList.status,
    priority = todoList.priority,
    todo = todoList.todo,
    category = todoList.category,
    dueDate = todoList.due_date,
  } = request.body;

  if (priority !== "HIGH" && priority && "MEDIUM" && priority != "LOW") {
    response.status(400);
    response.send("Invalid Todo Priority");
  }
  if (status != "TO DO" && status != "IN PROGRESS" && status != "DONE") {
    response.status(400);
    response.send("Invalid Todo Status");
  }
  if (category != "WORK" && category != "HOME" && category != "LEARNING") {
    response.status(400);
    response.send("Invalid Todo Category");
  }
  if (isValid(new Date(dueDate)) === false) {
    response.status(400);
    response.send("Invalid Todo DueDate");
  }
  let updated;
  console.log("Charan");

  if (status !== todoList.status) {
    updated = "Status";
  } else if (priority !== todoList.priority) {
    updated = "Priority";
  } else if (todo !== todoList.todo) {
    updated = "Todo";
  } else if (category !== todoList.category) {
    updated = "Category";
  } else if (dueDate !== todoList.due_date) {
    updated = "dueDate";
  }

  const Query = ` UPDATE todo 
                   SET todo = ${todo},
                        category = '${category}',
                        priority = '${priority}',
                        status = '${status}',
                        due_date = '${dueDate}' 
                    WHERE id = ${todoId} ;  `;
  response.send(`${updated} Updated`);
});
module.exports = app;
