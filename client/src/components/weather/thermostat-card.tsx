import { Thermometer, Snowflake, Flame, Pause, Droplets, Home, Waves } from "lucide-react";
import { TemperatureDisplay } from "@/components/ui/temperature-display";
import type { UnitPreferences } from "@shared/units";

interface ThermostatData {
  id: number;
  thermostatId: string;
  name: string;
  temperature: number;
  targetTemp: number;
  humidity?: number | null;
  mode: string;
  hvacState?: string | null;
  occupied?: boolean | null;
  timestamp: Date;
  lastUpdated: Date;
}

interface ThermostatCardProps {
  thermostats?: ThermostatData[];
  isLoading?: boolean;
  isStale?: boolean;
  error?: string;
  preferences?: UnitPreferences;
}

function getHvacLabel(thermostat: ThermostatData): { label: string; color: string; icon: React.ReactNode } {
  const iconClass = "h-3 w-3";

  if (thermostat.hvacState) {
    if (thermostat.hvacState.includes('cool')) {
      return { label: 'Cooling', color: 'text-blue-400', icon: <Snowflake className={`${iconClass} text-blue-400 animate-pulse`} /> };
    }
    if (thermostat.hvacState.includes('heat')) {
      return { label: 'Heating', color: 'text-red-400', icon: <Flame className={`${iconClass} text-red-400 animate-pulse`} /> };
    }
  }

  if (thermostat.mode === 'off') {
    return { label: 'Off', color: 'text-gray-500', icon: <Pause className={`${iconClass} text-gray-500`} /> };
  }

  return { label: 'Idle', color: 'text-gray-400', icon: <Pause className={`${iconClass} text-gray-400`} /> };
}

function getDeltaInfo(current: number, target: number): { text: string; color: string } {
  const delta = current - target;
  const absDelta = Math.abs(delta);

  if (absDelta < 1) {
    return { text: 'At target', color: 'text-green-400' };
  }

  const rounded = absDelta.toFixed(1);
  if (delta > 0) {
    return { text: `${rounded}° above target`, color: 'text-orange-400' };
  }
  return { text: `${rounded}° below target`, color: 'text-cyan-400' };
}

function getZoneIcon(name: string) {
  const isLake = name.toLowerCase().includes('lake');
  return isLake
    ? <Waves className="h-3.5 w-3.5 text-blue-400" />
    : <Home className="h-3.5 w-3.5 text-cyan-400" />;
}

export default function ThermostatCard({ thermostats, isLoading, isStale, error, preferences }: ThermostatCardProps) {
  if (isLoading) {
    return (
      <div className="weather-card col-span-2 minimal-padding">
        <div className="weather-card-header">
          <h3 className="weather-card-title">Indoor Climate</h3>
          <Thermometer className="weather-card-icon" />
        </div>
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-cyan-400"></div>
          <span className="ml-2 text-sm text-muted-foreground">Loading thermostats...</span>
        </div>
      </div>
    );
  }

  if (error || !thermostats || thermostats.length === 0) {
    return (
      <div className="weather-card col-span-2 minimal-padding">
        <div className="weather-card-header">
          <h3 className="weather-card-title">Indoor Climate</h3>
          <Thermometer className="weather-card-icon" />
        </div>
        <div className="weather-card-content">
          <div className="text-responsive-md text-muted-foreground">
            {error || "No thermostat data available"}
          </div>
        </div>
      </div>
    );
  }

  // Determine overall HVAC status for header
  const anyActive = thermostats.some(t =>
    t.hvacState && t.hvacState !== 'idle' && t.hvacState !== 'off'
  );
  const headerHvac = anyActive ? 'Active' : 'Idle';

  return (
    <div className="weather-card col-span-2" style={{ padding: '8px 10px' }}>
      <div className="weather-card-header">
        <div className="flex items-center gap-2">
          <h3 className="weather-card-title">Indoor Climate</h3>
          {isStale && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-500 border border-yellow-500/30 animate-pulse">
              Delayed
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`text-[10px] uppercase tracking-wider ${anyActive ? 'text-cyan-400' : 'text-gray-500'}`}>
            {headerHvac}
          </span>
          <Thermometer className="weather-card-icon" />
        </div>
      </div>

      <div className="thermostat-content">
        <div className="thermostat-zone-grid">
          {thermostats.map((thermostat) => {
            const hvac = getHvacLabel(thermostat);
            const delta = getDeltaInfo(thermostat.temperature, thermostat.targetTemp);

            return (
              <div key={thermostat.id} className="glass-l3 thermostat-zone-card">
                {/* Row 1: Zone name + Humidity */}
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    {getZoneIcon(thermostat.name)}
                    <span className="text-[12px] font-semibold text-foreground/90 tracking-wide">
                      {thermostat.name}
                    </span>
                  </div>
                  {thermostat.humidity != null && (
                    <div className="flex items-center gap-1 text-[11px] text-blue-300/80">
                      <Droplets className="h-3 w-3" />
                      <span>{thermostat.humidity}%</span>
                    </div>
                  )}
                </div>

                {/* Row 2: Current temp (primary) + Target */}
                <div className="flex items-baseline justify-between">
                  <div className="text-[22px] font-medium text-foreground leading-none">
                    {preferences ? (
                      <TemperatureDisplay temperature={thermostat.temperature} preferences={preferences} decimals={1} />
                    ) : (
                      <>
                        {thermostat.temperature.toFixed(1)}
                        <sup className="text-[0.5em] ml-0.5">°F</sup>
                      </>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-muted-foreground/70 uppercase tracking-wide">Target</div>
                    <div className="text-[18px] font-bold text-foreground/90 leading-none">
                      {preferences ? (
                        <TemperatureDisplay temperature={thermostat.targetTemp} preferences={preferences} decimals={0} />
                      ) : (
                        <>{thermostat.targetTemp}°F</>
                      )}
                    </div>
                  </div>
                </div>

                {/* Row 3: Delta status + HVAC state */}
                <div className="flex items-center justify-between mt-1.5">
                  <span className={`text-[10px] ${delta.color}`}>
                    {delta.text}
                  </span>
                  <div className="flex items-center gap-1">
                    {hvac.icon}
                    <span className={`text-[10px] font-medium ${hvac.color}`}>
                      {hvac.label}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
