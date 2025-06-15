'use client';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreVertical, MessageCircle } from 'lucide-react';

export default function OrderActionsMenu({
  onTrashClick,
  onWhatsAppClick,
}: {
  onTrashClick: () => void;
  onWhatsAppClick?: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="icon" variant="outline" className="h-8 w-8">
          <MoreVertical className="h-3.5 w-3.5" />
          <span className="sr-only">More</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem>Edit</DropdownMenuItem>
        <DropdownMenuItem>Export</DropdownMenuItem>
        {onWhatsAppClick && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onWhatsAppClick}>
              <MessageCircle className="h-4 w-4 mr-2" />
              Send Invoice via WhatsApp
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onTrashClick}>Trash</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
