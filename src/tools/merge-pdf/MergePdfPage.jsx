import MergePdfTool from "./components/MergePdfTool";
import HowItWorks from "./components/HowItWorks";
import RequireSubscription from '../../shell/components/RequireSubscription';

export default function MergePdfPage() {
  return (
    <>
      <RequireSubscription toolSlug="merge-pdf"><MergePdfTool /></RequireSubscription>
      <HowItWorks />
    </>
  );
}
