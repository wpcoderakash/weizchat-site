import type { ContactDoc, GlobalDoc, ContactBlock } from '../../cms/site-schema';
import { mailHref, mapHref, telHref, whatsappHref } from '../../lib/contact-links';

/**
 * The contact page's identity table and offices card.
 *
 * Split out of the page so the row list is data rather than JSX buried in a
 * server component — and so the phone and WhatsApp rows are unmistakably
 * links. The registered address stays its own row: it is the legal address
 * Meta's reviewers check, which is not necessarily where anyone sits.
 */
export function ContactDetailsRows({
  labels,
  g,
}: {
  labels: ContactDoc['details'];
  g: GlobalDoc;
}) {
  const rows: [string, React.ReactNode][] = [
    [labels.legalName, g.site.legalName],
    [labels.companyId, g.site.companyId],
    [labels.address, g.site.address],
    [
      labels.phone,
      <a key="phone" href={telHref(g.contact.phone)} className="text-accent hover:text-accent-hover" dir="ltr">
        {g.contact.phone.label}
      </a>,
    ],
    [
      labels.whatsapp,
      <a
        key="wa"
        href={whatsappHref(g.contact.whatsapp, g.contact.whatsappMessage)}
        target="_blank"
        rel="noopener noreferrer"
        className="text-accent hover:text-accent-hover"
        dir="ltr"
      >
        {g.contact.whatsapp.label}
      </a>,
    ],
    [
      labels.email,
      <a key="email" href={mailHref(g.site.supportEmail)} className="text-accent hover:text-accent-hover">
        {g.site.supportEmail}
      </a>,
    ],
  ];

  return (
    <dl className="mt-6 divide-y divide-border rounded-card border border-border bg-surface">
      {rows.map(([label, value], i) => (
        <div key={i} className="flex flex-wrap items-baseline gap-x-4 gap-y-1 px-5 py-4">
          <dt className="w-40 shrink-0 text-sm text-muted">{label}</dt>
          <dd className="font-medium">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Offices, each address opening a map in a new tab. */
export function OfficeCard({ contact }: { contact: ContactBlock }) {
  if (contact.offices.length === 0) return null;
  return (
    <div className="mt-6 rounded-card border border-border bg-surface p-5">
      <h3 className="font-semibold">{contact.officesTitle}</h3>
      <ul className="mt-4 flex flex-col gap-4">
        {contact.offices.map((office) => (
          <li key={office.id}>
            <p className="text-sm font-medium">{office.label}</p>
            <address className="not-italic">
              <a
                href={mapHref(office)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted underline decoration-border underline-offset-4 hover:text-fg"
              >
                {office.address}
              </a>
            </address>
          </li>
        ))}
      </ul>
    </div>
  );
}
