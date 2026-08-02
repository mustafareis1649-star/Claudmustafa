import { useState } from 'react';
import { useToolI18n } from '../../../shell/i18n/I18nContext';
import { socialPostMakerDicts } from '../i18n';
import { renderSocialPost, PRESET_SIZES } from '../logic/socialPostMaker';

export default function SocialPostMakerTool() {
  const t = useToolI18n(socialPostMakerDicts);

  const [presetKey, setPresetKey] = useState('instagram_post');
  const [headline, setHeadline] = useState('');
  const [subtext, setSubtext] = useState('');
  const [bgColor, setBgColor] = useState('#111318');
  const [textColor, setTextColor] = useState('#ffffff');
  const [error, setError] = useState('');
  const [result, setResult] = useState(null); // { blobUrl, fileName }
  const [busy, setBusy] = useState(false);

  async function handleRun() {
    if (!headline.trim()) {
      setError(t('missing_headline'));
      return;
    }
    setError('');
    setBusy(true);
    try {
      const { blob, fileName } = await renderSocialPost({ presetKey, headline, subtext, bgColor, textColor });
      const blobUrl = URL.createObjectURL(blob);
      setResult({ blobUrl, fileName });
    } catch (err) {
      console.error(err);
      setError(t('render_error'));
    } finally {
      setBusy(false);
    }
  }

  function handleDownload() {
    if (!result) return;
    const a = document.createElement('a');
    a.href = result.blobUrl;
    a.download = result.fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
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
          <label style={{ display: 'block', fontSize: 13, color: 'var(--text-2)' }}>{t('size_label')}</label>
          <select value={presetKey} onChange={(e) => setPresetKey(e.target.value)} style={{ width: '100%', marginBottom: 12 }}>
            {Object.entries(PRESET_SIZES).map(([key, preset]) => (
              <option key={key} value={key}>{preset.label}</option>
            ))}
          </select>

          <label style={{ display: 'block', fontSize: 13, color: 'var(--text-2)' }}>{t('headline_label')}</label>
          <input
            type="text"
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            placeholder={t('headline_placeholder')}
            style={{ width: '100%', marginBottom: 12 }}
          />

          <label style={{ display: 'block', fontSize: 13, color: 'var(--text-2)' }}>{t('subtext_label')}</label>
          <input
            type="text"
            value={subtext}
            onChange={(e) => setSubtext(e.target.value)}
            placeholder={t('subtext_placeholder')}
            style={{ width: '100%', marginBottom: 12 }}
          />

          <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: 13, color: 'var(--text-2)' }}>{t('bg_color_label')}</label>
              <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} style={{ width: '100%' }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: 13, color: 'var(--text-2)' }}>{t('text_color_label')}</label>
              <input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)} style={{ width: '100%' }} />
            </div>
          </div>

          <div className="download-row">
            <button className="btn btn-signal" style={{ width: '100%' }} onClick={handleRun} disabled={busy}>
              {busy ? t('generating_btn') : t('generate_btn')}
            </button>
          </div>

          {error && <p className="status-line">{error}</p>}

          {result && (
            <>
              <img src={result.blobUrl} alt="preview" style={{ width: '100%', borderRadius: 8, marginTop: 12 }} />
              <div className="download-row">
                <button className="btn btn-signal" style={{ width: '100%' }} onClick={handleDownload}>
                  {t('download_btn')}
                </button>
              </div>
            </>
          )}

          <p className="footnote">{t('footnote')}</p>
        </div>
      </div>
    </section>
  );
}
