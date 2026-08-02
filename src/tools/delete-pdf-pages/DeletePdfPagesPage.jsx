import DeletePdfPagesTool from "./components/DeletePdfPagesTool";
import HowItWorks from "./components/HowItWorks";
import RequireSubscription from '../../shell/components/RequireSubscription';

export default function DeletePdfPagesPage() {
  return (
    <>
      <RequireSubscription toolSlug="delete-pdf-pages"><DeletePdfPagesTool /></RequireSubscription>
      <HowItWorks />
    </>
  );
}
