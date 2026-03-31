# Adorablee

This is the V1 of my original product named adorable(v0)<br>
AI-powered app builder: describe your idea in natural language, get a full-stack app generated and run in a sandbox, then deploy to the web.
## Features

- **Natural language to app** — Describe what you want; a LangGraph-based agent generates the project (files and structure).
- **Live preview** — Generated apps run in isolated [E2B](https://e2b.dev/) sandboxes with a live preview URL.
- **Code playground** — Edit code in-browser with Monaco, chat to refine the app, and see changes in real time.
- **One-click deploy** — Deploy any project to [Cloudflare Pages](https://pages.cloudflare.com/) from the UI.
- **Auth & projects** — Sign up / sign in, persistent projects, and version history.

## Tech stack

| Layer | Technologies |
|-------|--------------|
| **Monorepo** | [Turborepo](https://turbo.build/), [pnpm](https://pnpm.io/) workspaces |
| **Frontend** | [Next.js 16](https://nextjs.org/), [React 19](https://react.dev/), [Tailwind CSS](https://tailwindcss.com/), [shadcn/ui](https://ui.shadcn.com/), [Monaco Editor](https://microsoft.github.io/monaco-editor/), [Three.js](https://threejs.org/) / React Three Fiber |
| **Backend** | [Express](https://expressjs.com/), [Prisma](https://www.prisma.io/), [PostgreSQL](https://www.postgresql.org/) |
| **AI** | [LangChain](https://js.langchain.com/) + [LangGraph](https://langchain-ai.github.io/langgraphjs/), [OpenRouter](https://openrouter.ai/) (e.g. OpenAI models) |
| **Runtime** | [E2B Code Interpreter](https://e2b.dev/) (sandboxed execution & preview) |
| **Deploy** | [Cloudflare Pages](https://pages.cloudflare.com/) (via Wrangler in E2B) |

## Project structure

```
Adorable/
├── apps/
│   ├── web/          # Next.js app (landing, auth, playground, deploy)
│   └── backend/      # Express API (auth, projects, chat, deploy)
├── packages/
│   ├── database/     # Prisma schema, client, migrations
│   ├── config-eslint/
│   └── config-typescript/
├── docker-compose.yml
├── turbo.json
└── pnpm-workspace.yaml
```

**Note:** `docker-compose.yml` starts **PostgreSQL 16** on port `5432` (user/password/db: `adorable`). Point `DATABASE_URL` at it for local dev, or use any other Postgres instance.

## Prerequisites

- **Node.js** ≥ 18 (recommended: 20)
- **pnpm** 10.x (`npm i -g pnpm`)
- **PostgreSQL** (see `docker-compose.yml` or your own instance)
- API keys: **OpenRouter**, **E2B**, and optionally **Cloudflare** (for deploy)

## Getting started

### 1. Clone and install

```bash
git clone <your-repo-url>
cd Adorable
pnpm install
```

### 2. Environment variables

Create `.env` in the relevant apps/packages. Example for backend and database:

```env
# Database (PostgreSQL recommended)
DATABASE_URL="postgresql://user:password@localhost:5432/adorable"

# AI (required for project generation and chat)
OPENROUTER_API_KEY="sk-or-..."

# Sandbox & preview (required for running generated apps)
E2B_API_KEY="e2b_..."

# Optional: deploy to Cloudflare Pages
CLOUDFLARE_ACCOUNT_ID=""
CLOUDFLARE_API_TOKEN=""

# Frontend URL(s) for CORS — comma-separated if you need more than one origin
FRONTEND_URL="http://localhost:3000,http://127.0.0.1:3000"
```

For the Next.js app (`apps/web`):

```env
NEXT_PUBLIC_BACKEND_URL="http://localhost:3001"
```

### 3. Database

```bash
pnpm run generate
pnpm run db:migrate:dev
pnpm run db:seed   # optional
```

### 4. Run the app

```bash
pnpm run dev
```

- **Web:** http://localhost:3000  
- **Backend API:** http://localhost:3001  

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm run dev` | Start all apps in development |
| `pnpm run build` | Build all apps and packages |
| `pnpm run lint` | Lint the monorepo |
| `pnpm run format` | Format with Prettier |
| `pnpm run db:migrate:dev` | Run Prisma migrations (dev) |
| `pnpm run db:migrate:deploy` | Run Prisma migrations (production) |
| `pnpm run db:push` | Push schema without migrations |
| `pnpm run db:seed` | Seed the database |
| `pnpm run generate` | Generate Prisma client and turbo deps |

## CI

GitHub Actions runs on pull requests to `main`: installs dependencies with pnpm, runs `pnpm run lint`, then `pnpm run build` (see `.github/workflows/ci.yaml`).

## License

MIT
