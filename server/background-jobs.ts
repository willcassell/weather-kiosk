import { fetchBeestatThermostats } from './beestat-api.js';
import { storage } from './storage.js';

/**
 * Background job to periodically fetch thermostat data from Beestat API
 * and store it in the database
 */

let thermostatUpdateInterval: NodeJS.Timeout | null = null;

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
 * Start the background job to update thermostat data every minute
 */
export function startThermostatUpdateJob() {
  // Run immediately on startup
  updateThermostatData();

  // Then run every 1 minute (60 seconds)
  const interval = 60 * 1000; // 1 minute
  thermostatUpdateInterval = setInterval(updateThermostatData, interval);

  console.log(`✓ Thermostat background job started (runs every ${interval / 1000} seconds)`);
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
