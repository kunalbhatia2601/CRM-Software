"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  PackageCheck, CheckCircle2, Plus, Pencil, Trash2, Loader2, X, Check,
} from "lucide-react";
import Toast from "@/components/ui/Toast";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { useSite } from "@/context/SiteContext";
import { getServicesDropdown } from "@/actions/services.action";
import {
  addProjectServices, updateProjectService, removeProjectService,
} from "@/actions/projects.action";

/**
 * Services attached to a project, with full CRUD for managers.
 *
 * @param {string}  projectId
 * @param {Array}   initialServices  project.projectServices
 * @param {string}  basePath         role base for service links, e.g. "/owner"
 * @param {boolean} canManage        show add/edit/remove controls
 */
export default function ProjectServicesSection({
  projectId,
  initialServices = [],
  basePath = "/owner",
  canManage = true,
}) {
  const { format } = useSite();
  const [services, setServices] = useState(initialServices);
  const [toast, setToast] = useState(null);

  // Add form
  const [adding, setAdding] = useState(false);
  const [catalog, setCatalog] = useState([]);
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [newItem, setNewItem] = useState({ serviceId: "", quantity: 1, price: "" });
  const [saving, setSaving] = useState(false);

  // Inline edit
  const [editingId, setEditingId] = useState(null);
  const [editValues, setEditValues] = useState({ quantity: 1, price: "" });
  const [removingId, setRemovingId] = useState(null);

  const showToast = (type, message) => setToast({ type, message });

  useEffect(() => { setServices(initialServices); }, [initialServices]);

  const openAdd = async () => {
    setAdding(true);
    if (catalog.length === 0) {
      setLoadingCatalog(true);
      const list = await getServicesDropdown();
      setCatalog(Array.isArray(list) ? list : list?.data || []);
      setLoadingCatalog(false);
    }
  };

  const handleAdd = async () => {
    if (!newItem.serviceId) { showToast("error", "Pick a service"); return; }
    setSaving(true);
    const payload = [{
      serviceId: newItem.serviceId,
      quantity: Number(newItem.quantity) || 1,
      ...(newItem.price !== "" ? { price: Number(newItem.price) } : {}),
    }];
    const res = await addProjectServices(projectId, payload);
    setSaving(false);
    if (res.success) {
      const added = res.data[0];
      setServices((prev) => {
        const idx = prev.findIndex((p) => p.service?.id === added.serviceId);
        if (idx >= 0) { const next = [...prev]; next[idx] = added; return next; }
        return [...prev, added];
      });
      setAdding(false);
      setNewItem({ serviceId: "", quantity: 1, price: "" });
      showToast("success", "Service added");
    } else showToast("error", res.error || "Failed to add service");
  };

  const startEdit = (ps) => {
    setEditingId(ps.id);
    setEditValues({ quantity: ps.quantity || 1, price: String(ps.price ?? "") });
  };

  const saveEdit = async (ps) => {
    setSaving(true);
    const res = await updateProjectService(projectId, ps.service.id, {
      quantity: Number(editValues.quantity) || 1,
      price: Number(editValues.price) || 0,
    });
    setSaving(false);
    if (res.success) {
      setServices((prev) => prev.map((p) => (p.id === ps.id ? res.data : p)));
      setEditingId(null);
      showToast("success", "Service updated");
    } else showToast("error", res.error || "Failed to update");
  };

  const handleRemove = async () => {
    const ps = services.find((p) => p.id === removingId);
    if (!ps) return;
    const res = await removeProjectService(projectId, ps.service.id);
    if (res.success) {
      setServices((prev) => prev.filter((p) => p.id !== ps.id));
      showToast("success", "Service removed");
    } else showToast("error", res.error || "Failed to remove");
    setRemovingId(null);
  };

  const total = services.reduce((sum, ps) => sum + Number(ps.price) * (ps.quantity || 1), 0);
  const available = catalog.filter((c) => !services.some((ps) => ps.service?.id === c.id));
  const inputClass = "px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-50 focus:ring-2 focus:ring-[#5542F6] outline-none";

  // Nothing to show and no rights to add → hide the whole card.
  if (services.length === 0 && !canManage) return null;

  return (
    <div className="bg-white dark:bg-slate-950 rounded-[24px] p-6 lg:p-8 border border-slate-100 dark:border-slate-800 shadow-sm dark:shadow-none shadow-slate-200/50">
      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/30 flex items-center justify-center">
            <PackageCheck className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">Services</h3>
            <p className="text-xs text-slate-400">Services delivered in this project</p>
          </div>
        </div>
        {canManage && !adding && (
          <button
            onClick={openAdd}
            className="inline-flex items-center gap-2 px-3 py-2 bg-[#5542F6] text-white text-xs font-semibold rounded-xl hover:bg-[#4636d4] transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Add Service
          </button>
        )}
      </div>

      {/* Add form */}
      {adding && (
        <div className="mb-4 p-4 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-900/10">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-indigo-700 dark:text-indigo-300">Add a service</span>
            <button onClick={() => setAdding(false)}><X className="w-4 h-4 text-slate-400" /></button>
          </div>
          {loadingCatalog ? (
            <div className="flex items-center justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>
          ) : (
            <div className="grid sm:grid-cols-12 gap-2 items-center">
              <select
                className={`${inputClass} sm:col-span-6`}
                value={newItem.serviceId}
                onChange={(e) => {
                  const svc = catalog.find((c) => c.id === e.target.value);
                  setNewItem({
                    ...newItem,
                    serviceId: e.target.value,
                    price: svc ? String(svc.salePrice ?? svc.price ?? "") : "",
                  });
                }}
              >
                <option value="">Select a service…</option>
                {available.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <input
                type="number" min="1" placeholder="Qty"
                className={`${inputClass} sm:col-span-2 text-right`}
                value={newItem.quantity}
                onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })}
              />
              <input
                type="number" min="0" step="0.01" placeholder="Price"
                className={`${inputClass} sm:col-span-3 text-right`}
                value={newItem.price}
                onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
              />
              <button
                onClick={handleAdd}
                disabled={saving}
                className="sm:col-span-1 inline-flex items-center justify-center p-2 bg-[#5542F6] text-white rounded-lg hover:bg-[#4636d4] disabled:opacity-60"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              </button>
            </div>
          )}
        </div>
      )}

      {services.length === 0 ? (
        <p className="text-sm text-slate-400 italic">No services attached to this project yet.</p>
      ) : (
        <div className="space-y-3">
          {services.map((ps) => {
            const priceChanged = ps.originalPrice && Number(ps.price) !== Number(ps.originalPrice);
            const isEditing = editingId === ps.id;
            return (
              <div key={ps.id} className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-linear-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
                    {ps.service?.name?.[0]?.toUpperCase() || "S"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link href={`${basePath}/services/${ps.service?.id}`} className="text-sm font-semibold text-slate-900 dark:text-slate-50 hover:text-indigo-600 transition-colors">
                      {ps.service?.name}
                    </Link>
                    {ps.service?.points?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {ps.service.points.slice(0, 4).map((point, i) => (
                          <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 rounded text-xs font-medium border border-emerald-100 dark:border-emerald-900/30">
                            <CheckCircle2 className="w-3 h-3" />
                            {point}
                          </span>
                        ))}
                        {ps.service.points.length > 4 && (
                          <span className="text-xs text-slate-400 px-2 py-0.5">+{ps.service.points.length - 4} more</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {isEditing ? (
                  <div className="flex items-center gap-2 shrink-0 ml-4">
                    <input
                      type="number" min="1"
                      className={`${inputClass} w-16 text-right`}
                      value={editValues.quantity}
                      onChange={(e) => setEditValues({ ...editValues, quantity: e.target.value })}
                    />
                    <input
                      type="number" min="0" step="0.01"
                      className={`${inputClass} w-28 text-right`}
                      value={editValues.price}
                      onChange={(e) => setEditValues({ ...editValues, price: e.target.value })}
                    />
                    <button onClick={() => saveEdit(ps)} disabled={saving} className="p-2 bg-emerald-500 text-white rounded-lg disabled:opacity-60">
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    </button>
                    <button onClick={() => setEditingId(null)} className="p-2 bg-slate-200 dark:bg-slate-700 rounded-lg">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 shrink-0 ml-4">
                    <div className="text-right">
                      <span className="text-sm font-semibold text-slate-900 dark:text-slate-50" suppressHydrationWarning>
                        {format(Number(ps.price), { decimals: 0 })}
                      </span>
                      {priceChanged && (
                        <p className="text-xs text-amber-600 mt-0.5" suppressHydrationWarning>
                          was {format(Number(ps.originalPrice), { decimals: 0 })}
                        </p>
                      )}
                      {ps.quantity > 1 && <p className="text-xs text-slate-400">x{ps.quantity}</p>}
                    </div>
                    {canManage && (
                      <div className="flex items-center gap-1">
                        <button onClick={() => startEdit(ps)} className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800" title="Edit">
                          <Pencil className="w-3.5 h-3.5 text-slate-400" />
                        </button>
                        <button onClick={() => setRemovingId(ps.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20" title="Remove">
                          <Trash2 className="w-3.5 h-3.5 text-red-400" />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-700 mt-3">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Services Value</span>
            <span className="text-lg font-bold text-slate-900 dark:text-slate-50" suppressHydrationWarning>
              {format(total, { decimals: 0 })}
            </span>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!removingId}
        onClose={() => setRemovingId(null)}
        onConfirm={handleRemove}
        title="Remove Service"
        message="Remove this service from the project? Past invoices are not affected."
        confirmLabel="Remove"
        variant="danger"
      />
    </div>
  );
}
