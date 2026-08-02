import { useRef, useState } from "react";
import { useToolI18n } from "../../../shell/i18n/I18nContext";
import { imageToPdfDicts } from "../i18n";
import { imageToPdf, formatSize } from "../logic/imageToPdf";

export default function ImageToPdfTool() {
  const t = useToolI18n(imageToPdfDicts);
  const fileInputRef = useRef(null);

  const [dragging, setDragging] = useState(false);
  const [files, setFiles] = useState([]);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);

  function addFiles(list) {
    const images = Array.from(list).filter((f) => /^image\/(jpeg|png|webp)$/.test(f.type));
    if (!images.length) { setError(t("invalid_file")); return; }
    setError(""); setResult(null);
    setFiles((prev) => [...prev, ...images]);
  }

  function removeFile(idx) { setFiles((prev) => prev.filter((_, i) => i !== idx)); }

  function move(idx, dir) {
    setFiles((prev) => {
      const next = [...prev];
      const target = idx + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  }

  async function handleConvert() {
    if (files.length < 1) { setError(t("need_one")); return; }
    setError(""); setBusy(true); setProgress(0);
    try {
      const { blob, fileName } = await imageToPdf(files, (current, total) => {
        setProgress(Math.round((current / total) * 100));
        setStatus(t("status_converting").replace("{current}", current).replace("{total}", total));
      });
      setStatus(t("status_done"));
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
    setFiles([]); setResult(null); setError(""); setProgress(0); setStatus("");
  }

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
                <div
                  className={`pdf-ws-dropzone${dragging ? " drag" : ""}`}
                  onClick={() => fileInputRef.current?.click()}
                  onDragEnter={(e) => { e.preventDefault(); setDragging(true); }}
                  onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={(e) => { e.preventDefault(); setDragging(false); }}
                  onDrop={(e) => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files); }}
                >
                  <div className="icon">IMG</div>
                  <h3>{t("drop_title")}</h3>
                  <p>{t("drop_sub")}</p>
                </div>
                <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple style={{ display: "none" }}
                  onChange={(e) => e.target.files.length && addFiles(e.target.files)} />

                {files.map((f, idx) => (
                  <div className="pdf-ws-multi-row" key={idx}>
                    <span className="name">{idx + 1}. {f.name}</span>
                    <span style={{ fontSize: 12, color: "var(--text-3)", flexShrink: 0 }}>{formatSize(f.size)}</span>
                    <button type="button" className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 13 }} onClick={() => move(idx, -1)} disabled={idx === 0}>↑</button>
                    <button type="button" className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 13 }} onClick={() => move(idx, 1)} disabled={idx === files.length - 1}>↓</button>
                    <button type="button" className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 13 }} onClick={() => removeFile(idx)}>✕</button>
                  </div>
                ))}
              </div>

              <div className="pdf-ws-right">
                <div className="pdf-ws-panel-label">PDF Önizleme</div>
                <div className="pdf-ws-preview">
                  {files.length === 0 ? (
                    <div className="pdf-ws-preview-empty">
                      <div className="icon">IMG</div>
                      <p>Resim dosyaları yükleyin</p>
                    </div>
                  ) : (
                    files.map((f, idx) => (
                      <div key={idx} className="pdf-ws-page-item">
                        <div className="pdf-ws-page-thumb" />
                        <span className="pdf-ws-page-label">{idx + 1}. {f.name}</span>
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

            <div className="pdf-ws-footer">
              {result ? (
                <button className="btn btn-signal pdf-ws-primary" onClick={handleDownload}>{t("download_btn")}</button>
              ) : (files.length > 0 && !busy) ? (
                <button className="btn btn-signal pdf-ws-primary" onClick={handleConvert}>{t("convert_btn").replace("{count}", files.length)}</button>
              ) : null}
              {files.length > 0 && <button type="button" className="btn btn-ghost pdf-ws-secondary" onClick={reset}>{t("start_over")}</button>}
              <p className="footnote">{t("footnote")}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
