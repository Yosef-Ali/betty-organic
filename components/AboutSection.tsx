'use client';

import { getAbout } from '@/app/actions/aboutActions';
import type { AboutContent } from '@/app/actions/aboutActions';
import { useEffect, useState, useRef } from 'react';

export function AboutSection() {
  const [aboutData, setAboutData] = useState<AboutContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [videoError, setVideoError] = useState<Record<string, boolean>>({});
  const [imageError, setImageError] = useState<Record<string, boolean>>({});
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({});

  // Ensure we always have Betty's video available - but don't reference it directly in useEffect
  const bettyVideo = useRef("https://xmumlfgzvrliepxcjqil.supabase.co/storage/v1/object/public/about_images//bettys.mp4");
  const videoRefs = useRef<Record<string, HTMLVideoElement>>({});

  // Function to set initial video position (30% through the video)
  const setInitialVideoPosition = (videoElement: HTMLVideoElement) => {
    const setPosition = () => {
      if (videoElement.readyState >= 2) {
        // Set to 30% of video duration for a better preview frame
        videoElement.currentTime = videoElement.duration * 0.1;
        videoElement.pause();
      }
    };

    // Try to set position immediately if video is loaded
    setPosition();

    // Also listen for loadedmetadata in case video isn't loaded yet
    videoElement.addEventListener('loadedmetadata', setPosition);
  };

  // Function to generate video thumbnail at 30% position
  const generateThumbnail = (videoUrl: string, videoElement: HTMLVideoElement) => {
    if (videoElement.readyState >= 2) {
      // Set to 30% of the duration for thumbnail
      videoElement.currentTime = videoElement.duration * 0.01;

      // Create canvas and draw video frame
      const canvas = document.createElement('canvas');
      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
        const thumbnailUrl = canvas.toDataURL();
        setThumbnails(prev => ({
          ...prev,
          [videoUrl]: thumbnailUrl
        }));
      }
    }
  };

  const handleVideoLoad = (videoUrl: string, videoElement: HTMLVideoElement) => {
    generateThumbnail(videoUrl, videoElement);
    setInitialVideoPosition(videoElement);
  };

  const handleVideoHover = (videoUrl: string, isHovering: boolean) => {
    const videoElement = videoRefs.current[videoUrl];
    if (!videoElement) return;

    if (isHovering) {
      videoElement.play().catch(err => {
        console.error("Error playing video:", err);
      });
    } else {
      videoElement.pause();
      // Set back to 30% position when hover ends
      if (videoElement.duration) {
        videoElement.currentTime = videoElement.duration * 0.01;
      }
    }
  };

  useEffect(() => {
    const fetchAboutData = async () => {
      try {
        const data = await getAbout();

        // If data exists but no videos are present, add Betty's video
        if (data) {
          // Ensure videos array exists
          if (!data.videos) {
            data.videos = [];
          }

          const videoUrl = bettyVideo.current;

          // Add Betty's video if it doesn't exist in the array
          if (!data.videos.includes(videoUrl)) {
            data.videos = [...data.videos, videoUrl];
          }

          // Ensure images array exists
          if (!data.images) {
            data.images = [];
          }
        }

        setAboutData(data);
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
    title: 'About Betty\'s Organic',
    content: `At Betty's Organic, we're passionate about bringing you the freshest, most nutritious produce straight from local farms. Our commitment to organic farming practices ensures that every fruit and vegetable is grown without harmful chemicals, preserving both your health and the environment.\n\nFounded in 2010, we've grown from a small family farm to a trusted source for organic produce in the community. Our team carefully selects each item, ensuring only the highest quality reaches your table.`,
    images: [
      'https://images.unsplash.com/photo-1554080353-a576cf803bda?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=3387&q=80',
      'https://images.unsplash.com/photo-1505144808419-1957a94ca61e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=3070&q=80',
      'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=3540&q=80',
    ],
    videos: [bettyVideo.current],
  };

  // Use database content if available, otherwise fall back to default
  const content = aboutData ?? defaultContent;
  const paragraphs = content.content.split('\n\n');

  // Check if we have valid videos to display
  const hasVideos = content.videos && content.videos.length > 0;

  // Error handler functions
  const handleVideoError = (videoUrl: string) => {
    console.error(`Failed to load video: ${videoUrl}`);
    setVideoError(prev => ({ ...prev, [videoUrl]: true }));
  };

  const handleImageError = (imageUrl: string) => {
    console.error(`Failed to load image: ${imageUrl}`);
    setImageError(prev => ({ ...prev, [imageUrl]: true }));
  };

  // Create a thumbnail from the first image when needed
  const getVideoPoster = () => {
    if (content.images && content.images.length > 0) {
      return content.images[0];
    }
    return '/public/video-thumbnail.png';
  };

  if (error) {
    return (
      <section className="p-4 text-center">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <h2 className="text-red-800 text-lg font-semibold">
            Temporarily Unavailable
          </h2>
          <p className="text-red-600 mt-2">
            We're experiencing technical difficulties. Please try again
            later.
          </p>
        </div>
      </section>
    );
  }

  if (loading) {
    return (
      <section className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        {/* Text Content Column Skeleton */}
        <div className="space-y-8">
          {/* Title skeleton with stronger presence */}
          <div className="h-12 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded-lg w-3/4 animate-shimmer"></div>

          {/* Paragraph skeletons with wave effect */}
          <div className="space-y-6">
            <div className="space-y-3">
              <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded w-full animate-shimmer"></div>
              <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded w-11/12 animate-shimmer delay-75"></div>
              <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded w-full animate-shimmer delay-150"></div>
            </div>
            <div className="space-y-3">
              <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded w-full animate-shimmer delay-200"></div>
              <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded w-4/5 animate-shimmer delay-300"></div>
            </div>
          </div>
        </div>

        {/* Media Gallery Column Skeleton */}
        <div className="grid grid-cols-2 gap-4">
          {/* First row skeletons with shimmer effect */}
          <div className="h-64 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded-lg animate-shimmer"></div>
          <div className="h-64 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded-lg animate-shimmer relative">
            {/* Play button skeleton with subtle pulse */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-gray-300 via-gray-400 to-gray-300 animate-pulse"></div>
            </div>
          </div>

          {/* Second row skeleton - full width with shimmer */}
          <div className="h-64 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded-lg animate-shimmer delay-150 col-span-2"></div>
        </div>
      </section>
    );
  }

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
        {/* Top row: First image (if available) and video */}
        {content.images.length > 0 && !imageError[content.images[0]] && (
          <div className="relative h-64 rounded-lg overflow-hidden">
            <img
              src={content.images[0]}
              alt="About image 1"
              className="w-full h-full object-cover"
              onError={() => handleImageError(content.images[0])}
            />
          </div>
        )}

        {/* Betty's video with centered play icon */}
        {hasVideos && content.videos[0] && !videoError[content.videos[0]] && (
          <div
            className="relative h-64 rounded-lg overflow-hidden cursor-pointer group"
            onMouseEnter={() => handleVideoHover(content.videos[0], true)}
            onMouseLeave={() => handleVideoHover(content.videos[0], false)}
          >
            <video
              ref={(el) => {
                if (el) {
                  videoRefs.current[content.videos[0]] = el;
                  el.addEventListener('loadedmetadata', () => handleVideoLoad(content.videos[0], el));
                }
              }}
              src={content.videos[0]}
              className="w-full h-full object-cover"
              onError={() => handleVideoError(content.videos[0])}
              poster={thumbnails[content.videos[0]]}
              loop
              muted
              playsInline
              preload="metadata"
            >
              Your browser does not support the video tag.
            </video>
            {/* Centered play icon with semi-transparent background */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-12 h-12 flex items-center justify-center opacity-60 group-hover:opacity-0 transition-all duration-300 bg-black bg-opacity-40 rounded-full">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="white"
                  className="w-7 h-7"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>
            {/* Hover effect overlay */}
            <div className="absolute inset-0 bg-black bg-opacity-30 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>
        )}

        {/* Bottom row: show second image if we have it */}
        {content.images.length > 1 && !imageError[content.images[1]] && !(content.videos?.length > 1) && (
          <div className={`relative h-64 rounded-lg overflow-hidden ${content.videos?.length > 1 ? '' : 'col-span-2'}`}>
            <img
              src={content.images[1]}
              alt="About image 2"
              className="w-full h-full object-cover"
              onError={() => handleImageError(content.images[1])}
            />
          </div>
        )}

        {/* Second video with the same centered play icon style */}
        {content.videos && content.videos.length > 1 && !videoError[content.videos[1]] && (
          <div
            className="relative h-64 rounded-lg overflow-hidden cursor-pointer group col-span-2"
            onMouseEnter={() => handleVideoHover(content.videos[1], true)}
            onMouseLeave={() => handleVideoHover(content.videos[1], false)}
          >
            <video
              ref={(el) => {
                if (el) {
                  videoRefs.current[content.videos[1]] = el;
                  el.addEventListener('loadedmetadata', () => handleVideoLoad(content.videos[1], el));
                }
              }}
              src={content.videos[1]}
              className="w-full h-full object-cover"
              onError={() => handleVideoError(content.videos[1])}
              poster={thumbnails[content.videos[1]]}
              loop
              muted
              playsInline
              preload="metadata"
            >
              Your browser does not support the video tag.
            </video>
            {/* Centered play icon with semi-transparent background */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-12 h-12 flex items-center justify-center opacity-60 group-hover:opacity-0 transition-all duration-300 bg-black bg-opacity-40 rounded-full">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="white"
                  className="w-7 h-7"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>
            {/* Hover effect overlay */}
            <div className="absolute inset-0 bg-black bg-opacity-30 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>
        )}

        {/* If we have a third image and no second video, show it in bottom row */}
        {content.images.length > 2 && !imageError[content.images[2]] && !(content.videos?.length > 1) && (
          <div className="relative h-64 rounded-lg overflow-hidden col-span-2">
            <img
              src={content.images[2]}
              alt="About image 3"
              className="w-full h-full object-cover"
              onError={() => handleImageError(content.images[2])}
            />
          </div>
        )}
      </div>
    </section>
  );
}
