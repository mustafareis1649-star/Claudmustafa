import PdfWorkspaceTool from './components/PdfWorkspaceTool';
import MorePdfTools from './components/MorePdfTools';
import HowItWorks from './components/HowItWorks';
import TrustBar from '../../shell/components/TrustBar';
import PopularTools from '../../shell/components/PopularTools';
import BigStats from '../../shell/components/BigStats';
import RequireSubscription from '../../shell/components/RequireSubscription';

// Bundles this tool's Tool + HowItWorks into one component, so App.jsx can
// lazy-load the whole page as a single chunk instead of two. The homepage
// ("/") additionally gets the marketing sections (trust bar, popular tools,
// big stats strip) that the other tool pages don't need.
//
// PdfWorkspaceTool is the iLovePDF-style unified experience: upload one PDF
// and every PDF operation (convert, merge, split, sign, watermark, protect,
// page management, etc.) is available as a tab on the same file, without
// leaving the page or re-uploading. 'Merge' and 'Sign' hand the loaded file
// off to their own dedicated pages (they need a richer, multi-file or
// canvas-based UI), everything else runs right here.
export default function PdfToolsPage() {
  return (
    <>
      <RequireSubscription toolSlug="pdf-workspace"><PdfWorkspaceTool /></RequireSubscription>
      <TrustBar />
      <MorePdfTools />
      <PopularTools />
      <BigStats />
      <HowItWorks />
    </>
  );
}
