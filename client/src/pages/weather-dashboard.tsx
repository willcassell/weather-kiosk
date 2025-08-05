import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { queryClient } from "@/lib/queryClient";
import TopBanner from "@/components/weather/top-banner";
import TemperatureCard from "@/components/weather/temperature-card";
import WindCard from "@/components/weather/wind-card";
import PressureCard from "@/components/weather/pressure-card";
import RainfallCard from "@/components/weather/rainfall-card";
import AdditionalDataCard from "@/components/weather/additional-data-card";
import ThermostatCard from "@/components/weather/thermostat-card";
import RadarDisplay from "@/components/weather/radar-display";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import type { WeatherData, ThermostatData } from "@shared/schema";

const REFRESH_INTERVAL = 3 * 60 * 1000; // 3 minutes

export default function WeatherDashboard() {
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

  // Set up auto-refresh
  useEffect(() => {
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ['/api/weather/current'] });
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
    <div className="bg-background text-foreground overflow-hidden">
      {/* Top Banner */}
      <TopBanner 
        stationId="38335" 
        stationName={weatherData?.stationName || undefined}
        lastUpdated={weatherData?.lastUpdated}
        isLoading={isLoading}
      />

      {/* Main Content - 50/50 Split */}
      <main className="flex">
        {/* Left Half - Weather Data Cards */}
        <section className="w-1/2 bg-background p-2 space-y-2 flex-shrink-0">
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="weather-card animate-pulse">
                  <div className="h-3 bg-muted rounded mb-1"></div>
                  <div className="h-6 bg-muted rounded"></div>
                </div>
              ))}
            </div>
          ) : weatherData ? (
            <>
              <TemperatureCard 
                currentTemp={weatherData.temperature ?? 0}
                feelsLike={weatherData.feelsLike ?? 0}
                highTemp={weatherData.temperatureHigh ?? 0}
                lowTemp={weatherData.temperatureLow ?? 0}
              />
              <WindCard 
                windSpeed={weatherData.windSpeed ?? 0}
                windGust={weatherData.windGust ?? 0}
                windDirection={weatherData.windDirection ?? 0}
                windDirectionCardinal={weatherData.windDirectionCardinal ?? "N"}
              />
              <PressureCard 
                pressure={weatherData.pressure ?? 0}
                trend={weatherData.pressureTrend ?? "Steady"}
              />
              <RainfallCard 
                todayRain={weatherData.rainToday ?? 0}
                yesterdayRain={weatherData.rainYesterday ?? 0}
              />
              <AdditionalDataCard 
                humidity={weatherData.humidity ?? 0}
                uvIndex={weatherData.uvIndex ?? 0}
                visibility={weatherData.visibility ?? 0}
                dewPoint={weatherData.dewPoint ?? 0}
              />
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

        {/* Right Half - Radar Display */}
        <section className="w-1/2 bg-card overflow-hidden">
          <div className="h-[420px]">
            <RadarDisplay />
          </div>
        </section>
      </main>
    </div>
  );
}
