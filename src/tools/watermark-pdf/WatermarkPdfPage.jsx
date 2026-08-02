import WatermarkPdfTool from "./components/WatermarkPdfTool";
import HowItWorks from "./components/HowItWorks";
import RequireSubscription from '../../shell/components/RequireSubscription';

export default function WatermarkPdfPage() {
  return (
    <>
      <RequireSubscription toolSlug="watermark-pdf"><WatermarkPdfTool /></RequireSubscription>
      <HowItWorks />
    </>
  );
}
