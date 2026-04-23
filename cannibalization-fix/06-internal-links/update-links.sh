#!/bin/bash
# Update internal links for consolidated URLs
# Run with --dry-run first (already included), then remove it to apply
WP_PATH="/home/u488152486/domains/xn--gestindo-z3a.com/public_html"
cd "$WP_PATH"

echo "=== INTERNAL LINK REPLACEMENTS (DRY RUN) ==="
wp search-replace 'https://xn--gestindo-z3a.com/belleza-bienestar/extension-pestanas-salon-rd/' 'https://xn--gestindo-z3a.com/belleza-bienestar/lash-lifting-salon-rd/' wp_posts wp_postmeta --dry-run 2>&1
wp search-replace 'https://xn--gestindo-z3a.com/finanzas-legalidad/propina-legal-10-rd/' 'https://xn--gestindo-z3a.com/gastronomia/propina-legal-restaurantes-rd/' wp_posts wp_postmeta --dry-run 2>&1

# To apply: remove --dry-run from each line above
