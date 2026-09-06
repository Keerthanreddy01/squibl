# Backend — Squibl API

Express + TypeScript REST API configured for Supabase integration.

## Folder Structure

```
backend/
├── src/
│   ├── config/          # App config, env vars, Supabase JS client init
│   ├── controllers/     # Route handlers (thin layer — call services)
│   ├── middleware/      # Auth guards, error handler, rate limiter, logging
│   ├── models/          # TypeScript interfaces / Zod schemas for data shapes
│   ├── repositories/    # Direct database queries (data access layer)
│   ├── routes/          # Express routers — map URL paths → controllers
│   ├── services/        # Business logic (call repositories, apply rules)
│   ├── types/           # Shared TypeScript types & enums
│   ├── utils/           # Pure helpers (sanitize, paginate, format, etc.)
│   ├── app.ts           # Express app setup (middleware + routes mount)
│   └── server.ts        # Server entry point (listen on port)
├── tests/               # Unit & integration tests (Jest / Supertest)
├── .env.example         # Required environment variables (no secrets)
├── .gitignore
├── package.json
└── tsconfig.json
```

## Getting Started

```bash
cd backend
npm install
cp .env.example .env    # Fill in your secrets
npm run dev             # ts-node-dev hot reload
```
