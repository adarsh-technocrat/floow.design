# floow.design

AI-powered mobile app design platform. Describe your app in plain English, get pixel-perfect mobile designs for iOS and Android in seconds.

**Live:** [floow.design](https://floow.design)

## Tech Stack

| Layer     | Technology                                |
| --------- | ----------------------------------------- |
| Framework | Next.js 16 (App Router, React 19)         |
| AI        | Google Vertex AI (Gemini 2.5 Pro / 3 Pro) |
| Database  | PostgreSQL on Neon, Prisma ORM            |
| Auth      | Firebase Authentication                   |
| Payments  | Stripe (subscriptions + credits)          |
| Email     | Resend                                    |
| Storage   | Vercel Blob                               |
| Styling   | Tailwind CSS 4                            |

## Getting Started

### Prerequisites

- Node.js 22+
- pnpm 9+
- PostgreSQL database (Neon recommended)
- Firebase project
- Google Cloud service account with Vertex AI enabled

### Setup

```bash
# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env.local
# Fill in all values in .env.local

# Push database schema
pnpm db:push

# Generate Prisma client
pnpm db:generate

# Start development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command              | Description                     |
| -------------------- | ------------------------------- |
| `pnpm dev`           | Start development server        |
| `pnpm build`         | Production build                |
| `pnpm start`         | Start production server         |
| `pnpm lint`          | Run ESLint                      |
| `pnpm lint:fix`      | Fix lint errors                 |
| `pnpm format`        | Format code with Prettier       |
| `pnpm typecheck`     | Run TypeScript type check       |
| `pnpm db:push`       | Push Prisma schema to database  |
| `pnpm db:migrate`    | Run Prisma migrations           |
| `pnpm db:studio`     | Open Prisma Studio              |
| `pnpm blog:generate` | Generate blog posts (see below) |

## Blog Generation Pipeline

Automated pipeline that generates SEO-optimized blog posts using Gemini with Google Search grounding, generates banner images, and seeds them to the database.

### Usage

```bash
# Generate 1 blog post (auto-discovers trending topic)
pnpm blog:generate

# Generate 3 blog posts
pnpm blog:generate 3

# Preview without writing to DB
pnpm blog:generate 2 --dry-run

# Custom time range and location
pnpm blog:generate 5 --time "month" --location "US"

# Generate about a specific topic
pnpm blog:generate 1 --topic "vibe coding trend in 2026"

# Multiple topics (comma-separated) — cycles through them
pnpm blog:generate 3 --topic "Figma vs Framer,AI prototyping tools,design tokens"
```

### Options

| Flag         | Description                                        | Default                       |
| ------------ | -------------------------------------------------- | ----------------------------- |
| `--topic`    | Specific topic(s) to write about (comma-separated) | Auto-discover from news       |
| `--time`     | Time range for news search                         | `week`                        |
| `--location` | Geographic focus                                   | `global tech/design industry` |
| `--dry-run`  | Write MDX files but skip DB seeding                | `false`                       |

### How It Works

1. **Content Generation** - Gemini 2.5 Flash with Google Search grounding finds the strongest recent story in AI design/mobile and generates a full article with SEO slug, tags, meta description, TLDR, and source citations
2. **Banner Generation** - Gemini generates a banner image relevant to the article (falls back to Unsplash if unavailable), uploaded to Vercel Blob
3. **Database Seeding** - Writes `.mdx` file to `src/content/blog/` and upserts the post into PostgreSQL via Prisma

### Features

- Duplicate topic avoidance via existing slug detection
- Auto JSON repair if LLM output is malformed
- Dual auth: Vertex AI service account or plain `GOOGLE_GENERATIVE_AI_API_KEY`
- Unsplash fallback for banner images
- Keyword-rich slugs, structured tags, and source links

### Daily Automation

Add to crontab or CI for daily publishing:

```bash
# Generate 2 posts every day at 8 AM
0 8 * * * cd /path/to/mobile-flow && pnpm blog:generate 2
```

## Project Structure

```
src/
  app/
    (landing)/          # Marketing pages (blog, pricing, etc.)
    api/                # API routes (chat, blog, auth, stripe, etc.)
  components/
    blog/               # Blog MDX renderer and components
    landing/            # Landing page components
    ui/                 # Shared UI components
  content/
    blog/               # MDX blog post files
  lib/
    agent/              # AI agent tools and planner
    blog.ts             # Blog data access layer
    db.ts               # Prisma client
    email/              # Resend email templates
  constants/            # Agent prompts, plans
scripts/
  generate-blogs.ts     # Blog generation pipeline
prisma/
  schema.prisma         # Database schema
```

## Environment Variables

See [`.env.example`](.env.example) for all required variables:

- **Database** - `DATABASE_URL`
- **Firebase** - `NEXT_PUBLIC_FIREBASE_*`
- **Google AI** - `GOOGLE_CLIENT_EMAIL`, `GOOGLE_PRIVATE_KEY`, `GOOGLE_VERTEX_PROJECT`
- **Stripe** - `STRIPE_SECRET_KEY`, `STRIPE_PRICE_*`
- **Vercel Blob** - `BLOB_READ_WRITE_TOKEN`
- **Resend** - `RESEND_API_KEY`
- **Blog Pipeline** - `GOOGLE_GENERATIVE_AI_API_KEY` (optional, falls back to Vertex credentials)

## License

Proprietary. All rights reserved.
