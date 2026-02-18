import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { getDb } from "../db/index.js";
import { student, teacher } from "../db/schema.js";
import { signToken } from "../auth/jwt.js";

export async function login(req, res) {
  try {
    const { email, password, role } = req.body || {};
    const emailStr = typeof email === "string" ? email.trim() : "";
    const passwordStr = typeof password === "string" ? password : "";

    if (!emailStr || !passwordStr) {
      return res.status(400).json({
        message: "Validation failed",
        errors: ["email and password are required"],
      });
    }

    if (role !== "teacher" && role !== "student") {
      return res.status(400).json({
        message: "Validation failed",
        errors: ["role must be 'teacher' or 'student'"],
      });
    }

    const db = getDb();
    if (!db) {
      return res.status(500).json({ message: "Database not configured" });
    }

    if (role === "teacher") {
      const rows = await db.select().from(teacher).where(eq(teacher.email, emailStr));
      const user = rows[0];
      if (!user || !(await bcrypt.compare(passwordStr, user.passwordHash))) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      const token = signToken({ role: "teacher", id: user.id });
      return res.json({
        token,
        role: "teacher",
        id: user.id,
        name: user.name,
        email: user.email,
      });
    }

    const rows = await db.select().from(student).where(eq(student.email, emailStr));
    const user = rows[0];
    if (!user || !(await bcrypt.compare(passwordStr, user.passwordHash))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    const token = signToken({ role: "student", id: user.id });
    return res.json({
      token,
      role: "student",
      id: user.id,
      name: user.name,
      email: user.email,
    });
  } catch {
    return res.status(500).json({ message: "Database error" });
  }
}
