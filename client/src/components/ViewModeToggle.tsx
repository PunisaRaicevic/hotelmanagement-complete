import { useViewMode } from '@/contexts/ViewModeContext';
import { Button } from '@/components/ui/button';
import { Monitor, Smartphone } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export default function ViewModeToggle() {
  const { viewMode, toggleViewMode } = useViewMode();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleViewMode}
            className="gap-2 h-9"
          >
            {viewMode === 'web' ? (
              <>
                <Monitor className="w-4 h-4" />
                <span className="hidden sm:inline">Web</span>
              </>
            ) : (
              <>
                <Smartphone className="w-4 h-4" />
                <span className="hidden sm:inline">Mobile</span>
              </>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Prebaci na {viewMode === 'web' ? 'mobilni' : 'web'} prikaz</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
