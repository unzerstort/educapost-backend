import { getDatabase } from "../persistence/sqlite.js";

export function countAllPosts(callback) {
  const db = getDatabase();
  db.get("SELECT COUNT(1) as total FROM Post", [], (err, row) => {
    if (err) return callback(err);
    callback(null, row?.total || 0);
  });
}

export function listPosts({ limit, offset, sort, order }, callback) {
  const db = getDatabase();
  const sql = `SELECT * FROM Post ORDER BY ${sort} ${order} LIMIT ? OFFSET ?`;
  db.all(sql, [limit, offset], (err, rows) => {
    if (err) return callback(err);
    callback(null, rows || []);
  });
}

export function countPostsByQuery({ like }, callback) {
  const db = getDatabase();
  const sql = "SELECT COUNT(1) as total FROM Post WHERE title LIKE ? OR content LIKE ?";
  db.get(sql, [like, like], (err, row) => {
    if (err) return callback(err);
    callback(null, row?.total || 0);
  });
}

export function searchPosts({ like, limit, offset, sort, order }, callback) {
  const db = getDatabase();
  const sql = `SELECT * FROM Post WHERE title LIKE ? OR content LIKE ? ORDER BY ${sort} ${order} LIMIT ? OFFSET ?`;
  db.all(sql, [like, like, limit, offset], (err, rows) => {
    if (err) return callback(err);
    callback(null, rows || []);
  });
}

export function getPostById(id, callback) {
  const db = getDatabase();
  db.get("SELECT * FROM Post WHERE id = ?", [id], (err, row) => {
    if (err) return callback(err);
    callback(null, row || null);
  });
}

export function insertPost({ title, content, createdAt, updatedAt, author, categoryId }, callback) {
  const db = getDatabase();
  const sql = "INSERT INTO Post (title, content, createdAt, updatedAt, author, categoryId) VALUES (?, ?, ?, ?, ?, ?)";
  db.run(sql, [title, content, createdAt, updatedAt, author, categoryId], function (err) {
    if (err) return callback(err);
    callback(null, this.lastID);
  });
}

export function updatePost({ id, title, content, updatedAt, author, categoryId }, callback) {
  const db = getDatabase();
  const sql = "UPDATE Post SET title = ?, content = ?, updatedAt = ?, author = ?, categoryId = ? WHERE id = ?";
  db.run(sql, [title, content, updatedAt, author, categoryId, id], (err) => {
    if (err) return callback(err);
    callback(null);
  });
}

export function deletePostById(id, callback) {
  const db = getDatabase();
  db.run("DELETE FROM Post WHERE id = ?", [id], (err) => {
    if (err) return callback(err);
    callback(null);
  });
}

export function existsPostById(id, callback) {
  const db = getDatabase();
  db.get("SELECT id FROM Post WHERE id = ?", [id], (err, row) => {
    if (err) return callback(err);
    callback(null, Boolean(row));
  });
}


