import GeminiImageGen from '@/components/GeminiImageGen';
import SimpleImageGenerator from '@/components/SimpleImageGenerator';

export default function ImageGenerationPage() {
  return (
    <div className="container mx-auto py-6 space-y-8">
      <h1 className="text-3xl font-bold">Image Generation</h1>
      <div className="space-y-12">
        <div>
          <h2 className="text-2xl font-semibold mb-4">Product Image Enhancement</h2>
          <SimpleImageGenerator />
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-4">Gemini Image Generation</h2>
          <GeminiImageGen apiKey={process.env.NEXT_PUBLIC_GEMINI_API_KEY || ""} />
        </div>
      </div>
    </div>
  );
}
