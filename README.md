# E-Commerce API

Express + Prisma + Neon PostgreSQL backend for an online alcohol retailer. Fully async/await throughout.

## Stack
- Node.js / Express
- Prisma ORM
- Neon (serverless PostgreSQL)
- JWT auth, bcrypt password hashing

## Age & Compliance Notes

This is a starting point, not a compliance solution — alcohol e-commerce is regulated differently by
country/state, and you're responsible for meeting the rules that apply to you. Things this API does out
of the box:

- Registration requires a `dateOfBirth` and rejects signup outright if the user is under `MINIMUM_AGE`
  (default 21, configurable in `.env`).
- `isAgeVerified` is stored on the user and required before checkout (`requireAgeVerified` middleware).
- Orders record `ageVerifiedAtCheckout` for an audit trail.

What it does **not** do, which you'll likely need for a real launch: government ID / document verification,
shipping-destination legal checks (many regions restrict which states/countries alcohol can ship to),
signature-on-delivery tracking, or tax/licensing logic. Consider a third-party ID verification provider
(e.g. Veriff, Persona) and legal review before going live.

## Setup

1. **Create a Neon database** at https://neon.tech and grab the pooled + direct connection strings.
2. **Configure environment**
   ```bash
   cp .env.example .env
   ```
   Fill in `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`, and `MINIMUM_AGE`.
3. **Install dependencies**
   ```bash
   npm install
   ```
4. **Run migrations**
   ```bash
   npx prisma migrate dev --name init
   ```
5. **Seed sample data**
   ```bash
   npm run seed
   ```
   Seeded accounts (password `Password123!`):
   - admin@bottleshop.com (ADMIN)
   - customer@example.com (CUSTOMER)
6. **Run the server**
   ```bash
   npm run dev
   ```

## Data Model

- **User** — customer or admin, with `dateOfBirth` + `isAgeVerified`
- **Category** — product categories (Whiskey, Wine, Beer, etc.)
- **Product** — includes `abv` (alcohol %), `volumeMl` (bottle size), price, stock
- **Cart / CartItem** — one active cart per user
- **Order / OrderItem** — created at checkout; snapshots price at time of purchase

## API Endpoints

### Auth (`/api/auth`)
- `POST /register` — body: `{ name, email, password, dateOfBirth }`. Rejects under-age signups.
- `POST /login`
- `GET /me` — requires auth

### Categories (`/api/categories`) — public read, ADMIN write
- `GET /`
- `POST /`, `PUT /:id`, `DELETE /:id` — ADMIN only

### Products (`/api/products`) — public read, ADMIN write
- `GET /` — query params: `search`, `categoryId`, `minPrice`, `maxPrice`
- `GET /:id`
- `POST /`, `PUT /:id` — ADMIN only
- `DELETE /:id` — ADMIN only (soft delete: sets `isActive: false`)

### Cart (`/api/cart`) — requires login
- `GET /` — current user's cart with computed total
- `POST /items` — body: `{ productId, quantity }`
- `PUT /items/:itemId` — body: `{ quantity }` (0 removes the item)
- `DELETE /items/:itemId`

### Orders (`/api/orders`) — requires login
- `GET /my` — current user's order history
- `GET /my/:id` — a specific order (must belong to the user)
- `POST /checkout` — **requires age verification**. Body: `{ shippingAddress }`. Converts the cart into
  an order in a single DB transaction: creates the order + order items, decrements product stock, clears
  the cart. Rejects if any item is out of stock or inactive.
- `GET /` — ADMIN only, all orders (optional `?status=` filter)
- `PUT /:id/status` — ADMIN only. Body: `{ status }`, one of `PENDING`, `PAID`, `PROCESSING`, `SHIPPED`,
  `DELIVERED`, `CANCELLED`


