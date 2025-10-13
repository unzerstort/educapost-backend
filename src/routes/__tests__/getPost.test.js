import { describe, test, expect, beforeEach, vi } from "vitest";
import getPostRouter from "../getPost.js";
import { getDatabase } from "../../persistence/sqlite.js";

vi.mock("../../persistence/sqlite.js");

const getPostHandler = getPostRouter.stack[0].route.stack[0].handle;

describe("GET /posts/:id Handler", () => {
  let mockReq;
  let mockRes;

  const mockDb = {
    get: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();

    getDatabase.mockReturnValue(mockDb);

    mockReq = {
      params: {},
    };
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
  });

  test("deve retornar um post e status 200 quando o post é encontrado", () => {
    const postId = 1;
    const mockPost = {
      id: postId,
      title: "Post de Teste",
      content: "Conteúdo",
    };
    mockReq.params.id = postId.toString();
    mockDb.get.mockImplementation((sql, params, callback) => {
      callback(null, mockPost);
    });

    getPostHandler(mockReq, mockRes);

    expect(mockDb.get).toHaveBeenCalledWith(
      "SELECT * FROM Post WHERE id = ?",
      [postId],
      expect.any(Function)
    );
    expect(mockRes.json).toHaveBeenCalledWith(mockPost);
    expect(mockRes.status).not.toHaveBeenCalled();
  });

  test("deve retornar um erro 404 quando o post não é encontrado", () => {
    const postId = 999;
    mockReq.params.id = postId.toString();
    mockDb.get.mockImplementation((sql, params, callback) => {
      callback(null, null);
    });

    getPostHandler(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(404);
    expect(mockRes.json).toHaveBeenCalledWith({ message: "Post not found" });
  });

  test("deve retornar um erro 400 para um ID inválido (não numérico)", () => {
    mockReq.params.id = "abc";

    getPostHandler(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({ message: "Invalid id" });
    expect(mockDb.get).not.toHaveBeenCalled();
  });

  test("deve retornar um erro 400 para um ID igual a zero", () => {
    mockReq.params.id = "0";

    getPostHandler(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({ message: "Invalid id" });
    expect(mockDb.get).not.toHaveBeenCalled();
  });

  test("deve retornar um erro 500 se ocorrer um erro no banco de dados", () => {
    const postId = 1;
    mockReq.params.id = postId.toString();
    const dbError = new Error("Falha na conexão");
    mockDb.get.mockImplementation((sql, params, callback) => {
      callback(dbError, null);
    });

    getPostHandler(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({ message: "Database error" });
  });
});
