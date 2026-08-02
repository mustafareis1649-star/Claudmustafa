import PdfToJpgTool from "./components/PdfToJpgTool";
import HowItWorks from "./components/HowItWorks";
import RequireSubscription from '../../shell/components/RequireSubscription';

export default function PdfToJpgPage() {
  return (
    <>
      <RequireSubscription toolSlug="pdf-to-jpg"><PdfToJpgTool /></RequireSubscription>
      <HowItWorks />
    </>
  );
}
