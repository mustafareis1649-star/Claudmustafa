import JpgToPdfTool from "./components/JpgToPdfTool";
import HowItWorks from "./components/HowItWorks";
import RequireSubscription from '../../shell/components/RequireSubscription';

export default function JpgToPdfPage() {
  return (
    <>
      <RequireSubscription toolSlug="jpg-to-pdf"><JpgToPdfTool /></RequireSubscription>
      <HowItWorks />
    </>
  );
}
