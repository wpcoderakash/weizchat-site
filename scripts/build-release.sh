#!/usr/bin/env bash
#
# Assemble a release of the marketing site into ./release/.
#
# The result is self-contained: Node is the only thing the server needs — no
# install, no build, no toolchain on the host.
#
# Two things this script exists to get right:
#   1. `messages/` and `src/content/` are read from disk at runtime, so they
#      must be in the release. Next's standalone output already carries them;
#      this verifies it rather than assuming.
#   2. `content-store/` must NOT be in the release. It is the live CMS data on
#      the server — documents, users, leads, uploaded media. Shipping the local
#      one would push development accounts to production and, worse, teach the
#      deploy to overwrite published content.
#
set -euo pipefail

cd "$(dirname "$0")/.."
ROOT="$(pwd)"
OUT="$ROOT/release"

# Before building, not after: Next's file tracing walks the project, and a
# release left in place gets copied into the next one (release/release/…).
echo "==> Clearing any previous release"
rm -rf "$OUT"

echo "==> Building"
pnpm build

echo "==> Assembling $OUT"
mkdir -p "$OUT"

# The standalone server plus its traced dependencies. rsync, not cp: pnpm's
# node_modules is a farm of symlinks and cp -R flattens or breaks them.
rsync -a "$ROOT/.next/standalone/" "$OUT/"

# Next's tracer under-collects under pnpm in two ways: it copies a package's
# files selectively (only @swc/helpers' cjs/ build, while the server loads the
# esm/ one), and it drops the symlinks pnpm places inside each package's own
# node_modules. Both surface as "Cannot find module" at boot, not at build.
#
# So: complete every package the tracer chose, from the source tree. This
# keeps the release limited to the traced set — a fraction of the workspace —
# while making each package whole.
echo "==> Completing traced packages from the source tree"
if [ -d "$OUT/node_modules/.pnpm" ]; then
  for dir in "$OUT/node_modules/.pnpm"/*/; do
    name="$(basename "$dir")"
    [ -d "$ROOT/node_modules/.pnpm/$name" ] || continue
    rsync -a "$ROOT/node_modules/.pnpm/$name/" "$dir"
  done
fi
# ...and restore the top-level links (node_modules/<pkg> -> .pnpm/...).
node "$ROOT/scripts/repair-standalone-links.mjs" "$ROOT/node_modules" "$OUT/node_modules"

# Static assets are deliberately not traced into standalone; copy them.
mkdir -p "$OUT/.next/static"
rsync -a "$ROOT/.next/static/" "$OUT/.next/static/"
mkdir -p "$OUT/public"
rsync -a "$ROOT/public/" "$OUT/public/"

# The live store belongs to the server, not to a release.
rm -rf "$OUT/content-store"

# Nothing local, nothing secret.
rm -f "$OUT/.env" "$OUT/.env.local" "$OUT/tsconfig.tsbuildinfo"

echo "==> Verifying the release has what it reads at runtime"
missing=0
for required in server.js messages/en.json messages/he.json src/content/legal src/content/articles public .next/static; do
  if [ ! -e "$OUT/$required" ]; then
    echo "FAIL  missing from the release: $required"
    missing=1
  fi
done
if [ -e "$OUT/content-store" ]; then
  echo "FAIL  content-store is in the release; it would overwrite live CMS data"
  missing=1
fi
if [ -e "$OUT/.env.local" ]; then
  echo "FAIL  .env.local is in the release"
  missing=1
fi
[ "$missing" -eq 0 ] || { echo "Release is not safe to deploy."; exit 1; }

echo "==> Booting the release once, to prove it actually runs"
BOOT_PORT="${RELEASE_SMOKE_PORT:-4399}"
BOOT_STORE="$(mktemp -d)"
(
  cd "$OUT"
  NODE_ENV=production PORT="$BOOT_PORT" \
    WEIZ_CONTENT_STORE="$BOOT_STORE/content-store" \
    CMS_ADMIN_USERNAME='smoke@example.test' CMS_ADMIN_PASSWORD='smoke-test-password' \
    node server.js > "$BOOT_STORE/boot.log" 2>&1 &
  echo $! > "$BOOT_STORE/pid"
)
for _ in $(seq 1 40); do
  sleep 1
  if /usr/bin/curl -fsS -o /dev/null "http://127.0.0.1:$BOOT_PORT/"; then break; fi
done
smoke_failed=0
# -L: /heb/ legitimately redirects to /heb (trailing-slash normalisation),
# so what matters is where the request lands, not the first status.
for route in / /heb /pricing /privacy-policy /heb/privacy-policy /blog /tools/qr-code-generator /admin/login; do
  code="$(/usr/bin/curl -sL -o /dev/null -w '%{http_code}' --max-time 20 "http://127.0.0.1:$BOOT_PORT$route" || true)"
  printf '    %-18s %s\n' "$route" "$code"
  [ "$code" = "200" ] || smoke_failed=1
done
kill "$(cat "$BOOT_STORE/pid")" 2>/dev/null || true
if [ "$smoke_failed" -ne 0 ]; then
  echo "FAIL  the release does not serve every route. Log:"
  tail -20 "$BOOT_STORE/boot.log"
  rm -rf "$BOOT_STORE"
  exit 1
fi
rm -rf "$BOOT_STORE"

echo "==> Release ready: $OUT ($(du -sh "$OUT" | cut -f1))"
echo "    Start it with: NODE_ENV=production node server.js   (cwd = the release)"
