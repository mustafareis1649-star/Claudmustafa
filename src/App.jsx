import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Header from './shell/components/Header';
import Footer from './shell/components/Footer';
import ScrollToTop from './shell/components/ScrollToTop';
import SeoManager from './shell/seo/SeoManager';
import FaqSection from './shell/components/FaqSection';

// Each tool is its own chunk, only downloaded when a visitor actually opens
// that tool's page. With 50-60 tools planned, this is what keeps the first
// page load small instead of shipping every tool's code up front.
const PdfToolsPage = lazy(() => import('./tools/pdf-tools/PdfToolsPage'));
const PhotoEditorPage = lazy(() => import('./tools/photo-editor/PhotoEditorPage'));
const VectorEditorPage = lazy(() => import('./tools/vector-editor/VectorEditorPage'));
const VideoEditorPage = lazy(() => import('./tools/video-editor/VideoEditorPage'));
const AudioTrimmerPage = lazy(() => import('./tools/audio-trimmer/AudioTrimmerPage'));
const BatchResizePage = lazy(() => import('./tools/batch-resize/BatchResizePage'));
const SocialPostMakerPage = lazy(() => import('./tools/social-post-maker/SocialPostMakerPage'));
const WordCounterPage = lazy(() => import('./tools/word-counter/WordCounterPage'));
const MergePdfPage = lazy(() => import('./tools/merge-pdf/MergePdfPage'));
const SplitPdfPage = lazy(() => import('./tools/split-pdf/SplitPdfPage'));
const CompressPdfPage = lazy(() => import('./tools/compress-pdf/CompressPdfPage'));
const RotatePdfPage = lazy(() => import('./tools/rotate-pdf/RotatePdfPage'));
const WatermarkPdfPage = lazy(() => import('./tools/watermark-pdf/WatermarkPdfPage'));
const ProtectPdfPage = lazy(() => import('./tools/protect-pdf/ProtectPdfPage'));
const PdfToJpgPage = lazy(() => import('./tools/pdf-to-jpg/PdfToJpgPage'));
const JpgToPdfPage = lazy(() => import('./tools/jpg-to-pdf/JpgToPdfPage'));
const DeletePdfPagesPage = lazy(() => import('./tools/delete-pdf-pages/DeletePdfPagesPage'));
const PdfToPngPage = lazy(() => import('./tools/pdf-to-png/PdfToPngPage'));
const ImageToPdfPage = lazy(() => import('./tools/image-to-pdf/ImageToPdfPage'));
const ExtractPdfPagesPage = lazy(() => import('./tools/extract-pdf-pages/ExtractPdfPagesPage'));
const ImageCompressorPage = lazy(() => import('./tools/image-compressor/ImageCompressorPage'));
const QrCodeGeneratorPage = lazy(() => import('./tools/qr-code-generator/QrCodeGeneratorPage'));
const AddPageNumbersPage = lazy(() => import('./tools/add-page-numbers/AddPageNumbersPage'));
const FaviconGeneratorPage = lazy(() => import('./tools/favicon-generator/FaviconGeneratorPage'));
const PasswordGeneratorPage = lazy(() => import('./tools/password-generator/PasswordGeneratorPage'));
const ColorPaletteGeneratorPage = lazy(() => import('./tools/color-palette-generator/ColorPaletteGeneratorPage'));
const RotateImagePage = lazy(() => import('./tools/rotate-image/RotateImagePage'));
const BrightnessContrastPage = lazy(() => import('./tools/brightness-contrast/BrightnessContrastPage'));
const ImageWatermarkPage = lazy(() => import('./tools/image-watermark/ImageWatermarkPage'));
const CollageMakerPage = lazy(() => import('./tools/collage-maker/CollageMakerPage'));
const ExifViewerPage = lazy(() => import('./tools/exif-viewer/ExifViewerPage'));
const EditPdfPage = lazy(() => import('./tools/edit-pdf/EditPdfPage'));
const WordToPdfPage = lazy(() => import('./tools/word-to-pdf/WordToPdfPage'));
const AddBlankPagePage = lazy(() => import('./tools/add-blank-page/AddBlankPagePage'));
const ReorderPdfPagesPage = lazy(() => import('./tools/reorder-pdf-pages/ReorderPdfPagesPage'));
const SignPdfPage = lazy(() => import('./tools/sign-pdf/SignPdfPage'));
const PdfMetadataEditorPage = lazy(() => import('./tools/pdf-metadata-editor/PdfMetadataEditorPage'));
const GrayscalePdfPage = lazy(() => import('./tools/grayscale-pdf/GrayscalePdfPage'));
const PdfInfoPage = lazy(() => import('./tools/pdf-info/PdfInfoPage'));
const PdfToWordPage = lazy(() => import('./tools/pdf-to-word/PdfToWordPage'));
const PdfToExcelPage = lazy(() => import('./tools/pdf-to-excel/PdfToExcelPage'));
const ExcelToPdfPage = lazy(() => import('./tools/excel-to-pdf/ExcelToPdfPage'));
const RedactPdfPage = lazy(() => import('./tools/redact-pdf/RedactPdfPage'));
const FillPdfFormPage = lazy(() => import('./tools/fill-pdf-form/FillPdfFormPage'));
const ComparePdfPage = lazy(() => import('./tools/compare-pdf/ComparePdfPage'));
const PdfToPowerpointPage = lazy(() => import('./tools/pdf-to-powerpoint/PdfToPowerpointPage'));
const PowerpointToPdfPage = lazy(() => import('./tools/powerpoint-to-pdf/PowerpointToPdfPage'));
const PdfToTextPage = lazy(() => import('./tools/pdf-to-text/PdfToTextPage'));
const BackgroundRemoverPage = lazy(() => import('./tools/background-remover/BackgroundRemoverPage'));
const HeicToJpgPage = lazy(() => import('./tools/heic-to-jpg/HeicToJpgPage'));
const WebpToPngPage = lazy(() => import('./tools/webp-to-png/WebpToPngPage'));
const PngToWebpPage = lazy(() => import('./tools/png-to-webp/PngToWebpPage'));
const PrivacyPolicyPage = lazy(() => import('./legal/PrivacyPolicyPage'));
const TermsOfUsePage = lazy(() => import('./legal/TermsOfUsePage'));

