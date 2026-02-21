# replit.md

## Overview

This is a Discord self-bot automation dashboard — a full-stack web application that lets users configure and control a Discord self-bot through a browser-based UI. Users can set a bot token, toggle the bot on/off, and create automation "commands" that execute actions (like sending messages) based on triggers (intervals or message events) in specified Discord channels. The app follows a monorepo structure with a React frontend, Express backend, and PostgreSQL database.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Monorepo Structure
- **`client/`** — React frontend (SPA)
- **`server/`** — Express backend (API + bot logic)
- **`shared/`** — Shared types, schemas, and API route definitions used by both client and server
- **`migrations/`** — Drizzle ORM migration files

### Frontend (`client/src/`)
- **Framework**: React with TypeScript, bundled by Vite
- **Routing**: `wouter` (lightweight client-side router). Single main route (`/` → Dashboard)
- **State/Data Fetching**: `@tanstack/react-query` for server state management. Custom hooks in `hooks/` wrap API calls
- **UI Components**: shadcn/ui (new-york style) built on Radix UI primitives with Tailwind CSS
- **Forms**: `react-hook-form` with `@hookform/resolvers` (Zod validation)
- **Animations**: `framer-motion`
- **Styling**: Tailwind CSS with CSS variables for theming (dark theme by default). Custom fonts: Inter, Space Grotesk, JetBrains Mono
- **Path aliases**: `@/` → `client/src/`, `@shared/` → `shared/`

### Backend (`server/`)
- **Framework**: Express.js running on Node with `tsx` (TypeScript execution)
- **Entry point**: `server/index.ts` creates HTTP server, registers routes, sets up Vite dev middleware or static serving
- **API Design**: RESTful JSON API under `/api/`. Route contracts defined in `shared/routes.ts` with Zod schemas for input validation and response typing
- **Bot Manager** (`server/bot.ts`): Singleton class using `discord.js-selfbot-v13` to manage the Discord self-bot connection. Handles login, message listening, command execution with interval/message triggers
- **Dev mode**: Vite dev server middleware with HMR (`server/vite.ts`)
- **Production**: Static file serving from `dist/public` (`server/static.ts`)

### Database
- **Database**: PostgreSQL (required via `DATABASE_URL` environment variable)
- **ORM**: Drizzle ORM with `drizzle-zod` for schema-to-Zod type generation
- **Schema** (`shared/schema.ts`):
  - `bot_configs` — Stores bot token, active status, last error. Single-row config table
  - `commands` — Automation rules with name, condition type (interval/message), condition value, channel ID, target bot ID, active status, and a JSONB `actions` array (message/wait action steps)
- **Migrations**: Use `drizzle-kit push` (`npm run db:push`) to sync schema to database

### API Routes (`server/routes.ts`)
- `GET /api/config` — Get bot configuration
- `POST /api/config` — Update bot configuration (token, etc.)
- `POST /api/config/toggle` — Start/stop the bot
- `GET /api/commands` — List all commands
- `POST /api/commands` — Create a command
- `PUT /api/commands/:id` — Update a command
- `DELETE /api/commands/:id` — Delete a command
- `POST /api/commands/:id/test` — Test-run a command

### Build System
- **Dev**: `tsx server/index.ts` with Vite middleware for HMR
- **Build** (`script/build.ts`): Vite builds the client to `dist/public`, esbuild bundles the server to `dist/index.cjs`. Key dependencies are bundled (allowlisted) while others are externalized
- **Production**: `node dist/index.cjs`

### Storage Layer
- `server/storage.ts` defines an `IStorage` interface and `DatabaseStorage` implementation
- All database operations go through the storage layer, making it swappable if needed

## External Dependencies

### Database
- **PostgreSQL** — Primary data store, connected via `DATABASE_URL` environment variable. Uses `pg` (node-postgres) connection pool

### Discord Integration
- **discord.js-selfbot-v13** — Self-bot library for connecting to Discord with a user token (not a regular bot token). Handles message events, sending messages to channels, and executing automated actions

### Key NPM Packages
- **drizzle-orm** + **drizzle-kit** — Database ORM and migration tooling
- **express** — HTTP server framework
- **zod** — Runtime schema validation (shared between client and server)
- **@tanstack/react-query** — Client-side data fetching/caching
- **shadcn/ui** (Radix UI + Tailwind) — UI component library
- **framer-motion** — Animation library
- **wouter** — Client-side routing
- **vite** — Frontend build tool and dev server
- **esbuild** — Server bundling for production