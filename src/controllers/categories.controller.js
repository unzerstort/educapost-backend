import { getActiveCategories, getCategoryById } from "../models/categories.model.js";

export async function listCategories(req, res) {
  try {
    const rows = await getActiveCategories();
    return res.json(rows);
  } catch {
    return res.status(500).json({ message: "Database error" });
  }
}

export async function getCategory(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id) || id <= 0) {
      return res.status(400).json({ message: "Invalid id" });
    }
    const row = await getCategoryById(id);
    if (!row) {
      return res.status(404).json({ message: "Category not found" });
    }
    return res.json(row);
  } catch {
    return res.status(500).json({ message: "Database error" });
  }
}
