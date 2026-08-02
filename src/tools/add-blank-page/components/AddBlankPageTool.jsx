import { useRef, useState } from "react";
import { useToolI18n } from "../../../shell/i18n/I18nContext";
import { addBlankPageDicts } from "../i18n";
import { addBlankPage, formatSize } from "../logic/addBlankPage";
import { PDFDocument } from "pdf-lib";

export default function AddBlankPageTool() {
  const t = useToolI18n(addBlankPageDicts);
  const fileInputRef = useRef(null);

  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState(null);
  const [pageCount, setPageCount] = useState(null);
  const [position, setPosition] = useState("after");
  const [afterPage, setAfterPage] = useState(1);
  const [count, setCount] = useState(1);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);

  async function pickFile(f) {
    if (!f) return;
    if (f.type !== "application/pdf") { setError(t("invalid_file")); return; }
    setError(""); setFile(f); setResult(null); setPageCount(null);
    try {
      const doc = await PDFDocument.load(await f.arrayBuffer(), { ignoreEncryption: true });
      const pc = doc.getPageCount();
      setPageCount(pc);
      setAfterPage(pc);
    } catch { /* ignore */ }
  }

  async function handleAdd() {
    setBusy(true); setError("");
    try {
      const { blob, fileName } = await addBlankPage(file, { position, afterPage: Number(afterPage), count: Number(count) });
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
    setFile(null); setResult(null); setError(""); setPageCount(null);
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
                    <label className="pdf-ws-ctrl-label">{t("position_label")}</label>
                    <div className="pdf-ws-btn-group">
                      <button type="button" className={position === "before" ? "btn btn-ink" : "btn btn-ghost"} onClick={() => setPosition("before")}>{t("pos_before")}</button>
                      <button type="button" className={position === "after" ? "btn btn-ink" : "btn btn-ghost"} onClick={() => setPosition("after")}>{t("pos_after")}</button>
                    </div>
                    <label className="pdf-ws-ctrl-label" style={{ marginTop: 10 }}>
                      {position === "before" ? t("before_page_label") : t("after_page_label")}{pageCount ? ` (1–${pageCount})` : ""}
                    </label>
                    <input type="number" className="pdf-ws-ctrl-input" value={afterPage} min={1} max={pageCount || 9999}
                      onChange={(e) => setAfterPage(e.target.value)} />
                    <label className="pdf-ws-ctrl-label" style={{ marginTop: 10 }}>{t("count_label")}</label>
                    <input type="number" className="pdf-ws-ctrl-input" value={count} min={1} max={20}
                      onChange={(e) => setCount(e.target.value)} />
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

            {error && <p className="status-line">{error}</p>}

            <div className="pdf-ws-footer">
              {result ? (
                <button className="btn btn-signal pdf-ws-primary" onClick={handleDownload}>{t("download_btn")}</button>
              ) : (file && !busy) ? (
                <button className="btn btn-signal pdf-ws-primary" onClick={handleAdd} disabled={busy}>{busy ? t("working") : t("apply_btn")}</button>
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
