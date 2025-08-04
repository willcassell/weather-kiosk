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

  return (
    <header className="bg-slate-700 border-b border-slate-600 py-1.5 px-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Radio className="text-primary h-4 w-4" />
          <h1 className="text-sm font-semibold">
            {stationName || "Corner Rock Wx"} - Station {stationId}
          </h1>
        </div>
        <div className="flex items-center space-x-2 text-muted-foreground text-xs">
          <Clock className="h-3 w-3" />
          <span>
            Last updated: {formatLastUpdated(lastUpdated)}
          </span>
          <div 
            className={`w-1.5 h-1.5 rounded-full ${
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