# Unit Conversion System

## Overview
The WeatherFlow Tempest Dashboard features a comprehensive unit conversion system that allows users to customize all measurement displays according to their preferences. The system supports both imperial and metric units with full conversion capabilities.

## Supported Unit Types

### Temperature
- **Fahrenheit (°F)** - Default imperial
- **Celsius (°C)** - Metric standard

### Wind Speed
- **Miles per hour (mph)** - Default imperial
- **Kilometers per hour (km/h)** - Metric standard
- **Meters per second (m/s)** - Scientific standard
- **Knots (kts)** - Aviation/marine standard

### Pressure
- **Inches of Mercury (inHg)** - Default imperial
- **Hectopascals/Millibars (hPa)** - Metric standard
- **Millimeters of Mercury (mmHg)** - Medical standard
- **Kilopascals (kPa)** - Engineering standard

### Distance
- **Miles (mi)** - Default imperial
- **Kilometers (km)** - Metric standard

### Precipitation
- **Inches (in)** - Default imperial
- **Millimeters (mm)** - Metric standard

## User Interface

### Quick Presets
- **Imperial (US)** - Sets all units to US customary (°F, mph, inHg, mi, in)
- **Metric** - Sets all units to metric system (°C, km/h, hPa, km, mm)

### Individual Settings
Users can customize each measurement type independently through dropdown menus.

### Settings Access
- Settings button (⚙️) in top-right corner of dashboard
- Modal overlay with comprehensive unit selection
- Persistent storage using browser localStorage

## Technical Implementation

### Core Files
- `shared/units.ts` - Unit conversion functions and types
- `client/src/hooks/use-unit-preferences.ts` - React hook for preferences
- `client/src/components/ui/unit-settings.tsx` - Settings UI component
- `client/src/utils/format-values.ts` - Formatting utilities

### Conversion Functions
All conversions use standard conversion factors:
- Temperature: °C = (°F - 32) × 5/9
- Speed: Base unit m/s with standard multipliers
- Pressure: Base unit hPa with standard multipliers
- Distance: Standard mile/kilometer conversion
- Precipitation: Standard inch/millimeter conversion

### Data Flow
1. User selects preferences in settings UI
2. Preferences saved to localStorage via React hook
3. Components receive preferences as props
4. Format functions convert values and append appropriate symbols
5. Display updates in real-time

## Usage Examples

### Component Integration
```typescript
// Weather component receiving preferences
<TemperatureCard 
  currentTemp={67.3}
  preferences={preferences}
/>

// Displays "67.3°F" (Imperial) or "19.6°C" (Metric)
```

### Custom Formatting
```typescript
import { formatTemperature } from "@/utils/format-values";

// Convert and format temperature
const displayTemp = formatTemperature(67.3, preferences, 1);
// Returns "67.3°F" or "19.6°C" with proper symbol
```

### Conversion Functions
```typescript
import { convertTemperature, convertSpeed } from "@shared/units";

// Convert temperature
const celsius = convertTemperature(67.3, 'fahrenheit', 'celsius');
// Returns 19.61111...

// Convert wind speed
const kmh = convertSpeed(15, 'mph', 'kmh');
// Returns 24.14...
```

## Storage & Persistence

### Default Behavior
- System defaults to Imperial (US customary) units
- Settings automatically save to browser localStorage
- Preferences persist across browser sessions
- Graceful fallback to defaults if storage unavailable

### Storage Key
Preferences stored under key: `weather-unit-preferences`

### Data Structure
```typescript
interface UnitPreferences {
  temperature: 'fahrenheit' | 'celsius';
  speed: 'mph' | 'kmh' | 'ms' | 'knots';
  pressure: 'inHg' | 'hPa' | 'mmHg' | 'kPa';
  distance: 'miles' | 'kilometers';
  precipitation: 'inches' | 'mm';
}
```

## User Benefits

### Flexibility
- Mix and match units according to personal preference
- Scientific users can use m/s for wind, hPa for pressure
- Aviation users can use knots for wind speed

### Localization
- Metric system support for international users
- Regional preferences (e.g., mmHg for medical professionals)

### Real-time Updates
- Changes apply immediately without page refresh
- Consistent formatting across all weather components
- Smooth transition between unit systems

## Future Enhancements

### Potential Additions
- Additional temperature scales (Kelvin, Rankine)
- More pressure units (atm, bar, psi)
- Altitude/elevation units
- Different precipitation rate units (mm/hr, in/hr)

### Accessibility
- Screen reader announcements for unit changes
- Keyboard navigation in settings modal
- High contrast mode support

## API Considerations

### Data Sources
- WeatherFlow API provides data in specific units (typically metric)
- Beestat API provides thermostat data in Fahrenheit
- All conversions happen client-side for performance
- Original data precision preserved through calculations

### Precision Handling
- Conversion functions maintain mathematical precision
- Display formatting rounds to appropriate decimal places
- Temperature: 0-1 decimal places
- Pressure: 2 decimal places
- Wind speed: 1 decimal place
- Precipitation: 2 decimal places