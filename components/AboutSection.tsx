import Image from 'next/image';
import { getAbout } from '@/app/actions/aboutActions';
import { revalidatePath } from 'next/cache';

export async function AboutSection(): Promise<JSX.Element> {
  // Default content if no dynamic content is available
  const defaultContent = {
    title: 'About Betty&apos;s Organic',
    content: `At Betty&apos;s Organic, we&apos;re passionate about bringing you the freshest, most nutritious produce straight from local farms. Our commitment to organic farming practices ensures that every fruit and vegetable is grown without harmful chemicals, preserving both your health and the environment.\n\nFounded in 2010, we&apos;ve grown from a small family farm to a trusted source for organic produce in the community. Our team carefully selects each item, ensuring only the highest quality reaches your table.`,
    images: [
      'https://images.unsplash.com/photo-1554080353-a576cf803bda?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=3387&q=80',
      'https://images.unsplash.com/photo-1505144808419-1957a94ca61e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=3070&q=80',
      'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=3540&q=80',
    ],
  };

  try {
    const aboutContent = await getAbout();
    const { title, content, images } = aboutContent ?? defaultContent;
    const paragraphs = content.split('\n\n');

    return (
      <section className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        {/* Text Content Column */}
        <div className="space-y-6">
          <h2 className="text-4xl font-bold">{title}</h2>
          {paragraphs.map((paragraph: string, index: number) => (
            <p key={index} className="text-lg">
              {paragraph}
            </p>
          ))}
        </div>

        {/* Image Gallery Column */}
        <div className="grid grid-cols-2 gap-4">
          {images.slice(0, 2).map((image: string, index: number) => (
            <div
              key={index}
              className="relative h-64 rounded-lg overflow-hidden"
            >
              <Image
                src={image}
                alt={`About image ${index + 1}`}
                fill
                className="object-cover"
              />
            </div>
          ))}
          {images[2] && (
            <div className="relative h-64 rounded-lg overflow-hidden col-span-2">
              <Image
                src={images[2]}
                alt="About image 3"
                fill
                className="object-cover"
              />
            </div>
          )}
        </div>
      </section>
    );
  } catch (error) {
    console.error('Error in AboutSection:', error);
    return (
      <section className="p-4 text-center">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <h2 className="text-red-800 text-lg font-semibold">
            Temporarily Unavailable
          </h2>
          <p className="text-red-600 mt-2">
            We&apos;re experiencing technical difficulties. Please try again
            later.
          </p>
        </div>
      </section>
    );
  }
}
