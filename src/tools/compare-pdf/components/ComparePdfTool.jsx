import { useRef, useState } from 'react';
import { useToolI18n } from '../../../shell/i18n/I18nContext';
import { comparePdfDicts } from '../i18n';
import { comparePdfs, formatSize } from '../logic/comparePdf';

function FileSlot({ label, file, onPick, dicts: t }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  return (
    <div className="pdf-editor-card">
      <div className="pdf-editor-card-title">{label}</div>
      {!file ? (
        <div
          className={`pdf-editor-dropzone${dragging ? ' drag' : ''}`}
          onClick={() => inputRef.current?.click()}
          onDragEnter={(e) => { e.preventDefault(); setDragging(true); }}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={(e) => { e.preventDefault(); setDragging(false); }}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            const f = e.dataTransfer.files[0];
            if (f) onPick(f);
          }}
        >
          <div className="icon">PDF</div>
          <h3>{t('drop_title')}</h3>
          <p>{t('drop_sub')}</p>
        </div>
      ) : (
        <div className="pdf-editor-file">
          <div className="file-ic">PDF</div>
          <div className="file-meta">
            <div className="fname">{file.name}</div>
            <div className="fsize">{formatSize(file.size)}</div>
          </div>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        style={{ display: 'none' }}
        onChange={(e) => e.target.files[0] && onPick(e.target.files[0])}
      />
    </div>
  );
}

export default function ComparePdfTool() {
  const t = useToolI18n(comparePdfDicts);

  const [fileA, setFileA] = useState(null);
  const [fileB, setFileB] = useState(null);
  const [result, setResult] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  function pick(setter) {
    return (f) => {
      if (f.type !== 'application/pdf') {
        setError(t('invalid_file'));
        return;
      }
      setError('');
      setResult(null);
      setter(f);
    };
  }

  async function handleCompare() {
    if (!fileA || !fileB) return;
    setBusy(true);
    setError('');
    try {
      const r = await comparePdfs(fileA, fileB);
      setResult(r);
      setPageNumber(1);
    } catch (err) {
      console.error(err);
      setError(t('generic_error'));
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    setFileA(null);
    setFileB(null);
    setResult(null);
    setPageNumber(1);
    setError('');
  }

  const totalPages = result?.pages.length || 0;
  const currentPage = result?.pages[pageNumber - 1];

  return (
    <section className="pdf-editor" id="tool">
      <div className="pdf-editor-grid">
        <aside className="pdf-editor-sidebar">
          <div className="pdf-editor-brand">
            <div className="mark">PDF</div>
            <div className="pdf-editor-brand-text">
              <h1>{t('hero_title_a')} {t('hero_title_b')}</h1>
              <p>{t('hero_lead')}</p>
            </div>
          </div>

          {!result && (
            <>
              <FileSlot label={t('file_a_label')} file={fileA} onPick={pick(setFileA)} dicts={t} />
              <FileSlot label={t('file_b_label')} file={fileB} onPick={pick(setFileB)} dicts={t} />

              {error && <p className="pdf-editor-status">{error}</p>}

              <div className="pdf-editor-card">
                <button
                  className="pdf-editor-btn pdf-editor-btn-primary"
                  onClick={handleCompare}
                  disabled={!fileA || !fileB || busy}
                >
                  {busy ? t('comparing') : t('compare_btn')}
                </button>
                <p className="pdf-editor-hint" style={{ textAlign: 'center' }}>{t('footnote')}</p>
              </div>
            </>
          )}

          {result && (
            <>
              <div className="pdf-editor-card">
                <div className="pdf-editor-card-title">{t('summary_title')}</div>
                {result.identical ? (
                  <p className="pdf-editor-hint" style={{ margin: 0 }}>{t('identical')}</p>
                ) : (
                  <div className="pdf-editor-diff-summary">
                    <span className="diff-add">+{result.totalAdditions} {t('additions_label')}</span>
                    <span className="diff-remove">-{result.totalRemovals} {t('removals_label')}</span>
                  </div>
                )}
                {result.numPagesA !== result.numPagesB && (
                  <p className="pdf-editor-hint">
                    {t('page_count_diff').replace('{a}', result.numPagesA).replace('{b}', result.numPagesB)}
                  </p>
                )}
              </div>

              {totalPages > 1 && (
                <div className="pdf-editor-card">
                  <div className="pdf-editor-pagenav" style={{ marginTop: 0, paddingTop: 0, borderTop: 'none' }}>
                    <button
                      type="button"
                      className="pg-btn"
                      disabled={pageNumber <= 1}
                      onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
                    >
                      ←
                    </button>
                    <span className="pg-label">{t('page_of').replace('{n}', pageNumber).replace('{total}', totalPages)}</span>
                    <button
                      type="button"
                      className="pg-btn"
                      disabled={pageNumber >= totalPages}
                      onClick={() => setPageNumber((p) => Math.min(totalPages, p + 1))}
                    >
                      →
                    </button>
                  </div>
                </div>
              )}

              <div className="pdf-editor-card">
                <button type="button" className="pdf-editor-btn pdf-editor-btn-ghost" onClick={reset}>
                  {t('choose_another')}
                </button>
              </div>
            </>
          )}
        </aside>

        <div className="pdf-editor-viewer">
          {result ? (
            <>
              <div className="pdf-editor-viewer-toolbar">
                <span className="hint">{t('page_of').replace('{n}', pageNumber).replace('{total}', totalPages)}</span>
                <span className="hint">
                  {currentPage.additions === 0 && currentPage.removals === 0
                    ? t('page_unchanged')
                    : t('page_changes').replace('{add}', currentPage.additions).replace('{rem}', currentPage.removals)}
                </span>
              </div>
              <div className="pdf-editor-viewer-stage-outer" style={{ display: 'block' }}>
                <div className="pdf-editor-diff-page">
                  {currentPage.diff.length === 0 && (
                    <p className="pdf-editor-hint">{t('page_empty')}</p>
                  )}
                  {currentPage.diff.map((line, idx) => (
                    <div key={idx} className={`diff-line diff-${line.type}`}>
                      <span className="diff-marker">{line.type === 'add' ? '+' : line.type === 'remove' ? '−' : ''}</span>
                      <span className="diff-text">{line.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="pdf-editor-empty">
              <div className="big-ic">PDF</div>
              <h3>{t('drop_title')}</h3>
              <p>{t('empty_sub')}</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
