import ColorPaletteGeneratorTool from './components/ColorPaletteGeneratorTool';
import HowItWorks from './components/HowItWorks';
import RequireSubscription from '../../shell/components/RequireSubscription';

// Bundles this tool's Tool + HowItWorks into one component, so App.jsx can
// lazy-load the whole page as a single chunk instead of two.
export default function ColorPaletteGeneratorPage() {
  return (
    <>
      <RequireSubscription toolSlug="color-palette-generator"><ColorPaletteGeneratorTool /></RequireSubscription>
      <HowItWorks />
    </>
  );
}
