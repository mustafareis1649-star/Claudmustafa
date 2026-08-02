import ExtractPdfPagesTool from "./components/ExtractPdfPagesTool";
import HowItWorks from "./components/HowItWorks";
import RequireSubscription from '../../shell/components/RequireSubscription';

export default function ExtractPdfPagesPage() {
  return (
    <>
      <RequireSubscription toolSlug="extract-pdf-pages"><ExtractPdfPagesTool /></RequireSubscription>
      <HowItWorks />
    </>
  );
}
