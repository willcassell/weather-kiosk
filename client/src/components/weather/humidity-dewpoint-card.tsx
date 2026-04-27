import { Droplets } from "lucide-react";
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
  const renderHumidity = (value?: number) => {
    if (value === undefined) return <>--</>;
    const fixed = value.toFixed(1);
    const [intPart, decPart] = fixed.split('.');
    return (
      <>
        {intPart}
        <sup className="text-[0.5em] ml-0.5">
          {decPart ? `.${decPart}` : ''}%
        </sup>
      </>
    );
  };

  return (
    <div className="weather-card minimal-padding">
      <div className="weather-card-header">
        <h3 className="weather-card-title text-[10px]">Humidity & Dew Point</h3>
        <Droplets className="weather-card-icon text-blue-400" />
      </div>
      <div className="weather-card-content">
        <div className="flex items-center justify-between space-x-3 w-full">
          {/* Left - Humidity */}
          <div className="text-left">
            <div className="text-responsive-lg font-bold text-blue-400">
              {renderHumidity(humidity)}
            </div>
            <div className="text-responsive-sm text-muted-foreground">Humidity</div>
          </div>
          
          {/* Right - Dew Point */}
          <div className="text-right">
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
  );
}