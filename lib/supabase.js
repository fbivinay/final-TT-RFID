"use client";

import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://kjogiqwtyrwqxiqcibat.supabase.co";

const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtqb2dpcXd0eXJ3cXhpcWNpYmF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzNjc1NDYsImV4cCI6MjA5NTk0MzU0Nn0.wf6HlxC5729_NU2jGftJqgjoVtkov_-Hf5hcLsw2L30";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const INVENTORY_STATUSES = ["ON_RACK", "MISPLACED", "BILLING", "SOLD", "STOLEN"];

export function formatStatus(status) {
  const labels = {
    ON_RACK: "On Rack",
    MISPLACED: "Misplaced",
    BILLING: "Billing",
    SOLD: "Sold",
    STOLEN: "Stolen"
  };
  return labels[status] || status || "Unknown";
}

export function currency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(Number(value || 0));
}
