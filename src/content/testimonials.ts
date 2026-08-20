/**
 * Testimonials (brief §0.2, home §10): rendered ONLY from this file, and
 * only entries with written consent on file survive the build-time filter.
 * The array ships empty — the section renders nothing until real customers
 * agree in writing. No invented names, quotes, logos or ratings, ever.
 */
export interface Testimonial {
  id: string;
  quote: string;
  author: string;
  company: string;
  locale: 'he' | 'en';
  /** Written consent stored by us. Entries without it are filtered out. */
  consentOnFile: true;
}

const testimonials: Testimonial[] = [
  // TODO: replace with real, written-consent testimonials.
];

export function publishedTestimonials(locale: string): Testimonial[] {
  return testimonials.filter((t) => t.consentOnFile === true && t.locale === locale);
}
