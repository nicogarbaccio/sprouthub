/**
 * Accepts review flags on a catalog plant after a reviewer has checked them against the
 * cited sources. Once a plant has no open flags, it is marked `reviewed`.
 *
 * Usage:
 *   npm run catalog-accept -- zz-plant                       # every open flag on the plant
 *   npm run catalog-accept -- zz-plant --type=changed        # only one type
 *   npm run catalog-accept -- zz-plant --match="Watering"    # only flags whose note contains the text
 */

import * as fs from 'fs';
import * as path from 'path';
import { catalogEntrySchema } from '../src/data/catalog/schema';

const CATALOG_DIR = path.resolve(import.meta.dirname, '../src/data/catalog/plants');

const arg = (name: string) => process.argv.find((a) => a.startsWith(`--${name}=`))?.split('=').slice(1).join('=');
const slug = process.argv.slice(2).find((a) => !a.startsWith('--'));
const type = arg('type');
const match = arg('match');

if (!slug) {
  console.error('Usage: npm run catalog-accept -- <plant-slug> [--type=<type>] [--match=<text>]');
  process.exit(1);
}

const file = path.join(CATALOG_DIR, `${slug}.json`);
if (!fs.existsSync(file)) {
  console.error(`No plant file ${slug}.json in ${CATALOG_DIR}`);
  process.exit(1);
}

const entry = catalogEntrySchema.parse(JSON.parse(fs.readFileSync(file, 'utf-8')));
const today = new Date().toISOString().slice(0, 10);
const flags = entry.review.flags ?? [];

const accepted = flags.filter(
  (f) => !f.acceptedAt && (!type || f.type === type) && (!match || f.note.includes(match))
);
if (!accepted.length) {
  console.log(`${entry.name}: no open flags match.`);
  process.exit(0);
}
accepted.forEach((f) => (f.acceptedAt = today));

const stillOpen = flags.filter((f) => !f.acceptedAt).length;
if (!stillOpen && entry.review.status === 'draft') entry.review.status = 'reviewed';

fs.writeFileSync(file, JSON.stringify(catalogEntrySchema.parse(entry), null, 2) + '\n');
accepted.forEach((f) => console.log(`  accepted [${f.type}] ${f.note}`));
console.log(`${entry.name}: ${stillOpen} open flag${stillOpen === 1 ? '' : 's'} left${stillOpen ? '' : ' — marked reviewed'}.`);
