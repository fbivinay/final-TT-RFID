"use client";

import { useEffect, useState } from "react";
import { Pencil, Plus, ShieldCheck, Trash2, UserCheck, UserMinus, Users, X } from "lucide-react";
import PageHeader   from "@/components/PageHeader";
import LoadingPanel from "@/components/LoadingPanel";
import ErrorPanel   from "@/components/ErrorPanel";
import { useAuth }  from "@/lib/authContext";
import { getAllProfiles, updateProfile, deleteProfile, createProfileRecord } from "@/lib/auth";

const ROLES       = ["ADMIN", "EMPLOYEE"];
const DEPARTMENTS = ["Management", "Menswear", "Ethnic Wear", "Kurtis & Fusion", "Footwear", "Accessories", "Billing", "Security", "Warehouse", "IT"];
const STATUSES    = ["ACTIVE", "INACTIVE", "SUSPENDED"];

const EMPTY_FORM = { full_name: "", email: "", role: "EMPLOYEE", department: "", status: "ACTIVE" };

export default function EmployeesPage() {
  const { isAdmin, loading: authLoading, user: currentUser } = useAuth();
  const [profiles, setProfiles] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  // Add modal
  const [showAdd,   setShowAdd]   = useState(false);
  const [addForm,   setAddForm]   = useState(EMPTY_FORM);
  const [addSaving, setAddSaving] = useState(false);
  const [addError,  setAddError]  = useState("");

  // Edit modal
  const [editProfile, setEditProfile] = useState(null);
  const [editSaving,  setEditSaving]  = useState(false);
  const [editError,   setEditError]   = useState("");

  // Delete confirm
  const [deleteTarget,  setDeleteTarget]  = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => { if (isAdmin) load(); }, [isAdmin]); // eslint-disable-line

  if (authLoading)  return <LoadingPanel />;
  if (!isAdmin)     return <ErrorPanel error={{ message: "Access denied. This page is available to Admins only." }} />;

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await getAllProfiles();
      setProfiles(data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }

  // ── Add employee ───────────────────────────────────────────────────────────
  async function handleAdd(e) {
    e.preventDefault();
    if (!addForm.full_name || !addForm.email) { setAddError("Full name and email are required."); return; }
    setAddSaving(true); setAddError("");
    try {
      // Create profile record directly (password set separately via Supabase dashboard)
      await createProfileRecord({
        id:          crypto.randomUUID(),
        email:       addForm.email,
        full_name:   addForm.full_name,
        role:        addForm.role,
        department:  addForm.department,
        status:      addForm.status,
      });
      setShowAdd(false);
      setAddForm(EMPTY_FORM);
      load();
    } catch (err) {
      setAddError(err.message || "Failed to create employee record.");
    } finally {
      setAddSaving(false);
    }
  }

  // ── Edit employee ──────────────────────────────────────────────────────────
  async function handleEditSave() {
    if (!editProfile) return;
    setEditSaving(true); setEditError("");
    try {
      await updateProfile(editProfile.id, {
        full_name:  editProfile.full_name,
        role:       editProfile.role,
        department: editProfile.department,
        status:     editProfile.status,
      });
      setEditProfile(null);
      load();
    } catch (err) {
      setEditError(err.message || "Save failed.");
    } finally {
      setEditSaving(false);
    }
  }

  // ── Quick status toggle ────────────────────────────────────────────────────
  async function toggleStatus(profile) {
    const next = profile.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    await updateProfile(profile.id, { status: next });
    load();
  }

  // ── Delete ─────────────────────────────────────────────────────────────────
  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await deleteProfile(deleteTarget.id);
      setDeleteTarget(null);
      load();
    } catch { /* silent */ }
    finally { setDeleteLoading(false); }
  }

  // ── Summary counts ─────────────────────────────────────────────────────────
  const total    = profiles.length;
  const active   = profiles.filter((p) => p.status === "ACTIVE").length;
  const admins   = profiles.filter((p) => p.role   === "ADMIN").length;
  const employees = profiles.filter((p) => p.role  === "EMPLOYEE").length;

  return (
    <>
      <PageHeader
        eyebrow="Admin · User Management"
        title="Employee Management"
        description="Manage staff accounts, roles, departments, and access levels across Texs Mart."
      >
        <button
          onClick={() => { setShowAdd(true); setAddForm(EMPTY_FORM); setAddError(""); }}
          className="inline-flex h-10 items-center gap-2 rounded-lg border border-signal-cyan/40 bg-signal-cyan/16 px-4 text-sm font-bold text-signal-cyan hover:bg-signal-cyan/24"
        >
          <Plus size={15} />
          Add Employee
        </button>
      </PageHeader>

      {/* Summary cards */}
      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <StatCard icon={Users}      label="Total Staff"  value={total}     tone="cyan"   />
        <StatCard icon={UserCheck}  label="Active"       value={active}    tone="green"  />
        <StatCard icon={ShieldCheck}label="Admins"       value={admins}    tone="yellow" />
        <StatCard icon={UserMinus}  label="Employees"    value={employees} tone="slate"  />
      </div>

      {/* Table */}
      <section className="panel rounded-lg overflow-hidden">
        <div className="border-b border-white/10 px-5 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
          Staff Directory — {total} total
        </div>

        {error   ? <div className="p-4"><ErrorPanel error={error} /></div>         : null}
        {loading ? <div className="p-4"><LoadingPanel label="Loading staff..." /></div> : null}

        {!loading && !error && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-left text-sm">
              <thead className="bg-white/[0.04] text-xs uppercase tracking-[0.14em] text-slate-400">
                <tr>
                  <th className="px-5 py-4">Name</th>
                  <th className="px-5 py-4">Email</th>
                  <th className="px-5 py-4">Role</th>
                  <th className="px-5 py-4">Department</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {profiles.map((p) => (
                  <tr key={p.id} className="border-b border-white/8 odd:bg-white/[0.02] hover:bg-signal-cyan/5">
                    <td className="px-5 py-4">
                      <p className="font-bold text-white">{p.full_name || "—"}</p>
                      {p.id === currentUser?.id && (
                        <span className="text-[10px] uppercase tracking-widest text-signal-cyan">You</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-slate-400">{p.email}</td>
                    <td className="px-5 py-4">
                      <span className={`rounded px-2 py-1 text-xs font-bold uppercase ${
                        p.role === "ADMIN"
                          ? "bg-signal-yellow/10 text-signal-yellow"
                          : "bg-signal-cyan/10 text-signal-cyan"
                      }`}>
                        {p.role}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-300">{p.department || "—"}</td>
                    <td className="px-5 py-4">
                      <span className={`rounded px-2 py-1 text-xs font-bold uppercase ${
                        p.status === "ACTIVE"
                          ? "bg-signal-green/10 text-signal-green"
                          : p.status === "SUSPENDED"
                          ? "bg-signal-red/10 text-signal-red"
                          : "bg-white/10 text-slate-400"
                      }`}>
                        {p.status || "ACTIVE"}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => { setEditProfile({ ...p }); setEditError(""); }}
                          title="Edit employee"
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-slate-400 hover:border-signal-cyan/40 hover:text-signal-cyan"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={() => toggleStatus(p)}
                          title={p.status === "ACTIVE" ? "Disable account" : "Enable account"}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-slate-400 hover:border-signal-yellow/40 hover:text-signal-yellow"
                        >
                          {p.status === "ACTIVE" ? <UserMinus size={13} /> : <UserCheck size={13} />}
                        </button>
                        {p.id !== currentUser?.id && (
                          <button
                            onClick={() => setDeleteTarget(p)}
                            title="Delete employee record"
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-slate-400 hover:border-signal-red/40 hover:text-signal-red"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {!profiles.length && (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-sm text-slate-600">
                      No employee profiles found. Add employees using the button above.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── Add modal ──────────────────────────────────────────────────────── */}
      {showAdd && (
        <Modal title="Add Employee" onClose={() => setShowAdd(false)}>
          <form onSubmit={handleAdd} className="space-y-4">
            <p className="rounded-lg border border-signal-yellow/20 bg-signal-yellow/5 px-3 py-2 text-xs text-signal-yellow">
              Note: This creates the profile record only. Set the user password separately in the Supabase Auth dashboard.
            </p>
            <MField label="Full Name *">
              <input required value={addForm.full_name} onChange={(e) => setAddForm((p) => ({ ...p, full_name: e.target.value }))} placeholder="Rahul Kumar" className={iCls} />
            </MField>
            <MField label="Email Address *">
              <input required type="email" value={addForm.email} onChange={(e) => setAddForm((p) => ({ ...p, email: e.target.value }))} placeholder="rahul@texsmart.com" className={iCls} />
            </MField>
            <div className="grid grid-cols-2 gap-4">
              <MField label="Role">
                <select value={addForm.role} onChange={(e) => setAddForm((p) => ({ ...p, role: e.target.value }))} className={iCls}>
                  {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </MField>
              <MField label="Department">
                <select value={addForm.department} onChange={(e) => setAddForm((p) => ({ ...p, department: e.target.value }))} className={iCls}>
                  <option value="">Select</option>
                  {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </MField>
            </div>
            {addError && <p className="text-xs text-signal-red">{addError}</p>}
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setShowAdd(false)} className={secBtn}>Cancel</button>
              <button type="submit" disabled={addSaving} className={priBtn}>
                {addSaving ? "Creating..." : "Create Profile"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Edit modal ─────────────────────────────────────────────────────── */}
      {editProfile && (
        <Modal title="Edit Employee" onClose={() => setEditProfile(null)}>
          <div className="space-y-4">
            <MField label="Full Name">
              <input value={editProfile.full_name || ""} onChange={(e) => setEditProfile((p) => ({ ...p, full_name: e.target.value }))} className={iCls} />
            </MField>
            <div className="grid grid-cols-2 gap-4">
              <MField label="Role">
                <select value={editProfile.role || "EMPLOYEE"} onChange={(e) => setEditProfile((p) => ({ ...p, role: e.target.value }))} className={iCls}>
                  {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </MField>
              <MField label="Department">
                <select value={editProfile.department || ""} onChange={(e) => setEditProfile((p) => ({ ...p, department: e.target.value }))} className={iCls}>
                  <option value="">Select</option>
                  {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </MField>
              <MField label="Status">
                <select value={editProfile.status || "ACTIVE"} onChange={(e) => setEditProfile((p) => ({ ...p, status: e.target.value }))} className={iCls}>
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </MField>
            </div>
            {editError && <p className="text-xs text-signal-red">{editError}</p>}
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setEditProfile(null)} className={secBtn}>Cancel</button>
              <button onClick={handleEditSave} disabled={editSaving} className={priBtn}>
                {editSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Delete confirm ─────────────────────────────────────────────────── */}
      {deleteTarget && (
        <Modal title="Delete Employee Record" onClose={() => setDeleteTarget(null)}>
          <p className="mb-2 text-sm text-slate-300">
            You are about to permanently delete the profile record for:
          </p>
          <p className="mb-6 font-bold text-white">{deleteTarget.full_name} ({deleteTarget.email})</p>
          <p className="mb-6 text-xs text-slate-500">
            This removes the profile record from Trend Trackers. The Supabase Auth account must be removed separately from the Supabase dashboard if needed.
          </p>
          <div className="flex justify-end gap-3">
            <button onClick={() => setDeleteTarget(null)} className={secBtn}>Cancel</button>
            <button onClick={handleDelete} disabled={deleteLoading} className="inline-flex h-10 items-center gap-2 rounded-lg border border-signal-red/40 bg-signal-red/14 px-4 text-sm font-bold text-signal-red disabled:opacity-50">
              {deleteLoading ? "Deleting..." : "Delete Record"}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}

// ── UI helpers ─────────────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, tone }) {
  const tones = {
    cyan:  "border-signal-cyan/30  text-signal-cyan",
    green: "border-signal-green/30 text-signal-green",
    yellow:"border-signal-yellow/30 text-signal-yellow",
    slate: "border-white/10 text-slate-400",
  };
  return (
    <div className="panel flex items-center gap-4 rounded-lg p-5">
      <span className={`flex h-11 w-11 items-center justify-center rounded-lg border ${tones[tone]}`}>
        <Icon size={20} />
      </span>
      <div>
        <p className="text-2xl font-bold text-white">{value}</p>
        <p className="text-xs text-slate-400">{label}</p>
      </div>
    </div>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-md rounded-xl border border-white/10 bg-ink-900 p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="font-bold text-white">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={16} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function MField({ label, children }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-slate-400">{label}</label>
      {children}
    </div>
  );
}

const iCls  = "h-10 w-full rounded-lg border border-white/10 bg-ink-950/70 px-3 text-sm text-white outline-none focus:border-signal-cyan/50";
const priBtn = "inline-flex h-10 items-center gap-2 rounded-lg border border-signal-cyan/40 bg-signal-cyan/16 px-4 text-sm font-bold text-signal-cyan disabled:opacity-50";
const secBtn = "inline-flex h-10 items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-4 text-sm font-bold text-slate-300 hover:bg-white/[0.08]";
