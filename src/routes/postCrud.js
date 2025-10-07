import express from "express";
import { getDatabase, getIsoNow } from "../persistence/sqlite.js";

const router = express.Router();

function validatePostPayload(body) {
  const errors = [];
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const content = typeof body.content === "string" ? body.content.trim() : "";
  const author = typeof body.author === "string" ? body.author.trim() : "";
  const categoryId = body.categoryId == null ? null : Number(body.categoryId);

  if (!title || title.length < 3)
    errors.push("title must be at least 3 characters");
  if (!content) errors.push("content is required");
  if (!author || author.length < 2)
    errors.push("author must be at least 2 characters");
  if (
    categoryId !== null &&
    (!Number.isInteger(categoryId) || categoryId <= 0)
  ) {
    errors.push("categoryId must be a positive integer when provided");
  }

  return { errors, title, content, author, categoryId };
}

function ensureActiveCategoryIfProvided(db, categoryId, cb) {
  if (categoryId == null) return cb(null, true);
  db.get(
    "SELECT id FROM Category WHERE id = ? AND isActive = 1",
    [categoryId],
    (err, row) => {
      if (err) return cb(err);
      if (!row) return cb(null, false);
      return cb(null, true);
    },
  );
}

router.post("/posts", (req, res) => {
  const db = getDatabase();
  const { errors, title, content, author, categoryId } = validatePostPayload(
    req.body || {},
  );
  if (errors.length)
    return res.status(400).json({ message: "Validation failed", errors });

  ensureActiveCategoryIfProvided(db, categoryId, (catErr, ok) => {
    if (catErr) return res.status(500).json({ message: "Database error" });
    if (!ok)
      return res
        .status(400)
        .json({ message: "categoryId must reference an active category" });

    const createdAt = getIsoNow();
    const updatedAt = createdAt;
    const sql =
      "INSERT INTO Post (title, content, createdAt, updatedAt, author, categoryId) VALUES (?, ?, ?, ?, ?, ?)";
    db.run(
      sql,
      [title, content, createdAt, updatedAt, author, categoryId],
      function (err) {
        if (err) return res.status(500).json({ message: "Database error" });
        return res
          .status(201)
          .json({
            id: this.lastID,
            title,
            content,
            createdAt,
            updatedAt,
            author,
            categoryId,
          });
      },
    );
  });
});

router.put("/posts/:id", (req, res) => {
  const db = getDatabase();
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id) || id <= 0)
    return res.status(400).json({ message: "Invalid id" });

  const { errors, title, content, author, categoryId } = validatePostPayload(
    req.body || {},
  );
  if (errors.length)
    return res.status(400).json({ message: "Validation failed", errors });

  db.get("SELECT id FROM Post WHERE id = ?", [id], (getErr, existing) => {
    if (getErr) return res.status(500).json({ message: "Database error" });
    if (!existing) return res.status(404).json({ message: "Post not found" });

    ensureActiveCategoryIfProvided(db, categoryId, (catErr, ok) => {
      if (catErr) return res.status(500).json({ message: "Database error" });
      if (!ok)
        return res
          .status(400)
          .json({ message: "categoryId must reference an active category" });

      const updatedAt = getIsoNow();
      const sql =
        "UPDATE Post SET title = ?, content = ?, updatedAt = ?, author = ?, categoryId = ? WHERE id = ?";
      db.run(
        sql,
        [title, content, updatedAt, author, categoryId, id],
        (err) => {
          if (err) return res.status(500).json({ message: "Database error" });
          return res.json({
            id,
            title,
            content,
            author,
            categoryId,
            updatedAt,
          });
        },
      );
    });
  });
});

router.delete("/posts/:id", (req, res) => {
  const db = getDatabase();
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id) || id <= 0)
    return res.status(400).json({ message: "Invalid id" });

  db.get("SELECT id FROM Post WHERE id = ?", [id], (getErr, existing) => {
    if (getErr) return res.status(500).json({ message: "Database error" });
    if (!existing) return res.status(404).json({ message: "Post not found" });

    db.run("DELETE FROM Post WHERE id = ?", [id], (err) => {
      if (err) return res.status(500).json({ message: "Database error" });
      return res.status(204).send();
    });
  });
});

export default router;
