import PdfToExcelTool from './components/PdfToExcelTool';
import HowItWorks from './components/HowItWorks';
import RequireSubscription from '../../shell/components/RequireSubscription';

export default function PdfToExcelPage() {
  return (
    <>
      <RequireSubscription toolSlug="pdf-to-excel"><PdfToExcelTool /></RequireSubscription>
      <HowItWorks />
    </>
  );
}
