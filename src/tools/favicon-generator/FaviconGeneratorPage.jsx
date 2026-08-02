import FaviconGeneratorTool from './components/FaviconGeneratorTool';
import HowItWorks from './components/HowItWorks';
import RequireSubscription from '../../shell/components/RequireSubscription';

// Bundles this tool's Tool + HowItWorks into one component, so App.jsx can
// lazy-load the whole page as a single chunk instead of two.
export default function FaviconGeneratorPage() {
  return (
    <>
      <RequireSubscription toolSlug="favicon-generator"><FaviconGeneratorTool /></RequireSubscription>
      <HowItWorks />
    </>
  );
}
