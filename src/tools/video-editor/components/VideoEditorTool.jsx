import { useRef, useState } from 'react';
import { useToolI18n } from '../../../shell/i18n/I18nContext';
import { videoEditorDicts } from '../i18n';
import {
  QUALITY_PRESETS,
  loadVideoMetadata,
  exportTrimmedVideo,
  getSupportedMimeType,
  isVideoEditingSupported,
  formatSize,
  formatTime,
  extensionForMime,
} from '../logic/videoTools';

export default function VideoEditorTool() {
  const t = useToolI18n(videoEditorDicts);
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);

  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');

  const [videoUrl, setVideoUrl] = useState(null);
  const [duration, setDuration] = useState(0);
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);

  const [start, setStart] = useState(0);
  const [end, setEnd] = useState(0);
  const [quality, setQuality] = useState('medium');

  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [result, setResult] = useState(null); // { blobUrl, fileName, size }

  const supported = isVideoEditingSupported();

  async function handleFile(f) {
    if (!f) return;
    if (!f.type.startsWith('video/')) {
      setError(t('invalid_file'));
      return;
    }
    setError('');
    setResult(null);
    setProgress(0);
    setStatus('');

    try {
      const meta = await loadVideoMetadata(f);
      setFile(f);
      setVideoUrl(meta.url);
      setDuration(meta.duration);
      setWidth(meta.width);
      setHeight(meta.height);
      setStart(0);
      setEnd(meta.duration);
    } catch (err) {
      console.error(err);
      setError(t('read_error'));
    }
  }

  function resetAll() {
    setFile(null);
    setVideoUrl(null);
    setResult(null);
    setError('');
    setProgress(0);
    setStatus('');
  }

  async function handleExport() {
    if (!videoRef.current || !file) return;
    if (!supported) {
      setError(t('unsupported_browser'));
      return;
    }
    if (end - start < 0.2) {
      setError(t('range_too_short'));
      return;
    }

    setExporting(true);
    setError('');
    setResult(null);
    setProgress(0);
    setStatus(t('status_exporting'));

    const mimeType = getSupportedMimeType();
    const preset = QUALITY_PRESETS[quality];

    try {
      const blob = await exportTrimmedVideo({
        videoEl: videoRef.current,
        start,
        end,
        videoBitsPerSecond: preset.videoBitsPerSecond,
        mimeType,
        onProgress: (ratio) => setProgress(Math.round(ratio * 100)),
      });
      const ext = extensionForMime(mimeType);
      const baseName = file.name.replace(/\.[^/.]+$/, '');
      setResult({
        blobUrl: URL.createObjectURL(blob),
        fileName: `${baseName}-trimmed.${ext}`,
        size: blob.size,
      });
      setStatus(t('status_done'));
      setProgress(100);
    } catch (err) {
      console.error(err);
      setError(t('export_error'));
    } finally {
      setExporting(false);
      // restore preview to a normal, muted-safe state
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.currentTime = start;
      }
    }
  }

  return (
    <section className="hero" id="tool">
      <div
        className="wrap"
        style={{ display: 'grid', gridTemplateColumns: file ? '1fr' : '1.05fr 0.95fr', gap: '56px', alignItems: 'center', width: '100%' }}
      >
        {!file && (
          <>
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
              <p className="lead" style={{ marginTop: 20 }}>{t('hero_lead')}</p>
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
                <div className="icon">MP4</div>
                <h3>{t('drop_title')}</h3>
                <p>{t('drop_sub')}</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                style={{ display: 'none' }}
                onChange={(e) => e.target.files[0] && handleFile(e.target.files[0])}
              />
              {error && <p className="status-line">{error}</p>}
              {!supported && <p className="footnote">{t('unsupported_browser')}</p>}
              <p className="footnote">{t('footnote')}</p>
            </div>
          </>
        )}

        {file && (
          <div>
            <div className="vid-layout">
              <div className="vid-preview-wrap">
                <video
                  ref={videoRef}
                  className="vid-video"
                  src={videoUrl}
                  controls
                  muted
                  onLoadedMetadata={(e) => { e.currentTarget.currentTime = start; }}
                />
                <div className="vid-timeline">
                  <div className="vid-timeline-row">
                    <label style={{ fontSize: 12, color: 'var(--text-3)', minWidth: 40 }}>{formatTime(start)}</label>
                    <input
                      type="range"
                      min="0"
                      max={duration || 0}
                      step="0.1"
                      value={start}
                      onChange={(e) => {
                        const v = Math.min(Number(e.target.value), end - 0.2);
                        setStart(v);
                        if (videoRef.current) videoRef.current.currentTime = v;
                      }}
                    />
                  </div>
                  <div className="vid-timeline-row">
                    <label style={{ fontSize: 12, color: 'var(--text-3)', minWidth: 40 }}>{formatTime(end)}</label>
                    <input
                      type="range"
                      min="0"
                      max={duration || 0}
                      step="0.1"
                      value={end}
                      onChange={(e) => {
                        const v = Math.max(Number(e.target.value), start + 0.2);
                        setEnd(v);
                      }}
                    />
                  </div>
                  <div className="vid-timeline-labels">
                    <span>{t('trim_start_label')}</span>
                    <span>{t('trim_end_label')}</span>
                  </div>
                </div>
              </div>

              <div className="vid-props">
                <p className="vid-props-title">{t('settings_title')}</p>
                <div className="vid-meta-row">
                  <span>{file.name}</span>
                  <span>{formatSize(file.size)}</span>
                </div>
                <div className="vid-meta-row">
                  <span>{t('duration_label')}</span>
                  <span>{formatTime(end - start)} / {formatTime(duration)}</span>
                </div>
                {width > 0 && (
                  <div className="vid-meta-row">
                    <span>{t('resolution_label')}</span>
                    <span>{width}×{height}</span>
                  </div>
                )}

                <p className="field label" style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', margin: '6px 0' }}>
                  {t('quality_label')}
                </p>
                <div className="vid-quality-group">
                  {Object.keys(QUALITY_PRESETS).map((key) => (
                    <button
                      key={key}
                      type="button"
                      className={`vid-quality-btn${quality === key ? ' active' : ''}`}
                      onClick={() => setQuality(key)}
                    >
                      {t(`quality_${key}`)}
                    </button>
                  ))}
                </div>

                {(exporting || result) && (
                  <div style={{ margin: '10px 0' }}>
                    <div className="progress-bar" style={{ margin: '0 0 6px' }}>
                      <div style={{ width: `${progress}%` }} />
                    </div>
                    <p className="status-line" style={{ margin: 0 }}>{error || status}</p>
                  </div>
                )}
                {!exporting && !result && error && <p className="status-line">{error}</p>}

                {result ? (
                  <div className="download-row" style={{ margin: '10px 0 0' }}>
                    <a className="btn btn-signal" style={{ width: '100%', textAlign: 'center' }} href={result.blobUrl} download={result.fileName}>
                      {t('download_btn')} ({formatSize(result.size)})
                    </a>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="btn btn-ink"
                    style={{ width: '100%', marginTop: 10 }}
                    disabled={exporting || !supported}
                    onClick={handleExport}
                  >
                    {exporting ? t('exporting_btn') : t('export_btn')}
                  </button>
                )}

                <button type="button" className="btn btn-ghost" style={{ width: '100%', marginTop: 8 }} onClick={resetAll}>
                  {t('choose_another_btn')}
                </button>

                <p className="footnote" style={{ padding: '14px 0 0' }}>{t('footnote')}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
