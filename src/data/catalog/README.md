# Plant catalog

Each plant is one JSON file in `plants/`, validated by `schema.ts` and listed in `index.ts`.
The catalog's accuracy is what sets sprouthub apart, so **every plant added or changed goes
through the research process below** — no entries written from memory, blogs, or general
plant APIs.

## Adding a plant

1. **Create the file.** Copy a researched entry (e.g. `plants/zz-plant.json`) to
   `plants/<slug>.json` and add it to the **end** of `index.ts`. Order matters: partial-name
   lookups return the first match.
2. **Resolve its identity.** Look the botanical name up in GBIF
   (`https://api.gbif.org/v1/species/match?kingdom=Plantae&name=<name>`) and fill `taxonomy`
   with the accepted name, family and key. Strip cultivar names (`'Marble Queen'`) first.
   Keep `botanicalName` as the name people search by, even if GBIF has a newer one.
3. **Rate pet safety** (see below).
4. **Research care** (see below).
5. **Mark it for review.** Set `review.status` to `draft` with today's `researchedAt`, and
   record anything a reviewer should check in `review.flags` (see below).
6. **Check it.** `npm test` (schema, source ids, pet-safety text) and `npm run check-toxicity`.

## Pet safety

Match sources by **scientific name, never common name.** Common names are shared across
unrelated plants — matching on "Chinese Hibiscus" once gave Hibiscus a tulip's "cardiac
failure" warning, and "Air Plant" gave a Tillandsia a Kalanchoe's heart symptoms.

- **ASPCA first** — its [dogs](https://www.aspca.org/pet-care/animal-poison-control/dogs-plant-list),
  [cats](https://www.aspca.org/pet-care/animal-poison-control/cats-plant-list) and
  [horses](https://www.aspca.org/pet-care/animal-poison-control/horse-plant-list) lists give
  scientific names. Check GBIF synonyms too (ASPCA still uses *Sansevieria trifasciata* for
  snake plant). Take symptoms from the plant's ASPCA page.
- **Then NC State Extension** (`https://plants.ces.ncsu.edu/plants/<genus-species>/`), whose
  poison fields cover plants ASPCA doesn't.
- Rate `cats`, `dogs` and `horses` separately. A plant missing from ASPCA's horse list is
  `unknown` for horses, not safe.
- Record the `basis`: `species`, `genus` (an entry like "Alocasia spp."), `related_species`,
  or `none`. Anything weaker than `species` gets a review flag naming the entry used.
- **No institutional source → "Pet safety unknown".** Don't call a plant non-toxic because
  blogs do.
- **Spines and thorns are a separate risk.** Ratings only cover poisoning. For cacti and other
  spiny or thorny plants, add a sentence to the `toxicity` summary telling owners to keep pets
  away (e.g. "Its hooked spines can still injure a curious pet, so keep it out of reach"), even
  when the plant is non-toxic.

## Care

- **Sources:** NC State Extension Plant Toolbox and Missouri Botanical Garden Plant Finder
  (`https://plantfinder.mobot.org/PlantFinderProfileResults.aspx?basic=<name>`) for every
  plant; RHS, University of Wisconsin Extension, Clemson HGIC or other university extension
  pages when those two don't cover the species, or to break a tie. List each in `sources` and
  cite them from each section's `sourceIds`.
- **Only cite a source for what it says.** If a section mixes sourced and original values,
  flag which parts aren't sourced.
- **Sources disagree:** follow [the tiebreakers](#when-sources-disagree) and flag it.
- **Sources are vague** (e.g. "water less in winter"): fill in our own estimate and flag it
  as an estimate.
- **Keep the prose in step.** When a researched value changes a fact, update the matching
  `careInstructions` line, `temperature`/`humidity` text and `lightRequirement` so the page
  doesn't contradict itself.
- **`lightRequirement` must be an existing value** — it feeds the catalog's light filter.
- **`suggestedWateringDays` only affects plants added after the change** — existing users'
  schedules don't move.

## When sources disagree

Apply these in order and stop at the first that settles it. Record the result as a
`disagreement` flag saying which rule decided it.

1. **Our original catalog text never beats a source.** It's a fallback for things no source
   covers.
2. **The more specific source wins:** a species page over a genus page; indoor or houseplant
   guidance over outdoor or bedding-plant guidance.
3. **A number beats a vague phrase** — "water when the top inch is dry" over "keep moist".
4. **Still tied: add a third source** (Wisconsin, Clemson, RHS, UF/IFAS) and go with the
   majority. Missouri Botanical Garden often says "keep evenly moist" where others say
   "let it dry slightly", so watering ties are common.
5. **Still tied: take the lower-risk option.** Watering leans drier — every source names
   overwatering and root rot as the main killer, and an underwatered plant recovers where a
   rotted one usually doesn't. Cold limits take the higher (safer) temperature. Humidity is
   shown as a range covering both sources.

Tell users only when the disagreement changes what they'd do and the rules can't settle it.
Then the care text says so plainly — e.g. the orchid's "Experts differ on the spent flower
spike: …" line. A small numeric difference is just shown as a range.

## Review flags

Each flag is `{ "type", "note" }`:

| Type | Use for |
|---|---|
| `disagreement` | Sources conflict; the note says which rule resolved it |
| `estimate` | A value we derived because sources are vague (e.g. winter watering intervals) |
| `source_gap` | Thin coverage: one source, a genus-level page, or values still from the original catalog |
| `changed` | A value that differs from what the app showed before research |
| `toxicity` | How the pet-safety rating was reached |
| `app_gap` | Care sprouthub can't represent yet (e.g. Lithops' "no water this season") |
| `note` | Anything else worth a reviewer's attention |

`npm run catalog-flags` lists open flags across the catalog, grouped by type
(`-- --type=disagreement` or `-- --plant=<slug>` to narrow it).

After checking a flag against the cited sources, accept it with
`npm run catalog-accept -- <slug>` (optionally `--type=<type>` or `--match=<text>`). That
stamps `acceptedAt` on the flag and removes it from the report. When a plant has no open
flags left it becomes `reviewed`; the tests fail if a `reviewed` plant still has open flags.
If a flag's handling is wrong, fix the data instead and update or replace the flag.
