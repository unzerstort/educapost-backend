import { describe, test, expect, beforeEach, vi } from "vitest";
import fs from "node:fs";

vi.mock("node:fs");

vi.mock("sqlite3", () => {
  const mockDb = {
    serialize: vi.fn((cb) => cb()),
    run: vi.fn(function (sql, params, callback) {
      const cb = typeof params === "function" ? params : callback;
      if (typeof cb === "function") {
        cb.call(this, null);
      }
    }),
    get: vi.fn(),
    prepare: vi.fn(() => ({
      run: vi.fn(),
      finalize: vi.fn(),
    })),
  };
  return {
    default: {
      verbose: vi.fn(() => ({})),
      Database: vi.fn(() => mockDb),
    },
  };
});

describe("Database Persistence Logic", () => {
  let getDatabase, getIsoNow, sqlite3;

  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();

    const dbModule = await import("../sqlite.js");
    getDatabase = dbModule.getDatabase;
    getIsoNow = dbModule.getIsoNow;
    sqlite3 = (await import("sqlite3")).default;
  });

  test("getIsoNow deve retornar uma string de data no formato ISO", () => {
    const now = getIsoNow();
    const date = new Date(now);
    expect(date.toISOString()).toBe(now);
  });

  describe("getDatabase", () => {
    test("deve retornar a mesma instância do banco de dados (singleton)", () => {
      const db1 = getDatabase();
      const db2 = getDatabase();
      expect(db1).toBe(db2);
      expect(sqlite3.Database).toHaveBeenCalledTimes(1);
    });

    test('deve criar o diretório "data" se ele não existir', () => {
      fs.existsSync.mockReturnValue(false);
      getDatabase();
      expect(fs.mkdirSync).toHaveBeenCalledWith(expect.any(String), {
        recursive: true,
      });
    });

    test('NÃO deve criar o diretório "data" se ele já existir', () => {
      fs.existsSync.mockReturnValue(true);
      getDatabase();
      expect(fs.mkdirSync).not.toHaveBeenCalled();
    });

    test("deve criar as tabelas e inserir seeds em um banco de dados vazio", async () => {
      const mockDb = new sqlite3.Database();
      mockDb.get.mockImplementation((sql, params, cb) =>
        cb(null, { total: 0 })
      );

      getDatabase();

      expect(mockDb.run).toHaveBeenCalledWith(
        expect.stringContaining("CREATE TABLE IF NOT EXISTS Category")
      );
      expect(mockDb.run).toHaveBeenCalledWith(
        expect.stringContaining("CREATE TABLE IF NOT EXISTS Post")
      );

      expect(mockDb.prepare).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO Category")
      );

      const returnedMockStatement = mockDb.prepare.mock.results[0].value;
      expect(returnedMockStatement.run).toHaveBeenCalledTimes(4);

      expect(mockDb.run).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO Post"),
        expect.any(Array)
      );
    });

    test("NÃO deve inserir seeds se as tabelas já tiverem dados", async () => {
      const mockDb = new sqlite3.Database();
      mockDb.get.mockImplementation((sql, params, cb) =>
        cb(null, { total: 5 })
      );

      getDatabase();

      expect(mockDb.prepare).not.toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO Category")
      );
      expect(mockDb.run).not.toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO Post")
      );
    });
  });
});
