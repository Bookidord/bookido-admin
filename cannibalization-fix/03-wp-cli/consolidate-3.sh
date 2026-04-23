#!/bin/bash
# CONSOLIDATE #3: sistema-pos-restaurantes-santiago → sistema-pos-restaurantes-republica-dominicana
# Shared query: sistema pos restaurantes restaurantos
WP_PATH="/home/u488152486/domains/xn--gestindo-z3a.com/public_html"
cd "$WP_PATH"

LOSER_ID=$(wp post list --post_name="sistema-pos-restaurantes-santiago" --post_type=post --fields=ID --format=ids 2>/dev/null)
WINNER_ID=$(wp post list --post_name="sistema-pos-restaurantes-republica-dominicana" --post_type=post --fields=ID --format=ids 2>/dev/null)

echo "Loser ID: $LOSER_ID | Winner ID: $WINNER_ID"

# Get loser content for manual review
wp post get $LOSER_ID --field=post_content > /tmp/loser-sistema-pos-restaurantes-santiago-content.txt
echo "Loser content saved to /tmp/loser-sistema-pos-restaurantes-santiago-content.txt — review and merge manually if needed"

# Set loser to draft (never delete)
wp post update $LOSER_ID --post_status=draft
echo "Loser set to DRAFT"

# Yoast redirect (if Yoast Premium) or use htaccess
# wp post meta update $LOSER_ID _yoast_wpseo_redirect "https://xn--gestindo-z3a.com/gastronomia/sistema-pos-restaurantes-republica-dominicana/"
