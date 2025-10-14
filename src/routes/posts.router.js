import express from "express";
import {
  getPosts,
  searchPostsController,
  getPost,
  createPost,
  updatePostController,
  deletePost,
} from "../controllers/posts.controller.js";

const router = express.Router();

router.get('/posts', getPosts);
router.get('/posts/search', searchPostsController);
router.get('/posts/:id', getPost);
router.post('/posts', createPost);
router.put('/posts/:id', updatePostController);
router.delete('/posts/:id', deletePost);

export default router;


