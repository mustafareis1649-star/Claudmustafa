# vector-editor

Status: built. SVG drawing tool — rectangle, ellipse, line, freehand pen,
and text, with a select/move tool, per-shape fill/stroke/width/font-size,
duplicate, reorder (front/back), delete, SVG import, and export to .svg
or a flattened .png. Entirely client-side (plain SVG + <canvas> for the
PNG rasterization step) — nothing is uploaded.

Follows the same pattern as `tools/pdf-tools/`:
- `components/` — React UI (`VectorEditorTool.jsx`, `HowItWorks.jsx`)
- `i18n/` — this tool's own translations (en/tr/es/de/fr/pt/ar/ru/hi), separate from shell/i18n
- `logic/` — framework-free shape model + SVG/PNG export (`vectorTools.js`)

Reachable at `/vector-editor` (see the path switch in `src/App.jsx`).

Known limitation: moving an *imported* path that uses curve commands
(C/Q/A) can distort it, since the move logic shifts raw path coordinates
assuming plain M/L segments (which is all this editor's own pen tool
produces). Shapes drawn in this editor are unaffected.
