// Use bookido-admin's Supabase service role client to bypass RLS
const { createClient } = require('@supabase/supabase-js');

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tgdijcttaqbmsepfqgoo.supabase.co';
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const admin = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

async function main() {
  // 1. Create landing
  console.log('1. Creating landing...');
  const { data: landing, error: landingErr } = await admin
    .from('bookido_landings')
    .insert({
      tenant_slug: 'baby-makeup',
      is_active: true,
      template: 'premium',
      business_name: 'Baby Makeup',
      tagline: 'Maquillaje profesional a domicilio en Las Galeras y Saman\u00e1',
      description: 'Yo voy donde t\u00fa est\u00e9s. Maquillaje profesional para bodas, quincea\u00f1eras, sesiones de fotos y eventos especiales. Productos premium importados, resultados que duran toda la noche. Servicio a domicilio en toda la zona de Saman\u00e1.',
      whatsapp: '18099526939',
      address: 'Las Galeras, Saman\u00e1, Rep\u00fablica Dominicana',
      schedule: 'Lunes a S\u00e1bado 8:00 AM - 8:00 PM | Domingos 10:00 AM - 4:00 PM',
      hero_color: '#E91E8C',
      instagram_url: 'https://www.instagram.com/lababy_makeup/',
      facebook_url: 'https://www.facebook.com/labeibi.javier',
      show_booking_button: true,
      custom_cta_text: 'Reservar mi maquillaje',
      owner_name: 'Baby Javier',
      owner_bio: 'Maquilladora profesional con pasi\u00f3n por resaltar la belleza natural de cada clienta. Especializada en maquillaje de novia, quincea\u00f1eras y eventos sociales. Servicio a domicilio en Las Galeras y Saman\u00e1 \u2014 yo voy donde t\u00fa est\u00e9s.',
      owner_specialty: 'Maquillaje de novia y eventos a domicilio',
      stats_years: 5,
      stats_clients: 200,
    })
    .select('id')
    .single();

  if (landingErr) console.log('  Landing ERROR:', landingErr.message);
  else console.log('  Landing created:', landing.id);

  // 2. Create business hours
  console.log('\n2. Creating business hours...');
  const days = [
    { day_of_week: 1, open_time: '08:00', close_time: '20:00', is_closed: false },
    { day_of_week: 2, open_time: '08:00', close_time: '20:00', is_closed: false },
    { day_of_week: 3, open_time: '08:00', close_time: '20:00', is_closed: false },
    { day_of_week: 4, open_time: '08:00', close_time: '20:00', is_closed: false },
    { day_of_week: 5, open_time: '08:00', close_time: '20:00', is_closed: false },
    { day_of_week: 6, open_time: '08:00', close_time: '20:00', is_closed: false },
    { day_of_week: 0, open_time: '10:00', close_time: '16:00', is_closed: false },
  ];
  const dayNames = ['Dom','Lun','Mar','Mi\u00e9','Jue','Vie','S\u00e1b'];

  for (const day of days) {
    const { error } = await admin
      .from('bookido_business_hours')
      .insert({ tenant_slug: 'baby-makeup', ...day });
    console.log('  ' + (error ? '\u2717 ' + error.message : '\u2713') + ' ' + dayNames[day.day_of_week]);
  }

  // 3. Create subscription
  console.log('\n3. Creating subscription...');
  // Check what columns exist
  const { data: existingSub } = await admin
    .from('bookido_subscriptions')
    .select('*')
    .eq('tenant_slug', 'yorbana-nail')
    .maybeSingle();

  if (existingSub) {
    console.log('  Yorbana sub columns:', Object.keys(existingSub).join(', '));
  }

  const subData = {
    tenant_slug: 'baby-makeup',
    status: 'trial',
    start_date: '2026-05-25',
    end_date: '2026-06-25',
  };

  // Add plan_id if it exists in schema
  if (existingSub && 'plan_id' in existingSub) {
    subData.plan_id = existingSub.plan_id; // copy format from yorbana
  }

  const { data: sub, error: subErr } = await admin
    .from('bookido_subscriptions')
    .insert(subData)
    .select('*')
    .single();

  if (subErr) {
    console.log('  Sub ERROR:', subErr.message);
    // Try minimal insert
    const { error: subErr2 } = await admin
      .from('bookido_subscriptions')
      .insert({ tenant_slug: 'baby-makeup', status: 'trial', end_date: '2026-06-25' });
    console.log('  Retry:', subErr2 ? subErr2.message : 'OK');
  } else {
    console.log('  Subscription created:', sub.status, 'until', sub.end_date);
  }

  // 4. Verify everything
  console.log('\n=== VERIFICATION ===');
  const { data: vLanding } = await admin.from('bookido_landings').select('id,is_active,business_name').eq('tenant_slug','baby-makeup').maybeSingle();
  console.log('Landing:', vLanding ? vLanding.business_name + ' (active:' + vLanding.is_active + ')' : 'MISSING');

  const { count: hoursCount } = await admin.from('bookido_business_hours').select('id',{count:'exact',head:true}).eq('tenant_slug','baby-makeup');
  console.log('Business hours:', hoursCount, 'days');

  const { count: svcCount } = await admin.from('bookido_services').select('id',{count:'exact',head:true}).eq('tenant_slug','baby-makeup');
  console.log('Services:', svcCount);

  const { data: vSub } = await admin.from('bookido_subscriptions').select('status,end_date').eq('tenant_slug','baby-makeup').maybeSingle();
  console.log('Subscription:', vSub ? vSub.status + ' until ' + vSub.end_date : 'NONE');
}

main().catch(err => console.error('Fatal:', err));
