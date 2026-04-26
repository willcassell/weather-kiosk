import { expect, test, describe } from 'vitest';
import { isLightningRecent, getLightningSeverity, LIGHTNING_RECENT_HOURS } from './lightning';

describe('isLightningRecent', () => {
    const now = new Date('2026-04-26T12:00:00Z');

    test('returns true for strike within window', () => {
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
        expect(isLightningRecent(oneHourAgo, now)).toBe(true);
    });

    test('returns true for strike just now', () => {
        expect(isLightningRecent(now, now)).toBe(true);
    });

    test('returns false for strike older than window', () => {
        const fourHoursAgo = new Date(now.getTime() - 4 * 60 * 60 * 1000);
        expect(isLightningRecent(fourHoursAgo, now)).toBe(false);
    });

    test('returns false for strike exactly at window boundary', () => {
        const exactCutoff = new Date(now.getTime() - LIGHTNING_RECENT_HOURS * 60 * 60 * 1000);
        expect(isLightningRecent(exactCutoff, now)).toBe(false);
    });

    test('returns false for null time', () => {
        expect(isLightningRecent(null, now)).toBe(false);
    });

    test('returns false for undefined time', () => {
        expect(isLightningRecent(undefined, now)).toBe(false);
    });
});

describe('getLightningSeverity', () => {
    test('returns red for distance <= 5', () => {
        expect(getLightningSeverity(0)).toBe('text-red-400');
        expect(getLightningSeverity(3)).toBe('text-red-400');
        expect(getLightningSeverity(5)).toBe('text-red-400');
    });

    test('returns orange for distance 5-10', () => {
        expect(getLightningSeverity(5.1)).toBe('text-orange-400');
        expect(getLightningSeverity(8)).toBe('text-orange-400');
        expect(getLightningSeverity(10)).toBe('text-orange-400');
    });

    test('returns yellow for distance > 10', () => {
        expect(getLightningSeverity(10.1)).toBe('text-yellow-400');
        expect(getLightningSeverity(20)).toBe('text-yellow-400');
    });

    test('returns yellow for null distance', () => {
        expect(getLightningSeverity(null)).toBe('text-yellow-400');
    });

    test('returns yellow for undefined distance', () => {
        expect(getLightningSeverity(undefined)).toBe('text-yellow-400');
    });
});
