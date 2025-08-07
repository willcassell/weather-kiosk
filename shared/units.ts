// Unit conversion utilities and types
export type TemperatureUnit = 'fahrenheit' | 'celsius';
export type SpeedUnit = 'mph' | 'kmh' | 'ms' | 'knots';
export type PressureUnit = 'inHg' | 'hPa' | 'mmHg' | 'kPa';
export type DistanceUnit = 'miles' | 'kilometers';
export type PrecipitationUnit = 'inches' | 'mm';

export interface UnitPreferences {
  temperature: TemperatureUnit;
  speed: SpeedUnit;
  pressure: PressureUnit;
  distance: DistanceUnit;
  precipitation: PrecipitationUnit;
}

export const DEFAULT_UNITS: UnitPreferences = {
  temperature: 'fahrenheit',
  speed: 'mph',
  pressure: 'inHg',
  distance: 'miles',
  precipitation: 'inches'
};

export const METRIC_UNITS: UnitPreferences = {
  temperature: 'celsius',
  speed: 'kmh',
  pressure: 'hPa',
  distance: 'kilometers',
  precipitation: 'mm'
};

// Temperature conversions
export function fahrenheitToCelsius(fahrenheit: number): number {
  return (fahrenheit - 32) * 5/9;
}

export function celsiusToFahrenheit(celsius: number): number {
  return (celsius * 9/5) + 32;
}

export function convertTemperature(temp: number, from: TemperatureUnit, to: TemperatureUnit): number {
  if (from === to) return temp;
  
  if (from === 'fahrenheit' && to === 'celsius') {
    return fahrenheitToCelsius(temp);
  }
  if (from === 'celsius' && to === 'fahrenheit') {
    return celsiusToFahrenheit(temp);
  }
  
  return temp;
}

// Speed conversions (base unit: m/s)
export function convertSpeed(speed: number, from: SpeedUnit, to: SpeedUnit): number {
  if (from === to) return speed;
  
  // Convert to m/s first
  let mps: number;
  switch (from) {
    case 'mph': mps = speed * 0.44704; break;
    case 'kmh': mps = speed * 0.277778; break;
    case 'knots': mps = speed * 0.514444; break;
    case 'ms': mps = speed; break;
    default: mps = speed;
  }
  
  // Convert from m/s to target unit
  switch (to) {
    case 'mph': return mps * 2.23694;
    case 'kmh': return mps * 3.6;
    case 'knots': return mps * 1.94384;
    case 'ms': return mps;
    default: return mps;
  }
}

// Pressure conversions (base unit: hPa/mbar)
export function convertPressure(pressure: number, from: PressureUnit, to: PressureUnit): number {
  if (from === to) return pressure;
  
  // Convert to hPa first
  let hPa: number;
  switch (from) {
    case 'inHg': hPa = pressure * 33.8639; break;
    case 'mmHg': hPa = pressure * 1.33322; break;
    case 'kPa': hPa = pressure * 10; break;
    case 'hPa': hPa = pressure; break;
    default: hPa = pressure;
  }
  
  // Convert from hPa to target unit
  switch (to) {
    case 'inHg': return hPa * 0.02953;
    case 'mmHg': return hPa * 0.750062;
    case 'kPa': return hPa * 0.1;
    case 'hPa': return hPa;
    default: return hPa;
  }
}

// Distance conversions
export function convertDistance(distance: number, from: DistanceUnit, to: DistanceUnit): number {
  if (from === to) return distance;
  
  // Convert to kilometers first
  const km = from === 'miles' ? distance * 1.60934 : distance;
  
  // Convert to target unit
  return to === 'miles' ? km * 0.621371 : km;
}

// Precipitation conversions
export function convertPrecipitation(precip: number, from: PrecipitationUnit, to: PrecipitationUnit): number {
  if (from === to) return precip;
  
  // Convert to mm first
  const mm = from === 'inches' ? precip * 25.4 : precip;
  
  // Convert to target unit
  return to === 'inches' ? mm * 0.0393701 : mm;
}

// Unit display strings
export function getUnitSymbol(unit: string): string {
  const symbols: Record<string, string> = {
    fahrenheit: '°F',
    celsius: '°C',
    mph: 'mph',
    kmh: 'km/h',
    ms: 'm/s',
    knots: 'kts',
    inHg: 'inHg',
    hPa: 'hPa',
    mmHg: 'mmHg',
    kPa: 'kPa',
    miles: 'mi',
    kilometers: 'km',
    inches: 'in',
    mm: 'mm'
  };
  
  return symbols[unit] || unit;
}

export function getUnitLabel(unit: string): string {
  const labels: Record<string, string> = {
    fahrenheit: 'Fahrenheit',
    celsius: 'Celsius',
    mph: 'Miles per hour',
    kmh: 'Kilometers per hour',
    ms: 'Meters per second',
    knots: 'Knots',
    inHg: 'Inches of mercury',
    hPa: 'Hectopascals',
    mmHg: 'Millimeters of mercury',
    kPa: 'Kilopascals',
    miles: 'Miles',
    kilometers: 'Kilometers',
    inches: 'Inches',
    mm: 'Millimeters'
  };
  
  return labels[unit] || unit;
}