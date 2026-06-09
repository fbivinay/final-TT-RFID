# Deploy Trend Trackers to Vercel

## Option 1: Deploy from GitHub

1. Push this folder to a new GitHub repository.
2. Open Vercel and choose **Add New Project**.
3. Import the GitHub repository.
4. Set these environment variables in Vercel:

```text
NEXT_PUBLIC_SUPABASE_URL=https://kjogiqwtyrwqxiqcibat.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtqb2dpcXd0eXJ3cXhpcWNpYmF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzNjc1NDYsImV4cCI6MjA5NTk0MzU0Nn0.wf6HlxC5729_NU2jGftJqgjoVtkov_-Hf5hcLsw2L30
```

5. Keep the Vercel framework preset as **Next.js**.
6. Deploy.

## Option 2: Deploy from CLI

```bash
npx vercel
npx vercel --prod
```

When Vercel asks for the build settings, use:

```text
Framework Preset: Next.js
Build Command: npm run build
Install Command: npm install
Output Directory: .next
```

## Verified Build

This project has already passed:

```bash
npm.cmd run build
```
