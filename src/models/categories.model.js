import { and, eq } from "drizzle-orm";
import { getDb } from "../db/index.js";
import { category } from "../db/schema.js";

export async function getCategoryById(id) {
  const db = getDb();
  if (!db) throw new Error("Database not configured");
  const rows = await db.select().from(category).where(eq(category.id, id));
  return rows[0] ?? null;
}

export async function existsActiveCategoryById(id) {
  const db = getDb();
  if (!db) throw new Error("Database not configured");
  const rows = await db
    .select({ id: category.id })
    .from(category)
    .where(and(eq(category.id, id), eq(category.isActive, 1)));
  return rows.length > 0;
}
