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

## Testes
```bash
# Executar todos os testes
npm test

# Executar testes com cobertura
npm run test:coverage
```

- **Testes unitários**: Cada módulo tem seus testes específicos
- **Testes de integração**: Testes end-to-end da API
- **Cobertura**: Relatório de cobertura de código disponível
- **Framework**: Vitest com Supertest para testes de API

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
│  ├─ __tests__/
│  │  └─ sqlite.test.js
│  └─ sqlite.js
└─ routes/
   ├─ __tests__/
   │  ├─ getCategory.test.js
   │  ├─ getPost.test.js
   │  ├─ getPosts.test.js
   │  └─ postCrud.test.js
   ├─ getPost.js
   ├─ getPosts.js
   ├─ getCategory.js
   └─ postCrud.js

__tests__/
└─ app.test.js

# Arquivos de configuração
├─ vitest.config.js
├─ package.json
├─ Dockerfile
└─ docker-compose.yaml
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

## Experiências e Desafios

### 🚀 **Desafios Técnicos Enfrentados**

**Estruturação Modular das Rotas:**
- **Desafio**: Organizar endpoints de forma escalável e manutenível
- **Solução**: Separação por responsabilidade usando Router Pattern
- **Aprendizado**: Benefícios da modularização para projetos em crescimento

### 🏗️ **Decisões Arquiteturais**

**Escolha do Padrão MVC:**
- **Motivação**: Necessidade de separação clara entre lógica de negócio, dados e apresentação
- **Benefício**: Facilita manutenção e testes automatizados
- **Resultado**: Código mais organizado e testável

**SQLite como Banco de Dados:**
- **Motivação**: Simplicidade para desenvolvimento e deploy, zero configuração necessária
- **Vantagem**: Arquivo único, ideal para protótipos e desenvolvimento inicial
- **Limitação conhecida**: Apenas uma operação de escrita por vez (limitações de concorrência)
- **Plano futuro**: Migração para PostgreSQL quando o projeto escalar e precisar de maior concorrência

**Estrutura de Testes:**
- **Abordagem**: Testes unitários com Vitest e mocks para dependências
- **Benefício**: Cobertura de código e confiança nas funcionalidades
- **Desafio**: Mocking de operações de banco de dados

### 📚 **Lições Aprendidas**

**1. Importância da Documentação:**
- Documentar padrões de projeto facilita manutenção futura
- README detalhado acelera onboarding de novos desenvolvedores

**2. Testabilidade como Prioridade:**
- Estrutura modular facilita criação de testes
- Mocks bem implementados garantem isolamento de testes

**3. Estratégia de Escalabilidade:**
- SQLite escolhido conscientemente para desenvolvimento rápido e simplicidade
- Limitação de concorrência conhecida desde o início (apenas 1 escrita por vez)
- **Arquitetura MVC facilita migração futura para PostgreSQL quando necessário**
- Foco em "fazer funcionar primeiro, otimizar depois"

### 🔄 **Melhorias Futuras Identificadas**

- **Migração para PostgreSQL**: Quando o projeto escalar e precisar de maior concorrência
- **Middleware**: Adicionar middleware para autenticação e logging
- **Migrations**: Sistema de migração de banco mais robusto
- **Rate Limiting**: Implementar limitação de requisições para produção