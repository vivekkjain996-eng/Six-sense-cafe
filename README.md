# Restaurant QR Ordering — v0 (Phase 1–2 scaffold)

Web-based QR ordering system: customers scan a per-table QR code to reach that
table's menu; kitchen/admin manage orders in real time.

Runs as a **plain Next.js app** — no custom server, no paid services required.
Deploys for $0 on Vercel (hosting) + Neon (Postgres). Live updates use polling
(refetch every few seconds) rather than WebSockets, since Vercel's free tier
runs serverless functions, not a persistent server process.

## What's implemented so far

- Next.js (App Router) + TypeScript + Tailwind
- Prisma schema for the full data model (restaurants, tables, categories,
  menu items, table sessions/bills, orders, order items)
- Admin auth: login/logout via JWT stored in an httpOnly cookie
- Table management: create tables, generate/download a per-table QR code
  (QR encodes an opaque `qrToken`, not the raw table number — see security
  note below)
- Customer-facing QR resolve endpoint that opens (or reuses) a table's
  running bill session
- Admin dashboard page showing tables and open-session order counts
- Seed script with a demo restaurant, admin login, 5 tables, sample menu

## Not yet implemented (next phases)

- Customer menu browsing + cart UI
- Order placement API + order_items creation
- Admin order board with live status updates (Pending/Preparing/Ready/Served),
  refreshed via polling
- Menu management CRUD UI
- Billing summary UI + mark-paid/close-table flow

## Local development

1. Copy `.env.example` to `.env` and point `DATABASE_URL` at a Postgres
   instance (a free Neon database works — see deployment guide below —
   or any local Postgres).
2. Install dependencies:
   ```
   npm install
   ```
3. Run the initial migration and generate the Prisma client:
   ```
   npm run prisma:migrate -- --name init
   ```
4. Seed demo data (restaurant, admin login, tables, sample menu):
   ```
   npm run seed
   ```
5. Start the dev server:
   ```
   npm run dev
   ```
6. Visit `http://localhost:3000/admin/login` and sign in with:
   - email: `owner@demo.com`
   - password: `password123`

## Deploying for free (Neon + Vercel)

See `DEPLOY.md` for the full step-by-step walkthrough.

## Security note on QR codes

Each table has a random `qrToken` (UUID), and the QR image encodes
`{APP_URL}/menu/{qrToken}` — never the raw table number. The server resolves
the token to a table internally. This matters: if the QR just encoded
`/menu/table/1`, a customer could edit the URL to order onto another
table's bill.
