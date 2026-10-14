// Single source for brand colours used by the asset scripts. Imported by
// generate-brand-assets.ts and validate-brand.ts with an explicit `.ts`
// extension, so this module must stay import-free and use erasable TypeScript
// only (Node type stripping). src/theme/tokens.ts keeps its own copies of the
// background/primary/pressed values for the app bundle; validate-brand.ts
// fails if those drift from the values here.
export const ICON_BACKGROUND_HEX = "#FFF9F6";
export const ORANGE_FILL_HEX = "#F2643E";
export const DEPTH_FILL_HEX = "#C94A2D";
export const MONOCHROME_FILL_HEX = "#FFFFFF";
