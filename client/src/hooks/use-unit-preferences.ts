import { useState, useEffect } from 'react';
import type { UnitPreferences } from '@shared/units';
import { DEFAULT_UNITS, METRIC_UNITS } from '@shared/units';



export function useUnitPreferences() {
  const [preferences, setPreferences] = useState<UnitPreferences>(DEFAULT_UNITS);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load preferences from environment variable on mount
  useEffect(() => {
    const unitSystem = import.meta.env.VITE_UNIT_SYSTEM?.toLowerCase();
    
    if (unitSystem === 'metric') {
      setPreferences(METRIC_UNITS);
    } else {
      // Default to imperial if not specified or invalid
      setPreferences(DEFAULT_UNITS);
    }
    
    setIsLoaded(true);
  }, []);

  // These functions are kept for compatibility but don't persist changes
  const updatePreference = <K extends keyof UnitPreferences>(
    key: K,
    value: UnitPreferences[K]
  ) => {
    console.warn('Unit preferences are controlled by VITE_UNIT_SYSTEM environment variable');
  };

  const setImperial = () => {
    console.warn('Unit preferences are controlled by VITE_UNIT_SYSTEM environment variable');
  };
  
  const setMetric = () => {
    console.warn('Unit preferences are controlled by VITE_UNIT_SYSTEM environment variable');
  };
  
  const resetToDefaults = () => {
    console.warn('Unit preferences are controlled by VITE_UNIT_SYSTEM environment variable');
  };

  return {
    preferences,
    isLoaded,
    updatePreference,
    setImperial,
    setMetric,
    resetToDefaults
  };
}