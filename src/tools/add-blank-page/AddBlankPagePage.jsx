import AddBlankPageTool from './components/AddBlankPageTool';
import HowItWorks from './components/HowItWorks';
import RequireSubscription from '../../shell/components/RequireSubscription';

// Bundles this tool's Tool + HowItWorks into one component, so App.jsx can
// lazy-load the whole page as a single chunk instead of two.
export default function AddBlankPagePage() {
  return (
    <>
      <RequireSubscription toolSlug="add-blank-page"><AddBlankPageTool /></RequireSubscription>
      <HowItWorks />
    </>
  );
}
