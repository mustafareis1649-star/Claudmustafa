#!/usr/bin/env node
/**
 * itdocsy tool generator
 * ------------------------
 * Scaffolds a brand-new tool folder that follows the exact same shape as
 * tools/pdf-tools/ — components/, i18n/ (9 languages), logic/, and a
 * <Name>Page.jsx that bundles Tool + HowItWorks into one lazy-loadable chunk.
 *
 * Usage:
 *   node scripts/create-tool.js <slug> <ComponentName> "<Nav label (EN)>"
 *
 * Example:
 *   node scripts/create-tool.js word-counter WordCounter "Word Counter"
 *
 * This generates src/tools/<slug>/ with everything needed to compile and
 * render immediately (all 9 language files start as English placeholders —
 * translate them for real launch). It does NOT touch App.jsx or Header.jsx;
 * those two one-line edits are printed at the end because they're a router
 * config + nav list, not boilerplate worth templating.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(__dirname, '..', 'src');
const LANGS = ['en', 'tr', 'es', 'de', 'fr', 'pt', 'ar', 'ru', 'hi'];

const [, , slug, ComponentName, navLabelArg] = process.argv;

if (!slug || !ComponentName) {
  console.error('Usage: node scripts/create-tool.js <slug> <ComponentName> "<Nav label (EN)>"');
  console.error('Example: node scripts/create-tool.js word-counter WordCounter "Word Counter"');
  process.exit(1);
}

if (!/^[a-z][a-z0-9-]*$/.test(slug)) {
  console.error('slug must be lowercase, hyphen-separated (e.g. "word-counter")');
  process.exit(1);
}
if (!/^[A-Z][A-Za-z0-9]*$/.test(ComponentName)) {
  console.error('ComponentName must be PascalCase (e.g. "WordCounter")');
  process.exit(1);
}

const navLabel = navLabelArg || ComponentName.replace(/([a-z])([A-Z])/g, '$1 $2');
const navKey = 'nav_' + slug.replace(/-/g, '_');
const dictsName = camel(slug) + 'Dicts'; // e.g. wordCounterDicts
const toolDir = path.join(SRC, 'tools', slug);

if (fs.existsSync(toolDir)) {
  console.error(`✗ src/tools/${slug}/ already exists — pick a different slug or delete it first.`);
  process.exit(1);
}

// ---- write files ------------------------------------------------------

write(path.join(toolDir, `${ComponentName}Page.jsx`), pageFile());
write(path.join(toolDir, 'components', `${ComponentName}Tool.jsx`), toolFile());
write(path.join(toolDir, 'components', 'HowItWorks.jsx'), howItWorksFile());
write(path.join(toolDir, 'logic', camel(slug) + '.js'), logicFile());
write(path.join(toolDir, 'i18n', 'index.js'), i18nIndexFile());
for (const lang of LANGS) {
  write(path.join(toolDir, 'i18n', `${lang}.json`), JSON.stringify(i18nEnDict(), null, 2) + '\n');
}

console.log(`\n✓ Created src/tools/${slug}/\n`);
console.log('Two manual steps left (deliberately not templated — they\'re router/nav config):\n');
console.log('1) App.jsx — add the lazy import + route:');
console.log(`   const ${ComponentName}Page = lazy(() => import('./tools/${slug}/${ComponentName}Page'));`);
console.log(`   // ...and inside TOOL_ROUTES:`);
console.log(`   { path: '/${slug}', Page: ${ComponentName}Page },\n`);
console.log('2) shell/components/Header.jsx — add the nav link:');
console.log(`   <Link to={withLang('/${slug}')}>{t('${navKey}')}</Link>\n`);
console.log(`   ...and add "${navKey}": "${navLabel}" (translated) to every file in shell/i18n/.\n`);
console.log('Then fill in the real logic in logic/' + camel(slug) + '.js and translate the 8');
console.log('non-English i18n/*.json files (they currently all mirror en.json as placeholders).\n');

// ---- templates ----------------------------------------------------------

function pageFile() {
  return `import ${ComponentName}Tool from './components/${ComponentName}Tool';
import HowItWorks from './components/HowItWorks';

// Bundles this tool's Tool + HowItWorks into one component, so App.jsx can
// lazy-load the whole page as a single chunk instead of two.
export default function ${ComponentName}Page() {
  return (
    <>
      <${ComponentName}Tool />
      <HowItWorks />
    </>
  );
}
`;
}

function toolFile() {
  return `import { useState } from 'react';
import { useToolI18n } from '../../../shell/i18n/I18nContext';
import { ${dictsName} } from '../i18n';
import { run${ComponentName} } from '../logic/${camel(slug)}';

// TODO: this is a starting skeleton, not a finished tool. Replace the state
// shape and run${ComponentName}() call below with whatever this tool actually
// needs (file input vs. plain text input, single vs. multi-file, etc.) —
// see tools/pdf-tools/components/PdfToWordTool.jsx for the file-upload
// version of this same pattern if this tool takes a file.
export default function ${ComponentName}Tool() {
  const t = useToolI18n(${dictsName});

  const [input, setInput] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  function handleRun() {
    setError('');
    try {
      setResult(run${ComponentName}(input));
    } catch (err) {
      console.error(err);
      setError('Something went wrong, please try again.');
    }
  }

  return (
    <section className="hero" id="tool">
      <div
        className="wrap"
        style={{ display: 'grid', gridTemplateColumns: '1.05fr 0.95fr', gap: '56px', alignItems: 'center', width: '100%' }}
      >
        <div>
          <div className="format-chip" style={{ marginBottom: 20 }}>
            <span className="swap" />
            <span style={{ fontWeight: 500, color: 'var(--text-2)' }}>{t('hero_eyebrow')}</span>
          </div>
          <h1>
            <span>{t('hero_title_a')}</span>
            <br />
            <span className="accent">{t('hero_title_b')}</span>
          </h1>
          <p className="lead" style={{ marginTop: 20 }}>
            {t('hero_lead')}
          </p>
        </div>

        <div className="tool-card">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('input_placeholder')}
            style={{ width: '100%', minHeight: 160, resize: 'vertical' }}
          />
          <div className="download-row">
            <button className="btn btn-signal" style={{ width: '100%' }} onClick={handleRun}>
              {t('run_btn')}
            </button>
          </div>
          {error && <p className="status-line">{error}</p>}
          {result !== null && (
            <pre className="file-row" style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(result)}</pre>
          )}
          <p className="footnote">{t('footnote')}</p>
        </div>
      </div>
    </section>
  );
}
`;
}

function howItWorksFile() {
  return `import { useToolI18n } from '../../../shell/i18n/I18nContext';
import { ${dictsName} } from '../i18n';

export default function HowItWorks() {
  const t = useToolI18n(${dictsName});

  return (
    <section className="how" id="how">
      <div className="wrap">
        <div className="section-head">
          <h2>{t('how_title')}</h2>
          <p>{t('how_lead')}</p>
        </div>
        <div className="how-grid">
          {[1, 2, 3].map((n) => (
            <div className="step" key={n}>
              <div className="marker">{n}</div>
              <h3>{t(\`step\${n}_title\`)}</h3>
              <p>{t(\`step\${n}_desc\`)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
`;
}

function logicFile() {
  return `// Runs entirely in the browser — no file/text is ever uploaded to a server.
// TODO: replace this with the tool's real logic. Keep it plain JS (no React)
// so it stays easy to unit test on its own, same as logic/pdfToWord.js.

/**
 * @param {string} input
 * @returns {any}
 */
