import PdfToWordTool from '../pdf-tools/components/PdfToWordTool';
import HowItWorks from '../pdf-tools/components/HowItWorks';
import RequireSubscription from '../../shell/components/RequireSubscription';

// PDF to Word already exists as a fully-built component (and its own i18n
// copy) inside tools/pdf-tools/ — it's the same conversion used as the
// "To Word" tab in the homepage's unified workspace. This page just gives it
// a dedicated route/URL (/pdf-to-word) so it can be linked to directly and
// listed as its own card, without duplicating the component or i18n dict.
export default function PdfToWordPage() {
  return (
    <>
      <RequireSubscription toolSlug="pdf-to-word"><PdfToWordTool /></RequireSubscription>
      <HowItWorks />
    </>
  );
}
