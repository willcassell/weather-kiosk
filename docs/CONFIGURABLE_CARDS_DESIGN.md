# Configurable Cards - Design Document

## Overview

Transform the weather kiosk into a fully customizable dashboard where users can:
- Choose which cards to display
- Set card sizes (1/3, 1/2, 2/3, or 3/3 width)
- Arrange cards in custom order
- Configure multiple variants of the same metric

## Current State Analysis

### Existing Cards (Current Sizes)

1. **Temperature Card** - ~3/3 width (flex-[1.5])
   - Shows: Current temp, feels like, high/low with times

2. **Wind Card** - ~2/3 width (w-3/5 in shared row)
   - Shows: Speed, gust, direction, compass

3. **Rainfall Card** - ~1/3 width (w-2/5 in shared row)
   - Shows: Today's rain, yesterday's rain

4. **Pressure Card** - ~3/3 width (flex-1)
   - Shows: Current pressure, trend indicator

5. **Lightning Card** - ~1/2 width (w-1/2 in shared row)
   - Shows: Strike distance, time since last strike

6. **Humidity/Dew Point Card** - ~1/2 width (w-1/2 in shared row)
   - Shows: Humidity %, dew point temp

7. **Thermostat Card** - ~3/3 width (flex-[2.3])
   - Shows: ALL thermostats combined (Downstairs + Lake)

### Current Issues

1. **Inconsistent Heights**: Cards use flex values (flex-1, flex-[1.5], flex-[0.9]) causing varying heights
2. **Fixed Layout**: No user control over order or size
3. **Combined Thermostats**: Multiple thermostats in one card instead of separate cards
4. **No Size Variants**: Each metric has only one size option

---

## Proposed Card System

### Card Size System

All cards will support standardized widths based on a 3-column grid:

- **1/3 width** (33.33%) - Compact, single value
- **1/2 width** (50%) - Medium, 2-3 values
- **2/3 width** (66.66%) - Large, detailed view
- **3/3 width** (100%) - Full width, comprehensive

**Height Standardization**:
- **Small**: 120px - Simple metrics (1-2 values)
- **Medium**: 180px - Standard cards (3-4 values)
- **Large**: 240px - Complex cards (5+ values, graphics)
- **XLarge**: 320px - Very detailed (charts, multiple sections)

---

## Card Catalog

### 1. TEMPERATURE Cards

#### Temperature - Compact (1/3 width, Small height)
- Current temperature only
- Large font, bold
- Color coding (hot/cold)

#### Temperature - Standard (1/2 width, Medium height)
- Current temperature
- High/Low for today
- Compact layout

#### Temperature - Detailed (2/3 width, Large height)
- Current temperature
- Feels like
- High/Low with exact times
- Trend indicator

#### Temperature - Full (3/3 width, Large height)
- Current temperature (prominent)
- Feels like
- High/Low with times
- 24-hour mini chart
- Degree of change from yesterday

---

### 2. WIND Cards

#### Wind - Compact (1/3 width, Small height)
- Wind speed only
- Wind direction (text: "NW")

#### Wind - Standard (1/2 width, Medium height)
- Wind speed
- Wind gust
- Direction with arrow icon

#### Wind - Compass (2/3 width, Large height)
- Current wind speed/gust
- Animated compass
- Direction with cardinal/degrees

#### Wind - Full (3/3 width, Large height)
- Wind speed/gust
- Full compass with animation
- Historical wind chart (last 6 hours)

---

### 3. RAINFALL Cards

#### Rain - Compact (1/3 width, Small height)
- Today's rainfall only

#### Rain - Standard (1/2 width, Small height)
- Today's rainfall
- Yesterday's rainfall

#### Rain - Weekly (2/3 width, Medium height)
- Today + Yesterday
- Last 7 days bar chart

---

### 4. PRESSURE Cards

#### Pressure - Compact (1/3 width, Small height)
- Current pressure only

#### Pressure - Standard (1/2 width, Medium height)
- Current pressure
- Trend (rising/falling/steady)
- Trend arrow

#### Pressure - Chart (2/3 width, Large height)
- Current pressure
- Trend with arrow
- 24-hour pressure chart

---

### 5. HUMIDITY Cards

#### Humidity - Compact (1/3 width, Small height)
- Humidity % only

#### Humidity - Standard (1/2 width, Small height)
- Humidity %
- Dew point

#### Humidity - Comfort (1/2 width, Medium height)
- Humidity %
- Dew point
- Comfort level indicator (dry/comfortable/humid)

