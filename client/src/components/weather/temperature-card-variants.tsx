/**
 * Temperature Card Variants
 *
 * All 4 temperature card sizes for the configurable card system
 */

import CardWrapper from './card-wrapper';
import { type CardSize } from '@/types/card-config';

interface TemperatureData {
  current: number;
  feelsLike: number;
  high: number;
  low: number;
  highTime?: Date;
  lowTime?: Date;
}

interface BaseProps {
  data: TemperatureData;
  unit: 'F' | 'C';
}

/**
 * Temperature - Compact (1/3 width, Small height)
 * Shows: Current temperature only
 */
export function TemperatureCompact({ data, unit }: BaseProps) {
  const size: CardSize = { width: '1/3', height: 'small' };

  return (
    <CardWrapper size={size} title="Temperature">
      <div className="text-center">
        <div className="text-5xl font-bold">
          {Math.round(data.current)}°
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          {unit === 'F' ? 'Fahrenheit' : 'Celsius'}
        </div>
      </div>
    </CardWrapper>
  );
}

/**
 * Temperature - Standard (1/2 width, Medium height)
 * Shows: Current temperature + High/Low for today
 */
export function TemperatureStandard({ data, unit }: BaseProps) {
  const size: CardSize = { width: '1/2', height: 'medium' };

  return (
    <CardWrapper size={size} title="Temperature">
      <div className="flex flex-col gap-3">
        {/* Current temp */}
        <div className="text-center">
          <div className="text-6xl font-bold">
            {Math.round(data.current)}°{unit}
          </div>
        </div>

        {/* High/Low */}
        <div className="flex justify-around text-sm">
          <div className="text-center">
            <div className="text-muted-foreground text-xs">HIGH</div>
            <div className="text-2xl font-semibold text-red-400">
              {Math.round(data.high)}°
            </div>
          </div>
          <div className="text-center">
            <div className="text-muted-foreground text-xs">LOW</div>
            <div className="text-2xl font-semibold text-blue-400">
              {Math.round(data.low)}°
            </div>
          </div>
        </div>
      </div>
    </CardWrapper>
  );
}

/**
 * Temperature - Detailed (2/3 width, Large height)
 * Shows: Current temp, Feels like, High/Low with exact times
 */
export function TemperatureDetailed({ data, unit }: BaseProps) {
  const size: CardSize = { width: '2/3', height: 'large' };

  const formatTime = (date?: Date) => {
    if (!date) return '--:--';
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(date);
  };

  return (
    <CardWrapper size={size} title="Temperature">
      <div className="flex flex-col gap-4">
        {/* Current and Feels Like */}
        <div className="flex justify-around items-center">
          <div className="text-center">
            <div className="text-xs text-muted-foreground mb-1">CURRENT</div>
            <div className="text-7xl font-bold">
              {Math.round(data.current)}°{unit}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-muted-foreground mb-1">FEELS LIKE</div>
            <div className="text-4xl font-semibold text-muted-foreground">
              {Math.round(data.feelsLike)}°
            </div>
          </div>
        </div>

        {/* High/Low with times */}
        <div className="flex justify-around border-t border-border pt-3">
          <div className="text-center">
            <div className="text-xs text-muted-foreground mb-1">HIGH</div>
            <div className="text-3xl font-bold text-red-400">
              {Math.round(data.high)}°
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {formatTime(data.highTime)}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-muted-foreground mb-1">LOW</div>
            <div className="text-3xl font-bold text-blue-400">
              {Math.round(data.low)}°
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {formatTime(data.lowTime)}
            </div>
          </div>
        </div>
      </div>
    </CardWrapper>
  );
}

/**
 * Temperature - Full (3/3 width, Large height)
 * Shows: Everything + placeholder for 24-hour chart
 */
export function TemperatureFull({ data, unit }: BaseProps) {
  const size: CardSize = { width: '3/3', height: 'large' };

  const formatTime = (date?: Date) => {
    if (!date) return '--:--';
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(date);
  };

  return (
    <CardWrapper size={size} title="Temperature - Full Details">
      <div className="grid grid-cols-3 gap-4 h-full">
        {/* Left: Current */}
        <div className="flex flex-col justify-center items-center border-r border-border">
          <div className="text-xs text-muted-foreground mb-2">CURRENT</div>
          <div className="text-7xl font-bold">
            {Math.round(data.current)}°{unit}
          </div>
          <div className="text-sm text-muted-foreground mt-2">
            Feels like {Math.round(data.feelsLike)}°
          </div>
        </div>

        {/* Middle: High/Low */}
        <div className="flex flex-col justify-center gap-4">
          <div className="text-center">
            <div className="text-xs text-muted-foreground mb-1">TODAY'S HIGH</div>
            <div className="text-4xl font-bold text-red-400">
              {Math.round(data.high)}°
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              at {formatTime(data.highTime)}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-muted-foreground mb-1">TODAY'S LOW</div>
            <div className="text-4xl font-bold text-blue-400">
              {Math.round(data.low)}°
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              at {formatTime(data.lowTime)}
            </div>
          </div>
        </div>

        {/* Right: Chart placeholder */}
        <div className="flex flex-col justify-center items-center border-l border-border">
          <div className="text-xs text-muted-foreground mb-2">24-HOUR TREND</div>
          <div className="w-full h-32 bg-muted/20 rounded flex items-center justify-center">
            <span className="text-xs text-muted-foreground">Chart coming in Phase 2</span>
          </div>
        </div>
      </div>
    </CardWrapper>
  );
}
