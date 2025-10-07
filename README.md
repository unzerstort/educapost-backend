# EducaPost Backend
Repositório com o back-end em Node.js da plataforma EducaPost (Tech Challenge).

## Requisitos
- Node.js 18+ (recomendado 20+)
- npm 9+
- (Opcional) Docker e Docker Compose

## Instalação
```bash
npm install
```

## Executar em desenvolvimento
```bash
npm run dev
```

- O servidor inicia em `http://localhost:3000` por padrão.
- Banco de dados SQLite será criado automaticamente em `data/educapost.db`.
- Seed automático: categorias iniciais e um post de boas-vindas.

## Docker
Build local da imagem:
```bash
docker build -t educapost-backend .
```

Subir via Docker Compose:
```bash
docker compose up -d
```

Logs:
```bash
docker compose logs -f
```

Parar serviços:
```bash
docker compose down
```

## Endpoints principais
- `GET /` → status simples da API
- `GET /posts` → lista posts (paginação: `page`, `limit`, ordenação: `sort=createdAt|updatedAt|title`, `order=asc|desc`)
- `GET /posts/search?q=...` → busca por título/conteúdo (mesmos parâmetros de paginação/ordenação)
- `GET /posts/:id` → obtém um post por id
- `POST /posts` → cria post
- `PUT /posts/:id` → atualiza post
- `DELETE /posts/:id` → remove post
- `GET /categories/:id` → obtém categoria por id

### Regras de validação (POST/PUT /posts)
- `title`: mínimo 3 caracteres
- `content`: obrigatório
- `author`: mínimo 2 caracteres
- `categoryId`: inteiro positivo quando informado e deve referenciar categoria ativa

### Exemplo: criar post
```bash
curl -X POST http://localhost:3000/posts \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Minha aula",
    "content": "Conteúdo da aula",
    "author": "Prof. Maria",
    "categoryId": 1
  }'
```

## Estrutura do projeto
```
src/
├─ persistence/
│  └─ sqlite.js
└─ routes/
   ├─ getPost.js
   ├─ getPosts.js
   ├─ getCategory.js
   └─ postCrud.js
```

## Banco de dados
- SQLite file-based: `data/educapost.db` (criado automaticamente)
- Tabelas em camelCase: `Category(id, label, order, isActive)`, `Post(id, title, content, createdAt, updatedAt, author, categoryId)`
- Seeds automáticos executados no primeiro start caso as tabelas estejam vazias