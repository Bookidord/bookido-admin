#!/bin/bash
WP_PATH="/home/u488152486/domains/xn--gestindo-z3a.com/public_html"
cd "$WP_PATH"
echo "Regenerating Yoast sitemap..."
wp yoast index --reindex 2>&1 || true
echo "Flushing LiteSpeed cache..."
wp litespeed-purge all 2>&1 || wp cache flush 2>&1
echo "Done."
