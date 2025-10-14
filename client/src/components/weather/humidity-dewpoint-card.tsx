import { Droplets, Thermometer } from "lucide-react";
import { TemperatureDisplay } from "@/components/ui/temperature-display";
import type { UnitPreferences } from "@shared/units";

interface HumidityDewPointCardProps {
  humidity?: number;
  dewPoint?: number;
  preferences: UnitPreferences;
}

export default function HumidityDewPointCard({
  humidity,
  dewPoint,
  preferences
}: HumidityDewPointCardProps) {
  const formatHumidity = (value?: number) => {
    if (value === undefined) return { value: "--", unit: "" };
    return { value: value.toFixed(1), unit: "%" };
  };

  return (
    <div className="weather-card minimal-padding">
      <div className="weather-card-header">
        <h3 className="weather-card-title">Humidity & Dew Point</h3>
        <Droplets className="weather-card-icon text-blue-400" />
      </div>
      <div className="weather-card-content">
        <div className="flex items-center justify-between space-x-3 w-full">
          {/* Left - Humidity */}
          <div className="text-left">
            <div className="text-responsive-lg font-bold text-blue-400">
              {formatHumidity(humidity).value}
              <sup className="text-[0.5em] ml-0.5">{formatHumidity(humidity).unit}</sup>
            </div>
            <div className="text-responsive-sm text-muted-foreground">Humidity</div>
          </div>
          
          {/* Right - Dew Point */}
          <div className="text-right">
            <div className="flex items-center justify-end space-x-1">
              <Thermometer className="h-4 w-4 text-cyan-400" />
              <div className="text-center">
                <div className="text-responsive-lg font-bold text-cyan-400">
                  {dewPoint !== undefined ? (
                    <TemperatureDisplay temperature={dewPoint} preferences={preferences} decimals={1} />
                  ) : "--"}
                </div>
                <div className="text-responsive-sm text-muted-foreground">Dew Point</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}