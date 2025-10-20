import type { ThermostatData } from '../shared/schema.ts';

/**
 * Beestat API Integration
 *
 * Single API Call Required:
 * GET https://api.beestat.io/?api_key={KEY}&resource=thermostat&method=read_id
 *
 * This endpoint returns ALL thermostat data including:
 * - Current temperature (°F)
 * - Current humidity (%)
 * - Heat & cool setpoints (°F)
 * - Running equipment (array)
 * - Weather data
 * - Property information
 * - Historical analytics
 *
 * Important Notes:
 * - HVAC mode is NOT directly provided by Beestat API
 * - Must infer mode from running_equipment and setpoint configuration
 * - All temperatures are already in Fahrenheit (no conversion needed)
 * - Data updates every 5 minutes from Ecobee
 */

const BEESTAT_API_BASE = 'https://api.beestat.io/';

interface BeestatThermostat {
  // Core thermostat identification
  ecobee_thermostat_id: number;
  identifier: string;
  name: string;

  // Temperature data - directly from Beestat API (already in Fahrenheit)
  temperature: number;          // Current temperature in °F
  setpoint_heat?: number;       // Heat setpoint in °F
  setpoint_cool?: number;       // Cool setpoint in °F
  humidity?: number;            // Current humidity in %

  // Note: hvac_mode is NOT provided by Beestat API - must be inferred
  hvac_mode?: string;           // Usually null/undefined

  // System settings (usually empty)
  settings?: {
    hvacMode?: string;          // Usually null/undefined
    differential_cool?: number;
    differential_heat?: number;
  };

  // Current equipment status - THIS is what we use to determine mode
  running_equipment: string[];  // Array of currently running equipment (e.g., ['compCool1'], ['fan'], [])

  // Program/schedule info (optional - used as fallback for setpoints)
  program?: {
    currentClimateRef?: string;
    climates?: Array<{
      name?: string;
      climateRef?: string;
      heatTemp?: number;     // Heat setpoint in tenths of degrees
      coolTemp?: number;     // Cool setpoint in tenths of degrees
    }>;
  };
}

interface BeestatResponse {
  data?: {
    [key: string]: BeestatThermostat;
  };
  success?: boolean;
  message?: string;
}

export async function fetchBeestatThermostats(): Promise<ThermostatData[]> {
  const apiKey = process.env.BEESTAT_API_KEY;

  if (!apiKey) {
    throw new Error('BEESTAT_API_KEY environment variable not set');
  }

  // Single API call to get all thermostat data
  // This endpoint returns: current temp, humidity, setpoints, running equipment, and more
  const endpoint = `${BEESTAT_API_BASE}?api_key=${apiKey}&resource=thermostat&method=read_id`;

  try {
    // SECURITY: Fully redact API key from logs
    console.log(`Fetching Beestat data from: ${endpoint.replace(/api_key=[^&]+/, 'api_key=***REDACTED***')}`);

    const response = await fetch(endpoint);
    console.log(`Beestat API Response: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Beestat API error: ${errorText.substring(0, 200)}`);
      throw new Error(`Beestat API error ${response.status}: ${errorText.substring(0, 100)}`);
    }

    const data: BeestatResponse = await response.json();

    if (!data || (!data.success && !data.data)) {
      console.error(`Unexpected Beestat response format:`, data);
      throw new Error(`Beestat API returned unexpected format`);
    }

    console.log(`✓ Successfully retrieved data for ${Object.keys(data.data || {}).length} thermostat(s)`);

    // Process and return thermostat data
    return await processBeestatResponse(data);

  } catch (error) {
    console.error(`Beestat API request failed:`, error);
    throw error instanceof Error ? error : new Error(String(error));
  }
}

