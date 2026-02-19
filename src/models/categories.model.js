import { and, asc, eq } from "drizzle-orm";
import { getDb } from "../db/index.js";
import { category } from "../db/schema.js";

/** Lista categorias ativas ordenadas por order e id (para consumo no front). */
export async function getActiveCategories() {
  const db = getDb();
  if (!db) throw new Error("Database not configured");
  return db
    .select()
    .from(category)
    .where(eq(category.isActive, 1))
    .orderBy(asc(category.order), asc(category.id));
}

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
