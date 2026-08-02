import ExifViewerTool from './components/ExifViewerTool';
import HowItWorks from './components/HowItWorks';
import RequireSubscription from '../../shell/components/RequireSubscription';

export default function ExifViewerPage() {
  return (
    <>
      <RequireSubscription toolSlug="exif-viewer"><ExifViewerTool /></RequireSubscription>
      <HowItWorks />
    </>
  );
}
