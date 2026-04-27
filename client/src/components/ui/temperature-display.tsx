import { convertTemperature, getUnitSymbol, type UnitPreferences } from '@shared/units';

interface TemperatureDisplayProps {
  temperature: number;
  preferences: UnitPreferences;
  decimals?: number;
  className?: string;
}

export function TemperatureDisplay({
  temperature,
  preferences,
  decimals = 1,
  className = ""
}: TemperatureDisplayProps) {
  const converted = convertTemperature(temperature, 'fahrenheit', preferences.temperature);
  const symbol = getUnitSymbol(preferences.temperature);
  const fixed = converted.toFixed(decimals);
  const [intPart, decPart] = fixed.split('.');

  return (
    <span className={className}>
      {intPart}
      <sup className="text-[0.5em] ml-0.5">
        {decPart ? `.${decPart}` : ''}{symbol}
      </sup>
    </span>
  );
}