// Single place to register a tool's route. To add a new tool: create its
// Page wrapper (Tool + HowItWorks, see tools/pdf-tools/PdfToolsPage.jsx for
// the pattern — or run `node scripts/create-tool.js <slug> <Name> "<label>"`),
// lazy-import it above, and add one line here.
const TOOL_ROUTES = [
  { path: '/', Page: PdfToolsPage },
  { path: '/photo-editor', Page: PhotoEditorPage },
  { path: '/vector-editor', Page: VectorEditorPage },
  { path: '/video-editor', Page: VideoEditorPage },
  { path: '/audio-trimmer', Page: AudioTrimmerPage },
  { path: '/batch-resize', Page: BatchResizePage },
  { path: '/social-post-maker', Page: SocialPostMakerPage },
  { path: '/word-counter', Page: WordCounterPage },
  { path: '/merge-pdf', Page: MergePdfPage },
  { path: '/split-pdf', Page: SplitPdfPage },
  { path: '/compress-pdf', Page: CompressPdfPage },
  { path: '/rotate-pdf', Page: RotatePdfPage },
  { path: '/watermark-pdf', Page: WatermarkPdfPage },
  { path: '/protect-pdf', Page: ProtectPdfPage },
  { path: '/pdf-to-jpg', Page: PdfToJpgPage },
  { path: '/jpg-to-pdf', Page: JpgToPdfPage },
  { path: '/delete-pdf-pages', Page: DeletePdfPagesPage },
  { path: '/pdf-to-png', Page: PdfToPngPage },
  { path: '/image-to-pdf', Page: ImageToPdfPage },
  { path: '/extract-pdf-pages', Page: ExtractPdfPagesPage },
  { path: '/image-compressor', Page: ImageCompressorPage },
  { path: '/qr-code-generator', Page: QrCodeGeneratorPage },
  { path: '/add-page-numbers', Page: AddPageNumbersPage },
  { path: '/favicon-generator', Page: FaviconGeneratorPage },
  { path: '/password-generator', Page: PasswordGeneratorPage },
  { path: '/color-palette-generator', Page: ColorPaletteGeneratorPage },
  { path: '/rotate-image', Page: RotateImagePage },
  { path: '/brightness-contrast', Page: BrightnessContrastPage },
  { path: '/image-watermark', Page: ImageWatermarkPage },
  { path: '/collage-maker', Page: CollageMakerPage },
  { path: '/exif-viewer', Page: ExifViewerPage },
  { path: '/edit-pdf', Page: EditPdfPage },
  { path: '/word-to-pdf', Page: WordToPdfPage },
  { path: '/add-blank-page', Page: AddBlankPagePage },
  { path: '/reorder-pdf-pages', Page: ReorderPdfPagesPage },
  { path: '/sign-pdf', Page: SignPdfPage },
  { path: '/pdf-metadata-editor', Page: PdfMetadataEditorPage },
  { path: '/grayscale-pdf', Page: GrayscalePdfPage },
  { path: '/pdf-info', Page: PdfInfoPage },
  { path: '/pdf-to-word', Page: PdfToWordPage },
  { path: '/pdf-to-excel', Page: PdfToExcelPage },
  { path: '/excel-to-pdf', Page: ExcelToPdfPage },
  { path: '/redact-pdf', Page: RedactPdfPage },
  { path: '/fill-pdf-form', Page: FillPdfFormPage },
  { path: '/compare-pdf', Page: ComparePdfPage },
  { path: '/pdf-to-powerpoint', Page: PdfToPowerpointPage },
  { path: '/powerpoint-to-pdf', Page: PowerpointToPdfPage },
  { path: '/pdf-to-text', Page: PdfToTextPage },
  { path: '/background-remover', Page: BackgroundRemoverPage },
  { path: '/heic-to-jpg', Page: HeicToJpgPage },
  { path: '/webp-to-png', Page: WebpToPngPage },
  { path: '/png-to-webp', Page: PngToWebpPage },
  { path: '/privacy-policy', Page: PrivacyPolicyPage },
  { path: '/terms-of-use', Page: TermsOfUsePage },
];

function RouteFallback() {
  // Deliberately minimal — this only flashes for the brief moment a tool
  // chunk is downloading, so it shouldn't fight for attention.
  return (
    <div className="wrap" style={{ padding: '96px 0', textAlign: 'center', color: 'var(--text-3)' }}>
      …
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <SeoManager />
      <Header />
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          {TOOL_ROUTES.map(({ path, Page }) => (
            <Route key={path} path={path} element={<Page />} />
          ))}
        </Routes>
      </Suspense>
      <FaqSection />
      <Footer />
    </BrowserRouter>
  );
}
