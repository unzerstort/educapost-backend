import { asc, desc, eq, ilike, or, sql } from "drizzle-orm";
import { getDb } from "../db/index.js";
import { post, teacher } from "../db/schema.js";

const SORT_COLUMNS = {
  createdAt: post.createdAt,
  updatedAt: post.updatedAt,
  title: post.title,
};

function getOrderBy(sort, order) {
  const col = SORT_COLUMNS[sort] ?? post.createdAt;
  return order === "ASC" ? asc(col) : desc(col);
}

export async function countAllPosts() {
  const db = getDb();
  if (!db) throw new Error("Database not configured");
  const rows = await db.select({ count: sql`count(*)::int` }).from(post);
  return rows[0]?.count ?? 0;
}

export async function listPosts({ limit, offset, sort, order }) {
  const db = getDb();
  if (!db) throw new Error("Database not configured");
  const rows = await db
    .select({
      id: post.id,
      title: post.title,
      content: post.content,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      categoryId: post.categoryId,
      teacherId: post.teacherId,
      author: teacher.name,
    })
    .from(post)
    .leftJoin(teacher, eq(post.teacherId, teacher.id))
    .orderBy(getOrderBy(sort, order))
    .limit(limit)
    .offset(offset);
  return rows;
}

export async function countPostsByQuery({ like }) {
  const db = getDb();
  if (!db) throw new Error("Database not configured");
  const pattern = `%${like}%`;
  const rows = await db
    .select({ count: sql`count(*)::int` })
    .from(post)
    .where(or(ilike(post.title, pattern), ilike(post.content, pattern)));
  return rows[0]?.count ?? 0;
}

export async function searchPosts({ like, limit, offset, sort, order }) {
  const db = getDb();
  if (!db) throw new Error("Database not configured");
  const pattern = `%${like}%`;
  const rows = await db
    .select({
      id: post.id,
      title: post.title,
      content: post.content,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      categoryId: post.categoryId,
      teacherId: post.teacherId,
      author: teacher.name,
    })
    .from(post)
    .leftJoin(teacher, eq(post.teacherId, teacher.id))
    .where(or(ilike(post.title, pattern), ilike(post.content, pattern)))
    .orderBy(getOrderBy(sort, order))
    .limit(limit)
    .offset(offset);
  return rows;
}

export async function getPostById(id) {
  const db = getDb();
  if (!db) throw new Error("Database not configured");
  const rows = await db
    .select({
      id: post.id,
      title: post.title,
      content: post.content,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      categoryId: post.categoryId,
      teacherId: post.teacherId,
      author: teacher.name,
    })
    .from(post)
    .leftJoin(teacher, eq(post.teacherId, teacher.id))
    .where(eq(post.id, id));
  return rows[0] ?? null;
}

export async function insertPost({
  title,
  content,
  createdAt,
  updatedAt,
  categoryId,
  teacherId,
}) {
  const db = getDb();
  if (!db) throw new Error("Database not configured");
  const dateCreated = createdAt instanceof Date ? createdAt : new Date(createdAt);
  const dateUpdated = updatedAt instanceof Date ? updatedAt : new Date(updatedAt);
  const rows = await db
    .insert(post)
    .values({
      title,
      content,
      createdAt: dateCreated,
      updatedAt: dateUpdated,
      categoryId,
      teacherId: teacherId ?? null,
    })
    .returning({ id: post.id });
  return rows[0]?.id;
}

export async function updatePost({
  id,
  title,
  content,
  updatedAt,
  categoryId,
  teacherId,
}) {
  const db = getDb();
  if (!db) throw new Error("Database not configured");
  const dateUpdated = updatedAt instanceof Date ? updatedAt : new Date(updatedAt);
  const set = {
    title,
    content,
    updatedAt: dateUpdated,
    categoryId,
  };
  if (teacherId !== undefined) set.teacherId = teacherId;
  await db.update(post).set(set).where(eq(post.id, id));
}

export async function deletePostById(id) {
  const db = getDb();
  if (!db) throw new Error("Database not configured");
  await db.delete(post).where(eq(post.id, id));
}

export async function existsPostById(id) {
  const db = getDb();
  if (!db) throw new Error("Database not configured");
  const rows = await db.select({ id: post.id }).from(post).where(eq(post.id, id));
  return rows.length > 0;
}
