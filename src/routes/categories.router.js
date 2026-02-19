import express from "express";
import { getCategory, listCategories } from "../controllers/categories.controller.js";

const router = express.Router();

router.get("/categories", listCategories);
router.get("/categories/:id", getCategory);

export default router;


