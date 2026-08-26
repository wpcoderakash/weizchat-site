import type { ContactPoint, Office } from '../cms/site-schema';
import { normalisePhone, waLink } from './wa';

/**
 * Turning the CMS's contact details into links a phone can act on.
 *
 * These share one rule that is easy to get wrong in isolation: the
 * destination is always built from the machine field, never from the label
 * a visitor reads. The CMS previously held "Call Us +380662169131" in the
 * phone field — as a `tel:` that dials nothing.
 *
 * The click-to-chat format itself is NOT reimplemented here; it is
 * `waLink` from the free-tools helper, so the site has exactly one wa.me
 * builder and the tools and the footer cannot drift apart.
 */

/** `tel:` tolerates a leading +, nothing else. */
export function telHref(point: ContactPoint): string {
  return `tel:+${normalisePhone(point.number)}`;
}

/**
 * wa.me takes digits only. A `+`, space or dash does not error — WhatsApp
 * serves a "phone number shared via url is invalid" page instead, which
 * reads as a broken site and is invisible to us.
 */
export function whatsappHref(point: ContactPoint, message = ''): string {
  return waLink(normalisePhone(point.number), message);
}

export function mailHref(email: string): string {
  return `mailto:${email.trim()}`;
}

/**
 * An explicit pin if the owner pasted one, otherwise a maps search derived
 * from the address — so an office is clickable the moment it is typed,
 * without anyone hunting down a share link first.
 */
export function mapHref(office: Office): string {
  const explicit = office.mapUrl.trim();
  if (explicit) return explicit;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(office.address)}`;
}
