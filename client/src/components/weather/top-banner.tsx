import { Radio, Clock, Activity, Settings } from "lucide-react";
import { format } from "date-fns";
import { Link } from "wouter";
import MarqueeAlert from "./marquee-alert";

interface TopBannerProps {
  stationId: string;
  stationName?: string;
  lastUpdated?: Date;
  isLoading?: boolean;
  healthStatus?: "healthy" | "degraded" | "unhealthy";
  alerts?: any[];
}

export default function TopBanner({ stationId, stationName, lastUpdated, isLoading, healthStatus, alerts }: TopBannerProps) {
  const formatLastUpdated = (date?: Date) => {
    if (!date) return "Never";
    return format(date, "MMM d, yyyy h:mm a");
  };

  // Get display name from database config first, then env, then fallback
  const displayName = stationName || import.meta.env.VITE_STATION_DISPLAY_NAME || "Weather Station";

  // Determine health indicator color and message
  const getHealthIndicator = () => {
    switch (healthStatus) {
      case "healthy":
        return {
          color: "bg-green-500",
          title: "System Healthy - All systems operational",
          icon: "✓"
        };
      case "degraded":
        return {
          color: "bg-yellow-500",
          title: "System Degraded - Some services may be experiencing issues",
          icon: "⚠"
        };
      case "unhealthy":
        return {
          color: "bg-red-500",
          title: "System Unhealthy - Critical issues detected, check /api/health",
          icon: "✗"
        };
      default:
        return {
          color: "bg-gray-500",
          title: "System Status Unknown",
          icon: "?"
        };
    }
  };

  const healthIndicator = getHealthIndicator();

  return (
    <div className="flex flex-col w-full z-50">
      {alerts && alerts.length > 0 && <MarqueeAlert alerts={alerts} />}
      <header className="bg-slate-700 border-b border-slate-600 py-1.5 px-4 w-full">
        <div className="flex justify-between items-center w-full">
          <div className="flex items-center space-x-2">
            <Radio className="text-primary h-4 w-4 lg:h-5 lg:w-5 xl:h-6 xl:w-6" />
            <h1 className="text-responsive-md font-semibold">
              {displayName}
            </h1>
            {/* Health Status Indicator */}
            <div
              className="flex items-center gap-1.5 ml-3 px-2 py-0.5 rounded-full bg-slate-800/50"
              title={healthIndicator.title}
            >
              <Activity className="h-3 w-3 lg:h-3.5 lg:w-3.5 text-slate-400" />
              <div
                className={`w-2 h-2 lg:w-2.5 lg:h-2.5 rounded-full ${healthIndicator.color} transition-colors duration-300`}
              />
            </div>
          </div>
          <div className="flex items-center space-x-3 text-muted-foreground mr-2">
            <Link href="/settings">
              <Settings className="h-4 w-4 lg:h-5 lg:w-5 xl:h-6 xl:w-6 hover:text-primary transition-colors cursor-pointer" />
            </Link>
            <div className="flex items-center space-x-2">
              <Clock className="h-3 w-3 lg:h-4 lg:w-4 xl:h-5 xl:w-5" />
              <span className="text-responsive-sm">
                Last updated: {formatLastUpdated(lastUpdated)}
              </span>
            </div>
            <div
              className={`w-1.5 h-1.5 lg:w-2 lg:h-2 xl:w-2.5 xl:h-2.5 rounded-full ${isLoading
                ? 'bg-warning animate-pulse'
                : 'animate-pulse-green'
                }`}
              title={isLoading ? "Updating..." : "Live updates active"}
            />
          </div>
        </div>
      </header>
    </div>
  );
}