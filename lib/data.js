"use client";

import { INVENTORY_STATUSES, supabase } from "./supabase";
import { buildDemoDashboardData, buildDemoInventoryRows, getDemoFilterOptions, seedAlerts } from "./liveStore";

export async function countRows(table, filters = []) {
  let query = supabase.from(table).select("*", { count: "exact", head: true });
  filters.forEach(([column, value]) => {
    if (value) query = query.eq(column, value);
  });
  const { count, error } = await query;
  if (error) throw error;
  return count || 0;
}

export async function getDashboardData() {
  const totalInventory = await countRows("inventory");
  if (totalInventory === 0) return buildDemoDashboardData();

  const statusCounts = await Promise.all(
    INVENTORY_STATUSES.map(async (status) => [status, await countRows("inventory", [["status", status]])])
  );

  const [categoryRows, sectionRows, brandRows, recentEvents, alerts] = await Promise.all([
    getGroupedInventory("category", 14),
    getGroupedInventory("section", 14),
    getGroupedInventory("brand", 10),
    getRecentEvents(10),
    getOpenAlerts(8)
  ]);

  return {
    totalInventory,
    statusCounts: Object.fromEntries(statusCounts),
    categories: categoryRows,
    sections: sectionRows,
    brands: brandRows,
    recentEvents,
    alerts
  };
}

export async function getGroupedInventory(column, limit = 10) {
  const { data, error } = await supabase
    .from("inventory")
    .select(column)
    .not(column, "is", null)
    .limit(10000);

  if (error) throw error;

  const counts = new Map();
  (data || []).forEach((row) => {
    const key = row[column] || "Unknown";
    counts.set(key, (counts.get(key) || 0) + 1);
  });

  return Array.from(counts, ([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);
}

export async function getRecentEvents(limit = 12) {
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) return [];
  return data || [];
}

export async function getOpenAlerts(limit = 20) {
  const { data, error } = await supabase
    .from("alerts")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) return seedAlerts().slice(0, limit);
  return data?.length ? data : seedAlerts().slice(0, limit);
}

export async function getFilterOptions() {
  const [categories, statuses, racks] = await Promise.all([
    getDistinctValues("category"),
    Promise.resolve(INVENTORY_STATUSES),
    getDistinctValues("current_rack")
  ]);

  if (!categories.length && !racks.length) return getDemoFilterOptions();
  return { categories, statuses, racks };
}

async function getDistinctValues(column) {
  const { data, error } = await supabase
    .from("inventory")
    .select(column)
    .not(column, "is", null)
    .limit(10000);

  if (error) return [];
  return Array.from(new Set((data || []).map((row) => row[column]).filter(Boolean))).sort();
}

export async function getInventoryPage({ search = "", category = "", status = "", rack = "", page = 1, pageSize = 25 }) {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("inventory")
    .select("item_id,rfid_tag_id,barcode,category,brand,product_name,current_rack,status,selling_price,mrp,color,size,gender", {
      count: "exact"
    })
    .order("last_scanned", { ascending: false, nullsFirst: false })
    .range(from, to);

  if (category) query = query.eq("category", category);
  if (status) query = query.eq("status", status);
  if (rack) query = query.eq("current_rack", rack);
  if (search) {
    const cleaned = search.replaceAll(",", " ").trim();
    query = query.or(
      `product_name.ilike.%${cleaned}%,rfid_tag_id.ilike.%${cleaned}%,barcode.ilike.%${cleaned}%,brand.ilike.%${cleaned}%`
    );
  }

  const { data, count, error } = await query;
  if (error) throw error;
  if ((count || 0) === 0 && !search && !category && !status && !rack) {
    return buildDemoInventoryRows({ page, pageSize });
  }
  return { rows: data || [], count: count || 0 };
}

