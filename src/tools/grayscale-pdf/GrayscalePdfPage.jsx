import GrayscalePdfTool from "./components/GrayscalePdfTool";
import HowItWorks from "./components/HowItWorks";
import RequireSubscription from '../../shell/components/RequireSubscription';

export default function GrayscalePdfPage() {
  return (
    <>
      <RequireSubscription toolSlug="grayscale-pdf"><GrayscalePdfTool /></RequireSubscription>
      <HowItWorks />
    </>
  );
}
