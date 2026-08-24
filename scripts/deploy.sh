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

# A dated release beside the live one, so a bad deploy is a symlink away from
# being undone rather than a rebuild away.
STAMP="$(date -u +%Y%m%d-%H%M%S)"
REMOTE_RELEASE="${DEPLOY_PATH}/releases/${STAMP}"

$SSH "$TARGET" "mkdir -p '${REMOTE_RELEASE}'"

echo "==> Uploading"
rsync -az --delete --info=progress2 -e "$SSH" "$ROOT/release/" "${TARGET}:${REMOTE_RELEASE}/"

echo "==> Preflight on the server"
# shellcheck disable=SC2029
$SSH "$TARGET" "cd '${REMOTE_RELEASE}' && set -a && . /home/${DEPLOY_USER}/weizchat.env && set +a && NODE_ENV=production node scripts/preflight.mjs"

echo "==> Switching 'current' to this release"
# shellcheck disable=SC2029
$SSH "$TARGET" "ln -sfn '${REMOTE_RELEASE}' '${DEPLOY_PATH}/current.new' && mv -Tf '${DEPLOY_PATH}/current.new' '${DEPLOY_PATH}/current'"

echo "==> Restarting"
# shellcheck disable=SC2029
$SSH "$TARGET" "pm2 reload weizchat-site --update-env || pm2 start '${DEPLOY_PATH}/current/ecosystem.config.cjs'"

echo "==> Keeping the last five releases"
# shellcheck disable=SC2029
$SSH "$TARGET" "cd '${DEPLOY_PATH}/releases' && ls -1t | tail -n +6 | xargs -r rm -rf"

echo "==> Done. Live at https://www.weiz.chat"
echo "    Roll back with:  ssh ${TARGET} \"ln -sfn ${DEPLOY_PATH}/releases/<older> ${DEPLOY_PATH}/current && pm2 reload weizchat-site\""
