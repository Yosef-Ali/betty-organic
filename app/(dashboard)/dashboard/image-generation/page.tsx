// import ImageGeneratorWrapper from '@/components/ImageGeneratorWrapper';

// export default function ImageGenerationPage() {
//   return (
//     <div className="container mx-auto py-8">
//       <h1 className="text-2xl font-bold mb-4">Image Generation</h1>
//       <ImageGeneratorWrapper
//         onImageGenerated={(result) => {
//           console.log('Generated image:', result);
//         }}
//       />
//     </div>
//   );
// }
import ImageGenerator from '@/components/ImageGenerator'; // Adjust path if needed


export default function ImageGenerationPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">Image Generation</h1>
      <ImageGenerator />
    </div>
  );
}
