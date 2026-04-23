import { createServiceSupabaseClient } from "@/lib/supabase/admin";
import { getTenantSlug } from "@/lib/tenant";
import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

type Params = Promise<{ email: string }>;

const STATUS_BADGE: Record<string, { label: string; cls: string; dot: string }> = {
  confirmed: { label: "Confirmada",     cls: "border-emerald-400/20 bg-emerald-400/10 text-emerald-400", dot: "bg-emerald-400" },
  completed: { label: "Completada",     cls: "border-blue-400/20 bg-blue-400/10 text-blue-400",          dot: "bg-blue-400" },
  cancelled: { label: "Cancelada",      cls: "border-zinc-600/30 bg-zinc-600/10 text-zinc-500",           dot: "bg-zinc-500" },
  no_show:   { label: "No se presentó", cls: "border-amber-400/20 bg-amber-400/10 text-amber-400",        dot: "bg-amber-400" },
};

function parseDate(iso: string) {
  return new Date(iso.replace(" ", "T"));
}

export default async function ClienteDetailPage({ params }: { params: Params }) {
  const { email: emailParam } = await params;
  const email = decodeURIComponent(emailParam);

  const admin = createServiceSupabaseClient();
  const tenant = await getTenantSlug();

  if (!admin) notFound();

  const { data: bookingsRaw } = await admin
    .from("bookido_bookings")
    .select("id, starts_at, ends_at, customer_name, customer_email, customer_phone, notes, status, service_id")
    .eq("tenant_slug", tenant)
    .ilike("customer_email", email)
    .order("starts_at", { ascending: false });

  if (!bookingsRaw || bookingsRaw.length === 0) notFound();

  const { data: services } = await admin
    .from("bookido_services")
    .select("id, name")
    .eq("tenant_slug", tenant);

  const svcMap: Record<string, string> = {};
  services?.forEach((s) => { svcMap[s.id] = s.name; });

  const bookings = bookingsRaw.map((b) => ({
    ...b,
    service_name: b.service_id ? (svcMap[b.service_id] ?? "—") : "—",
  }));

  const client = {
    name: bookings[0].customer_name,
    email: bookings[0].customer_email,
    phone: bookings[0].customer_phone,
  };

  const total      = bookings.length;
  const completed  = bookings.filter((b) => b.status === "completed").length;
  const confirmed  = bookings.filter((b) => b.status === "confirmed").length;
  const cancelled  = bookings.filter((b) => b.status === "cancelled" || b.status === "no_show").length;
  const lastAt     = parseDate(bookings[0].starts_at);
  const firstAt    = parseDate(bookings[bookings.length - 1].starts_at);

  const tag =
    total >= 10 ? { label: "VIP ⭐", cls: "bg-amber-400/10 text-amber-400 ring-amber-400/20" }
    : total >= 4 ? { label: "Regular", cls: "bg-[#14F195]/10 text-[#14F195] ring-[#14F195]/20" }
    : { label: "Nuevo", cls: "bg-zinc-700/40 text-zinc-400 ring-zinc-600/20" };

  return (
    <div className="mx-auto max-w-4xl px-5 py-8 lg:px-8 lg:py-10">
      {/* Back */}
      <Link href="/panel/clientes" className="mb-6 inline-flex items-center gap-1.5 text-sm text-zinc-500 transition hover:text-zinc-300">
        <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Clientes
      </Link>

      {/* Client header */}
      <div className="mb-6 rounded-xl border border-white/[0.07] bg-ink-900/40 p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/[0.07] text-xl font-semibold text-white">
              {client.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-future text-xl font-semibold text-white">{client.name}</h1>
                <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ring-1 ${tag.cls}`}>{tag.label}</span>
              </div>
              <p className="text-sm text-zinc-500">{client.email}</p>
            </div>
          </div>
          {client.phone && (
            <a
              href={`https://wa.me/${client.phone.replace(/\D/g, "")}?text=${encodeURIComponent(`Hola ${client.name}, `)}`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 self-start rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-400 transition hover:bg-emerald-500/15 sm:self-auto"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              WhatsApp
            </a>
          )}
        </div>

        {/* Stats row */}
        <div className="mt-4 grid grid-cols-2 gap-3 border-t border-white/[0.05] pt-4 sm:grid-cols-4">
          {[
            { label: "Total reservas", value: total, cls: "text-white" },
            { label: "Completadas",    value: completed, cls: "text-blue-400" },
            { label: "Confirmadas",    value: confirmed, cls: "text-emerald-400" },
            { label: "Canceladas / NS", value: cancelled, cls: "text-zinc-500" },
          ].map((s) => (
            <div key={s.label} className="rounded-lg bg-white/[0.03] px-3 py-2.5">
              <p className={`text-2xl font-semibold ${s.cls}`}>{s.value}</p>
              <p className="text-[11px] text-zinc-600">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="mt-3 flex flex-wrap gap-4 text-xs text-zinc-500">
          <span>Primera visita: <span className="text-zinc-300">{format(firstAt, "d 'de' MMMM yyyy", { locale: es })}</span></span>
          <span>Última visita: <span className="text-zinc-300">{format(lastAt, "d 'de' MMMM yyyy", { locale: es })}</span></span>
        </div>
      </div>

      {/* Booking history */}
      <h2 className="mb-3 font-future text-base font-semibold text-white">Historial de reservas</h2>

      {/* Mobile */}
      <div className="sm:hidden space-y-2">
        {bookings.map((b) => {
          const start = parseDate(b.starts_at);
          const badge = STATUS_BADGE[b.status] ?? STATUS_BADGE.confirmed;
          return (
            <div key={b.id} className={`rounded-xl border bg-ink-900/40 p-4 ${b.status !== "confirmed" ? "border-white/[0.04] opacity-70" : "border-white/[0.07]"}`}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-mono text-sm font-semibold text-white">{format(start, "HH:mm")}</p>
                  <p className="text-xs text-zinc-500">{format(start, "d MMM yyyy", { locale: es })}</p>
                </div>
                <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${badge.cls}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${badge.dot}`} />
                  {badge.label}
                </span>
              </div>
              <p className="mt-2 text-sm text-zinc-300">{b.service_name}</p>
              {b.notes && <p className="mt-1 text-xs italic text-zinc-600">&ldquo;{b.notes}&rdquo;</p>}
            </div>
          );
        })}
      </div>

      {/* Desktop table */}
      <div className="hidden sm:block overflow-hidden rounded-xl border border-white/[0.07] bg-ink-900/40">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-white/[0.07]">
              {["Fecha / Hora", "Servicio", "Notas", "Estado"].map((h) => (
                <th key={h} className="px-4 py-3 text-[10px] font-medium uppercase tracking-wider text-zinc-600">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {bookings.map((b) => {
              const start = parseDate(b.starts_at);
              const end   = parseDate(b.ends_at);
              const badge = STATUS_BADGE[b.status] ?? STATUS_BADGE.confirmed;
              const mins  = Math.round((end.getTime() - start.getTime()) / 60000);
              return (
                <tr key={b.id} className={`border-b border-white/[0.05] transition hover:bg-white/[0.02] ${b.status !== "confirmed" ? "opacity-60" : ""}`}>
                  <td className="px-4 py-3.5">
                    <p className="font-mono text-sm font-medium text-white">{format(start, "HH:mm")}</p>
                    <p className="text-xs text-zinc-600">{format(start, "d MMM yyyy", { locale: es })}</p>
                  </td>
                  <td className="px-4 py-3.5 text-sm text-zinc-300">
                    {b.service_name}
                    <span className="ml-1.5 text-xs text-zinc-600">({mins} min)</span>
                  </td>
                  <td className="px-4 py-3.5 text-xs italic text-zinc-600 max-w-[200px] truncate">
                    {b.notes ? `"${b.notes}"` : "—"}
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${badge.cls}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${badge.dot}`} />
                      {badge.label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
