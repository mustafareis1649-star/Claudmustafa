// Unique <title> + meta description per route. Every tool page needs its
// own distinct copy — if every page shared the homepage's title/description,
// Google treats them as near-duplicate content and ranks none of them well.
// Keep each description under ~155 characters (Google truncates past that).
export const SEO_META = {
  '/': {
    title: 'Free Online PDF Tools — Convert, Merge, Sign & Edit PDFs | itdocsy',
    description: 'Convert, merge, split, compress, sign, and edit PDFs for free, right in your browser. No sign-up, no file ever leaves your device.',
  },
  '/photo-editor': {
    title: 'Free Online Photo Editor | itdocsy',
    description: 'Crop, adjust, and retouch photos for free in your browser. No upload to any server, no account needed.',
  },
  '/vector-editor': {
    title: 'Free Online Vector Editor (SVG) | itdocsy',
    description: 'Create and edit vector graphics and SVG files for free, directly in your browser.',
  },
  '/video-editor': {
    title: 'Free Online Video Editor — Trim & Compress | itdocsy',
    description: 'Trim, cut, and compress video files for free in your browser. No upload, no watermark, no sign-up.',
  },
  '/audio-trimmer': {
    title: 'Free Online Audio Trimmer | itdocsy',
    description: 'Cut and trim audio files for free, right in your browser — no upload required.',
  },
  '/batch-resize': {
    title: 'Batch Image Resizer — Resize Many Photos at Once | itdocsy',
    description: 'Resize dozens of images at once for free, directly in your browser. No upload, no quality loss.',
  },
  '/social-post-maker': {
    title: 'Free Social Media Post Maker | itdocsy',
    description: 'Design social media posts and graphics for free, right in your browser.',
  },
  '/word-counter': {
    title: 'Free Word & Character Counter | itdocsy',
    description: 'Count words, characters, and reading time instantly, free and private in your browser.',
  },
  '/merge-pdf': {
    title: 'Merge PDF Files Online Free | itdocsy',
    description: 'Combine multiple PDF files into one, free and instantly, right in your browser. No upload required.',
  },
  '/split-pdf': {
    title: 'Split PDF Pages Online Free | itdocsy',
    description: 'Split a PDF into separate pages or files for free, directly in your browser.',
  },
  '/compress-pdf': {
    title: 'Compress PDF Online Free — Reduce File Size | itdocsy',
    description: 'Shrink PDF file size for free without losing quality, processed entirely in your browser.',
  },
  '/rotate-pdf': {
    title: 'Rotate PDF Pages Online Free | itdocsy',
    description: 'Rotate any or all pages of a PDF for free, right in your browser.',
  },
  '/watermark-pdf': {
    title: 'Add Watermark to PDF Online Free | itdocsy',
    description: 'Add a text watermark to any PDF for free, processed locally in your browser.',
  },
  '/protect-pdf': {
    title: 'Password Protect or Unlock PDF Online Free | itdocsy',
    description: 'Add or remove a password from a PDF for free, entirely in your browser.',
  },
  '/pdf-to-jpg': {
    title: 'Convert PDF to JPG Online Free | itdocsy',
    description: 'Turn PDF pages into JPG images for free, right in your browser — no upload needed.',
  },
  '/jpg-to-pdf': {
    title: 'Convert JPG to PDF Online Free | itdocsy',
    description: 'Combine JPG images into a single PDF for free, directly in your browser.',
  },
  '/delete-pdf-pages': {
    title: 'Delete Pages From PDF Online Free | itdocsy',
    description: 'Remove specific pages from a PDF for free, processed locally in your browser.',
  },
  '/pdf-to-png': {
    title: 'Convert PDF to PNG Online Free | itdocsy',
    description: 'Turn PDF pages into PNG images for free, right in your browser.',
  },
  '/image-to-pdf': {
    title: 'Convert Image to PDF Online Free | itdocsy',
    description: 'Turn any image into a PDF file for free, directly in your browser.',
  },
  '/extract-pdf-pages': {
    title: 'Extract Pages From PDF Online Free | itdocsy',
    description: 'Pull specific pages out of a PDF into a new file, free and entirely in your browser.',
  },
  '/image-compressor': {
    title: 'Compress Images Online Free | itdocsy',
    description: 'Reduce image file size for free without visible quality loss, processed in your browser.',
  },
  '/qr-code-generator': {
    title: 'Free QR Code Generator | itdocsy',
    description: 'Create a custom QR code for free, instantly, right in your browser.',
  },
  '/add-page-numbers': {
    title: 'Add Page Numbers to PDF Online Free | itdocsy',
    description: 'Insert page numbers into any PDF for free, in your browser, with custom position and start number.',
  },
  '/favicon-generator': {
    title: 'Free Favicon Generator | itdocsy',
    description: 'Generate a favicon in every size you need, for free, right in your browser.',
  },
  '/password-generator': {
    title: 'Free Strong Password Generator | itdocsy',
    description: 'Generate a secure, random password for free — created locally in your browser, never sent anywhere.',
  },
  '/color-palette-generator': {
    title: 'Free Color Palette Generator | itdocsy',
    description: 'Generate matching color palettes for your design projects, free and instant.',
  },
  '/rotate-image': {
    title: 'Rotate Image Online Free | itdocsy',
    description: 'Rotate or flip any image for free, right in your browser.',
  },
  '/brightness-contrast': {
    title: 'Adjust Image Brightness & Contrast Online Free | itdocsy',
    description: 'Fine-tune brightness and contrast on any photo for free, in your browser.',
  },
  '/image-watermark': {
    title: 'Add Watermark to Image Online Free | itdocsy',
    description: 'Add a text or logo watermark to your images for free, processed locally.',
  },
  '/collage-maker': {
    title: 'Free Online Photo Collage Maker | itdocsy',
    description: 'Combine multiple photos into one collage for free, right in your browser.',
  },
  '/exif-viewer': {
    title: 'Free EXIF Data Viewer | itdocsy',
    description: 'View the hidden metadata (camera, date, GPS) inside any photo, free and private.',
  },
  '/edit-pdf': {
    title: 'Edit PDF Online Free | itdocsy',
    description: 'Add text, shapes, and annotations to a PDF for free, directly in your browser.',
  },
  '/word-to-pdf': {
    title: 'Convert Word to PDF Online Free | itdocsy',
    description: 'Turn a Word document into a PDF for free, processed entirely in your browser.',
  },
  '/add-blank-page': {
    title: 'Add Blank Page to PDF Online Free | itdocsy',
    description: 'Insert a blank page anywhere in a PDF for free, in your browser.',
  },
  '/reorder-pdf-pages': {
    title: 'Reorder PDF Pages Online Free | itdocsy',
    description: 'Drag and drop to rearrange PDF pages for free, right in your browser.',
  },
  '/sign-pdf': {
    title: 'Sign PDF Online Free — E-Signature | itdocsy',
    description: 'Add your signature to a PDF for free, drawn and placed directly in your browser.',
  },
  '/pdf-metadata-editor': {
    title: 'Edit PDF Metadata Online Free | itdocsy',
    description: 'Change the title, author, and other metadata of a PDF for free, in your browser.',
  },
  '/grayscale-pdf': {
    title: 'Convert PDF to Grayscale Online Free | itdocsy',
    description: 'Turn a color PDF into grayscale/black-and-white for free, processed in your browser.',
  },
  '/pdf-info': {
    title: 'View PDF File Info Online Free | itdocsy',
    description: 'Check page count, size, version, and metadata of any PDF for free, instantly.',
  },
  '/pdf-to-word': {
    title: 'Convert PDF to Word Online Free | itdocsy',
    description: 'Turn a PDF into an editable Word document for free, processed entirely in your browser.',
  },
  '/pdf-to-excel': {
    title: 'Convert PDF to Excel Online Free | itdocsy',
    description: 'Extract tables from a PDF into an editable Excel file for free, in your browser.',
  },
  '/excel-to-pdf': {
    title: 'Convert Excel to PDF Online Free | itdocsy',
    description: 'Turn an Excel spreadsheet into a PDF for free, processed entirely in your browser.',
  },
  '/redact-pdf': {
    title: 'Redact PDF Online Free — Black Out Text | itdocsy',
    description: 'Permanently black out sensitive text or areas in a PDF for free, in your browser.',
  },
  '/fill-pdf-form': {
    title: 'Fill PDF Form Online Free | itdocsy',
    description: 'Fill out PDF form fields for free, directly in your browser, then download.',
  },
  '/compare-pdf': {
    title: 'Compare Two PDF Files Online Free | itdocsy',
    description: 'Spot the differences between two PDF files for free, side by side in your browser.',
  },
  '/pdf-to-powerpoint': {
    title: 'Convert PDF to PowerPoint Online Free | itdocsy',
    description: 'Turn a PDF into an editable PowerPoint presentation for free, in your browser.',
  },
  '/powerpoint-to-pdf': {
    title: 'Convert PowerPoint to PDF Online Free | itdocsy',
    description: 'Turn a PowerPoint presentation into a PDF for free, processed entirely in your browser.',
  },
  '/pdf-to-text': {
    title: 'Convert PDF to Text Online Free | itdocsy',
    description: 'Extract plain text from any PDF for free, instantly, in your browser.',
  },
  '/background-remover': {
    title: 'Free Online Background Remover (AI) | itdocsy',
    description: 'Remove the background from any photo for free, right in your browser. AI-powered, no upload, transparent PNG output.',
  },
  '/heic-to-jpg': {
    title: 'Convert HEIC to JPG Online Free | itdocsy',
    description: 'Convert iPhone HEIC/HEIF photos to JPG for free, instantly, right in your browser. No upload required.',
  },
  '/webp-to-png': {
    title: 'Convert WebP to PNG Online Free | itdocsy',
    description: 'Convert WebP images to PNG for free, instantly, right in your browser. Transparency preserved, no upload required.',
  },
  '/png-to-webp': {
    title: 'Convert PNG to WebP Online Free | itdocsy',
    description: 'Convert PNG images to smaller WebP files for free, right in your browser. Transparency preserved, no upload required.',
  },
  '/privacy-policy': {
    title: 'Privacy Policy | itdocsy',
    description: 'How itdocsy handles your data — in short: your files never leave your device.',
  },
  '/terms-of-use': {
    title: 'Terms of Use | itdocsy',
    description: 'The terms that apply when you use itdocsy\u2019s free online tools.',
  },
  '/account': {
    title: 'My Account | itdocsy',
    description: 'Sign in or create a free itdocsy account.',
  },
};

export const DEFAULT_SEO = SEO_META['/'];
