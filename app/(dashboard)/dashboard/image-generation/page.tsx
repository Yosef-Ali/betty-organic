import ImageGenerator from '@/components/ImageGenerator';

export default function ImageGenerationPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">Image Generation</h1>
      <ImageGenerator
        onImageGenerated={(result) => {
          console.log('Generated image:', result);
        }}
      />
    </div>
  );
}
