import { Settings, Gauge, Thermometer, Wind, BarChart3, MapPin, CloudRain } from 'lucide-react';
import { Button } from './button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { useUnitPreferences } from '@/hooks/use-unit-preferences';
import { getUnitLabel, getUnitSymbol } from '@shared/units';

interface UnitSettingsProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function UnitSettings({ isOpen, onClose }: UnitSettingsProps) {
  const { preferences, updatePreference, setImperial, setMetric, resetToDefaults } = useUnitPreferences();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md bg-background border-border">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Unit Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Quick Presets */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Quick Setup</h4>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={setImperial}
                className="flex-1"
              >
                Imperial (US)
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={setMetric}
                className="flex-1"
              >
                Metric
              </Button>
            </div>
          </div>

          {/* Individual Unit Settings */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-muted-foreground">Individual Settings</h4>
            
            {/* Temperature */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Thermometer className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Temperature</span>
              </div>
              <Select
                value={preferences.temperature}
                onValueChange={(value) => updatePreference('temperature', value as any)}
              >
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fahrenheit">°F</SelectItem>
                  <SelectItem value="celsius">°C</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Speed */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wind className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Wind Speed</span>
              </div>
              <Select
                value={preferences.speed}
                onValueChange={(value) => updatePreference('speed', value as any)}
              >
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mph">mph</SelectItem>
                  <SelectItem value="kmh">km/h</SelectItem>
                  <SelectItem value="ms">m/s</SelectItem>
                  <SelectItem value="knots">kts</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Pressure */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Gauge className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Pressure</span>
              </div>
              <Select
                value={preferences.pressure}
                onValueChange={(value) => updatePreference('pressure', value as any)}
              >
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="inHg">inHg</SelectItem>
                  <SelectItem value="hPa">hPa</SelectItem>
                  <SelectItem value="mmHg">mmHg</SelectItem>
                  <SelectItem value="kPa">kPa</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Distance */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Distance</span>
              </div>
              <Select
                value={preferences.distance}
                onValueChange={(value) => updatePreference('distance', value as any)}
              >
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="miles">mi</SelectItem>
                  <SelectItem value="kilometers">km</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Precipitation */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CloudRain className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Precipitation</span>
              </div>
              <Select
                value={preferences.precipitation}
                onValueChange={(value) => updatePreference('precipitation', value as any)}
              >
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="inches">in</SelectItem>
                  <SelectItem value="mm">mm</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={resetToDefaults}
              className="flex-1"
            >
              Reset
            </Button>
            <Button
              onClick={onClose}
              className="flex-1"
            >
              Done
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}