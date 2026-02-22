import { fetchBeestatThermostats } from './beestat-api.js';
import { storage } from './storage.js';
import { metrics } from './metrics.js';
import { broadcastWeatherUpdate, broadcastThermostatUpdate } from './ws.js';
import { fetchWeatherFlowData } from './controllers/weather.js';
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
    const startTime = Date.now();

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
      metrics.recordJobExecution({ jobName: 'beestat_sync', success: true, durationMs: Date.now() - startTime });
    } else {
      console.warn(`⚠️  Beestat sync returned status ${response.status}`);
      metrics.recordJobExecution({ jobName: 'beestat_sync', success: false, durationMs: Date.now() - startTime });
    }
  } catch (error) {
    console.error('✗ Failed to trigger Beestat sync:', error);
    metrics.recordJobExecution({ jobName: 'beestat_sync', success: false, durationMs: 0 });
  }
}

export async function updateThermostatData() {
  if (!process.env.BEESTAT_API_KEY) {
    console.log('BEESTAT_API_KEY not configured, skipping thermostat update');
    return;
  }

  try {
    console.log('🔄 Background job: Fetching thermostat data from Beestat API');
    const startTime = Date.now();
    const thermostatData = await fetchBeestatThermostats();
    metrics.recordApiCall({ service: 'beestat_fetch', success: true, durationMs: Date.now() - startTime });

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

    // Broadcast the updated thermostat data to connected WebSocket clients
    broadcastThermostatUpdate({ thermostats: thermostatData });

    console.log(`✓ Background job: Successfully updated ${thermostatData.length} thermostat(s)`);
  } catch (error) {
    console.error('✗ Background job: Failed to update thermostat data:', error);
    metrics.recordApiCall({ service: 'beestat_fetch', success: false, durationMs: 0, error: error instanceof Error ? error.message : String(error) });
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
 * Start the background job to update thermostat data using dynamic DB configuration
 */
export async function startThermostatUpdateJob() {
  // Clear any existing interval in case of a restart
  stopThermostatUpdateJob();

  // Run immediately on startup
  updateCycleWithSync();

  // Fetch configured interval from DB (fallback to 3 minutes)
  let refreshMinutes = 3;
  try {
    const settings = await storage.getAllSettings();
    refreshMinutes = parseInt(settings.thermostatRefreshInterval || "3");
  } catch (err) {
    console.log("Using fallback thermostat refresh interval (3 min) due to missing DB settings.");
  }
  const intervalMs = refreshMinutes * 60 * 1000;

  thermostatUpdateInterval = setInterval(updateCycleWithSync, intervalMs);

  console.log(`✓ Thermostat background job started (runs every ${refreshMinutes} minutes)`);
}

/**
 * Stop the background job (useful for graceful shutdown or restarts)
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
  const startTime = Date.now();
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
    metrics.recordJobExecution({ jobName: 'database_cleanup', success: true, durationMs: Date.now() - startTime });
  } catch (error) {
    console.error('✗ Background job: Database cleanup failed:', error);
    metrics.recordJobExecution({ jobName: 'database_cleanup', success: false, durationMs: Date.now() - startTime });
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

let weatherUpdateInterval: NodeJS.Timeout | null = null;

export async function updateWeatherData() {
  try {
    const freshData = await fetchWeatherFlowData();
    console.log(`[BACKGROUND] updateWeatherData fetched Tempest: ${freshData.temperature}°F. Saving to DB...`);
    const savedData = await storage.saveWeatherData(freshData);

    // Broadcast the fresh data to WebSocket clients
    broadcastWeatherUpdate(savedData);
  } catch (error) {
    console.error('✗ Background job: Failed to fetch weather data:', error);
  }
}

/**
 * Start the background job to update weather data using dynamic DB configuration
 */
export async function startWeatherUpdateJob() {
  stopWeatherUpdateJob();

  // Run immediately on startup
  updateWeatherData();

  // Fetch configured interval from DB (fallback to 3 minutes)
  let refreshMinutes = 3;
  try {
    const settings = await storage.getAllSettings();
    refreshMinutes = parseInt(settings.weatherRefreshInterval || "3");
  } catch (err) {
    console.log("Using fallback weather refresh interval (3 min) due to missing DB settings.");
  }
  const intervalMs = refreshMinutes * 60 * 1000;

  weatherUpdateInterval = setInterval(updateWeatherData, intervalMs);

  console.log(`✓ Weather background job started (runs every ${refreshMinutes} minutes)`);
}

/**
 * Stop the weather update job
 */
export function stopWeatherUpdateJob() {
  if (weatherUpdateInterval) {
    clearInterval(weatherUpdateInterval);
    weatherUpdateInterval = null;
    console.log('✓ Weather background job stopped');
  }
}

/**
 * Dynamically restarts all background polling jobs using the latest configuration.
 * Called when settings are updated via the UI.
 */
export async function restartAllJobs() {
  console.log('🔄 Restarting background polling jobs with fresh configuration...');
  await startWeatherUpdateJob();

  if (process.env.BEESTAT_API_KEY) {
    await startThermostatUpdateJob();
  }
}
