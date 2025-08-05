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
          <Radio className="text-primary" style={{ width: 'clamp(14px, 2vw, 20px)', height: 'clamp(14px, 2vw, 20px)' }} />
          <h1 className="text-responsive-md font-semibold">
            {stationName || "Corner Rock Wx"} - Station {stationId}
          </h1>
        </div>
        <div className="flex items-center space-x-2 text-muted-foreground">
          <Clock style={{ width: 'clamp(12px, 1.5vw, 16px)', height: 'clamp(12px, 1.5vw, 16px)' }} />
          <span className="text-responsive-sm">
            Last updated: {formatLastUpdated(lastUpdated)}
          </span>
          <div 
            className={`rounded-full ${
              isLoading 
                ? 'bg-warning animate-pulse' 
                : 'animate-pulse-green'
            }`}
            style={{ 
              width: 'clamp(4px, 1vw, 8px)', 
              height: 'clamp(4px, 1vw, 8px)' 
            }}
            title={isLoading ? "Updating..." : "Live updates active"}
          />
        </div>
      </div>
    </header>
  );
}