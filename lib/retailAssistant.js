"use client";

import { supabase } from "./supabase";
import { buildDemoDashboardData } from "./liveStore";

// ── data fetchers ─────────────────────────────────────────────────────────────

async function analyzeInventory() {
  const { count: total } = await supabase
    .from("inventory")
    .select("*", { count: "exact", head: true });

  if (!total) {
    const demo = buildDemoDashboardData();
    return {
      total: demo.totalInventory,
      statusCounts: demo.statusCounts,
      categories: demo.categories,
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

  if (!data?.length) {
    return { count: 5, types: { MISPLACEMENT: 3, THEFT_ALERT: 1, BILLING: 1 }, recent: [] };
  }

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

// ── recommendations engine ────────────────────────────────────────────────────

function generateRecommendations(inv, alerts) {
  const recs = [];

  const misplaced = inv.statusCounts.MISPLACED || 0;
  const stolen    = inv.statusCounts.STOLEN    || 0;

  if (misplaced > 50) {
    const pct = inv.total > 0 ? ((misplaced / inv.total) * 100).toFixed(1) : 0;
    recs.push(`Misplacement rate is ${pct}% (${misplaced.toLocaleString("en-IN")} items). Assign floor staff to perform a rack audit immediately.`);
  }

  if (stolen > 10) {
    recs.push(`Theft count (${stolen}) is elevated. Review RFID exit gate logs and coordinate with store security.`);
  }

  if ((alerts.types?.THEFT_ALERT || 0) >= 2) {
    recs.push("Multiple theft alerts are active. Consider a spot-check of high-value racks (Footwear, Accessories).`");
  }

  if ((alerts.types?.MISPLACEMENT || 0) > 3) {
    recs.push("High misplacement alert frequency detected. Retrain floor staff on rack discipline protocol.");
  }

  if (recs.length === 0) {
    recs.push("Inventory health is within normal parameters. Continue routine RFID scanning per schedule.");
  }

  return recs;
}

// ── response builders ─────────────────────────────────────────────────────────

function demoNote(isDemo) {
  return isDemo ? "\n\n*Note: No live inventory found — data shown is from the active store simulation.*" : "";
}

function fmt(n) { return Number(n || 0).toLocaleString("en-IN"); }

// ── pattern handlers ──────────────────────────────────────────────────────────

const PATTERNS = [
  {
    test: (q) => /misplac|wrong\s*place|not in place/i.test(q),
    async handle() {
      const inv = await analyzeInventory();
      const count = inv.statusCounts.MISPLACED || 0;
      const pct   = inv.total > 0 ? ((count / inv.total) * 100).toFixed(1) : 0;
      return (
        `Misplaced Items Report\n\n` +
        `${fmt(count)} items are currently misplaced across Texs Mart floors.\n` +
        `This is ${pct}% of total tracked inventory (${fmt(inv.total)} items).\n\n` +
        `Recommendation: Assign floor staff to locate and reposition items. Prioritise high-value categories such as Footwear and Accessories.` +
        demoNote(inv.isDemo)
      );
    },
  },
  {
    test: (q) => /stolen|theft|thief|missing item|loss prevention/i.test(q),
    async handle() {
      const inv    = await analyzeInventory();
      const alerts = await analyzeAlerts();
      const stolen = inv.statusCounts.STOLEN || 0;
      return (
        `Theft and Loss Report\n\n` +
        `${fmt(stolen)} items are currently flagged as STOLEN.\n` +
        `Active theft alerts: ${alerts.types?.THEFT_ALERT || 0}\n\n` +
        `Recommendation: Review RFID exit gate logs. Coordinate with security personnel for all flagged items. Check Alerts page for individual item details.` +
        demoNote(inv.isDemo)
      );
    },
  },
  {
    test: (q) => /drop|declin|decreas|fell|lower|reduc|why.*down|inventory.*down|less.*stock/i.test(q),
    async handle() {
      const inv       = await analyzeInventory();
      const movements = await analyzeMovements();
      const { statusCounts: sc } = inv;
      const topCat = inv.categories?.[0];
      return (
        `Inventory Change Analysis\n\n` +
        `Current inventory movement breakdown:\n` +
        `  Sold / cleared:        ${fmt(sc.SOLD)} items\n` +
        `  At billing / checkout: ${fmt(sc.BILLING)} items\n` +
        `  Stolen / flagged:      ${fmt(sc.STOLEN)} items\n` +
        `  Misplaced:             ${fmt(sc.MISPLACED)} items\n\n` +
        (topCat ? `${topCat.name} is the highest-volume category with ${fmt(topCat.value)} items and is likely contributing the most to any observed decline.\n\n` : "") +
        `Total RFID events tracked in current session: ${fmt(movements.count)}` +
        demoNote(inv.isDemo)
      );
    },
  },
  {
    test: (q) => /risk|danger|concern|critical|urgent|anomal|problem|issue|operati/i.test(q),
    async handle() {
      const inv       = await analyzeInventory();
      const alerts    = await analyzeAlerts();
      const movements = await analyzeMovements();
      const recs      = generateRecommendations(inv, alerts);

      const issues = [];
      if ((inv.statusCounts.MISPLACED || 0) > 0)  issues.push(`${fmt(inv.statusCounts.MISPLACED)} items misplaced`);
      if ((inv.statusCounts.STOLEN    || 0) > 0)  issues.push(`${fmt(inv.statusCounts.STOLEN)} items flagged as stolen`);
      if (alerts.count > 0)                        issues.push(`${fmt(alerts.count)} open alerts`);
      if (issues.length === 0)                     issues.push("No critical issues detected");

      const busiestRack = movements.recentRacks?.[0];

      return (
        `Operational Risk Assessment\n\n` +
        `Active Issues:\n${issues.map((i) => `  • ${i}`).join("\n")}\n\n` +
        (busiestRack ? `Highest activity rack: ${busiestRack.rack} (${busiestRack.count} events)\n\n` : "") +
        `Recommendations:\n${recs.map((r, i) => `  ${i + 1}. ${r}`).join("\n")}` +
        demoNote(inv.isDemo)
      );
    },
  },
  {
    test: (q) => /\balert|notif|warning|flag/i.test(q),
    async handle() {
      const alerts = await analyzeAlerts();
      const breakdown = Object.entries(alerts.types)
        .map(([k, v]) => `  • ${k}: ${v}`)
        .join("\n");
      return (
        `Active Alerts Summary\n\n` +
        `Total open alerts: ${fmt(alerts.count)}\n\n` +
        `By type:\n${breakdown}\n\n` +
        `Full alert details with rack and item information are available on the Alerts page.`
      );
    },
  },
  {
    test: (q) => /categor|section|department|type of item/i.test(q),
    async handle() {
      const inv = await analyzeInventory();
      const lines = inv.categories
        .slice(0, 6)
        .map((c, i) => `  ${i + 1}. ${c.name}: ${fmt(c.value)} items`)
        .join("\n");
      return (
        `Inventory by Category\n\n` +
        `${lines}\n\n` +
        `Total tracked across all categories: ${fmt(inv.total)} items.` +
        demoNote(inv.isDemo)
      );
    },
  },
  {
    test: (q) => /rack|shelf|zone|location|where is|which rack/i.test(q),
    async handle() {
      const movements = await analyzeMovements();
      if (!movements.recentRacks.length) {
        return "No rack movement data is available yet. Start the simulation or ensure RFID events are being recorded to the events table.";
      }
      const lines = movements.recentRacks
        .map((r) => `  • ${r.rack}: ${r.count} events`)
        .join("\n");
      return (
        `Rack Activity Summary\n\n` +
        `Most active racks (based on last 100 RFID events):\n${lines}\n\n` +
        `Highest activity: ${movements.recentRacks[0].rack} — review this rack for potential stock overcrowding or misplacement.`
      );
    },
  },
];

// ── main export ───────────────────────────────────────────────────────────────

export async function generateRetailResponse(question) {
  const q = (question || "").trim();

  for (const pattern of PATTERNS) {
    if (pattern.test(q)) {
      try {
        return await pattern.handle();
      } catch (err) {
        return `I encountered an error fetching live data: ${err.message}. Please check your Supabase connection.`;
      }
    }
  }

  // Default: general inventory health summary
  try {
    const inv    = await analyzeInventory();
    const alerts = await analyzeAlerts();
    const { statusCounts: sc } = inv;
    const onRackPct = inv.total > 0 ? ((sc.ON_RACK / inv.total) * 100).toFixed(1) : 0;

    return (
      `Texs Mart Inventory Summary\n\n` +
      `  Total tracked items: ${fmt(inv.total)}\n` +
      `  On rack (healthy):   ${fmt(sc.ON_RACK)} (${onRackPct}%)\n` +
      `  Misplaced:           ${fmt(sc.MISPLACED)}\n` +
      `  At billing:          ${fmt(sc.BILLING)}\n` +
      `  Sold:                ${fmt(sc.SOLD)}\n` +
      `  Stolen / flagged:    ${fmt(sc.STOLEN)}\n` +
      `  Open alerts:         ${fmt(alerts.count)}\n\n` +
      `For specific insights, try asking about:\n` +
      `  misplaced items · theft risk · inventory drop · alerts · categories · rack activity · operational risks` +
      demoNote(inv.isDemo)
    );
  } catch (err) {
    return `Unable to fetch inventory data: ${err.message}. Please verify Supabase connectivity.`;
  }
}
