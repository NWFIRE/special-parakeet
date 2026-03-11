# TradeWorx

TradeWorx is a production-oriented SaaS app for small teams that need marketing pages, authentication, project management, task tracking, invites, analytics, subscription billing, and a secure customer portal for inspection reports in one Next.js codebase.

## Stack

- Next.js App Router with TypeScript
- Tailwind CSS
- Prisma ORM with PostgreSQL
- NextAuth (Auth.js) with email/password and Google login
- Stripe subscriptions and billing portal
- Vitest for unit tests
- Vercel-ready deployment flow

## Architecture

### Top-level folders

- `app/`: routes, layouts, loading/error states, and API handlers
- `components/`: UI primitives, forms, dashboard widgets, layout shell, inspection workflows, and report rendering
- `lib/`: auth, Prisma, Stripe, inspection config, server actions, validation, permissions, portal access, and shared utilities
- `prisma/`: schema, SQL migrations, and seed data
- `tests/`: unit tests and test setup
- `types/`: app-wide TypeScript augmentations
- `legacy-src/`: preserved legacy Base44/Vite code from the prior app

### Product areas

- Marketing site: `/`
- Team auth: `/login`, `/signup`
- Customer auth: `/portal/login`
- Team app: `/dashboard`, `/projects`, `/board`, `/inspections`, `/analytics`, `/team`, `/settings`, `/billing`
- Customer portal: `/portal/reports`, `/portal/reports/[reportId]`
- Printable report route: `/inspections/[reportId]/print`
- Billing/webhooks: `/api/billing/checkout`, `/api/billing/portal`, `/api/stripe/webhook`
- Auth callbacks: `/api/auth/[...nextauth]`

## Local setup

1. Install dependencies.

```bash
npm install
```

2. Copy `.env.example` to `.env` and fill in the required values.

3. Run Prisma generate and migrate.

```bash
npm run prisma:generate
npm run prisma:migrate
```

4. Seed demo data.

```bash
npm run prisma:seed
```

5. Start the app.

```bash
npm run dev
```

## Vercel deployment

### What is already configured

- `vercel.json` sets the build command to `npm run vercel-build`
- `vercel-build` runs:

```bash
prisma generate && prisma migrate deploy && next build
```

- `postinstall` runs `prisma generate` so the Prisma client is always available during installs.

### Recommended Vercel setup

1. Import the repo into Vercel.
2. Create or attach a PostgreSQL database.
3. Add the environment variables listed below.
4. Set your production domain.
5. In Stripe, create a webhook pointing to:

```text
https://YOUR_DOMAIN/api/stripe/webhook
```

6. Deploy.

### Postgres notes for Prisma on Vercel

Use two URLs when possible:

- `DATABASE_URL`: pooled or standard runtime connection string used by the app
- `DIRECT_URL`: direct non-pooled connection string used by Prisma migrations

If you use Vercel Postgres or Neon, this separation is the safest default for `prisma migrate deploy` during builds.

## Exact environment variables required

### Required in production

- `DATABASE_URL`
  Purpose: Prisma runtime database connection
  Example: `postgresql://USER:PASSWORD@HOST:5432/tradeworx?sslmode=require`

- `DIRECT_URL`
  Purpose: Prisma direct connection for `prisma migrate deploy`
  Example: `postgresql://USER:PASSWORD@HOST:5432/tradeworx?sslmode=require`

- `NEXTAUTH_SECRET`
  Purpose: session and JWT signing secret
  Example: a long random string generated from a password manager or `openssl rand -base64 32`

- `NEXTAUTH_URL`
  Purpose: canonical auth/app base URL
  Example: `https://app.yourdomain.com`

- `NEXT_PUBLIC_APP_URL`
  Purpose: public base URL used for redirect links and invite URLs
  Example: `https://app.yourdomain.com`

### Required only when Stripe billing is enabled

- `STRIPE_SECRET_KEY`
  Purpose: server-side Stripe API access
  Example: `sk_live_...`

