import CompressPdfTool from "./components/CompressPdfTool";
import HowItWorks from "./components/HowItWorks";
import RequireSubscription from '../../shell/components/RequireSubscription';

export default function CompressPdfPage() {
  return (
    <>
      <RequireSubscription toolSlug="compress-pdf"><CompressPdfTool /></RequireSubscription>
      <HowItWorks />
    </>
  );
}
