import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { site } from '../../../config/site';
import { getGlobal, getPageDoc } from '../../../cms/load';
import type { ContactDoc } from '../../../cms/site-schema';
import { ContactDetailsRows, OfficeCard } from '../../../components/contact/contact-page-details';
import { ContactForm } from '../../../components/contact/contact-form';
import { metaFromSeo } from '../../../lib/seo';

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
  const doc = await getPageDoc<ContactDoc>('contact', locale);
  return metaFromSeo(doc.seo, '/contact', locale);
}

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [doc, g] = await Promise.all([getPageDoc<ContactDoc>('contact', locale), getGlobal(locale)]);

  // `telephone` takes the dialable number, not the display label: this block
  // is read by machines, and "Call Us +380662169131" is not a phone number.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: g.site.legalName,
    legalName: g.site.legalName,
    url: site.url,
    email: g.site.supportEmail,
    telephone: g.contact.phone.number,
    // The registered address is the first office; there is no longer a
    // separate copy of it to drift out of date.
    ...(g.contact.offices[0]
      ? { address: { '@type': 'PostalAddress', streetAddress: g.contact.offices[0].address } }
      : {}),
    identifier: g.site.companyId,
    location: g.contact.offices.map((office) => ({
      '@type': 'Place',
      name: office.label,
      address: { '@type': 'PostalAddress', streetAddress: office.address },
    })),
  };

  return (
    <main>
      <section className="border-b border-border bg-surface">
        <div className="mx-auto max-w-6xl px-6 py-14 lg:py-16">
          <h1 className="text-4xl sm:text-5xl">{doc.title}</h1>
          <p className="mt-5 max-w-2xl text-lg text-muted">{doc.sub}</p>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-10 px-6 py-14 lg:grid-cols-[1.15fr_1fr]">
        <div>
          <h2 className="text-2xl">{doc.formTitle}</h2>
          <p className="mt-2 text-muted">{doc.formSub}</p>
          <div className="mt-6">
            <ContactForm email={g.site.supportEmail} locale={locale} strings={doc.form} />
          </div>
        </div>

        <div>
          <h2 className="text-2xl">{doc.detailsTitle}</h2>
          <ContactDetailsRows labels={doc.details} g={g} />
          <OfficeCard contact={g.contact} />
          <div className="mt-6 rounded-card border border-border bg-surface p-5">
            <h3 className="font-semibold">{doc.supportTitle}</h3>
            <p className="mt-2 text-sm text-muted">{doc.supportBody}</p>
          </div>
          <div className="mt-4 rounded-card border border-border bg-surface p-5">
            <h3 className="font-semibold">{doc.privacyTitle}</h3>
            <p className="mt-2 text-sm text-muted">{doc.privacyBody}</p>
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