- `STRIPE_WEBHOOK_SECRET`
  Purpose: verifies Stripe webhook signatures
  Example: `whsec_...`

- `STRIPE_PRICE_ID`
  Purpose: recurring subscription price used by checkout
  Example: `price_...`

### Required only if Google sign-in is enabled

- `GOOGLE_CLIENT_ID`
  Purpose: Google OAuth client id

- `GOOGLE_CLIENT_SECRET`
  Purpose: Google OAuth client secret

If these two Google variables are omitted, email/password auth still works and the Google login button is hidden.

## Seed accounts

After `npm run prisma:seed`, you can sign in with:

- Owner: `owner@tradeworx.dev` / `Password123!`
- Admin: `admin@tradeworx.dev` / `Password123!`
- Member: `member@tradeworx.dev` / `Password123!`
- Customer portal: `client@tradeworx.dev` / `Password123!`

## Customer portal

- Customer accounts use the same secure credentials auth layer but are separated by `userType` and `clientId` on the server.
- Every portal page checks the signed-in customer against the report's `clientId` before rendering.
- Published inspection reports render with company branding, summary details, asset findings, and signatures.

## Stripe notes

- Billing actions always follow the user's active workspace selection.
- Checkout and billing portal buttons are wired to server-side Stripe route handlers.
- Billing actions are owner-only.
- The webhook route updates subscription state and renewal dates from Stripe events.
- You must create a Stripe product and recurring price, then place the price id into `STRIPE_PRICE_ID`.

## Inspection reporting system

### Supported service workflows

- Fire Extinguishers
- Fire Alarm
- Fire Sprinkler
- Kitchen Suppression
- Emergency / Exit Lighting
- Backflow
- Other custom service work

### What the inspection module does

- Reuses customer, site, and asset records for repeat inspections
- Auto-fills recurring equipment and compliance fields from prior history
- Tracks what was auto-filled and which values were overridden by a technician
- Supports per-asset statuses, deficiencies, recommendations, and follow-up flags
- Stores branded company profile data for report output
- Generates a polished printable customer report from finalized data

### Data model highlights

- `TeamProfile`: company branding, license numbers, certification text, disclaimer, footer text, and contact info
- `ClientSite`: customer property/location records with local contacts and defaults
- `InspectionAsset`: reusable equipment/device records tied to a customer site
- `InspectionReport`: report header, summary, signatures, portal visibility, and print metadata
- `InspectionReportAsset`: per-report snapshot of each inspected asset/device
- `InspectionFieldAudit`: audit trail of auto-filled fields and technician overrides

### Technician workflow

1. Create or select a customer and site.
2. Choose the inspection service type.
3. Let TradeWorx pull forward reusable asset data and prior verified values.
4. Review each asset card, update findings, and apply deficiency templates when needed.
5. Add summary notes, printed names, signatures, and attachments/URLs.
6. Save as draft or issue the report.
7. Open the printable report route for a customer-ready version.

### Customer-facing report output

- Uses the company report profile from `/settings`
- Shows customer and property details, service date, technician and license info
- Highlights pass, attention, and fail states in a clean branded layout
- Includes signatures, summary notes, deficiencies, and asset-level detail
- Designed to be printable and suitable for PDF generation through the browser or a future document service

### Migrations

Inspection reporting uses these migrations:

- `prisma/migrations/20260311112000_inspections_module/migration.sql`
- `prisma/migrations/20260311183000_inspection_reporting_platform/migration.sql`

If you are deploying to an existing environment, make sure both are applied before using `/inspections`.

## Assumptions

- Workspace invites are link-based for this version; SMTP email sending is not included.
- Workspace creation happens during standard signup unless the user lands on `/signup?invite=...`.
- Customer portal accounts are provisioned directly in the database for this version; there is no self-serve client signup UI yet.
- Print-friendly HTML is implemented now; dedicated binary PDF generation can be layered on top of the printable route if you later want server-side PDF files stored automatically.

## Tests

Run unit tests with:

```bash
npm test
```

