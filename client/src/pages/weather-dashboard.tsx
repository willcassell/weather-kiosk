import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { queryClient } from "@/lib/queryClient";
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import TopBanner from "@/components/weather/top-banner";
import TemperatureCard from "@/components/weather/temperature-card";
import WindCard from "@/components/weather/wind-card";
import PressureCard from "@/components/weather/pressure-card";
import RainfallCard from "@/components/weather/rainfall-card";
import LightningCard from "@/components/weather/lightning-card";
import HumidityDewPointCard from "@/components/weather/humidity-dewpoint-card";
import ThermostatCard from "@/components/weather/thermostat-card";
import RadarDisplay from "@/components/weather/radar-display";
import UnitSettings from "@/components/ui/unit-settings";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { useUnitPreferences } from "@/hooks/use-unit-preferences";
import type { WeatherData, ThermostatData } from "@shared/schema";

const REFRESH_INTERVAL = 3 * 60 * 1000; // 3 minutes

export default function WeatherDashboard() {
  const [showUnitSettings, setShowUnitSettings] = useState(false);
  const { preferences, isLoaded } = useUnitPreferences();
  const { data: weatherData, isLoading, error, isError } = useQuery<WeatherData>({
    queryKey: ['/api/weather/current'],
    refetchInterval: REFRESH_INTERVAL,
    refetchOnWindowFocus: true,
    retry: 3,
    retryDelay: 5000,
  });

  const { data: thermostatData, isLoading: thermostatLoading, error: thermostatError } = useQuery<ThermostatData[]>({
    queryKey: ['/api/thermostats/current'],
    refetchInterval: REFRESH_INTERVAL,
    refetchOnWindowFocus: true,
    retry: 3,
    retryDelay: 5000,
  });

  // Set up auto-refresh for both weather and thermostat data
  useEffect(() => {
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ['/api/weather/current'] });
      queryClient.invalidateQueries({ queryKey: ['/api/thermostats/current'] });
    }, REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, []);

  if (isError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="h-8 w-8 text-destructive" />
              <h1 className="text-2xl font-bold">Weather Data Error</h1>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Failed to fetch weather data from WeatherFlow Tempest station.
            </p>
            <p className="text-xs text-muted-foreground">
              Error: {error instanceof Error ? error.message : 'Unknown error occurred'}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Please check your WeatherFlow API token configuration.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="bg-background text-foreground h-screen flex flex-col">
      {/* Top Banner */}
      <TopBanner 
        stationId="38335" 
        stationName={weatherData?.stationName || undefined}
        lastUpdated={weatherData?.lastUpdated}
        isLoading={isLoading}
      />

      {/* Settings Button - Fixed position */}
      <div className="absolute top-4 right-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowUnitSettings(true)}
          className="bg-background/80 backdrop-blur-sm border-border/50 hover:bg-background/90"
        >
          <Settings className="h-4 w-4" />
        </Button>
      </div>

      {/* Unit Settings Modal */}
      <UnitSettings 
        isOpen={showUnitSettings} 
        onClose={() => setShowUnitSettings(false)} 
      />

      {/* Main Content - Orientation-based Layout */}
      <main className="flex flex-col orientation-landscape:flex-row flex-1 overflow-hidden">
        {/* Weather Data Cards - Full width on portrait, left half on landscape */}
        <section className="w-full orientation-landscape:w-1/2 bg-background p-2 flex flex-col gap-2 flex-1 overflow-hidden">
          {isLoading ? (
            <div className="flex flex-col justify-between gap-2 h-full">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="weather-card animate-pulse flex-1">
                  <div className="h-3 bg-muted rounded mb-1"></div>
                  <div className="h-6 bg-muted rounded"></div>
                </div>
              ))}
            </div>
          ) : weatherData ? (
            <>
              {/* Temperature Card - Medium size for main reading + high/low with times */}
              <div className="flex-[1.5]">
                <TemperatureCard 
                  currentTemp={weatherData.temperature ?? 0}
                  feelsLike={weatherData.feelsLike ?? 0}
                  highTemp={weatherData.temperatureHigh ?? 0}
                  lowTemp={weatherData.temperatureLow ?? 0}
                  highTempTime={weatherData.temperatureHighTime ? new Date(weatherData.temperatureHighTime) : undefined}
                  lowTempTime={weatherData.temperatureLowTime ? new Date(weatherData.temperatureLowTime) : undefined}
                  preferences={preferences}
                />
              </div>
              
              {/* Wind and Rain on the same row - Wind takes 2/3, Rain takes 1/3 - Shortened height */}
              <div className="flex gap-2 flex-[0.9]">
                <div className="w-2/3">
                  <WindCard 
                    windSpeed={weatherData.windSpeed ?? 0}
                    windGust={weatherData.windGust ?? 0}
                    windDirection={weatherData.windDirection ?? 0}
                    windDirectionCardinal={weatherData.windDirectionCardinal ?? "N"}
                    preferences={preferences}
                  />
                </div>
                <div className="w-1/3">
                  <RainfallCard 
                    todayRain={weatherData.rainToday ?? 0}
                    yesterdayRain={weatherData.rainYesterday ?? 0}
                    preferences={preferences}
                  />
                </div>
              </div>
              
              {/* Pressure Card - Standard size for pressure + trend */}
              <div className="flex-1">
                <PressureCard 
                  pressure={weatherData.pressure ?? 0}
                  trend={weatherData.pressureTrend ?? "Steady"}
                  preferences={preferences}
                />
              </div>
              
              {/* Lightning and Humidity/Dew Point row - Split 50/50 */}
              <div className="flex gap-2 flex-[0.8]">
                <div className="w-1/2">
                  <LightningCard 
                    strikeDistance={weatherData.lightningStrikeDistance}
                    strikeTime={weatherData.lightningStrikeTime ? new Date(weatherData.lightningStrikeTime) : null}
                  />
                </div>
                <div className="w-1/2">
                  <HumidityDewPointCard 
                    humidity={weatherData.humidity ?? undefined}
                    dewPoint={weatherData.dewPoint ?? undefined}
                    preferences={preferences}
                  />
                </div>
              </div>
              
              {/* Thermostat Card - More space for detailed thermostat information */}
              <div className="flex-[2.3]">
                <ThermostatCard 
                  thermostats={thermostatData?.map(t => ({
                    ...t,
                    temperature: t.temperature ?? 0,
                    targetTemp: t.targetTemp ?? 0,
                    humidity: t.humidity ?? undefined,
                    mode: (t.mode as 'heat' | 'cool' | 'auto' | 'off') ?? 'off'
                  }))}
                  isLoading={thermostatLoading}
                  error={thermostatError instanceof Error ? thermostatError.message : undefined}
                />
              </div>
            </>
          ) : (
            <div className="weather-card">
              <div className="flex items-center gap-2 text-muted-foreground">
                <AlertCircle className="h-5 w-5" />
                <span>No weather data available</span>
              </div>
            </div>
          )}
        </section>

        {/* Radar Display - Full width on portrait, right half on landscape */}
        <section className="w-full orientation-landscape:w-1/2 bg-card overflow-hidden min-h-[50vh] orientation-landscape:min-h-0">
          <div className="h-full">
            <RadarDisplay />
          </div>
        </section>
      </main>
    </div>
  );
}
