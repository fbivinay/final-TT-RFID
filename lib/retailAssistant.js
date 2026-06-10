"use client";

import { supabase } from "./supabase";

// ── data fetchers ─────────────────────────────────────────────────────────────

async function analyzeInventory() {
  const { count: total } = await supabase
    .from("inventory")
    .select("*", { count: "exact", head: true });

  if (!total) {
    return {
      total: 0,
      statusCounts: { ON_RACK: 0, MISPLACED: 0, BILLING: 0, SOLD: 0, STOLEN: 0 },
      categories: [],
      isDemo: true,
    };
  }

  const statuses = ["ON_RACK", "MISPLACED", "BILLING", "SOLD", "STOLEN"];
  const counts = await Promise.all(
    statuses.map(async (s) => {
      const { count } = await supabase
        .from("inventory")
        .select("*", { count: "exact", head: true })
        .eq("status", s);
      return [s, count || 0];
    })
  );
  const statusCounts = Object.fromEntries(counts);

  const { data: catRows } = await supabase
    .from("inventory")
    .select("category")
    .not("category", "is", null)
    .limit(10000);

  const catMap = {};
  (catRows || []).forEach((r) => {
    catMap[r.category] = (catMap[r.category] || 0) + 1;
  });
  const categories = Object.entries(catMap)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  return { total, statusCounts, categories, isDemo: false };
}

async function analyzeAlerts() {
  const { data } = await supabase
    .from("alerts")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  if (!data?.length) return { count: 0, types: {}, recent: [] };

  const types = {};
  data.forEach((a) => {
    const t = a.alert_type || a.type || "UNKNOWN";
    types[t] = (types[t] || 0) + 1;
  });

  return { count: data.length, types, recent: data.slice(0, 5) };
}

async function analyzeMovements() {
  const { data } = await supabase
    .from("events")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  if (!data?.length) return { count: 0, eventTypes: {}, recentRacks: [] };

  const eventTypes = {};
  const rackMap   = {};
  data.forEach((e) => {
    const t = e.event_type || e.type || "UNKNOWN";
    eventTypes[t] = (eventTypes[t] || 0) + 1;
    const rack = e.to_rack || e.rack;
    if (rack) rackMap[rack] = (rackMap[rack] || 0) + 1;
  });

  const recentRacks = Object.entries(rackMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([rack, count]) => ({ rack, count }));

  return { count: data.length, eventTypes, recentRacks };
}

// ── build live context summary to send to the LLM ────────────────────────────

async function buildContext() {
  const [inv, alerts, movements] = await Promise.all([
    analyzeInventory(),
    analyzeAlerts(),
    analyzeMovements(),
  ]);

  const fmt = (n) => Number(n || 0).toLocaleString("en-IN");
  const sc  = inv.statusCounts;

  const categoryLines = inv.categories.length
    ? inv.categories.map((c) => `  - ${c.name}: ${fmt(c.value)} items`).join("\n")
    : "  - No category data available";

  const alertLines = Object.entries(alerts.types).length
    ? Object.entries(alerts.types).map(([k, v]) => `  - ${k}: ${v}`).join("\n")
    : "  - No alerts";

  const rackLines = movements.recentRacks.length
    ? movements.recentRacks.map((r) => `  - ${r.rack}: ${r.count} events`).join("\n")
    : "  - No rack movement data";

  return `
You are the Texs Mart Retail Operations Assistant — an AI helping store managers understand their live RFID inventory data.

LIVE STORE DATA (fetched right now from Supabase):
- Store: Texs Mart (retail clothing & accessories)
- Total tracked items: ${fmt(inv.total)}
- On rack (correctly placed): ${fmt(sc.ON_RACK)}
- Misplaced: ${fmt(sc.MISPLACED)}
- At billing / checkout: ${fmt(sc.BILLING)}
- Sold: ${fmt(sc.SOLD)}
- Stolen / flagged: ${fmt(sc.STOLEN)}
- Open alerts: ${fmt(alerts.count)}
${inv.isDemo ? "- Note: No live inventory found, data may be empty or simulation not started.\n" : ""}
Inventory by category:
${categoryLines}

Alert breakdown:
${alertLines}

Recent rack activity (last 100 RFID events):
${rackLines}

INSTRUCTIONS:
- Answer the manager's question using the live data above.
- Be concise, professional, and specific — use the actual numbers.
- If something looks concerning (high theft, many misplacements), highlight it.
- If data is zero or missing, say so honestly.
- Do not make up numbers. Only use what's provided above.
- Keep responses under 200 words unless a detailed breakdown is asked.
`.trim();
}

// ── call OpenRouter API ───────────────────────────────────────────────────────

async function callOpenRouter(systemPrompt, question) {
  const apiKey = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new Error("NEXT_PUBLIC_OPENROUTER_API_KEY is not set. Add it to your Vercel environment variables.");
  }

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://final-tt-rfid.vercel.app",
      "X-Title": "Trend Trackers RFID",
    },
    body: JSON.stringify({
      model: "deepseek/deepseek-r1-0528:free",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user",   content: question },
      ],
      max_tokens: 400,
      temperature: 0.4,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenRouter error: ${err}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || "No response received.";
}

// ── main export ───────────────────────────────────────────────────────────────

export async function generateRetailResponse(question) {
  try {
    const systemPrompt = await buildContext();
    return await callOpenRouter(systemPrompt, question);
  } catch (err) {
    return `Unable to get a response: ${err.message}`;
  }
}
