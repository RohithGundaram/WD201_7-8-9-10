const request = require("supertest");

const db = require("../models/index");
const app = require("../app");
let server;
let agent;

describe("Test case for database", () => {
  beforeAll(async () => {
    await db.sequelize.sync({ force: true });
    server = app.listen(3000, () => {});
    agent = request.agent(server);
  });

  afterAll(async () => {
    try {
      await db.sequelize.close();
      await server.close();
    } catch (error) {
      console.log(error);
    }
  });

  test("Created todo and responded with  the json att /todos POST endpoint", async () => {
    const response = await agent.post("/todos").send({
      title: "Buy milk",
      dueDate: new Date().toISOString(),
      completed: false,
    });
    expect(response.statusCode).toBe(200);
    expect(response.header["content-type"]).toBe(
      "application/json; charset=utf-8"
    );
    const parsedResponse = JSON.parse(response.text);
    expect(parsedResponse.id).toBeDefined();
  });

  test("Mark todo", async () => {
    const res = await agent.post("/todos").send({
      title: "Do HomeWork",
      dueDate: new Date().toISOString(),
      completed: false,
    });
    const parseResponse = JSON.parse(res.text);
    const todoID = parseResponse.id;
    expect(parseResponse.completed).toBe(false);

    const changeTodo = await agent
      .put(`/todos/${todoID}/markAsCompleted`)
      .send();
    const parseUpadteTodo = JSON.parse(changeTodo.text);
    expect(parseUpadteTodo.completed).toBe(true);
  });

  test("Fetched all todos using /todos endpoint", async () => {
    await agent.post("/todos").send({
      title: "Buy xbox",
      dueDate: new Date().toISOString(),
      completed: false,
    });
    await agent.post("/todos").send({
      title: "Buy ps3",
      dueDate: new Date().toISOString(),
      completed: false,
    });
    const response = await agent.get("/todos");
    const parsedResponse = JSON.parse(response.text);

    expect(parsedResponse.length).toBe(4);
    expect(parsedResponse[3]["title"]).toBe("Buy ps3");
  });

  test("Deletes a todo sends a boolean response", async () => {
    // FILL IN YOUR CODE HERE
    const response = await agent.post("/todos").send({
      title: "Buy xbox",
      dueDate: new Date().toISOString(),
      completed: false,
    });
    const parsedResponse = JSON.parse(response.text);
    const todoID = parsedResponse.id;

    const res = await agent.delete(`/todos/${todoID}`).send();
    const bool = Boolean(res.text);
    expect(bool).toBe(true);
  });
});
