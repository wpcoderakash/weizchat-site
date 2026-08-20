# WeizChat — marketing site (weiz.chat)

Marketing-only repo for the WeizChat SaaS (the product lives at
app.weiz.chat, separate codebase). Built to convert visitors and to pass
Meta Business Verification + Tech Provider review — the compliance rules in
the build brief's SECTION 0 override everything else.

- Next.js App Router + TypeScript strict, Tailwind v4 token layer
- next-intl: `he` (default, RTL) · `en` · `bn`, routes `/[locale]/...`
- Brand tokens are IDENTICAL to the product's palette (accent #6D4AFF)
- `src/config/site.ts` — site truth incl. `metaPartnerStatus: 'none'`
  (no Meta badge may render until flipped after approval)
- `src/content/testimonials.ts` — empty until written-consent entries exist

## Run

    pnpm install
    pnpm dev        # http://localhost:3000  (he at /, en at /en, bn at /bn)

## Outstanding placeholders (must be replaced before launch)

`__LEGAL_NAME__ __COMPANY_ID__ __ADDRESS__ __PHONE__` in `src/config/site.ts`,
and `NEXT_PUBLIC_META_DOMAIN_VERIFICATION` in the environment.
