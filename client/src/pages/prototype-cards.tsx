/**
 * Card Prototype Page
 *
 * Testing ground for configurable cards
 * Navigate to /prototype to see this page
 */

import {
  TemperatureCompact,
  TemperatureStandard,
  TemperatureDetailed,
  TemperatureFull
} from '@/components/weather/temperature-card-variants';

export default function PrototypeCards() {
  // Sample data
  const tempData = {
    current: 72.4,
    feelsLike: 70.1,
    high: 78.2,
    low: 65.8,
    highTime: new Date('2025-10-26T14:23:00'),
    lowTime: new Date('2025-10-26T05:12:00'),
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-2">Configurable Cards Prototype</h1>
        <p className="text-muted-foreground mb-8">
          Testing temperature card variants with the new card system
        </p>

        {/* Example 1: All 4 variants stacked */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4 text-primary">
            All Temperature Card Variants
          </h2>
          <div className="grid grid-cols-3 gap-2">
            <TemperatureCompact data={tempData} unit="F" />
            <TemperatureStandard data={tempData} unit="F" />
            <TemperatureFull data={tempData} unit="F" />
            <TemperatureDetailed data={tempData} unit="F" />
          </div>
        </section>

        {/* Example 2: Mixed layout - showing flexibility */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4 text-primary">
            Example Layout: Detailed + 2 Compacts
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Demonstrating: [Temp Detailed 2/3] + [Feels Like Compact 1/3]
          </p>
          <div className="grid grid-cols-3 gap-2">
            <TemperatureDetailed data={tempData} unit="F" />
            <TemperatureCompact data={tempData} unit="F" />
          </div>
        </section>

        {/* Example 3: Three compacts in a row */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4 text-primary">
            Example Layout: Three 1/3 Cards
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Demonstrating: [Temp 1/3] + [Feels Like 1/3] + [Dew Point 1/3]
          </p>
          <div className="grid grid-cols-3 gap-2">
            <TemperatureCompact data={tempData} unit="F" />
            <TemperatureCompact data={tempData} unit="F" />
            <TemperatureCompact data={tempData} unit="F" />
          </div>
        </section>

        {/* Example 4: Standard cards */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4 text-primary">
            Example Layout: Two 1/2 Cards
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Demonstrating: [Temp Standard 1/2] + [Wind Standard 1/2]
          </p>
          <div className="grid grid-cols-2 gap-2">
            <TemperatureStandard data={tempData} unit="F" />
            <TemperatureStandard data={tempData} unit="F" />
          </div>
        </section>

        {/* Example 5: Full width */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4 text-primary">
            Example Layout: Full Width
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Demonstrating: [Temp Full 3/3]
          </p>
          <div className="grid grid-cols-3 gap-2">
            <TemperatureFull data={tempData} unit="F" />
          </div>
        </section>

        {/* Size reference */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4 text-primary">
            Card Size Reference
          </h2>
          <div className="grid grid-cols-4 gap-4 text-sm">
            <div className="p-4 bg-card rounded-lg border border-border">
              <div className="font-semibold mb-2">Compact</div>
              <div className="text-muted-foreground">1/3 width</div>
              <div className="text-muted-foreground">120px height</div>
            </div>
            <div className="p-4 bg-card rounded-lg border border-border">
              <div className="font-semibold mb-2">Standard</div>
              <div className="text-muted-foreground">1/2 width</div>
              <div className="text-muted-foreground">180px height</div>
            </div>
            <div className="p-4 bg-card rounded-lg border border-border">
              <div className="font-semibold mb-2">Detailed</div>
              <div className="text-muted-foreground">2/3 width</div>
              <div className="text-muted-foreground">240px height</div>
            </div>
            <div className="p-4 bg-card rounded-lg border border-border">
              <div className="font-semibold mb-2">Full</div>
              <div className="text-muted-foreground">3/3 width</div>
              <div className="text-muted-foreground">240px height</div>
            </div>
          </div>
        </section>

        <div className="text-center text-muted-foreground text-sm mt-12 pb-8">
          <p>This is a prototype page for testing configurable cards.</p>
          <p className="mt-2">
            <a href="/" className="text-primary hover:underline">← Back to Dashboard</a>
          </p>
        </div>
      </div>
    </div>
  );
}
