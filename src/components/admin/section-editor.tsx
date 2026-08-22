'use client';

import type { CmsItem, CmsSection } from '../../cms/schema';
import { AreaField, ImageField, ItemControls, LinkField, TextField, moveItem, newId } from './fields';

/**
 * The editor for one section.
 *
 * A switch on `section.id` rather than a generic field-renderer driven by
 * the schema: twelve sections with genuinely different shapes are clearer
 * written out than expressed through a meta-language, and the switch is
 * exhaustive, so adding a section to the schema fails to compile here
 * until it gets an editor. That is the check that keeps the two in step.
 */
export function SectionEditor({
  section,
  onChange,
}: {
  section: CmsSection;
  onChange: (next: CmsSection) => void;
}) {
  /** Edits a titled repeater — the shape most sections use. */
  function itemsEditor(
    items: CmsItem[],
    label: string,
    write: (next: CmsItem[]) => void,
    extra?: (item: CmsItem, index: number) => React.ReactNode,
  ) {
    return (
      <>
        {items.map((item, index) => (
          <div key={item.id} className="cms-item">
            <ItemControls
              index={index}
              count={items.length}
              label={label}
              onMove={(from, to) => write(moveItem(items, from, to))}
              onDuplicate={(i) => {
                const next = [...items];
                next.splice(i + 1, 0, { ...items[i]!, id: newId(label.toLowerCase()) });
                write(next);
              }}
              onRemove={(i) => write(items.filter((_, x) => x !== i))}
            />
            <TextField
              label="Title"
              value={item.title}
              onChange={(title) => write(items.map((x, i) => (i === index ? { ...x, title } : x)))}
            />
            <AreaField
              label="Body"
              value={item.body}
              onChange={(body) => write(items.map((x, i) => (i === index ? { ...x, body } : x)))}
            />
            {extra?.(item, index)}
          </div>
        ))}
        <button
          type="button"
          className="cms-btn"
          onClick={() =>
            write([...items, { id: newId(label.toLowerCase()), title: 'New title', body: 'New body' }])
          }
        >
          Add {label.toLowerCase()}
        </button>
      </>
    );
  }

  switch (section.id) {
    case 'hero':
      return (
        <>
          <TextField label="Headline" value={section.title} onChange={(title) => onChange({ ...section, title })} />
          <AreaField label="Subhead" value={section.sub} onChange={(sub) => onChange({ ...section, sub })} />
          <LinkField label="Primary button" value={section.primary} onChange={(primary) => onChange({ ...section, primary })} />
          <LinkField label="Secondary button" value={section.secondary} onChange={(secondary) => onChange({ ...section, secondary })} />
          <ImageField label="Hero image" value={section.image} onChange={(image) => onChange({ ...section, image })} />
        </>
      );

    case 'trust':
      return (
        <>
          <TextField label="Accessible label" value={section.label} onChange={(label) => onChange({ ...section, label })} />
          <p className="cms-note">
            Factual statements only. A Meta partner badge cannot be turned on here — that stays a
            code change, made after Meta actually approves you.
          </p>
          {section.facts.map((fact, index) => (
            <div key={fact.id} className="cms-item">
              <ItemControls
                index={index}
                count={section.facts.length}
                label="Fact"
                onMove={(from, to) => onChange({ ...section, facts: moveItem(section.facts, from, to) })}
                onDuplicate={(i) => {
                  const next = [...section.facts];
                  next.splice(i + 1, 0, { ...section.facts[i]!, id: newId('fact') });
                  onChange({ ...section, facts: next });
                }}
                onRemove={(i) => onChange({ ...section, facts: section.facts.filter((_, x) => x !== i) })}
              />
              <TextField
                label="Statement"
                value={fact.text}
                onChange={(text) =>
                  onChange({ ...section, facts: section.facts.map((f, i) => (i === index ? { ...f, text } : f)) })
                }
              />
            </div>
          ))}
          <button
            type="button"
            className="cms-btn"
            onClick={() => onChange({ ...section, facts: [...section.facts, { id: newId('fact'), text: 'New fact' }] })}
          >
            Add fact
          </button>
        </>
      );

    case 'problem':
      return (
        <>
          <TextField label="Heading" value={section.title} onChange={(title) => onChange({ ...section, title })} />
          {itemsEditor(section.items, 'Column', (items) => onChange({ ...section, items }))}
        </>
      );

    case 'pillars':
      return (
        <>
          <TextField label="Heading" value={section.title} onChange={(title) => onChange({ ...section, title })} />
          <TextField label="Link text (all cards)" value={section.linkLabel} onChange={(linkLabel) => onChange({ ...section, linkLabel })} />
          {section.items.map((item, index) => (
            <div key={item.id} className="cms-item">
              <ItemControls
                index={index}
                count={section.items.length}
                label="Pillar"
                onMove={(from, to) => onChange({ ...section, items: moveItem(section.items, from, to) })}
                onDuplicate={(i) => {
                  const next = [...section.items];
                  next.splice(i + 1, 0, { ...section.items[i]!, id: newId('pillar') });
                  onChange({ ...section, items: next });
                }}
                onRemove={(i) => onChange({ ...section, items: section.items.filter((_, x) => x !== i) })}
              />
              <TextField
                label="Title"
                value={item.title}
                onChange={(title) => onChange({ ...section, items: section.items.map((x, i) => (i === index ? { ...x, title } : x)) })}
              />
              <AreaField
                label="Body"
                value={item.body}
                onChange={(body) => onChange({ ...section, items: section.items.map((x, i) => (i === index ? { ...x, body } : x)) })}
              />
              <div className="cms-grid">
                <TextField
                  label="Links to"
                  value={item.href}
                  onChange={(href) => onChange({ ...section, items: section.items.map((x, i) => (i === index ? { ...x, href } : x)) })}
                />
                <div className="cms-field">
                  <label htmlFor={`icon-${item.id}`}>Icon</label>
                  <select
                    id={`icon-${item.id}`}
                    value={item.icon}
                    onChange={(e) =>
                      onChange({
                        ...section,
                        items: section.items.map((x, i) =>
                          i === index ? { ...x, icon: e.target.value as 'inbox' | 'ai' | 'bot' } : x,
                        ),
                      })
                    }
                  >
                    <option value="inbox">Inbox</option>
                    <option value="ai">AI sparkle</option>
                    <option value="bot">Chatbot</option>
                  </select>
                </div>
              </div>
            </div>
          ))}
        </>
      );

    case 'ai':
      return (
        <>
          <TextField label="Kicker" value={section.kicker} onChange={(kicker) => onChange({ ...section, kicker })} />
          <TextField label="Heading" value={section.title} onChange={(title) => onChange({ ...section, title })} />
          <p className="cms-note">Steps are numbered by their order here — reordering renumbers the page.</p>
          {itemsEditor(section.steps, 'Step', (steps) => onChange({ ...section, steps }))}
          <AreaField label="Honesty note" value={section.honest} onChange={(honest) => onChange({ ...section, honest })} />
        </>
      );

    case 'platform':
      return (
        <>
          <TextField label="Heading" value={section.title} onChange={(title) => onChange({ ...section, title })} />
          <AreaField label="Intro" value={section.body} onChange={(body) => onChange({ ...section, body })} />
          <LinkField label="Link card" value={section.link} onChange={(link) => onChange({ ...section, link })} />
          {itemsEditor(section.cards, 'Card', (cards) => onChange({ ...section, cards }))}
        </>
      );

    case 'useCases':
      return (
        <>
          <TextField label="Heading" value={section.title} onChange={(title) => onChange({ ...section, title })} />
          {section.tabs.map((tab, index) => (
            <div key={tab.id} className="cms-item">
              <ItemControls
                index={index}
                count={section.tabs.length}
                label="Tab"
                onMove={(from, to) => onChange({ ...section, tabs: moveItem(section.tabs, from, to) })}
                onDuplicate={(i) => {
                  const next = [...section.tabs];
                  next.splice(i + 1, 0, { ...section.tabs[i]!, id: newId('tab') });
                  onChange({ ...section, tabs: next });
                }}
                onRemove={(i) => onChange({ ...section, tabs: section.tabs.filter((_, x) => x !== i) })}
              />
              <TextField
                label="Tab label"
                value={tab.label}
                onChange={(label) => onChange({ ...section, tabs: section.tabs.map((t, i) => (i === index ? { ...t, label } : t)) })}
              />
              {tab.points.map((point, pi) => (
                <div key={pi} style={{ display: 'flex', gap: '0.4rem', alignItems: 'flex-end' }}>
                  <div style={{ flex: 1 }}>
                    <AreaField
                      label={`Point ${pi + 1}`}
                      rows={2}
                      value={point}
                      onChange={(text) =>
                        onChange({
                          ...section,
                          tabs: section.tabs.map((t, i) =>
                            i === index ? { ...t, points: t.points.map((p, x) => (x === pi ? text : p)) } : t,
                          ),
                        })
                      }
                    />
                  </div>
                  <button
                    type="button"
                    className="cms-btn cms-btn-danger"
                    disabled={tab.points.length <= 1}
                    onClick={() =>
                      onChange({
                        ...section,
                        tabs: section.tabs.map((t, i) =>
                          i === index ? { ...t, points: t.points.filter((_, x) => x !== pi) } : t,
                        ),
                      })
                    }
                  >
                    Delete
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="cms-btn"
                onClick={() =>
                  onChange({
                    ...section,
                    tabs: section.tabs.map((t, i) => (i === index ? { ...t, points: [...t.points, 'New point'] } : t)),
                  })
                }
              >
                Add point
              </button>
            </div>
          ))}
        </>
      );

    case 'crm':
      return (
        <>
          <TextField label="Heading" value={section.title} onChange={(title) => onChange({ ...section, title })} />
          <AreaField label="Body" value={section.body} onChange={(body) => onChange({ ...section, body })} />
          <LinkField label="Link" value={section.link} onChange={(link) => onChange({ ...section, link })} />
          {section.features.map((feature, index) => (
            <div key={feature.id} className="cms-item">
              <ItemControls
                index={index}
                count={section.features.length}
                label="Feature"
                onMove={(from, to) => onChange({ ...section, features: moveItem(section.features, from, to) })}
                onDuplicate={(i) => {
                  const next = [...section.features];
                  next.splice(i + 1, 0, { ...section.features[i]!, id: newId('feature') });
                  onChange({ ...section, features: next });
                }}
                onRemove={(i) => onChange({ ...section, features: section.features.filter((_, x) => x !== i) })}
              />
              <TextField
                label="Text"
                value={feature.text}
                onChange={(text) =>
                  onChange({ ...section, features: section.features.map((f, i) => (i === index ? { ...f, text } : f)) })
                }
              />
            </div>
          ))}
          <button
            type="button"
            className="cms-btn"
            onClick={() => onChange({ ...section, features: [...section.features, { id: newId('feature'), text: 'New feature' }] })}
          >
            Add feature
          </button>
        </>
      );

    case 'testimonials':
      return (
        <>
          <TextField label="Heading" value={section.title} onChange={(title) => onChange({ ...section, title })} />
          <p className="cms-note">
            With no entries this section does not render at all. Only add a quote you hold written
            consent for — the tick is a legal statement, not a formality.
          </p>
          {section.items.map((item, index) => (
            <div key={item.id} className="cms-item">
              <ItemControls
                index={index}
                count={section.items.length}
                label="Quote"
                onMove={(from, to) => onChange({ ...section, items: moveItem(section.items, from, to) })}
                onDuplicate={(i) => {
                  const next = [...section.items];
                  next.splice(i + 1, 0, { ...section.items[i]!, id: newId('quote') });
                  onChange({ ...section, items: next });
                }}
                onRemove={(i) => onChange({ ...section, items: section.items.filter((_, x) => x !== i) })}
              />
              <AreaField
                label="Quote"
                value={item.quote}
                onChange={(quote) => onChange({ ...section, items: section.items.map((x, i) => (i === index ? { ...x, quote } : x)) })}
              />
              <div className="cms-grid">
                <TextField
                  label="Author"
                  value={item.author}
                  onChange={(author) => onChange({ ...section, items: section.items.map((x, i) => (i === index ? { ...x, author } : x)) })}
                />
                <TextField
                  label="Company"
                  value={item.company}
                  onChange={(company) => onChange({ ...section, items: section.items.map((x, i) => (i === index ? { ...x, company } : x)) })}
                />
              </div>
              <label className="cms-toggle">
                <input type="checkbox" checked readOnly />
                Written consent is on file
              </label>
            </div>
          ))}
          <button
            type="button"
            className="cms-btn"
            onClick={() =>
              onChange({
                ...section,
                items: [
                  ...section.items,
                  { id: newId('quote'), quote: '', author: '', company: '', consentOnFile: true as const },
                ],
              })
            }
          >
            Add quote
          </button>
        </>
      );

    case 'pricing':
      return (
        <>
          <TextField label="Heading" value={section.title} onChange={(title) => onChange({ ...section, title })} />
          <TextField label='"per month" wording' value={section.perMonth} onChange={(perMonth) => onChange({ ...section, perMonth })} />
          <AreaField label="Meta charges note" value={section.metaNote} onChange={(metaNote) => onChange({ ...section, metaNote })} />
          <LinkField label="Link to full pricing" value={section.cta} onChange={(cta) => onChange({ ...section, cta })} />
          <p className="cms-note">
            Tier names, prices and quotas are not editable here: they mirror the product&rsquo;s own
            plan matrix, and a marketing page that disagrees with the product is worse than one that
            is out of date.
          </p>
        </>
      );

    case 'faq':
      return (
        <>
          <TextField label="Heading" value={section.title} onChange={(title) => onChange({ ...section, title })} />
          <p className="cms-note">These questions are also emitted as FAQPage structured data for search engines.</p>
          {section.items.map((item, index) => (
            <div key={item.id} className="cms-item">
              <ItemControls
                index={index}
                count={section.items.length}
                label="Question"
                onMove={(from, to) => onChange({ ...section, items: moveItem(section.items, from, to) })}
                onDuplicate={(i) => {
                  const next = [...section.items];
                  next.splice(i + 1, 0, { ...section.items[i]!, id: newId('faq') });
                  onChange({ ...section, items: next });
                }}
                onRemove={(i) => onChange({ ...section, items: section.items.filter((_, x) => x !== i) })}
              />
              <TextField
                label="Question"
                value={item.q}
                onChange={(q) => onChange({ ...section, items: section.items.map((x, i) => (i === index ? { ...x, q } : x)) })}
              />
              <AreaField
                label="Answer"
                value={item.a}
                onChange={(a) => onChange({ ...section, items: section.items.map((x, i) => (i === index ? { ...x, a } : x)) })}
              />
            </div>
          ))}
          <button
            type="button"
            className="cms-btn"
            onClick={() =>
              onChange({ ...section, items: [...section.items, { id: newId('faq'), q: 'New question', a: 'New answer' }] })
            }
          >
            Add question
          </button>
        </>
      );

    case 'finalCta':
      return (
        <>
          <TextField label="Heading" value={section.title} onChange={(title) => onChange({ ...section, title })} />
          <AreaField label="Subhead" value={section.sub} onChange={(sub) => onChange({ ...section, sub })} />
          <LinkField label="Primary button" value={section.primary} onChange={(primary) => onChange({ ...section, primary })} />
          <LinkField label="Secondary button" value={section.secondary} onChange={(secondary) => onChange({ ...section, secondary })} />
        </>
      );
  }
}
