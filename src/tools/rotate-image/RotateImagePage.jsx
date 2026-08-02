import RotateImageTool from './components/RotateImageTool';
import HowItWorks from './components/HowItWorks';
import RequireSubscription from '../../shell/components/RequireSubscription';

export default function RotateImagePage() {
  return (
    <>
      <RequireSubscription toolSlug="rotate-image"><RotateImageTool /></RequireSubscription>
      <HowItWorks />
    </>
  );
}
