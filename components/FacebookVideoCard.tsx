'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface FacebookVideoCardProps {
  videoUrl: string;
  className?: string;
}

export function FacebookVideoCard({ videoUrl, className = '' }: FacebookVideoCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  // Extract video ID for thumbnail if possible
  const getVideoIdFromUrl = (url: string): string | null => {
    const patterns = [
      /facebook\.com\/.*\/videos\/(\d+)/i,
      /facebook\.com\/watch\?v=(\d+)/i,
      /facebook\.com\/video\.php\?v=(\d+)/i,
      /facebook\.com\/video\/embed\?video_id=(\d+)/i,
      /facebook\.com\/plugins\/video\.php.*video_id=(\d+)/i
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }

    return null;
  };

  const videoId = getVideoIdFromUrl(videoUrl);

  useEffect(() => {
    if (videoId) {
      // For Facebook videos, we'll use a generic video thumbnail
      // since direct thumbnail fetching from Facebook requires authentication
      setThumbnailUrl(`/images/facebook-video-thumbnail.jpg`);
      setIsLoading(false);
    } else {
      setError(true);
      setIsLoading(false);
    }
  }, [videoId, videoUrl]);

  return (
    <div
      className={`relative w-full h-full rounded-md overflow-hidden shadow-md transition-all duration-300 ${isHovered ? 'scale-[1.02] shadow-lg' : ''} ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Background thumbnail image */}
      {thumbnailUrl && !isLoading && (
        <div className="absolute inset-0 w-full h-full bg-black">
          <Image
            src={thumbnailUrl}
            alt="Video thumbnail"
            layout="fill"
            objectFit="cover"
            className="opacity-80"
          />
          <div className="absolute inset-0 bg-black bg-opacity-40" />
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="w-8 h-8 border-2 border-t-blue-600 border-r-transparent border-b-blue-600 border-l-transparent rounded-full animate-spin"></div>
        </div>
      )}

      <Link
        href={videoUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center z-10"
      >
        <div className={`w-16 h-16 mb-2 rounded-full bg-blue-600 flex items-center justify-center transition-transform duration-300 ${isHovered ? 'scale-110' : ''}`}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-8 h-8 fill-white">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-white mb-1 drop-shadow-md">Facebook Video</h3>
        <p className="text-sm text-gray-200 mb-3 drop-shadow-md">Click to watch this content on Facebook</p>
        <div className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors">
          Watch on Facebook
          <svg className="ml-2 w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </div>
      </Link>

      {/* Decorative Facebook logo in bottom right */}
      <div className="absolute bottom-3 right-3 opacity-20">
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="#ffffff">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      </div>
    </div>
  );
}
