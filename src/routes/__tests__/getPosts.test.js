import { describe, test, expect, beforeEach, vi } from "vitest";
import postsRouter from "../posts.router.js";
import * as postsModel from "../../models/posts.model.js";

vi.mock("../../models/posts.model.js");
vi.mock("../../auth/middleware.js", () => ({
  requireAuth: (req, res, next) => {
    req.teacher = { id: 1 };
    next();
  },
  requireTeacher: (req, res, next) => next(),
  requireStudent: (req, res, next) => next(),
}));

const getPostsRoute = postsRouter.stack.find(
  (layer) => layer.route.path === "/posts"
).route;
const searchPostsRoute = postsRouter.stack.find(
  (layer) => layer.route.path === "/posts/search"
).route;
const getPostsHandler = getPostsRoute.stack[getPostsRoute.stack.length - 1].handle;
const searchPostsHandler = searchPostsRoute.stack[searchPostsRoute.stack.length - 1].handle;

describe("List and Search Posts", () => {
  let mockReq;
  let mockRes;

  beforeEach(() => {
    vi.clearAllMocks();
    mockReq = { query: {} };
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
  });

  describe("GET /posts", () => {
    test("deve retornar a lista de posts com sucesso", async () => {
      const mockPosts = [{ id: 1, title: "Post 1" }];
      postsModel.countAllPosts.mockResolvedValue(1);
      postsModel.listPosts.mockResolvedValue(mockPosts);

      await getPostsHandler(mockReq, mockRes);

      expect(postsModel.countAllPosts).toHaveBeenCalled();
      expect(postsModel.listPosts).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith({ total: 1, items: mockPosts });
    });

    test("deve retornar erro 500 se a contagem no banco falhar", async () => {
      postsModel.countAllPosts.mockRejectedValue(new Error("DB Error"));

      await getPostsHandler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ message: "Database error" });
      expect(postsModel.listPosts).not.toHaveBeenCalled();
    });

    test("deve retornar erro 500 se a busca da lista no banco falhar", async () => {
      postsModel.countAllPosts.mockResolvedValue(1);
      postsModel.listPosts.mockRejectedValue(new Error("DB Error"));

      await getPostsHandler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ message: "Database error" });
    });
  });

  describe("GET /posts/search", () => {
    test("deve retornar os resultados da busca com sucesso", async () => {
      mockReq.query.q = "educação";
      const mockResults = [{ id: 2, title: "Post sobre educação" }];
      postsModel.countPostsByQuery.mockResolvedValue(1);
      postsModel.searchPosts.mockResolvedValue(mockResults);

      await searchPostsHandler(mockReq, mockRes);

      expect(postsModel.countPostsByQuery).toHaveBeenCalledWith(
        expect.objectContaining({ like: "educação" })
      );
      expect(postsModel.searchPosts).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith({
        total: 1,
        items: mockResults,
      });
    });

    test('deve retornar erro 400 se o parâmetro "q" estiver faltando', async () => {
      await searchPostsHandler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Query param q is required",
      });
      expect(postsModel.countPostsByQuery).not.toHaveBeenCalled();
    });

    test("deve retornar erro 500 se a contagem da busca falhar", async () => {
      mockReq.query.q = "teste";
      postsModel.countPostsByQuery.mockRejectedValue(new Error("DB Error"));

      await searchPostsHandler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Database error",
      });
      expect(postsModel.searchPosts).not.toHaveBeenCalled();
    });
  });

  describe("parsePagination logic", () => {
    test("deve usar valores padrão para paginação e ordenação", async () => {
      postsModel.countAllPosts.mockResolvedValue(0);
      postsModel.listPosts.mockResolvedValue([]);

      await getPostsHandler(mockReq, mockRes);

      expect(postsModel.listPosts).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: 10,
          offset: 0,
          sort: "createdAt",
          order: "DESC",
        })
      );
    });

    test("deve usar valores customizados de paginação e ordenação", async () => {
      mockReq.query = { page: "2", limit: "5", sort: "title", order: "asc" };
      postsModel.countAllPosts.mockResolvedValue(0);
      postsModel.listPosts.mockResolvedValue([]);

      await getPostsHandler(mockReq, mockRes);

      expect(postsModel.listPosts).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: 5,
          offset: 5,
          sort: "title",
          order: "ASC",
        })
      );
    });

    test("deve corrigir valores inválidos de ordenação", async () => {
      mockReq.query = { sort: "injection;", order: "drop table;" };
      postsModel.countAllPosts.mockResolvedValue(0);
      postsModel.listPosts.mockResolvedValue([]);

      await getPostsHandler(mockReq, mockRes);

      expect(postsModel.listPosts).toHaveBeenCalledWith(
        expect.objectContaining({
          sort: "createdAt",
          order: "DESC",
        })
      );
    });
  });
});
