# 🏷️ Trend Trackers — Smart RFID Inventory Intelligence

A retail inventory intelligence platform for a clothing store ("Texs Mart"). Every garment carries an **RFID tag**, and the system tracks each item through its full in-store lifecycle — **on the rack → misplaced → billing → sold → stolen** — while flagging theft and misplacement in real time. Store managers get a live analytics dashboard and an **AI assistant** that answers questions about their inventory in plain English.

Built with Next.js 15, Supabase, and Tailwind CSS.

---

## ✨ Features

- **Live operations dashboard** — total inventory, status breakdown, and category / section / brand analytics, plus a real-time activity feed that updates as RFID events stream in.
- **RFID lifecycle tracking** — every item has a status (`ON_RACK`, `MISPLACED`, `BILLING`, `SOLD`, `STOLEN`) and both a *home rack* and *current rack*.
- **Theft & misplacement alerts** — items detected at the exit gate without billing raise a critical theft alert; items away from their home rack raise a misplacement alert.
- **Searchable inventory** — filter by category, status, and rack, with full-text search across product name, RFID tag, barcode, and brand (paginated).
- **Inventory management (admin)** — add items, bulk-import via CSV, and export data.
- **AI Chat assistant** — a natural-language assistant that reads a live snapshot of your inventory and answers manager questions ("How many items are misplaced?", "What's in RACK-C02?", "List stolen items").
- **Employee management (admin)** — create and manage staff accounts with role-based access.
- **Role-based access control** — Admins and Employees see different navigation and permissions.
- **Movement simulation** — trigger status changes to see alerts, events, and movements generated end-to-end.

---

## 🧩 Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) + React 19 |
| Styling | Tailwind CSS |
| Database & Auth | Supabase (PostgreSQL + Auth) |
| Charts | Recharts |
| Icons | Lucide React |
| AI Assistant | LLM via the OpenRouter API |
| Hosting | Vercel |

---

## 🔄 How It Works

Each product is tagged with an RFID chip and assigned a **home rack**. RFID readers around the store (shelves, billing counter, exit gate) record scans. Each scan can generate:

- an **event** (a movement was recorded),
- a **movement** (from one rack to another), and
- an **alert** if the movement is suspicious (e.g. exit gate without billing → theft).

The dashboard aggregates all of this into live metrics and charts. The status of each item drives the whole system:

| Status | Meaning |
|---|---|
| `ON_RACK` | Correctly placed on its home rack |
| `MISPLACED` | Detected on a different rack than assigned |
| `BILLING` | Moved to the checkout counter |
| `SOLD` | Purchased and checked out |
| `STOLEN` | Left the store (exit gate) without being billed |

If the database has no live inventory yet, the app gracefully falls back to realistic demo data so every screen stays populated.

---

## 🤖 The AI Assistant

The AI Chat page answers manager questions using the store's **actual live data**:

1. It queries Supabase for current counts, category breakdowns, recent alerts, rack movements, and lists of stolen / misplaced items.
2. It builds a structured, up-to-the-second context summary from that data.
3. It sends the context plus the manager's question to an LLM (via OpenRouter) and returns a concise, data-grounded answer.

A lighter, rule-based keyword responder is also included for quick counts without an API call.

---

## 📁 Project Structure

```
├── app/
│   ├── dashboard/          # Live metrics, charts, activity feed
│   ├── inventory/          # Searchable/filterable inventory table
│   │   └── manage/         # Add / bulk-import / export (admin)
│   ├── alerts/             # Theft & misplacement alerts
│   ├── ai-chat/            # AI assistant page
│   ├── employees/          # Staff management (admin)
│   ├── settings/           # Profile settings
│   ├── login/              # Supabase email/password login
│   ├── api/
│   │   └── create-employee/ # Server route: creates Auth user + profile
│   └── layout.jsx          # Root layout with AuthProvider + shell
├── components/             # Reusable UI (cards, charts, shell, badges)
├── lib/
│   ├── supabase.js         # Supabase client + status helpers
│   ├── auth.js             # Auth + profile helpers
│   ├── authContext.js      # React context for the logged-in user & role
│   ├── data.js             # Inventory queries, CRUD, CSV import
│   ├── liveStore.js        # Demo data + live "tick" event generator
│   ├── simulation.js       # Status-change simulation (alerts/events/movements)
│   └── retailAssistant.js  # Builds live context + calls the LLM
└── ...config files
```

---

## 🗄️ Database (Supabase / PostgreSQL)

The app uses the following tables:

| Table | Purpose |
|---|---|
| `inventory` | Every tagged item, its status, home/current rack, price, attributes |
| `racks` | Store rack definitions |
| `alerts` | Theft / misplacement alerts |
| `events` | RFID scan / movement events |
| `movements` | Rack-to-rack movement log |
| `simulation_config` | Simulation settings |
| `profiles` | User accounts with `role` (ADMIN / EMPLOYEE) |

---

## 🔐 Authentication & Roles

- Users sign in with **Supabase Auth** (email + password).
- Each user has a `profiles` row with a `role` of **ADMIN** or **EMPLOYEE**.
- A shared React context (`authContext`) exposes the current user, profile, and role to the whole app.
- Admin-only areas (employee management, inventory management) are hidden from employees and guarded in the UI.
- Creating an employee runs through a server-side API route that uses the Supabase **service-role key** to create the Auth user and profile together, rolling back if either step fails.

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- A [Supabase](https://supabase.com) project (URL + anon key + service-role key)
- An [OpenRouter](https://openrouter.ai) API key (for the AI Chat feature)

### Local development

```bash
# 1. Install dependencies
npm install

# 2. Configure environment variables
cp .env.example .env.local     # then fill in your keys

# 3. Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key (browser-safe) |
| `SUPABASE_SERVICE_ROLE_KEY` | Service-role key — **server only**, used by the employee-creation route |
| `NEXT_PUBLIC_OPENROUTER_API_KEY` | OpenRouter key that powers the AI assistant |

---

## ☁️ Deployment (Vercel)

1. Push the repository to GitHub and import it into Vercel.
2. Keep the framework preset as **Next.js**.
3. Add the environment variables listed above in the Vercel project settings.
4. Deploy.

See [`DEPLOYMENT.md`](./DEPLOYMENT.md) for detailed steps.

---

## 📝 License

This project was built for educational purposes.
