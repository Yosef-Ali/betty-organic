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
  const [imageRetryCount, setImageRetryCount] = useState<Record<string, number>>({});
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({});

  // Constants
  const MAX_IMAGE_RETRIES = 2;
  const IMAGE_RETRY_DELAY = 2000; // 2 seconds
  const IMAGE_TIMEOUT = 8000; // 8 seconds timeout for images

  // Refs
  const bettyVideo = useRef("https://xmumlfgzvrliepxcjqil.supabase.co/storage/v1/object/public/about_images//bettys.mp4");
  const videoRefs = useRef<Record<string, HTMLVideoElement>>({});
  const loadedMetadataListeners = useRef<Record<string, () => void>>({});
  const imageTimeouts = useRef<Record<string, NodeJS.Timeout>>({});

  // Callback functions
  const setInitialVideoPosition = useCallback((videoElement: HTMLVideoElement) => {
    if (videoElement.readyState >= 2) {
      videoElement.currentTime = videoElement.duration * 0.1;
      videoElement.pause();
    }
  }, []);

  const generateThumbnail = useCallback((videoUrl: string, videoElement: HTMLVideoElement) => {
    // Use a simpler approach that's less likely to fail
    const generateSimpleThumbnail = () => {
      try {
        // Just set a default thumbnail immediately to avoid black screens
        setThumbnails(prev => ({
          ...prev,
          [videoUrl]: "/images/video-thumbnail.jpg" // Make sure this file exists in your public folder
        }));
        return true;
      } catch (error) {
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
            } catch (e) {
              // Fallback thumbnail already set, so no action needed
            }
          } catch (e) {
            // Silent fail - fallback already in place
          }
        }, 500);
      } catch (e) {
        // Silent fail - fallback already in place
      }
    }
  }, []);

  const handleVideoError = useCallback((videoUrl: string) => {
    // Clear existing iframe
    const iframe = document.querySelector(`iframe[src*="${videoUrl}"]`);
    if (iframe) {
      iframe.removeAttribute('src');
    }

    // Set error state
    setVideoError(prev => ({ ...prev, [videoUrl]: true }));
    setVideoLoading(prev => ({ ...prev, [videoUrl]: false }));

    // Only schedule a retry if we're not already in an error state
    // which helps prevent infinite retry loops
    const retryTimeoutId = setTimeout(() => {
      setVideoError(prev => ({ ...prev, [videoUrl]: false }));
      setVideoLoading(prev => ({ ...prev, [videoUrl]: true }));

      // Try to reload the video if we have a reference to it
      const videoEl = videoRefs.current[videoUrl];
      if (videoEl) {
        videoEl.load();
      }
    }, 3000); // Increased delay to prevent rapid retries

    // Store timeout ID in a ref for cleanup
    return retryTimeoutId;
  }, []);

  const handleVideoLoad = useCallback((videoUrl: string, videoElement: HTMLVideoElement) => {
    // Generate thumbnail first
    generateThumbnail(videoUrl, videoElement);
    setInitialVideoPosition(videoElement);

    // Give a small delay before trying to play to allow thumbnail to be displayed
    setTimeout(() => {
      videoElement.play().catch(() => {
        // If autoplay fails, handle it silently - the thumbnail will show instead
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
    // Clear any existing timeout for this image
    if (imageTimeouts.current[imageUrl]) {
      clearTimeout(imageTimeouts.current[imageUrl]);
      delete imageTimeouts.current[imageUrl];
    }

    // Get current retry count or default to 0
    const currentRetries = imageRetryCount[imageUrl] || 0;

    if (currentRetries < MAX_IMAGE_RETRIES) {
      // Increment retry count - do this first before setting other state
      const newRetryCount = currentRetries + 1;

      // Update retry count in a stable way
      setImageRetryCount(prev => ({
        ...prev,
        [imageUrl]: newRetryCount
      }));

      // Show temporary error state
      setImageError(prev => ({
        ...prev,
        [imageUrl]: true
      }));

      // Retry after delay with exponential backoff
      const retryDelay = IMAGE_RETRY_DELAY * Math.pow(1.5, currentRetries);

      // Store the timeout ID so we can clear it if needed
      const timeoutId = setTimeout(() => {
        // Reset error state to trigger re-render with new image attempt
        setImageError(prev => ({
          ...prev,
          [imageUrl]: false
        }));
      }, retryDelay);

      // Store the timeout for cleanup
      imageTimeouts.current[imageUrl] = timeoutId;
    } else {
      // Max retries reached, show permanent error state
      setImageError(prev => ({
        ...prev,
        [imageUrl]: true
      }));
    }
  }, [MAX_IMAGE_RETRIES, IMAGE_RETRY_DELAY, imageRetryCount]);

  // Setup image timeout handler
  const setupImageTimeout = useCallback((imageUrl: string) => {
    // Clear any existing timeout
    if (imageTimeouts.current[imageUrl]) {
      clearTimeout(imageTimeouts.current[imageUrl]);
      delete imageTimeouts.current[imageUrl];
    }

    // Don't setup a timeout if the image is already in error state
    if (imageError[imageUrl]) {
      return () => { };
    }

    // Set new timeout
    imageTimeouts.current[imageUrl] = setTimeout(() => {
      // If image is still loading after timeout period, trigger error handler
      // Check if the component is still mounted and the image hasn't already errored
      if (!imageError[imageUrl]) {
        handleImageError(imageUrl);
      }
    }, IMAGE_TIMEOUT);

    return () => {
      if (imageTimeouts.current[imageUrl]) {
        clearTimeout(imageTimeouts.current[imageUrl]);
        delete imageTimeouts.current[imageUrl];
      }
    };
  }, [imageError, handleImageError, IMAGE_TIMEOUT]);

  // Image load success handler
  const handleImageLoad = useCallback((imageUrl: string) => {
    // Clear timeout and reset error state on successful load
    if (imageTimeouts.current[imageUrl]) {
      clearTimeout(imageTimeouts.current[imageUrl]);
      delete imageTimeouts.current[imageUrl];
    }

    // Reset error state if it was previously set
    if (imageError[imageUrl]) {
      setImageError(prev => ({ ...prev, [imageUrl]: false }));
    }
  }, [imageError]);

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

          // Initialize loading state for all videos
          data.videos.forEach((video: string) => {
            setVideoLoading(prev => ({ ...prev, [video]: true }));
          });

          // Ensure images array exists
          if (!data.images) {
            data.images = [];
          }

          // Setup timeouts for all images
          if (data.images && data.images.length > 0) {
            data.images.forEach((imgUrl: string) => {
              setupImageTimeout(imgUrl);
            });
          }
        }

        setAboutData(data);
      } catch (err) {
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchAboutData();

    // Cleanup function
    return () => {
      cleanupVideoResources();

      // Clear all image timeouts
      Object.keys(imageTimeouts.current).forEach(key => {
        clearTimeout(imageTimeouts.current[key]);
      });
      imageTimeouts.current = {};
    };
  }, [cleanupVideoResources, setupImageTimeout]);

  useEffect(() => {
    // Auto-play videos when they become available and are not loading or errored
    if (aboutData?.videos) {
      aboutData.videos.forEach((videoUrl: string) => {
        if (!videoLoading[videoUrl] && !videoError[videoUrl]) {
          const videoElement = videoRefs.current[videoUrl];
          if (videoElement && videoElement.paused && videoElement.readyState >= 2) {
            videoElement.play().catch(() => {
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
    title: "About Betty&apos;s Organic",
    content: `At Betty&apos;s Organic, we&apos;re passionate about bringing you the freshest, most nutritious produce straight from local farms. Our commitment to organic farming practices ensures that every fruit and vegetable is grown without harmful chemicals, preserving both your health and the environment.\n\nFounded in 2010, we&apos;ve grown from a small family farm to a trusted source for organic produce in the community. Our team carefully selects each item, ensuring only the highest quality reaches your table.`,
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
            We&apos;re experiencing technical difficulties. Please try again later.
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

  // Function to render images with error handling
  const renderImage = (imageUrl: string, index: number) => {
    const hasError = imageError[imageUrl];
    const retryCount = imageRetryCount[imageUrl] || 0;
    const fallbackImageUrl = `/images/fallback-image-${(index % 3) + 1}.jpg`;

    return (
      <div className="relative h-64 rounded-lg overflow-hidden" style={{ position: 'relative' }}>
        {hasError ? (
          // Show fallback image if we've had an error
          <>
            <Image
              src={fallbackImageUrl}
              alt={`Fallback image ${index + 1}`}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover opacity-90"
            />
            <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center">
              {retryCount < MAX_IMAGE_RETRIES ? (
                <div className="text-center text-white p-2 bg-black bg-opacity-50 rounded">
                  <div className="mb-2"><LoadingSpinner size="sm" /></div>
                  <p className="text-sm">Retrying image...</p>
                </div>
              ) : (
                <div className="text-center text-white p-2 bg-black bg-opacity-50 rounded">
                  <p className="text-sm">Image unavailable</p>
                  <button
                    className="mt-2 px-3 py-1 bg-white text-black text-xs rounded hover:bg-gray-200"
                    onClick={() => {
                      // Reset retry count and error state
                      setImageRetryCount(prev => ({ ...prev, [imageUrl]: 0 }));
                      setImageError(prev => ({ ...prev, [imageUrl]: false }));
                      setupImageTimeout(imageUrl);
                    }}
                  >
                    Try Again
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <Image
            src={imageUrl}
            alt={`About image ${index + 1}`}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover"
            onError={() => handleImageError(imageUrl)}
            onLoad={() => handleImageLoad(imageUrl)}
            priority={index === 0} // Prioritize loading the first image
          />
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
        {content.images.length > 0 && (
          renderImage(content.images[0], 0)
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
            {content.images.length > 1 && (
              renderImage(content.images[1], 1)
            )}
            {content.images.length > 2 && (
              renderImage(content.images[2], 2)
            )}
          </>
        )}
      </div>
    </section>
  );
}
