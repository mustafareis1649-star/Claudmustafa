import { useRef, useState } from 'react';
import { useToolI18n } from '../../../shell/i18n/I18nContext';
import { audioTrimmerDicts } from '../i18n';
import { decodeAudio, trimAudioBuffer, formatTime } from '../logic/audioTrimmer';

export default function AudioTrimmerTool() {
  const t = useToolI18n(audioTrimmerDicts);
  const fileInputRef = useRef(null);

  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState(null);
  const [buffer, setBuffer] = useState(null);
  const [start, setStart] = useState(0);
  const [end, setEnd] = useState(0);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null); // { blobUrl, fileName }
  const [busy, setBusy] = useState(false);

  async function handleFile(f) {
    if (!f) return;
    if (!f.type.startsWith('audio/')) {
      setError(t('invalid_file'));
      return;
    }
    setError('');
    setResult(null);
    setFile(f);
    try {
      const decoded = await decodeAudio(f);
      setBuffer(decoded);
      setStart(0);
      setEnd(decoded.duration);
    } catch (err) {
      console.error(err);
      setError(t('decode_error'));
    }
  }

  function handleTrim() {
    if (!buffer || !file) return;
    setBusy(true);
    try {
      const { blob, fileName } = trimAudioBuffer(buffer, start, end, file.name);
      const blobUrl = URL.createObjectURL(blob);
      setResult({ blobUrl, fileName });
    } catch (err) {
      console.error(err);
      setError(t('trim_error'));
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
              if (f) handleFile(f);
            }}
          >
            <div className="icon">MP3</div>
            <h3>{t('drop_title')}</h3>
            <p>{t('drop_sub')}</p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            style={{ display: 'none' }}
            onChange={(e) => e.target.files[0] && handleFile(e.target.files[0])}
          />

          {file && buffer && (
            <div style={{ marginTop: 16 }}>
              <div className="file-row" style={{ display: 'flex' }}>
                <span className="name">{file.name}</span>
                <span>{formatTime(buffer.duration)}</span>
              </div>

              <audio controls src={URL.createObjectURL(file)} style={{ width: '100%', marginTop: 12 }} />

              <div style={{ marginTop: 16 }}>
                <label style={{ display: 'block', fontSize: 13, color: 'var(--text-2)' }}>
                  {t('start_label')}: {formatTime(start)}
                </label>
                <input
                  type="range"
                  min={0}
                  max={buffer.duration}
                  step={0.1}
                  value={start}
                  onChange={(e) => setStart(Math.min(Number(e.target.value), end))}
                  style={{ width: '100%' }}
                />
                <label style={{ display: 'block', fontSize: 13, color: 'var(--text-2)', marginTop: 8 }}>
                  {t('end_label')}: {formatTime(end)}
                </label>
                <input
                  type="range"
                  min={0}
                  max={buffer.duration}
                  step={0.1}
                  value={end}
                  onChange={(e) => setEnd(Math.max(Number(e.target.value), start))}
                  style={{ width: '100%' }}
                />
              </div>

              <div className="download-row">
                <button className="btn btn-signal" style={{ width: '100%' }} onClick={handleTrim} disabled={busy}>
                  {busy ? t('trimming_btn') : t('trim_btn')}
                </button>
              </div>
            </div>
          )}

          {error && <p className="status-line">{error}</p>}

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
