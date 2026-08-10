# Restaurant QR Ordering

Web-based QR ordering system for Six Sense Cafe & Restaurant: customers scan
a per-table QR code to browse the menu, add items, and place orders. Kitchen
staff see orders arrive live and update their status; admin can manage the
menu, print bills, mark payment method, and track daily earnings.

Runs as a **plain Next.js app** — no custom server. Deploys for $0 on Vercel
(hosting) + Neon (Postgres). Live updates use polling (refetch every few
seconds) rather than WebSockets, since Vercel's free tier runs serverless
functions, not a persistent server process.

## Features

**Customer side** (no login, reached by scanning a table's QR code)
- Browse the full menu by category, with a quick-jump category nav
- Add items to cart, adjust quantity, place an order
- See a running bill total (stays visible while scrolling) and each order's
  status (Order received / Preparing / Ready / Served)
- Can place multiple separate orders that all add to the same table bill

**Admin side** (`/admin/login`)
- Live dashboard of all tables and their open bills, auto-refreshing, with a
  "new order waiting" alert
- Filter orders by table or status; change an order's status from a dropdown
- Menu management: add/edit/delete categories and items, toggle availability
- Print a bill per table; mark it paid (Cash / Card / Online) and close the
  table, freeing it up for the next customer
- Daily earnings report: total revenue and breakdown by payment method, with
  a date picker for past days

## Local development

1. Copy `.env.example` to `.env` and point `DATABASE_URL` at a Postgres
   instance (a free Neon database works — see `DEPLOY.md` — or any local
   Postgres).
2. Install dependencies:
   ```
   npm install
   ```
3. Run the initial migration:
   ```
   npm run prisma:migrate -- --name init
   ```
4. Seed the real restaurant data (restaurant, admin login, 5 tables with
   fixed QR tokens, full menu):
   ```
   npm run seed
   ```
   The admin email/password are set in `prisma/seed.ts` — change them there
   before running against a database you intend to keep.
5. Build and start (this app doesn't use `next dev`'s live-reload machinery
   in the loop that matters for QR/tunnel testing — see the note in
   `DEPLOY.md` history if working through a tunnel):
   ```
   npm run build
   npm start
   ```
6. Visit `http://localhost:3000/admin/login`.

## Deploying for free (Neon + Vercel)

See `DEPLOY.md` for the full step-by-step walkthrough.

## Security note on QR codes

Each table has a random `qrToken` (UUID), and the QR image encodes
`{APP_URL}/menu/{qrToken}` — never the raw table number. The server resolves
the token to a table internally. This matters: if the QR just encoded
`/menu/table/1`, a customer could edit the URL to order onto another
table's bill.
