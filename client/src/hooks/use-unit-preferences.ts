import { useState, useEffect } from 'react';
import type { UnitPreferences } from '@shared/units';
import { DEFAULT_UNITS, METRIC_UNITS } from '@shared/units';

const STORAGE_KEY = 'weather-unit-preferences';

export function useUnitPreferences() {
  const [preferences, setPreferences] = useState<UnitPreferences>(DEFAULT_UNITS);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load preferences from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setPreferences({ ...DEFAULT_UNITS, ...parsed });
      }
    } catch (error) {
      console.error('Failed to load unit preferences:', error);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save preferences to localStorage when they change
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
      } catch (error) {
        console.error('Failed to save unit preferences:', error);
      }
    }
  }, [preferences, isLoaded]);

  const updatePreference = <K extends keyof UnitPreferences>(
    key: K,
    value: UnitPreferences[K]
  ) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  };

  const setImperial = () => {
    setPreferences(DEFAULT_UNITS);
  };

  const setMetric = () => {
    setPreferences(METRIC_UNITS);
  };

  const resetToDefaults = () => {
    setPreferences(DEFAULT_UNITS);
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