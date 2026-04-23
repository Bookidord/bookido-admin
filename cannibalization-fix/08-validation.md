# Validación — Cannibalization Fix Dryrun
**Generado:** 2026-04-23T20:38:53.934Z
**Modo:** DRYRUN — ningún cambio aplicado a producción

## Resultados de clasificación

| Acción | Pares | Descripción |
|--------|-------|-------------|
| CONSOLIDATE | 2 | Unir en URL ganadora + 301 desde perdedora |
| DIFFERENTIATE | 73 | Reescribir title/H1/meta para separar intención |
| CANONICAL | 0 | Añadir canonical rel a URL principal |
| NOINDEX | 0 | Meta noindex + canonical en post delgado |
| **Total** | **75** | |

## Artefactos generados

| Archivo | Descripción |
|---------|-------------|
| 01-decisions.csv | 75 pares clasificados con acción y razón |
| 02-santo-domingo-hub/ | Hub page + 6 spoke patches |
| 03-wp-cli/ | 2 scripts WP-CLI listos para ejecutar |
| 04-htaccess/redirects.conf | 2 redirects 301 listos para .htaccess |
| 05-differentiate/ | 38 parches de diferenciación (requieren edición manual de contenido) |
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

1. **Revisar 05-differentiate/** — los 38 parches requieren contenido real escrito por humano/editor. El template marca [COMPLETAR].
2. **Hub Santo Domingo** — revisar hub-page.md y ejecutar create-hub-post.sh para crear el draft en WP.
3. **Validar redirects** — confirmar que las URLs loser no son enlazadas desde backlinks externos antes de 301.
4. **Spoke patches** — ejecutar los 6 WP-CLI de 02-santo-domingo-hub/spoke-*.md para actualizar titles/meta.

## Comando para promover a producción

```bash
# 1. Revisar artefactos
# 2. Ejecutar scripts en orden:
ssh u488152486@5.183.10.155 -p 65002
cd /home/u488152486/domains/xn--gestindo-z3a.com/public_html

# Paso 1: Spoke patches SD
for f in spoke-*.sh; do bash $f; done   # desde 02-santo-domingo-hub/

# Paso 2: Consolidaciones
for f in 03-wp-cli/consolidate-*.sh; do bash $f; done

# Paso 3: Noindex
for f in 03-wp-cli/noindex-*.sh; do bash $f; done

# Paso 4: Redirects .htaccess
cat 04-htaccess/redirects.conf >> .htaccess

# Paso 5: Internal links (quitar --dry-run)
bash 06-internal-links/update-links.sh

# Paso 6: Flush
bash 07-post-deploy/flush.sh
```