---

### 6. LIGHTNING Cards

#### Lightning - Compact (1/3 width, Small height)
- Distance only (or "No strikes")

#### Lightning - Standard (1/2 width, Small height)
- Distance
- Time since last strike

#### Lightning - Detailed (2/3 width, Medium height)
- Distance with visual indicator
- Time since strike
- Strike count today

---

### 7. UV INDEX Cards

#### UV - Compact (1/3 width, Small height)
- UV index number only

#### UV - Standard (1/2 width, Small height)
- UV index
- Category (Low/Moderate/High/Very High)
- Color coding

---

### 8. THERMOSTAT Cards (NEW - Individual per thermostat)

#### Thermostat - Compact (1/3 width, Small height)
**Per Location** (e.g., "Downstairs" or "Lake")
- Current temp
- Target temp
- Location name

#### Thermostat - Standard (1/2 width, Medium height)
**Per Location**
- Current temp (large)
- Target temp
- Mode (heat/cool/auto)
- HVAC state indicator
- Location name

#### Thermostat - Detailed (2/3 width, Large height)
**Per Location**
- Current temp (prominent)
- Target temp
- Humidity
- Mode with icon
- HVAC running indicator (animated)
- Heat/Cool setpoints
- Location name

#### Thermostat - Full (3/3 width, Large height)
**Per Location**
- All above details
- Temperature trend chart (last 24 hours)
- Runtime statistics

---

### 9. ADDITIONAL Single-Metric Cards (All 1/3 width, Small height)

These are standalone 1/3 cards for maximum flexibility:

#### Dew Point - Compact (1/3 width, Small height)
- Dew point temp only

#### Feels Like - Compact (1/3 width, Small height)
- Feels like temp only

#### Wind Speed - Compact (1/3 width, Small height)
- Wind speed only (no direction)

#### Wind Gust - Compact (1/3 width, Small height)
- Wind gust only

#### Pressure - Compact (1/3 width, Small height)
- Pressure value only (already defined above)

#### Today's Rain - Compact (1/3 width, Small height)
- Today's rainfall only (already defined in Rain - Compact)

---

## Configuration Data Structure

```typescript
interface CardSize {
  width: '1/3' | '1/2' | '2/3' | '3/3';  // Grid column span
  height: 'small' | 'medium' | 'large' | 'xlarge';  // Fixed height
}

interface CardConfig {
  id: string;  // Unique identifier (e.g., "temp-compact-1")
  type: CardType;  // What metric (temperature, wind, etc.)
  variant: CardVariant;  // Which size/detail level
  size: CardSize;  // Display dimensions
  row: number;  // Grid row position
  column: number;  // Grid column position (1-3)
  enabled: boolean;  // Show/hide toggle
  customTitle?: string;  // Optional custom title (future feature, Phase 6)

  // Type-specific config
  config?: {
    thermostatId?: string;  // For thermostat cards (which location)
    showTrend?: boolean;  // Optional features
    colorScheme?: string;  // Color customization
  };
}

type CardType =
  | 'temperature'
  | 'wind'
  | 'rainfall'
  | 'pressure'
  | 'humidity'
  | 'lightning'
  | 'uvIndex'
  | 'thermostat'
  | 'dewPoint'
  | 'feelsLike';

type CardVariant =
  | 'compact'    // 1/3 width, minimal info
  | 'standard'   // 1/2 or 2/3 width, core info
  | 'detailed'   // 2/3 width, comprehensive
  | 'full'       // 3/3 width, everything
  | 'compass'    // Wind-specific
  | 'weekly'     // Rain-specific
  | 'chart';     // Chart variants

interface DashboardConfig {
  cards: CardConfig[];
  columns: 3;  // Always 3 columns for grid
  autoHeight: boolean;  // Auto-adjust row heights
}
```

---

## Default Layouts

### Layout 1: "Detailed View" (Current-ish)
```
Row 1: [Temperature - Full (3/3)]
Row 2: [Wind - Compass (2/3)] [Rain - Standard (1/3)]
Row 3: [Pressure - Standard (1/2)] [Humidity - Standard (1/2)]
Row 4: [Lightning - Standard (1/2)] [UV - Standard (1/2)]
Row 5: [Thermostat Downstairs - Detailed (2/3)] [Thermostat Lake - Compact (1/3)]
```

