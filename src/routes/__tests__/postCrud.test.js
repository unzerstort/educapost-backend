import { describe, test, expect, beforeEach, vi } from "vitest";
import postsRouter from "../posts.router.js";
import * as postsModel from "../../models/posts.model.js";
import * as categoriesModel from "../../models/categories.model.js";
import * as db from "../../db/index.js";

vi.mock("../../models/posts.model.js");
vi.mock("../../models/categories.model.js");
vi.mock("../../db/index.js");
vi.mock("../../auth/middleware.js", () => ({
  requireAuth: (req, res, next) => next(),
  requireTeacher: (req, res, next) => {
    req.teacher = { id: 1 };
    next();
  },
  requireStudent: (req, res, next) => next(),
}));

const postRoute = postsRouter.stack.find(
  (l) => l.route.path === "/posts" && l.route.methods.post
).route;
const putRoute = postsRouter.stack.find(
  (l) => l.route.path === "/posts/:id" && l.route.methods.put
).route;
const deleteRoute = postsRouter.stack.find(
  (l) => l.route.path === "/posts/:id" && l.route.methods.delete
).route;
const postHandler = postRoute.stack[postRoute.stack.length - 1].handle;
const putHandler = putRoute.stack[putRoute.stack.length - 1].handle;
const deleteHandler = deleteRoute.stack[deleteRoute.stack.length - 1].handle;

describe("POST, PUT, DELETE /posts", () => {
  let mockReq;
  let mockRes;
  const mockNow = "2025-10-08T11:40:00.000Z";
  const validPayload = {
    title: "Título Válido",
    content: "Conteúdo do post.",
    categoryId: 1,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    db.getIsoNow.mockReturnValue(mockNow);
    mockReq = { body: {}, params: {}, teacher: { id: 1, name: "Test" } };
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
      send: vi.fn(),
    };
    categoriesModel.existsActiveCategoryById.mockResolvedValue(true);
    postsModel.getPostById.mockResolvedValue({
      id: 1,
      teacherId: 1,
      title: "Título",
      content: "Conteúdo",
      author: "Test",
      categoryId: 1,
    });
    postsModel.insertPost.mockResolvedValue(123);
    postsModel.updatePost.mockResolvedValue(undefined);
    postsModel.deletePostById.mockResolvedValue(undefined);
  });

  describe("POST /posts", () => {
    test("deve criar um post e retornar 201 com dados válidos", async () => {
      mockReq.body = validPayload;
      await postHandler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        id: 123,
        ...validPayload,
        createdAt: mockNow,
        updatedAt: mockNow,
        author: "Test",
        teacherId: 1,
      });
    });

    test("deve criar um post sem categoryId", async () => {
      const { categoryId, ...payloadSemCategoria } = validPayload;
      mockReq.body = payloadSemCategoria;
      await postHandler(mockReq, mockRes);

      expect(categoriesModel.existsActiveCategoryById).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ id: 123, categoryId: null })
      );
    });

    test("deve retornar 400 se a validação do payload falhar", async () => {
      mockReq.body = { title: "a" };
      await postHandler(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    test("deve retornar 400 se categoryId for inválido", async () => {
      mockReq.body = { ...validPayload, categoryId: -5 };
      await postHandler(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          errors: expect.arrayContaining([
            "categoryId must be a positive integer when provided",
          ]),
        })
      );
    });

    test("deve retornar 400 se a categoria informada não estiver ativa", async () => {
      mockReq.body = validPayload;
      categoriesModel.existsActiveCategoryById.mockResolvedValue(false);
      await postHandler(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    test("deve retornar 500 se a verificação de categoria falhar", async () => {
      mockReq.body = validPayload;
      categoriesModel.existsActiveCategoryById.mockRejectedValue(
        new Error("DB Error")
      );
      await postHandler(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(500);
    });

    test("deve retornar 500 se a inserção no banco falhar", async () => {
      mockReq.body = validPayload;
      postsModel.insertPost.mockRejectedValue(new Error("DB Error"));
      await postHandler(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe("PUT /posts/:id", () => {
    test("deve atualizar um post e retornar 200 com dados válidos", async () => {
      mockReq.params.id = "1";
      mockReq.body = validPayload;
      await putHandler(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        id: 1,
        ...validPayload,
        author: "Test",
        updatedAt: mockNow,
      });
    });

    test("deve retornar 404 se o post a ser atualizado não existir", async () => {
      mockReq.params.id = "999";
      mockReq.body = validPayload;
      postsModel.getPostById.mockResolvedValue(null);
      await putHandler(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    test("deve retornar 500 se a verificação de existência do post falhar", async () => {
      mockReq.params.id = "1";
      mockReq.body = validPayload;
      postsModel.getPostById.mockRejectedValue(new Error("DB Error"));
      await putHandler(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(500);
    });

    test("deve retornar 400 ao atualizar se categoryId for inativo", async () => {
      mockReq.params.id = "1";
      mockReq.body = { ...validPayload, categoryId: 99 };
      categoriesModel.existsActiveCategoryById.mockResolvedValue(false);
      await putHandler(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe("DELETE /posts/:id", () => {
    test("deve deletar um post e retornar 204", async () => {
      mockReq.params.id = "1";
      await deleteHandler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(204);
      expect(mockRes.send).toHaveBeenCalled();
    });

    test("deve retornar 404 se o post a ser deletado não existir", async () => {
      mockReq.params.id = "999";
      postsModel.getPostById.mockResolvedValue(null);
      await deleteHandler(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    test("deve retornar 500 se a verificação de existência do post falhar", async () => {
      mockReq.params.id = "1";
      postsModel.getPostById.mockRejectedValue(new Error("DB Error"));
      await deleteHandler(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });
});
