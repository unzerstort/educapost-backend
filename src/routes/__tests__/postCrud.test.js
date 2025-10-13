import { describe, test, expect, beforeEach, vi } from "vitest";
import postCrudRouter from "../postCrud.js";
import { getDatabase, getIsoNow } from "../../persistence/sqlite.js";

vi.mock("../../persistence/sqlite.js");

const postHandler = postCrudRouter.stack.find(
  (l) => l.route.path === "/posts" && l.route.methods.post
).route.stack[0].handle;
const putHandler = postCrudRouter.stack.find(
  (l) => l.route.path === "/posts/:id" && l.route.methods.put
).route.stack[0].handle;
const deleteHandler = postCrudRouter.stack.find(
  (l) => l.route.path === "/posts/:id" && l.route.methods.delete
).route.stack[0].handle;

describe("POST, PUT, DELETE /posts", () => {
  let mockReq;
  let mockRes;
  const mockDb = {
    get: vi.fn(),
    run: vi.fn(),
  };
  const mockNow = "2025-10-08T11:40:00.000Z";
  const validPayload = {
    title: "Título Válido",
    content: "Conteúdo do post.",
    author: "Autor",
    categoryId: 1,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    getDatabase.mockReturnValue(mockDb);
    getIsoNow.mockReturnValue(mockNow);
    mockReq = { body: {}, params: {} };
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
      send: vi.fn(),
    };

    // Por padrão, simulamos que todas as chamadas ao DB funcionam.
    // Os testes de erro irão sobrescrever isso conforme necessário.
    mockDb.get.mockImplementation((sql, params, cb) => cb(null, { id: 1 }));
    mockDb.run.mockImplementation(function (sql, params, callback) {
      const cb = typeof params === "function" ? params : callback;
      if (typeof cb === "function") {
        this.lastID = 123; // ID padrão para criação
        cb.call(this, null);
      }
    });
  });

  describe("POST /posts", () => {
    test("deve criar um post e retornar 201 com dados válidos", () => {
      mockReq.body = validPayload;
      postHandler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        id: 123,
        ...validPayload,
        createdAt: mockNow,
        updatedAt: mockNow,
      });
    });

    test("deve criar um post sem categoryId", () => {
      const { categoryId, ...payloadSemCategoria } = validPayload;
      mockReq.body = payloadSemCategoria;
      postHandler(mockReq, mockRes);

      expect(mockDb.get).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ id: 123, categoryId: null })
      );
    });

    test("deve retornar 400 se a validação do payload falhar", () => {
      mockReq.body = { title: "a" };
      postHandler(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    test("deve retornar 400 se categoryId for inválido", () => {
      mockReq.body = { ...validPayload, categoryId: -5 };
      postHandler(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          errors: expect.arrayContaining([
            "categoryId must be a positive integer when provided",
          ]),
        })
      );
    });

    test("deve retornar 400 se a categoria informada não estiver ativa", () => {
      mockReq.body = validPayload;
      mockDb.get.mockImplementation((sql, params, cb) => cb(null, null));
      postHandler(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    test("deve retornar 500 se a verificação de categoria falhar", () => {
      mockReq.body = validPayload;
      mockDb.get.mockImplementation((sql, params, cb) =>
        cb(new Error("DB Error"))
      );
      postHandler(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(500);
    });

    test("deve retornar 500 se a inserção no banco falhar", () => {
      mockReq.body = validPayload;
      mockDb.run.mockImplementation((sql, params, cb) =>
        cb(new Error("DB Error"))
      );
      postHandler(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe("PUT /posts/:id", () => {
    test("deve atualizar um post e retornar 200 com dados válidos", () => {
      mockReq.params.id = "1";
      mockReq.body = validPayload;
      putHandler(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        id: 1,
        ...validPayload,
        updatedAt: mockNow,
      });
    });

    test("deve retornar 404 se o post a ser atualizado não existir", () => {
      mockReq.params.id = "999";
      mockReq.body = validPayload;
      mockDb.get.mockImplementation((sql, params, cb) => cb(null, null));
      putHandler(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    test("deve retornar 500 se a verificação de existência do post falhar", () => {
      mockReq.params.id = "1";
      mockReq.body = validPayload;
      mockDb.get.mockImplementation((sql, params, cb) =>
        cb(new Error("DB Error"))
      );
      putHandler(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(500);
    });

    test("deve retornar 400 ao atualizar se categoryId for inativo", () => {
      mockReq.params.id = "1";
      mockReq.body = { ...validPayload, categoryId: 99 };
      mockDb.get
        .mockImplementationOnce((sql, params, cb) => cb(null, { id: 1 }))
        .mockImplementationOnce((sql, params, cb) => cb(null, null));
      putHandler(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe("DELETE /posts/:id", () => {
    test("deve deletar um post e retornar 204", () => {
      mockReq.params.id = "1";
      deleteHandler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(204);
      expect(mockRes.send).toHaveBeenCalled();
    });

    test("deve retornar 404 se o post a ser deletado não existir", () => {
      mockReq.params.id = "999";
      mockDb.get.mockImplementation((sql, params, cb) => cb(null, null));
      deleteHandler(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    test("deve retornar 500 se a verificação de existência do post falhar", () => {
      mockReq.params.id = "1";
      mockDb.get.mockImplementation((sql, params, cb) =>
        cb(new Error("DB Error"))
      );
      deleteHandler(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });
});
