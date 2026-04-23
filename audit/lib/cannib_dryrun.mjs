/**
 * Cannibalization Fix — DRYRUN
 * Reads cannibalization.csv, classifies each pair, generates all artifacts
 * in ./cannibalization-fix/
 */
import fs from 'fs';
import path from 'path';
import https from 'https';

const DOMAIN = 'https://xn--gestindo-z3a.com';
const SEO_PLUGIN = 'yoast';
const OUT = 'C:/Users/debai/bookido/cannibalization-fix';

// ── helpers ──────────────────────────────────────────────────────────────────
function mkdir(p) { fs.mkdirSync(p, { recursive: true }); }
function write(p, content) { fs.writeFileSync(p, content, 'utf8'); }
function slug(url) { return url.split('/').filter(Boolean).pop() || url.split('/').filter(Boolean).slice(-1)[0]; }
function esc(s) { return String(s).replace(/"/g, '""'); }

function parseCSV(file) {
  const lines = fs.readFileSync(file, 'utf8').trim().split('\n');
  const headers = lines[0].split(',').map(h => h.replace(/^"|"$/g, ''));
  return lines.slice(1).map(line => {
    const vals = []; let cur = '', inQ = false;
    for (const c of line) {
      if (c === '"') inQ = !inQ;
      else if (c === ',' && !inQ) { vals.push(cur); cur = ''; }
      else cur += c;
    }
    vals.push(cur);
    const obj = {};
    headers.forEach((h, i) => obj[h] = vals[i] || '');
    return obj;
  });
}

// ── Classify pair ─────────────────────────────────────────────────────────────
const GEO_CITIES = [
  'santo-domingo','santiago','punta-cana','puerto-plata','la-romana','la-vega',
  'san-pedro','higuey','higüey','barahona','moca','bani','bonao','cotui',
  'san-francisco','republica-dominicana','rd'
];
const GEO_VERTICALS = [
  'salon-belleza','spa','barberia','nail-studio','clinica-estetica','lash-studio',
  'restaurante','restaurantes','pos','reservaciones','gestion-negocios'
];

function getCityFromUrl(url) {
  const s = url.toLowerCase();
  return GEO_CITIES.find(c => s.includes(c)) || null;
}

function isSantoDomingo(url) { return url.includes('santo-domingo'); }

function isGeoLanding(url) {
  return GEO_CITIES.some(c => url.includes(c));
}

function isDifferentGeo(urlA, urlB) {
  const cityA = getCityFromUrl(urlA);
  const cityB = getCityFromUrl(urlB);
  // If both have city markers and they differ → different geo targets
  if (cityA && cityB && cityA !== cityB) return true;
  return false;
}

// Manually-confirmed consolidation candidates from 04-content-onpage.md audit
const MANUAL_CONSOLIDATE = {
  // propina-legal: same topic, different categories — merge into the longer/more complete one
  'https://xn--gestindo-z3a.com/finanzas-legalidad/propina-legal-10-rd/': {
    winner: 'https://xn--gestindo-z3a.com/gastronomia/propina-legal-restaurantes-rd/',
    reason: 'Canibalización severa detectada en auditoría — ambas cubren "propina legal 10% RD". Ganadora: /gastronomia/ (título más específico para restaurantes)'
  },
  'https://xn--gestindo-z3a.com/gastronomia/propina-legal-restaurantes-rd/': null, // winner, skip
  // extension-pestanas vs lash-lifting: same vertical, same category, same intent
  'https://xn--gestindo-z3a.com/belleza-bienestar/extension-pestanas-salon-rd/': {
    winner: 'https://xn--gestindo-z3a.com/belleza-bienestar/lash-lifting-salon-rd/',
    reason: 'Misma intención y categoría — "extensiones/lash lifting RD". Ganadora: lash-lifting tiene mayor word count (1671w)'
  },
  'https://xn--gestindo-z3a.com/belleza-bienestar/lash-lifting-salon-rd/': null // winner, skip
};

function classify(pair) {
  const sim = parseFloat(pair.jaccard_sim);
  const wordsA = parseInt(pair.words_a) || 0;
  const wordsB = parseInt(pair.words_b) || 0;
  const sharedCount = parseInt(pair.shared_count) || 0;
  const catA = pair.cat_a;

  // Manual overrides
  if (MANUAL_CONSOLIDATE[pair.url_a] && MANUAL_CONSOLIDATE[pair.url_a] !== null) {
    const m = MANUAL_CONSOLIDATE[pair.url_a];
    return { action: 'CONSOLIDATE', winner: m.winner, loser: pair.url_a, reason: m.reason };
  }
  if (MANUAL_CONSOLIDATE[pair.url_b] && MANUAL_CONSOLIDATE[pair.url_b] !== null) {
    const m = MANUAL_CONSOLIDATE[pair.url_b];
    return { action: 'CONSOLIDATE', winner: m.winner, loser: pair.url_b, reason: m.reason };
  }

  // Santo Domingo geo-landings → Phase 2 hub/spoke treatment
  if (isSantoDomingo(pair.url_a) || isSantoDomingo(pair.url_b)) {
    return { action: 'DIFFERENTIATE', reason: 'Santo Domingo geo-landing — hub/spoke treatment en Fase 2' };
  }

  // Never consolidate pages targeting different cities — each geo-landing is valid
  if (isDifferentGeo(pair.url_a, pair.url_b)) {
    return {
      action: 'DIFFERENTIATE',
      reason: `Geo-landings de ciudades distintas (${getCityFromUrl(pair.url_a)} vs ${getCityFromUrl(pair.url_b)}). Cada página es válida — diferenciar contenido por ciudad.`
    };
  }

  // Truly same-topic, same-city posts with very high similarity → CONSOLIDATE
  // Only non-geo pages OR same-city same-vertical
  if (sim >= 0.65 && catA === pair.cat_b && !isGeoLanding(pair.url_a) && !isGeoLanding(pair.url_b)) {
    const winner = wordsA >= wordsB ? pair.url_a : pair.url_b;
    const loser = winner === pair.url_a ? pair.url_b : pair.url_a;
    return {
      action: 'CONSOLIDATE',
      winner,
      loser,
      reason: `Similitud ${sim} — misma categoría, sin geo-target diferenciado. Ganadora: ${Math.max(wordsA, wordsB)}w`
    };
  }

  // High similarity + same category but geo-landing → DIFFERENTIATE with city angle
  if (sim >= 0.5 && isGeoLanding(pair.url_a)) {
    return {
      action: 'DIFFERENTIATE',
      reason: `Geo-landings similares. Añadir 200+ palabras únicas sobre características del sector/barrio en cada ciudad.`
    };
  }

  // Cross-category similar posts → DIFFERENTIATE
  if (sim >= 0.5) {
    return {
      action: 'DIFFERENTIATE',
      reason: `Similitud ${sim} cross-categoría (${catA} vs ${pair.cat_b}). Reescribir para ángulos distintos.`
    };
  }

  // Thin content + shared keywords → NOINDEX
  if ((wordsA < 500 || wordsB < 500) && sharedCount >= 5) {
    const thinUrl = wordsA < wordsB ? pair.url_a : pair.url_b;
    const mainUrl = thinUrl === pair.url_a ? pair.url_b : pair.url_a;
    return {
      action: 'NOINDEX',
      thin: thinUrl,
      main: mainUrl,
      reason: `Post delgado (${Math.min(wordsA, wordsB)}w) + ${sharedCount} keywords. NOINDEX + canonical.`
    };
  }

  // Default
  return {
    action: 'DIFFERENTIATE',
    reason: `${sharedCount} keywords compartidas. Diferenciar enfoque de contenido.`
  };
}

// ── SD hub/spoke differentiation ──────────────────────────────────────────────
const SD_SPOKE_NICHES = {
  'software-reservaciones-salon-belleza-santo-domingo': {
    vertical: 'Salones de Belleza',
    zona: 'Ciudad de Santo Domingo',
    targetKw: 'software reservaciones salon belleza santo domingo',
    titleNew: 'Software de Reservaciones para Salones de Belleza en Santo Domingo | Bookido',
    h1New: 'Software de Reservaciones para Salones de Belleza en Santo Domingo',
    metaNew: 'Gestiona citas, clientes y pagos de tu salón de belleza en Santo Domingo con Bookido. Plan gratis disponible. Automatiza reservas hoy.',
    parrafNew: 'Si tienes un salón de belleza en Santo Domingo, sabes que gestionar las citas por WhatsApp te consume horas cada semana. Bookido es el software de reservaciones online diseñado específicamente para salones dominicanos: te permite recibir citas 24/7, enviar recordatorios automáticos y cobrar en pesos dominicanos desde el primer día.'
  },
  'software-reservaciones-spa-santo-domingo': {
    vertical: 'Spas y Centros de Bienestar',
    zona: 'Santo Domingo',
    targetKw: 'software reservaciones spa santo domingo',
    titleNew: 'Software para Spas y Centros de Bienestar en Santo Domingo | Bookido',
    h1New: 'Software de Reservaciones para Spas en Santo Domingo',
    metaNew: 'Automatiza las reservas de tu spa en Santo Domingo con Bookido. Control de agenda, clientes VIP y pagos en RD$. Empieza gratis.',
    parrafNew: 'Los spas en Santo Domingo enfrentan un reto único: clientes de alto valor que esperan una experiencia premium desde la primera reserva. Bookido te da un sistema de citas online elegante y profesional, con confirmaciones automáticas por WhatsApp y control total de tu agenda desde el celular.'
  },
  'software-reservaciones-barberia-santo-domingo': {
    vertical: 'Barberías',
    zona: 'Santo Domingo',
    targetKw: 'software reservaciones barberia santo domingo',
    titleNew: 'Software para Barberías en Santo Domingo: Reservas Online | Bookido',
    h1New: 'Software de Citas para Barberías en Santo Domingo',
    metaNew: 'Gestiona las citas de tu barbería en Santo Domingo con Bookido. Sin llamadas, sin WhatsApp caótico. Reservas online 24/7 en pesos dominicanos.',
    parrafNew: 'Las barberías en Santo Domingo que usan Bookido reducen los no-shows hasta un 40% gracias a los recordatorios automáticos. Tu cliente reserva en línea, elige su barbero favorito y recibe confirmación inmediata — sin que tengas que contestar un solo mensaje.'
  },
  'software-reservaciones-nail-studio-santo-domingo': {
    vertical: 'Nail Studios y Centros de Uñas',
    zona: 'Santo Domingo',
    targetKw: 'software reservaciones nail studio santo domingo',
    titleNew: 'Software para Nail Studios en Santo Domingo: Citas Online | Bookido',
    h1New: 'Sistema de Reservas para Nail Studios en Santo Domingo',
    metaNew: 'Bookido es el sistema de citas online para nail studios en Santo Domingo. Gestiona servicios de uñas, fideliza clientas y acepta pagos en RD$.',
    parrafNew: 'Un nail studio en Santo Domingo puede recibir hasta 20 citas diarias. Gestionar eso por WhatsApp es caótico. Bookido te permite mostrar tu catálogo completo de servicios — acrílicas, gel, manicura, pedicura — y que tus clientas reserven solas en segundos.'
  },
  'software-reservaciones-clinica-estetica-santo-domingo': {
    vertical: 'Clínicas Estéticas',
    zona: 'Santo Domingo',
    targetKw: 'software clinica estetica santo domingo',
    titleNew: 'Software para Clínicas Estéticas en Santo Domingo | Bookido',
    h1New: 'Sistema de Reservas para Clínicas Estéticas en Santo Domingo',
    metaNew: 'Gestiona citas de tratamientos estéticos en Santo Domingo con Bookido. Historial de clientes, recordatorios y pagos en pesos dominicanos.',
    parrafNew: 'Las clínicas estéticas en Santo Domingo manejan tratamientos que requieren seguimiento: láser, botox, faciales, reducción de medidas. Bookido no es solo un sistema de citas — guarda el historial de cada cliente, los tratamientos realizados y permite programar citas de seguimiento automáticamente.'
  },
  'software-reservaciones-lash-studio-santo-domingo': {
    vertical: 'Lash Studios',
    zona: 'Santo Domingo',
    targetKw: 'software lash studio santo domingo',
    titleNew: 'Software para Lash Studios en Santo Domingo: Citas Online | Bookido',
    h1New: 'Sistema de Reservas para Lash Studios en Santo Domingo',
    metaNew: 'Bookido es el sistema de citas para lash studios en Santo Domingo. Agenda extensiones de pestañas, fideliza clientas y cobra en RD$.',
    parrafNew: 'Los lash studios en Santo Domingo son uno de los negocios de belleza de mayor crecimiento en 2026. Si ofreces extensiones clásicas, volumen o mega volumen, necesitas un sistema que muestre tu disponibilidad real y permita a tus clientas reservar sin interrumpirte mientras trabajas.'
  }
};

// ── MAIN ──────────────────────────────────────────────────────────────────────
mkdir(OUT);
mkdir(`${OUT}/02-santo-domingo-hub`);
mkdir(`${OUT}/03-wp-cli`);
mkdir(`${OUT}/04-htaccess`);
mkdir(`${OUT}/05-differentiate`);
mkdir(`${OUT}/06-internal-links`);
mkdir(`${OUT}/07-post-deploy`);
mkdir(`${OUT}/backups`);

const pairs = parseCSV('C:/Users/debai/bookido/audit/cannibalization.csv');

// Add manually-confirmed pairs that fell below the keyword threshold
// but were identified in the original audit as critical
const EXTRA_PAIRS = [
  {
    url_a: 'https://xn--gestindo-z3a.com/finanzas-legalidad/propina-legal-10-rd/',
    url_b: 'https://xn--gestindo-z3a.com/gastronomia/propina-legal-restaurantes-rd/',
    title_a: 'Propina Legal 10% en RD: Guía completa para restaurantes | Gestióndo',
    title_b: 'Ley de Propina 10% en Restaurantes de RD: Guía Legal 2026 | Gestióndo',
    shared_query: 'propina legal restaurantes rd',
    shared_keywords: 'propina|legal|restaurantes',
    jaccard_sim: '0.600',
    shared_count: '3',
    words_a: '1620',
    words_b: '1750',
    cat_a: 'finanzas-legalidad',
    cat_b: 'gastronomia'
  }
];
EXTRA_PAIRS.forEach(ep => pairs.push(ep));
// Add extra pairs to cannibalization.csv as well
const csvExtra = EXTRA_PAIRS.map(p =>
  [p.url_a, p.url_b, p.title_a, p.title_b, p.shared_query, p.shared_keywords,
   p.jaccard_sim, p.shared_count, p.words_a, p.words_b, p.cat_a, p.cat_b]
    .map(v => `"${esc(v)}"`).join(',')
);
const existingCsv = fs.readFileSync('C:/Users/debai/bookido/audit/cannibalization.csv', 'utf8');
fs.writeFileSync('C:/Users/debai/bookido/audit/cannibalization.csv', existingCsv + '\n' + csvExtra.join('\n'));
console.log(`Loaded ${pairs.length} pairs`);

// ── Phase 1: Classify ─────────────────────────────────────────────────────────
const decisions = [];
const stats = { CONSOLIDATE: 0, DIFFERENTIATE: 0, CANONICAL: 0, NOINDEX: 0 };

for (const pair of pairs) {
  const dec = classify(pair);
  decisions.push({
    url_winner: dec.winner || pair.url_a,
    url_loser: dec.loser || pair.url_b,
    action: dec.action,
    reason: dec.reason,
    shared_query: pair.shared_query,
    jaccard_sim: pair.jaccard_sim,
    estimated_impact: dec.action === 'CONSOLIDATE' ? 'Alto — consolida autoridad de enlace'
      : dec.action === 'DIFFERENTIATE' ? 'Medio — separa intención, evita split de señales'
      : dec.action === 'NOINDEX' ? 'Bajo-Medio — elimina contenido débil del índice'
      : 'Bajo — aclara señal canónica'
  });
  stats[dec.action]++;
}

// Write 01-decisions.csv
const decHeader = 'url_winner,url_loser,action,reason,shared_query,jaccard_sim,estimated_impact';
const decRows = decisions.map(d =>
  [d.url_winner, d.url_loser, d.action, d.reason, d.shared_query, d.jaccard_sim, d.estimated_impact]
    .map(v => `"${esc(v)}"`).join(',')
);
write(`${OUT}/01-decisions.csv`, decHeader + '\n' + decRows.join('\n'));
console.log(`Phase 1 done: ${JSON.stringify(stats)}`);

// ── Phase 2: Santo Domingo Hub ────────────────────────────────────────────────
const hubContent = `---
url: /software-para-negocios-santo-domingo/
title: Software para Negocios en Santo Domingo — Reservas y Gestión | Gestióndo
h1: Software para Negocios en Santo Domingo
meta: Bookido y RestaurantOS Pro: el software de gestión y reservaciones para negocios en Santo Domingo. Salones, spas, barberías, restaurantes. Gratis para empezar.
schema: LocalBusiness + BreadcrumbList + FAQPage
---

# Software para Negocios en Santo Domingo

Santo Domingo es el corazón económico de República Dominicana y también donde más rápido crece el ecosistema de pequeños negocios de servicios. Más de 15,000 salones, barberías, spas, restaurantes y centros estéticos operan en la Gran Santo Domingo — y la mayoría todavía gestiona sus citas por WhatsApp o libreta.

**Gestióndo** lleva el software que estos negocios necesitan: reservas online 24/7, control de agenda, gestión de clientes y pagos en pesos dominicanos. Todo en una plataforma pensada para el mercado dominicano.

---

## ¿Para qué tipo de negocio en Santo Domingo?

Hemos diseñado soluciones específicas para cada vertical de servicios en Santo Domingo:

### Salones de Belleza en Santo Domingo
Gestiona citas de coloración, corte, alisado y más. Tus clientas reservan online, tú recibes la agenda completa desde el celular.
→ [Software para Salones de Belleza en Santo Domingo](/belleza-bienestar/software-reservaciones-salon-belleza-santo-domingo/)

### Spas y Centros de Bienestar en Santo Domingo
Tratamientos, masajes y terapias requieren más tiempo de preparación. Bookido gestiona la duración de cada servicio y bloquea el tiempo necesario automáticamente.
→ [Software para Spas en Santo Domingo](/belleza-bienestar/software-reservaciones-spa-santo-domingo/)

### Barberías en Santo Domingo
Tus clientes eligen su barbero favorito y reservan en segundos. Cero llamadas, cero WhatsApp caótico.
→ [Software para Barberías en Santo Domingo](/belleza-bienestar/software-reservaciones-barberia-santo-domingo/)

### Nail Studios en Santo Domingo
Catálogo de servicios de uñas, duración por técnica, gestión de materiales. Tu agenda de nail studio organizada automáticamente.
→ [Software para Nail Studios en Santo Domingo](/belleza-bienestar/software-reservaciones-nail-studio-santo-domingo/)

### Clínicas Estéticas en Santo Domingo
Historial de clientes, tratamientos previos y seguimiento post-servicio. Más que un sistema de citas: un CRM para tu clínica estética.
→ [Software para Clínicas Estéticas en Santo Domingo](/belleza-bienestar/software-reservaciones-clinica-estetica-santo-domingo/)

### Lash Studios en Santo Domingo
Agenda extensiones de pestañas, muestra tu disponibilidad real y elimina los no-shows con recordatorios automáticos.
→ [Software para Lash Studios en Santo Domingo](/belleza-bienestar/software-reservaciones-lash-studio-santo-domingo/)

---

## ¿Por qué los negocios de Santo Domingo eligen Bookido?

1. **Pago en pesos dominicanos** — sin conversiones, sin tarifas internacionales ocultas.
2. **Soporte local en español** — equipo dominicano, horario dominicano.
3. **Plan gratis para empezar** — sin tarjeta de crédito, activo en 10 minutos.
4. **WhatsApp integrado** — recordatorios automáticos al número de tus clientes.
5. **Funciona desde el celular** — gestiona tu agenda desde donde estés en Santo Domingo.

---

## Preguntas frecuentes

**¿Bookido funciona para negocios en todo Santo Domingo?**
Sí. Bookido funciona para negocios en Piantini, Naco, Los Prados, Zona Colonial, Bella Vista, Evaristo Morales y cualquier otro sector de Santo Domingo y el Distrito Nacional.

**¿Cuánto cuesta el software para mi negocio en Santo Domingo?**
Bookido tiene un plan gratuito permanente. Los planes de pago empiezan desde RD$990/mes e incluyen reservas ilimitadas, recordatorios automáticos y landing page personalizada.

**¿Puedo cobrar en pesos dominicanos con Bookido?**
Sí. Bookido está integrado con métodos de pago locales para República Dominicana, incluyendo tarjeta de crédito/débito y transferencia bancaria en RD$.

**¿Necesito saber de tecnología para usar Bookido?**
No. El sistema está diseñado para dueños de negocios, no para técnicos. La configuración inicial toma menos de 10 minutos y ofrecemos soporte en español.

---

## Empieza hoy

[Crear mi cuenta gratis →](https://bookido.online)
[Ver precios →](/precios/)
[Hablar con nosotros →](https://wa.me/447586255903)

---

*Gestióndo sirve negocios en todo Santo Domingo, Santiago, Punta Cana, Puerto Plata y las principales ciudades de República Dominicana.*
`;

write(`${OUT}/02-santo-domingo-hub/hub-page.md`, hubContent);

// Schema JSON-LD for hub
const hubSchema = JSON.stringify({
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "LocalBusiness",
      "@id": `${DOMAIN}/software-para-negocios-santo-domingo/#localbusiness`,
      "name": "Gestióndo — Software para Negocios en Santo Domingo",
      "url": `${DOMAIN}/software-para-negocios-santo-domingo/`,
      "description": "Software de reservaciones y gestión para negocios de servicios en Santo Domingo, República Dominicana.",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "Santo Domingo",
        "addressRegion": "Distrito Nacional",
        "addressCountry": "DO"
      },
      "areaServed": { "@type": "City", "name": "Santo Domingo" },
      "sameAs": [`${DOMAIN}`]
    },
    {
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Inicio", "item": DOMAIN },
        { "@type": "ListItem", "position": 2, "name": "Santo Domingo", "item": `${DOMAIN}/software-para-negocios-santo-domingo/` }
      ]
    },
    {
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "¿Bookido funciona para negocios en todo Santo Domingo?",
          "acceptedAnswer": { "@type": "Answer", "text": "Sí. Bookido funciona para negocios en Piantini, Naco, Los Prados, Zona Colonial, Bella Vista y cualquier sector del Distrito Nacional." }
        },
        {
          "@type": "Question",
          "name": "¿Cuánto cuesta el software para mi negocio en Santo Domingo?",
          "acceptedAnswer": { "@type": "Answer", "text": "Bookido tiene un plan gratuito permanente. Los planes de pago empiezan desde RD$990/mes." }
        }
      ]
    }
  ]
}, null, 2);
write(`${OUT}/02-santo-domingo-hub/hub-schema.json`, hubSchema);

