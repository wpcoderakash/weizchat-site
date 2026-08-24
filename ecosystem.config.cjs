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
        HOSTNAME: '127.0.0.1',
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
