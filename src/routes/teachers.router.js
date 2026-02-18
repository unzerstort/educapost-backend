import express from "express";
import { requireAuth, requireTeacher } from "../auth/middleware.js";
import {
  getTeachers,
  getTeacherByIdHandler,
  getMeTeacher,
  createTeacherHandler,
  updateMeTeacher,
  updateTeacherByIdHandler,
  deleteMeTeacher,
  deleteTeacherByIdHandler,
} from "../controllers/teachers.controller.js";

const router = express.Router();

router.get("/teachers/me", requireTeacher, getMeTeacher);
router.put("/teachers/me", requireTeacher, updateMeTeacher);
router.delete("/teachers/me", requireTeacher, deleteMeTeacher);

router.get("/teachers", requireTeacher, getTeachers);
router.get("/teachers/:id", requireTeacher, getTeacherByIdHandler);
router.post("/teachers", requireTeacher, createTeacherHandler);
router.put("/teachers/:id", requireTeacher, updateTeacherByIdHandler);
router.delete("/teachers/:id", requireTeacher, deleteTeacherByIdHandler);

export default router;
