"use client";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Share2 } from "lucide-react"
import { formatOrderId } from "@/lib/utils"

interface SharePopupProps {
  orderId?: string;
}

export function SharePopup({ orderId }: SharePopupProps) {
  const handleShare = (platform: string) => {
    const url = window.location.href;
    const formattedId = orderId ? formatOrderId(orderId) : '';
    const text = orderId
      ? `Check out my order ${formattedId} from Betty Organic!`
      : `Check out Betty Organic!`;

    switch (platform) {
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
        break;
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
        break;
      case 'whatsapp':
        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text + ' ' + url)}`, '_blank');
        break;
    }
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm">
          <Share2 className="h-4 w-4 mr-2" />
          Share
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-2">
        <div className="space-y-1">
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={() => handleShare('facebook')}
          >
            Facebook
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={() => handleShare('twitter')}
          >
            Twitter
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={() => handleShare('whatsapp')}
          >
            WhatsApp
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
