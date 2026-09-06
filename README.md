<div align="center">

# Squibl

**Squibl — Where developers find teammates, build projects, and grow together**

[![Live Demo](https://img.shields.io/badge/Live_Demo-squibl.vercel.app-success?style=flat-square&logo=vercel)](https://squibl.vercel.app)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-emerald?style=flat-square&logo=supabase)](https://supabase.com/)
[![Express](https://img.shields.io/badge/Express-4-grey?style=flat-square&logo=express)](https://expressjs.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](LICENSE)
[![Stars](https://img.shields.io/github/stars/Keerthanreddy01/squibl-web?style=flat-square)](https://github.com/Keerthanreddy01/squibl-web/stargazers)

</div>

---

## What is Squibl?

Squibl is a platform engineered for software developers, designers, and tech professionals to connect, form teams, and build together. It combines a real-time social feed, professional portfolios, project showcases, and hackathon team-building workflows into a single hub — think LinkedIn meets GitHub meets Devpost.

The project is a **monorepo** with two independently deployable services: a **Next.js 16 frontend** (deployed on Vercel) and an **Express/Node.js backend API** backed by **Supabase (PostgreSQL, Supabase Auth, Storage, and Realtime)**.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Folder Structure](#folder-structure)
- [Scripts Reference](#scripts-reference)
- [Contributing](#contributing)
- [License](#license)

---

## Features

- **Real-Time Feed** — Community updates, project launches, and technical discussions
- **Developer Profiles** — Portfolios with tech stacks, GitHub metrics, and availability status
- **Project Showcase** — Dedicated pages to demo and iterate on software projects
- **Hackathon Teambuilding** — Discover and assemble multidisciplinary teams for competitions
- **Direct Messaging** — Peer-to-peer conversations between builders powered by Supabase Realtime
- **Smart Search & Filtering** — Find developers by role, stack, and availability
- **Security-First** — Strict PostgreSQL Row Level Security (RLS), input sanitization (DOMPurify), Cloudflare Turnstile bot protection, security event logging

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend Framework** | Next.js 16 (App Router) |
| **UI Library** | React 19 |
| **Language** | TypeScript 5 |
| **Styling** | Tailwind CSS v4 + shadcn/ui (Radix primitives) |
| **Animations** | Framer Motion |
| **Backend Framework** | Express 4 (Node.js ≥ 18) |
| **Database & Auth** | Supabase (PostgreSQL 15 + Supabase Auth + Supabase Storage) |
| **Realtime Engine** | Supabase Realtime Channels |
| **Validation** | Zod |
| **Security** | Helmet, DOMPurify, PostgreSQL RLS policies |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Browser / Client                                           │
│  Next.js 16 App Router (Vercel)                             │
│  ┌─────────────────┐  ┌──────────────────────────────────┐  │
│  │  React Pages    │  │  Next.js API Routes              │  │
│  │  (frontend/app) │  │  (frontend/app/api/*)            │  │
│  └────────┬────────┘  └───────────────┬──────────────────┘  │
│           │ Supabase Client SDK        │ Supabase Admin Client│
└───────────┼───────────────────────────┼─────────────────────┘
            │                           │
            ▼                           ▼
┌─────────────────────────────────────────────────────────────┐
│  Supabase (PostgreSQL)                                      │
│  ├── Database Tables + RLS Policies                         │
│  ├── Authentication (Email, OAuth)                          │
│  ├── Storage Buckets (avatars, post-media)                  │
│  └── Realtime Channels (messages, notifications)            │
└─────────────────────────────────────────────────────────────┘
```

**How they talk:**
- The **Next.js frontend** communicates with Supabase directly via `@supabase/ssr` and `@supabase/supabase-js` (with Row Level Security enforced via `auth.uid()`).
- Server routes (like `/api/waitlist`) use the service-role admin client for atomic transactional operations.
- The **Express backend** communicates with Supabase via the Supabase Node.js client.

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 18 ([download](https://nodejs.org/))
- **npm**, **yarn**, or **pnpm**
- A **Supabase project** ([app.supabase.com](https://app.supabase.com/))

### 1. Database Setup

Run the migrations in `supabase/migrations/001_initial_schema.sql` in your Supabase SQL Editor:

```bash
# In the Supabase Dashboard:
# SQL Editor -> New Query -> Paste contents of supabase/migrations/001_initial_schema.sql -> Run
```

### 2. Set Up the Frontend

```bash
cd frontend
npm install
cp .env.example .env.local
```

Open `frontend/.env.local` and fill in your **Supabase** credentials:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

```bash
npm run dev           # starts Next.js at http://localhost:3000
```

### 3. Set Up the Backend

```bash
cd backend
npm install
cp .env.example .env
```

Open `backend/.env` and fill in:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `PORT`, `NODE_ENV`, and `FRONTEND_URL`

```bash
npm run dev           # starts Express at http://localhost:5000
```

> **Health check:** `GET http://localhost:5000/health` → `{ "status": "ok" }`

---

## Folder Structure

```
squibl/                   ← Monorepo root
├── frontend/                   ← Next.js 16 client (deployed to Vercel)
│   ├── app/                    ← App Router pages (23 routes)
│   ├── components/             ← Reusable UI components + shadcn/ui
│   ├── hooks/                  ← Custom React hooks
│   ├── lib/                    ← Supabase client, auth helpers, data services
│   ├── public/                 ← Static assets (images, icons, demo screenshots)
│   └── styles/                 ← Additional global CSS layers
│
├── backend/                    ← Express REST API (Node.js)
│   └── src/
│       ├── config/             ← Environment variable loading & Supabase init
│       ├── controllers/        ← HTTP request handlers
│       ├── middleware/         ← Auth, error handling, rate limiting
│       ├── models/             ← TypeScript interfaces + Zod schemas
│       ├── repositories/       ← Supabase / database queries
│       ├── routes/             ← Express routers per feature
│       ├── services/           ← Business logic layer
│       └── utils/              ← Shared utilities (response wrapper, pagination)
│
├── supabase/                   ← Supabase SQL migrations & schema definitions
│   └── migrations/             ← 001_initial_schema.sql
├── scripts/                    ← Utility and test scripts
├── .env.example                ← Full env template for both frontend + backend
└── README.md
```

For a detailed description of every file, see [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md).

---

## Scripts Reference

Run these from the **monorepo root**:

| Command | Description |
|---|---|
| `npm run dev:frontend` | Start Next.js dev server (port 3000) |
| `npm run dev:backend` | Start Express dev server (port 5000) |
| `npm run build:frontend` | Production build for Next.js |
| `npm run build:backend` | Compile TypeScript → `backend/dist/` |
| `npm run lint` | Lint both frontend and backend |
| `npm run install:all` | Install deps for root + both sub-packages |

---

## Contributing

We follow **Conventional Commits** for all commit messages.

### Commit Format

```
<type>(<scope>): <short description>

Types: feat | fix | docs | chore | refactor | style | test | perf
Scope: frontend | backend | rules | deps | ci
```

---

## License

Distributed under the [MIT License](LICENSE).