### Layout 2: "Compact Overview"
```
Row 1: [Temp - Compact (1/3)] [Wind - Compact (1/3)] [Rain - Compact (1/3)]
Row 2: [Pressure - Compact (1/3)] [Humidity - Compact (1/3)] [UV - Compact (1/3)]
Row 3: [Thermostat Downstairs - Standard (1/2)] [Thermostat Lake - Standard (1/2)]
```

### Layout 3: "Mixed Detail"
```
Row 1: [Temperature - Detailed (2/3)] [Wind - Standard (1/3)]
Row 2: [Pressure - Standard (1/2)] [Rain - Standard (1/2)]
Row 3: [Thermostat Downstairs - Detailed (2/3)] [Lightning - Standard (1/3)]
```

---

## User Interface Design

### Configuration Panel

**Location**: Accessible via settings icon in top banner

**Features**:
1. **Card Gallery**: Grid view of all available cards with previews
2. **Drag & Drop**: Arrange cards visually
3. **Size Selector**: Quick buttons to change card size
4. **Enable/Disable**: Toggle cards on/off
5. **Preview Mode**: See changes before saving
6. **Presets**: Quick-select default layouts
7. **Export/Import**: Save and share configurations

### Configuration Panel UI (Modal)

```
┌─────────────────────────────────────────────────┐
│  Dashboard Configuration               [X] Close│
├─────────────────────────────────────────────────┤
│                                                  │
│  [Available Cards]          [Your Dashboard]    │
│  ┌──────────────┐          ┌─────────────────┐ │
│  │ Temperature  │          │  Current Layout  │ │
│  │ ○ Compact    │          │                  │ │
│  │ ○ Standard   │          │ [Card][Card]     │ │
│  │ ○ Detailed   │          │ [  Card   ]      │ │
│  │ ○ Full       │          │ [Card][Card]     │ │
│  └──────────────┘          └─────────────────┘ │
│  ┌──────────────┐                               │
│  │ Wind         │          Drag cards to        │
│  │ ○ Compact    │          rearrange            │
│  │ ○ Standard   │                               │
│  │ ○ Compass    │                               │
│  └──────────────┘                               │
│                                                  │
│  [Load Preset ▼] [Save] [Reset to Default]     │
└─────────────────────────────────────────────────┘
```

---

## Storage

**Method**: localStorage for client-side persistence

**Key**: `weather-kiosk-dashboard-config`

**Fallback**: Default layout if no config exists

**Sync**: Optional backend sync for multi-device access (future feature)

---

## Implementation Phases

### Phase 1: Foundation (Week 1)
- [ ] Create card size system (1/3, 1/2, 2/3, 3/3)
- [ ] Standardize card heights (small, medium, large, xlarge)
- [ ] Build base card wrapper component
- [ ] Create configuration data structure

### Phase 2: Card Variants (Week 2)
- [ ] Temperature cards (4 variants)
- [ ] Wind cards (4 variants)
- [ ] Rainfall cards (3 variants)
- [ ] Pressure cards (3 variants)

### Phase 3: More Cards (Week 3)
- [ ] Humidity cards (3 variants)
- [ ] Lightning cards (3 variants)
- [ ] UV Index cards (2 variants)
- [ ] Individual thermostat cards (4 variants per location)

### Phase 4: Configuration UI (Week 4)
- [ ] Configuration modal/panel
- [ ] Card gallery with previews
- [ ] Drag & drop interface
- [ ] Save/load functionality
- [ ] Default presets

### Phase 5: Polish & Testing (Week 5)
- [ ] Responsive behavior testing
- [ ] Performance optimization
- [ ] User testing
- [ ] Documentation
- [ ] Export/import configurations

---

## Technical Considerations

### Grid System
- Use CSS Grid for layout (not flexbox)
- 3 columns always
- Auto-flowing rows
- Gap between cards: 8px

### Performance
- Lazy load card components
- Memoize card renders
- Virtual scrolling for long dashboards (optional)

### Accessibility
- Keyboard navigation for config panel
- Screen reader support
- High contrast mode support
- Touch-friendly drag & drop

### Browser Storage
- Max config size: ~5KB
- Compression for large configs
- Migration strategy for config updates
- Backup/export to JSON file

---

## Design Decisions ✅

1. **Duplicate cards**: ✅ YES - Users can add multiple cards of same type at different sizes
   - Example: 2/3 Temperature + 1/3 Feels Like + 1/3 Dew Point
   - Each card gets unique ID for tracking

2. **All metrics as 1/3 cards**: ✅ YES - Maximum flexibility
   - Every metric should have a compact 1/3 width variant
   - Allows users to create dense information displays
   - Example row: [Temp 1/3] [Feels Like 1/3] [Wind 1/3]

