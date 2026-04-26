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

    describe('getRecentLightningData', () => {
        test('returns lightning even without distance', async () => {
            const now = new Date();
            await storage.saveWeatherObservation({
                stationId: 'station-1',
                timestamp: now,
                temperature: 70,
                lightningStrikeCount: 1,
                lightningStrikeDistance: null,
            });

            const since = new Date(now.getTime() - 60 * 60 * 1000); // 1 hour ago
            const result = await storage.getRecentLightningData('station-1', since);
            expect(result).not.toBeNull();
            expect(result!.distance).toBeNull();
            expect(result!.timestamp.getTime()).toBe(now.getTime());
        });

        test('ignores lightning older than cutoff', async () => {
            const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000);
            await storage.saveWeatherObservation({
                stationId: 'station-1',
                timestamp: fourHoursAgo,
                temperature: 70,
                lightningStrikeCount: 3,
                lightningStrikeDistance: 5.2,
            });

            const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000);
            const result = await storage.getRecentLightningData('station-1', threeHoursAgo);
            expect(result).toBeNull();
        });

        test('returns newest lightning observation', async () => {
            const now = new Date();
            const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
            const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);

            await storage.saveWeatherObservation({
                stationId: 'station-1',
                timestamp: twoHoursAgo,
                temperature: 70,
                lightningStrikeCount: 1,
                lightningStrikeDistance: 8.0,
            });

            await storage.saveWeatherObservation({
                stationId: 'station-1',
                timestamp: oneHourAgo,
                temperature: 71,
                lightningStrikeCount: 2,
                lightningStrikeDistance: 3.5,
            });

            const since = new Date(now.getTime() - 3 * 60 * 60 * 1000);
            const result = await storage.getRecentLightningData('station-1', since);
            expect(result).not.toBeNull();
            expect(result!.timestamp.getTime()).toBe(oneHourAgo.getTime());
            expect(result!.distance).toBe(3.5);
        });

        test('returns lightning with distance when present', async () => {
            const now = new Date();
            await storage.saveWeatherObservation({
                stationId: 'station-1',
                timestamp: now,
                temperature: 70,
                lightningStrikeCount: 5,
                lightningStrikeDistance: 7.2,
            });

            const since = new Date(now.getTime() - 60 * 60 * 1000);
            const result = await storage.getRecentLightningData('station-1', since);
            expect(result).not.toBeNull();
            expect(result!.distance).toBe(7.2);
        });
    });
});
