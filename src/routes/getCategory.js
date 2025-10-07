import express from "express";
import { getDatabase } from "../persistence/sqlite.js";

const router = express.Router();

router.get("/categories/:id", (req, res) => {
  const db = getDatabase();
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id) || id <= 0) return res.status(400).json({ message: "Invalid id" });

  db.get("SELECT * FROM Category WHERE id = ?", [id], (err, row) => {
    if (err) return res.status(500).json({ message: "Database error" });
    if (!row) return res.status(404).json({ message: "Category not found" });
    return res.json(row);
  });
});

export default router;


