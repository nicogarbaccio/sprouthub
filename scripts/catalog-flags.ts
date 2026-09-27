/**
 * Lists open review flags across the plant catalog, grouped by type, so they can be worked
 * through. Accept them with `npm run catalog-accept`.
 *
 * Usage:
 *   npm run catalog-flags                      # every open flag
 *   npm run catalog-flags -- --type=disagreement
 *   npm run catalog-flags -- --plant=orchid    # one plant, by file name
 */

import * as fs from 'fs';
import * as path from 'path';
import { catalogEntrySchema, reviewFlagSchema, type CatalogEntry } from '../src/data/catalog/schema';

const CATALOG_DIR = path.resolve(import.meta.dirname, '../src/data/catalog/plants');

const TYPE_ORDER = reviewFlagSchema.shape.type.options;
const TYPE_LABELS: Record<(typeof TYPE_ORDER)[number], string> = {
  disagreement: 'Sources disagree',
  estimate: 'Our estimates',
  source_gap: 'Thin sourcing',
  changed: 'Changed from the original catalog',
  toxicity: 'Pet safety',
  app_gap: "Care sprouthub can't represent yet",
  note: 'Other notes',
};

// Exit quietly when piped into something that closes early, like `head`
process.stdout.on('error', (err: NodeJS.ErrnoException) => {
  if (err.code === 'EPIPE') process.exit(0);
  throw err;
});

function arg(name: string): string | undefined {
  return process.argv.find((a) => a.startsWith(`--${name}=`))?.split('=')[1];
}

const typeFilter = arg('type');
const plantFilter = arg('plant');
if (typeFilter && !(TYPE_ORDER as readonly string[]).includes(typeFilter)) {
  console.error(`Unknown --type "${typeFilter}". Use one of: ${TYPE_ORDER.join(', ')}`);
  process.exit(1);
}

const plants: { slug: string; entry: CatalogEntry }[] = fs
  .readdirSync(CATALOG_DIR)
  .filter((f) => f.endsWith('.json'))
  .map((f) => ({
    slug: f.replace(/\.json$/, ''),
    entry: catalogEntrySchema.parse(JSON.parse(fs.readFileSync(path.join(CATALOG_DIR, f), 'utf-8'))),
  }))
  .filter(({ slug }) => !plantFilter || slug === plantFilter);

const statusCounts = plants.reduce<Record<string, number>>((acc, { entry }) => {
  acc[entry.review.status] = (acc[entry.review.status] ?? 0) + 1;
  return acc;
}, {});
console.log(
  `${plants.length} plants — ${['reviewed', 'draft', 'legacy'].map((s) => `${statusCounts[s] ?? 0} ${s}`).join(', ')}\n`
);

const allFlags = plants.flatMap(({ entry }) => entry.review.flags ?? []);
const acceptedCount = allFlags.filter((f) => f.acceptedAt).length;
console.log(`${allFlags.length - acceptedCount} open flags, ${acceptedCount} accepted\n`);

// Accepted flags are done; a single-plant lookup still shows them, marked.
for (const type of TYPE_ORDER) {
  if (typeFilter && type !== typeFilter) continue;
  const rows = plants.flatMap(({ entry }) =>
    (entry.review.flags ?? [])
      .filter((f) => f.type === type && (plantFilter || !f.acceptedAt))
      .map((f) => `  - ${entry.name}: ${f.note}${f.acceptedAt ? ` [accepted ${f.acceptedAt}]` : ''}`)
  );
  if (!rows.length) continue;
  console.log(`== ${TYPE_LABELS[type]} (${rows.length}) ==`);
  console.log(rows.join('\n') + '\n');
}
