import "dotenv/config";
import express from "express";
import cors from "cors";
import categoriesRouter from "./src/routes/categories.router.js";
import postsRouter from "./src/routes/posts.router.js";
import authRouter from "./src/routes/auth.router.js";
import teachersRouter from "./src/routes/teachers.router.js";
import studentsRouter from "./src/routes/students.router.js";
import swaggerUi from "swagger-ui-express";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runSeedIfEmpty } from "./src/db/index.js";

const app = express();
const PORT = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const swaggerDistPath = path.join(__dirname, "node_modules", "swagger-ui-dist");

const corsOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(",").map((s) => s.trim())
  : true;

app.use(cors({ origin: corsOrigins }));
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "EducaPost Backend API" });
});

app.use(authRouter);
app.use(postsRouter);
app.use(categoriesRouter);
app.use(teachersRouter);
app.use(studentsRouter);

// Swagger UI and JSON
const openapiPath = path.join(process.cwd(), "src", "openapi", "openapi.json");
app.get("/docs.json", (req, res) => {
  try {
    const spec = fs.readFileSync(openapiPath, "utf-8");
    res.type("application/json").send(spec);
  } catch (e) {
    res.status(500).json({ message: "Failed to load OpenAPI spec" });
  }
});

// Configuração do Swagger UI para funcionar no Vercel
app.use(
  "/docs",
  express.static(swaggerDistPath, { index: false }),
  swaggerUi.serve,
  swaggerUi.setup(JSON.parse(fs.readFileSync(openapiPath, "utf-8")), {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: "EducaPost API Documentation",
    swaggerOptions: {
      persistAuthorization: true
    }
  })
);

app.use((req, res) => {
  res.status(404).json({ message: "Not Found" });
});

// Só inicia o servidor se não estivermos em modo de teste
/* v8 ignore next 8 */
if (process.env.NODE_ENV !== "test") {
  runSeedIfEmpty()
    .then(() => {
      app.listen(PORT, "0.0.0.0", () => {
        console.log(`Server is running on port ${PORT}`);
      });
    })
    .catch((err) => {
      console.error("Failed to start server:", err);
      process.exit(1);
    });
}

export default app;
