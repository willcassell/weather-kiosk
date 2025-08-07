import { 
  convertTemperature, 
  convertSpeed, 
  convertPressure, 
  convertDistance, 
  convertPrecipitation,
  getUnitSymbol,
  type UnitPreferences 
} from '@shared/units';

export function formatTemperature(
  tempF: number, 
  preferences: UnitPreferences, 
  decimals: number = 1
): string {
  const converted = convertTemperature(tempF, 'fahrenheit', preferences.temperature);
  const symbol = getUnitSymbol(preferences.temperature);
  return `${converted.toFixed(decimals)}${symbol}`;
}

export function formatSpeed(
  speedMph: number, 
  preferences: UnitPreferences, 
  decimals: number = 1
): string {
  const converted = convertSpeed(speedMph, 'mph', preferences.speed);
  const symbol = getUnitSymbol(preferences.speed);
  return `${converted.toFixed(decimals)} ${symbol}`;
}

export function formatPressure(
  pressureInHg: number, 
  preferences: UnitPreferences, 
  decimals: number = 2
): string {
  const converted = convertPressure(pressureInHg, 'inHg', preferences.pressure);
  const symbol = getUnitSymbol(preferences.pressure);
  return `${converted.toFixed(decimals)} ${symbol}`;
}

export function formatDistance(
  distanceMiles: number, 
  preferences: UnitPreferences, 
  decimals: number = 1
): string {
  const converted = convertDistance(distanceMiles, 'miles', preferences.distance);
  const symbol = getUnitSymbol(preferences.distance);
  return `${converted.toFixed(decimals)} ${symbol}`;
}

export function formatPrecipitation(
  precipInches: number, 
  preferences: UnitPreferences, 
  decimals: number = 2
): string {
  const converted = convertPrecipitation(precipInches, 'inches', preferences.precipitation);
  const symbol = getUnitSymbol(preferences.precipitation);
  return `${converted.toFixed(decimals)} ${symbol}`;
}

// Convenience function for temperature without decimal places
export function formatTemperatureWhole(
  tempF: number, 
  preferences: UnitPreferences
): string {
  return formatTemperature(tempF, preferences, 0);
}

// Wind direction with speed
export function formatWind(
  speedMph: number,
  direction: string,
  preferences: UnitPreferences
): string {
  const speedStr = formatSpeed(speedMph, preferences);
  return `${direction} ${speedStr}`;
}

// Pressure with trend indicator
export function formatPressureWithTrend(
  pressureInHg: number,
  trend: string,
  preferences: UnitPreferences
): string {
  const pressureStr = formatPressure(pressureInHg, preferences);
  const trendSymbol = trend === 'Rising' ? '↗' : trend === 'Falling' ? '↘' : '→';
  return `${pressureStr} ${trendSymbol}`;
}