# Trend Trackers

Smart RFID Inventory Intelligence System for Texs Mart.

## Stack

- Next.js 15
- Tailwind CSS
- Supabase
- Recharts
- Lucide Icons
- Vercel-ready

## Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

## Vercel Deployment

This repository is configured for Vercel with `vercel.json`.

Required Vercel environment variables:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

See `DEPLOYMENT.md` for the full GitHub and Vercel deployment steps.

## Supabase Tables Used

- `inventory`
- `racks`
- `alerts`
- `events`
- `simulation_config`
- `movements`

The dashboard logic uses the exact inventory statuses: `ON_RACK`, `MISPLACED`, `BILLING`, `SOLD`, and `STOLEN`.
