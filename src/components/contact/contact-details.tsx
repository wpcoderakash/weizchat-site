import { useTranslations } from 'next-intl';
import type { ContactBlock } from '../../cms/site-schema';
import { mailHref, mapHref, telHref, whatsappHref } from '../../lib/contact-links';

/**
 * The contact block, rendered once and used by the footer and the contact
 * page (owner request, 2026-08-26).
 *
 * Every number here is a link, not text: on a phone, tapping the number
 * should call or open WhatsApp. Numbers carry `dir="ltr"` because a phone
 * number inside Hebrew text otherwise renders its + and grouping in the
 * wrong order — correct bidi, wrong number.
 */

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M6.5 3h3l1.5 4-2 1.5a12 12 0 0 0 6.5 6.5L17 13l4 1.5v3a2 2 0 0 1-2.2 2A17 17 0 0 1 3.5 5.2 2 2 0 0 1 5.5 3Z" strokeLinejoin="round" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true">
      <path d="M12 2a10 10 0 0 0-8.6 15L2 22l5.2-1.4A10 10 0 1 0 12 2Zm0 1.8a8.2 8.2 0 1 1-4.2 15.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 0 1 12 3.8Zm-3 4c-.2 0-.5 0-.7.4-.3.4-.9 1-.9 2.2 0 1.3 1 2.6 1.1 2.8.1.2 1.8 3 4.5 4 .6.3 1.1.4 1.5.5.6.2 1.2.2 1.6.1.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.6-.3l-2-1c-.3-.1-.5-.1-.7.1l-.9 1.1c-.2.2-.3.2-.6.1-1.8-.9-2.9-2.3-3.2-3-.1-.3 0-.4.1-.5l.5-.6c.1-.2.1-.3.2-.5v-.5l-.8-2c-.2-.5-.4-.5-.6-.5Z" />
    </svg>
  );
}

function MapIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11Z" strokeLinejoin="round" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

/** Email, phone and WhatsApp — each one actionable. */
export function ContactLinks({
  contact,
  email,
  className = '',
}: {
  contact: ContactBlock;
  email: string;
  className?: string;
}) {
  const t = useTranslations('footer');
  return (
    <ul className={`flex flex-col gap-2 text-sm ${className}`}>
      <li>
        <a href={mailHref(email)} className="text-muted hover:text-fg">
          {email}
        </a>
      </li>
      <li>
        <a
          href={telHref(contact.phone)}
          className="inline-flex items-center gap-2 text-muted hover:text-fg"
          aria-label={`${t('callUs')} ${contact.phone.label}`}
        >
          <PhoneIcon />
          <span dir="ltr">{contact.phone.label}</span>
        </a>
      </li>
      <li>
        <a
          href={whatsappHref(contact.whatsapp, contact.whatsappMessage)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-muted hover:text-fg"
          aria-label={`${t('whatsappUs')} ${contact.whatsapp.label}`}
        >
          <WhatsAppIcon />
          <span dir="ltr">{contact.whatsapp.label}</span>
        </a>
      </li>
    </ul>
  );
}

/** Offices, each address opening a map. */
export function OfficeList({
  contact,
  className = '',
}: {
  contact: ContactBlock;
  className?: string;
}) {
  const t = useTranslations('footer');
  if (contact.offices.length === 0) return null;
  return (
    <div className={className}>
      <p className="pb-3 text-sm font-semibold text-fg">{contact.officesTitle}</p>
      <ul className="flex flex-col gap-4 text-sm">
        {contact.offices.map((office) => (
          <li key={office.id}>
            <p className="font-medium text-fg">{office.label}</p>
            <a
              href={mapHref(office)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-flex items-start gap-2 text-muted hover:text-fg"
              aria-label={`${office.label} — ${t('viewMap')}`}
            >
              <span className="mt-1 shrink-0">
                <MapIcon />
              </span>
              <address className="not-italic leading-relaxed">{office.address}</address>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
