# EducaPost Backend

Back-end em Node.js da plataforma EducaPost (Tech Challenge 2). API REST com **PostgreSQL** e **Drizzle ORM**.

## Requisitos

- Node.js 18+ (recomendado 20+)
- npm 9+
- PostgreSQL 16+ (ou use Docker Compose)

## Instalação

```bash
npm install
```

## Configuração

Crie um arquivo `.env` na raiz do projeto (ou defina as variáveis no ambiente):

```env
DATABASE_URL=postgresql://usuario:senha@localhost:5432/educapost
PORT=3000
JWT_SECRET=um-secret-forte-em-producao
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

- **JWT_SECRET:** usado para assinar os tokens de login (obrigatório em produção).
- **CORS_ORIGINS:** origens permitidas para CORS (separadas por vírgula); se não informado, qualquer origem é aceita (útil em dev).

Para desenvolvimento local com Docker, o Compose já expõe o Postgres na porta 5432 com usuário/senha/banco: `educapost`/`educapost`/`educapost`.

## Banco de dados

O schema é gerenciado pelo **Drizzle ORM**. Scripts disponíveis:

```bash
# Aplicar schema direto no banco (desenvolvimento)
npm run db:push

# Gerar arquivos de migration a partir do schema
npm run db:generate

# Aplicar migrations existentes
npm run db:migrate
```

### Resetar o banco e iniciar do zero

Para apagar todos os dados e recriar as tabelas com o schema atual:

1. **Resetar o banco (remove volumes e dados):**
   ```bash
   docker compose down -v
   docker compose up -d postgres
   ```
2. **Aplicar o schema do zero:**
   - **Opção A (recomendado para dev):** `npm run db:push` — sincroniza o schema do código com o banco.
   - **Opção B:** `npm run db:migrate` — aplica a migration única (`drizzle/0000_*.sql`).
3. Inicie a API com `npm run dev`. O **seed** rodará automaticamente (categorias, professor, aluno e post de boas-vindas).

Na primeira execução da API, se as tabelas estiverem vazias, um **seed** é aplicado automaticamente (categorias, um professor, um aluno e um post de boas-vindas).

**Credenciais do seed (desenvolvimento):**

| Role     | Email                  | Senha    |
|----------|------------------------|----------|
| Professor | `professor@educapost.dev` | `senha123` |
| Aluno    | `aluno@educapost.dev`     | `senha123` |

Use essas credenciais para fazer login em `POST /auth/login` (body: `email`, `password`, `role: "teacher"` ou `"student"`) e obter o token JWT para as rotas protegidas.

### Drizzle Studio

O **Drizzle Studio** é a interface gráfica oficial do Drizzle para inspecionar e editar os dados do banco. Útil para debug e para conferir categorias e posts sem usar a API ou o psql.

```bash
npm run db:studio
```

- O servidor sobe em `https://local.drizzle.studio` (por padrão na porta 4983).
- Usa a `DATABASE_URL` do `.env` ou do `drizzle.config.js`.
- Permite visualizar tabelas, filtrar, criar, editar e excluir registros a partir do schema Drizzle do projeto.

Para customizar host ou porta:

```bash
npx drizzle-kit studio --host=0.0.0.0 --port=4983
```

