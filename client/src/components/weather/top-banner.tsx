import { Radio, Clock } from "lucide-react";
import { format } from "date-fns";

interface TopBannerProps {
  stationId: string;
  stationName?: string;
  lastUpdated?: Date;
  isLoading?: boolean;
}

export default function TopBanner({ stationId, stationName, lastUpdated, isLoading }: TopBannerProps) {
  const formatLastUpdated = (date?: Date) => {
    if (!date) return "Never";
    return format(date, "MMM d, yyyy h:mm a");
  };

  // Get display name from environment variable or use stationName as fallback
  const displayName = import.meta.env.VITE_STATION_DISPLAY_NAME || stationName || "Weather Station";

  return (
    <header className="bg-slate-700 border-b border-slate-600 py-1.5 px-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Radio className="text-primary h-4 w-4 lg:h-5 lg:w-5 xl:h-6 xl:w-6" />
          <h1 className="text-responsive-md font-semibold">
            {displayName} - Station {stationId}
          </h1>
        </div>
        <div className="flex items-center space-x-2 text-muted-foreground">
          <Clock className="h-3 w-3 lg:h-4 lg:w-4 xl:h-5 xl:w-5" />
          <span className="text-responsive-sm">
            Last updated: {formatLastUpdated(lastUpdated)}
          </span>
          <div 
            className={`w-1.5 h-1.5 lg:w-2 lg:h-2 xl:w-2.5 xl:h-2.5 rounded-full ${
              isLoading 
                ? 'bg-warning animate-pulse' 
                : 'animate-pulse-green'
            }`}
            title={isLoading ? "Updating..." : "Live updates active"}
          />
        </div>
      </div>
    </header>
  );
}