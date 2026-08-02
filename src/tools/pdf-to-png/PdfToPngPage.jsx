import PdfToPngTool from "./components/PdfToPngTool";
import HowItWorks from "./components/HowItWorks";
import RequireSubscription from '../../shell/components/RequireSubscription';

export default function PdfToPngPage() {
  return (
    <>
      <RequireSubscription toolSlug="pdf-to-png"><PdfToPngTool /></RequireSubscription>
      <HowItWorks />
    </>
  );
}
