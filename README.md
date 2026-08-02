# itdocsy

Fully client-side file-tools website. No file is ever uploaded to a server —
every conversion/edit runs in the visitor's own browser (Canvas/WASM/Web
Audio/WebCodecs depending on the tool).

## This is the single source of truth
Previously this project existed as several unmerged pieces (a nested
`itdocsy-app/`, a `pdf-fix/` patch, a `changed-files/` patch, and orphan tool
folders sitting outside the app). That's what broke the Vercel deploy — there
was no single, flat Vite project for Vercel to build. Everything has been
merged into this one folder. **Deploy this folder as the project root.**

## Structure
```
itdocsy-app/
├── index.html
├── package.json
├── vite.config.js
├── scripts/create-tool.js     scaffolds a new tool (see below)
└── src/
    ├── main.jsx / App.jsx      routing — one lazy-loaded page per tool
    ├── styles/style.css
    ├── config/                 languages, pricing
    ├── shell/                  Header, Footer, Pricing, FAQ, i18n, auth (shared)
    └── tools/
        ├── pdf-tools/          PDF → Word — working
        ├── merge-pdf/          Merge PDF — working (pdf-lib)
        ├── split-pdf/          Split PDF — working (pdf-lib + jszip)
        ├── compress-pdf/       Compress PDF — working (pdf.js render → pdf-lib re-embed, lossy)
        ├── rotate-pdf/         Rotate PDF — working (pdf-lib)
        ├── watermark-pdf/      Watermark PDF — working (pdf-lib)
        ├── protect-pdf/        Protect/Unlock PDF — working (@pdfsmaller/pdf-encrypt-lite + pdf-decrypt)
        ├── pdf-to-jpg/         PDF → JPG — working (pdf.js render, zipped via jszip if multi-page)
        ├── jpg-to-pdf/         JPG/PNG → PDF — working (pdf-lib, reorderable multi-image upload)
        ├── delete-pdf-pages/   Delete PDF pages — working (pdf-lib, "2, 4-6, 9" range syntax)
        ├── photo-editor/       resize, format convert, manual background removal — working
        ├── vector-editor/      working (see its README)
        ├── video-editor/       working (see its README)
        ├── audio-trimmer/      working
        ├── batch-resize/       working (zips multiple resized images via jszip)
        ├── social-post-maker/  working
        ├── word-counter/       working
        ├── edit-pdf/           working (click on a page to add text, pdf-lib)
        ├── word-to-pdf/        working (.docx → PDF)
        ├── add-blank-page/     working (insert blank pages, pdf-lib)
        ├── reorder-pdf-pages/  working (move pages into a new order, pdf-lib)
        └── sign-pdf/           working (draw or type a signature, click to place, pdf.js + pdf-lib)
```

## Running it
```
npm install
npm run dev
```

## Adding a new tool
```
node scripts/create-tool.js <slug> <ComponentName> "<Nav label (EN)>"
```
This scaffolds `src/tools/<slug>/` with the same shape as every other tool
(`components/`, `i18n/` with all 9 languages, `logic/`, a `<Name>Page.jsx`).
Then register it in `src/App.jsx` (lazy import + one route) and
`src/shell/components/Header.jsx` (nav link) — printed at the end of the
script as a reminder.

## Roadmap — tools not built yet
Requested categories, cross-referenced against what already exists above:

**PDF (15)** — have: PDF → Word, PDF Birleştir (merge-pdf), PDF Böl
(split-pdf, one PDF per page inside a zip), PDF Sıkıştır (compress-pdf,
lossy image re-encode), PDF Döndür (rotate-pdf), PDF Şifrele + PDF Şifre
Kaldır (protect-pdf, one tool with Protect/Unlock tabs), PDF → JPG
(pdf-to-jpg), JPG → PDF (jpg-to-pdf), PDF Sayfa Sil (delete-pdf-pages),
PDF Düzenle (edit-pdf, click-to-add-text), Word → PDF (word-to-pdf),
PDF Sayfa Ekle (add-blank-page), PDF Yeniden Sırala (reorder-pdf-pages),
PDF İmzala (sign-pdf, draw or type a signature and click to place it).
Bonus: PDF Watermark (watermark-pdf, wasn't on the original 15 but
smallpdf.com has it). All 15 original PDF tools are now built.

**Görsel (20)** — have: Fotoğraf Düzenle (resize/convert), Arka Plan Kaldır
(manual), Kırp (photo-editor içinde), PNG↔JPG/WEBP (photo-editor içinde),
Görsel Sıkıştır (image-compressor), Favicon/ICO Oluştur
(favicon-generator), Renk Paleti Oluştur (color-palette-generator), Döndür
(rotate-image, 90°/180°/270° + yatay-dikey çevirme), Parlaklık/Kontrast
(brightness-contrast, canlı önizlemeli), Watermark Ekle (image-watermark,
metin filigranı), Kolaj Oluştur (collage-maker, 5 farklı ızgara düzeni),
EXIF Bilgisi Görüntüle (exif-viewer, sıfır bağımlılıklı özel JPEG/EXIF
ayrıştırıcı). Missing: Filtreler, Watermark Kaldır, Blur, Keskinleştir,
SVG↔PNG, GIF Oluştur, Renk Seçici

**Tasarım / Vektör (15)** — have via vector-editor: Kalem (Pen) Aracı, Şekil
Araçları, Metin Aracı (all built into the one SVG editor). Plus: Sosyal Medya
Gönderisi (social-post-maker). Missing: Vektör Çizim (freehand — partially
covered by the pen tool, but no dedicated brush/vector-drawing mode yet),
Logo Oluşturucu, Poster Tasarımı, Kartvizit Tasarımı, Broşür Tasarımı,
Banner Tasarımı, Sunum Tasarımı, Katman Yönetimi (no explicit layers panel
yet — shapes have front/back reorder only), Gradient Editörü, İkon Editörü

**Video (10)** — have via video-editor: Video Kırp (trim), Video Sıkıştır
(re-encode at chosen bitrate). Plus: Audio Trimmer (extract/trim audio —
covers "Video'dan Ses Çıkar" in spirit, not file-identical). Missing: Video
Birleştir, Video Döndür, MP4↔WebM (true forced conversion — today's output
format follows whatever the browser's MediaRecorder supports), GIF → Video,
Altyazı Ekle, Video Hızlandır/Yavaşlat, Ekran Kaydı Düzenleme

**Bonus (already built, not on the original list)** — Word Counter.

60 tools total requested; 33 exist today, all 15 of the originally
requested PDF tools among them (some, like the password and QR
generators, weren't on the original list but are common companion
utilities on sites like this). Given the size, best to
build these a handful at a time rather than all at once — see chat for which
ones to prioritize next.

## smallpdf.com parity (this session)
The 6 tools above (merge/split/compress/rotate/watermark/protect-pdf) were
built to match smallpdf.com's most-used tools' *functionality*, coded from
scratch — not by copying smallpdf's code, design, or assets, which would be
a copyright problem. smallpdf.com also offers AI features (Chat with PDF,
AI Summarizer, Translate PDF) that need a server-side LLM call; those were
intentionally skipped since the project's architecture is "serverless
except Paddle." Two new npm deps are needed for these: `pdf-lib` (merge,
split, rotate, watermark) and `@pdfsmaller/pdf-encrypt-lite` +
`@pdfsmaller/pdf-decrypt` (protect/unlock) — run `npm install` after
pulling this.
