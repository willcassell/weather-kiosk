# Weather Kiosk v4.0 - Configurable Card System Design

## Overview

Create a flexible, user-configurable card layout system that allows users to choose which weather data to display, in what size, and in what order.

## Current State Analysis

### Existing Card Sizes (as of v3.0)

Based on Tailwind grid classes, cards currently occupy:

| Card Name | Grid Size | Fraction | Visual Space |
|-----------|-----------|----------|--------------|
| Temperature | `col-span-3` | 3/3 | Full row |
| Pressure | `col-span-3` | 3/3 | Full row |
| Wind | `col-span-2` | 2/3 | Two-thirds |
| Rainfall | `col-span-1` | 1/3 | One-third |
| Lightning | `col-span-1 md:col-span-2` | 1/2 | Half (responsive) |
| Humidity | `col-span-1 md:col-span-2` | 1/2 | Half (responsive) |
| Thermostat | `col-span-3` | 3/3 | Full row |

### Current Layout Logic
- Grid uses `grid-cols-1 md:grid-cols-3` (mobile: 1 column, desktop: 3 columns)
- Cards are hardcoded in specific order
- No user control over visibility or arrangement

---

## Design Goals

1. **Flexibility**: Users can show/hide any card
2. **Customization**: Multiple card sizes for same data type
3. **Row/Column Control**: Users define layout with row-based configuration
4. **Responsive**: Layout adapts to screen sizes automatically
5. **No Breaking Changes**: Existing installations continue to work with defaults

---

## Proposed Card Library

### Card Naming Convention
`{data-type}-{size}-{variant}`

Examples:
- `temperature-full-standard` (current temperature card)
- `temperature-half-compact` (no "feels like")
- `wind-twothirds-compass` (current wind card)
- `wind-half-simple` (speed + direction only)

### Standard Sizes
- **full** = 3/3 columns (100% width)
- **twothirds** = 2/3 columns (~66% width)
- **half** = 1/2 columns (50% width)
- **third** = 1/3 columns (~33% width)

---

## Proposed Card Catalog

### Temperature Cards

| Card ID | Size | Contents | Use Case |
|---------|------|----------|----------|
| `temperature-full-detailed` | 3/3 | Current, Feels Like, High/Low with times | Current default, most info |
| `temperature-half-compact` | 1/2 | Current, High/Low (no times, no feels like) | Space-saving |
| `temperature-third-minimal` | 1/3 | Current temp only | Minimal display |
| `temperature-full-trend` | 3/3 | Current + 24hr temperature graph | Trend viewers |

### Wind Cards

| Card ID | Size | Contents | Use Case |
|---------|------|----------|----------|
| `wind-twothirds-compass` | 2/3 | Current with animated compass, gust | Current default |
| `wind-half-standard` | 1/2 | Speed, direction, compass (smaller) | Balanced |
| `wind-third-simple` | 1/3 | Speed + cardinal direction text only | Minimal |
| `wind-full-detailed` | 3/3 | Speed, gust, compass, wind description, history | Wind enthusiasts |

### Rainfall Cards

| Card ID | Size | Contents | Use Case |
|---------|------|----------|----------|
| `rainfall-third-daily` | 1/3 | Today/Yesterday comparison | Current default |
| `rainfall-half-weekly` | 1/2 | Today + last 7 days total | Weekly tracking |
| `rainfall-full-monthly` | 3/3 | Month-to-date + daily breakdown chart | Detailed precipitation |

### Pressure Cards

| Card ID | Size | Contents | Use Case |
|---------|------|----------|----------|
| `pressure-full-gauge` | 3/3 | Visual gauge with trend | Current default |
| `pressure-half-standard` | 1/2 | Value + trend (no gauge) | Compact |
| `pressure-third-minimal` | 1/3 | Value only | Minimal |
| `pressure-full-trend` | 3/3 | Gauge + 24hr pressure graph | Weather prediction |

### Humidity Cards

| Card ID | Size | Contents | Use Case |
|---------|------|----------|----------|
| `humidity-half-standard` | 1/2 | Humidity + Dew Point | Current default |
| `humidity-third-minimal` | 1/3 | Humidity percentage only | Space-saving |
| `humidity-full-comfort` | 3/3 | Humidity, dew point, comfort index, feel description | Comfort monitoring |

### Lightning Cards