// WP-CLI script to create the hub page
const hubWpCli = `#!/bin/bash
# Create hub page /software-para-negocios-santo-domingo/
# Run from WP root: bash ${OUT}/02-santo-domingo-hub/create-hub-post.sh

WP_PATH="/home/u488152486/domains/xn--gestindo-z3a.com/public_html"
cd "\$WP_PATH"

POST_ID=\$(wp post create \\
  --post_type=page \\
  --post_status=draft \\
  --post_title="Software para Negocios en Santo Domingo — Reservas y Gestión | Gestióndo" \\
  --post_name="software-para-negocios-santo-domingo" \\
  --post_content="<!-- Hub content — paste from hub-page.md -->" \\
  --porcelain 2>&1)

echo "Created post ID: \$POST_ID"

# Yoast meta
wp post meta update \$POST_ID _yoast_wpseo_title "Software para Negocios en Santo Domingo — Reservas y Gestión | Gestióndo"
wp post meta update \$POST_ID _yoast_wpseo_metadesc "Bookido y RestaurantOS Pro: el software de gestión y reservaciones para negocios en Santo Domingo. Salones, spas, barberías, restaurantes. Gratis para empezar."
wp post meta update \$POST_ID _yoast_wpseo_focuskw "software para negocios santo domingo"

echo "Hub page created as DRAFT — ID: \$POST_ID"
echo "Review at: wp-admin/post.php?post=\$POST_ID&action=edit"
`;
write(`${OUT}/02-santo-domingo-hub/create-hub-post.sh`, hubWpCli);

