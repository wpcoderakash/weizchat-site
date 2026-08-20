import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { site } from '../../../config/site';
import { ContactForm } from '../../../components/contact/contact-form';
import { alternatesFor, openGraphLocale } from '../../../lib/seo';

/**
 * /contact (brief §0.5.1): the legal identity block Meta's reviewers look
 * for — legal name, company number, address, phone, support email — plus a
 * form that is honest about being a mailto. Also emits Organization JSON-LD
 * so the same facts are machine-readable.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'contact' });
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
    alternates: alternatesFor('/contact'),
    openGraph: {
      title: t('metaTitle'),
      description: t('metaDescription'),
      ...openGraphLocale(locale),
    },
  };
}

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'contact' });

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: site.legal.companyName,
    legalName: site.legal.companyName,
    url: site.url,
    email: site.supportEmail,
    telephone: site.legal.phone,
    address: { '@type': 'PostalAddress', streetAddress: site.legal.address },
    identifier: site.legal.companyId,
  };

  const rows: [string, React.ReactNode][] = [
    [t('details.legalName'), site.legal.companyName],
    [t('details.companyId'), site.legal.companyId],
    [t('details.address'), site.legal.address],
    [
      t('details.phone'),
      <span key="phone" dir="ltr">
        {site.legal.phone}
      </span>,
    ],
    [
      t('details.email'),
      <a
        key="email"
        href={`mailto:${site.supportEmail}`}
        className="text-accent hover:text-accent-hover"
      >
        {site.supportEmail}
      </a>,
    ],
  ];

  return (
    <main>
      <section className="border-b border-border bg-surface">
        <div className="mx-auto max-w-6xl px-6 py-14 lg:py-16">
          <h1 className="text-4xl sm:text-5xl">{t('title')}</h1>
          <p className="mt-5 max-w-2xl text-lg text-muted">{t('sub')}</p>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-10 px-6 py-14 lg:grid-cols-[1.15fr_1fr]">
        <div>
          <h2 className="text-2xl">{t('formTitle')}</h2>
          <p className="mt-2 text-muted">{t('formSub')}</p>
          <div className="mt-6">
            <ContactForm />
          </div>
        </div>

        <div>
          <h2 className="text-2xl">{t('detailsTitle')}</h2>
          <dl className="mt-6 divide-y divide-border rounded-card border border-border bg-surface">
            {rows.map(([label, value], i) => (
              <div key={i} className="flex flex-wrap items-baseline gap-x-4 gap-y-1 px-5 py-4">
                <dt className="w-40 shrink-0 text-sm text-muted">{label}</dt>
                <dd className="font-medium">{value}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-6 rounded-card border border-border bg-surface p-5">
            <h3 className="font-semibold">{t('supportTitle')}</h3>
            <p className="mt-2 text-sm text-muted">{t('supportBody')}</p>
          </div>
          <div className="mt-4 rounded-card border border-border bg-surface p-5">
            <h3 className="font-semibold">{t('privacyTitle')}</h3>
            <p className="mt-2 text-sm text-muted">{t('privacyBody')}</p>
          </div>
        </div>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </main>
  );
}
