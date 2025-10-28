import { fetchBeestatThermostats } from './beestat-api.js';
import { storage } from './storage.js';

/**
 * Background job to periodically fetch thermostat data from Beestat API
 * and store it in the database
 *
 * Strategy: Beestat's API serves cached data unless the user is "recently active"
 * - Trigger activity every 15 minutes to mark user as active
 * - Wait 2 minutes for Beestat's background job to sync fresh data from Ecobee
 * - Then fetch the updated data
 */

let thermostatUpdateInterval: NodeJS.Timeout | null = null;

/**
 * Trigger Beestat activity by making a simple API call
 * This marks the user as "recently active" and triggers Beestat's background sync
 */
async function triggerBeestatActivity() {
  const apiKey = process.env.BEESTAT_API_KEY;
  if (!apiKey) return;

  try {
    console.log('🔔 Triggering Beestat activity to request fresh sync...');
    const response = await fetch(`https://api.beestat.io/?api_key=${apiKey}&resource=thermostat&method=read_id`);

    if (response.ok) {
      console.log('✓ Activity triggered - Beestat will sync in background');
    } else {
      console.warn(`⚠️  Activity trigger returned status ${response.status}`);
    }
  } catch (error) {
    console.error('✗ Failed to trigger Beestat activity:', error);
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
 * Update cycle with activity trigger:
 * 1. Trigger activity to mark user as active
 * 2. Wait 2 minutes for Beestat to sync from Ecobee
 * 3. Fetch the fresh data
 */
async function updateCycleWithTrigger() {
  // Step 1: Trigger activity
  await triggerBeestatActivity();

  // Step 2: Wait 2 minutes for Beestat's background sync to complete
  console.log('⏳ Waiting 2 minutes for Beestat background sync...');
  await new Promise(resolve => setTimeout(resolve, 2 * 60 * 1000));

  // Step 3: Fetch the fresh data
  await updateThermostatData();
}

/**
 * Start the background job to update thermostat data every 15 minutes
 * Uses activity trigger strategy to ensure fresh data from Beestat
 */
export function startThermostatUpdateJob() {
  // Run immediately on startup
  updateCycleWithTrigger();

  // Then run every 15 minutes
  const interval = 15 * 60 * 1000; // 15 minutes
  thermostatUpdateInterval = setInterval(updateCycleWithTrigger, interval);

  console.log(`✓ Thermostat background job started (runs every ${interval / (60 * 1000)} minutes)`);
  console.log(`  Strategy: Trigger activity → Wait 2min → Fetch fresh data`);
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
