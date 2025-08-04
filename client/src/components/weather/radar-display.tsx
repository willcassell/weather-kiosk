import { Activity, Play } from "lucide-react";
import { useState } from "react";

export default function RadarDisplay() {
  const [radarSource, setRadarSource] = useState<'windy' | 'weather-gov'>('windy');
  
  // Multiple radar options for auto-playing loops
  const radarSources = {
    windy: "https://embed.windy.com/embed.html?type=map&location=coordinates&metricRain=default&metricTemp=default&metricWind=default&zoom=7.25&overlay=radar&product=radar&level=surface&lat=37.000&lon=-78.415&pressure=true&message=true&timeline=true",
    'weather-gov': "https://radar.weather.gov/ridge/standard/KFCX_loop.gif"
  };

  const toggleRadarSource = () => {
    setRadarSource(prev => prev === 'windy' ? 'weather-gov' : 'windy');
  };

  return (
    <div className="h-full relative">
      <div className="absolute top-2 left-2 z-10 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm flex items-center space-x-2">
        <Activity className="h-4 w-4" />
        <span>Live Radar</span>
        <button 
          onClick={toggleRadarSource}
          className="ml-2 p-1 hover:bg-white hover:bg-opacity-20 rounded transition-colors"
          title={radarSource === 'windy' ? 'Switch to Weather.gov (auto-loop)' : 'Switch to Windy (interactive)'}
        >
          <Play className="h-3 w-3" />
        </button>
      </div>
      
      {radarSource === 'windy' ? (
        <iframe 
          src={radarSources.windy}
          className="w-full h-full border-0"
          frameBorder="0"
          title="Windy Weather Radar"
          allow="geolocation"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gray-900">
          <div className="text-center">
            <div className="mb-4">
              <img 
                src={radarSources['weather-gov']}
                alt="Weather.gov Radar Loop"
                className="max-w-full max-h-full object-contain rounded"
                style={{ width: 'auto', height: 'auto', maxWidth: '100%', maxHeight: '100%' }}
                onError={(e) => {
                  console.log('Weather.gov radar failed to load, switching back to Windy');
                  setRadarSource('windy');
                }}
              />
            </div>
            <div className="text-white text-sm opacity-75">
              KFCX Richmond Radar
            </div>
          </div>
        </div>
      )}
      
      {radarSource === 'windy' && (
        <div className="absolute bottom-2 right-2 z-10 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
          Click timeline play button to start loop
        </div>
      )}
    </div>
  );
}