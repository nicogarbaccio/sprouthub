/**
 * Lists the review flags across the plant catalog, grouped by type, so they can be worked
 * through and plants marked `reviewed`.
 *
 * Usage:
 *   npm run catalog-flags                      # every flag on plants not yet reviewed
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

// Reviewed plants have been checked already; a single-plant lookup shows everything.
const open = plants.filter(({ entry }) => plantFilter || entry.review.status !== 'reviewed');

for (const type of TYPE_ORDER) {
  if (typeFilter && type !== typeFilter) continue;
  const rows = open.flatMap(({ entry }) =>
    (entry.review.flags ?? []).filter((f) => f.type === type).map((f) => `  - ${entry.name}: ${f.note}`)
  );
  if (!rows.length) continue;
  console.log(`== ${TYPE_LABELS[type]} (${rows.length}) ==`);
  console.log(rows.join('\n') + '\n');
}