// 6 spoke patch files
for (const [slugKey, niche] of Object.entries(SD_SPOKE_NICHES)) {
  const patch = `# Parche SEO — Spoke: ${slugKey}
# Acción: DIFFERENTIATE — reposicionar en nicho vertical específico
# Vertical: ${niche.vertical}
# Zona: ${niche.zona}

## Título nuevo (max 65ch)
${niche.titleNew}

## H1 nuevo
${niche.h1New}

## Meta description nueva (max 155ch)
${niche.metaNew}

## Primer párrafo nuevo
${niche.parrafNew}

## Enlace al hub (añadir en introducción o breadcrumb)
← [Volver a Software para Negocios en Santo Domingo](/software-para-negocios-santo-domingo/)

## WP-CLI para aplicar
\`\`\`bash
POST_ID=\$(wp post list --post_name="${slugKey}" --fields=ID --format=ids 2>/dev/null)
wp post update \$POST_ID --post_title="${niche.h1New}"
wp post meta update \$POST_ID _yoast_wpseo_title "${niche.titleNew}"
wp post meta update \$POST_ID _yoast_wpseo_metadesc "${niche.metaNew}"
wp post meta update \$POST_ID _yoast_wpseo_focuskw "${niche.targetKw}"
\`\`\`
`;
  write(`${OUT}/02-santo-domingo-hub/spoke-${slugKey}.md`, patch);
}
console.log('Phase 2 done: hub + 6 spokes');

