import { describe, test, expect, beforeEach, vi } from "vitest";
import postsRouter from "../posts.router.js"; // Ajuste o caminho se necessário
import { getDatabase } from "../../persistence/sqlite.js";

vi.mock("../../persistence/sqlite.js");

const getPostsHandler = postsRouter.stack.find(
  (layer) => layer.route.path === "/posts"
).route.stack[0].handle;
const searchPostsHandler = postsRouter.stack.find(
  (layer) => layer.route.path === "/posts/search"
).route.stack[0].handle;

describe("List and Search Posts", () => {
  let mockReq;
  let mockRes;
  const mockDb = {
    get: vi.fn(),
    all: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    getDatabase.mockReturnValue(mockDb);
    mockReq = { query: {} };
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
  });

  describe("GET /posts", () => {
    test("deve retornar a lista de posts com sucesso", () => {
      const mockPosts = [{ id: 1, title: "Post 1" }];
      mockDb.get.mockImplementation((sql, params, callback) =>
        callback(null, { total: 1 })
      );
      mockDb.all.mockImplementation((sql, params, callback) =>
        callback(null, mockPosts)
      );

      getPostsHandler(mockReq, mockRes);

      expect(mockDb.get).toHaveBeenCalled();
      expect(mockDb.all).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith({ total: 1, items: mockPosts });
    });

    test("deve retornar erro 500 se a contagem no banco falhar", () => {
      mockDb.get.mockImplementation((sql, params, callback) =>
        callback(new Error("DB Error"))
      );

      getPostsHandler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ message: "Database error" });
      expect(mockDb.all).not.toHaveBeenCalled();
    });

    test("deve retornar erro 500 se a busca da lista no banco falhar", () => {
      mockDb.get.mockImplementation((sql, params, callback) =>
        callback(null, { total: 1 })
      );
      mockDb.all.mockImplementation((sql, params, callback) =>
        callback(new Error("DB Error"))
      );

      getPostsHandler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ message: "Database error" });
    });
  });

  describe("GET /posts/search", () => {
    test("deve retornar os resultados da busca com sucesso", () => {
      mockReq.query.q = "educação";
      const mockResults = [{ id: 2, title: "Post sobre educação" }];
      mockDb.get.mockImplementation((sql, params, callback) =>
        callback(null, { total: 1 })
      );
      mockDb.all.mockImplementation((sql, params, callback) =>
        callback(null, mockResults)
      );

      searchPostsHandler(mockReq, mockRes);

      const expectedLike = "%educação%";
      expect(mockDb.get).toHaveBeenCalledWith(
        expect.any(String),
        [expectedLike, expectedLike],
        expect.any(Function)
      );
      expect(mockDb.all).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith({
        total: 1,
        items: mockResults,
      });
    });

    test('deve retornar erro 400 se o parâmetro "q" estiver faltando', () => {
      searchPostsHandler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Query param q is required",
      });
      expect(mockDb.get).not.toHaveBeenCalled();
    });

    test("deve retornar erro 500 se a contagem da busca falhar", () => {
      mockReq.query.q = "teste";
      mockDb.get.mockImplementation((sql, params, callback) =>
        callback(new Error("DB Error"))
      );

      searchPostsHandler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ message: "Database error" });
      expect(mockDb.all).not.toHaveBeenCalled();
    });
  });

  describe("parsePagination logic", () => {
    test("deve usar valores padrão para paginação e ordenação", () => {
      mockDb.get.mockImplementation((sql, params, callback) =>
        callback(null, { total: 0 })
      );
      mockDb.all.mockImplementation((sql, params, callback) =>
        callback(null, [])
      );

      getPostsHandler(mockReq, mockRes);

      const expectedSql =
        "SELECT * FROM Post ORDER BY createdAt DESC LIMIT ? OFFSET ?";
      const expectedLimit = 10;
      const expectedOffset = 0;
      expect(mockDb.all).toHaveBeenCalledWith(
        expectedSql,
        [expectedLimit, expectedOffset],
        expect.any(Function)
      );
    });

    test("deve usar valores customizados de paginação e ordenação", () => {
      mockReq.query = { page: "2", limit: "5", sort: "title", order: "asc" };
      mockDb.get.mockImplementation((sql, params, callback) =>
        callback(null, { total: 0 })
      );
      mockDb.all.mockImplementation((sql, params, callback) =>
        callback(null, [])
      );

      getPostsHandler(mockReq, mockRes);

      const expectedSql =
        "SELECT * FROM Post ORDER BY title ASC LIMIT ? OFFSET ?";
      const expectedLimit = 5;
      const expectedOffset = 5; // (page 2 - 1) * limit 5
      expect(mockDb.all).toHaveBeenCalledWith(
        expectedSql,
        [expectedLimit, expectedOffset],
        expect.any(Function)
      );
    });

    test("deve corrigir valores inválidos de ordenação", () => {
      mockReq.query = { sort: "injection;", order: "drop table;" };
      mockDb.get.mockImplementation((sql, params, callback) =>
        callback(null, { total: 0 })
      );
      mockDb.all.mockImplementation((sql, params, callback) =>
        callback(null, [])
      );

      getPostsHandler(mockReq, mockRes);

      const expectedSql =
        "SELECT * FROM Post ORDER BY createdAt DESC LIMIT ? OFFSET ?";
      expect(mockDb.all).toHaveBeenCalledWith(
        expectedSql,
        [10, 0],
        expect.any(Function)
      );
    });
  });
});