async function processBeestatResponse(data: BeestatResponse): Promise<ThermostatData[]> {
    const thermostats: ThermostatData[] = [];

    // Get target thermostat names from environment variable
    const targetNamesEnv = process.env.TARGET_THERMOSTAT_NAMES || 'Downstairs,809 Sailors Cove';
    const targetThermostats = targetNamesEnv.split(',').map(name => name.trim());

    for (const [id, thermostat] of Object.entries(data.data || {})) {
      // Check if this thermostat matches our target list
      const thermostatName = thermostat.name || thermostat.identifier || '';
      const isTargetThermostat = targetThermostats.some(target =>
        thermostatName.toLowerCase().includes(target.toLowerCase())
      );

      if (!isTargetThermostat) {
        console.log(`⊗ Skipping thermostat: ${thermostatName} (not in target list)`);
        continue;
      }

      console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`Processing: ${thermostatName}`);
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

      // Extract data from Beestat API response
      // All temperature values are already in Fahrenheit
      const currentTemp = thermostat.temperature;
      let heatSetpoint = thermostat.setpoint_heat || null;
      let coolSetpoint = thermostat.setpoint_cool || null;

      console.log(`📊 Current Temperature: ${currentTemp}°F`);
      console.log(`📊 Heat Setpoint: ${heatSetpoint}°F`);
      console.log(`📊 Cool Setpoint: ${coolSetpoint}°F`);
      console.log(`📊 Humidity: ${thermostat.humidity}%`);


      // If setpoints are null, try to get from current climate/program (fallback)
      if ((!heatSetpoint || !coolSetpoint) && thermostat.program?.currentClimateRef) {
        const currentClimate = thermostat.program.climates?.find(c => c.climateRef === thermostat.program?.currentClimateRef);
        if (currentClimate) {
          if (!heatSetpoint && currentClimate.heatTemp) {
            heatSetpoint = currentClimate.heatTemp / 10; // Program temps are in tenths
          }
          if (!coolSetpoint && currentClimate.coolTemp) {
            coolSetpoint = currentClimate.coolTemp / 10; // Program temps are in tenths
          }
          console.log(`📋 Using climate '${currentClimate.name}' setpoints: heat=${heatSetpoint}°F, cool=${coolSetpoint}°F`);
        }
      }

      // Check running equipment to determine HVAC state
      const runningEquipment = thermostat.running_equipment || [];
      let hvacState: string;

      if (runningEquipment.length > 0) {
        hvacState = runningEquipment.join(',');
        console.log(`🔧 Running Equipment: ${hvacState}`);
      } else {
        hvacState = 'idle';
        console.log(`💤 HVAC State: idle`);
      }

      // Note: hvac_mode is NOT provided by Beestat API
      // We infer the effective mode from running equipment and setpoints
      const hvacMode = thermostat.settings?.hvacMode || thermostat.hvac_mode;
      console.log(`⚙️  HVAC Mode (from API): ${hvacMode || 'not provided - will infer from equipment'}`);


      // Infer effective HVAC mode and determine target temperature
      let targetTemp = 72; // default fallback
      let effectiveMode = hvacMode || 'auto'; // Default to auto if mode not specified

      // Priority 1: Check running equipment (most accurate - shows what's actually happening)
      const hasCompCool = runningEquipment.some(eq => eq.toLowerCase().includes('compcool'));
      const hasCompHeat = runningEquipment.some(eq => eq.toLowerCase().includes('compheat'));
      const hasAuxHeat = runningEquipment.some(eq => eq.toLowerCase().includes('auxheat'));

      if (hasCompCool || hvacState?.includes('cool')) {
        effectiveMode = 'cool';
        targetTemp = coolSetpoint || targetTemp;
        console.log(`🌡️  Mode Detection: COOLING (equipment: ${runningEquipment.join(', ')})`);
      } else if (hasCompHeat || hasAuxHeat || hvacState?.includes('heat')) {
        effectiveMode = 'heat';
        targetTemp = heatSetpoint || targetTemp;
        console.log(`🌡️  Mode Detection: HEATING (equipment: ${runningEquipment.join(', ')})`);
      }
      // Priority 2: Use explicit mode from API if available
      else if (hvacMode === 'heat' && heatSetpoint) {
        targetTemp = heatSetpoint;
        console.log(`🌡️  Mode Detection: HEAT mode (from API)`);
      } else if (hvacMode === 'cool' && coolSetpoint) {
        targetTemp = coolSetpoint;
        console.log(`🌡️  Mode Detection: COOL mode (from API)`);
      } else if (hvacMode === 'auto' && heatSetpoint && coolSetpoint) {
        // Auto mode: choose closest setpoint to current temp
        targetTemp = Math.abs((currentTemp ?? 72) - coolSetpoint) <= Math.abs((currentTemp ?? 72) - heatSetpoint)
          ? coolSetpoint : heatSetpoint;
        console.log(`🌡️  Mode Detection: AUTO mode (target: ${targetTemp}°F)`);
      }
      // Priority 3: Infer from setpoints when mode not provided
      else if (!hvacMode && heatSetpoint && coolSetpoint) {
        if (heatSetpoint === coolSetpoint) {
          targetTemp = coolSetpoint;
          effectiveMode = 'auto';
          console.log(`🌡️  Mode Inference: AUTO (same setpoints: ${targetTemp}°F)`);
        } else if ((currentTemp ?? 72) < heatSetpoint - 1) {
          targetTemp = heatSetpoint;
          effectiveMode = 'heat';
          console.log(`🌡️  Mode Inference: HEAT (temp below setpoint)`);
        } else if ((currentTemp ?? 72) > coolSetpoint + 1) {
          targetTemp = coolSetpoint;
          effectiveMode = 'cool';
          console.log(`🌡️  Mode Inference: COOL (temp above setpoint)`);
        } else {
          targetTemp = coolSetpoint;
          effectiveMode = 'auto';
          console.log(`🌡️  Mode Inference: AUTO (temp in range, using cool setpoint)`);
        }
      } else if (!hvacMode && coolSetpoint) {
        targetTemp = coolSetpoint;
        effectiveMode = 'cool';
        console.log(`🌡️  Mode Inference: COOL (only cool setpoint available)`);
      } else if (!hvacMode && heatSetpoint) {
        targetTemp = heatSetpoint;
        effectiveMode = 'heat';
        console.log(`🌡️  Mode Inference: HEAT (only heat setpoint available)`);
      }

      // Determine display location based on thermostat name
      let location = 'Home';
      if (thermostatName.toLowerCase().includes('809 sailors cove')) {
        location = 'Lake';
      } else if (thermostatName.toLowerCase().includes('downstairs')) {
        location = 'Home';
      }

      // Summary
      console.log(`\n✓ THERMOSTAT: ${location}`);
      console.log(`  Current: ${currentTemp}°F, Target: ${targetTemp}°F`);
      console.log(`  Mode: ${effectiveMode.toUpperCase()}${hvacMode && hvacMode !== effectiveMode ? ` (inferred from ${hvacMode})` : ''}`);
      console.log(`  Setpoints: Heat ${heatSetpoint}°F, Cool ${coolSetpoint}°F`);
      console.log(`  HVAC: ${hvacState}, Equipment: ${JSON.stringify(runningEquipment)}`);
      console.log(`  Humidity: ${thermostat.humidity}%`);
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

      thermostats.push({
        id: parseInt(id),
        thermostatId: `beestat-${thermostat.ecobee_thermostat_id}`,
        name: location, // Use simplified location name
        temperature: currentTemp ?? 72,
        targetTemp: targetTemp,
        humidity: thermostat.humidity || null,
        mode: mapBeestatMode(effectiveMode || 'off'),
        hvacState: hvacState || null, // Actual HVAC equipment state
        timestamp: new Date(),
        lastUpdated: new Date()
      });
    }

    console.log(`\n✓ Successfully processed ${thermostats.length} thermostat(s) from ${Object.keys(data.data || {}).length} total\n`);

    return thermostats;
}

function mapBeestatMode(beestatMode: string): 'heat' | 'cool' | 'auto' | 'off' {
  switch (beestatMode?.toLowerCase()) {
    case 'heat':
      return 'heat';
    case 'cool':
      return 'cool';
    case 'auto':
      return 'auto';
    case 'off':
      return 'off';
    default:
      return 'off';
  }
}