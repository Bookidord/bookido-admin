#!/bin/bash
# Create hub page /software-para-negocios-santo-domingo/
# Run from WP root: bash C:/Users/debai/bookido/cannibalization-fix/02-santo-domingo-hub/create-hub-post.sh

WP_PATH="/home/u488152486/domains/xn--gestindo-z3a.com/public_html"
cd "$WP_PATH"

POST_ID=$(wp post create \
  --post_type=page \
  --post_status=draft \
  --post_title="Software para Negocios en Santo Domingo — Reservas y Gestión | Gestióndo" \
  --post_name="software-para-negocios-santo-domingo" \
  --post_content="<!-- Hub content — paste from hub-page.md -->" \
  --porcelain 2>&1)

echo "Created post ID: $POST_ID"

# Yoast meta
wp post meta update $POST_ID _yoast_wpseo_title "Software para Negocios en Santo Domingo — Reservas y Gestión | Gestióndo"
wp post meta update $POST_ID _yoast_wpseo_metadesc "Bookido y RestaurantOS Pro: el software de gestión y reservaciones para negocios en Santo Domingo. Salones, spas, barberías, restaurantes. Gratis para empezar."
wp post meta update $POST_ID _yoast_wpseo_focuskw "software para negocios santo domingo"

echo "Hub page created as DRAFT — ID: $POST_ID"
echo "Review at: wp-admin/post.php?post=$POST_ID&action=edit"
