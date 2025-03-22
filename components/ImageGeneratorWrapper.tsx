'use client';

import dynamic from 'next/dynamic';

const ImageGenerator = dynamic(() => import('./ImageGenerator'), {
  ssr: false,
  loading: () => <div>Loading...</div>
});

interface ImageGeneratorWrapperProps {
  onImageGenerated?: (result: any) => void;
}

export default function ImageGeneratorWrapper(props: ImageGeneratorWrapperProps) {
  return <ImageGenerator {...props} />;
}
