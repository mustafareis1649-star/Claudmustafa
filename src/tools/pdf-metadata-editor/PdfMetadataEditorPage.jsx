import PdfMetadataEditorTool from "./components/PdfMetadataEditorTool";
import HowItWorks from "./components/HowItWorks";
import RequireSubscription from '../../shell/components/RequireSubscription';

export default function PdfMetadataEditorPage() {
  return (
    <>
      <RequireSubscription toolSlug="pdf-metadata-editor"><PdfMetadataEditorTool /></RequireSubscription>
      <HowItWorks />
    </>
  );
}
