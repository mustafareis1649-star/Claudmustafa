import PdfInfoTool from "./components/PdfInfoTool";
import HowItWorks from "./components/HowItWorks";
import RequireSubscription from '../../shell/components/RequireSubscription';

export default function PdfInfoPage() {
  return (
    <>
      <RequireSubscription toolSlug="pdf-info"><PdfInfoTool /></RequireSubscription>
      <HowItWorks />
    </>
  );
}
