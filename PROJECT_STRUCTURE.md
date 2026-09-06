# Squibl — Project Structure Reference

> **Follow this document every time you build a new feature.**
> It tells you exactly where every file should live and why.

---

## 📁 Root Layout

```
squibl/
├── frontend/          ← Next.js client application (App Router, Tailwind CSS, shadcn/ui, Supabase)
├── backend/           ← Express REST API (TypeScript, Supabase JS SDK)
├── supabase/          ← Supabase SQL migrations, RLS policies, schemas & seed data
│   ├── migrations/    ← 001_initial_schema.sql (tables, triggers, RLS, storage buckets)
│   └── seed.sql       ← Development seed data
├── scripts/           ← Centralized monorepo utility, test, and migration scripts
├── docker-compose.yml ← Orchestration for production and local containerized deployment
├── README.md          ← Monorepo overview and deployment quickstart
└── PROJECT_STRUCTURE.md ← Architectural tree reference
```

---

## 🖥️ FRONTEND — `frontend/`

**Stack:** Next.js 16 · React 19 · TypeScript · Tailwind CSS · shadcn/ui · Supabase (`@supabase/ssr`, `@supabase/supabase-js`)

```
frontend/
├── app/                          ← Next.js App Router (pages & layouts)
│   ├── layout.tsx                ← Root layout (fonts, providers, metadata)
│   ├── page.tsx                  ← Landing page (/)
│   ├── globals.css               ← Global styles imported by root layout
│   │
│   ├── dashboard/page.tsx        ← /dashboard
│   ├── explore/page.tsx          ← /explore
│   ├── projects/page.tsx         ← /projects (list)
│   ├── create/page.tsx           ← /create (new project form)
│   ├── profile/page.tsx          ← /profile
│   ├── messages/page.tsx         ← /messages
│   ├── notifications/page.tsx    ← /notifications
│   ├── bookmarks/page.tsx        ← /bookmarks
│   ├── community/page.tsx        ← /community
│   ├── hackathons/page.tsx       ← /hackathons
│   ├── showcase/page.tsx         ← /showcase
│   ├── featured/page.tsx         ← /featured
│   ├── builders/page.tsx         ← /builders
│   ├── teams/page.tsx            ← /teams
│   ├── licenses/page.tsx         ← /licenses
│   ├── settings/page.tsx         ← /settings
│   ├── onboarding/page.tsx       ← /onboarding
│   ├── login/page.tsx            ← /login
│   └── signup/page.tsx           ← /signup
│
├── components/                   ← All reusable UI components
│   ├── ui/                       ← shadcn/ui primitives (DO NOT edit manually)
│   ├── landing/                  ← Landing page section components
│   ├── dashboard/                ← Dashboard-specific components
│   ├── projects/                 ← Project-related components
│   ├── Sidebar.tsx               ← Main app navigation sidebar
│   └── theme-provider.tsx        ← next-themes provider wrapper
│
├── hooks/                        ← Custom React hooks
│   ├── useAuth.ts                ← Supabase auth state (user, session, loading, signOut)
│   ├── usePlatformStats.ts       ← Platform-wide stats (users, projects count)
│   ├── usePostViewTracker.ts     ← Track post views on mount
│   ├── use-toast.ts              ← Toast notification hook
│   └── use-mobile.ts             ← Responsive mobile detection hook
│
├── lib/                          ← Client-side helpers & Supabase integration
│   ├── supabase/                 ← Supabase client singletons
│   │   ├── client.ts             ← Browser client (createBrowserClient)
│   │   ├── server.ts             ← Server client & Admin client (createServerClient)
│   │   ├── middleware.ts         ← Middleware session management
│   │   └── database.types.ts     ← TypeScript database types
│   ├── auth.ts                   ← Supabase Auth helpers (signIn, signUp, signOut, OAuth)
│   ├── profiles.ts               ← Builder profiles and relationships
│   ├── projects.ts               ← Projects and project likes
│   ├── posts.ts                  ← Posts, post likes, comments
│   ├── chats.ts                  ← Direct messaging & Realtime channels
│   ├── notifications.ts          ← Notifications & Realtime channel
│   ├── storage.ts                ← File upload handlers for avatars & post media
│   ├── stats.ts                  ← Platform statistics aggregate queries
│   ├── sanitize.ts               ← Input sanitization utilities
│   ├── security-logger.ts        ← Client-side security event logging (auth_events table)
│   ├── env.ts                    ← Typed env variable access
│   └── utils.ts                  ← General utilities (cn, clsx wrapper)
│
├── public/                       ← Static files served as-is
├── .env.local                    ← Local secrets (never commit)
├── .env.example                  ← Template for required env vars
├── next.config.mjs               ← Next.js configuration
├── tsconfig.json                 ← TypeScript config
├── components.json               ← shadcn/ui CLI config
└── package.json
```

