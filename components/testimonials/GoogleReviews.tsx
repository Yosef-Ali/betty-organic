"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { ReadOnlyStarRating } from "./ReadOnlyStarRating";
import Image from "next/image";

interface GoogleReview {
  author_name: string;
  rating: number;
  content: string;
  created_at: string;
  profile_photo_url: string;
}

export default function GoogleReviews() {
  const [reviews, setReviews] = useState<GoogleReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchGoogleReviews() {
      try {
        const response = await fetch("/api/google-reviews");
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch reviews");
        }

        setReviews(data.reviews);
      } catch (error) {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to fetch Google reviews",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }

    fetchGoogleReviews();
  }, [toast]);

  if (isLoading) {
    return (
      <div className="w-full space-y-4 p-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-24 bg-gray-200 rounded-lg"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 p-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold">Google Reviews</h2>
        <span className="text-xl font-bold text-blue-500">Google</span>
      </div>

      {reviews.length === 0 ? (
        <p className="text-center text-gray-500">No reviews available</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {reviews.map((review, index) => (
            <div
              key={`${review.author_name}-${index}`}
              className="rounded-lg border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex items-start gap-4">
                {review.profile_photo_url && (
                  <Image
                    src={review.profile_photo_url}
                    alt={review.author_name}
                    width={40}
                    height={40}
                    className="rounded-full"
                  />
                )}
                <div className="flex-1">
                  <h3 className="font-semibold">{review.author_name}</h3>
                  <div className="mt-1.5">
                    <ReadOnlyStarRating rating={review.rating} />
                  </div>
                </div>
              </div>
              <p className="mt-4 text-sm text-gray-600">{review.content}</p>
              <time className="mt-2 block text-xs text-gray-500">
                {new Date(review.created_at).toLocaleDateString()}
              </time>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
