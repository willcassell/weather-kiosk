import { expect, test, describe } from 'vitest';
import {
    fahrenheitToCelsius,
    celsiusToFahrenheit,
    convertTemperature,
    convertSpeed,
    convertPressure,
    convertDistance,
    convertPrecipitation
} from './units';

describe('Temperature Conversions', () => {
    test('celsiusToFahrenheit', () => {
        expect(celsiusToFahrenheit(0)).toBe(32);
        expect(celsiusToFahrenheit(100)).toBe(212);
    });

    test('fahrenheitToCelsius', () => {
        expect(fahrenheitToCelsius(32)).toBe(0);
        expect(fahrenheitToCelsius(212)).toBe(100);
    });

    test('convertTemperature', () => {
        expect(convertTemperature(0, 'celsius', 'fahrenheit')).toBe(32);
        expect(convertTemperature(32, 'fahrenheit', 'celsius')).toBe(0);
        expect(convertTemperature(50, 'fahrenheit', 'fahrenheit')).toBe(50);
    });
});

describe('Speed Conversions', () => {
    test('mph to m/s', () => {
        // 22.369 mph is ~ 10 m/s
        expect(convertSpeed(22.369, 'mph', 'ms')).toBeCloseTo(10, 2);
    });

    test('m/s to mph', () => {
        expect(convertSpeed(10, 'ms', 'mph')).toBeCloseTo(22.369, 2);
    });
});

describe('Pressure Conversions', () => {
    test('inHg to hPa', () => {
        expect(convertPressure(29.92, 'inHg', 'hPa')).toBeCloseTo(1013.2, 1);
    });

    test('hPa to inHg', () => {
        expect(convertPressure(1013.25, 'hPa', 'inHg')).toBeCloseTo(29.92, 2);
    });
});

describe('Distance Conversions', () => {
    test('miles to kilometers', () => {
        expect(convertDistance(1, 'miles', 'kilometers')).toBeCloseTo(1.609, 3);
    });

    test('kilometers to miles', () => {
        expect(convertDistance(1.60934, 'kilometers', 'miles')).toBeCloseTo(1, 3);
    });
});

describe('Precipitation Conversions', () => {
    test('inches to mm', () => {
        expect(convertPrecipitation(1, 'inches', 'mm')).toBeCloseTo(25.4, 1);
    });

    test('mm to inches', () => {
        expect(convertPrecipitation(25.4, 'mm', 'inches')).toBeCloseTo(1, 1);
    });
});
