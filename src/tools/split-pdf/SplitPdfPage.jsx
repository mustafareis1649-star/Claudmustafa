import SplitPdfTool from "./components/SplitPdfTool";
import HowItWorks from "./components/HowItWorks";
import RequireSubscription from '../../shell/components/RequireSubscription';

export default function SplitPdfPage() {
  return (
    <>
      <RequireSubscription toolSlug="split-pdf"><SplitPdfTool /></RequireSubscription>
      <HowItWorks />
    </>
  );
}
