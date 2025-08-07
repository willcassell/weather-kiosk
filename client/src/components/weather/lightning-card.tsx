import { Zap, ZapOff } from "lucide-react";

interface LightningCardProps {
  strikeDistance?: number | null;
  strikeTime?: Date | null;
}

export default function LightningCard({ 
  strikeDistance, 
  strikeTime 
}: LightningCardProps) {
  const formatDistance = (distance?: number | null) => {
    if (distance === undefined || distance === null) return "--";
    return distance.toFixed(1);
  };

  const formatTime = (time?: Date | null) => {
    if (!time) return "";
    const now = new Date();
    const diffMs = now.getTime() - time.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMinutes / 60);
    
    if (diffMinutes < 60) {
      return diffMinutes === 0 ? "just now" : `${diffMinutes}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else {
      return time.toLocaleDateString();
    }
  };

  const hasRecentLightning = strikeDistance !== null && strikeDistance !== undefined;

  return (
    <div className="weather-card minimal-padding">
      <div className="weather-card-header">
        <h3 className="weather-card-title">Lightning</h3>
        {hasRecentLightning ? (
          <Zap className="weather-card-icon text-yellow-400" />
        ) : (
          <ZapOff className="weather-card-icon text-muted-foreground" />
        )}
      </div>
      <div className="weather-card-content">
        <div className="flex items-center justify-between space-x-3 w-full">
          {/* Left - Status */}
          <div className="text-left">
            <div className={`text-responsive-lg font-bold ${hasRecentLightning ? 'text-yellow-400' : 'text-muted-foreground'}`}>
              {hasRecentLightning ? 'Detected' : 'None'}
            </div>
            <div className="text-responsive-sm text-muted-foreground">Activity</div>
          </div>
          
          {/* Center - Distance (Larger) */}
          <div className="text-center">
            <div className={`text-responsive-3xl font-bold ${hasRecentLightning ? 'text-foreground' : 'text-muted-foreground'}`}>
              {formatDistance(strikeDistance)}
              {hasRecentLightning && <span className="text-sm lg:text-base"> mi</span>}
            </div>
          </div>
          
          {/* Right - Time */}
          <div className="text-right">
            <div className={`text-responsive-lg font-bold ${hasRecentLightning ? 'text-cyan-400' : 'text-muted-foreground'}`}>
              {hasRecentLightning ? formatTime(strikeTime) : '--'}
            </div>
            <div className="text-responsive-sm text-muted-foreground">Last Strike</div>
          </div>
        </div>
      </div>
    </div>
  );
}