| Card ID | Size | Contents | Use Case |
|---------|------|----------|----------|
| `lightning-half-standard` | 1/2 | Last strike distance + time | Current default |
| `lightning-third-alert` | 1/3 | Distance only with alert color | Minimal warning |
| `lightning-full-history` | 3/3 | Strike map + count + distance over time | Storm tracking |

### Thermostat Cards

| Card ID | Size | Contents | Use Case |
|---------|------|----------|----------|
| `thermostat-full-multi` | 3/3 | Multiple thermostats with HVAC status | Current default |
| `thermostat-half-single` | 1/2 | Single thermostat compact view | One-zone homes |
| `thermostat-third-temp` | 1/3 | Current temp only (no target) | Minimal indoor temp |

### New Card Types (Future)

| Card ID | Size | Contents | Use Case |
|---------|------|----------|----------|
| `uv-third-index` | 1/3 | UV index with color coding | Sun safety |
| `uv-half-detailed` | 1/2 | UV index + safe exposure time | Outdoor activities |
| `solar-third-radiation` | 1/3 | Solar radiation W/m² | Solar panel owners |
| `solar-half-panel` | 1/2 | Radiation + estimated panel output | Solar monitoring |
| `forecast-full-daily` | 3/3 | 5-day forecast cards | Planning ahead |
| `forecast-half-today` | 1/2 | Today's forecast summary | Quick glance |
| `sunrise-third-times` | 1/3 | Sunrise/sunset times | Daylight tracking |
| `sunrise-half-visual` | 1/2 | Sun position arc + times | Visual daylight |
| `moon-third-phase` | 1/3 | Moon phase icon + percentage | Astronomy |
| `alerts-full-warnings` | 3/3 | Active weather alerts/warnings | Safety |
| `radar-full-animated` | 3/3 | Current live radar | Current default (separate) |
| `history-full-temperature` | 3/3 | 7-day temperature line chart | Historical trends |
| `history-full-multivar` | 3/3 | Temp + rain + wind graphs | Comprehensive history |

---

## Configuration Approach

### Option 1: Environment Variable (Simple, Phase 1)

**Format**: Row-based configuration string

```bash
# Each row separated by semicolon
# Cards in row separated by comma
# Format: cardId or cardId:customName

VITE_CARD_LAYOUT="
  temperature-full-detailed;
  wind-twothirds-compass,rainfall-third-daily;
  pressure-half-standard,humidity-half-standard;
  thermostat-full-multi;
  lightning-half-standard,uv-half-detailed
"
```

**Validation Rules**:
- Each row must sum to ≤3 columns (3/3 = 1.0)
- Invalid cards are skipped with console warning
- Empty string = show all default cards

### Option 2: JSON Config File (Advanced, Phase 2)

**Location**: `config/cards.json` or `.env.cards`

```json
{
  "version": "4.0",
  "layout": {
    "rows": [
      {
        "id": "row-1",
        "cards": [
          {
            "type": "temperature-full-detailed",
            "label": "Home Weather"
          }
        ]
      },
      {
        "id": "row-2",
        "cards": [
          {
            "type": "wind-twothirds-compass"
          },
          {
            "type": "rainfall-third-daily",
            "label": "Rain"
          }
        ]
      },
      {
        "id": "row-3",
        "cards": [
          {
            "type": "pressure-half-standard"
          },
          {
            "type": "humidity-half-standard"
          }
        ]
      },
      {
        "id": "row-4",
        "cards": [
          {
            "type": "thermostat-full-multi",
            "visible": true,
            "condition": "BEESTAT_API_KEY_EXISTS"
          }
        ]
      }
    ]
  },
  "theme": {
    "cardSpacing": "normal",
    "cardRadius": "rounded-lg",
    "showCardBorders": true
  }
}
```

### Option 3: Web UI (Phase 3)

- Drag-and-drop interface
- Live preview
- Save to database or export config file
- Protected by authentication

---

## Implementation Architecture

### 1. Card Registry System

**File**: `client/src/config/card-registry.ts`

