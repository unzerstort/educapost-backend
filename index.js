import express from "express";
import categoriesRouter from "./src/routes/categories.router.js";
import postsRouter from "./src/routes/posts.router.js";
import swaggerUi from "swagger-ui-express";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const app = express();
const PORT = process.env.PORT || 3000;

// Configuração para servir arquivos estáticos do Swagger UI no Vercel
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const swaggerDistPath = path.join(__dirname, "node_modules", "swagger-ui-dist");

app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "EducaPost Backend API" });
});

app.use(postsRouter);
app.use(categoriesRouter);

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
/* v8 ignore next 3 */
if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

export default app;
