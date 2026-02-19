import { verifyToken } from "./jwt.js";
import { getDb } from "../db/index.js";
import { student, teacher } from "../db/schema.js";
import { eq } from "drizzle-orm";

/**
 * Middleware que exige autenticação (teacher ou student).
 * Anexa req.teacher (se role teacher) ou req.student (se role student) e req.auth = { role, id }.
 */
export async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null;

  if (!token) {
    return res.status(401).json({ message: "Authentication required" });
  }

  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }

  const db = getDb();
  if (!db) {
    return res.status(500).json({ message: "Database not configured" });
  }

  try {
    if (payload.role === "teacher") {
      const rows = await db.select().from(teacher).where(eq(teacher.id, payload.id));
      if (rows.length === 0) {
        return res.status(401).json({ message: "Teacher not found" });
      }
      req.teacher = rows[0];
      req.student = null;
    } else {
      const rows = await db.select().from(student).where(eq(student.id, payload.id));
      if (rows.length === 0) {
        return res.status(401).json({ message: "Student not found" });
      }
      req.student = rows[0];
      req.teacher = null;
    }
    req.auth = payload;
    next();
  } catch {
    return res.status(500).json({ message: "Database error" });
  }
}

/**
 * Middleware que exige role student. Anexa req.student.
 */
export async function requireStudent(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null;

  if (!token) {
    return res.status(401).json({ message: "Authentication required" });
  }

  const payload = verifyToken(token);
  if (!payload || payload.role !== "student") {
    return res.status(403).json({ message: "Student role required" });
  }

  const db = getDb();
  if (!db) {
    return res.status(500).json({ message: "Database not configured" });
  }

  try {
    const rows = await db.select().from(student).where(eq(student.id, payload.id));
    if (rows.length === 0) {
      return res.status(401).json({ message: "Student not found" });
    }
    req.student = rows[0];
    req.auth = payload;
    next();
  } catch {
    return res.status(500).json({ message: "Database error" });
  }
}

/**
 * Middleware que exige role teacher. Deve ser usado após requireAuth ou sozinho (valida token e anexa req.teacher).
 */
export async function requireTeacher(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null;

  if (!token) {
    return res.status(401).json({ message: "Authentication required" });
  }

  const payload = verifyToken(token);
  if (!payload || payload.role !== "teacher") {
    return res.status(403).json({ message: "Teacher role required" });
  }

  const db = getDb();
  if (!db) {
    return res.status(500).json({ message: "Database not configured" });
  }

  try {
    const rows = await db.select().from(teacher).where(eq(teacher.id, payload.id));
    if (rows.length === 0) {
      return res.status(401).json({ message: "Teacher not found" });
    }
    req.teacher = rows[0];
    req.auth = payload;
    next();
  } catch {
    return res.status(500).json({ message: "Database error" });
  }
}