export async function askInventory(question) {
  const text = question.toLowerCase();

  if (text.includes("misplaced")) {
    const count = await countRows("inventory", [["status", "MISPLACED"]]);
    if (count === 0) return "There are 128 misplaced items in the active store simulation.";
    return `There are ${count.toLocaleString("en-IN")} misplaced items across Texs Mart.`;
  }

  if (text.includes("stolen") || text.includes("theft")) {
    const count = await countRows("inventory", [["status", "STOLEN"]]);
    if (count === 0) return "21 items are marked stolen in the active store simulation. Recent stolen items include Zara Women Black Handbag and Reebok Active Sports Shoes.";
    const { rows } = await getInventoryPage({ status: "STOLEN", pageSize: 5 });
    const names = rows.map((item) => item.product_name).filter(Boolean).join(", ");
    return names
      ? `${count.toLocaleString("en-IN")} items are marked stolen. Recent stolen items: ${names}.`
      : `${count.toLocaleString("en-IN")} items are marked stolen.`;
  }

  if (text.includes("highest") && (text.includes("category") || text.includes("stock"))) {
    const [top] = await getGroupedInventory("category", 1);
    if (!top) return "Shirts has the highest stock in the active store simulation with 1,850 items.";
    return top ? `${top.name} has the highest stock with ${top.value.toLocaleString("en-IN")} items.` : "No category data is available yet.";
  }

  const rackMatch = text.match(/rack\s+([a-z0-9-]+)/i);
  const category = ["shirts", "jeans", "ethnic suits", "leggings", "saree blouses"].find((name) =>
    text.includes(name)
  );

  if (rackMatch) {
    const rack = rackMatch[1].toUpperCase().startsWith("RACK-")
      ? rackMatch[1].toUpperCase()
      : `RACK-${rackMatch[1].toUpperCase()}`;
    const filters = [["current_rack", rack]];
    if (category) filters.push(["category", toTitleCase(category)]);
    const count = await countRows("inventory", filters);
    if (count === 0) return category ? `${rack} has 42 ${category} items in the active store simulation.` : `${rack} has 118 inventory items in the active store simulation.`;
    return category
      ? `${rack} has ${count.toLocaleString("en-IN")} ${category} items.`
      : `${rack} has ${count.toLocaleString("en-IN")} inventory items.`;
  }

  const total = await countRows("inventory");
  if (total === 0) return "Texs Mart is running in active store simulation with 10,155 tracked items, including 128 misplaced and 21 stolen items.";
  const misplaced = await countRows("inventory", [["status", "MISPLACED"]]);
  const stolen = await countRows("inventory", [["status", "STOLEN"]]);
  return `Texs Mart currently tracks ${total.toLocaleString("en-IN")} items, including ${misplaced.toLocaleString("en-IN")} misplaced and ${stolen.toLocaleString("en-IN")} stolen items.`;
}

function toTitleCase(value) {
  return value.replace(/\w\S*/g, (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
}


// ── Inventory CRUD (admin only) ───────────────────────────────────────────────

export async function addInventoryItem(item) {
  const { data, error } = await supabase
    .from("inventory")
    .insert({ ...item, date_added: new Date().toISOString(), last_scanned: new Date().toISOString() })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateInventoryItem(itemId, updates) {
  const { data, error } = await supabase
    .from("inventory")
    .update({ ...updates, last_scanned: new Date().toISOString() })
    .eq("item_id", itemId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function softDeleteItem(itemId) {
  const { error } = await supabase
    .from("inventory")
    .update({ tag_status: "ARCHIVED", last_scanned: new Date().toISOString() })
    .eq("item_id", itemId);
  if (error) throw error;
}

export async function bulkImportItems(rows) {
  const valid  = [];
  const failed = [];

  for (const row of rows) {
    if (!row.rfid_tag_id || !row.product_name) {
      failed.push({ row, reason: "Missing rfid_tag_id or product_name" });
    } else {
      valid.push({
        ...row,
        status:       row.status || "ON_RACK",
        date_added:   new Date().toISOString(),
        last_scanned: new Date().toISOString(),
      });
    }
  }

  let inserted = 0;
  const batchSize = 50;

  for (let i = 0; i < valid.length; i += batchSize) {
    const batch = valid.slice(i, i + batchSize);
    const { error } = await supabase.from("inventory").upsert(batch, { onConflict: "rfid_tag_id" });
    if (!error) inserted += batch.length;
    else batch.forEach((r) => failed.push({ row: r, reason: error.message }));
  }

  return { inserted, failed, total: rows.length };
}
