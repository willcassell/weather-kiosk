import { expect, test, describe, beforeEach } from 'vitest';
import { MemStorage } from './storage';

describe('Storage Operations (MemStorage)', () => {
    let storage: MemStorage;

    beforeEach(() => {
        storage = new MemStorage();
    });

    test('saveWeatherObservation and getWeatherObservations', async () => {
        const obs = await storage.saveWeatherObservation({
            stationId: 'station-1',
            timestamp: new Date(),
            temperature: 70,
        });

        expect(obs.id).toBeDefined();
        expect(obs.temperature).toBe(70);

        const history = await storage.getWeatherObservations('station-1', 24);
        expect(history.length).toBe(1);
        expect(history[0].temperature).toBe(70);
    });

    test('saveWeatherData and getLatestWeatherData', async () => {
        await storage.saveWeatherData({
            stationId: 'station-1',
            timestamp: new Date(),
            temperature: 75,
            windSpeed: 10,
        });

        const latest = await storage.getLatestWeatherData('station-1');
        expect(latest).toBeDefined();
        expect(latest?.temperature).toBe(75);
        expect(latest?.windSpeed).toBe(10);
    });

    test('saveThermostatData saves and replaces old data for same thermostat', async () => {
        await storage.saveThermostatData({
            thermostatId: 1,
            name: 'Main',
            temperature: 70,
        });

        await storage.saveThermostatData({
            thermostatId: 1,
            name: 'Main',
            temperature: 72,
        });

        const latest = await storage.getLatestThermostatData();
        expect(latest.length).toBe(1);
        expect(latest[0].temperature).toBe(72);
    });

    test('cleanupOldData works', async () => {
        const result = await storage.cleanupOldData();
        // MemStorage cleanup is a no-op but returns 0s
        expect(result.weatherObservations).toBe(0);
    });
});
