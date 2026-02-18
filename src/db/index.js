import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { faker } from "@faker-js/faker";
import bcrypt from "bcryptjs";
import { category, post, student, teacher } from "./schema.js";

const connectionString = process.env.DATABASE_URL;
const db = connectionString ? drizzle(connectionString) : null;

/** Senha fixa para usuários do seed (desenvolvimento). */
export const SEED_PASSWORD = "senha123";

export function getDb() {
  return db;
}

export function getIsoNow() {
  return new Date().toISOString();
}

/** Insere categorias, professor, aluno e post inicial se as tabelas estiverem vazias. */
export async function runSeedIfEmpty() {
  if (!db) {
    console.warn(
      "Seed ignorado: DATABASE_URL não está definida. Defina no .env para rodar o seed."
    );
    return;
  }
  try {
    const categories = await db.select().from(category);
    if (categories.length === 0) {
      await db.insert(category).values([
        { label: "Matemática", order: 1, isActive: 1 },
        { label: "Português", order: 2, isActive: 1 },
        { label: "Ciências", order: 3, isActive: 1 },
        { label: "Arquivado", order: 99, isActive: 0 },
      ]);
    }

    const teachers = await db.select().from(teacher);
    if (teachers.length === 0) {
      faker.seed(42);
      const teacherName = faker.person.fullName();
      const teacherEmail = "professor@educapost.dev";
      const passwordHash = await bcrypt.hash(SEED_PASSWORD, 10);
      await db.insert(teacher).values({
        name: teacherName,
        email: teacherEmail,
        passwordHash,
      });
    }

    const students = await db.select().from(student);
    if (students.length === 0) {
      faker.seed(123);
      const studentName = faker.person.fullName();
      const studentEmail = "aluno@educapost.dev";
      const passwordHash = await bcrypt.hash(SEED_PASSWORD, 10);
      await db.insert(student).values({
        name: studentName,
        email: studentEmail,
        passwordHash,
      });
    }

    const posts = await db.select().from(post);
    if (posts.length === 0) {
      const [firstTeacher] = await db.select().from(teacher).limit(1);
      if (firstTeacher) {
        const now = new Date();
        await db.insert(post).values({
          title: "Boas-vindas ao EducaPost",
          content: "Este é um post de exemplo. Edite ou crie novos posts!",
          createdAt: now,
          updatedAt: now,
          categoryId: 1,
          teacherId: firstTeacher.id,
        });
      }
    }
    console.log("Seed: verificação concluída (categorias, professor, aluno e post inicial).");
  } catch (err) {
    console.error("Seed (runSeedIfEmpty) error:", err.message);
    console.error(
      "Dica: certifique-se de que o Postgres está rodando e que o schema foi aplicado (npm run db:push ou db:migrate)."
    );
  }
}