3. **Radar placement**: ✅ FIXED POSITION
   - **Landscape/Kiosk**: Always on right side (current behavior)
   - **Portrait/Mobile**: Always on bottom
   - Not part of configurable card system

4. **Mobile behavior**: ✅ SINGLE COLUMN
   - Vertical scroll
   - Cards stack in configured order
   - Ignore width settings (all cards full width)
   - Maintain configured card order

5. **Custom card titles**: ✅ FUTURE FEATURE
   - Design data structure to support it
   - Add `customTitle?: string` to CardConfig
   - Implementation in Phase 6 (post-MVP)

---

## Success Metrics

1. User can configure dashboard in < 2 minutes
2. Configuration persists across sessions
3. No performance degradation with 15+ cards
4. Mobile rendering works smoothly
5. Users report improved viewing experience

---

## Complete Card Matrix

### Summary by Width

| Width | Metric | Variants | Total |
|-------|--------|----------|-------|
| 1/3 | Temperature, Feels Like, Dew Point, Wind, Wind Speed, Wind Gust, Rain, Pressure, Humidity, Lightning, UV, Thermostat×2 | 1 each | 12 |
| 1/2 | Temperature, Wind, Rain, Pressure, Humidity, Lightning, UV, Thermostat×2 | 1-2 each | 10 |
| 2/3 | Temperature, Wind, Rain, Pressure, Lightning, Thermostat×2 | 1 each | 7 |
| 3/3 | Temperature, Wind, Thermostat×2 | 1 each | 4 |

**Total Unique Card Variants**: 33 cards

### Quick Reference: All Cards by Type

```
TEMPERATURE (4 cards)
├─ Compact (1/3)     → Temp only
├─ Standard (1/2)    → Temp + High/Low
├─ Detailed (2/3)    → Temp + Feels + High/Low + Times
└─ Full (3/3)        → Everything + 24hr chart

WIND (4 cards)
├─ Compact (1/3)     → Speed + Direction text
├─ Standard (1/2)    → Speed + Gust + Arrow
├─ Compass (2/3)     → Animated compass
└─ Full (3/3)        → Compass + 6hr chart

RAINFALL (3 cards)
├─ Compact (1/3)     → Today only
├─ Standard (1/2)    → Today + Yesterday
└─ Weekly (2/3)      → 7-day bar chart

PRESSURE (3 cards)
├─ Compact (1/3)     → Value only
├─ Standard (1/2)    → Value + Trend
└─ Chart (2/3)       → Value + 24hr chart

HUMIDITY (3 cards)
├─ Compact (1/3)     → Humidity % only
├─ Standard (1/2)    → Humidity + Dew point
└─ Comfort (1/2)     → Humidity + Dew + Comfort level

LIGHTNING (3 cards)
├─ Compact (1/3)     → Distance only
├─ Standard (1/2)    → Distance + Time
└─ Detailed (2/3)    → Distance + Time + Count

UV INDEX (2 cards)
├─ Compact (1/3)     → UV number only
└─ Standard (1/2)    → UV + Category + Color

THERMOSTAT - Downstairs (4 cards)
├─ Compact (1/3)     → Temp + Target
├─ Standard (1/2)    → Temp + Target + Mode + State
├─ Detailed (2/3)    → All info + Setpoints
└─ Full (3/3)        → Everything + 24hr chart

THERMOSTAT - Lake (4 cards)
├─ Compact (1/3)     → Temp + Target
├─ Standard (1/2)    → Temp + Target + Mode + State
├─ Detailed (2/3)    → All info + Setpoints
└─ Full (3/3)        → Everything + 24hr chart

SINGLE METRICS (6 cards - all 1/3)
├─ Feels Like        → Feels like temp only
├─ Dew Point         → Dew point only
├─ Wind Speed        → Speed only (no direction)
├─ Wind Gust         → Gust only
├─ Pressure          → (duplicate of Pressure Compact)
└─ Today's Rain      → (duplicate of Rain Compact)
```

**Total: 33 unique card types** (with duplicate thermostats and single metrics)

---

## Notes

- Focus on **high-quality viewing experience**
- Consistent heights are crucial for professional look
- Each thermostat gets its own card (no more combined)
- Grid-based layout is more predictable than flexbox
- Start simple, add features incrementally
- All major metrics available as 1/3 cards for maximum flexibility
- Users can mix and match: [Temp 2/3][Feels Like 1/3] or [Temp 1/3][Wind 1/3][Rain 1/3]
