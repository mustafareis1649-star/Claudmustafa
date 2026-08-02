import RotatePdfTool from "./components/RotatePdfTool";
import HowItWorks from "./components/HowItWorks";
import RequireSubscription from '../../shell/components/RequireSubscription';

export default function RotatePdfPage() {
  return (
    <>
      <RequireSubscription toolSlug="rotate-pdf"><RotatePdfTool /></RequireSubscription>
      <HowItWorks />
    </>
  );
}