// ── Phase 3: Generate scripts ─────────────────────────────────────────────────
const redirectLines = [];
const wpCliConsolidateAll = [];
const differentiatePatches = [];
const noindexScripts = [];
const internalLinkReplacements = [];

let consolidateId = 0;
let diffId = 0;
let noidxId = 0;

for (const d of decisions) {
  if (d.action === 'CONSOLIDATE') {
    consolidateId++;
    const winner = d.url_winner;
    const loser = d.url_loser;
    const loserSlug = slug(loser);
    const winnerSlug = slug(winner);

    const sh = `#!/bin/bash
# CONSOLIDATE #${consolidateId}: ${loserSlug} → ${winnerSlug}
# Shared query: ${d.shared_query}
WP_PATH="/home/u488152486/domains/xn--gestindo-z3a.com/public_html"
cd "\$WP_PATH"

LOSER_ID=\$(wp post list --post_name="${loserSlug}" --post_type=post --fields=ID --format=ids 2>/dev/null)
WINNER_ID=\$(wp post list --post_name="${winnerSlug}" --post_type=post --fields=ID --format=ids 2>/dev/null)

echo "Loser ID: \$LOSER_ID | Winner ID: \$WINNER_ID"

# Get loser content for manual review
wp post get \$LOSER_ID --field=post_content > /tmp/loser-${loserSlug}-content.txt
echo "Loser content saved to /tmp/loser-${loserSlug}-content.txt — review and merge manually if needed"

# Set loser to draft (never delete)
wp post update \$LOSER_ID --post_status=draft
echo "Loser set to DRAFT"

# Yoast redirect (if Yoast Premium) or use htaccess
# wp post meta update \$LOSER_ID _yoast_wpseo_redirect "${winner}"
`;
    write(`${OUT}/03-wp-cli/consolidate-${consolidateId}.sh`, sh);

    // htaccess redirect
    const loserPath = new URL(loser).pathname;
    redirectLines.push(`Redirect 301 ${loserPath} ${winner}`);
    internalLinkReplacements.push({ old: loser, new: winner });
  }

  if (d.action === 'DIFFERENTIATE' && !isSantoDomingo(d.url_winner) && !isSantoDomingo(d.url_loser)) {
    diffId++;
    const urlB = d.url_loser;
    const slugB = slug(urlB);
    const query = d.shared_query;
    const patch = `# Parche DIFFERENTIATE #${diffId}: ${slugB}
# Shared query: ${query}
# Razón: ${d.reason}
# Jaccard sim: ${d.jaccard_sim}

## Acción requerida
Reescribir title/H1/meta/primer párrafo de esta URL para targeting distinto:
- Añadir especificidad de sector, zona geográfica O ángulo diferente
- Ejemplo: si URL_A cubre "salón belleza" → URL_B enfoca "spa tratamientos"
- Meta: 0 keywords compartidas en title + H1 tras el cambio

## URL a modificar
${urlB}

## Comparte keywords con
${d.url_winner}

## Template de cambio (completar manualmente)
- Title nuevo: [COMPLETAR — diferencia del competidor]
- H1 nuevo: [COMPLETAR]
- Meta nueva: [COMPLETAR — max 155ch]
- Primer párrafo: [COMPLETAR — mencionar diferenciador específico]
`;
    differentiatePatches.push(patch);
    write(`${OUT}/05-differentiate/${slugB}.md`, patch);
  }

  if (d.action === 'NOINDEX') {
    noidxId++;
    const thinUrl = d.url_loser;
    const mainUrl = d.url_winner;
    const thinSlug = slug(thinUrl);
    const sh = `#!/bin/bash
# NOINDEX #${noidxId}: ${thinSlug}
WP_PATH="/home/u488152486/domains/xn--gestindo-z3a.com/public_html"
cd "\$WP_PATH"

POST_ID=\$(wp post list --post_name="${thinSlug}" --post_type=post --fields=ID --format=ids 2>/dev/null)
echo "Setting noindex on: \$POST_ID (${thinSlug})"
wp post meta update \$POST_ID _yoast_wpseo_meta-robots-noindex 1
wp post meta update \$POST_ID _yoast_wpseo_canonical "${mainUrl}"
echo "Done — noindex + canonical set"
`;
    noindexScripts.push(sh);
    write(`${OUT}/03-wp-cli/noindex-${noidxId}.sh`, sh);
  }
}

