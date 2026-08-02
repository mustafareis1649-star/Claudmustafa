import ImageWatermarkTool from './components/ImageWatermarkTool';
import HowItWorks from './components/HowItWorks';
import RequireSubscription from '../../shell/components/RequireSubscription';

export default function ImageWatermarkPage() {
  return (
    <>
      <RequireSubscription toolSlug="image-watermark"><ImageWatermarkTool /></RequireSubscription>
      <HowItWorks />
    </>
  );
}
