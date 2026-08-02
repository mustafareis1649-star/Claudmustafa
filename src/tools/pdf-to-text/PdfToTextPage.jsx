import PdfToTextTool from './components/PdfToTextTool';
import HowItWorks from './components/HowItWorks';
import RequireSubscription from '../../shell/components/RequireSubscription';

// Bundles this tool's Tool + HowItWorks into one component, so App.jsx can
// lazy-load the whole page as a single chunk instead of two.
export default function PdfToTextPage() {
  return (
    <>
      <RequireSubscription toolSlug="pdf-to-text"><PdfToTextTool /></RequireSubscription>
      <HowItWorks />
    </>
  );
}
