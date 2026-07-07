import { createServiceSupabaseClient } from '@/lib/supabase/admin';
import PipelineClient, { type Prospecto, type Metrics } from './PipelineClient';

export const dynamic = 'force-dynamic';

const ACTIVOS = ['nuevo', 'contactado', 'demo', 'prueba'];
const ETAPAS = ['nuevo', 'contactado', 'demo', 'prueba', 'pagando'];

type Row = Prospecto & { historial: { estado: string; at: string }[] | null };

function calcMetrics(rows: Row[]): Metrics {
  const activos = rows.filter(r => ACTIVOS.includes(r.estado)).length;

  // Conversión por canal (leads → pagando)
  const canalMap = new Map<string, { total: number; pagando: number }>();
  for (const r of rows) {
    const k = r.canal || 'otro';
    const c = canalMap.get(k) || { total: 0, pagando: 0 };
    c.total++;
    if (r.estado === 'pagando') c.pagando++;
    canalMap.set(k, c);
  }
  const porCanal = [...canalMap.entries()]
    .map(([canal, v]) => ({ canal, ...v }))
    .sort((a, b) => b.total - a.total);

  // Tiempo promedio por etapa (días) desde historial [{estado,at}]
  const durs = new Map<string, number[]>();
  for (const r of rows) {
    const h = Array.isArray(r.historial) ? [...r.historial].sort((a, b) => +new Date(a.at) - +new Date(b.at)) : [];
    for (let i = 0; i < h.length - 1; i++) {
      const ms = +new Date(h[i + 1].at) - +new Date(h[i].at);
      if (ms >= 0) (durs.get(h[i].estado) || durs.set(h[i].estado, []).get(h[i].estado)!).push(ms);
    }
  }
  const tiempoEtapaDias = ETAPAS.map(etapa => {
    const arr = durs.get(etapa) || [];
    const dias = arr.length ? (arr.reduce((a, b) => a + b, 0) / arr.length) / 86400000 : null;
    return { etapa, dias };
  });

  return { activos, porCanal, tiempoEtapaDias };
}

export default async function ProspectosPage() {
  const admin = createServiceSupabaseClient();
  if (!admin) {
    return <div className="mx-auto max-w-6xl px-5 py-8"><p className="text-sm text-red-400">Supabase no configurado.</p></div>;
  }

  const { data, error } = await admin
    .from('ros_prospectos')
    .select('*')
    .order('updated_at', { ascending: false });

  if (error) {
    return <div className="mx-auto max-w-6xl px-5 py-8"><p className="text-sm text-red-400">Error cargando prospectos: {error.message}</p></div>;
  }

  const rows = (data ?? []) as Row[];
  const metrics = calcMetrics(rows);
  const prospectos: Prospecto[] = rows.map(({ historial, ...p }) => p);

  return <PipelineClient prospectos={prospectos} metrics={metrics} />;
}
