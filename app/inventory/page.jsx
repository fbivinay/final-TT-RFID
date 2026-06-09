"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Pencil, Plus, Search, Trash2 } from "lucide-react";
import Link          from "next/link";
import ErrorPanel    from "@/components/ErrorPanel";
import LoadingPanel  from "@/components/LoadingPanel";
import PageHeader    from "@/components/PageHeader";
import StatusBadge   from "@/components/StatusBadge";
import { getFilterOptions, getInventoryPage, softDeleteItem, updateInventoryItem } from "@/lib/data";
import { currency }  from "@/lib/supabase";
import { useAuth }   from "@/lib/authContext";

const PAGE_SIZE = 25;

const STATUSES = ["ON_RACK", "MISPLACED", "BILLING", "SOLD", "STOLEN"];

export default function InventoryPage() {
  const { isAdmin } = useAuth();
  const [filters, setFilters] = useState({ search: "", category: "", status: "", rack: "", page: 1 });
  const [options, setOptions] = useState({ categories: [], statuses: [], racks: [] });
  const [data,    setData]    = useState(null);
  const [error,   setError]   = useState(null);
  const [loading, setLoading] = useState(true);

  // Edit modal state
  const [editItem,    setEditItem]    = useState(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editError,   setEditError]   = useState("");

  // Delete confirm state
  const [deleteId,      setDeleteId]      = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => { getFilterOptions().then(setOptions); }, []);

  function loadPage() {
    setLoading(true);
    getInventoryPage({ ...filters, pageSize: PAGE_SIZE })
      .then((result) => { setData(result); setError(null); })
      .catch(setError)
      .finally(() => setLoading(false));
  }

  useEffect(loadPage, [filters]); // eslint-disable-line

  const totalPages = Math.max(1, Math.ceil((data?.count || 0) / PAGE_SIZE));

  // ── Edit handlers ──────────────────────────────────────────────────────────
  async function handleEditSave() {
    if (!editItem) return;
    setEditLoading(true);
    setEditError("");
    try {
      await updateInventoryItem(editItem.item_id, {
        product_name:  editItem.product_name,
        status:        editItem.status,
        current_rack:  editItem.current_rack,
        selling_price: editItem.selling_price,
        brand:         editItem.brand,
        category:      editItem.category,
        color:         editItem.color,
        size:          editItem.size,
      });
      setEditItem(null);
      loadPage();
    } catch (err) {
      setEditError(err.message || "Save failed.");
    } finally {
      setEditLoading(false);
    }
  }

  // ── Delete handler ─────────────────────────────────────────────────────────
  async function handleDelete() {
    if (!deleteId) return;
    setDeleteLoading(true);
    try {
      await softDeleteItem(deleteId);
      setDeleteId(null);
      loadPage();
    } catch { /* silent */ }
    finally { setDeleteLoading(false); }
  }

  return (
    <>
      <PageHeader
        eyebrow="Inventory Control"
        title="RFID Item Registry"
        description="Search, filter, and audit item placement across categories, statuses, and racks."
      >
        {isAdmin && (
          <Link
            href="/inventory/manage"
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-signal-cyan/40 bg-signal-cyan/16 px-4 text-sm font-bold text-signal-cyan hover:bg-signal-cyan/24"
          >
            <Plus size={15} />
            Manage Inventory
          </Link>
        )}
      </PageHeader>

      {/* Filters */}
      <section className="panel rounded-lg p-4">
        <div className="grid gap-3 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <label className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input
              value={filters.search}
              onChange={(e) => setFilters((p) => ({ ...p, search: e.target.value, page: 1 }))}
              placeholder="Search RFID, product, barcode, brand..."
              className="h-12 w-full rounded-lg border border-white/10 bg-ink-950/70 pl-10 pr-3 text-sm text-white outline-none focus:border-signal-cyan/50"
            />
          </label>
          <Select label="All categories" value={filters.category} options={options.categories} onChange={(v) => setFilters((p) => ({ ...p, category: v, page: 1 }))} />
          <Select label="All statuses"   value={filters.status}   options={options.statuses}   onChange={(v) => setFilters((p) => ({ ...p, status:   v, page: 1 }))} />
          <Select label="All racks"      value={filters.rack}     options={options.racks}      onChange={(v) => setFilters((p) => ({ ...p, rack:     v, page: 1 }))} />
        </div>
      </section>

      {/* Table */}
      <section className="panel mt-4 overflow-hidden rounded-lg">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 text-sm text-slate-400">
          <span>{(data?.count || 0).toLocaleString("en-IN")} items</span>
          <span>Page {filters.page} of {totalPages}</span>
        </div>

        {error  ? <div className="p-4"><ErrorPanel error={error} /></div>          : null}
        {loading ? <div className="p-4"><LoadingPanel label="Loading inventory rows..." /></div> : null}

        {!loading && !error ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse text-left text-sm">
              <thead className="bg-white/[0.04] text-xs uppercase tracking-[0.16em] text-slate-400">
                <tr>
                  <th className="px-4 py-4">RFID</th>
                  <th className="px-4 py-4">Product Name</th>
                  <th className="px-4 py-4">Category</th>
                  <th className="px-4 py-4">Brand</th>
                  <th className="px-4 py-4">Rack</th>
                  <th className="px-4 py-4">Status</th>
                  <th className="px-4 py-4 text-right">Price</th>
                  {isAdmin && <th className="px-4 py-4 text-center">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {(data?.rows || []).map((item) => (
                  <tr
                    key={item.item_id || item.rfid_tag_id}
                    className="border-b border-white/8 odd:bg-white/[0.025] hover:bg-signal-cyan/8"
                  >
                    <td className="px-4 py-4 font-mono text-xs text-slate-300">{item.rfid_tag_id}</td>
                    <td className="px-4 py-4">
                      <p className="font-bold text-white">{item.product_name}</p>
                      <p className="text-xs text-slate-500">{[item.color, item.size, item.gender].filter(Boolean).join(" · ")}</p>
                    </td>
                    <td className="px-4 py-4 text-slate-300">{item.category}</td>
                    <td className="px-4 py-4 text-slate-300">{item.brand}</td>
                    <td className="px-4 py-4 font-bold text-slate-200">{item.current_rack || "Unassigned"}</td>
                    <td className="px-4 py-4"><StatusBadge status={item.status} /></td>
                    <td className="px-4 py-4 text-right font-bold text-white">{currency(item.selling_price || item.mrp)}</td>
                    {isAdmin && (
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => setEditItem({ ...item })}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-slate-400 hover:border-signal-cyan/40 hover:text-signal-cyan"
                            title="Edit item"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            onClick={() => setDeleteId(item.item_id)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-slate-400 hover:border-signal-red/40 hover:text-signal-red"
                            title="Archive item"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        <div className="flex items-center justify-end gap-2 border-t border-white/10 p-4">
          <button
            onClick={() => setFilters((p) => ({ ...p, page: Math.max(1, p.page - 1) }))}
            disabled={filters.page <= 1}
            className="rounded-lg border border-white/10 bg-white/[0.04] p-2 text-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Previous page"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={() => setFilters((p) => ({ ...p, page: Math.min(totalPages, p.page + 1) }))}
            disabled={filters.page >= totalPages}
            className="rounded-lg border border-white/10 bg-white/[0.04] p-2 text-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Next page"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </section>

      {/* ── Edit modal ─────────────────────────────────────────────────────── */}
      {editItem && (
        <Modal title="Edit Inventory Item" onClose={() => setEditItem(null)}>
          <div className="space-y-4">
            <Field label="Product Name">
              <input value={editItem.product_name || ""} onChange={(e) => setEditItem((p) => ({ ...p, product_name: e.target.value }))} className={inputCls} />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Category">
                <input value={editItem.category || ""} onChange={(e) => setEditItem((p) => ({ ...p, category: e.target.value }))} className={inputCls} />
              </Field>
              <Field label="Brand">
                <input value={editItem.brand || ""} onChange={(e) => setEditItem((p) => ({ ...p, brand: e.target.value }))} className={inputCls} />
              </Field>
              <Field label="Current Rack">
                <input value={editItem.current_rack || ""} onChange={(e) => setEditItem((p) => ({ ...p, current_rack: e.target.value }))} className={inputCls} />
              </Field>
              <Field label="Status">
                <select value={editItem.status || ""} onChange={(e) => setEditItem((p) => ({ ...p, status: e.target.value }))} className={inputCls}>
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </Field>
              <Field label="Selling Price (₹)">
                <input type="number" value={editItem.selling_price || ""} onChange={(e) => setEditItem((p) => ({ ...p, selling_price: e.target.value }))} className={inputCls} />
              </Field>
              <Field label="Color">
                <input value={editItem.color || ""} onChange={(e) => setEditItem((p) => ({ ...p, color: e.target.value }))} className={inputCls} />
              </Field>
            </div>

            {editError && <p className="text-xs text-signal-red">{editError}</p>}

            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setEditItem(null)} className={secondaryBtn}>Cancel</button>
              <button onClick={handleEditSave} disabled={editLoading} className={primaryBtn}>
                {editLoading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Delete confirm modal ────────────────────────────────────────────── */}
      {deleteId && (
        <Modal title="Archive Item" onClose={() => setDeleteId(null)}>
          <p className="mb-6 text-sm text-slate-300">
            This item will be archived (soft delete). It will no longer appear in the active inventory but the record is preserved. Continue?
          </p>
          <div className="flex justify-end gap-3">
            <button onClick={() => setDeleteId(null)} className={secondaryBtn}>Cancel</button>
            <button onClick={handleDelete} disabled={deleteLoading} className="inline-flex h-10 items-center gap-2 rounded-lg border border-signal-red/40 bg-signal-red/14 px-4 text-sm font-bold text-signal-red disabled:opacity-50">
              {deleteLoading ? "Archiving..." : "Archive Item"}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}

// ── Reusable UI helpers ────────────────────────────────────────────────────────

function Select({ label, value, options, onChange }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-12 rounded-lg border border-white/10 bg-ink-950/70 px-3 text-sm font-semibold text-white outline-none focus:border-signal-cyan/50"
    >
      <option value="">{label}</option>
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-lg rounded-xl border border-white/10 bg-ink-900 p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="font-bold text-white">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-slate-400">{label}</label>
      {children}
    </div>
  );
}

const inputCls     = "h-10 w-full rounded-lg border border-white/10 bg-ink-950/70 px-3 text-sm text-white outline-none focus:border-signal-cyan/50";
const primaryBtn   = "inline-flex h-10 items-center gap-2 rounded-lg border border-signal-cyan/40 bg-signal-cyan/16 px-4 text-sm font-bold text-signal-cyan disabled:opacity-50";
const secondaryBtn = "inline-flex h-10 items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-4 text-sm font-bold text-slate-300 hover:bg-white/[0.08]";
