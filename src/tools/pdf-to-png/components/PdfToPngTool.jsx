import { useRef, useState } from "react";
import { useToolI18n } from "../../../shell/i18n/I18nContext";
import { pdfToPngDicts } from "../i18n";
import { pdfToPng, formatSize } from "../logic/pdfToPng";

const LEVELS = ["low", "medium", "high"];

export default function PdfToPngTool() {
  const t = useToolI18n(pdfToPngDicts);
  const fileInputRef = useRef(null);

  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState(null);
  const [level, setLevel] = useState("medium");
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [pageCount, setPageCount] = useState(null);

  async function pickFile(f) {
    if (!f) return;
    if (f.type !== "application/pdf") { setError(t("invalid_file")); return; }
    setError(""); setFile(f); setResult(null); setStatus(""); setPageCount(null);
    try {
      const { PDFDocument } = await import("pdf-lib");
      const doc = await PDFDocument.load(await f.arrayBuffer(), { ignoreEncryption: true });
      setPageCount(doc.getPageCount());
    } catch { /* ignore */ }
  }

  async function handleConvert() {
    setBusy(true); setProgress(0); setError("");
    try {
      const { blob, fileName, pageCount: pc } = await pdfToPng(file, level, (current, total) => {
        setProgress(Math.round((current / total) * 100));
        setStatus(t("status_converting").replace("{current}", current).replace("{total}", total));
      });
      setStatus(pc > 1 ? t("status_done_zip").replace("{count}", pc) : t("status_done"));
      setResult({ blobUrl: URL.createObjectURL(blob), fileName });
    } catch (err) {
      console.error(err); setError(t("generic_error"));
    } finally { setBusy(false); }
  }

  function handleDownload() {
    if (!result) return;
    const a = document.createElement("a");
    a.href = result.blobUrl; a.download = result.fileName;
    document.body.appendChild(a); a.click(); a.remove();
  }

  function reset() {
    if (result?.blobUrl) URL.revokeObjectURL(result.blobUrl);
    setFile(null); setResult(null); setError(""); setProgress(0); setStatus(""); setPageCount(null);
  }

  const previewItems = pageCount ? Array.from({ length: Math.min(pageCount, 8) }, (_, i) => i + 1) : [];

  return (
    <section className="pdf-ws" id="tool">
      <div className="pdf-ws-header">
        <div className="wrap">
          <div className="format-chip" style={{ marginBottom: 16 }}>
            <span className="swap" />
            <span style={{ fontWeight: 500, color: "var(--hero-text-2)" }}>{t("hero_eyebrow")}</span>
          </div>
          <h1>{t("hero_title_a")} <span className="accent">{t("hero_title_b")}</span></h1>
          <p className="lead" style={{ marginTop: 14 }}>{t("hero_lead")}</p>
        </div>
      </div>

      <div className="pdf-ws-body">
        <div className="wrap">
          <div className="pdf-ws-card">
            <div className="pdf-ws-grid">
              <div className="pdf-ws-left">
                <div className="pdf-ws-panel-label">📂 Dosya Yükleme Alanı</div>
                {!file ? (
                  <div
                    className={`pdf-ws-dropzone${dragging ? " drag" : ""}`}
                    onClick={() => fileInputRef.current?.click()}
                    onDragEnter={(e) => { e.preventDefault(); setDragging(true); }}
                    onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                    onDragLeave={(e) => { e.preventDefault(); setDragging(false); }}
                    onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) pickFile(f); }}
                  >
                    <div className="icon">PDF</div>
                    <h3>{t("drop_title")}</h3>
                    <p>{t("drop_sub")}</p>
                  </div>
                ) : (
                  <div className="pdf-ws-file-row">
                    <div className="pdf-ws-file-ic">PDF</div>
                    <div className="pdf-ws-file-meta">
                      <div className="pdf-ws-file-name">{file.name}</div>
                      <div className="pdf-ws-file-size">{formatSize(file.size)}{pageCount ? ` · ${pageCount} sayfa` : ""}</div>
                    </div>
                  </div>
                )}
                <input ref={fileInputRef} type="file" accept="application/pdf" style={{ display: "none" }}
                  onChange={(e) => e.target.files[0] && pickFile(e.target.files[0])} />

                {file && !result && (
                  <div className="pdf-ws-controls">
                    <div className="pdf-ws-btn-group">
                      {LEVELS.map((lvl) => (
                        <button key={lvl} type="button" className={level === lvl ? "btn btn-ink" : "btn btn-ghost"}
                          onClick={() => setLevel(lvl)}>{t(`level_${lvl}`)}</button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="pdf-ws-right">
                <div className="pdf-ws-panel-label">PDF Önizleme</div>
                <div className="pdf-ws-preview">
                  {previewItems.length === 0 ? (
                    <div className="pdf-ws-preview-empty">
                      <div className="icon">PDF</div>
                      <p>PDF dosyası yükleyin</p>
                    </div>
                  ) : (
                    previewItems.map((n) => (
                      <div key={n} className="pdf-ws-page-item">
                        <div className="pdf-ws-page-thumb" />
                        <span className="pdf-ws-page-label">Sayfa {n}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {busy && (
              <div className="pdf-ws-progress">
                <div className="progress-bar"><div style={{ width: `${progress}%` }} /></div>
                {status && <p className="status-line">{status}</p>}
              </div>
            )}
            {error && <p className="status-line">{error}</p>}
            {result && status && <p className="status-line">{status}</p>}

            <div className="pdf-ws-footer">
              {result ? (
                <button className="btn btn-signal pdf-ws-primary" onClick={handleDownload}>{t("download_btn")}</button>
              ) : (file && !busy) ? (
                <button className="btn btn-signal pdf-ws-primary" onClick={handleConvert}>{t("convert_btn")}</button>
              ) : null}
              {file && <button type="button" className="btn btn-ghost pdf-ws-secondary" onClick={reset}>{t("choose_another")}</button>}
              <p className="footnote">{t("footnote")}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
