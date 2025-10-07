import express from 'express';
import { getDatabase } from '../persistence/sqlite.js';

const router = express.Router();

function parsePagination(query) {
  const page = Math.max(parseInt(query.page || '1', 10), 1);
  const limit = Math.min(Math.max(parseInt(query.limit || '10', 10), 1), 100);
  const offset = (page - 1) * limit;
  const sort = ['createdAt', 'updatedAt', 'title'].includes(query.sort) ? query.sort : 'createdAt';
  const order = (query.order || 'desc').toLowerCase() === 'asc' ? 'ASC' : 'DESC';
  return { page, limit, offset, sort, order };
}

router.get('/posts', (req, res) => {
  const db = getDatabase();
  const { limit, offset, sort, order } = parsePagination(req.query);

  const countSql = 'SELECT COUNT(1) as total FROM Post';
  const listSql = `SELECT * FROM Post ORDER BY ${sort} ${order} LIMIT ? OFFSET ?`;

  db.get(countSql, [], (countErr, countRow) => {
    if (countErr) return res.status(500).json({ message: 'Database error' });
    const total = countRow?.total || 0;
    db.all(listSql, [limit, offset], (listErr, rows) => {
      if (listErr) return res.status(500).json({ message: 'Database error' });
      return res.json({ total, items: rows });
    });
  });
});

router.get('/posts/search', (req, res) => {
  const db = getDatabase();
  const q = String(req.query.q || '').trim();
  if (!q) {
    return res.status(400).json({ message: 'Query param q is required' });
  }
  const { limit, offset, sort, order } = parsePagination(req.query);
  const like = `%${q}%`;

  const countSql = 'SELECT COUNT(1) as total FROM Post WHERE title LIKE ? OR content LIKE ?';
  const listSql = `SELECT * FROM Post WHERE title LIKE ? OR content LIKE ? ORDER BY ${sort} ${order} LIMIT ? OFFSET ?`;

  db.get(countSql, [like, like], (countErr, countRow) => {
    if (countErr) return res.status(500).json({ message: 'Database error' });
    const total = countRow?.total || 0;
    db.all(listSql, [like, like, limit, offset], (listErr, rows) => {
      if (listErr) return res.status(500).json({ message: 'Database error' });
      return res.json({ total, items: rows });
    });
  });
});

export default router;

