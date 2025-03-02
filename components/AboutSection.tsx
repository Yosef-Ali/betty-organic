'use client';

import { getAbout } from '@/app/actions/aboutActions';
import type { AboutContent } from '@/app/actions/aboutActions';
import { useEffect, useState, useRef, useCallback } from 'react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { FacebookVideoCard } from '@/components/FacebookVideoCard';
import Image from 'next/image';

export function AboutSection() {
  // State declarations
  const [aboutData, setAboutData] = useState<AboutContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [videoError, setVideoError] = useState<Record<string, boolean>>({});
  const [videoLoading, setVideoLoading] = useState<Record<string, boolean>>({});
  const [imageError, setImageError] = useState<Record<string, boolean>>({});
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({});

  // Refs
  const bettyVideo = useRef("https://xmumlfgzvrliepxcjqil.supabase.co/storage/v1/object/public/about_images//bettys.mp4");
  const videoRefs = useRef<Record<string, HTMLVideoElement>>({});
  const loadedMetadataListeners = useRef<Record<string, () => void>>({});

  // Callback functions
  const setInitialVideoPosition = useCallback((videoElement: HTMLVideoElement) => {
    if (videoElement.readyState >= 2) {
      videoElement.currentTime = videoElement.duration * 0.1;
      videoElement.pause();
    }
  }, []);

  const generateThumbnail = useCallback((videoUrl: string, videoElement: HTMLVideoElement) => {
    console.log(`Attempting thumbnail generation for ${videoUrl}`);

    // Use a simpler approach that's less likely to fail
    const generateSimpleThumbnail = () => {
      try {
        // Just set a default thumbnail immediately to avoid black screens
        setThumbnails(prev => ({
          ...prev,
          [videoUrl]: "/images/video-thumbnail.jpg" // Make sure this file exists in your public folder
        }));

        // Skip the complex canvas drawing which is causing errors
        console.log(`Using fallback thumbnail for ${videoUrl}`);
        return true;
      } catch (error) {
        console.error("Error generating fallback thumbnail:", error);
        return false;
      }
    };

    // Immediately set fallback thumbnail
    generateSimpleThumbnail();

    // Try to generate actual thumbnail only if video is really ready
    if (videoElement && videoElement.readyState >= 2 && videoElement.videoWidth > 0) {
      try {
        // Set to a frame that's likely to have content
        videoElement.currentTime = 0.5;

        // Use setTimeout to wait for the currentTime to actually take effect
        setTimeout(() => {
          try {
            // Simple canvas operations with error handling
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            if (!ctx || videoElement.videoWidth <= 0) {
              console.log("Invalid context or video dimensions, using fallback");
              return;
            }

            // Use smallest possible dimensions to avoid memory issues
            const width = Math.min(videoElement.videoWidth, 320);
            const height = Math.min(videoElement.videoHeight, 240);

            canvas.width = width;
            canvas.height = height;

            // Draw with a try/catch in case it fails
            try {
              ctx.drawImage(videoElement, 0, 0, width, height);
              const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.7);

              setThumbnails(prev => ({
                ...prev,
                [videoUrl]: thumbnailUrl
              }));
              console.log(`Generated actual thumbnail for ${videoUrl}`);
            } catch (e) {
              console.warn("Failed to draw video to canvas:", e);
              // Fallback thumbnail already set, so no action needed
            }
          } catch (e) {
            console.warn("Error in thumbnail generation timeout:", e);
          }
        }, 500);
      } catch (e) {
        console.warn("Error setting video currentTime:", e);
      }
    }
  }, []);

  const handleVideoError = useCallback((videoUrl: string) => {
    console.error(`Failed to load video: ${videoUrl}`);
    // Clear existing iframe
    const iframe = document.querySelector(`iframe[src*="${videoUrl}"]`);
    if (iframe) {
      iframe.removeAttribute('src');
    }
    setVideoError(prev => ({ ...prev, [videoUrl]: true }));
    setVideoLoading(prev => ({ ...prev, [videoUrl]: false }));

    // Delay retry to prevent loop
    setTimeout(() => {
      setVideoError(prev => ({ ...prev, [videoUrl]: false }));
      setVideoLoading(prev => ({ ...prev, [videoUrl]: true }));
    }, 2000);
  }, []);

  const handleVideoLoad = useCallback((videoUrl: string, videoElement: HTMLVideoElement) => {
    // Generate thumbnail first
    generateThumbnail(videoUrl, videoElement);
    setInitialVideoPosition(videoElement);

    // Give a small delay before trying to play to allow thumbnail to be displayed
    setTimeout(() => {
      videoElement.play()
        .then(() => {
          console.log(`Video started playing: ${videoUrl}`);
        })
        .catch(err => {
          console.warn(`Auto-play prevented for ${videoUrl}:`, err);
        });
    }, 300);
    setVideoLoading(prev => ({ ...prev, [videoUrl]: false }));
  }, [generateThumbnail, setInitialVideoPosition]);

  const cleanupVideoResources = useCallback(() => {
    Object.entries(videoRefs.current).forEach(([url, videoEl]) => {
      if (videoEl) {
        const listener = loadedMetadataListeners.current[url];
        if (listener) {
          videoEl.removeEventListener('loadedmetadata', listener);
        }
        videoEl.pause();
        videoEl.removeAttribute('src');
        videoEl.load();
      }
    });
    videoRefs.current = {};
    loadedMetadataListeners.current = {};
  }, []);

  const handleImageError = useCallback((imageUrl: string) => {
    console.error(`Failed to load image: ${imageUrl}`);
    setImageError(prev => ({ ...prev, [imageUrl]: true }));
  }, []);

  // Effect hooks - place ALL useEffect hooks here in the same order they were originally defined
  useEffect(() => {
    const fetchAboutData = async () => {
      try {
        const data = await getAbout();

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

          console.log("Videos in content:", data.videos);

          // Initialize loading state for all videos
          data.videos.forEach((video: string) => {
            setVideoLoading(prev => ({ ...prev, [video]: true }));
          });

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

    return cleanupVideoResources;
  }, [cleanupVideoResources]);

  useEffect(() => {
    // Auto-play videos when they become available and are not loading or errored
    if (aboutData?.videos) {
      aboutData.videos.forEach((videoUrl: string) => {
        if (!videoLoading[videoUrl] && !videoError[videoUrl]) {
          const videoElement = videoRefs.current[videoUrl];
          if (videoElement && videoElement.paused && videoElement.readyState >= 2) {
            console.log(`Attempting to play video: ${videoUrl}`);
            videoElement.play()
              .then(() => console.log(`Successfully playing video: ${videoUrl}`))
              .catch(err => {
                console.error(`Error auto-playing video ${videoUrl}:`, err);

                // If autoplay fails, make sure thumbnail stays visible
                if (thumbnails[videoUrl]) {
                  const thumbnailImg = document.querySelector(`img[src="${thumbnails[videoUrl]}"]`);
                  if (thumbnailImg) {
                    (thumbnailImg as HTMLElement).style.opacity = '1';
                  }
                }
              });
          }
        }
      });
    }
  }, [aboutData?.videos, videoLoading, videoError, videoRefs, thumbnails]);

  // Default content if no dynamic content is available
  const defaultContent: AboutContent = {
    id: 'default',
    title: "About Betty's Organic",
    content: `At Betty's Organic, we're passionate about bringing you the freshest, most nutritious produce straight from local farms. Our commitment to organic farming practices ensures that every fruit and vegetable is grown without harmful chemicals, preserving both your health and the environment.\n\nFounded in 2010, we've grown from a small family farm to a trusted source for organic produce in the community. Our team carefully selects each item, ensuring only the highest quality reaches your table.`,
    images: [
      'https://images.unsplash.com/photo-1554080353-a576cf803bda?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=3387&q=80',
      'https://images.unsplash.com/photo-1505144808419-1957a94ca61e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=3070&q=80',
      'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=3540&q=80',
    ],
    videos: [bettyVideo.current],
  };

  const content = aboutData ?? defaultContent;
  const paragraphs = content.content.split('\n\n');
  const hasVideos = content.videos && content.videos.length > 0;

  if (error) {
    return (
      <section className="p-4 text-center">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <h2 className="text-red-800 text-lg font-semibold">
            Temporarily Unavailable
          </h2>
          <p className="text-red-600 mt-2">
            We're experiencing technical difficulties. Please try again later.
          </p>
        </div>
      </section>
    );
  }

  if (loading) {
    return (
      <section className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        <div className="space-y-8">
          <div className="h-12 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded-lg w-3/4 animate-shimmer"></div>
          <div className="space-y-6">
            <div className="space-y-3">
              <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded w-full animate-shimmer"></div>
              <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded w-11/12 animate-shimmer delay-75"></div>
              <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded w-full animate-shimmer delay-150"></div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="h-64 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded-lg animate-shimmer"></div>
          <div className="h-64 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded-lg animate-shimmer"></div>
          <div className="h-64 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded-lg animate-shimmer col-span-2"></div>
        </div>
      </section>
    );
  }

  const renderVideo = (videoUrl: string, isFullWidth = false) => {
    return (
      <div className="relative w-full h-full rounded-md overflow-hidden bg-black">
        {thumbnails[videoUrl] && (
          <img
            src={thumbnails[videoUrl]}
            alt="Video thumbnail"
            className={`absolute inset-0 w-full h-full object-cover ${videoLoading[videoUrl] ? 'opacity-100' : 'opacity-0 transition-opacity duration-700'}`}
          />
        )}
        <video
          ref={el => {
            if (el) {
              videoRefs.current[videoUrl] = el;
              if (!loadedMetadataListeners.current[videoUrl]) {
                const listener = () => {
                  handleVideoLoad(videoUrl, el);
                };
                loadedMetadataListeners.current[videoUrl] = listener;
                el.addEventListener('loadedmetadata', listener);

                el.addEventListener('playing', () => {
                  const thumbnailImg = document.querySelector(`img[src="${thumbnails[videoUrl]}"]`);
                  if (thumbnailImg) {
                    (thumbnailImg as HTMLElement).style.opacity = '0';
                  }
                });
              }
            }
          }}
          src={videoUrl}
          className="absolute inset-0 w-full h-full object-cover"
          playsInline
          muted
          loop
          preload="auto"
          onError={() => handleVideoError(videoUrl)}
        />
        {videoLoading[videoUrl] && !videoError[videoUrl] && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <LoadingSpinner />
          </div>
        )}
        {videoError[videoUrl] && (
          <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center">
            <div className="text-center text-white">
              <p className="text-sm">Video failed to load</p>
              <button
                className="mt-2 px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                onClick={() => {
                  setVideoError(prev => ({ ...prev, [videoUrl]: false }));
                  setVideoLoading(prev => ({ ...prev, [videoUrl]: true }));
                  const videoEl = videoRefs.current[videoUrl];
                  if (videoEl) {
                    videoEl.load();
                  }
                }}
              >
                Retry
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <section className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
      <div className="space-y-6">
        <h2 className="text-4xl font-bold">{content.title}</h2>
        {Array.isArray(content.content) ? (
          content.content.map((paragraph: string, index: number) => (
            <p key={index} className="mb-4 text-lg text-gray-600">
              {paragraph.replace("'", "&apos;")}
            </p>
          ))
        ) : typeof content.content === 'string' ? (
          content.content.split('\n\n').map((paragraph: string, index: number) => (
            <p key={index} className="mb-4 text-lg text-gray-600">
              {paragraph.replace("'", "&apos;")}
            </p>
          ))
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {content.images.length > 0 && !imageError[content.images[0]] && (
          <div className="relative h-64 rounded-lg overflow-hidden">
            <Image
              src={content.images[0]}
              alt="About image 1"
              fill
              className="object-cover"
              onError={() => handleImageError(content.images[0])}
            />
          </div>
        )}

        {hasVideos && content.videos[0] && (
          <div className="relative h-64">
            {renderVideo(content.videos[0])}
          </div>
        )}

        {content.videos && content.videos.length > 1 ? (
          <div className="relative h-64 col-span-2">
            {renderVideo(content.videos[1], true)}
          </div>
        ) : (
          <>
            {content.images.length > 1 && !imageError[content.images[1]] && (
              <div className="relative h-64 rounded-lg overflow-hidden">
                <Image
                  src={content.images[1]}
                  alt="About image 2"
                  fill
                  className="object-cover"
                  onError={() => handleImageError(content.images[1])}
                />
              </div>
            )}
            {content.images.length > 2 && !imageError[content.images[2]] && (
              <div className="relative h-64 rounded-lg overflow-hidden">
                <Image
                  src={content.images[2]}
                  alt="About image 3"
                  fill
                  className="object-cover"
                  onError={() => handleImageError(content.images[2])}
                />
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
