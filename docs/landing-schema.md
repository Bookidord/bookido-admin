# Landing Schema — Campos necesarios para la nueva landing

## YA EXISTE (no tocar)
### bookido_landings
- template, business_name, tagline, description, hero_color
- photo_url_1..6, instagram_url, tiktok_url, facebook_url
- show_booking_button, custom_cta_text
- owner_name, owner_bio, owner_photo_url, owner_video_url
- diploma_urls[], stats_years, stats_clients
- whatsapp, address, schedule

### bookido_services
- id, tenant_slug, name, description, duration_minutes, price, active, sort_order

### bookido_business_hours
- tenant_slug, day_of_week (0=Dom), is_open, slots[]{open, close}

### bookido_bookings
- tenant_slug, customer_name, service_id, starts_at, created_at, status

## AGREGAR (2 columnas, bajo impacto)
### bookido_services
- photo_url TEXT — foto individual del servicio (null = sin foto)
- category TEXT — agrupación para filtros (null = sin categoría)

### bookido_landings  
- faq_items JSONB — [{q: string, a: string}] (null = FAQ por defecto del rubro)

## SQL para aplicar cuando sea posible
```sql
ALTER TABLE bookido_services ADD COLUMN IF NOT EXISTS photo_url TEXT;
ALTER TABLE bookido_services ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE bookido_landings ADD COLUMN IF NOT EXISTS faq_items JSONB;
```

## NO SE NECESITA por ahora
- Tabla bookido_reviews (testimonios) — Fase 3C futura
- Campo theme_mode (dark/light) — default dark siempre
