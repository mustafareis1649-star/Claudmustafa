import BrightnessContrastTool from './components/BrightnessContrastTool';
import HowItWorks from './components/HowItWorks';
import RequireSubscription from '../../shell/components/RequireSubscription';

export default function BrightnessContrastPage() {
  return (
    <>
      <RequireSubscription toolSlug="brightness-contrast"><BrightnessContrastTool /></RequireSubscription>
      <HowItWorks />
    </>
  );
}
