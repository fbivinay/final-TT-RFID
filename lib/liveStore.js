"use client";

import { INVENTORY_STATUSES } from "./supabase";

const categories = ["Shirts", "Jeans", "Ethnic Suits", "Leggings", "Saree Blouses", "Kurtis", "Footwear", "Accessories"];
const sections = ["Menswear Formal", "Menswear Casual", "Ethnic Wear", "Kurtis & Fusion", "Festive Wear", "Winter Wear", "Sportswear"];
const brands = ["Arrow", "Levi's", "W", "Aurelia", "Biba", "Van Heusen", "Allen Solly", "Fabindia", "Zara", "H&M"];
const racks = ["RACK-A01", "RACK-A02", "RACK-A03", "RACK-B01", "RACK-B03", "RACK-C01", "RACK-C02", "RACK-C07", "RACK-D08"];
const products = [
  "Arrow Men Blue Formal Shirt",
  "Levi's Women High Rise Jeans",
  "Biba Embroidered Ethnic Suit",
  "Aurelia Printed Kurti",
  "Van Heusen Slim Fit Shirt",
  "Fabindia Saree Blouse",
  "Allen Solly Casual Chinos",
  "W Festive Anarkali Set",
  "H&M Cotton Leggings",
  "Zara Women Black Handbag",
  "Reebok Active Sports Shoes",
  "United Colors Benetton Wallet"
];

export function buildDemoDashboardData() {
  const statusCounts = {
    ON_RACK: 8432,
    MISPLACED: 128,
    BILLING: 76,
    SOLD: 1498,
    STOLEN: 21
  };

  return {
    totalInventory: Object.values(statusCounts).reduce((sum, value) => sum + value, 0),
    statusCounts,
    categories: toChart(categories, [1850, 1640, 1320, 1190, 930, 880, 760, 690]),
    sections: toChart(sections, [2140, 1880, 1540, 1320, 1180, 820, 610]),
    brands: toChart(brands, [980, 910, 870, 820, 790, 740, 690, 640, 610, 560]),
    recentEvents: seedEvents(),
    alerts: seedAlerts()
  };
}

export function buildDemoInventoryRows({ page = 1, pageSize = 25, search = "", category = "", status = "", rack = "" } = {}) {
  const rows = Array.from({ length: 120 }, (_, index) => buildItem(index));
  const filtered = rows.filter((row) => {
    const haystack = `${row.rfid_tag_id} ${row.product_name} ${row.brand} ${row.category}`.toLowerCase();
    return (
      (!search || haystack.includes(search.toLowerCase())) &&
      (!category || row.category === category) &&
      (!status || row.status === status) &&
      (!rack || row.current_rack === rack)
    );
  });
  const from = (page - 1) * pageSize;
  return { rows: filtered.slice(from, from + pageSize), count: filtered.length };
}

export function getDemoFilterOptions() {
  return {
    categories,
    statuses: INVENTORY_STATUSES,
    racks
  };
}

export function seedAlerts() {
  return [
    {
      id: "demo-alert-1",
      alert_type: "MISPLACEMENT",
      product_name: "Biba Embroidered Ethnic Suit",
      rfid_tag_id: "RFID-00048921",
      from_rack: "RACK-B03",
      to_rack: "RACK-A01",
      message: "Moved to RACK-A01 from RACK-B03",
      created_at: new Date(Date.now() - 140000).toISOString()
    },
    {
      id: "demo-alert-2",
      alert_type: "THEFT_ALERT",
      product_name: "Zara Women Black Handbag",
      rfid_tag_id: "RFID-00050975",
      from_rack: "RACK-D08",
      to_rack: "EXIT-GATE",
      message: "Detected at exit gate without billing",
      created_at: new Date(Date.now() - 260000).toISOString()
    }
  ];
}

