-- Seed: landing demo "bookido-demo" — La Exótica Nail Studio
-- Ejecutar en Supabase SQL Editor

-- Asegúrate de que exista el tenant
INSERT INTO public.tenants (slug, name)
VALUES ('bookido-demo', 'La Exótica Nail Studio')
ON CONFLICT (slug) DO NOTHING;

-- Servicios
DELETE FROM bookido_services WHERE tenant_slug = 'bookido-demo';
INSERT INTO bookido_services (tenant_slug, name, duration_minutes, price, description, active, sort_order) VALUES
  ('bookido-demo', 'Manicure clásica',    45,  650,  'Limpieza, forma perfecta y esmalte de larga duración. Incluye hidratación de manos.',            true, 1),
  ('bookido-demo', 'Acrílicas full set',  90,  1800, 'Uñas acrílicas completas con diseño a elección. Durabilidad garantizada por 3 semanas.',          true, 2),
  ('bookido-demo', 'Gel polish + diseño', 60,  950,  'Esmalte en gel de 2 semanas con arte personalizado. Más de 200 colores disponibles.',             true, 3),
  ('bookido-demo', 'Pedicure spa',        60,  800,  'Exfoliación, hidratación profunda, masaje de pies y esmalte. Relajación total.',                  true, 4),
  ('bookido-demo', 'Relleno acrílico',    60,  1100, 'Mantenimiento de tus acrílicas. Recomendado cada 3 semanas para lucir perfecta siempre.',         true, 5),
  ('bookido-demo', 'Nail art premium',    30,  400,  'Diseños exclusivos a mano alzada, pedrería, cromo y técnicas especiales. Precio por uña.',        true, 6);

-- Horarios
DELETE FROM bookido_business_hours WHERE tenant_slug = 'bookido-demo';
INSERT INTO bookido_business_hours (tenant_slug, day_of_week, open_time, close_time, is_closed) VALUES
  ('bookido-demo', 0, '09:00', '18:00', true),
  ('bookido-demo', 1, '09:00', '20:00', false),
  ('bookido-demo', 2, '09:00', '20:00', false),
  ('bookido-demo', 3, '09:00', '20:00', false),
  ('bookido-demo', 4, '09:00', '20:00', false),
  ('bookido-demo', 5, '09:00', '20:00', false),
  ('bookido-demo', 6, '09:00', '17:00', false);

-- Landing (campos en tabla DB)
INSERT INTO bookido_landings (
  tenant_slug, template, is_active,
  business_name, tagline, description, hero_color,
  whatsapp, address, schedule,
  show_booking_button, custom_cta_text,
  instagram_url, tiktok_url, facebook_url,
  photo_url_1, photo_url_2, photo_url_3
) VALUES (
  'bookido-demo',
  'nail_studio',
  true,
  'La Exótica Nail Studio',
  'Uñas de arte. Diseños únicos que hablan por ti.',
  'En La Exótica creemos que cada par de manos cuenta una historia. Somos un estudio boutique en el corazón de Santo Domingo especializado en nail art de alta gama, acrílicas y tratamientos de bienestar para tus manos y pies. Usamos exclusivamente productos sin MMA, libres de químicos agresivos, importados directamente de EE. UU. y Corea del Sur. Cada cliente recibe atención personalizada, porque para nosotras no existen dos juegos de uñas iguales.',
  '#d946ef',
  '18094521873',
  'C/ Gustavo Mejía Ricart 54, Evaristo Morales, Santo Domingo',
  'Lunes a Viernes 9am – 8pm · Sábado 9am – 5pm · Domingo cerrado',
  true,
  '💅 Reservar mi cita',
  'https://instagram.com/laexotica.nails',
  'https://tiktok.com/@laexotica.nails',
  'https://facebook.com/laexoticanailstudio',
  'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=1400&auto=format&q=85',
  'https://images.unsplash.com/photo-1604654894627-ef5b9c4d1d8d?w=800&auto=format&q=80',
  'https://images.unsplash.com/photo-1604654894578-5e35beaf8b8a?w=800&auto=format&q=80'
)
ON CONFLICT (tenant_slug) DO UPDATE SET
  template            = EXCLUDED.template,
  is_active           = EXCLUDED.is_active,
  business_name       = EXCLUDED.business_name,
  tagline             = EXCLUDED.tagline,
  description         = EXCLUDED.description,
  hero_color          = EXCLUDED.hero_color,
  whatsapp            = EXCLUDED.whatsapp,
  address             = EXCLUDED.address,
  schedule            = EXCLUDED.schedule,
  show_booking_button = EXCLUDED.show_booking_button,
  custom_cta_text     = EXCLUDED.custom_cta_text,
  instagram_url       = EXCLUDED.instagram_url,
  tiktok_url          = EXCLUDED.tiktok_url,
  facebook_url        = EXCLUDED.facebook_url,
  photo_url_1         = EXCLUDED.photo_url_1,
  photo_url_2         = EXCLUDED.photo_url_2,
  photo_url_3         = EXCLUDED.photo_url_3,
  updated_at          = NOW();
