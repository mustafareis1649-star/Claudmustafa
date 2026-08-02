import { useRef, useState } from 'react';
import { useToolI18n } from '../../../shell/i18n/I18nContext';
import { colorPaletteGeneratorDicts } from '../i18n';
import { extractPalette } from '../logic/colorPaletteGenerator';

export default function ColorPaletteGeneratorTool() {
  const t = useToolI18n(colorPaletteGeneratorDicts);
  const fileInputRef = useRef(null);

  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [count, setCount] = useState(6);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [palette, setPalette] = useState(null);
  const [copiedHex, setCopiedHex] = useState('');
  const [copiedCss, setCopiedCss] = useState(false);

  async function pickFile(f) {
    if (!f) return;
    if (!f.type.startsWith('image/')) {
      setError(t('invalid_file'));
      return;
    }
    setError('');
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
    await run(f, count);
  }

  async function run(f, swatchCount) {
    setBusy(true);
    setPalette(null);
    try {
      setPalette(await extractPalette(f, swatchCount));
      setError('');
    } catch (err) {
      console.error(err);
      setError(t('generic_error'));
    } finally {
      setBusy(false);
    }
  }

  function handleCountChange(next) {
    setCount(next);
    if (file) run(file, next);
  }

  function copyHex(hex) {
    navigator.clipboard?.writeText(hex).then(() => {
      setCopiedHex(hex);
      setTimeout(() => setCopiedHex(''), 1200);
    });
  }

  function copyCss() {
    if (!palette) return;
    const css = ':root {\n' + palette.map((c, i) => `  --color-${i + 1}: ${c.hex};`).join('\n') + '\n}';
    navigator.clipboard?.writeText(css).then(() => {
      setCopiedCss(true);
      setTimeout(() => setCopiedCss(false), 1500);
    });
  }

  function reset() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null);
    setPreviewUrl(null);
    setPalette(null);
    setError('');
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
          {!file && (
            <div
              className={`dropzone${dragging ? ' drag' : ''}`}
              onClick={() => fileInputRef.current?.click()}
              onDragEnter={(e) => { e.preventDefault(); setDragging(true); }}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={(e) => { e.preventDefault(); setDragging(false); }}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                const f = e.dataTransfer.files[0];
                if (f) pickFile(f);
              }}
            >
              <div className="icon">IMG</div>
              <h3>{t('drop_title')}</h3>
              <p>{t('drop_sub')}</p>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={(e) => e.target.files[0] && pickFile(e.target.files[0])}
          />

          {previewUrl && (
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', margin: '4px 0 14px' }}>
              <img
                src={previewUrl}
                alt=""
                style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--border, #e5e5e5)' }}
              />
              <span className="name" style={{ fontSize: 13, color: 'var(--text-2)' }}>{file.name}</span>
            </div>
          )}

          {file && (
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 13, color: 'var(--text-2)', marginBottom: 6 }}>
                {t('swatch_count_label')}: {count}
              </label>
              <input
                type="range"
                min="4"
                max="10"
                step="1"
                value={count}
                onChange={(e) => handleCountChange(Number(e.target.value))}
                style={{ width: '100%' }}
              />
            </div>
          )}

          {busy && (
            <p className="footnote" style={{ textAlign: 'center', margin: '16px 0' }}>{t('extracting')}</p>
          )}

          {error && <p className="status-line">{error}</p>}

          {palette && !busy && (
            <>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: `repeat(${Math.min(palette.length, 5)}, 1fr)`,
                  gap: 8,
                  margin: '4px 0 10px',
                }}
              >
                {palette.map((c) => (
                  <button
                    key={c.hex}
                    type="button"
                    onClick={() => copyHex(c.hex)}
                    title={t('copy_hex_hint')}
                    style={{
                      border: 'none',
                      cursor: 'pointer',
                      padding: 0,
                      borderRadius: 8,
                      overflow: 'hidden',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ background: c.hex, height: 56, borderRadius: 8 }} />
                    <div style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 4, fontFamily: 'monospace' }}>
                      {copiedHex === c.hex ? t('copied_label') : c.hex}
                    </div>
                  </button>
                ))}
              </div>
              <p className="footnote" style={{ textAlign: 'center' }}>{t('copy_hex_hint')}</p>

              <div className="download-row">
                <button className="btn btn-signal" style={{ width: '100%' }} onClick={copyCss}>
                  {copiedCss ? t('copied_label') : t('copy_css_btn')}
                </button>
              </div>
            </>
          )}

          {file && (
            <button type="button" className="btn btn-ghost" style={{ width: '100%', marginTop: 10 }} onClick={reset}>
              {t('choose_another')}
            </button>
          )}

          <p className="footnote">{t('footnote')}</p>
        </div>
      </div>
    </section>
  );
}
