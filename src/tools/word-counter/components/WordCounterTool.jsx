import { useState } from 'react';
import { useToolI18n } from '../../../shell/i18n/I18nContext';
import { wordCounterDicts } from '../i18n';
import { runWordCounter } from '../logic/wordCounter';

// TODO: this is a starting skeleton, not a finished tool. Replace the state
// shape and runWordCounter() call below with whatever this tool actually
// needs (file input vs. plain text input, single vs. multi-file, etc.) —
// see tools/pdf-tools/components/PdfToWordTool.jsx for the file-upload
// version of this same pattern if this tool takes a file.
export default function WordCounterTool() {
  const t = useToolI18n(wordCounterDicts);

  const [input, setInput] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  function handleRun() {
    setError('');
    try {
      setResult(runWordCounter(input));
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
