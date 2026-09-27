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
   list anything uncertain in `review.flags`. A person moves it to `reviewed` after checking
   the flags against the cited sources.
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

## Care

- **Sources:** NC State Extension Plant Toolbox and Missouri Botanical Garden Plant Finder
  (`https://plantfinder.mobot.org/PlantFinderProfileResults.aspx?basic=<name>`) for every
  plant; RHS or other university extension pages when those two don't cover the species.
  List each in `sources` and cite them from each section's `sourceIds`.
- **Only cite a source for what it says.** If a section mixes sourced and original values,
  flag which parts aren't sourced.
- **Sources disagree:** pick a middle-ground or more cautious value and flag the disagreement.
- **Sources are vague** (e.g. "water less in winter"): fill in our own estimate and flag it
  as an estimate.
- **Keep the prose in step.** When a researched value changes a fact, update the matching
  `careInstructions` line, `temperature`/`humidity` text and `lightRequirement` so the page
  doesn't contradict itself.
- **`lightRequirement` must be an existing value** — it feeds the catalog's light filter.
- **`suggestedWateringDays` only affects plants added after the change** — existing users'
  schedules don't move.
