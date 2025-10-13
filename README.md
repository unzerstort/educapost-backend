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

## Padrões de Projeto

Este projeto implementa o **padrão MVC (Model-View-Controller)** com algumas características adicionais:

### 🏗️ Arquitetura MVC

**Model (Modelo) - `src/persistence/sqlite.js`:**
- Gerenciamento da conexão com SQLite
- Implementação do padrão **Singleton** para instância única do banco
- Criação automática de tabelas e seeds
- Encapsulamento das operações de banco de dados

**View (Visão) - Respostas JSON:**
- Formatação de dados em JSON para a API REST
- Tratamento de erros HTTP padronizados
- Estrutura consistente de respostas

**Controller (Controlador) - `src/routes/*.js`:**
- Validação de dados de entrada
- Lógica de negócio e orquestração
- Tratamento de requisições HTTP
- Separação por funcionalidade (Router Pattern)

### 🔧 Padrões Adicionais

- **Singleton Pattern**: Garante uma única instância da conexão com o banco
- **Router Pattern**: Separação modular das rotas por responsabilidade
- **Repository Pattern**: Abstração da camada de acesso a dados

### 📋 Benefícios da Arquitetura

- ✅ **Separação clara de responsabilidades**
- ✅ **Modularidade** - fácil manutenção e extensão
- ✅ **Testabilidade** - dependências facilmente mockáveis
- ✅ **Reutilização** - componentes independentes
- ✅ **Escalabilidade** - estrutura preparada para crescimento

## Banco de dados
- SQLite file-based: `data/educapost.db` (criado automaticamente)
- Tabelas em camelCase: `Category(id, label, order, isActive)`, `Post(id, title, content, createdAt, updatedAt, author, categoryId)`
- Seeds automáticos executados no primeiro start caso as tabelas estejam vazias