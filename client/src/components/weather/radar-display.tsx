import { useEffect, useRef, useState } from "react";
import { Activity, Loader2 } from "lucide-react";

export default function RadarDisplay() {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Get radar configuration from environment variables (with fallback defaults)
  const radarLat = import.meta.env.VITE_RADAR_CENTER_LAT || "37.000";
  const radarLon = import.meta.env.VITE_RADAR_CENTER_LON || "-78.415";
  const radarZoom = import.meta.env.VITE_RADAR_ZOOM_LEVEL || "7.25";

  // Add autoplay and autoloop parameters for continuous radar animation
  // autoplay starts the animation automatically
  // The radar will loop continuously in kiosk mode
  const radarUrl = `https://embed.windy.com/embed.html?type=map&location=coordinates&metricRain=default&metricTemp=default&metricWind=default&zoom=${radarZoom}&overlay=radar&product=radar&level=surface&lat=${radarLat}&lon=${radarLon}&pressure=true&message=true&timeline=true&autoplay=1`;

  useEffect(() => {
    timeoutRef.current = setTimeout(() => {
      if (isLoading) {
        setHasError(true);
        setIsLoading(false);
      }
    }, 12000);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isLoading]);

  const handleLoad = () => {
    setIsLoading(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  const handleError = () => {
    setHasError(true);
    setIsLoading(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  return (
    <div className="h-full relative">
      <div className="absolute top-2 left-2 z-10 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
        <Activity className="inline-block mr-1 h-4 w-4" />
        Live Radar (Auto-play)
      </div>

      {/* Loading overlay */}
      {isLoading && !hasError && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 backdrop-blur-md border border-white/10 rounded-lg">
          <div className="flex flex-col items-center gap-3 text-white/70">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="text-sm">Loading radar...</span>
          </div>
        </div>
      )}

      {/* Error/fallback overlay */}
      {hasError && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 backdrop-blur-md border border-white/10 rounded-lg">
          <div className="flex flex-col items-center gap-3 text-white/40">
            <Activity className="h-10 w-10" />
            <span className="text-sm">Live radar temporarily unavailable</span>
          </div>
        </div>
      )}

      {/* Windy Radar Embed with autoplay enabled */}
      <iframe
        src={radarUrl}
        className="w-full h-full border-0"
        frameBorder="0"
        title="Weather Radar"
        allow="geolocation"
        onLoad={handleLoad}
        onError={handleError}
      />
    </div>
  );
}
