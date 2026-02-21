import { fetchBeestatThermostats } from './beestat-api.js';
import { storage } from './storage.js';

/**
 * Background job to periodically fetch thermostat data from Beestat API
 * and store it in the database
 *
 * Strategy: Use Beestat's official sync methods to force fresh data from Ecobee
 * - Call thermostat.sync and sensor.sync (batched) to trigger immediate sync
 * - These methods sync data directly from Ecobee (max once per 3 minutes)
 * - Then fetch the freshly synced thermostat data
 */

let thermostatUpdateInterval: NodeJS.Timeout | null = null;
let cleanupInterval: NodeJS.Timeout | null = null;

/**
 * Trigger Beestat sync using official API methods
 * Uses batched API calls to sync thermostats and sensors simultaneously
 * Updates run a maximum of once every 3 minutes per Beestat rate limits
 */
async function syncBeestatData() {
  const apiKey = process.env.BEESTAT_API_KEY;
  if (!apiKey) return;

  try {
    console.log('🔄 Triggering Beestat sync (thermostat + sensor)...');

    // Use Beestat's batch API to sync thermostats and sensors together
    // This is more efficient than separate calls
    const batchRequest = [
      { resource: 'thermostat', method: 'sync', alias: 'thermostat_sync' },
      { resource: 'sensor', method: 'sync', alias: 'sensor_sync' }
    ];

    const url = `https://api.beestat.io/?api_key=${apiKey}&batch=${encodeURIComponent(JSON.stringify(batchRequest))}`;
    const response = await fetch(url);

    if (response.ok) {
      const result = await response.json();
      console.log('✓ Beestat sync triggered successfully');

      // Check if there were any errors in the batch response
      if (result.thermostat_sync?.error_code || result.sensor_sync?.error_code) {
        console.warn('⚠️  Sync completed with warnings:', result);
      }
    } else {
      console.warn(`⚠️  Beestat sync returned status ${response.status}`);
    }
  } catch (error) {
    console.error('✗ Failed to trigger Beestat sync:', error);
  }
}

export async function updateThermostatData() {
  if (!process.env.BEESTAT_API_KEY) {
    console.log('BEESTAT_API_KEY not configured, skipping thermostat update');
    return;
  }

  try {
    console.log('🔄 Background job: Fetching thermostat data from Beestat API');
    const thermostatData = await fetchBeestatThermostats();

    // Save each thermostat to database
    for (const thermostat of thermostatData) {
      try {
        await storage.saveThermostatData({
          thermostatId: thermostat.id.toString(),
          name: thermostat.name,
          temperature: thermostat.temperature,
          targetTemp: thermostat.targetTemp,
          humidity: thermostat.humidity || null,
          mode: thermostat.mode,
          hvacState: thermostat.hvacState || 'unknown'
        });
        console.log(`✓ Background job: Saved ${thermostat.name} (${thermostat.temperature}°F)`);
      } catch (saveError) {
        console.error(`✗ Background job: Failed to save ${thermostat.name}:`, saveError);
      }
    }

    console.log(`✓ Background job: Successfully updated ${thermostatData.length} thermostat(s)`);
  } catch (error) {
    console.error('✗ Background job: Failed to update thermostat data:', error);
  }
}

/**
 * Update cycle with sync trigger:
 * 1. Trigger Beestat sync (thermostat + sensor) using official API
 * 2. Wait briefly for sync to propagate
 * 3. Fetch the freshly synced data
 */
async function updateCycleWithSync() {
  // Step 1: Trigger sync using Beestat's official sync methods
  await syncBeestatData();

  // Step 2: Wait briefly for sync to complete and propagate
  // Beestat's sync is fast, only need a short delay
  console.log('⏳ Waiting 30 seconds for sync to complete...');
  await new Promise(resolve => setTimeout(resolve, 30 * 1000));

  // Step 3: Fetch the freshly synced data
  await updateThermostatData();
}