export function createLiveTick(sequence = 0) {
  const eventTypes = ["SCAN", "SCAN", "SCAN", "MISPLACED", "BILLING", "SCAN", "STOLEN", "RETURNED"];
  const eventType = eventTypes[sequence % eventTypes.length];
  const product = products[(sequence * 3) % products.length];
  const fromRack = racks[(sequence + 2) % racks.length];
  const toRack = eventType === "STOLEN" ? "EXIT-GATE" : eventType === "BILLING" ? "BILLING-01" : racks[(sequence + 5) % racks.length];

  return {
    id: `live-${Date.now()}-${sequence}`,
    event_type: eventType,
    product_name: product,
    rfid_tag_id: `RFID-${String(57000 + sequence * 137).padStart(8, "0")}`,
    from_rack: fromRack,
    to_rack: toRack,
    description: describeEvent(eventType, product, fromRack, toRack),
    created_at: new Date().toISOString()
  };
}

export function applyLiveTick(data, tick) {
  const next = structuredClone(data);
  next.recentEvents = [tick, ...(next.recentEvents || [])].slice(0, 12);

  if (tick.event_type === "MISPLACED") {
    next.statusCounts.MISPLACED += 1;
    next.statusCounts.ON_RACK = Math.max(0, next.statusCounts.ON_RACK - 1);
    next.alerts = [eventToAlert(tick, "MISPLACEMENT"), ...(next.alerts || [])].slice(0, 10);
  }

  if (tick.event_type === "STOLEN") {
    next.statusCounts.STOLEN += 1;
    next.statusCounts.ON_RACK = Math.max(0, next.statusCounts.ON_RACK - 1);
    next.alerts = [eventToAlert(tick, "THEFT_ALERT"), ...(next.alerts || [])].slice(0, 10);
  }

  if (tick.event_type === "BILLING") {
    next.statusCounts.BILLING += 1;
    next.statusCounts.ON_RACK = Math.max(0, next.statusCounts.ON_RACK - 1);
  }

  if (tick.event_type === "RETURNED") {
    next.statusCounts.ON_RACK += 1;
    next.statusCounts.MISPLACED = Math.max(0, next.statusCounts.MISPLACED - 1);
  }

  return next;
}

function toChart(names, values) {
  return names.map((name, index) => ({ name, value: values[index] }));
}

function buildItem(index) {
  const product = products[index % products.length];
  const status = index % 19 === 0 ? "STOLEN" : index % 11 === 0 ? "MISPLACED" : index % 7 === 0 ? "BILLING" : index % 5 === 0 ? "SOLD" : "ON_RACK";
  return {
    item_id: `demo-${index}`,
    rfid_tag_id: `RFID-${String(index + 100420).padStart(8, "0")}`,
    barcode: `890${String(index + 200000).padStart(9, "0")}`,
    category: categories[index % categories.length],
    brand: brands[index % brands.length],
    product_name: product,
    color: ["Blue", "Black", "Cream", "Maroon", "White"][index % 5],
    size: ["S", "M", "L", "XL", "32"][index % 5],
    gender: index % 3 === 0 ? "Women" : "Men",
    current_rack: racks[index % racks.length],
    status,
    selling_price: 699 + (index % 12) * 250,
    mrp: 999 + (index % 12) * 300
  };
}

function seedEvents() {
  return Array.from({ length: 8 }, (_, index) => ({
    ...createLiveTick(index),
    id: `seed-event-${index}`,
    created_at: new Date(Date.now() - index * 65000).toISOString()
  }));
}

function describeEvent(eventType, product, fromRack, toRack) {
  const labels = {
    SCAN: `${product} scanned at ${fromRack}`,
    MISPLACED: `${product} moved from ${fromRack} to ${toRack}`,
    BILLING: `${product} moved to billing counter`,
    STOLEN: `${product} detected at exit gate without billing`,
    RETURNED: `${product} returned to home rack`
  };
  return labels[eventType] || `${product} RFID movement recorded`;
}

function eventToAlert(event, alertType) {
  return {
    ...event,
    alert_type: alertType,
    message: event.description
  };
}
