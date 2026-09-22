<div align="center">
<img src="https://res.cloudinary.com/aovh9hgj/image/upload/v1790094012/squibl_logo_1.png" alt="Squibl Logo" width="72" /><br/>

# Squibl
**Where developers find teammates, build projects, and grow together**

[![Live Demo](https://img.shields.io/badge/Live_Demo-squibl.vercel.app-success?style=flat-square&logo=vercel&logoColor=white)](https://squibl.vercel.app)
![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=flat-square&logo=supabase&logoColor=white)
![Express](https://img.shields.io/badge/Express-4-black?style=flat-square&logo=express&logoColor=white)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](LICENSE)

[Live Demo](https://squibl.vercel.app) • [Report a Bug](https://github.com/Keerthanreddy01/squibl-web/issues) • [Request a Feature](https://github.com/Keerthanreddy01/squibl-web/issues)

</div>

---

## Overview

**Squibl** is a platform built for software developers, designers, and tech professionals to connect, form teams, and build together. It unifies a real-time social feed, professional portfolios, project showcases, and hackathon team-building workflows into a single hub — think **LinkedIn meets GitHub meets Devpost**.

The project is structured as a **monorepo** with two independently deployable services:

| Service | Description | Deployment |
|---|---|---|
| **Frontend** | Next.js 16 application (App Router) | Vercel |
| **Backend** | Express / Node.js REST API | Any Node host |
| **Data Layer** | Supabase — PostgreSQL, Auth, Storage, Realtime | Supabase Cloud |

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Database Setup](#1-database-setup)
  - [Frontend Setup](#2-set-up-the-frontend)
  - [Backend Setup](#3-set-up-the-backend)
- [Folder Structure](#folder-structure)
- [Scripts Reference](#scripts-reference)
- [Contributing](#contributing)
- [License](#license)

---

## Features

| | |
|---|---|
| 🟢 **Real-Time Feed** | Community updates, project launches, and technical discussions, powered live via Supabase Realtime |
| 👤 **Developer Profiles** | Rich portfolios with tech stacks, GitHub metrics, and availability status |
| 🚀 **Project Showcase** | Dedicated pages for developers to demo and iterate on their software projects |
| 🤝 **Hackathon Teambuilding** | Discover and assemble multidisciplinary teams for competitions |
| 💬 **Direct Messaging** | Peer-to-peer conversations between builders, powered by Supabase Realtime |
| 🔍 **Smart Search & Filtering** | Find developers by role, tech stack, and availability |
| 🔒 **Security-First** | PostgreSQL Row Level Security (RLS), input sanitization (DOMPurify), Cloudflare Turnstile bot protection, and security event logging |

---

## Tech Stack

<table>
<tr>
<td valign="top" width="50%">

**Frontend**
- Next.js 16 (App Router)
- React 19
- TypeScript 5
- Tailwind CSS v4 + shadcn/ui (Radix primitives)
- Framer Motion

</td>
<td valign="top" width="50%">

**Backend & Infrastructure**
- Express 4 (Node.js ≥ 18)
- Supabase (PostgreSQL 15, Auth, Storage)
- Supabase Realtime Channels
- Zod (validation)
- Helmet + DOMPurify (security)

</td>
</tr>
</table>

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Browser / Client                                            │
│  Next.js 16 App Router (Vercel)                               │
│  ┌─────────────────┐   ┌──────────────────────────────────┐   │
│  │  React Pages     │   │  Next.js API Routes              │   │
│  │  (frontend/app)  │   │  (frontend/app/api/*)            │   │
│  └────────┬─────────┘   └───────────────┬──────────────────┘   │
│           │ Supabase Client SDK          │ Supabase Admin Client│
└───────────┼──────────────────────────────┼─────────────────────┘
            │                              │
            ▼                              ▼
┌─────────────────────────────────────────────────────────────┐
│  Supabase (PostgreSQL)                                        │
│  ├── Database Tables + RLS Policies                           │
│  ├── Authentication (Email, OAuth)                             │
│  ├── Storage Buckets (avatars, post-media)                     │
│  └── Realtime Channels (messages, notifications)               │
└─────────────────────────────────────────────────────────────┘
```

**How the pieces communicate:**

- The **Next.js frontend** talks to Supabase directly via `@supabase/ssr` and `@supabase/supabase-js`, with Row Level Security enforced through `auth.uid()`.
- Server routes (e.g. `/api/waitlist`) use the service-role admin client for atomic, transactional operations.
- The **Express backend** communicates with Supabase through the Supabase Node.js client for feature workflows that need a dedicated API layer.

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 18 → [Download](https://nodejs.org/)
- **npm**, **yarn**, or **pnpm**
- A **Supabase project** → [app.supabase.com](https://app.supabase.com/)

### 1. Database Setup

Run the migration script in your Supabase SQL Editor:

```bash
# Supabase Dashboard → SQL Editor → New Query
# Paste the contents of supabase/migrations/001_initial_schema.sql → Run
```

### 2. Set Up the Frontend

```bash
cd frontend
npm install
cp .env.example .env.local
```

Fill in `frontend/.env.local` with your Supabase credentials:

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (server-only) |

```bash
npm run dev
# → http://localhost:3000
```

### 3. Set Up the Backend

```bash
cd backend
npm install
cp .env.example .env
```

Fill in `backend/.env`:

| Variable | Description |
|---|---|
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_ANON_KEY` | Public anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (server-only) |
| `PORT` | Port for the Express server |
| `NODE_ENV` | `development` or `production` |
| `FRONTEND_URL` | URL of the running frontend (for CORS) |

```bash
npm run dev
# → http://localhost:5000
```

> **Health check:** `GET http://localhost:5000/health` → `{ "status": "ok" }`

---

## Folder Structure

```
squibl/                         ← Monorepo root
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
| `npm run install:all` | Install dependencies for root + both sub-packages |

---

## Contributing

Contributions are welcome! Please follow **Conventional Commits** for all commit messages.

```
<type>(<scope>): <short description>

Types:  feat | fix | docs | chore | refactor | style | test | perf
Scope:  frontend | backend | rules | deps | ci
```

1. Fork the repository
2. Create a feature branch (`git checkout -b feat/your-feature`)
3. Commit your changes following the format above
4. Open a Pull Request describing the change and its motivation

---

## License

Distributed under the [MIT License](LICENSE).

<div align="center">

Made with ❤️ by the Squibl team

</div>