```typescript
interface CardDefinition {
  id: string;
  name: string;
  size: 'full' | 'twothirds' | 'half' | 'third';
  component: React.ComponentType<any>;
  dataRequirements: string[]; // e.g., ['currentTemp', 'highTemp']
  defaultVisible: boolean;
  category: 'temperature' | 'wind' | 'rain' | 'pressure' | 'humidity' | 'lightning' | 'thermostat' | 'forecast' | 'uv' | 'solar';
}

export const CARD_REGISTRY: Record<string, CardDefinition> = {
  'temperature-full-detailed': {
    id: 'temperature-full-detailed',
    name: 'Temperature (Detailed)',
    size: 'full',
    component: TemperatureCardDetailed,
    dataRequirements: ['currentTemp', 'feelsLike', 'highTemp', 'lowTemp'],
    defaultVisible: true,
    category: 'temperature'
  },
  // ... more cards
};
```

### 2. Layout Parser

**File**: `client/src/utils/layout-parser.ts`

```typescript
interface LayoutRow {
  id: string;
  cards: CardInstance[];
  totalColumns: number;
}

interface CardInstance {
  cardId: string;
  customLabel?: string;
  size: number; // column span (1, 2, or 3)
}

export function parseLayout(layoutString: string): LayoutRow[] {
  // Parse VITE_CARD_LAYOUT environment variable
  // Validate row totals don't exceed 3 columns
  // Return structured layout object
}
```

### 3. Dynamic Card Renderer

**File**: `client/src/components/weather/card-container.tsx`

```typescript
interface CardContainerProps {
  layout: LayoutRow[];
  weatherData: WeatherData;
  preferences: UnitPreferences;
}

export function CardContainer({ layout, weatherData, preferences }: CardContainerProps) {
  return (
    <div className="space-y-4">
      {layout.map(row => (
        <div key={row.id} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {row.cards.map(card => {
            const CardComponent = CARD_REGISTRY[card.cardId]?.component;
            if (!CardComponent) return null;

            return (
              <div key={card.cardId} className={`col-span-${card.size}`}>
                <CardComponent
                  data={weatherData}
                  preferences={preferences}
                  label={card.customLabel}
                />
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
```

### 4. Default Configuration

**File**: `client/src/config/default-layout.ts`

```typescript
export const DEFAULT_LAYOUT = `
  temperature-full-detailed;
  wind-twothirds-compass,rainfall-third-daily;
  pressure-full-gauge;
  humidity-half-standard,lightning-half-standard;
  thermostat-full-multi
`;
```

---

## Migration Strategy

### Phase 1: Foundation (Week 1-2)
- ✅ Create card registry system
- ✅ Build layout parser
- ✅ Implement dynamic card renderer
- ✅ Environment variable configuration
- ✅ Migrate existing cards to new system (no visual changes)
- ✅ Default layout matches current v3.0 exactly

### Phase 2: New Card Sizes (Week 3-4)
- ✅ Create compact/minimal variants of existing cards
- ✅ Build 3-5 new card types (UV, Solar, Forecast, Sunrise, Moon)
- ✅ Documentation for card configuration
- ✅ Example layouts in README

### Phase 3: Advanced Features (Week 5-6)
- ✅ JSON config file support
- ✅ Conditional card visibility (e.g., only show thermostat if API key present)
- ✅ Custom card labels
- ✅ Theme/spacing options

### Phase 4: Web UI (Future)
- ✅ Settings page with authentication
- ✅ Drag-and-drop card builder
- ✅ Live preview
- ✅ Export/import configurations

---

## Example Configurations

### Minimal Setup (Small Display)
```bash
VITE_CARD_LAYOUT="
  temperature-half-compact,wind-half-standard;
  pressure-third-minimal,rainfall-third-daily,humidity-third-minimal
"
```

### Weather Enthusiast (Large Display)
```bash
VITE_CARD_LAYOUT="
  temperature-full-trend;
  wind-full-detailed;
  pressure-full-trend;
  rainfall-full-monthly;
  humidity-full-comfort;
  lightning-full-history;
  forecast-full-daily;
  history-full-multivar
"
```

### Homeowner Focus (Indoor + Outdoor)
```bash
VITE_CARD_LAYOUT="
  thermostat-full-multi;
  temperature-half-compact,humidity-half-standard;
  rainfall-third-daily,wind-third-simple,pressure-third-minimal
"
```

### Solar Panel Owner
```bash
VITE_CARD_LAYOUT="
  solar-half-panel,temperature-half-compact;
  uv-half-detailed,wind-half-standard;
  forecast-full-daily
"
```

---

## Technical Considerations

