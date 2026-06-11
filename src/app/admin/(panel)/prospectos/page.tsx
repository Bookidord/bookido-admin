import { createServiceSupabaseClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type ProspectoRow = {
  id: number;
  zona: string;
  slug: string;
  nombre: string;
  telefono: string | null;
  puntos: string | null;
  ruta: string | null;
  estado: string;
  toques: number;
  fecha_golpe1: string | null;
  proxima_accion: string | null;
  notas: string | null;
  updated_at: string;
};

const ESTADO_STYLE: Record<string, string> = {
  listo: "bg-amber-500/15 text-amber-400",
  disparado: "bg-blue-500/15 text-blue-400",
  toque2: "bg-indigo-500/15 text-indigo-400",
  respondio: "bg-emerald-500/15 text-emerald-400",
  banca: "bg-zinc-500/15 text-zinc-400",
  tablero: "bg-zinc-500/15 text-zinc-400",
  archivado: "bg-red-500/15 text-red-400",
};

export default async function ProspectosPage() {
  const admin = createServiceSupabaseClient();

  if (!admin) {
    return (
      <div className="mx-auto max-w-6xl px-5 py-8">
        <p className="text-sm text-red-400">Supabase no configurado.</p>
      </div>
    );
  }

  const { data, error } = await admin
    .from("prospectos")
    .select("*")
    .order("zona")
    .order("estado");

  if (error) {
    return (
      <div className="mx-auto max-w-6xl px-5 py-8">
        <p className="text-sm text-red-400">Error cargando prospectos: {error.message}</p>
      </div>
    );
  }

  const rows = (data ?? []) as ProspectoRow[];

  return (
    <div className="mx-auto max-w-6xl px-5 py-8">
      <h1 className="text-xl font-semibold text-white">Prospectos (cazador)</h1>
      <p className="mt-1 text-sm text-zinc-400">
        Estado de la cola del disparador (sincronizado desde el VPS) y tableros por zona.
      </p>

      <div className="mt-6 overflow-x-auto rounded-xl border border-zinc-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-900/60 text-xs uppercase tracking-wide text-zinc-500">
            <tr>
              <th className="px-4 py-3">Negocio</th>
              <th className="px-4 py-3">Zona</th>
              <th className="px-4 py-3">Pts</th>
              <th className="px-4 py-3">Ruta</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Toques</th>
              <th className="px-4 py-3">Golpe 1</th>
              <th className="px-4 py-3">Próxima acción</th>
              <th className="px-4 py-3">Notas</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/70">
            {rows.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-6 text-center text-zinc-500">
                  Sin prospectos todavía.
                </td>
              </tr>
            )}
            {rows.map((p) => (
              <tr key={p.id} className="hover:bg-zinc-900/40">
                <td className="px-4 py-3 font-medium text-zinc-200">
                  {p.nombre}
                  {p.telefono && <div className="text-xs text-zinc-500">{p.telefono}</div>}
                </td>
                <td className="px-4 py-3 text-zinc-400">{p.zona}</td>
                <td className="px-4 py-3 text-zinc-400">{p.puntos ?? "—"}</td>
                <td className="px-4 py-3 text-zinc-400">{p.ruta ?? "—"}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      ESTADO_STYLE[p.estado] ?? "bg-zinc-500/15 text-zinc-400"
                    }`}
                  >
                    {p.estado}
                  </span>
                </td>
                <td className="px-4 py-3 text-zinc-400">{p.toques}</td>
                <td className="px-4 py-3 text-zinc-400">{p.fecha_golpe1 ?? "—"}</td>
                <td className="px-4 py-3 text-zinc-400">{p.proxima_accion ?? "—"}</td>
                <td className="max-w-xs px-4 py-3 text-xs text-zinc-500">{p.notas ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
