import express from "express";
import categoriesRouter from "./src/routes/categories.router.js";
import postsRouter from "./src/routes/posts.router.js";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "EducaPost Backend API" });
});

app.use(postsRouter);
app.use(categoriesRouter);

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
