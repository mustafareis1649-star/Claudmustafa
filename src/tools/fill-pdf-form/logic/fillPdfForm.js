// Runs entirely in the browser (pdf.js for the page preview, pdf-lib for
// reading/writing the AcroForm) — no file is ever uploaded to a server.

export function formatSize(bytes) {
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

/**
 * @param {ArrayBuffer} arrayBuffer
 */
export async function loadPdfForPreview(arrayBuffer) {
  return window.pdfjsLib.getDocument({ data: arrayBuffer.slice(0) }).promise;
}

/**
 * @param {*} pdf pdf.js document proxy
 * @param {number} pageNumber 1-indexed
 * @param {HTMLCanvasElement} canvas
 * @param {number} scale
 */
export async function renderPageToCanvas(pdf, pageNumber, canvas, scale = 1.4) {
  const page = await pdf.getPage(pageNumber);
  const viewport = page.getViewport({ scale });
  const context = canvas.getContext('2d');
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  await page.render({ canvasContext: context, viewport }).promise;
  return { width: viewport.width, height: viewport.height };
}

const KIND_BY_CLASS = {
  PDFTextField: 'text',
  PDFCheckBox: 'checkbox',
  PDFDropdown: 'select',
  PDFRadioGroup: 'radio',
  PDFOptionList: 'select',
};

/**
 * Reads every AcroForm field out of a PDF.
 * @param {File} file
 * @returns {Promise<{ fields: Array<{name:string, kind:string, options:string[], pageNumber:number, checked:boolean}>, numPages: number }>}
 */
export async function loadFormFields(file) {
  const { PDFDocument } = await import('pdf-lib');
  const bytes = await file.arrayBuffer();
  const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const pages = doc.getPages();
  const form = doc.getForm();

  const fields = form.getFields().map((field) => {
    const className = field.constructor.name;
    const kind = KIND_BY_CLASS[className] || 'text';
    let options = [];
    let checked = false;
    try {
      if (kind === 'select' || kind === 'radio') options = field.getOptions();
      if (kind === 'checkbox') checked = field.isChecked();
    } catch {
      // some malformed forms throw on getOptions/isChecked — treat as empty
    }

    let pageNumber = 1;
    try {
      const widget = field.acroField.getWidgets()[0];
      const pageRef = widget.P();
      const idx = pages.findIndex((p) => p.ref === pageRef);
      if (idx >= 0) pageNumber = idx + 1;
    } catch {
      // fall back to page 1 if the widget doesn't expose a page ref
    }

    return { name: field.getName(), kind, options, pageNumber, checked };
  });

  return { fields, numPages: pages.length };
}

/**
 * Writes the given values back into the form and returns a downloadable file.
 * @param {File} file
 * @param {Record<string, string|boolean>} values keyed by field name
 * @param {boolean} flatten if true, fields become non-editable in the output
 */
export async function applyFormValues(file, values, flatten) {
  const { PDFDocument } = await import('pdf-lib');
  const bytes = await file.arrayBuffer();
  const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const form = doc.getForm();

  for (const field of form.getFields()) {
    const name = field.getName();
    if (!(name in values)) continue;
    const value = values[name];
    const className = field.constructor.name;
    try {
      if (className === 'PDFTextField') field.setText(value ? String(value) : '');
      else if (className === 'PDFCheckBox') { if (value) field.check(); else field.uncheck(); }
      else if (className === 'PDFDropdown' || className === 'PDFRadioGroup' || className === 'PDFOptionList') {
        if (value) field.select(value);
      }
    } catch (err) {
      console.warn('Could not set field', name, err);
    }
  }

  if (flatten) form.flatten();

  const outBytes = await doc.save();
  const blob = new Blob([outBytes], { type: 'application/pdf' });
  return { blob, fileName: file.name.replace(/\.pdf$/i, '') + '-filled.pdf' };
}
