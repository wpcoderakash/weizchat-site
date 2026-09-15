# Deploying the marketing site to www.weiz.chat

The site is a **Next.js server application**, not a folder of static files. It
has to be a running Node process because the CMS, its admin, the preview mode
and the lead intake are all server routes. A static export would drop all of
them.

CloudPanel's job here is the front door: TLS, and an Nginx reverse proxy that
forwards `www.weiz.chat` to the Node process on `127.0.0.1:3000`.

---

## What must be true before the first deploy

| | Why |
|---|---|
| The CloudPanel site is of type **Node.js** (or a reverse-proxy vhost) | A PHP or Static site serves files from disk and will never reach the app |
| **Node 20+** installed on the server | v22.23.2, installed per-user via **nvm** — deploy scripts source `~/.nvm/nvm.sh` because a non-interactive ssh never reads `.bashrc` |
| **PM2** installed (`npm i -g pm2`) | Keeps the site up and restarts it on reboot |
| An **SSH key** added to the site user | `scripts/deploy.sh` uses your key; it never handles a password |
| DNS for `weiz.chat` and `www.weiz.chat` pointing at the server | Otherwise Let's Encrypt cannot issue a certificate |

---

## Directory layout on the server

```
/home/weiz-chat/
├── weizchat.env                        secrets (chmod 600, never in git)
├── weizchat-data/
│   └── content-store/                  THE CMS DATABASE — pages, users,
│                                       leads, uploaded media. Survives every
│                                       deploy. Back this up.
├── logs/
└── htdocs/www.weiz.chat/
    ├── current -> releases/2026...     symlink the app runs from
    └── releases/
        ├── 20260824-120000/            a release
        └── …                           the last five are kept
```

The store lives **outside** the release on purpose. Publishing writes there, so
if it lived inside a release, the next deploy would silently erase everything
the owner had published.

---

## First-time setup

**1 — Create the paths and the env file**

```bash
ssh weiz-chat@YOUR_SERVER
mkdir -p ~/weizchat-data/content-store ~/logs ~/htdocs/www.weiz.chat/releases
```

Copy `.env.production.example` to `~/weizchat.env`, fill in real values, then:

```bash
chmod 600 ~/weizchat.env
```

`CMS_ADMIN_PASSWORD` must be a new, long password — not the development one.
The admin refuses to start if the variables are missing, and the preflight
refuses a deploy that still carries the development password.

**2 — Point CloudPanel at the app**

In CloudPanel, the site is a **Node.js** site and its vhost proxies to
**port 3002** on this host (3000 and 3001 are taken by other applications).
That port is what `ecosystem.config.cjs` sets; if the vhost is ever changed,
change it there too.
CloudPanel then writes the Nginx reverse proxy for you. Nothing needs to be
placed in the site's document root — the proxy bypasses it.

**3 — Issue the certificate**

CloudPanel → the site → **SSL/TLS** → *Actions* → **New Let's Encrypt
Certificate**, covering `weiz.chat` and `www.weiz.chat`.

**4 — Deploy, then start under PM2**

From your machine:

```bash
cp .deploy.env.example .deploy.env     # fill in host / user / path
./scripts/build-release.sh             # builds, verifies, boots it once locally
./scripts/deploy.sh                    # uploads, preflights, switches, restarts
```

Then, once, on the server:

```bash
pm2 start ~/htdocs/www.weiz.chat/current/ecosystem.config.cjs
pm2 save
pm2 startup            # run the command it prints, so the site survives reboot
```

---

## Being told when someone uses the contact form

A contact form message is stored as a lead for `/admin/leads`. Until these
five are set it is stored and **nobody is emailed** — which is how the form
behaved until 2026-09-15, and how it behaves again if any one of them is
missing. The deploy preflight refuses a half-filled set and notes an empty one.

```bash
# in ~/weizchat.env, then: pm2 restart weizchat-site
LEADS_NOTIFY_TO=you@weiz.co.il         # who gets told
LEADS_MAIL_FROM=chat@weiz.co.il        # the mailbox it is sent from
LEADS_MS_TENANT_ID=...                 # the same three values the app already
LEADS_MS_CLIENT_ID=...                 # has in ~/weizapp.env for its sign-in
LEADS_MS_CLIENT_SECRET=...             # codes — Azure app "Weiz.chat"
```

It sends through Microsoft 365 app-only (Graph, `Mail.Send`), the same way the
app sends its sign-in codes, and **not** through this host's own mail server:
`weiz.chat` publishes no SPF, DKIM or DMARC, so anything posted from here would
be junked by Microsoft 365. Reply on the notification goes to the person who
wrote in, not to the sending mailbox.

Nothing here can break the form. The lead is written to disk first and the
email is sent after the response, so a wrong credential or an unreachable
Microsoft costs one line in `~/logs/` and nothing else:

```bash
pm2 logs weizchat-site --lines 200 | grep '\[leads\]'
```

| The log says | It means |
| --- | --- |
| `stored and notified` | it worked |
| `not configured` | one or more of the five is missing |
| `auth_failed` | wrong tenant, client id, or an expired client secret |
| `permission_denied` | the Azure app has no admin-consented `Mail.Send` |
| `rejected` | Microsoft refused the message — check `LEADS_MAIL_FROM` is a real mailbox |
| `unreachable` | the server could not reach Microsoft; the lead is still saved |

---

## Every deploy after that

```bash
./scripts/build-release.sh && ./scripts/deploy.sh
```

`build-release.sh` refuses to produce a release that cannot serve its own
pages: it boots the bundle and requests the real routes before calling it
done. `deploy.sh` runs the preflight **on the server** before switching
`current`, so a missing environment variable stops the deploy rather than
taking the site down.

**Rolling back** is a symlink move — the script prints the exact command, and
the previous five releases are still there.

---

## Backups

Everything the owner creates lives in one directory:

```bash
tar czf weizchat-store-$(date -u +%F).tar.gz -C ~/weizchat-data content-store
```

Worth a nightly cron. Restoring is untarring it back.

---

## Before announcing the site publicly

These are content decisions, not deployment steps, but visitors see them:

- **The legal pages still contain placeholders** — `__LEGAL_NAME__`,
  `__COMPANY_ID__`, `__ADDRESS__`, `__PHONE__`, `__HOSTING_PROVIDER__`,
  `__HOSTING_REGION__`, `__PAYMENT_TERMS__`, `__LIABILITY_CAP__`,
  `__VENUE_CITY__`, `__ACCESSIBILITY_COORDINATOR_NAME__`. They render
  literally. The preflight lists every one on each run. Fill them in through
  the CMS (Pages → each legal page) once the real values are known; they are
  also what Meta's reviewers read.
- **A lawyer has not reviewed the legal text.** The pages carry a visible
  notice saying so, in code, until counsel signs off.
- **Pricing shows demo amounts** (₪0 / ₪299 / ₪799) until real ones are set in
  Pages → Pricing.

---

## If something is wrong

```bash
pm2 logs weizchat-site --lines 100          # what the app says
pm2 restart weizchat-site
cd ~/htdocs/www.weiz.chat/current && \
  set -a && . ~/weizchat.env && set +a && node scripts/preflight.mjs
```

The preflight names the problem directly — a missing directory, an unwritable
store, an absent credential — rather than leaving a 500 to interpret.
