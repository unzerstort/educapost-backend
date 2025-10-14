import { getCategoryById } from "../models/categories.model.js";

export function getCategory(req, res) {
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id) || id <= 0) return res.status(400).json({ message: "Invalid id" });
  getCategoryById(id, (err, row) => {
    if (err) return res.status(500).json({ message: "Database error" });
    if (!row) return res.status(404).json({ message: "Category not found" });
    return res.json(row);
  });
}


