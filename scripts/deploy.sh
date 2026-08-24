#!/usr/bin/env bash
#
# Ship the built release to the server and restart it.
#
# Reads its target from .deploy.env (gitignored) or the environment:
#
#   DEPLOY_HOST=1.2.3.4            # server address
#   DEPLOY_USER=weiz-chat          # CloudPanel site user
#   DEPLOY_PATH=/home/weiz-chat/htdocs/www.weiz.chat
#   DEPLOY_PORT=22                 # optional
#
# Authentication is your SSH key. This script never handles a password.
#
# What it does NOT touch: the content store. Live documents, users, leads and
# uploaded media live outside the release (WEIZ_CONTENT_STORE), so a deploy
# cannot erase what has been published. That separation is the whole point of
# the layout in DEPLOY.md.
#
set -euo pipefail
cd "$(dirname "$0")/.."
ROOT="$(pwd)"

[ -f .deploy.env ] && . ./.deploy.env

: "${DEPLOY_HOST:?set DEPLOY_HOST (server address) in .deploy.env}"
: "${DEPLOY_USER:?set DEPLOY_USER (site user) in .deploy.env}"
: "${DEPLOY_PATH:?set DEPLOY_PATH (site directory) in .deploy.env}"
DEPLOY_PORT="${DEPLOY_PORT:-22}"
SSH="ssh -p ${DEPLOY_PORT}"
TARGET="${DEPLOY_USER}@${DEPLOY_HOST}"

if [ ! -d "$ROOT/release" ]; then
  echo "No release/ directory. Run ./scripts/build-release.sh first." >&2
  exit 1
fi

echo "==> Deploying to ${TARGET}:${DEPLOY_PATH}"

# First-time setup, made idempotent so every deploy can assert it rather than
# depending on someone having read the runbook. Creating directories is safe;
# creating the secrets file is not, so that one is reported, never invented.
echo "==> Checking the server"
$SSH "$TARGET" bash -s <<'REMOTE'
set -euo pipefail
export NVM_DIR="$HOME/.nvm"
# shellcheck disable=SC1091
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh" >/dev/null 2>&1 || true
mkdir -p ~/weizchat-data/content-store ~/logs ~/htdocs/www.weiz.chat/releases
missing=0
command -v node >/dev/null || { echo "MISSING  node is not installed (need 20+)"; missing=1; }
command -v pm2  >/dev/null || { echo "MISSING  pm2 is not installed (npm i -g pm2)"; missing=1; }
if [ ! -f ~/weizchat.env ]; then
  echo "MISSING  ~/weizchat.env — create it from .env.production.example, then: chmod 600 ~/weizchat.env"
  missing=1
fi
if [ "$missing" -ne 0 ]; then
  echo "Server is not ready; nothing was changed."
  exit 1
fi
node_major="$(node -p 'process.versions.node.split(".")[0]')"
[ "$node_major" -ge 20 ] || { echo "MISSING  node ${node_major} is too old (need 20+)"; exit 1; }
echo "ready: node $(node -v), pm2 $(pm2 -v 2>/dev/null | tail -1)"
REMOTE

# A dated release beside the live one, so a bad deploy is a symlink away from
# being undone rather than a rebuild away.
STAMP="$(date -u +%Y%m%d-%H%M%S)"
REMOTE_RELEASE="${DEPLOY_PATH}/releases/${STAMP}"

$SSH "$TARGET" "mkdir -p '${REMOTE_RELEASE}'"

echo "==> Uploading"
# No --info=progress2: macOS ships rsync 2.6.9, which does not have it.
rsync -az --delete -e "$SSH" "$ROOT/release/" "${TARGET}:${REMOTE_RELEASE}/"

echo "==> Preflight on the server"
# shellcheck disable=SC2029
$SSH "$TARGET" "export NVM_DIR=\"\$HOME/.nvm\"; [ -s \"\$NVM_DIR/nvm.sh\" ] && . \"\$NVM_DIR/nvm.sh\" >/dev/null 2>&1; cd '${REMOTE_RELEASE}' && set -a && . \$HOME/weizchat.env && set +a && NODE_ENV=production node scripts/preflight.mjs"

echo "==> Switching 'current' to this release"
# shellcheck disable=SC2029
$SSH "$TARGET" "ln -sfn '${REMOTE_RELEASE}' '${DEPLOY_PATH}/current.new' && mv -Tf '${DEPLOY_PATH}/current.new' '${DEPLOY_PATH}/current'"

# startOrReload against the ecosystem FILE, not the process name: `pm2 reload
# <name>` keeps the environment the process already had, so a new variable in
# the config silently never arrives.
echo "==> Restarting"
# shellcheck disable=SC2029
$SSH "$TARGET" "export NVM_DIR=\"\$HOME/.nvm\"; [ -s \"\$NVM_DIR/nvm.sh\" ] && . \"\$NVM_DIR/nvm.sh\" >/dev/null 2>&1; set -a && . \$HOME/weizchat.env && set +a; pm2 startOrReload '${DEPLOY_PATH}/current/ecosystem.config.cjs' --update-env; pm2 save"

echo "==> Keeping the last five releases"
# shellcheck disable=SC2029
$SSH "$TARGET" "cd '${DEPLOY_PATH}/releases' && ls -1t | tail -n +6 | xargs -r rm -rf"

echo "==> Done. Live at https://www.weiz.chat"
echo "    Roll back with:  ssh ${TARGET} \"ln -sfn ${DEPLOY_PATH}/releases/<older> ${DEPLOY_PATH}/current && pm2 reload weizchat-site\""
