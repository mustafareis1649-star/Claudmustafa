import CollageMakerTool from './components/CollageMakerTool';
import HowItWorks from './components/HowItWorks';
import RequireSubscription from '../../shell/components/RequireSubscription';

export default function CollageMakerPage() {
  return (
    <>
      <RequireSubscription toolSlug="collage-maker"><CollageMakerTool /></RequireSubscription>
      <HowItWorks />
    </>
  );
}