---

## ⚙️ BACKEND — `backend/`

**Stack:** Node.js · Express 4 · TypeScript · Supabase JS SDK · Zod

```
backend/
├── src/
│   ├── config/
│   │   └── index.ts              ← Port, NODE_ENV, CORS origin, Supabase client initialization
│   │
│   ├── controllers/              ← One file per feature — reads req, calls service, sends res
│   ├── middleware/               ← Auth token verification, error handler, rate limiting
│   ├── models/                   ← TypeScript interfaces + Zod schemas per feature
│   ├── repositories/             ← PostgreSQL / Supabase queries
│   ├── routes/                   ← Express.Router() per feature area
│   ├── services/                 ← Business logic layer, calls repositories
│   ├── types/
│   │   └── index.ts              ← Shared types, enums, augmented Express types
│   ├── utils/                    ← Response wrapper, pagination, sanitize helpers
│   ├── app.ts                    ← Express app: middleware stack, health check, route mounts
│   └── server.ts                 ← app.listen() entry point
│
├── tests/                        ← Jest + Supertest integration tests
├── .env.example                  ← Required env vars template (copy to .env)
├── package.json
└── tsconfig.json
```

---

## 🚀 Adding a New Feature — Checklist

### Frontend Steps
1. **Database Schema** → If new table needed, add migration under `supabase/migrations/`
2. **Page** → Create `frontend/app/<feature>/page.tsx`
3. **Components** → Add `frontend/components/<feature>/` folder
4. **Hook** → Add `frontend/hooks/use<Feature>.ts`
5. **Lib** → Add `frontend/lib/<feature>.ts` for Supabase relational queries
6. **Navigation** → Update `frontend/components/Sidebar.tsx`

### Backend Steps (if the feature needs a server API)
1. **Model** → `backend/src/models/<feature>.model.ts` — define interface + Zod schema
2. **Repository** → `backend/src/repositories/<feature>.repository.ts` — raw Supabase CRUD
3. **Service** → `backend/src/services/<feature>.service.ts` — business logic
4. **Controller** → `backend/src/controllers/<feature>.controller.ts` — handle HTTP in/out
5. **Routes** → `backend/src/routes/<feature>.routes.ts` — map paths to controller
6. **Mount** → Register in `backend/src/app.ts`

---

## 🔐 Environment Variables

### Frontend (`frontend/.env.local`)
| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous API key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service-role key (server-only) |
| `NEXT_PUBLIC_API_URL` | Backend API base URL |

### Backend (`backend/.env`)
| Variable | Purpose |
|---|---|
| `PORT` | Server port (default 5000) |
| `NODE_ENV` | `development` / `production` |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_ANON_KEY` | Supabase anonymous API key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service-role secret key |

---

## 📦 Key Dependencies

### Frontend
| Package | Role |
|---|---|
| `next` 16 | Full-stack React framework |
| `react` 19 | UI library |
| `@supabase/supabase-js` 2 | Client and server database / auth access |
| `@supabase/ssr` | Cookie-based Next.js SSR session handler |
| `tailwindcss` 4 | Utility CSS |
| `shadcn/ui` (radix) | Accessible UI primitives |
| `framer-motion` | Animations |
| `zod` | Schema validation |

### Backend
| Package | Role |
|---|---|
| `express` 4 | HTTP server |
| `@supabase/supabase-js` 2 | Server-side Supabase client |
| `zod` | Request body validation |
| `helmet` | Security headers |
| `cors` | Cross-origin requests |
