import BatchResizeTool from './components/BatchResizeTool';
import HowItWorks from './components/HowItWorks';
import RequireSubscription from '../../shell/components/RequireSubscription';

// Bundles this tool's Tool + HowItWorks into one component, so App.jsx can
// lazy-load the whole page as a single chunk instead of two.
export default function BatchResizePage() {
  return (
    <>
      <RequireSubscription toolSlug="batch-resize"><BatchResizeTool /></RequireSubscription>
      <HowItWorks />
    </>
  );
}
