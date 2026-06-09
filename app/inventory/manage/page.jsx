"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Download, FileUp, Plus, X } from "lucide-react";
import Link         from "next/link";
import PageHeader   from "@/components/PageHeader";
import LoadingPanel from "@/components/LoadingPanel";
import ErrorPanel   from "@/components/ErrorPanel";
import StatusBadge  from "@/components/StatusBadge";
import { useAuth }  from "@/lib/authContext";
import { addInventoryItem, bulkImportItems, getInventoryPage } from "@/lib/data";
import { currency } from "@/lib/supabase";

const STATUSES   = ["ON_RACK", "MISPLACED", "BILLING", "SOLD", "STOLEN"];
const CATEGORIES = ["Shirts", "Jeans", "Ethnic Suits", "Leggings", "Saree Blouses", "Kurtis", "Footwear", "Accessories"];
const GENDERS    = ["Men", "Women", "Unisex", "Kids"];
const SIZES      = ["XS", "S", "M", "L", "XL", "XXL", "28", "30", "32", "34", "36", "Free Size"];

const EMPTY_FORM = {
  rfid_tag_id: "", barcode: "", product_name: "", category: "", brand: "",
  color: "", material: "", size: "", gender: "", home_rack: "", current_rack: "",
  section: "", status: "ON_RACK", selling_price: "", mrp: "",
};

const TABS = ["Add Item", "Bulk Import", "Export"];

