# Service Manager

Service Manager is a comprehensive dashboard application designed for service-based businesses to manage their operations, including customers, jobs, workers, contractors, and financial documents.

## Features

### Core Management
- **Customers**: Manage customer profiles, contact details, and service history.
- **Jobs**: Track job assignments, status, and scheduling.
- **Workers & Contractors**: Manage internal staff and external contractors, including availability and assignments.
- **Job Sites**: Track multiple locations for customers.

### Financials
- **Quotes**: Create and manage quotes with detailed line items.
- **Contracts**: Manage service agreements and contracts.
- **Invoices**: Generate and track invoices.

### Operations & Tools
- **Checklists**: Create and assign standard operating procedure checklists to jobs.
- **Services Catalog**: Configure service offerings with categories, default pricing, and durations.
- **Search**: Global search across all entities.
- **Activity Feeds**: Comprehensive audit trails for all key entities (Jobs, Customers, Workers, etc.).

### UI/UX
- **List/Grid Views**: Toggle between detailed list views and visual grid/card views for all major entities.
- **Responsive Design**: Optimized for desktop and tablet use.
- **Theming**: Customizable branding and appearance settings.

## Getting Started

### Prerequisites
- Node.js (v18+)
- Postgres Database (Supabase recommended)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Orr0x/Service_Manager.git
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Copy `.env.example` to `.env.local` and populate with your database credentials.

4. Run the development server:
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Tech Stack
- **Framework**: [Next.js](https://nextjs.org) (App Router)
- **Database**: Postgres (Supabase)
- **ORM**: Drizzle ORM
- **API**: tRPC
- **Styling**: Tailwind CSS
- **Icons**: Lucide React


## Local Development on Ubuntu Linux

### 1) Install prerequisites

```bash
sudo apt update
sudo apt install -y build-essential ca-certificates curl git
```

Install Node.js 20 LTS (recommended):

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v
npm -v
```

### 2) Create your local environment file

This repository includes `.env.example` with placeholders only. Create `.env.local` manually:

```bash
cp .env.example .env.local
```

Then open `.env.local` and replace placeholder values with your own values from:

- **Vercel Project Settings → Environment Variables** (for app/runtime values)
- **Supabase Project Settings → API / Database** (for Supabase URL, publishable/anon key, service role key, and DB connection string)

> Important: never commit `.env.local` and never paste secret values into source-controlled files.

### 3) Validate your environment safely

Run:

```bash
npm run check-env
```

This command only checks whether required variables are present; it does **not** print secret values.

### 4) Install dependencies and run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000

### 5) Optional quality checks before opening a PR

```bash
npm run lint
npm run type-check
npm run build
```
