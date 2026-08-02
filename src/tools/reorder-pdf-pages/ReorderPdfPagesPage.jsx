import ReorderPdfPagesTool from './components/ReorderPdfPagesTool';
import HowItWorks from './components/HowItWorks';
import RequireSubscription from '../../shell/components/RequireSubscription';

// Bundles this tool's Tool + HowItWorks into one component, so App.jsx can
// lazy-load the whole page as a single chunk instead of two.
export default function ReorderPdfPagesPage() {
  return (
    <>
      <RequireSubscription toolSlug="reorder-pdf-pages"><ReorderPdfPagesTool /></RequireSubscription>
      <HowItWorks />
    </>
  );
}
