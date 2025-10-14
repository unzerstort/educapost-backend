import { getDatabase } from "../persistence/sqlite.js";

export function getCategoryById(id, callback) {
  const db = getDatabase();
  db.get("SELECT * FROM Category WHERE id = ?", [id], (err, row) => {
    if (err) return callback(err);
    callback(null, row || null);
  });
}

export function existsActiveCategoryById(id, callback) {
  const db = getDatabase();
  db.get("SELECT id FROM Category WHERE id = ? AND isActive = 1", [id], (err, row) => {
    if (err) return callback(err);
    callback(null, Boolean(row));
  });
}


