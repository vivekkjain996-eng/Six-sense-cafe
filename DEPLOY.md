# Deploying for free (Neon + Vercel)

Total cost: $0. Both Neon and Vercel have free tiers that don't expire and
don't require a credit card for this level of usage.

## 1. Push this project to GitHub

Vercel deploys by connecting to a GitHub repo.

1. Create a new **empty** repo on GitHub (no README/gitignore — this project
   already has one): https://github.com/new
2. In this project folder, add the remote and push (replace the URL with
   your new repo's URL):
   ```
   git remote add origin https://github.com/<your-username>/restaurant-qr-ordering.git
   git branch -M main
   git push -u origin main
   ```

## 2. Create a free Postgres database on Neon

1. Sign up at https://neon.tech (free, no card required for the free tier).
2. Create a new project (any name/region is fine).
3. Copy the connection string it gives you — it looks like:
   ```
   postgresql://<user>:<password>@<host>/<db>?sslmode=require
   ```
   That's your `DATABASE_URL`.

## 3. Deploy to Vercel

1. Sign up / log in at https://vercel.com (you can sign in with your GitHub
   account).
2. Click "Add New… → Project", and import the `restaurant-qr-ordering` repo
   you just pushed.
3. Before deploying, add these Environment Variables (Project Settings →
   Environment Variables):
   | Name | Value |
   |---|---|
   | `DATABASE_URL` | the Neon connection string from step 2 |
   | `JWT_SECRET` | any long random string (e.g. generate one with `openssl rand -hex 32`) |
   | `APP_URL` | your Vercel URL, e.g. `https://restaurant-qr-ordering.vercel.app` (you'll know the exact URL after the first deploy — you can update this env var afterward and redeploy) |
4. Click Deploy. Vercel will run `npm install` and `next build` automatically.

## 4. Set up the database schema + demo data

Once you have the `DATABASE_URL` from Neon, run this **from your own machine**
(pointed at the Neon database) — Vercel's free tier doesn't give you a shell,
so migrations are run locally against the remote database:

```
# in your .env, set DATABASE_URL to the Neon connection string
npm run prisma:migrate -- --name init
npm run seed
```

This creates the tables and seeds a demo restaurant, an admin login
(`owner@demo.com` / `password123` — change this before real use), 5 tables,
and a sample menu, directly in your live Neon database.

## 5. Access your live app

- Public site: `https://<your-project>.vercel.app`
- Admin login: `https://<your-project>.vercel.app/admin/login`

After confirming `APP_URL` in Vercel's env vars matches your real deployed
URL (redeploy after changing it), any QR codes you generate via the admin
table management will correctly point to your live domain.

## Ongoing cost as you grow

- **Neon free tier**: enough for a single restaurant's data comfortably;
  scales up on a paid plan only if you outgrow it (many GB / high traffic).
- **Vercel free (Hobby) tier**: fine for personal/small business projects;
  their terms restrict Hobby tier to non-commercial use — worth reading
  Vercel's current Hobby plan terms once you're taking real paying customers,
  since a commercial restaurant business may need their paid tier eventually.
