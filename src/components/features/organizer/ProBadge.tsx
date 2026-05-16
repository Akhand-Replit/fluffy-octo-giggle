import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Crown } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ProBadgeProps {
  proStatus?: 'none' | 'pending' | 'active' | 'rejected';
  className?: string;
}

export function ProBadge({ proStatus = 'none', className = '' }: ProBadgeProps) {
  if (proStatus === 'none' || proStatus === 'rejected') {
    return null;
  }

  if (proStatus === 'pending') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <Badge variant="outline" className={`gap-1 bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100 cursor-help ${className}`}>
              <Crown className="w-3 h-3" />
              Pro Pending
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>Your Pro application is being reviewed.</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <Badge variant="default" className={`gap-1 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white border-0 shadow-sm ${className}`}>
      <Crown className="w-3.5 h-3.5 fill-white/20" />
      Pro
    </Badge>
  );
}
