# Crypto Dashboard

A small full-stack app for browsing coin prices with search, pagination, and live updates.

- **`back/`** — Express + TypeScript API serving coin data, with zod validation, a
  repository layer, and Server-Sent Events for pushing price updates to clients.
- **`front/`** — React + Vite + TypeScript dashboard: a searchable, paginated coin table
  that updates live as prices change.

See [`decisions.md`](./decisions.md) for the reasoning behind specific design choices
(debouncing, AbortController, SSE vs. polling, the repository pattern, DTOs/validation,
etc).

## Prerequisites

- Node.js 22+ (the backend runs TypeScript directly via `--experimental-strip-types`,
  no build step)

## Getting started

Install dependencies for both apps:

```bash
cd back && npm install
cd ../front && npm install
```

Run the backend (from `back/`, listens on `http://localhost:3000`):

```bash
node --experimental-strip-types index.ts
```

Run the frontend (from `front/`, listens on `http://localhost:5173`):

```bash
npm run dev
```

The backend's CORS is locked to `http://localhost:5173`, so the frontend must run on that
port for requests to succeed.

## API

| Method | Path               | Description                                      |
| ------ | ------------------ | ------------------------------------------------- |
| GET    | `/`                | List coins, paginated (`page`, `limit`, `search`) |
| GET    | `/coins/stream`    | SSE stream of `coin-update` events                |
| PATCH  | `/coins/:coinId`   | Update a coin's value; broadcasts the change       |

## Project structure

```
back/
  index.ts              Express app, routes, validation schemas
  sse.ts                SSE client registry + broadcast
  repositories/          CoinRepository (in-memory implementation)
  middlewares/           404 handler, centralized error handler
  modals/                 Domain (coin) and DTO (coinDto) types
  data/                   Seed coin data

front/
  src/
    DashBoard.tsx         Table, search, pagination, live updates
    DashBoard.css         Dashboard styling
```
