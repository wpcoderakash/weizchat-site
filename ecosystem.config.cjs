/**
 * PM2 process definition for the marketing site.
 *
 * `cwd` matters more than usual here: the server reads its built-in content
 * and its writable store from paths resolved against the working directory
 * unless WEIZ_* overrides say otherwise. Start it anywhere else and the site
 * silently serves built-in copy as though nothing had been published.
 *
 * Secrets are NOT in this file. It reads them from the env file named below,
 * which lives outside the release and is never in git.
 */
module.exports = {
  apps: [
    {
      name: 'weizchat-site',
      cwd: '/home/weiz-chat/htdocs/www.weiz.chat/current',
      script: 'server.js',
      // One instance: the CMS store is a directory of files with
      // last-writer-wins semantics (ADR-0032). Clustering would need shared
      // storage or a database first.
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        /*
         * 0.0.0.0, deliberately, and NOT 127.0.0.1.
         *
         * Binding the loopback address looks safer but breaks the site: Next
         * then builds middleware rewrite URLs on a different origin than the
         * request, downgrades the rewrite to a redirect, and every page
         * answers 307 to itself — an infinite loop. Verified on this server.
         * ('localhost' is worse still: it binds IPv6 only, so nginx cannot
         * reach it at all.)
         *
         * The app is not exposed by this: the host firewall drops external
         * traffic to 3000, so only nginx on the box reaches it.
         */
        HOSTNAME: '0.0.0.0',
        WEIZ_CONTENT_STORE: '/home/weiz-chat/weizchat-data/content-store',
      },
      // CMS_ADMIN_USERNAME / CMS_ADMIN_PASSWORD / NEXT_PUBLIC_META_DOMAIN_VERIFICATION
      // come from here — see DEPLOY.md.
      env_file: '/home/weiz-chat/weizchat.env',
      out_file: '/home/weiz-chat/logs/weizchat-site.out.log',
      error_file: '/home/weiz-chat/logs/weizchat-site.err.log',
      time: true,
    },
  ],
};
