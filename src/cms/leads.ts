import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { z } from 'zod';
import { LEADS_DIR } from '../lib/paths';

/**
 * Form leads — real capture, replacing the mailto-only forms. A lead is
 * one JSON file under content-store/leads/, same durable file store as
 * every other CMS document (ADR-0032). Visitors' text is untrusted data:
 * validated and length-capped on the way in, rendered as text (never
 * markup) on the way out, and deletable from the admin because it is
 * personal data.
 */



/** What the public intake accepts. Everything is capped — this is an
 *  unauthenticated write path. */
export const leadIntakeSchema = z
  .object({
    source: z.enum(['contact', 'waitlist']),
    locale: z.enum(['en', 'he']),
    name: z.string().trim().max(120).optional().default(''),
    company: z.string().trim().max(120).optional().default(''),
    phone: z.string().trim().max(40).optional().default(''),
    email: z.string().trim().max(254).optional().default(''),
    message: z.string().trim().max(4000).optional().default(''),
  })
  .refine((v) => (v.source === 'contact' ? v.name !== '' && v.message !== '' : true), {
    message: 'contact needs a name and a message',
  })
  .refine(
    (v) => (v.source === 'waitlist' ? z.string().email().safeParse(v.email).success : true),
    { message: 'waitlist needs a valid email' },
  );

export const leadSchema = z.object({
  id: z.string().regex(/^[0-9a-f-]{36}$/),
  createdAt: z.string(),
  status: z.enum(['new', 'handled']),
  source: z.enum(['contact', 'waitlist']),
  locale: z.enum(['en', 'he']),
  name: z.string(),
  company: z.string(),
  phone: z.string(),
  email: z.string(),
  message: z.string(),
});
export type Lead = z.infer<typeof leadSchema>;

export function addLead(intake: z.infer<typeof leadIntakeSchema>): Lead {
  const lead: Lead = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    status: 'new',
    ...intake,
  };
  fs.mkdirSync(LEADS_DIR, { recursive: true });
  const file = path.join(LEADS_DIR, `${lead.id}.json`);
  fs.writeFileSync(`${file}.tmp`, JSON.stringify(lead, null, 2));
  fs.renameSync(`${file}.tmp`, file);
  return lead;
}

export function listLeads(): Lead[] {
  let files: string[];
  try {
    files = fs.readdirSync(LEADS_DIR).filter((f) => f.endsWith('.json'));
  } catch {
    return [];
  }
  const leads: Lead[] = [];
  for (const f of files) {
    try {
      const parsed = leadSchema.safeParse(
        JSON.parse(fs.readFileSync(path.join(LEADS_DIR, f), 'utf8')),
      );
      if (parsed.success) leads.push(parsed.data);
      else console.error(`[cms] lead ${f} failed validation — skipped`);
    } catch {
      console.error(`[cms] lead ${f} unreadable — skipped`);
    }
  }
  return leads.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export function countNewLeads(): number {
  return listLeads().filter((l) => l.status === 'new').length;
}

function leadFile(id: string): string | null {
  // The id is validated before it touches a path — no traversal.
  if (!/^[0-9a-f-]{36}$/.test(id)) return null;
  const file = path.join(LEADS_DIR, `${id}.json`);
  return fs.existsSync(file) ? file : null;
}

export function setLeadStatus(id: string, status: Lead['status']): boolean {
  const file = leadFile(id);
  if (!file) return false;
  const lead = leadSchema.parse(JSON.parse(fs.readFileSync(file, 'utf8')));
  fs.writeFileSync(file, JSON.stringify({ ...lead, status }, null, 2));
  return true;
}

export function deleteLead(id: string): boolean {
  const file = leadFile(id);
  if (!file) return false;
  fs.unlinkSync(file);
  return true;
}
