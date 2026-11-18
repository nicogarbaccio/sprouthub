import { readFileSync } from "node:fs";
import path from "node:path";
import type { Plugin } from "vite";

/**
 * Serves `virtual:catalog-summary`: the plant catalog without its long-form fields.
 *
 * The full catalog (src/data/catalog) is ~90 KB gzipped, mostly prose that only the plant
 * details and catalog pages show. The dashboard, add-plant flow and landing page only need
 * names, images and the structured care values, so they import this instead and skip
 * downloading the rest on first load.
 *
 * Built from the same JSON files, in the order catalog/index.ts lists them (partial-name
 * lookups return the first match), so there's no second copy to keep in sync.
 */

/** Fields only the detail and catalog pages read. Keep in sync with HeavyCatalogField. */
export const HEAVY_CATALOG_FIELDS = [
  "description",
  "careInstructions",
  "commonProblems",
  "toxicityDetail",
  "whatsNormal",
  "propagation",
  "taxonomy",
  "sources",
  "review",
] as const;

const VIRTUAL_ID = "virtual:catalog-summary";
const RESOLVED_ID = "\0" + VIRTUAL_ID;

/** The JSON file paths catalog/index.ts exports, in its export order */
function catalogFilesInOrder(catalogDir: string): string[] {
  const index = readFileSync(path.join(catalogDir, "index.ts"), "utf8");

  const fileByName = new Map<string, string>();
  for (const [, name, file] of index.matchAll(/import\s+(\w+)\s+from\s+['"](\.\/plants\/[^'"]+\.json)['"]/g)) {
    fileByName.set(name, file);
  }

  const list = index.match(/export const catalogJson[^=]*=\s*\[([\s\S]*?)\]/);
  if (!list) throw new Error("catalog-summary: couldn't find the catalogJson array in catalog/index.ts");

  return list[1]
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean)
    .map((name) => {
      const file = fileByName.get(name);
      if (!file) throw new Error(`catalog-summary: no JSON import found for "${name}" in catalog/index.ts`);
      return path.join(catalogDir, file);
    });
}

export function catalogSummaryPlugin(catalogDir: string): Plugin {
  return {
    name: "catalog-summary",
    resolveId(id) {
      return id === VIRTUAL_ID ? RESOLVED_ID : undefined;
    },
    load(id) {
      if (id !== RESOLVED_ID) return;

      const files = catalogFilesInOrder(catalogDir);
      // Rebuild when the catalog changes in dev
      this.addWatchFile(path.join(catalogDir, "index.ts"));
      files.forEach((file) => this.addWatchFile(file));

      const summaries = files.map((file) => {
        const entry = JSON.parse(readFileSync(file, "utf8"));
        for (const field of HEAVY_CATALOG_FIELDS) delete entry[field];
        return entry;
      });
      return `export default ${JSON.stringify(summaries)};`;
    },
  };
}
