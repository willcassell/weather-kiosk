import { expect, test, describe } from 'vitest';
import { validateWeatherDataQuality, detectTemperatureSpike } from './api-validation';

describe('validateWeatherDataQuality', () => {
    test('returns no warnings for normal data', () => {
        const warnings = validateWeatherDataQuality({
            temperature: 70,
            windSpeed: 10,
            pressure: 30,
            humidity: 50,
        });
        expect(warnings.length).toBe(0);
    });

    test('validates temperature extremes', () => {
        expect(validateWeatherDataQuality({ temperature: -100 }).length).toBeGreaterThan(0);
        expect(validateWeatherDataQuality({ temperature: 200 }).length).toBeGreaterThan(0);
    });

    test('validates wind speed', () => {
        expect(validateWeatherDataQuality({ windSpeed: -10 }).length).toBeGreaterThan(0);
        expect(validateWeatherDataQuality({ windSpeed: 250 }).length).toBeGreaterThan(0);
    });

    test('validates pressure', () => {
        expect(validateWeatherDataQuality({ pressure: 25 }).length).toBeGreaterThan(0);
        expect(validateWeatherDataQuality({ pressure: 35 }).length).toBeGreaterThan(0);
    });

    test('validates humidity', () => {
        expect(validateWeatherDataQuality({ humidity: -10 }).length).toBeGreaterThan(0);
        expect(validateWeatherDataQuality({ humidity: 150 }).length).toBeGreaterThan(0);
    });
});

describe('detectTemperatureSpike', () => {
    test('returns false for normal delta', () => {
        expect(detectTemperatureSpike(72, 70)).toBe(false);
    });

    test('returns true for large delta', () => {
        expect(detectTemperatureSpike(95, 70)).toBe(true);
    });

    test('respects custom threshold', () => {
        expect(detectTemperatureSpike(75, 70, 3)).toBe(true);
    });
});
