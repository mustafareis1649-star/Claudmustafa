import { useEffect, useState } from 'react';
import { useToolI18n } from '../../../shell/i18n/I18nContext';
import { passwordGeneratorDicts } from '../i18n';
import { generatePassword, estimateStrength } from '../logic/passwordGenerator';

const STRENGTH_COLOR = {
  weak: '#E2413B',
  fair: '#E2A63B',
  strong: '#2FB56A',
  very_strong: '#2F6FED',
};
const STRENGTH_PCT = { weak: 25, fair: 50, strong: 75, very_strong: 100 };

export default function PasswordGeneratorTool() {
  const t = useToolI18n(passwordGeneratorDicts);

  const [length, setLength] = useState(16);
  const [lower, setLower] = useState(true);
  const [upper, setUpper] = useState(true);
  const [digits, setDigits] = useState(true);
  const [symbols, setSymbols] = useState(true);
  const [excludeAmbiguous, setExcludeAmbiguous] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  function regenerate() {
    setCopied(false);
    try {
      setPassword(generatePassword({ length, lower, upper, digits, symbols, excludeAmbiguous }));
      setError('');
    } catch (err) {
      setPassword('');
      setError(t('error_no_charset'));
    }
  }

  // Regenerate live whenever any option changes — mirrors the QR generator's
  // "no button needed for the common path" pattern; the explicit button is
  // just for getting a fresh one with the same options.
  useEffect(() => {
    regenerate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [length, lower, upper, digits, symbols, excludeAmbiguous]);

  function handleCopy() {
    if (!password) return;
    navigator.clipboard?.writeText(password).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  const strength = estimateStrength(password);

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
          <div
            className="file-row"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontFamily: 'monospace',
              fontSize: 17,
              letterSpacing: 0.5,
              wordBreak: 'break-all',
              minHeight: 24,
            }}
          >
            <span>{password || '—'}</span>
          </div>

          {!error && password && (
            <div style={{ margin: '10px 0 16px' }}>
              <div style={{ height: 6, borderRadius: 999, background: 'var(--border, #e5e5e5)', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${STRENGTH_PCT[strength.label]}%`,
                    background: STRENGTH_COLOR[strength.label],
                    transition: 'width 0.2s ease',
                  }}
                />
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 6 }}>
                {t('strength_label')}: {t(`strength_${strength.label}`)}
              </div>
            </div>
          )}

          {error && <p className="status-line">{error}</p>}

          <div className="download-row" style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-signal" style={{ flex: 1 }} onClick={handleCopy} disabled={!password}>
              {copied ? t('copied_label') : t('copy_btn')}
            </button>
            <button className="btn btn-ghost" style={{ flex: 1 }} onClick={regenerate}>
              {t('regenerate_btn')}
            </button>
          </div>

          <label style={{ display: 'block', fontSize: 13, color: 'var(--text-2)', margin: '18px 0 6px' }}>
            {t('length_label')}: {length}
          </label>
          <input
            type="range"
            min="6"
            max="64"
            step="1"
            value={length}
            onChange={(e) => setLength(Number(e.target.value))}
            style={{ width: '100%' }}
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, margin: '14px 0' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-2)' }}>
              <input type="checkbox" checked={lower} onChange={(e) => setLower(e.target.checked)} />
              {t('options_lower')}
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-2)' }}>
              <input type="checkbox" checked={upper} onChange={(e) => setUpper(e.target.checked)} />
              {t('options_upper')}
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-2)' }}>
              <input type="checkbox" checked={digits} onChange={(e) => setDigits(e.target.checked)} />
              {t('options_digits')}
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-2)' }}>
              <input type="checkbox" checked={symbols} onChange={(e) => setSymbols(e.target.checked)} />
              {t('options_symbols')}
            </label>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-2)' }}>
            <input
              type="checkbox"
              checked={excludeAmbiguous}
              onChange={(e) => setExcludeAmbiguous(e.target.checked)}
            />
            {t('options_exclude_ambiguous')}
          </label>

          <p className="footnote">{t('footnote')}</p>
        </div>
      </div>
    </section>
  );
}
