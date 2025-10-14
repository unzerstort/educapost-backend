import { getIsoNow } from "../persistence/sqlite.js";
import {
  countAllPosts,
  listPosts,
  countPostsByQuery,
  searchPosts,
  getPostById,
  insertPost,
  updatePost,
  deletePostById,
  existsPostById,
} from "../models/posts.model.js";
import { existsActiveCategoryById } from "../models/categories.model.js";

function parsePagination(query) {
  const page = Math.max(parseInt(query.page || "1", 10), 1);
  const limit = Math.min(Math.max(parseInt(query.limit || "10", 10), 1), 100);
  const offset = (page - 1) * limit;
  const sort = ["createdAt", "updatedAt", "title"].includes(query.sort)
    ? query.sort
    : "createdAt";
  const order = (query.order || "desc").toLowerCase() === "asc" ? "ASC" : "DESC";
  return { page, limit, offset, sort, order };
}

function validatePostPayload(body) {
  const errors = [];
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const content = typeof body.content === "string" ? body.content.trim() : "";
  const author = typeof body.author === "string" ? body.author.trim() : "";
  const categoryId = body.categoryId == null ? null : Number(body.categoryId);

  if (!title || title.length < 3) errors.push("title must be at least 3 characters");
  if (!content) errors.push("content is required");
  if (!author || author.length < 2) errors.push("author must be at least 2 characters");
  if (categoryId !== null && (!Number.isInteger(categoryId) || categoryId <= 0)) {
    errors.push("categoryId must be a positive integer when provided");
  }

  return { errors, title, content, author, categoryId };
}

export function getPosts(req, res) {
  const { limit, offset, sort, order } = parsePagination(req.query);
  countAllPosts((countErr, total) => {
    if (countErr) return res.status(500).json({ message: "Database error" });
    listPosts({ limit, offset, sort, order }, (listErr, rows) => {
      if (listErr) return res.status(500).json({ message: "Database error" });
      return res.json({ total, items: rows });
    });
  });
}

export function searchPostsController(req, res) {
  const q = String(req.query.q || "").trim();
  if (!q) return res.status(400).json({ message: "Query param q is required" });
  const { limit, offset, sort, order } = parsePagination(req.query);
  const like = `%${q}%`;
  countPostsByQuery({ like }, (countErr, total) => {
    if (countErr) return res.status(500).json({ message: "Database error" });
    searchPosts({ like, limit, offset, sort, order }, (listErr, rows) => {
      if (listErr) return res.status(500).json({ message: "Database error" });
      return res.json({ total, items: rows });
    });
  });
}

export function getPost(req, res) {
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id) || id <= 0) return res.status(400).json({ message: "Invalid id" });
  getPostById(id, (err, row) => {
    if (err) return res.status(500).json({ message: "Database error" });
    if (!row) return res.status(404).json({ message: "Post not found" });
    return res.json(row);
  });
}

export function createPost(req, res) {
  const { errors, title, content, author, categoryId } = validatePostPayload(req.body || {});
  if (errors.length) return res.status(400).json({ message: "Validation failed", errors });

  if (categoryId == null) {
    const now = getIsoNow();
    insertPost({ title, content, createdAt: now, updatedAt: now, author, categoryId }, (err, id) => {
      if (err) return res.status(500).json({ message: "Database error" });
      return res.status(201).json({ id, title, content, createdAt: now, updatedAt: now, author, categoryId });
    });
    return;
  }

  existsActiveCategoryById(categoryId, (catErr, ok) => {
    if (catErr) return res.status(500).json({ message: "Database error" });
    if (!ok) return res.status(400).json({ message: "categoryId must reference an active category" });
    const now = getIsoNow();
    insertPost({ title, content, createdAt: now, updatedAt: now, author, categoryId }, (err, id) => {
      if (err) return res.status(500).json({ message: "Database error" });
      return res.status(201).json({ id, title, content, createdAt: now, updatedAt: now, author, categoryId });
    });
  });
}

export function updatePostController(req, res) {
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id) || id <= 0) return res.status(400).json({ message: "Invalid id" });
  const { errors, title, content, author, categoryId } = validatePostPayload(req.body || {});
  if (errors.length) return res.status(400).json({ message: "Validation failed", errors });

  existsPostById(id, (getErr, exists) => {
    if (getErr) return res.status(500).json({ message: "Database error" });
    if (!exists) return res.status(404).json({ message: "Post not found" });

    const proceed = () => {
      const updatedAt = getIsoNow();
      updatePost({ id, title, content, updatedAt, author, categoryId }, (updErr) => {
        if (updErr) return res.status(500).json({ message: "Database error" });
        return res.json({ id, title, content, author, categoryId, updatedAt });
      });
    };

    if (categoryId == null) return proceed();
    existsActiveCategoryById(categoryId, (catErr, ok) => {
      if (catErr) return res.status(500).json({ message: "Database error" });
      if (!ok) return res.status(400).json({ message: "categoryId must reference an active category" });
      proceed();
    });
  });
}

export function deletePost(req, res) {
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id) || id <= 0) return res.status(400).json({ message: "Invalid id" });
  existsPostById(id, (getErr, exists) => {
    if (getErr) return res.status(500).json({ message: "Database error" });
    if (!exists) return res.status(404).json({ message: "Post not found" });
    deletePostById(id, (delErr) => {
      if (delErr) return res.status(500).json({ message: "Database error" });
      return res.status(204).send();
    });
  });
}


