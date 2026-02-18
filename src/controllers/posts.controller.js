import { getIsoNow } from "../db/index.js";
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
  const categoryId = body.categoryId == null ? null : Number(body.categoryId);

  if (!title || title.length < 3) errors.push("title must be at least 3 characters");
  if (!content) errors.push("content is required");
  if (categoryId !== null && (!Number.isInteger(categoryId) || categoryId <= 0)) {
    errors.push("categoryId must be a positive integer when provided");
  }

  return { errors, title, content, categoryId };
}

export async function getPosts(req, res) {
  try {
    const { limit, offset, sort, order } = parsePagination(req.query);
    const total = await countAllPosts();
    const rows = await listPosts({ limit, offset, sort, order });
    return res.json({ total, items: rows });
  } catch {
    return res.status(500).json({ message: "Database error" });
  }
}

export async function searchPostsController(req, res) {
  try {
    const q = String(req.query.q || "").trim();
    if (!q) {
      return res.status(400).json({ message: "Query param q is required" });
    }
    const { limit, offset, sort, order } = parsePagination(req.query);
    const like = q;
    const total = await countPostsByQuery({ like });
    const rows = await searchPosts({ like, limit, offset, sort, order });
    return res.json({ total, items: rows });
  } catch {
    return res.status(500).json({ message: "Database error" });
  }
}

export async function getPost(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id) || id <= 0) {
      return res.status(400).json({ message: "Invalid id" });
    }
    const row = await getPostById(id);
    if (!row) {
      return res.status(404).json({ message: "Post not found" });
    }
    return res.json(row);
  } catch {
    return res.status(500).json({ message: "Database error" });
  }
}

export async function createPost(req, res) {
  try {
    const { errors, title, content, categoryId } = validatePostPayload(
      req.body || {}
    );
    if (errors.length) {
      return res.status(400).json({ message: "Validation failed", errors });
    }

    if (categoryId != null) {
      const ok = await existsActiveCategoryById(categoryId);
      if (!ok) {
        return res
          .status(400)
          .json({ message: "categoryId must reference an active category" });
      }
    }

    const now = getIsoNow();
    const id = await insertPost({
      title,
      content,
      createdAt: now,
      updatedAt: now,
      categoryId,
      teacherId: req.teacher?.id ?? null,
    });
    return res.status(201).json({
      id,
      title,
      content,
      createdAt: now,
      updatedAt: now,
      author: req.teacher?.name ?? null,
      categoryId,
      teacherId: req.teacher?.id ?? null,
    });
  } catch {
    return res.status(500).json({ message: "Database error" });
  }
}

export async function updatePostController(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id) || id <= 0) {
      return res.status(400).json({ message: "Invalid id" });
    }
    const postRow = await getPostById(id);
    if (!postRow) {
      return res.status(404).json({ message: "Post not found" });
    }
    if (req.teacher && postRow.teacherId !== req.teacher.id) {
      return res.status(403).json({ message: "Only the post owner can edit it" });
    }
    const { errors, title, content, categoryId } = validatePostPayload(
      req.body || {}
    );
    if (errors.length) {
      return res.status(400).json({ message: "Validation failed", errors });
    }
    if (categoryId != null) {
      const ok = await existsActiveCategoryById(categoryId);
      if (!ok) {
        return res
          .status(400)
          .json({ message: "categoryId must reference an active category" });
      }
    }
    const updatedAt = getIsoNow();
    await updatePost({ id, title, content, updatedAt, categoryId });
    return res.json({
      id,
      title,
      content,
      author: req.teacher?.name ?? null,
      categoryId,
      updatedAt,
    });
  } catch {
    return res.status(500).json({ message: "Database error" });
  }
}

export async function deletePost(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id) || id <= 0) {
      return res.status(400).json({ message: "Invalid id" });
    }
    const postRow = await getPostById(id);
    if (!postRow) {
      return res.status(404).json({ message: "Post not found" });
    }
    if (req.teacher && postRow.teacherId !== req.teacher.id) {
      return res.status(403).json({ message: "Only the post owner can delete it" });
    }
    await deletePostById(id);
    return res.status(204).send();
  } catch {
    return res.status(500).json({ message: "Database error" });
  }
}
