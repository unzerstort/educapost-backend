import { describe, test, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import app from "../index.js";
import * as postsModel from "../src/models/posts.model.js";

vi.mock("../src/models/posts.model.js");
vi.mock("../src/models/categories.model.js");
vi.mock("../src/auth/middleware.js", () => ({
  requireAuth: (req, res, next) => {
    req.teacher = { id: 1 };
    req.auth = { role: "teacher", id: 1 };
    next();
  },
  requireTeacher: (req, res, next) => {
    req.teacher = { id: 1 };
    req.auth = { role: "teacher", id: 1 };
    next();
  },
  requireStudent: (req, res, next) => next(),
}));

describe("API End-to-End Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("GET / deve retornar a mensagem de boas-vindas", async () => {
    const response = await request(app)
      .get("/")
      .expect(200)
      .expect("Content-Type", /json/);

    expect(response.body).toEqual({ message: "EducaPost Backend API" });
  });

  test("GET /posts/1 deve retornar um post (com auth mockado)", async () => {
    const mockPost = { id: 1, title: "Post Teste" };
    postsModel.getPostById.mockResolvedValue(mockPost);

    const response = await request(app).get("/posts/1").expect(200);
    expect(response.body).toEqual(mockPost);
  });

  test("GET /rota-inexistente deve retornar 404 Not Found", async () => {
    const response = await request(app).get("/rota-inexistente").expect(404);

    expect(response.body).toEqual({ message: "Not Found" });
  });
});
