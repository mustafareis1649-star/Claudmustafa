import { useRef, useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useToolI18n } from '../../../shell/i18n/I18nContext';
import { fillPdfFormDicts } from '../i18n';
import { loadPdfForPreview, renderPageToCanvas, loadFormFields, applyFormValues, formatSize } from '../logic/fillPdfForm';

export default function FillPdfFormTool() {
  const t = useToolI18n(fillPdfFormDicts);
  const location = useLocation();
  const fileInputRef = useRef(null);
  const canvasRef = useRef(null);

  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState(null);
  const [pdfDoc, setPdfDoc] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [numPages, setNumPages] = useState(0);

  const [fields, setFields] = useState(null); // null = not loaded yet
  const [values, setValues] = useState({});
  const [flatten, setFlatten] = useState(false);

  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);

  async function pickFile(f) {
    if (!f) return;
    if (f.type !== 'application/pdf') {
      setError(t('invalid_file'));
      return;
    }
    setError('');
    setResult(null);
    setFields(null);
    setValues({});
    try {
      const buf = await f.arrayBuffer();
      const pdf = await loadPdfForPreview(buf);
      setPdfDoc(pdf);
      setNumPages(pdf.numPages);
      setPageNumber(1);
      setFile(f);

      const { fields: detected } = await loadFormFields(f);
      setFields(detected);
      const initial = {};
      for (const field of detected) initial[field.name] = field.kind === 'checkbox' ? field.checked : '';
      setValues(initial);
    } catch (err) {
      console.error(err);
      setError(t('generic_error'));
    }
  }

  useEffect(() => {
    const incoming = location.state?.file;
    if (incoming) pickFile(incoming);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const renderCurrentPage = useCallback(async () => {
    if (!pdfDoc || !canvasRef.current) return;
    await renderPageToCanvas(pdfDoc, pageNumber, canvasRef.current, 1.4);
  }, [pdfDoc, pageNumber]);

  useEffect(() => {
    renderCurrentPage();
  }, [renderCurrentPage]);

  function setFieldValue(name, value) {
    setValues((prev) => ({ ...prev, [name]: value }));
  }

  function jumpToField(field) {
    setPageNumber(field.pageNumber);
  }

  async function handleApply() {
    setBusy(true);
    setError('');
    try {
      const { blob, fileName } = await applyFormValues(file, values, flatten);
      setResult({ blobUrl: URL.createObjectURL(blob), fileName });
    } catch (err) {
      console.error(err);
      setError(t('generic_error'));
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

  function reset() {
    if (result?.blobUrl) URL.revokeObjectURL(result.blobUrl);
    setFile(null);
    setPdfDoc(null);
    setNumPages(0);
    setPageNumber(1);
    setFields(null);
    setValues({});
    setFlatten(false);
    setResult(null);
    setError('');
  }

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

          {!file && (
            <div className="pdf-editor-card">
              <div className="pdf-editor-card-title">{t('hero_eyebrow')}</div>
              <div
                className={`pdf-editor-dropzone${dragging ? ' drag' : ''}`}
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
                <div className="icon">PDF</div>
                <h3>{t('drop_title')}</h3>
                <p>{t('drop_sub')}</p>
              </div>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            style={{ display: 'none' }}
            onChange={(e) => e.target.files[0] && pickFile(e.target.files[0])}
          />

          {file && (
            <>
              <div className="pdf-editor-card">
                <div className="pdf-editor-file">
                  <div className="file-ic">PDF</div>
                  <div className="file-meta">
                    <div className="fname">{file.name}</div>
                    <div className="fsize">{formatSize(file.size)}</div>
                  </div>
                </div>

                {numPages > 1 && (
                  <div className="pdf-editor-pagenav">
                    <button
                      type="button"
                      className="pg-btn"
                      disabled={pageNumber <= 1}
                      onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
                    >
                      ←
                    </button>
                    <span className="pg-label">{t('page_of').replace('{n}', pageNumber).replace('{total}', numPages)}</span>
                    <button
                      type="button"
                      className="pg-btn"
                      disabled={pageNumber >= numPages}
                      onClick={() => setPageNumber((p) => Math.min(numPages, p + 1))}
                    >
                      →
                    </button>
                  </div>
                )}
              </div>

              {fields && fields.length === 0 && (
                <div className="pdf-editor-card">
                  <p className="pdf-editor-hint" style={{ margin: 0 }}>{t('no_fields_found')}</p>
                </div>
              )}

              {fields && fields.length > 0 && (
                <div className="pdf-editor-card">
                  <div className="pdf-editor-card-title">{t('fields_title').replace('{n}', fields.length)}</div>
                  <div className="pdf-editor-field-list">
                    {fields.map((field) => (
                      <div className="pdf-editor-field-row" key={field.name}>
                        <label
                          className="pdf-editor-field-label"
                          onClick={() => jumpToField(field)}
                          title={t('jump_to_field')}
                        >
                          {field.name}
                        </label>

                        {field.kind === 'text' && (
                          <input
                            type="text"
                            className="pdf-editor-field-input"
                            value={values[field.name] || ''}
                            onChange={(e) => setFieldValue(field.name, e.target.value)}
                          />
                        )}

                        {field.kind === 'checkbox' && (
                          <label className="pdf-editor-field-checkbox">
                            <input
                              type="checkbox"
                              checked={!!values[field.name]}
                              onChange={(e) => setFieldValue(field.name, e.target.checked)}
                            />
                            <span>{t('checked_label')}</span>
                          </label>
                        )}

                        {(field.kind === 'select' || field.kind === 'radio') && (
                          <select
                            className="pdf-editor-field-input"
                            value={values[field.name] || ''}
                            onChange={(e) => setFieldValue(field.name, e.target.value)}
                          >
                            <option value="">{t('select_placeholder')}</option>
                            {field.options.map((opt) => (
                              <option value={opt} key={opt}>{opt}</option>
                            ))}
                          </select>
                        )}
                      </div>
                    ))}
                  </div>

                  <label className="pdf-editor-field-checkbox" style={{ marginTop: 14 }}>
                    <input type="checkbox" checked={flatten} onChange={(e) => setFlatten(e.target.checked)} />
                    <span>{t('flatten_label')}</span>
                  </label>
                </div>
              )}

              {error && <p className="pdf-editor-status">{error}</p>}

              {fields && fields.length > 0 && (
                <div className="pdf-editor-card">
                  {!result && (
                    <button className="pdf-editor-btn pdf-editor-btn-primary" onClick={handleApply} disabled={busy}>
                      {busy ? t('applying') : t('apply_btn')}
                    </button>
                  )}

                  {result && (
                    <button className="pdf-editor-btn pdf-editor-btn-primary" onClick={handleDownload}>
                      {t('download_btn')}
                    </button>
                  )}

                  <button type="button" className="pdf-editor-btn pdf-editor-btn-ghost" style={{ marginTop: 10 }} onClick={reset}>
                    {t('choose_another')}
                  </button>

                  <p className="pdf-editor-hint" style={{ textAlign: 'center' }}>{t('footnote')}</p>
                </div>
              )}

              {fields && fields.length === 0 && (
                <div className="pdf-editor-card">
                  <button type="button" className="pdf-editor-btn pdf-editor-btn-ghost" onClick={reset}>
                    {t('choose_another')}
                  </button>
                </div>
              )}
            </>
          )}
        </aside>

        <div className="pdf-editor-viewer">
          {file ? (
            <>
              <div className="pdf-editor-viewer-toolbar">
                <span className="hint">{t('page_of').replace('{n}', pageNumber).replace('{total}', numPages || 1)}</span>
              </div>
              <div className="pdf-editor-viewer-stage-outer">
                <div className="pdf-editor-stage">
                  <canvas ref={canvasRef} />
                </div>
              </div>
            </>
          ) : (
            <div className="pdf-editor-empty">
              <div className="big-ic">PDF</div>
              <h3>{t('drop_title')}</h3>
              <p>{t('drop_sub')}</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
