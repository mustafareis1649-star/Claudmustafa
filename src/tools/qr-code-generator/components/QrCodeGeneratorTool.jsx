import { useEffect, useRef, useState } from 'react';
import { useToolI18n } from '../../../shell/i18n/I18nContext';
import { qrCodeGeneratorDicts } from '../i18n';
import { generateQrCode } from '../logic/qrCodeGenerator';

export default function QrCodeGeneratorTool() {
  const t = useToolI18n(qrCodeGeneratorDicts);
  const debounceRef = useRef(null);

  const [text, setText] = useState('');
  const [dark, setDark] = useState('#111111');
  const [light, setLight] = useState('#ffffff');
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!text.trim()) {
      setResult(null);
      setError('');
      return;
    }
    setBusy(true);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const { blob, dataUrl } = await generateQrCode(text, { size: 512, dark, light });
        setResult({ blobUrl: URL.createObjectURL(blob), dataUrl });
        setError('');
      } catch (err) {
        console.error(err);
        setError(t('generic_error'));
      } finally {
        setBusy(false);
      }
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [text, dark, light]);

  function handleDownload() {
    if (!result) return;
    const a = document.createElement('a');
    a.href = result.blobUrl;
    a.download = 'qr-code.png';
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
          <label style={{ display: 'block', fontSize: 13, color: 'var(--text-2)', marginBottom: 6 }}>
            {t('input_label')}
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t('input_placeholder')}
            rows={3}
            style={{ width: '100%', padding: '10px 12px', borderRadius: 8, resize: 'vertical' }}
          />

          <div style={{ display: 'flex', gap: 16, margin: '14px 0' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-2)' }}>
              {t('color_label')}
              <input type="color" value={dark} onChange={(e) => setDark(e.target.value)} />
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-2)' }}>
              {t('background_label')}
              <input type="color" value={light} onChange={(e) => setLight(e.target.value)} />
            </label>
          </div>

          {error && <p className="status-line">{error}</p>}

          {result && (
            <div style={{ textAlign: 'center', margin: '12px 0' }}>
              <img
                src={result.dataUrl}
                alt="QR code"
                style={{ width: 200, height: 200, borderRadius: 8, border: '1px solid var(--border, #e5e5e5)' }}
              />
            </div>
          )}

          {!result && !busy && text.trim() === '' && (
            <p className="footnote" style={{ textAlign: 'center', margin: '12px 0' }}>{t('empty_hint')}</p>
          )}

          {result && (
            <div className="download-row">
              <button className="btn btn-signal" style={{ width: '100%' }} onClick={handleDownload}>
                {t('download_btn')}
              </button>
            </div>
          )}

          <p className="footnote">{t('footnote')}</p>
        </div>
      </div>
    </section>
  );
}
