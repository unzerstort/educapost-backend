import { describe, test, expect, beforeEach, vi } from "vitest";
import getCategoryRouter from "../getCategory.js";
import { getDatabase } from "../../persistence/sqlite.js";

vi.mock("../../persistence/sqlite.js");

const getCategoryHandler = getCategoryRouter.stack[0].route.stack[0].handle;

describe("GET /categories/:id", () => {
  let mockReq;
  let mockRes;
  const mockDb = {
    get: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();

    getDatabase.mockReturnValue(mockDb);
    mockReq = { params: {} };
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
  });

  test("deve retornar uma categoria e status 200 quando encontrada", () => {
    const categoryId = 1;
    const mockCategory = { id: categoryId, label: "Tecnologia", isActive: 1 };
    mockReq.params.id = categoryId.toString();

    mockDb.get.mockImplementation((sql, params, callback) => {
      callback(null, mockCategory);
    });

    getCategoryHandler(mockReq, mockRes);

    expect(mockDb.get).toHaveBeenCalledWith(
      "SELECT * FROM Category WHERE id = ?",
      [categoryId],
      expect.any(Function)
    );
    expect(mockRes.json).toHaveBeenCalledWith(mockCategory);
    expect(mockRes.status).not.toHaveBeenCalled();
  });

  test("deve retornar erro 404 quando a categoria não é encontrada", () => {
    const categoryId = 999;
    mockReq.params.id = categoryId.toString();

    mockDb.get.mockImplementation((sql, params, callback) => {
      callback(null, null);
    });

    getCategoryHandler(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(404);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: "Category not found",
    });
  });

  test("deve retornar erro 400 para um ID inválido (não numérico)", () => {
    mockReq.params.id = "abc";

    getCategoryHandler(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({ message: "Invalid id" });
    expect(mockDb.get).not.toHaveBeenCalled(); // O banco não deve ser consultado
  });

  test("deve retornar erro 500 se ocorrer um erro no banco de dados", () => {
    const categoryId = 1;
    mockReq.params.id = categoryId.toString();
    const dbError = new Error("Falha na conexão");

    mockDb.get.mockImplementation((sql, params, callback) => {
      callback(dbError, null);
    });

    getCategoryHandler(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({ message: "Database error" });
  });
});
