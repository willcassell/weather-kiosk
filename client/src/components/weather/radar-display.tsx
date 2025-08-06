import { Activity } from "lucide-react";

export default function RadarDisplay() {
  // Get radar configuration from environment variables (with fallback defaults)
  const radarLat = import.meta.env.VITE_RADAR_CENTER_LAT || "37.000";
  const radarLon = import.meta.env.VITE_RADAR_CENTER_LON || "-78.415"; 
  const radarZoom = import.meta.env.VITE_RADAR_ZOOM_LEVEL || "7.25";
  
  const radarUrl = `https://embed.windy.com/embed.html?type=map&location=coordinates&metricRain=default&metricTemp=default&metricWind=default&zoom=${radarZoom}&overlay=radar&product=radar&level=surface&lat=${radarLat}&lon=${radarLon}&pressure=true&message=true&timeline=true`;

  return (
    <div className="h-full relative">
      <div className="absolute top-2 left-2 z-10 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
        <Activity className="inline-block mr-1 h-4 w-4" />
        Live Radar
      </div>
      {/* Windy Radar Embed */}
      <iframe 
        src={radarUrl}
        className="w-full h-full border-0"
        frameBorder="0"
        title="Weather Radar"
        allow="geolocation"
      />
    </div>
  );
}