const express = require("express");
const app = express();
const { Todo } = require("./models");
const bodyParser = require("body-parser");
app.use(bodyParser.json());
app.set("view engine", "ejs");
// app.use(express.static(path.join(__dirname + "/public")));
app.use(express.static("public"));

app.get("/", async (request, response)=>{
  // response.send("Hello World");
  const allTodosAre = await Todo.getTodos();
  if (request.accepts("html")) {
    response.render("index", {
      allTodosAre,
    });
  } else {
    response.json(allTodosAre);
  }
});

app.get("/todos", async function (_request, response) {
  console.log("All Todos are processed here: ");
  // FILL IN YOUR CODE HERE
  try {
     const todo = await Todo.findAll();
    return response.send(todo);
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

app.get("/todos/:id", async function (request, response) {
  try {
     const todo = await Todo.findByPk(request.params.id);
    return response.json(todo);
  } catch (error) {
    console.log(error);
     return response.status(422).json(error);
  }
});

app.post("/todos", async function (request, response) {
  try {
    const todo = await Todo.addTodo(request.body);
    return response.json(todo);
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

app.put("/todos/:id/markAsCompleted", async function (request, response) {
  const todo = await Todo.findByPk(request.params.id);
  try {
     const updatedTodo = await todo.markAsCompleted();
    return response.json(updatedTodo);
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

app.delete("/todos/:id", async function (request, response) {
  console.log("Delete a Todo with ID: ", request.params.id);
  // FILL IN YOUR CODE HERE
  const deleteTodo = await Todo.destroy({ where: { id: request.params.id } });
  response.send(deleteTodo ? true : false);
});

module.exports = app;
