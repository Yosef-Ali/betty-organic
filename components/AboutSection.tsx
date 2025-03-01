'use client';

import Image from 'next/image';
import { getAbout } from '@/app/actions/aboutActions';
import type { AboutContent } from '@/app/actions/aboutActions';
import { useEffect, useState } from 'react';

export function AboutSection() {
  const [aboutData, setAboutData] = useState<AboutContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [videoError, setVideoError] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchAboutData = async () => {
      try {
        const data = await getAbout() as AboutContent | null;

        // Handle the specific video URL
        if (data) {
          // Make sure videos array exists
          if (!Array.isArray(data.videos)) {
            data.videos = [];
          }

          // Add the existing video if not already in the array
          const existingVideoUrl = "https://xmumlfgzvrliepxcjqil.supabase.co/storage/v1/object/public/about_images//bettys.mp4";
          if (!data.videos.includes(existingVideoUrl)) {
            // Store locally but don't modify database directly
            setAboutData({
              ...data,
              videos: [...data.videos, existingVideoUrl]
            });
          } else {
            setAboutData(data);
          }
        } else {
          setAboutData(null);
        }
      } catch (err) {
        console.error('Error fetching about data:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchAboutData();
  }, []);

  // Default content if no dynamic content is available
  const defaultContent: AboutContent = {
    id: 'default',
    title: 'About Betty&apos;s Organic',
    content: `At Betty&apos;s Organic, we&apos;re passionate about bringing you the freshest, most nutritious produce straight from local farms. Our commitment to organic farming practices ensures that every fruit and vegetable is grown without harmful chemicals, preserving both your health and the environment.\n\nFounded in 2010, we&apos;ve grown from a small family farm to a trusted source for organic produce in the community. Our team carefully selects each item, ensuring only the highest quality reaches your table.`,
    images: [
      'https://images.unsplash.com/photo-1554080353-a576cf803bda?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=3387&q=80',
      'https://images.unsplash.com/photo-1505144808419-1957a94ca61e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=3070&q=80',
      'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=3540&q=80',
    ],
    videos: ["https://xmumlfgzvrliepxcjqil.supabase.co/storage/v1/object/public/about_images//bettys.mp4"],
  };

  const content = aboutData ?? defaultContent;
  const paragraphs = content.content.split('\n\n');

  if (error) {
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

  if (loading) {
    return (
      <section className="p-4 text-center">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3 mx-auto"></div>
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </section>
    );
  }

  // Handle video errors
  const handleVideoError = (videoUrl: string) => {
    setVideoError(prev => ({ ...prev, [videoUrl]: true }));
    console.error(`Failed to load video: ${videoUrl}`);
  };

  // Safely check for videos
  const videos = Array.isArray(content.videos) ? content.videos : [];
  const hasVideos = videos.length > 0;

  return (
    <section className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
      {/* Text Content Column */}
      <div className="space-y-6">
        <h2 className="text-4xl font-bold">{content.title}</h2>
        {paragraphs.map((paragraph: string, index: number) => (
          <p key={index} className="text-lg">
            {paragraph}
          </p>
        ))}
      </div>

      {/* Media Gallery Column - Images and Videos */}
      <div className="grid grid-cols-2 gap-4">
        {/* Display the first two media items (images or videos) */}
        {content.images.slice(0, hasVideos ? 1 : 2).map((image: string, index: number) => (
          <div
            key={`img-${index}`}
            className="relative h-64 rounded-lg overflow-hidden"
          >
            <img
              src={image}
              alt={`About image ${index + 1}`}
              className="w-full h-full object-cover"
            />
          </div>
        ))}

        {/* Display first video if available (takes one slot in top row) */}
        {videos[0] && !videoError[videos[0]] && (
          <div
            key="video-0"
            className="relative h-64 rounded-lg overflow-hidden"
          >
            <video
              src={videos[0]}
              controls
              className="w-full h-full object-cover"
              onError={() => handleVideoError(videos[0])}
              preload="metadata"
            >
              Your browser does not support the video tag.
            </video>
          </div>
        )}

        {/* Full width slot for third item (image or video) */}
        {content.images[2] && !videos[1] && (
          <div className="relative h-64 rounded-lg overflow-hidden col-span-2">
            <img
              src={content.images[2]}
              alt="About image 3"
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* If there's a second video, it gets the full width bottom row */}
        {videos[1] && !videoError[videos[1]] && (
          <div className="relative h-64 rounded-lg overflow-hidden col-span-2">
            <video
              src={videos[1]}
              controls
              className="w-full h-full object-cover"
              onError={() => handleVideoError(videos[1])}
              preload="metadata"
            >
              Your browser does not support the video tag.
            </video>
          </div>
        )}
      </div>
    </section>
  );
}