Em navegadores que bloqueiam localhost (ex.: Safari, Brave), pode ser necessário usar certificado local (veja a [doc do Drizzle Studio](https://orm.drizzle.team/docs/drizzle-kit-studio)).

## Executar em desenvolvimento

1. Suba o PostgreSQL (ex.: `docker compose up -d postgres`).
2. Aplique o schema: `npm run db:push`.
3. Inicie a API:

```bash
npm run dev
```

O servidor fica em `http://localhost:3000` por padrão.

## Testes

```bash
# Executar todos os testes
npm test

# Executar testes com cobertura
npm run test:coverage
```

- **Framework**: Vitest com Supertest para testes de API
- Testes unitários por módulo e testes de integração end-to-end da API
- Cobertura de código configurada no Vitest

## Docker

Subir API + PostgreSQL com Docker Compose:

```bash
docker compose up -d
```

A API espera o Postgres ficar saudável (healthcheck) antes de iniciar. Na primeira vez, rode as migrations/seed conforme a seção [Banco de dados](#banco-de-dados) (ou use `db:push` antes de subir o compose).

Comandos úteis:

```bash
# Build da imagem
docker build -t educapost-backend .

# Logs
docker compose logs -f

# Parar
docker compose down
```

## Autenticação

- **Login:** `POST /auth/login` — body: `{ "email", "password", "role": "teacher" | "student" }`. Retorna `{ token, role, id, name, email }`. Use o `token` no header `Authorization: Bearer <token>` nas rotas protegidas.
- **Permissões:** professores podem criar, editar e excluir posts (só o dono edita/exclui); alunos podem apenas visualizar posts. Apenas professores podem gerenciar cadastro de alunos (CRUD de alunos).

## Endpoints principais

| Método | Endpoint | Auth | Descrição |
|--------|----------|------|-----------|
| GET | `/` | Não | Status da API |
| POST | `/auth/login` | Não | Login (retorna JWT) |
| GET | `/posts` | Bearer (teacher ou student) | Lista posts |
| GET | `/posts/search?q=...` | Bearer | Busca por título/conteúdo |
| GET | `/posts/:id` | Bearer | Post por id |
| POST | `/posts` | Bearer (teacher) | Criar post |
| PUT | `/posts/:id` | Bearer (teacher, dono) | Atualizar post |
| DELETE | `/posts/:id` | Bearer (teacher, dono) | Remover post |
| GET | `/categories` | Não | Lista categorias ativas (para consumo no front) |
| GET | `/categories/:id` | Não | Categoria por id |
| GET/POST/PUT/DELETE | `/teachers`, `/teachers/me`, `/teachers/:id` | Bearer (teacher) | CRUD professores |
| GET/POST/PUT/DELETE | `/students`, `/students/me`, `/students/:id` | Bearer (teacher para CRUD; student para me) | CRUD alunos |

## Documentação da API (Swagger)

- **UI**: `http://localhost:3000/docs`
- **OpenAPI JSON**: `http://localhost:3000/docs.json`
- Especificação em `src/openapi/openapi.json`

### Validação (POST/PUT `/posts`)

- `title`: mínimo 3 caracteres
- `content`: obrigatório
- `categoryId`: inteiro positivo quando informado; deve referenciar categoria ativa (o autor do post é o professor logado)

### Exemplo: criar post

```bash
curl -X POST http://localhost:3000/posts \
  -H "Authorization: Bearer <seu-token-professor>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Minha aula",
    "content": "Conteúdo da aula",
    "categoryId": 1
  }'
```

## Estrutura do projeto

```
src/
├── controllers/
│   ├── categories.controller.js
│   └── posts.controller.js
├── db/
│   ├── index.js          # Conexão Drizzle, getDb, seed
│   └── schema.js         # Tabelas Category e Post (Drizzle)
├── models/
│   ├── categories.model.js
│   └── posts.model.js
├── openapi/
│   └── openapi.json
├── routes/
│   ├── __tests__/
│   │   ├── getCategory.test.js
│   │   ├── getPost.test.js
│   │   ├── getPosts.test.js
│   │   └── postCrud.test.js
│   ├── categories.router.js
│   └── posts.router.js
└── ...

__tests__/
└── app.test.js

drizzle/                 # Migrations SQL (Drizzle Kit)
drizzle.config.js
Dockerfile
docker-compose.yaml
vitest.config.js
```

## Padrões e arquitetura

- **MVC**: Models (acesso a dados com Drizzle), Controllers (validação e orquestração), respostas JSON como “view”.
- **Camada de dados**: `src/db/` — schema Drizzle e conexão PostgreSQL; models em `src/models/` usam `getDb()` e o schema.
- **Roteadores**: Rotas organizadas por recurso (`posts.router.js`, `categories.router.js`).
- **Testes**: Models e db mockados nos testes de rotas; Vitest + Supertest para integração.

## Stack

- **Runtime**: Node.js (ESM)
- **API**: Express 5
- **Banco**: PostgreSQL 16
- **ORM**: Drizzle ORM (schema, migrations, queries)
- **Testes**: Vitest, Supertest
- **Docs**: Swagger UI (OpenAPI 3)

## Melhorias futuras

- Middleware de autenticação e logging
- Rate limiting para produção
- Variáveis de ambiente validadas no boot (ex.: DATABASE_URL obrigatória em produção)
