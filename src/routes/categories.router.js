import express from "express";
import { getCategory } from "../controllers/categories.controller.js";

const router = express.Router();

router.get('/categories/:id', getCategory);

export default router;


