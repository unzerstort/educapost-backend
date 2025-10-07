import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sqlite3 from "sqlite3";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const databaseFilePath = path.join(
  __dirname,
  "..",
  "..",
  "data",
  "educapost.db",
);

sqlite3.verbose();

// Singleton da conexão
let databaseInstance;

function ensureTables(db) {
  // Criação das tabelas com nomes e colunas em camelCase
  db.serialize(() => {
    db.run(`
      CREATE TABLE IF NOT EXISTS Category (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        label TEXT NOT NULL,
        "order" INTEGER NOT NULL DEFAULT 0,
        isActive INTEGER NOT NULL DEFAULT 1
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS Post (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        author TEXT NOT NULL,
        categoryId INTEGER,
        FOREIGN KEY (categoryId) REFERENCES Category(id)
      )
    `);

    // Índices úteis
    db.run("CREATE INDEX IF NOT EXISTS idx_post_category ON Post(categoryId)");
    db.run("CREATE INDEX IF NOT EXISTS idx_post_createdat ON Post(createdAt)");
    db.run("CREATE INDEX IF NOT EXISTS idx_post_title ON Post(title)");

    // Seeds iniciais
    seedIfEmpty(db);
  });
}

function seedIfEmpty(db) {
  db.get("SELECT COUNT(1) as total FROM Category", [], (err, row) => {
    if (err) return; // silencioso
    const total = row?.total || 0;
    if (total === 0) {
      const stmt = db.prepare(
        'INSERT INTO Category (label, "order", isActive) VALUES (?, ?, ?)',
      );
      stmt.run(["Matemática", 1, 1]);
      stmt.run(["Português", 2, 1]);
      stmt.run(["Ciências", 3, 1]);
      stmt.run(["Arquivado", 99, 0]);
      stmt.finalize();
    }

    // Após garantir categorias, cria post demo se vazio
    db.get("SELECT COUNT(1) as total FROM Post", [], (perr, prow) => {
      if (perr) return;
      const ptotal = prow?.total || 0;
      if (ptotal === 0) {
        const now = getIsoNow();
        db.run(
          "INSERT INTO Post (title, content, createdAt, updatedAt, author, categoryId) VALUES (?, ?, ?, ?, ?, ?)",
          [
            "Boas-vindas ao EducaPost",
            "Este é um post de exemplo. Edite ou crie novos posts!",
            now,
            now,
            "Equipe EducaPost",
            1,
          ],
        );
      }
    });
  });
}

export function getDatabase() {
  if (databaseInstance) {
    return databaseInstance;
  }

  // Garante diretório data
  const dataDir = path.join(__dirname, "..", "..", "data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  databaseInstance = new sqlite3.Database(databaseFilePath);
  ensureTables(databaseInstance);
  return databaseInstance;
}

// Removidos mapeadores: schema já está em camelCase

export function getIsoNow() {
  return new Date().toISOString();
}