export function run${ComponentName}(input) {
  return input;
}
`;
}

function i18nIndexFile() {
  const imports = LANGS.map((l) => `import ${l} from './${l}.json';`).join('\n');
  const obj = LANGS.join(', ');
  return `${imports}

// ${slug}'s own dictionary — nothing here is shared with other tools, so it
// lives with the tool, not the shell.
export const ${dictsName} = { ${obj} };
`;
}

function i18nEnDict() {
  // Placeholder EN copy — every other language file starts identical to this
  // and needs real translation before launch. Keeping the keys generic
  // (hero/tool/how-it-works) matches the shape every other tool uses, so
  // Header.jsx and App.jsx wiring stays copy-paste consistent across tools.
  return {
    hero_eyebrow: 'Free to start · Runs in your browser · Nothing is uploaded',
    hero_title_a: navLabel + ',',
    hero_title_b: 'done in your browser',
    hero_lead: 'TODO: one-sentence description of what this tool does and why it never leaves your device.',
    input_placeholder: 'TODO: placeholder text for the input field',
    run_btn: 'Run',
    footnote: 'TODO: any caveat or fine print for this tool.',
    how_title: 'TODO: three-step headline',
    how_lead: 'TODO: one sentence under the headline',
    step1_title: 'TODO',
    step1_desc: 'TODO',
    step2_title: 'TODO',
    step2_desc: 'TODO',
    step3_title: 'TODO',
    step3_desc: 'TODO',
  };
}

// ---- helpers ------------------------------------------------------------

function camel(s) {
  return s.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}

function write(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
  console.log('  +', path.relative(path.join(__dirname, '..'), filePath));
}
