/// <reference types="vite/client" />

/** The plant catalog minus its long-form fields; see vite/catalogSummaryPlugin.ts */
declare module "virtual:catalog-summary" {
  const entries: unknown[];
  export default entries;
}
