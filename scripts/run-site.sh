#!/usr/bin/env bash
# Load the environment ourselves, then exec the server.
#
# PM2's `env_file` is not applied by this version: a plain `pm2 reload` starts
# the process with whatever environment the caller happened to have, which for
# this app means no CMS credentials — the admin then refuses every login while
# `pm2 list` still says "online". Sourcing here makes that impossible.
set -euo pipefail
export NVM_DIR="$HOME/.nvm"
# shellcheck disable=SC1091
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh" >/dev/null 2>&1 || true
set -a
# shellcheck disable=SC1091
. "$HOME/weizchat.env"
set +a
cd "$HOME/htdocs/www.weiz.chat/current"
exec node server.js
