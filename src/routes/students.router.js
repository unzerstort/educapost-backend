import express from "express";
import { requireStudent, requireTeacher } from "../auth/middleware.js";
import {
  getStudents,
  getStudentByIdHandler,
  getMeStudent,
  createStudentHandler,
  updateMeStudent,
  updateStudentByIdHandler,
  deleteMeStudent,
  deleteStudentByIdHandler,
} from "../controllers/students.controller.js";

const router = express.Router();

router.get("/students/me", requireStudent, getMeStudent);
router.put("/students/me", requireStudent, updateMeStudent);
router.delete("/students/me", requireStudent, deleteMeStudent);

router.get("/students", requireTeacher, getStudents);
router.get("/students/:id", requireTeacher, getStudentByIdHandler);
router.post("/students", requireTeacher, createStudentHandler);
router.put("/students/:id", requireTeacher, updateStudentByIdHandler);
router.delete("/students/:id", requireTeacher, deleteStudentByIdHandler);

export default router;
