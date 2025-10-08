import { describe, test, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import app from "../index.js";
import { getDatabase } from "../src/persistence/sqlite.js";

vi.mock("../src/persistence/sqlite.js");

describe("API End-to-End Tests", () => {
  const mockDb = {
    get: vi.fn(),
    all: vi.fn(),
    run: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    getDatabase.mockReturnValue(mockDb);
  });

  test("GET / deve retornar a mensagem de boas-vindas", async () => {
    const response = await request(app)
      .get("/")
      .expect(200)
      .expect("Content-Type", /json/);

    expect(response.body).toEqual({ message: "EducaPost Backend API" });
  });

  test("GET /posts/1 deve retornar um post (provando que o router está conectado)", async () => {
    const mockPost = { id: 1, title: "Post Teste" };
    mockDb.get.mockImplementation((sql, params, callback) => {
      callback(null, mockPost);
    });

    const response = await request(app).get("/posts/1").expect(200);
    expect(response.body).toEqual(mockPost);
  });

  test("GET /rota-inexistente deve retornar 404 Not Found", async () => {
    const response = await request(app).get("/rota-inexistente").expect(404);

    expect(response.body).toEqual({ message: "Not Found" });
  });
});
