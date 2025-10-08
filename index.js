import express from "express";
import getCategoryRouter from "./src/routes/getCategory.js";
import getPostRouter from "./src/routes/getPost.js";
import getPostsRouter from "./src/routes/getPosts.js";
import postCrudRouter from "./src/routes/postCrud.js";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "EducaPost Backend API" });
});

app.use(getPostsRouter);
app.use(getPostRouter);
app.use(postCrudRouter);
app.use(getCategoryRouter);

app.use((req, res) => {
  res.status(404).json({ message: "Not Found" });
});

// Só inicia o servidor se não estivermos em modo de teste
/* v8 ignore next 3 */
if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

export default app;
