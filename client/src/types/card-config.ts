/**
 * Configurable Cards - Type Definitions
 *
 * This file contains all TypeScript interfaces for the configurable card system
 */

export type CardWidth = '1/3' | '1/2' | '2/3' | '3/3';
export type CardHeight = 'small' | 'medium' | 'large' | 'xlarge';

export interface CardSize {
  width: CardWidth;
  height: CardHeight;
}

export type CardType =
  | 'temperature'
  | 'wind'
  | 'rainfall'
  | 'pressure'
  | 'humidity'
  | 'lightning'
  | 'uvIndex'
  | 'thermostat'
  | 'dewPoint'
  | 'feelsLike'
  | 'windSpeed'
  | 'windGust';

export type CardVariant =
  | 'compact'    // 1/3 width, minimal info
  | 'standard'   // 1/2 or 2/3 width, core info
  | 'detailed'   // 2/3 width, comprehensive
  | 'full'       // 3/3 width, everything
  | 'compass'    // Wind-specific with animated compass
  | 'weekly'     // Rain-specific with 7-day chart
  | 'chart'      // Chart variants
  | 'comfort';   // Humidity-specific with comfort indicator

export interface CardConfig {
  id: string;                    // Unique identifier (e.g., "temp-compact-1")
  type: CardType;                // What metric (temperature, wind, etc.)
  variant: CardVariant;          // Which size/detail level
  size: CardSize;                // Display dimensions
  row: number;                   // Grid row position
  column: number;                // Grid column position (1-3)
  enabled: boolean;              // Show/hide toggle
  customTitle?: string;          // Optional custom title (future feature)

  // Type-specific configuration
  config?: {
    thermostatId?: string;       // For thermostat cards (which location)
    showTrend?: boolean;         // Optional features
    colorScheme?: string;        // Color customization
  };
}

export interface DashboardConfig {
  cards: CardConfig[];
  columns: 3;                    // Always 3 columns for grid
  autoHeight: boolean;           // Auto-adjust row heights
}

/**
 * Convert card width to CSS grid column span
 */
export function getColumnSpan(width: CardWidth): number {
  switch (width) {
    case '1/3': return 1;
    case '1/2': return 1.5; // Will need special handling
    case '2/3': return 2;
    case '3/3': return 3;
  }
}

/**
 * Convert card width to CSS class
 */
export function getWidthClass(width: CardWidth): string {
  switch (width) {
    case '1/3': return 'col-span-1';
    case '1/2': return 'w-1/2';  // Special case
    case '2/3': return 'col-span-2';
    case '3/3': return 'col-span-3';
  }
}

/**
 * Convert card height to pixels
 */
export function getHeightPx(height: CardHeight): number {
  switch (height) {
    case 'small': return 120;
    case 'medium': return 180;
    case 'large': return 240;
    case 'xlarge': return 320;
  }
}

/**
 * Convert card height to CSS class
 */
export function getHeightClass(height: CardHeight): string {
  switch (height) {
    case 'small': return 'h-[120px]';
    case 'medium': return 'h-[180px]';
    case 'large': return 'h-[240px]';
    case 'xlarge': return 'h-[320px]';
  }
}