export default function ManageInventoryPage() {
  const { isAdmin, loading: authLoading } = useAuth();
  const [tab,         setTab]         = useState(0);
  const [form,        setForm]        = useState(EMPTY_FORM);
  const [saving,      setSaving]      = useState(false);
  const [saveMsg,     setSaveMsg]     = useState(null);   // { type: "success"|"error", text }
  const [recentAdded, setRecentAdded] = useState([]);

  // Bulk import state
  const [importRows,    setImportRows]    = useState([]);
  const [importPreview, setImportPreview] = useState(false);
  const [importResult,  setImportResult]  = useState(null);
  const [importing,     setImporting]     = useState(false);
  const fileRef = useRef(null);

  // Export state
  const [exportData,    setExportData]    = useState([]);
  const [exportLoading, setExportLoading] = useState(false);

  useEffect(() => {
    if (tab === 2) loadExportData();
  }, [tab]); // eslint-disable-line

  if (authLoading) return <LoadingPanel />;
  if (!isAdmin)    return <ErrorPanel error={{ message: "Access denied. This page is available to Admins only." }} />;

  // ── Add item ───────────────────────────────────────────────────────────────
  function setField(key, value) {
    setForm((p) => ({ ...p, [key]: value }));
  }

  async function handleAdd(e) {
    e.preventDefault();
    if (!form.rfid_tag_id || !form.product_name) {
      setSaveMsg({ type: "error", text: "RFID Tag ID and Product Name are required." });
      return;
    }
    setSaving(true);
    setSaveMsg(null);
    try {
      const item = await addInventoryItem({
        ...form,
        selling_price: form.selling_price ? Number(form.selling_price) : null,
        mrp:           form.mrp           ? Number(form.mrp)           : null,
      });
      setSaveMsg({ type: "success", text: `Item "${item.product_name}" added successfully.` });
      setRecentAdded((p) => [item, ...p].slice(0, 5));
      setForm(EMPTY_FORM);
    } catch (err) {
      setSaveMsg({ type: "error", text: err.message || "Failed to add item." });
    } finally {
      setSaving(false);
    }
  }

  // ── CSV import ─────────────────────────────────────────────────────────────
  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text  = ev.target.result;
      const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
      if (lines.length < 2) { alert("CSV must have a header row and at least one data row."); return; }
      const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, "").toLowerCase().replace(/ /g, "_"));
      const rows    = lines.slice(1).map((line) => {
        const values = line.split(",").map((v) => v.trim().replace(/"/g, ""));
        return Object.fromEntries(headers.map((h, i) => [h, values[i] || ""]));
      });
      setImportRows(rows);
      setImportPreview(true);
      setImportResult(null);
    };
    reader.readAsText(file);
  }

  async function handleImport() {
    setImporting(true);
    try {
      const result = await bulkImportItems(importRows);
      setImportResult(result);
      setImportRows([]);
      setImportPreview(false);
      if (fileRef.current) fileRef.current.value = "";
    } catch (err) {
      setImportResult({ error: err.message });
    } finally {
      setImporting(false);
    }
  }

  // ── Export ─────────────────────────────────────────────────────────────────
  async function loadExportData() {
    setExportLoading(true);
    try {
      const { rows } = await getInventoryPage({ page: 1, pageSize: 5000 });
      setExportData(rows);
    } catch { setExportData([]); }
    finally { setExportLoading(false); }
  }

  function exportCSV() {
    if (!exportData.length) return;
    const headers = ["item_id","rfid_tag_id","barcode","product_name","category","brand","color","size","gender","current_rack","status","selling_price","mrp"];
    const csv = [
      headers.join(","),
      ...exportData.map((row) => headers.map((h) => `"${row[h] ?? ""}"`).join(",")),
    ].join("\n");
    downloadFile("inventory_export.csv", "text/csv", csv);
  }

  function exportJSON() {
    if (!exportData.length) return;
    downloadFile("inventory_export.json", "application/json", JSON.stringify(exportData, null, 2));
  }

  function downloadFile(filename, type, content) {
    const blob = new Blob([content], { type });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  }

  // ── CSV template download ──────────────────────────────────────────────────
  function downloadTemplate() {
    const headers = "rfid_tag_id,barcode,product_name,category,brand,color,material,size,gender,home_rack,current_rack,section,status,selling_price,mrp";
    const sample  = "RFID-00100001,8901234567890,Arrow Men Blue Formal Shirt,Shirts,Arrow,Blue,Cotton,L,Men,RACK-A01,RACK-A01,Menswear Formal,ON_RACK,1299,1699";
    downloadFile("inventory_import_template.csv", "text/csv", `${headers}\n${sample}`);
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      <PageHeader
        eyebrow="Admin · Inventory Management"
        title="Manage Inventory"
        description="Add individual items, bulk import via CSV, or export the full inventory dataset."
      >
        <Link
          href="/inventory"
          className="inline-flex h-10 items-center gap-2 rounded-lg border border-stone-200 bg-stone-50 px-4 text-sm font-bold text-stone-500 hover:bg-stone-50"
        >
          <ArrowLeft size={15} />
          Back to Registry
        </Link>
      </PageHeader>

      {/* Tabs */}
      <div className="mb-6 flex gap-2">
        {TABS.map((t, i) => (
          <button
            key={t}
            onClick={() => setTab(i)}
            className={`min-h-10 rounded-lg border px-5 text-sm font-bold transition ${
              tab === i
                ? "border-brand-200"
                : "border-stone-200 bg-stone-50 text-stone-400 hover:bg-stone-50"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* ── TAB 0: Add Item ────────────────────────────────────────────────── */}
      {tab === 0 && (
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <section className="panel rounded-lg p-6">
            <h2 className="mb-5 text-sm font-black uppercase tracking-[0.18em] text-stone-900">Add New Inventory Item</h2>

            <form onSubmit={handleAdd} className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField label="RFID Tag ID *">
                  <input required value={form.rfid_tag_id} onChange={(e) => setField("rfid_tag_id", e.target.value)} placeholder="RFID-00100001" className={iCls} />
                </FormField>
                <FormField label="Barcode">
                  <input value={form.barcode} onChange={(e) => setField("barcode", e.target.value)} placeholder="8901234567890" className={iCls} />
                </FormField>
              </div>

              <FormField label="Product Name *">
                <input required value={form.product_name} onChange={(e) => setField("product_name", e.target.value)} placeholder="Arrow Men Blue Formal Shirt" className={iCls} />
              </FormField>

              <div className="grid gap-4 md:grid-cols-3">
                <FormField label="Category">
                  <select value={form.category} onChange={(e) => setField("category", e.target.value)} className={iCls}>
                    <option value="">Select</option>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </FormField>
                <FormField label="Brand">
                  <input value={form.brand} onChange={(e) => setField("brand", e.target.value)} placeholder="Arrow" className={iCls} />
                </FormField>
                <FormField label="Status">
                  <select value={form.status} onChange={(e) => setField("status", e.target.value)} className={iCls}>
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </FormField>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <FormField label="Color">
                  <input value={form.color} onChange={(e) => setField("color", e.target.value)} placeholder="Blue" className={iCls} />
                </FormField>
                <FormField label="Size">
                  <select value={form.size} onChange={(e) => setField("size", e.target.value)} className={iCls}>
                    <option value="">Select</option>
                    {SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </FormField>
                <FormField label="Gender">
                  <select value={form.gender} onChange={(e) => setField("gender", e.target.value)} className={iCls}>
                    <option value="">Select</option>
                    {GENDERS.map((g) => <option key={g} value={g}>{g}</option>)}
                  </select>
                </FormField>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField label="Material">
                  <input value={form.material} onChange={(e) => setField("material", e.target.value)} placeholder="Cotton" className={iCls} />
                </FormField>
                <FormField label="Section">
                  <input value={form.section} onChange={(e) => setField("section", e.target.value)} placeholder="Menswear Formal" className={iCls} />
                </FormField>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField label="Home Rack">
                  <input value={form.home_rack} onChange={(e) => setField("home_rack", e.target.value)} placeholder="RACK-A01" className={iCls} />
                </FormField>
                <FormField label="Current Rack">
                  <input value={form.current_rack} onChange={(e) => setField("current_rack", e.target.value)} placeholder="RACK-A01" className={iCls} />
                </FormField>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField label="Selling Price (₹)">
                  <input type="number" min="0" value={form.selling_price} onChange={(e) => setField("selling_price", e.target.value)} placeholder="1299" className={iCls} />
                </FormField>
                <FormField label="MRP (₹)">
                  <input type="number" min="0" value={form.mrp} onChange={(e) => setField("mrp", e.target.value)} placeholder="1699" className={iCls} />
                </FormField>
              </div>

              {saveMsg && (
                <div className={`flex items-start gap-2 rounded-lg border px-3 py-2.5 text-sm ${
                  saveMsg.type === "success"
                    ? "border-green-200 bg-green-50"
                    : "border-red-200 bg-red-50"
                }`}>
                  {saveMsg.text}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving} className="inline-flex h-11 items-center gap-2 rounded-lg border border-brand-200">
                  <Plus size={15} />
                  {saving ? "Adding..." : "Add Item"}
                </button>
                <button type="button" onClick={() => { setForm(EMPTY_FORM); setSaveMsg(null); }} className="inline-flex h-11 items-center gap-2 rounded-lg border border-stone-200 bg-stone-50 px-4 text-sm font-bold text-stone-500 hover:bg-stone-50">
                  <X size={15} />
                  Clear
                </button>
              </div>
            </form>
          </section>

          {/* Recently added */}
          <section className="panel rounded-lg p-5">
            <h3 className="mb-4 text-xs font-black uppercase tracking-[0.18em] text-stone-400">Recently Added</h3>
            {recentAdded.length === 0 ? (
              <p className="text-sm text-slate-600">No items added yet in this session.</p>
            ) : (
              <div className="space-y-3">
                {recentAdded.map((item, i) => (
                  <div key={i} className="rounded-lg border border-stone-200 bg-stone-50 p-3">
                    <p className="text-sm font-bold text-stone-900">{item.product_name}</p>
                    <p className="mt-1 font-mono text-xs text-stone-400">{item.rfid_tag_id}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <StatusBadge status={item.status} />
                      <span className="text-xs text-stone-400">{item.current_rack || "—"}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {/* ── TAB 1: Bulk Import ─────────────────────────────────────────────── */}
      {tab === 1 && (
        <section className="panel rounded-lg p-6">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-sm font-black uppercase tracking-[0.18em] text-stone-900">Bulk CSV Import</h2>
            <button onClick={downloadTemplate} className="inline-flex h-9 items-center gap-2 rounded-lg border border-stone-200 bg-stone-50 px-3 text-xs font-bold text-stone-500 hover:bg-stone-50">
              <Download size={13} />
              Download Template
            </button>
          </div>

          {/* Upload zone */}
          {!importPreview && !importResult && (
            <label className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-stone-200 bg-stone-50 py-14 hover:border-brand-200">
              <FileUp size={32} className="text-stone-400" />
              <div className="text-center">
                <p className="text-sm font-semibold text-stone-500">Click to upload CSV file</p>
                <p className="mt-1 text-xs text-stone-400">Columns: rfid_tag_id, product_name, category, brand, status, selling_price, mrp, etc.</p>
              </div>
              <input ref={fileRef} type="file" accept=".csv" className="sr-only" onChange={handleFileChange} />
            </label>
          )}

          {/* Preview table */}
          {importPreview && importRows.length > 0 && (
            <div>
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm text-stone-500">
                  <span className="font-bold text-stone-900">{importRows.length}</span> rows found. Review before importing.
                </p>
                <button onClick={() => { setImportPreview(false); setImportRows([]); if (fileRef.current) fileRef.current.value = ""; }} className="text-xs text-stone-400 hover:text-stone-900">
                  Clear
                </button>
              </div>

              <div className="mb-4 max-h-60 overflow-auto rounded-lg border border-stone-200">
                <table className="w-full min-w-[600px] text-xs">
                  <thead className="bg-stone-50 text-stone-400">
                    <tr>
                      {Object.keys(importRows[0]).slice(0, 8).map((h) => (
                        <th key={h} className="px-3 py-2 text-left font-semibold uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {importRows.slice(0, 10).map((row, i) => (
                      <tr key={i} className="border-t border-white/8">
                        {Object.values(row).slice(0, 8).map((v, j) => (
                          <td key={j} className="px-3 py-2 text-stone-500">{v || "—"}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {importRows.length > 10 && (
                  <p className="px-3 py-2 text-xs text-stone-400">…and {importRows.length - 10} more rows</p>
                )}
              </div>

              <button onClick={handleImport} disabled={importing} className="inline-flex h-11 items-center gap-2 rounded-lg border border-brand-200">
                <FileUp size={15} />
                {importing ? "Importing..." : `Import ${importRows.length} Items`}
              </button>
            </div>
          )}

          {/* Import result */}
          {importResult && (
            <div className="space-y-3">
              {importResult.error ? (
                <div className="rounded-lg border border-red-200 bg-red-50">{importResult.error}</div>
              ) : (
                <>
                  <div className="rounded-lg border border-green-200 bg-green-50">
                    Successfully imported {importResult.inserted} of {importResult.total} items.
                  </div>
                  {importResult.failed.length > 0 && (
                    <div className="rounded-lg border border-yellow-200 bg-yellow-50">
                      <p className="mb-2 text-sm font-bold text-yellow-600">{importResult.failed.length} rows failed validation:</p>
                      <ul className="space-y-1 text-xs text-stone-500">
                        {importResult.failed.slice(0, 5).map((f, i) => (
                          <li key={i}>Row {i + 1}: {f.reason}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <button onClick={() => setImportResult(null)} className="inline-flex h-9 items-center gap-2 rounded-lg border border-stone-200 bg-stone-50 px-4 text-sm font-bold text-stone-500">
                    Import More
                  </button>
                </>
              )}
            </div>
          )}
        </section>
      )}

      {/* ── TAB 2: Export ─────────────────────────────────────────────────── */}
      {tab === 2 && (
        <section className="panel rounded-lg p-6">
          <h2 className="mb-2 text-sm font-black uppercase tracking-[0.18em] text-stone-900">Export Inventory</h2>
          <p className="mb-6 text-sm text-stone-400">
            Download the full inventory dataset. Exports include all active items with status, rack, pricing, and RFID data.
          </p>

          {exportLoading ? (
            <LoadingPanel label="Loading inventory for export..." />
          ) : (
            <>
              <div className="mb-6 rounded-lg border border-stone-200 bg-stone-50 px-5 py-4">
                <p className="text-2xl font-bold text-stone-900">{exportData.length.toLocaleString("en-IN")}</p>
                <p className="text-sm text-stone-400">items ready for export</p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button onClick={exportCSV} disabled={!exportData.length} className="inline-flex h-11 items-center gap-2 rounded-lg border border-brand-200">
                  <Download size={15} />
                  Export as CSV
                </button>
                <button onClick={exportJSON} disabled={!exportData.length} className="inline-flex h-11 items-center gap-2 rounded-lg border border-green-200 bg-green-50">
                  <Download size={15} />
                  Export as JSON
                </button>
                <button onClick={loadExportData} className="inline-flex h-11 items-center gap-2 rounded-lg border border-stone-200 bg-stone-50 px-4 text-sm font-bold text-stone-500 hover:bg-stone-50">
                  Refresh Count
                </button>
              </div>

              {/* Preview sample */}
              {exportData.length > 0 && (
                <div className="mt-6">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-stone-400">Preview (first 5 rows)</p>
                  <div className="overflow-auto rounded-lg border border-stone-200">
                    <table className="w-full min-w-[700px] text-xs">
                      <thead className="bg-stone-50 text-stone-400">
                        <tr>
                          {["rfid_tag_id","product_name","category","brand","current_rack","status","selling_price"].map((h) => (
                            <th key={h} className="px-3 py-2 text-left font-semibold uppercase tracking-wider">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {exportData.slice(0, 5).map((row, i) => (
                          <tr key={i} className="border-t border-white/8">
                            <td className="px-3 py-2 font-mono text-stone-400">{row.rfid_tag_id}</td>
                            <td className="px-3 py-2 text-stone-500">{row.product_name}</td>
                            <td className="px-3 py-2 text-stone-400">{row.category}</td>
                            <td className="px-3 py-2 text-stone-400">{row.brand}</td>
                            <td className="px-3 py-2 text-stone-400">{row.current_rack}</td>
                            <td className="px-3 py-2"><StatusBadge status={row.status} /></td>
                            <td className="px-3 py-2 text-right text-stone-500">{currency(row.selling_price)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      )}
    </>
  );
}

function FormField({ label, children }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-stone-400">{label}</label>
      {children}
    </div>
  );
}

const iCls = "h-10 w-full rounded-lg border border-stone-200 bg-white/70 px-3 text-sm text-stone-900 outline-none focus:border-brand-200";
