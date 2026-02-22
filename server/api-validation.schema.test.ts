import { expect, test, describe } from 'vitest';
import {
    WeatherFlowStationSchema,
    WeatherFlowObservationSchema,
    WeatherFlowForecastSchema,
    BeestatThermostatSchema,
    BeestatResponseSchema
} from './api-validation';

describe('WeatherFlow API Schemas', () => {
    test('validates station data', () => {
        const validStation = {
            station_id: 12345,
            name: "Test Station",
            latitude: 37.0,
            longitude: -78.0,
            timezone: "America/New_York",
            elevation: 100,
            devices: [
                {
                    device_id: 54321,
                    device_type: "ST",
                    device_meta: { name: "Tempest" }
                }
            ]
        };
        expect(WeatherFlowStationSchema.safeParse(validStation).success).toBe(true);
    });

    test('validates observation data', () => {
        const validObs = {
            station_id: 12345,
            obs: [
                {
                    timestamp: 1600000000,
                    air_temperature: 20,
                    station_pressure: 1000,
                    relative_humidity: 50,
                    wind_avg: 5,
                    wind_direction: 180,
                    wind_gust: 10,
                    solar_radiation: 500,
                    uv: 5,
                    precipitation_type: 0,
                    battery: 2.5
                }
            ]
        };
        expect(WeatherFlowObservationSchema.safeParse(validObs).success).toBe(true);

        const invalidObs = {
            station_id: 12345,
            obs: [{ timestamp: "not-a-number", air_temperature: 20 }]
        };
        expect(WeatherFlowObservationSchema.safeParse(invalidObs).success).toBe(false);
    });

    test('validates forecast data', () => {
        const validForecast = {
            current_conditions: {
                air_temperature: 20,
                station_pressure: 1000,
                relative_humidity: 50,
                wind_avg: 5,
                wind_direction: 180,
                wind_gust: 10
            }
        };
        expect(WeatherFlowForecastSchema.safeParse(validForecast).success).toBe(true);
    });
});

describe('Beestat API Schemas', () => {
    test('validates thermostat data', () => {
        const validThermostat = {
            ecobee_thermostat_id: 12345,
            name: "Main",
            temperature: 72,
            settings: {},
            running_equipment: []
        };
        expect(BeestatThermostatSchema.safeParse(validThermostat).success).toBe(true);

        // Missing required fields
        const invalidThermostat = { name: "Main" };
        expect(BeestatThermostatSchema.safeParse(invalidThermostat).success).toBe(false);
    });

    test('validates response data', () => {
        const validResponse = {
            success: true,
            data: {
                "12345": {
                    ecobee_thermostat_id: 12345,
                    name: "Main",
                    temperature: 72,
                    settings: {},
                    running_equipment: []
                }
            }
        };
        expect(BeestatResponseSchema.safeParse(validResponse).success).toBe(true);
    });
});