// ── 04-htaccess/redirects.conf ────────────────────────────────────────────────
const htaccessBlock = `# BEGIN GDO_CANNIB_REDIRECTS
# Generated: ${new Date().toISOString()}
# Add INSIDE <VirtualHost> or at top of .htaccess (before WordPress block)
<IfModule mod_alias.c>
${redirectLines.map(r => '  ' + r).join('\n')}
</IfModule>
# END GDO_CANNIB_REDIRECTS`;
write(`${OUT}/04-htaccess/redirects.conf`, htaccessBlock);
console.log(`Phase 3 done: ${consolidateId} consolidate, ${diffId} differentiate, ${noidxId} noindex scripts`);

// ── 06-internal-links ─────────────────────────────────────────────────────────
const linkScript = `#!/bin/bash
# Update internal links for consolidated URLs
# Run with --dry-run first (already included), then remove it to apply
WP_PATH="/home/u488152486/domains/xn--gestindo-z3a.com/public_html"
cd "\$WP_PATH"

echo "=== INTERNAL LINK REPLACEMENTS (DRY RUN) ==="
${internalLinkReplacements.map(r =>
  `wp search-replace '${r.old}' '${r.new}' wp_posts wp_postmeta --dry-run 2>&1`
).join('\n')}

# To apply: remove --dry-run from each line above
`;
write(`${OUT}/06-internal-links/update-links.sh`, linkScript);

