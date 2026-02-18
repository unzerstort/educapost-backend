import { eq } from "drizzle-orm";
import { getDb } from "../db/index.js";
import { teacher } from "../db/schema.js";

export async function getTeacherById(id) {
  const db = getDb();
  if (!db) throw new Error("Database not configured");
  const rows = await db.select().from(teacher).where(eq(teacher.id, id));
  return rows[0] ?? null;
}

export async function getTeacherByEmail(email) {
  const db = getDb();
  if (!db) throw new Error("Database not configured");
  const rows = await db.select().from(teacher).where(eq(teacher.email, email));
  return rows[0] ?? null;
}

export async function listTeachers() {
  const db = getDb();
  if (!db) throw new Error("Database not configured");
  return db.select({
    id: teacher.id,
    name: teacher.name,
    email: teacher.email,
    createdAt: teacher.createdAt,
  }).from(teacher);
}

export async function createTeacher({ name, email, passwordHash }) {
  const db = getDb();
  if (!db) throw new Error("Database not configured");
  const rows = await db
    .insert(teacher)
    .values({ name, email, passwordHash })
    .returning({ id: teacher.id, name: teacher.name, email: teacher.email, createdAt: teacher.createdAt });
  return rows[0] ?? null;
}

export async function updateTeacher(id, { name, email, passwordHash }) {
  const db = getDb();
  if (!db) throw new Error("Database not configured");
  const updates = {};
  if (name !== undefined) updates.name = name;
  if (email !== undefined) updates.email = email;
  if (passwordHash !== undefined) updates.passwordHash = passwordHash;
  if (Object.keys(updates).length === 0) return null;
  const rows = await db
    .update(teacher)
    .set(updates)
    .where(eq(teacher.id, id))
    .returning({ id: teacher.id, name: teacher.name, email: teacher.email, createdAt: teacher.createdAt });
  return rows[0] ?? null;
}

export async function deleteTeacherById(id) {
  const db = getDb();
  if (!db) throw new Error("Database not configured");
  await db.delete(teacher).where(eq(teacher.id, id));
}
