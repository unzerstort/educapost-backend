import { eq } from "drizzle-orm";
import { getDb } from "../db/index.js";
import { student } from "../db/schema.js";

export async function getStudentById(id) {
  const db = getDb();
  if (!db) throw new Error("Database not configured");
  const rows = await db.select().from(student).where(eq(student.id, id));
  return rows[0] ?? null;
}

export async function getStudentByEmail(email) {
  const db = getDb();
  if (!db) throw new Error("Database not configured");
  const rows = await db.select().from(student).where(eq(student.email, email));
  return rows[0] ?? null;
}

export async function listStudents() {
  const db = getDb();
  if (!db) throw new Error("Database not configured");
  return db.select({
    id: student.id,
    name: student.name,
    email: student.email,
    createdAt: student.createdAt,
  }).from(student);
}

export async function createStudent({ name, email, passwordHash }) {
  const db = getDb();
  if (!db) throw new Error("Database not configured");
  const rows = await db
    .insert(student)
    .values({ name, email, passwordHash })
    .returning({ id: student.id, name: student.name, email: student.email, createdAt: student.createdAt });
  return rows[0] ?? null;
}

export async function updateStudent(id, { name, email, passwordHash }) {
  const db = getDb();
  if (!db) throw new Error("Database not configured");
  const updates = {};
  if (name !== undefined) updates.name = name;
  if (email !== undefined) updates.email = email;
  if (passwordHash !== undefined) updates.passwordHash = passwordHash;
  if (Object.keys(updates).length === 0) return null;
  const rows = await db
    .update(student)
    .set(updates)
    .where(eq(student.id, id))
    .returning({ id: student.id, name: student.name, email: student.email, createdAt: student.createdAt });
  return rows[0] ?? null;
}

export async function deleteStudentById(id) {
  const db = getDb();
  if (!db) throw new Error("Database not configured");
  await db.delete(student).where(eq(student.id, id));
}
