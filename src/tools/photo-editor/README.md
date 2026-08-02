# photo-editor

Status: built. Resize, crop, format conversion (PNG/JPG/WEBP), and
client-side background removal (via `@imgly/background-removal`, lazy-loaded
so other tools don't pay for it).

Follows the same pattern as `tools/pdf-tools/`:
- `components/` — React UI (`PhotoEditorTool.jsx`, `HowItWorks.jsx`)
- `i18n/` — this tool's own translations (en/tr/es/de/fr/pt/ar/ru/hi), separate from shell/i18n
- `logic/` — framework-free image functions (`photoTools.js`, `backgroundRemoval.js`)

Reachable at `/photo-editor` (see the tiny path switch in `src/App.jsx`).
