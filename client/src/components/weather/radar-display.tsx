import { Activity } from "lucide-react";
import { useEffect, useRef } from "react";

export default function RadarDisplay() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  
  // Enhanced Windy URL with auto-play parameters
  const radarUrl = "https://embed.windy.com/embed.html?type=map&location=coordinates&metricRain=default&metricTemp=default&metricWind=default&zoom=7.25&overlay=radar&product=radar&level=surface&lat=37.000&lon=-78.415&pressure=true&message=true&autoplay=true&loop=true&controls=true&timeline=true";

  useEffect(() => {
    // Function to attempt auto-play via postMessage API
    const attemptAutoPlay = () => {
      if (iframeRef.current && iframeRef.current.contentWindow) {
        try {
          // Try Windy's postMessage API for auto-play
          iframeRef.current.contentWindow.postMessage({
            action: 'play',
            autoplay: true,
            loop: true
          }, 'https://embed.windy.com');
          
          // Alternative approach - simulate click on play button
          iframeRef.current.contentWindow.postMessage({
            type: 'WINDY_CONTROL',
            command: 'PLAY_ANIMATION'
          }, '*');
          
        } catch (error) {
          console.log('Cross-origin restrictions prevent direct control, relying on URL parameters');
        }
      }
    };

    // Wait for iframe to load, then attempt auto-play
    const timer = setTimeout(() => {
      attemptAutoPlay();
      
      // Try again after a longer delay to ensure Windy has fully loaded
      setTimeout(attemptAutoPlay, 3000);
      setTimeout(attemptAutoPlay, 5000);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="h-full relative">
      <div className="absolute top-2 left-2 z-10 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
        <Activity className="inline-block mr-1 h-4 w-4" />
        Live Radar
      </div>
      {/* Windy Radar Embed with Auto-play */}
      <iframe 
        ref={iframeRef}
        src={radarUrl}
        className="w-full h-full border-0"
        frameBorder="0"
        title="Weather Radar"
        allow="geolocation"
        onLoad={() => {
          // Additional attempt when iframe finishes loading
          setTimeout(() => {
            if (iframeRef.current?.contentWindow) {
              try {
                iframeRef.current.contentWindow.postMessage({
                  action: 'autoplay',
                  enable: true
                }, '*');
              } catch (e) {
                // Silently handle cross-origin restrictions
              }
            }
          }, 1000);
        }}
      />
    </div>
  );
}