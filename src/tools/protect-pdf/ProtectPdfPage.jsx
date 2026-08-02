import ProtectPdfTool from "./components/ProtectPdfTool";
import HowItWorks from "./components/HowItWorks";
import RequireSubscription from '../../shell/components/RequireSubscription';

export default function ProtectPdfPage() {
  return (
    <>
      <RequireSubscription toolSlug="protect-pdf"><ProtectPdfTool /></RequireSubscription>
      <HowItWorks />
    </>
  );
}
