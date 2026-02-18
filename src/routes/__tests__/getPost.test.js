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

const route = postsRouter.stack.find(
  (l) => l.route.path === "/posts/:id" && l.route.methods.get
).route;
const getPostHandler = route.stack[route.stack.length - 1].handle;

describe("GET /posts/:id Handler", () => {
  let mockReq;
  let mockRes;

  beforeEach(() => {
    vi.clearAllMocks();
    mockReq = { params: {} };
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
  });

  test("deve retornar um post e status 200 quando o post é encontrado", async () => {
    const postId = 1;
    const mockPost = {
      id: postId,
      title: "Post de Teste",
      content: "Conteúdo",
    };
    mockReq.params.id = postId.toString();
    postsModel.getPostById.mockResolvedValue(mockPost);

    await getPostHandler(mockReq, mockRes);

    expect(postsModel.getPostById).toHaveBeenCalledWith(postId);
    expect(mockRes.json).toHaveBeenCalledWith(mockPost);
    expect(mockRes.status).not.toHaveBeenCalled();
  });

  test("deve retornar um erro 404 quando o post não é encontrado", async () => {
    const postId = 999;
    mockReq.params.id = postId.toString();
    postsModel.getPostById.mockResolvedValue(null);

    await getPostHandler(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(404);
    expect(mockRes.json).toHaveBeenCalledWith({ message: "Post not found" });
  });

  test("deve retornar um erro 400 para um ID inválido (não numérico)", async () => {
    mockReq.params.id = "abc";

    await getPostHandler(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({ message: "Invalid id" });
    expect(postsModel.getPostById).not.toHaveBeenCalled();
  });

  test("deve retornar um erro 400 para um ID igual a zero", async () => {
    mockReq.params.id = "0";

    await getPostHandler(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({ message: "Invalid id" });
    expect(postsModel.getPostById).not.toHaveBeenCalled();
  });

  test("deve retornar um erro 500 se ocorrer um erro no banco de dados", async () => {
    const postId = 1;
    mockReq.params.id = postId.toString();
    postsModel.getPostById.mockRejectedValue(new Error("Falha na conexão"));

    await getPostHandler(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({ message: "Database error" });
  });
});
