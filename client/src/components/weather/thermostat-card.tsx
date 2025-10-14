import { Thermometer, Home, Snowflake, Flame, Target, Pause, Activity } from "lucide-react";
import { TemperatureDisplay } from "@/components/ui/temperature-display";
import type { UnitPreferences } from "@shared/units";

interface ThermostatData {
  id: number;
  thermostatId: string;
  name: string;
  temperature: number;
  targetTemp: number;
  humidity?: number;
  mode: 'heat' | 'cool' | 'auto' | 'off';
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

export default function ThermostatCard({ thermostats, isLoading, isStale, error, preferences }: ThermostatCardProps) {
  if (isLoading) {
    return (
      <div className="weather-card col-span-2 minimal-padding">
        <div className="weather-card-header">
          <h3 className="weather-card-title">Indoor Climate</h3>
          <Thermometer className="weather-card-icon h-4 w-4" />
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

  const isHvacActive = (thermostat: any) => {
    // Use actual HVAC state if available, otherwise fall back to temperature logic
    if (thermostat.hvacState) {
      return thermostat.hvacState !== 'idle' && thermostat.hvacState !== 'off';
    }
    
    // Fallback to temperature-based logic if no hvacState
    const { mode, temperature: currentTemp, targetTemp } = thermostat;
    if (!mode || mode === 'off') return false;
    
    const diff = currentTemp - targetTemp;
    if (mode === 'cool') return diff > 1.0; // Cooling when significantly above target
    if (mode === 'heat') return diff < -1.0; // Heating when significantly below target  
    if (mode === 'auto') return Math.abs(diff) > 1.5; // Auto mode with much wider tolerance
    
    return false;
  };

  const getModeIcon = (mode: string) => {
    const iconClasses = "h-3 w-3 lg:h-4 lg:w-4 xl:h-5 xl:w-5";

    switch (mode) {
      case 'cool':
        return <Snowflake className={`${iconClasses} text-blue-400`} />;
      case 'heat':
        return <Flame className={`${iconClasses} text-red-400`} />;
      case 'auto':
        return <Target className={`${iconClasses} text-purple-400`} />;
      case 'off':
        return <Pause className={`${iconClasses} text-gray-400`} />;
      default:
        return null;
    }
  };

  const getHvacStatusIndicator = (thermostat: any) => {
    const active = isHvacActive(thermostat);
    const { mode, temperature: currentTemp, targetTemp, hvacState } = thermostat;
    
    // Use actual HVAC state if available
    if (hvacState) {
      if (hvacState === 'idle' || hvacState === 'off') {
        return (
          <div className="flex items-center space-x-1 text-gray-400">
            <Pause className="h-3 w-3 lg:h-4 lg:w-4 xl:h-5 xl:w-5" />
            <span className="text-responsive-sm">Idle</span>
          </div>
        );
      }
      
      if (hvacState.includes('cool')) {
        return (
          <div className="flex items-center space-x-1 text-blue-400">
            <Snowflake className="h-3 w-3 lg:h-4 lg:w-4 xl:h-5 xl:w-5 animate-pulse" />
            <Activity className="h-3 w-3 lg:h-4 lg:w-4 xl:h-5 xl:w-5 animate-bounce" />
            <span className="text-responsive-sm font-medium">Cooling</span>
          </div>
        );
      }
      
      if (hvacState.includes('heat')) {
        return (
          <div className="flex items-center space-x-1 text-red-400">
            <Flame className="h-3 w-3 lg:h-4 lg:w-4 xl:h-5 xl:w-5 animate-pulse" />
            <Activity className="h-3 w-3 lg:h-4 lg:w-4 xl:h-5 xl:w-5 animate-bounce" />
            <span className="text-responsive-sm font-medium">Heating</span>
          </div>
        );
      }
    }
    
    // Fallback to temperature-based logic only if no hvacState and actually active
    if (!active) {
      return (
        <div className="flex items-center space-x-1 text-gray-400">
          <Pause className="h-3 w-3 lg:h-4 lg:w-4 xl:h-5 xl:w-5" />
          <span className="text-responsive-sm">Idle</span>
        </div>
      );
    }

    // Default to idle
    return (
      <div className="flex items-center space-x-1 text-gray-400">
        <Pause className="h-3 w-3 lg:h-4 lg:w-4 xl:h-5 xl:w-5" />
        <span className="text-responsive-sm">Idle</span>
      </div>
    );
  };

  const getTemperatureColor = (current: number, target: number, mode: string) => {
    const diff = current - target;
    const active = Math.abs(current - target) > 1.0;

    if (active) {
      // HVAC is actively working
      if (mode === 'cool' || (mode === 'auto' && diff > 0)) return 'text-blue-300';
      if (mode === 'heat' || (mode === 'auto' && diff < 0)) return 'text-red-300';
    }

    // Normal temperature display
    if (Math.abs(diff) < 0.5) return 'text-green-400'; // At target
    if (diff > 1) return 'text-orange-400'; // Too warm
    if (diff < -1) return 'text-cyan-400'; // Too cool
    return 'text-foreground'; // Close to target
  };

  const getTargetTempColor = (mode: string) => {
    switch (mode) {
      case 'cool':
        return 'text-blue-400';
      case 'heat':
        return 'text-red-400';
      case 'auto':
        return 'text-yellow-400';
      case 'off':
        return 'text-gray-400';
      default:
        return 'text-cyan-400';
    }
  };

  return (
    <div className="weather-card col-span-2 minimal-padding">
      <div className="weather-card-header">
        <div className="flex items-center gap-2">
          <h3 className="weather-card-title">Indoor Climate</h3>
          {isStale && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-500 border border-yellow-500/30 animate-pulse">
              Delayed
            </span>
          )}
        </div>
        <div className="flex items-center space-x-1">
          <Home className="weather-card-icon" />
          <Thermometer className="weather-card-icon" />
        </div>
      </div>
      
      <div className="weather-card-content">
        <div className="flex items-stretch justify-between space-x-8 w-full">
          {thermostats.map((thermostat, index) => {
            const tempColor = getTemperatureColor(thermostat.temperature, thermostat.targetTemp, thermostat.mode);
            const active = isHvacActive(thermostat);
            
            return (
              <div key={thermostat.id} className="flex-1 relative flex flex-col justify-center space-y-2">
                {/* Top Row - Location Name with Icon and HVAC Status */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {thermostat.name.toLowerCase().includes('lake') ? (
                      <svg className="h-4 w-4 lg:h-5 lg:w-5 xl:h-6 xl:w-6 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-5-9h10v2H7z"/>
                        <path d="M7 13h2v2H7zm4 0h2v2h-2zm4 0h2v2h-2z"/>
                      </svg>
                    ) : (
                      <Home className="h-4 w-4 lg:h-5 lg:w-5 xl:h-6 xl:w-6 text-green-400" />
                    )}
                    <span className="text-responsive-sm font-semibold text-foreground">
                      {thermostat.name}
                    </span>
                  </div>
                  {getHvacStatusIndicator(thermostat)}
                </div>

                {/* Bottom Row - Temperature and Humidity Info */}
                <div className="flex items-center justify-between">
                  {/* Current Temperature */}
                  <div className="text-left">
                    <div className={`text-responsive-lg font-bold ${tempColor} ${active ? 'animate-pulse' : ''}`}>
                      {preferences ? (
                        <TemperatureDisplay temperature={thermostat.temperature} preferences={preferences} decimals={1} />
                      ) : (
                        <>
                          {thermostat.temperature.toFixed(1)}
                          <sup className="text-[0.6em] ml-0.5">°F</sup>
                        </>
                      )}
                    </div>
                    <div className="text-responsive-xs text-muted-foreground">Current</div>
                  </div>

                  {/* Center - Humidity */}
                  <div className="text-center">
                    {thermostat.humidity && (
                      <>
                        <div className="text-responsive-sm font-normal text-blue-300">
                          {thermostat.humidity}%
                        </div>
                        <div className="text-responsive-2xs text-muted-foreground opacity-70">Humidity</div>
                      </>
                    )}
                  </div>

                  {/* Target Temperature */}
                  <div className="text-right">
                    <div className={`text-responsive-md font-medium ${getTargetTempColor(thermostat.mode)}`}>
                      → {preferences ? (
                        <TemperatureDisplay temperature={thermostat.targetTemp} preferences={preferences} decimals={0} />
                      ) : (
                        <>
                          {thermostat.targetTemp}
                          <sup className="text-[0.6em] ml-0.5">°F</sup>
                        </>
                      )}
                    </div>
                    <div className="text-responsive-xs text-muted-foreground">Target</div>
                  </div>
                </div>

                {/* Add divider between thermostats with more spacing */}
                {index < thermostats.length - 1 && (
                  <div className="absolute -right-6 top-1/2 transform -translate-y-1/2 w-px h-8 lg:h-12 xl:h-16 2xl:h-20 bg-border"></div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}