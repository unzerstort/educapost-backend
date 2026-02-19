import { describe, test, expect, beforeEach, vi } from "vitest";
import categoriesRouter from "../categories.router.js";
import * as categoriesModel from "../../models/categories.model.js";

vi.mock("../../models/categories.model.js");

const route = categoriesRouter.stack.find(
  (l) => l.route.path === "/categories/:id" && l.route.methods.get
).route;
const getCategoryHandler = route.stack[route.stack.length - 1].handle;

describe("GET /categories/:id", () => {
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

  test("deve retornar uma categoria e status 200 quando encontrada", async () => {
    const categoryId = 1;
    const mockCategory = { id: categoryId, label: "Tecnologia", isActive: 1 };
    mockReq.params.id = categoryId.toString();
    categoriesModel.getCategoryById.mockResolvedValue(mockCategory);

    await getCategoryHandler(mockReq, mockRes);

    expect(categoriesModel.getCategoryById).toHaveBeenCalledWith(categoryId);
    expect(mockRes.json).toHaveBeenCalledWith(mockCategory);
    expect(mockRes.status).not.toHaveBeenCalled();
  });

  test("deve retornar erro 404 quando a categoria não é encontrada", async () => {
    const categoryId = 999;
    mockReq.params.id = categoryId.toString();
    categoriesModel.getCategoryById.mockResolvedValue(null);

    await getCategoryHandler(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(404);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: "Category not found",
    });
  });

  test("deve retornar erro 400 para um ID inválido (não numérico)", async () => {
    mockReq.params.id = "abc";

    await getCategoryHandler(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({ message: "Invalid id" });
    expect(categoriesModel.getCategoryById).not.toHaveBeenCalled();
  });

  test("deve retornar erro 500 se ocorrer um erro no banco de dados", async () => {
    const categoryId = 1;
    mockReq.params.id = categoryId.toString();
    categoriesModel.getCategoryById.mockRejectedValue(
      new Error("Falha na conexão")
    );

    await getCategoryHandler(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({ message: "Database error" });
  });
});
