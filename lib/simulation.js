"use client";

import { supabase } from "./supabase";

const SIMULATION_COPY = {
  MISPLACED: {
    alert_type: "MISPLACEMENT",
    severity: "medium",
    message: "Item moved away from assigned home rack"
  },
  STOLEN: {
    alert_type: "THEFT_ALERT",
    severity: "critical",
    message: "Item detected at exit gate without billing"
  },
  BILLING: {
    alert_type: "BILLING",
    severity: "low",
    message: "Item moved to billing counter"
  },
  ON_RACK: {
    alert_type: "RETURNED",
    severity: "low",
    message: "Item returned to its home rack"
  }
};

export async function runSimulation(targetStatus) {
  const sourceStatus = targetStatus === "ON_RACK" ? "MISPLACED" : "ON_RACK";
  const { data: item, error: itemError } = await supabase
    .from("inventory")
    .select("*")
    .eq("status", sourceStatus)
    .limit(1)
    .maybeSingle();

  if (itemError) throw itemError;
  if (!item) throw new Error(`No ${sourceStatus} item is available for this simulation.`);

  const nextRack = targetStatus === "ON_RACK" ? item.home_rack : pickSimulationRack(item.current_rack, item.home_rack);
  const previousRack = item.current_rack;

  const { error: updateError } = await supabase
    .from("inventory")
    .update({
      status: targetStatus,
      current_rack: nextRack,
      last_scanned: new Date().toISOString()
    })
    .eq("item_id", item.item_id);

  if (updateError) throw updateError;

  await Promise.allSettled([
    insertBestEffort("alerts", buildAlert(item, targetStatus, previousRack, nextRack)),
    insertBestEffort("events", buildEvent(item, targetStatus, previousRack, nextRack)),
    insertBestEffort("movements", buildMovement(item, targetStatus, previousRack, nextRack))
  ]);

  return {
    item,
    previousRack,
    nextRack,
    status: targetStatus
  };
}

function pickSimulationRack(currentRack, homeRack) {
  const rackPool = ["RACK-A01", "RACK-A03", "RACK-B01", "RACK-C02", "RACK-C07", "EXIT-GATE", "BILLING-01"];
  return rackPool.find((rack) => rack !== currentRack && rack !== homeRack) || "RACK-A01";
}

function buildAlert(item, status, previousRack, nextRack) {
  const meta = SIMULATION_COPY[status];
  return {
    alert_type: meta.alert_type,
    type: meta.alert_type,
    severity: meta.severity,
    status: "OPEN",
    resolved: false,
    item_id: item.item_id,
    rfid_tag_id: item.rfid_tag_id,
    product_name: item.product_name,
    message: `${meta.message}: ${item.rfid_tag_id}`,
    from_rack: previousRack,
    to_rack: nextRack,
    created_at: new Date().toISOString()
  };
}

function buildEvent(item, status, previousRack, nextRack) {
  return {
    event_type: status,
    type: status,
    item_id: item.item_id,
    rfid_tag_id: item.rfid_tag_id,
    product_name: item.product_name,
    rack: nextRack,
    from_rack: previousRack,
    to_rack: nextRack,
    description: `${item.product_name} changed to ${status}`,
    created_at: new Date().toISOString()
  };
}

function buildMovement(item, status, previousRack, nextRack) {
  return {
    item_id: item.item_id,
    rfid_tag_id: item.rfid_tag_id,
    from_rack: previousRack,
    to_rack: nextRack,
    movement_type: status,
    status,
    created_at: new Date().toISOString()
  };
}

async function insertBestEffort(table, payload) {
  const attempts = [
    payload,
    strip(payload, ["type", "severity", "resolved", "product_name", "description", "rack"]),
    strip(payload, ["alert_type", "type", "severity", "status", "resolved", "product_name", "message", "description", "rack"])
  ];

  for (const attempt of attempts) {
    const { error } = await supabase.from(table).insert(attempt);
    if (!error) return;
  }
}

function strip(payload, keys) {
  return Object.fromEntries(Object.entries(payload).filter(([key]) => !keys.includes(key)));
}
