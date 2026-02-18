import express from "express";
import { requireAuth, requireTeacher } from "../auth/middleware.js";
import {
  getPosts,
  searchPostsController,
  getPost,
  createPost,
  updatePostController,
  deletePost,
} from "../controllers/posts.controller.js";

const router = express.Router();

router.get("/posts", requireAuth, getPosts);
router.get("/posts/search", requireAuth, searchPostsController);
router.get("/posts/:id", requireAuth, getPost);
router.post("/posts", requireTeacher, createPost);
router.put("/posts/:id", requireTeacher, updatePostController);
router.delete("/posts/:id", requireTeacher, deletePost);

export default router;
