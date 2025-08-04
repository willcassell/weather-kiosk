import { Activity } from "lucide-react";

export default function RadarDisplay() {
  // Weather Underground animated radar for Richmond, VA area - auto-loops perfectly for kiosk displays
  const radarUrl = "https://s.w-x.co/staticmaps/wu/wu/wxtype1200_cur/usfcx/animate.png";
  
  // Backup options (commented out for easy rollback):
  // const windyUrl = "https://embed.windy.com/embed.html?type=map&location=coordinates&metricRain=default&metricTemp=default&metricWind=default&zoom=7.25&overlay=radar&product=radar&level=surface&lat=37.000&lon=-78.415&pressure=true&message=true&timeline=true";
  // const weatherGovUrl = "https://radar.weather.gov/ridge/standard/KFCX_loop.gif";

  return (
    <div className="h-full relative">
      <div className="absolute top-2 left-2 z-10 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm flex items-center space-x-2">
        <Activity className="h-4 w-4" />
        <span>Live Radar</span>
      </div>
      
      {/* Weather Underground Auto-Playing Radar */}
      <div className="w-full h-full flex items-center justify-center bg-gray-900">
        <img 
          src={radarUrl}
          alt="Weather Underground Radar Loop - Richmond VA"
          className="w-full h-full object-contain"
          style={{ 
            maxWidth: '100%', 
            maxHeight: '100%',
            objectFit: 'contain',
            imageRendering: 'auto'
          }}
          onError={(e) => {
            console.error('Weather Underground radar failed to load:', e);
            // Could implement fallback here if needed
          }}
          onLoad={() => {
            console.log('Weather Underground radar loaded successfully');
          }}
        />
      </div>
      
      <div className="absolute bottom-2 right-2 z-10 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
        Weather Underground • Auto-Loop
      </div>
    </div>
  );
}