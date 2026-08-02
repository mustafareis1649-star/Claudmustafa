import { useRef, useState } from 'react';
import { useToolI18n } from '../../../shell/i18n/I18nContext';
import { exifViewerDicts } from '../i18n';
import { readExif, formatSize } from '../logic/exifViewer';

function formatExposure(v) {
  if (!v) return null;
  if (v >= 1) return `${v}s`;
  const denom = Math.round(1 / v);
  return `1/${denom}s`;
}

export default function ExifViewerTool() {
  const t = useToolI18n(exifViewerDicts);
  const fileInputRef = useRef(null);

  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [tags, setTags] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function pickFile(f) {
    if (!f) return;
    if (f.type !== 'image/jpeg') {
      setError(t('invalid_file'));
      return;
    }
    setError('');
    setFile(f);
    setTags(null);
    setPreviewUrl(URL.createObjectURL(f));
    setBusy(true);
    try {
      const result = await readExif(f);
      setTags(result);
      if (!result) setError(t('no_exif'));
    } catch (err) {
      console.error(err);
      setError(t('generic_error'));
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null);
    setPreviewUrl(null);
    setTags(null);
    setError('');
  }

  const rows = tags
    ? [
        [t('field_camera'), [tags.make, tags.model].filter(Boolean).join(' ')],
        [t('field_lens'), tags.lensModel],
        [t('field_date'), tags.dateTimeOriginal || tags.dateTime],
        [t('field_exposure'), formatExposure(tags.exposureTime)],
        [t('field_aperture'), tags.fNumber ? `f/${tags.fNumber}` : null],
        [t('field_iso'), tags.iso ? `ISO ${tags.iso}` : null],
        [t('field_focal_length'), tags.focalLength ? `${tags.focalLength} mm` : null],
        [t('field_dimensions'), tags.pixelXDimension && tags.pixelYDimension ? `${tags.pixelXDimension} × ${tags.pixelYDimension}` : null],
        [t('field_software'), tags.software],
        [t('field_gps'), tags.gpsLatitude != null ? `${tags.gpsLatitude.toFixed(5)}, ${tags.gpsLongitude.toFixed(5)}` : null],
      ].filter(([, value]) => value)
    : [];

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
              <div className="icon">JPG</div>
              <h3>{t('drop_title')}</h3>
              <p>{t('drop_sub')}</p>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg"
            style={{ display: 'none' }}
            onChange={(e) => e.target.files[0] && pickFile(e.target.files[0])}
          />

          {file && previewUrl && (
            <img src={previewUrl} alt="" style={{ width: '100%', borderRadius: 10, margin: '10px 0', maxHeight: 220, objectFit: 'cover' }} />
          )}

          {file && (
            <div className="file-row" style={{ display: 'flex' }}>
              <span className="name">{file.name}</span>
              <span>{formatSize(file.size)}</span>
            </div>
          )}

          {busy && <p className="status-line">{t('reading')}</p>}
          {error && <p className="status-line">{error}</p>}

          {rows.length > 0 && (
            <div style={{ margin: '10px 0' }}>
              {rows.map(([label, value]) => (
                <div
                  key={label}
                  className="file-row"
                  style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}
                >
                  <span style={{ color: 'var(--text-2)' }}>{label}</span>
                  <span className="name" style={{ textAlign: 'right' }}>{value}</span>
                </div>
              ))}
            </div>
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
