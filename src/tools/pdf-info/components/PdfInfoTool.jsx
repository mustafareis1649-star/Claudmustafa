import { useRef, useState } from "react";
import { useToolI18n } from "../../../shell/i18n/I18nContext";
import { pdfInfoDicts } from "../i18n";
import { getPdfInfo, formatSize } from "../logic/pdfInfo";

export default function PdfInfoTool() {
  const t = useToolI18n(pdfInfoDicts);
  const fileInputRef = useRef(null);

  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState(null);
  const [info, setInfo] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleFile(f) {
    if (!f) return;
    if (f.type !== "application/pdf") { setError(t("invalid_file")); return; }
    setError(""); setFile(f); setInfo(null); setBusy(true);
    try {
      const data = await getPdfInfo(f);
      setInfo(data);
    } catch (err) {
      console.error(err); setError(t("generic_error"));
    } finally { setBusy(false); }
  }

  function reset() {
    setFile(null); setInfo(null); setError("");
  }

  const previewItems = info?.pageCount ? Array.from({ length: Math.min(info.pageCount, 8) }, (_, i) => i + 1) : [];

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
                    onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
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
                      <div className="pdf-ws-file-size">{formatSize(file.size)}{info?.pageCount ? ` · ${info.pageCount} sayfa` : ""}</div>
                    </div>
                  </div>
                )}
                <input ref={fileInputRef} type="file" accept="application/pdf" style={{ display: "none" }}
                  onChange={(e) => e.target.files[0] && handleFile(e.target.files[0])} />

                {busy && <p className="status-line">{t("reading")}</p>}

                {info && (
                  <div className="pdf-ws-controls">
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                      <tbody>
                        {Object.entries(info).map(([key, val]) => val ? (
                          <tr key={key} style={{ borderBottom: "1px solid var(--line)" }}>
                            <td style={{ padding: "6px 8px 6px 0", fontWeight: 600, color: "var(--text-2)", whiteSpace: "nowrap" }}>{t(`info_${key}`) || key}</td>
                            <td style={{ padding: "6px 0", color: "var(--ink)", wordBreak: "break-all" }}>{String(val)}</td>
                          </tr>
                        ) : null)}
                      </tbody>
                    </table>
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
              {file && <button type="button" className="btn btn-ghost pdf-ws-secondary" onClick={reset}>{t("choose_another")}</button>}
              <p className="footnote">{t("footnote")}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
