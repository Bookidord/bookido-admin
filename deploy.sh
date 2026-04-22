#!/bin/bash
# deploy.sh — bookido-admin → VPS
set -e

echo "→ Building..."
npm run build

echo "→ Packing .next..."
tar -czf /tmp/bookido-next.tar.gz .next/

echo "→ Uploading..."
scp /tmp/bookido-next.tar.gz package.json package-lock.json root@2.24.200.101:/tmp/

echo "→ Deploying on VPS..."
ssh root@2.24.200.101 "
  set -e
  cd /root/bookido-admin
  rm -rf .next
  tar -xzf /tmp/bookido-next.tar.gz
  cp /tmp/package.json /tmp/package-lock.json .
  npm ci --omit=dev --silent
  pm2 restart bookido-admin
  sleep 3
  STATUS=$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:3004/admin)
  [[ "$STATUS" == "307" || "$STATUS" == "200" ]] && echo "✓ Admin OK ($STATUS)" || echo "✗ Admin FAILED ($STATUS)"
"

echo "→ Done."