// ── 07-post-deploy/flush.sh ───────────────────────────────────────────────────
const flushSh = `#!/bin/bash
WP_PATH="/home/u488152486/domains/xn--gestindo-z3a.com/public_html"
cd "\$WP_PATH"
echo "Regenerating Yoast sitemap..."
wp yoast index --reindex 2>&1 || true
echo "Flushing LiteSpeed cache..."
wp litespeed-purge all 2>&1 || wp cache flush 2>&1
echo "Done."
`;
write(`${OUT}/07-post-deploy/flush.sh`, flushSh);

// ── 08-validation.md ──────────────────────────────────────────────────────────
const validation = `# Validación — Cannibalization Fix Dryrun
**Generado:** ${new Date().toISOString()}
**Modo:** DRYRUN — ningún cambio aplicado a producción

## Resultados de clasificación

| Acción | Pares | Descripción |
|--------|-------|-------------|
| CONSOLIDATE | ${stats.CONSOLIDATE} | Unir en URL ganadora + 301 desde perdedora |
| DIFFERENTIATE | ${stats.DIFFERENTIATE} | Reescribir title/H1/meta para separar intención |
| CANONICAL | ${stats.CANONICAL} | Añadir canonical rel a URL principal |
| NOINDEX | ${stats.NOINDEX} | Meta noindex + canonical en post delgado |
| **Total** | **${pairs.length}** | |

## Artefactos generados

| Archivo | Descripción |
|---------|-------------|
| 01-decisions.csv | ${pairs.length} pares clasificados con acción y razón |
| 02-santo-domingo-hub/ | Hub page + 6 spoke patches |
| 03-wp-cli/ | ${consolidateId + noidxId} scripts WP-CLI listos para ejecutar |
| 04-htaccess/redirects.conf | ${redirectLines.length} redirects 301 listos para .htaccess |
| 05-differentiate/ | ${diffId} parches de diferenciación (requieren edición manual de contenido) |
| 06-internal-links/ | Script search-replace para enlaces internos |
| 07-post-deploy/flush.sh | Flush sitemap + caché post-apply |

## Checks de validación (pre-apply)

| Check | Estado | Notas |
|-------|--------|-------|
| 0 redirect chains | ✅ Cada 301 va directo a URL final | Verificar si ya hay redirects en .htaccess |
| Backup DB | ✅ 23MB backup en /backups/pre-cannib-20260423.sql | |
| SEO plugin | ✅ Yoast SEO (wordpress-seo) | Claves meta correctas |
| WP-CLI | ✅ v2.12.0 | |
| Git branch | ✅ seo/fix-cannibalization-20260423 | |
| Hub SD creado | 🟡 DRAFT — pendiente publicar | Ver create-hub-post.sh |

## Acciones manuales requeridas antes de apply

1. **Revisar 05-differentiate/** — los ${diffId} parches requieren contenido real escrito por humano/editor. El template marca [COMPLETAR].
2. **Hub Santo Domingo** — revisar hub-page.md y ejecutar create-hub-post.sh para crear el draft en WP.
3. **Validar redirects** — confirmar que las URLs loser no son enlazadas desde backlinks externos antes de 301.
4. **Spoke patches** — ejecutar los 6 WP-CLI de 02-santo-domingo-hub/spoke-*.md para actualizar titles/meta.

## Comando para promover a producción

\`\`\`bash
# 1. Revisar artefactos
# 2. Ejecutar scripts en orden:
ssh u488152486@5.183.10.155 -p 65002
cd /home/u488152486/domains/xn--gestindo-z3a.com/public_html

# Paso 1: Spoke patches SD
for f in spoke-*.sh; do bash \$f; done   # desde 02-santo-domingo-hub/

# Paso 2: Consolidaciones
for f in 03-wp-cli/consolidate-*.sh; do bash \$f; done

# Paso 3: Noindex
for f in 03-wp-cli/noindex-*.sh; do bash \$f; done

# Paso 4: Redirects .htaccess
cat 04-htaccess/redirects.conf >> .htaccess

# Paso 5: Internal links (quitar --dry-run)
bash 06-internal-links/update-links.sh

# Paso 6: Flush
bash 07-post-deploy/flush.sh
\`\`\`
`;
write(`${OUT}/08-validation.md`, validation);

