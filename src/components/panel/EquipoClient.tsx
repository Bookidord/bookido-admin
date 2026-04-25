"use client";

import { useState, useTransition } from "react";
import { createStaffAction, updateStaffAction, toggleStaffAction, deleteStaffAction } from "@/app/panel/equipo/actions";

type Service = { id: string; name: string; duration_minutes: number };
type StaffMember = {
  id: string;
  name: string;
  role: string;
  color: string;
  phone: string | null;
  is_active: boolean;
  sort_order: number;
  service_ids: string[];
};

const ROLES = [
  { value: "stylist", label: "Estilista" },
  { value: "barber", label: "Barbero" },
  { value: "therapist", label: "Terapeuta" },
  { value: "esthetician", label: "Esteticista" },
  { value: "nail_tech", label: "Nail Tech" },
  { value: "doctor", label: "Médico" },
  { value: "other", label: "Otro" },
];

const COLORS = [
  "#6366f1", "#ec4899", "#f59e0b", "#10b981", "#3b82f6",
  "#8b5cf6", "#ef4444", "#14b8a6", "#f97316", "#84cc16",
];

const EMPTY_FORM = { name: "", role: "stylist", color: "#6366f1", phone: "", service_ids: [] as string[] };

function StaffForm({
  initial,
  services,
  onSave,
  onCancel,
}: {
  initial: typeof EMPTY_FORM;
  services: Service[];
  onSave: (data: typeof EMPTY_FORM) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState(initial);

  function toggleService(id: string) {
    setForm((f) => ({
      ...f,
      service_ids: f.service_ids.includes(id)
        ? f.service_ids.filter((s) => s !== id)
        : [...f.service_ids, id],
    }));
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs text-zinc-400 mb-1">Nombre *</label>
        <input
          className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-3 text-white text-sm focus:outline-none focus:border-zinc-500"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          placeholder="Ej: María López"
        />
      </div>

      <div>
        <label className="block text-xs text-zinc-400 mb-1">Rol</label>
        <select
          className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-3 text-white text-sm focus:outline-none focus:border-zinc-500"
          value={form.role}
          onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
        >
          {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-xs text-zinc-400 mb-1">Teléfono (opcional)</label>
        <input
          className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-3 text-white text-sm focus:outline-none focus:border-zinc-500"
          value={form.phone}
          onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
          placeholder="+1 809 000 0000"
        />
      </div>

      <div>
        <label className="block text-xs text-zinc-400 mb-2">Color en calendario</label>
        <div className="flex gap-2 flex-wrap">
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setForm((f) => ({ ...f, color: c }))}
              className="w-7 h-7 rounded-full border-2 transition-all"
              style={{
                backgroundColor: c,
                borderColor: form.color === c ? "white" : "transparent",
              }}
            />
          ))}
        </div>
      </div>

      {services.length > 0 && (
        <div>
          <label className="block text-xs text-zinc-400 mb-2">Servicios que realiza</label>
          <div className="space-y-2">
            {services.map((svc) => (
              <label key={svc.id} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.service_ids.includes(svc.id)}
                  onChange={() => toggleService(svc.id)}
                  className="w-4 h-4 rounded accent-indigo-500"
                />
                <span className="text-sm text-white">{svc.name}</span>
                <span className="text-xs text-zinc-500">{svc.duration_minutes} min</span>
              </label>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={() => onSave(form)}
          disabled={!form.name.trim()}
          className="flex-1 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-sm font-medium transition-colors"
        >
          Guardar
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-5 py-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm transition-colors"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}

export function EquipoClient({ staff: initialStaff, services }: { staff: StaffMember[]; services: Service[] }) {
  const [staff, setStaff] = useState(initialStaff);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleCreate(form: typeof EMPTY_FORM) {
    startTransition(async () => {
      setError(null);
      const res = await createStaffAction({
        name: form.name,
        role: form.role,
        color: form.color,
        phone: form.phone || null,
        service_ids: form.service_ids,
      });
      if (!res.ok) { setError(res.error); return; }
      setStaff((prev) => [
        ...prev,
        { id: res.id, name: form.name, role: form.role, color: form.color, phone: form.phone || null, is_active: true, sort_order: prev.length, service_ids: form.service_ids },
      ]);
      setShowAdd(false);
    });
  }

  function handleUpdate(id: string, form: typeof EMPTY_FORM) {
    startTransition(async () => {
      setError(null);
      const res = await updateStaffAction(id, {
        name: form.name,
        role: form.role,
        color: form.color,
        phone: form.phone || null,
        service_ids: form.service_ids,
      });
      if (!res.ok) { setError(res.error); return; }
      setStaff((prev) => prev.map((m) => m.id === id ? { ...m, name: form.name, role: form.role, color: form.color, phone: form.phone || null, service_ids: form.service_ids } : m));
      setEditingId(null);
    });
  }

  function handleToggle(id: string, active: boolean) {
    startTransition(async () => {
      const res = await toggleStaffAction(id, active);
      if (!res.ok) { setError(res.error); return; }
      setStaff((prev) => prev.map((m) => m.id === id ? { ...m, is_active: active } : m));
    });
  }

  function handleDelete(id: string) {
    if (!confirm("¿Eliminar este miembro? Sus reservas anteriores se conservan.")) return;
    startTransition(async () => {
      const res = await deleteStaffAction(id);
      if (!res.ok) { setError(res.error); return; }
      setStaff((prev) => prev.filter((m) => m.id !== id));
    });
  }

  const roleLabel = (r: string) => ROLES.find((x) => x.value === r)?.label ?? r;

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-lg bg-red-900/30 border border-red-700 px-4 py-3 text-red-300 text-sm">
          {error}
        </div>
      )}

      {staff.map((member) => (
        <div key={member.id} className="rounded-xl bg-zinc-900 border border-zinc-800 overflow-hidden">
          {editingId === member.id ? (
            <div className="p-5">
              <p className="text-sm font-medium text-white mb-4">Editar {member.name}</p>
              <StaffForm
                initial={{ name: member.name, role: member.role, color: member.color, phone: member.phone ?? "", service_ids: member.service_ids }}
                services={services}
                onSave={(form) => handleUpdate(member.id, form)}
                onCancel={() => setEditingId(null)}
              />
            </div>
          ) : (
            <div className="flex items-center gap-4 px-5 py-4">
              {/* Color dot */}
              <div className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-white font-semibold text-sm" style={{ backgroundColor: member.color }}>
                {member.name.charAt(0).toUpperCase()}
              </div>

              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${member.is_active ? "text-white" : "text-zinc-500 line-through"}`}>
                  {member.name}
                </p>
                <p className="text-xs text-zinc-500">{roleLabel(member.role)}{member.service_ids.length > 0 ? ` · ${member.service_ids.length} servicio${member.service_ids.length !== 1 ? "s" : ""}` : ""}</p>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => setEditingId(member.id)}
                  disabled={isPending}
                  className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs transition-colors"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleToggle(member.id, !member.is_active)}
                  disabled={isPending}
                  className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs transition-colors"
                >
                  {member.is_active ? "Pausar" : "Activar"}
                </button>
                <button
                  onClick={() => handleDelete(member.id)}
                  disabled={isPending}
                  className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-red-900/40 text-zinc-400 hover:text-red-400 text-xs transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>
          )}
        </div>
      ))}

      {staff.length === 0 && !showAdd && (
        <div className="text-center py-12 text-zinc-600 text-sm">
          Aún no tienes miembros en tu equipo.<br />
          <span className="text-zinc-400">Agrega el primero para activar la selección de staff en reservas.</span>
        </div>
      )}

      {showAdd ? (
        <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-5">
          <p className="text-sm font-medium text-white mb-4">Nuevo miembro</p>
          <StaffForm
            initial={EMPTY_FORM}
            services={services}
            onSave={handleCreate}
            onCancel={() => setShowAdd(false)}
          />
        </div>
      ) : (
        <button
          onClick={() => setShowAdd(true)}
          disabled={isPending}
          className="w-full py-3 rounded-xl border-2 border-dashed border-zinc-700 hover:border-zinc-500 text-zinc-400 hover:text-zinc-200 text-sm transition-colors"
        >
          + Agregar miembro
        </button>
      )}
    </div>
  );
}
