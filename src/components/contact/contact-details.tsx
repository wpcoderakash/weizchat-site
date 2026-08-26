import { useTranslations } from 'next-intl';
import type { ContactBlock } from '../../cms/site-schema';
import { mailHref, mapHref, telHref, whatsappHref } from '../../lib/contact-links';

/**
 * The contact block, rendered once and used by the footer and the contact
 * page (owner request, 2026-08-26).
 *
 * Every number is a link, not text: on a phone, tapping it should call or
 * open WhatsApp. Numbers carry `dir="ltr"` because a phone number inside
 * Hebrew text otherwise renders its + and grouping in the wrong order —
 * correct bidi, wrong number.
 *
 * Layout note: every row gets an icon, including email. It is not
 * decoration — a row without one sits on a different left edge from the
 * rows beneath it, which is what made this block look ragged. The icon
 * column is a fixed width so the labels align whatever the glyph.
 */

/** One shared geometry for the icon column, so nothing drifts. */
const ICON = 'w-4 shrink-0';
const ROW = 'group flex items-center gap-2.5 text-muted transition-colors hover:text-fg';

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" className={ICON} height="16" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
      <rect x="2.5" y="5" width="19" height="14" rx="2.5" />
      <path d="m3.5 7 7.4 5.3a2 2 0 0 0 2.2 0L20.5 7" strokeLinecap="round" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" className={ICON} height="16" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
      <path d="M6.5 3h3l1.5 4-2 1.5a12 12 0 0 0 6.5 6.5L17 13l4 1.5v3a2 2 0 0 1-2.2 2A17 17 0 0 1 3.5 5.2 2 2 0 0 1 5.5 3Z" strokeLinejoin="round" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" className={ICON} height="16" fill="currentColor" aria-hidden="true">
      <path d="M12 2a10 10 0 0 0-8.6 15L2 22l5.2-1.4A10 10 0 1 0 12 2Zm0 1.8a8.2 8.2 0 1 1-4.2 15.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 0 1 12 3.8Zm-3 4c-.2 0-.5 0-.7.4-.3.4-.9 1-.9 2.2 0 1.3 1 2.6 1.1 2.8.1.2 1.8 3 4.5 4 .6.3 1.1.4 1.5.5.6.2 1.2.2 1.6.1.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.6-.3l-2-1c-.3-.1-.5-.1-.7.1l-.9 1.1c-.2.2-.3.2-.6.1-1.8-.9-2.9-2.3-3.2-3-.1-.3 0-.4.1-.5l.5-.6c.1-.2.1-.3.2-.5v-.5l-.8-2c-.2-.5-.4-.5-.6-.5Z" />
    </svg>
  );
}

function MapIcon() {
  return (
    <svg viewBox="0 0 24 24" className={ICON} height="16" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
      <path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11Z" strokeLinejoin="round" />
      <circle cx="12" cy="10" r="2.6" />
    </svg>
  );
}

/** Email, phone and WhatsApp — each one actionable, all on one edge. */
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
    <ul className={`flex flex-col gap-3 text-sm ${className}`}>
      <li>
        <a href={mailHref(email)} className={ROW}>
          <MailIcon />
          <span className="break-all">{email}</span>
        </a>
      </li>
      <li>
        <a href={telHref(contact.phone)} className={ROW} aria-label={`${t('callUs')} ${contact.phone.label}`}>
          <PhoneIcon />
          <span dir="ltr">{contact.phone.label}</span>
        </a>
      </li>
      <li>
        <a
          href={whatsappHref(contact.whatsapp, contact.whatsappMessage)}
          target="_blank"
          rel="noopener noreferrer"
          className={ROW}
          aria-label={`${t('whatsappUs')} ${contact.whatsapp.label}`}
        >
          <WhatsAppIcon />
          <span dir="ltr">{contact.whatsapp.label}</span>
        </a>
      </li>
    </ul>
  );
}

/**
 * Offices, each opening a map.
 *
 * The pin sits beside the city rather than beside the address, and the
 * address hangs under it on the same edge — one marker per place, and the
 * two lines read as one block instead of two indents.
 */
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
      <ul className="flex flex-col gap-3 text-sm">
        {contact.offices.map((office) => (
          <li key={office.id}>
            <a
              href={mapHref(office)}
              target="_blank"
              rel="noopener noreferrer"
              className="group block"
              aria-label={`${office.label} — ${t('viewMap')}`}
            >
              <span className="flex items-center gap-2.5 font-medium text-fg">
                <MapIcon />
                {office.label}
              </span>
              {/* Aligned to the label, not the icon: icon width + gap. */}
              <address className="mt-0.5 block ps-[1.625rem] not-italic leading-snug text-muted transition-colors group-hover:text-fg">
                {office.address}
              </address>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