/**
 * Start the background job to update thermostat data every 3 minutes
 * Uses Beestat's official sync API to ensure fresh data from Ecobee
 * Rate limited to once per 3 minutes by Beestat (we match this limit)
 */
export function startThermostatUpdateJob() {
  // Run immediately on startup
  updateCycleWithSync();

  // Then run every 3 minutes (matching Beestat's rate limit)
  const interval = 3 * 60 * 1000; // 3 minutes
  thermostatUpdateInterval = setInterval(updateCycleWithSync, interval);

  console.log(`✓ Thermostat background job started (runs every ${interval / (60 * 1000)} minutes)`);
  console.log(`  Strategy: Trigger sync (official API) → Wait 30s → Fetch fresh data`);
}

/**
 * Stop the background job (useful for graceful shutdown)
 */
export function stopThermostatUpdateJob() {
  if (thermostatUpdateInterval) {
    clearInterval(thermostatUpdateInterval);
    thermostatUpdateInterval = null;
    console.log('✓ Thermostat background job stopped');
  }
}

/**
 * Database cleanup job to remove old data according to retention policies
 * Configurable via environment variables:
 * - RETENTION_WEATHER_OBSERVATIONS_DAYS (default: 7)
 * - RETENTION_WEATHER_DATA_DAYS (default: 2)
 * - RETENTION_THERMOSTAT_DATA_DAYS (default: 90)
 * - RETENTION_BEESTAT_RAW_DAYS (default: 7)
 */
async function cleanupOldData() {
  try {
    console.log('🧹 Background job: Starting database cleanup...');
    const deletedCounts = await storage.cleanupOldData();

    const totalDeleted = deletedCounts.weatherObservations + deletedCounts.weatherData +
                        deletedCounts.thermostatData + deletedCounts.beestatRawData;

    if (totalDeleted > 0) {
      console.log(`✓ Background job: Cleanup complete - removed ${totalDeleted} total records`);
    } else {
      console.log('✓ Background job: Cleanup complete - no old records to remove');
    }
  } catch (error) {
    console.error('✗ Background job: Database cleanup failed:', error);
  }
}

/**
 * Start the database cleanup background job
 * Runs daily at 3 AM local time, or immediately if CLEANUP_INTERVAL_HOURS is set
 */
export function startCleanupJob() {
  // Check if custom cleanup interval is configured (in hours)
  const customIntervalHours = process.env.CLEANUP_INTERVAL_HOURS;

  if (customIntervalHours) {
    // Use custom interval if specified
    const interval = parseInt(customIntervalHours) * 60 * 60 * 1000;

    // Run immediately on startup
    cleanupOldData();

    // Then run at specified interval
    cleanupInterval = setInterval(cleanupOldData, interval);
    console.log(`✓ Database cleanup job started (runs every ${customIntervalHours} hours)`);
  } else {
    // Default: Run daily at 3 AM local time
    const scheduleNextCleanup = () => {
      const now = new Date();
      const next3AM = new Date();
      next3AM.setHours(3, 0, 0, 0);

      // If it's past 3 AM today, schedule for 3 AM tomorrow
      if (now >= next3AM) {
        next3AM.setDate(next3AM.getDate() + 1);
      }

      const msUntil3AM = next3AM.getTime() - now.getTime();

      console.log(`✓ Database cleanup job scheduled for ${next3AM.toLocaleString()}`);

      // Schedule the cleanup
      cleanupInterval = setTimeout(() => {
        cleanupOldData();
        // Reschedule for next day
        scheduleNextCleanup();
      }, msUntil3AM);
    };

    scheduleNextCleanup();
  }
}

/**
 * Stop the cleanup background job (useful for graceful shutdown)
 */
export function stopCleanupJob() {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    clearTimeout(cleanupInterval);
    cleanupInterval = null;
    console.log('✓ Database cleanup job stopped');
  }
}