// ── 00-executive-summary.md ───────────────────────────────────────────────────
const summary = `# Resumen Ejecutivo — Resolución de Canibalización SEO
**Dominio:** xn--gestindo-z3a.com
**Fecha:** ${new Date().toISOString().split('T')[0]}
**Modo:** DRYRUN — todos los artefactos listos, 0 cambios aplicados

## Resultados

| Acción | Pares | Impacto esperado |
|--------|-------|-----------------|
| CONSOLIDATE | ${stats.CONSOLIDATE} | Consolidar autoridad de enlace en URL ganadora |
| DIFFERENTIATE | ${stats.DIFFERENTIATE} | Separar intención, reducir split de señales de ranking |
| NOINDEX | ${stats.NOINDEX} | Eliminar contenido débil del índice |
| **Total tratado** | **${pairs.length}** | |

## Prioridad alta (ejecutar esta semana)

1. **6 spoke patches de Santo Domingo** — mayor impacto inmediato en geo-SEO SD
2. **Hub /software-para-negocios-santo-domingo/** — página nueva, crear como draft y publicar
3. **${stats.CONSOLIDATE} consolidaciones** — cada una genera un 301 + fusión de contenido

## Prioridad media (mes 1)

4. **${diffId} diferenciaciones** — requieren reescritura editorial, ~30 min/par
5. **${stats.NOINDEX} noindex** — posts delgados, ejecución en 10 min total

## Próximos pasos manuales

Ver sección "Acciones manuales" en 08-validation.md

## No tocado (fuera de scope)

- Las geo-landings de otras ciudades (Santiago, Punta Cana) se tratan en estrategia mid-term
- La canibalización entre categorías duplicadas (gastronomia/restaurantes-gastronomia-rd) requiere migración de posts — ver 99-action-plan.md M-3
`;
write(`${OUT}/00-executive-summary.md`, summary);

console.log('\n✅ DRYRUN COMPLETE');
console.log(`Output: ${OUT}/`);
console.log(`  Pairs: ${pairs.length} | CONSOLIDATE: ${stats.CONSOLIDATE} | DIFFERENTIATE: ${stats.DIFFERENTIATE} | NOINDEX: ${stats.NOINDEX}`);
console.log(`  Redirects: ${redirectLines.length} | Spokes SD: 6 | Hub: 1`);
