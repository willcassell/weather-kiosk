import { Thermometer, Home, Snowflake, Flame, Target, Pause, Activity } from "lucide-react";

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
  error?: string;
}

export default function ThermostatCard({ thermostats, isLoading, error }: ThermostatCardProps) {
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
          <Thermometer className="weather-card-icon h-4 w-4" />
        </div>
        <div className="flex items-center justify-center py-4">
          <div className="text-sm text-muted-foreground">
            {error || "No thermostat data available"}
          </div>
        </div>
      </div>
    );
  }

  const isHvacActive = (mode: string, currentTemp: number, targetTemp: number) => {
    const diff = currentTemp - targetTemp;
    if (mode === 'off') return false;
    if (mode === 'cool') return diff > 0.3; // Cooling when above target
    if (mode === 'heat') return diff < -0.3; // Heating when below target
    if (mode === 'auto') return Math.abs(diff) > 0.5; // Auto mode with wider tolerance
    return false;
  };

  const getHvacStatusIndicator = (mode: string, currentTemp: number, targetTemp: number) => {
    const active = isHvacActive(mode, currentTemp, targetTemp);
    const diff = currentTemp - targetTemp;
    
    if (!active || mode === 'off') {
      return (
        <div className="flex items-center space-x-1 text-gray-400">
          <Pause className="h-3 w-3" />
          <span className="text-xs">Idle</span>
        </div>
      );
    }

    if (mode === 'cool' || (mode === 'auto' && diff > 0)) {
      return (
        <div className="flex items-center space-x-1 text-blue-400">
          <Snowflake className="h-3 w-3 animate-pulse" />
          <Activity className="h-3 w-3 animate-bounce" />
          <span className="text-xs font-medium">Cooling</span>
        </div>
      );
    }

    if (mode === 'heat' || (mode === 'auto' && diff < 0)) {
      return (
        <div className="flex items-center space-x-1 text-red-400">
          <Flame className="h-3 w-3 animate-pulse" />
          <Activity className="h-3 w-3 animate-bounce" />
          <span className="text-xs font-medium">Heating</span>
        </div>
      );
    }

    return (
      <div className="flex items-center space-x-1 text-green-400">
        <Target className="h-3 w-3" />
        <span className="text-xs">Auto</span>
      </div>
    );
  };

  const getTemperatureColor = (current: number, target: number, mode: string) => {
    const diff = current - target;
    const active = isHvacActive(mode, current, target);
    
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

  return (
    <div className="weather-card col-span-2 minimal-padding">
      <div className="weather-card-header">
        <h3 className="weather-card-title">Indoor Climate</h3>
        <div className="flex items-center space-x-1">
          <Home className="weather-card-icon h-4 w-4" />
          <Thermometer className="weather-card-icon h-4 w-4" />
        </div>
      </div>
      
      <div className="flex items-center justify-between space-x-6">
        {thermostats.map((thermostat, index) => {
          const tempColor = getTemperatureColor(thermostat.temperature, thermostat.targetTemp, thermostat.mode);
          const active = isHvacActive(thermostat.mode, thermostat.temperature, thermostat.targetTemp);
          
          return (
            <div key={thermostat.id} className="flex-1 relative">
              <div className="flex items-center justify-between">
                {/* Left - Location Name & HVAC Status */}
                <div className="text-left">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-lg font-semibold text-foreground">
                      {thermostat.name}
                    </span>
                  </div>
                  {getHvacStatusIndicator(thermostat.mode, thermostat.temperature, thermostat.targetTemp)}
                </div>
                
                {/* Center - Current Temperature with Activity Indicator */}
                <div className="text-center">
                  <div className={`text-3xl font-bold ${tempColor} ${active ? 'animate-pulse' : ''}`}>
                    {thermostat.temperature.toFixed(1)}°
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Current
                  </div>
                </div>
                
                {/* Right - Target & Humidity */}
                <div className="text-right">
                  <div className="text-lg font-medium text-cyan-400">
                    → {thermostat.targetTemp}°
                  </div>
                  <div className="text-xs text-muted-foreground">Target</div>
                  {thermostat.humidity && (
                    <div className="text-xs text-blue-300 mt-1">
                      {thermostat.humidity}% RH
                    </div>
                  )}
                </div>
              </div>
              
              {/* Add divider between thermostats */}
              {index < thermostats.length - 1 && (
                <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-px h-16 bg-border"></div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}