### Data Fetching Optimization
- Only fetch data required by visible cards
- Lazy load historical data for trend cards
- Cache parsed layout configuration

### Responsive Design
- All card sizes must work on mobile (stack vertically)
- Desktop: respect column spans
- Tablet: adjust twothirds cards to full width

### Performance
- Memoize card components to prevent unnecessary re-renders
- Use React.lazy() for card components
- Virtual scrolling for many-card layouts

### Error Handling
- Invalid card IDs: log warning, skip card
- Row overflow: log error, break into multiple rows
- Missing data: show placeholder in card

### Accessibility
- Maintain semantic HTML in all card sizes
- Ensure color contrast in all variants
- Keyboard navigation for settings UI

---

## Environment Variables Summary

### New Variables (v4.0)

```bash
# Card layout configuration (optional, defaults to current v3.0 layout)
VITE_CARD_LAYOUT="row1;row2;row3"

# Alternative: Path to JSON config file (optional)
VITE_CARD_CONFIG_PATH="/path/to/cards.json"

# Card theme options (optional)
VITE_CARD_SPACING="normal"        # normal, compact, spacious
VITE_CARD_BORDERS="true"          # true, false
VITE_CARD_RADIUS="rounded-lg"     # Tailwind class
```

### Existing Variables (preserved)
All current environment variables remain unchanged and functional.

---

## Documentation Updates Needed

### README.md
- Add "Configuring Your Display" section
- Show example layouts with screenshots
- Document card ID reference

### New File: CARD_REFERENCE.md
- Complete catalog of available cards
- Visual examples (screenshots)
- Configuration syntax guide
- Troubleshooting common layout issues

### QUICK_START.md
- Add optional step for layout customization
- Link to CARD_REFERENCE.md

---

## Testing Strategy

### Unit Tests
- Layout parser validates row totals
- Card registry lookups
- Default layout parsing

### Integration Tests
- All card sizes render without errors
- Data flows correctly to compact variants
- Responsive breakpoints work correctly

### Visual Regression Tests
- Screenshot comparison of default layout
- Ensure v3.0 appearance is preserved with default config

---

## Open Questions / Decisions Needed

1. **Should we support empty rows for spacing?**
   - Pro: More layout control
   - Con: Complexity

2. **Maximum number of rows?**
   - Suggestion: No hard limit, but warn if >10 rows

3. **Mobile behavior for third-size cards?**
   - Option A: Stack vertically (1 per row)
   - Option B: Show 3 per row (tiny on mobile)
   - **Recommendation**: Option A for usability

4. **Card animations on load?**
   - Stagger fade-in for visual polish?
   - Or instant render for speed?

5. **Support custom CSS classes in config?**
   - Allows power users to add custom styling
   - Security concern: XSS if not sanitized

6. **Versioning strategy for card IDs?**
   - If we change a card component significantly, create new ID?
   - Or version the card ID itself (e.g., `temperature-full-detailed-v2`)?

---

## Success Metrics

### User Adoption
- % of users who customize layout
- Most popular card combinations
- Average number of cards displayed

### Performance
- Load time impact of card registry
- Render performance with 10+ cards
- Bundle size increase

### Community
- GitHub issues requesting new card types
- Community-contributed card PRs
- Configuration examples shared

---

## Future Enhancements (v5.0+)

- **Card Marketplace**: Share/download community cards
- **Card Presets**: Pre-built layouts for common use cases
- **Dynamic Cards**: Cards that change based on conditions (e.g., show UV only when sunny)
- **Card Groups**: Collapsible sections of related cards
- **Multi-Page Layouts**: Tab/page system for many cards
- **Card Animations**: Smooth transitions when layout changes
- **A/B Testing**: Try different layouts and see which you prefer

---

## Summary

This configurable card system will:
- ✅ Give users complete control over their display
- ✅ Enable creation of specialized card sizes
- ✅ Support future card types without code changes
- ✅ Maintain backward compatibility
- ✅ Provide path to web-based configuration UI
- ✅ Make project more universally useful

**Next Steps**:
1. Review and refine this design document
2. Start with Phase 1 implementation
3. Create first batch of compact card variants
4. Test with real user configurations

---

**Document Version**: 1.0
**Date**: October 14, 2025
**Status**: Draft for Review
**Authors**: Will Cassell, Claude
