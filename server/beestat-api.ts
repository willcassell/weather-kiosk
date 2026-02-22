import type { ThermostatData, InsertBeestatRawData } from '../shared/schema.ts';
import { storage } from './storage.ts';
import { BeestatResponseSchema, BeestatSensorResponseSchema, type BeestatResponse, type BeestatThermostat, type BeestatSensorResponse, type BeestatSensor } from './api-validation.ts';
import { ZodError } from 'zod';

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

export async function fetchBeestatThermostats(): Promise<ThermostatData[]> {
  const apiKey = process.env.BEESTAT_API_KEY;

  if (!apiKey) {
    throw new Error('BEESTAT_API_KEY environment variable not set');
  }

  // Single API call to get all thermostat data
  // This endpoint returns: current temp, humidity, setpoints, running equipment, and more
  const thermostatEndpoint = `${BEESTAT_API_BASE}?api_key=${apiKey}&resource=thermostat&method=read_id`;
  const sensorEndpoint = `${BEESTAT_API_BASE}?api_key=${apiKey}&resource=sensor&method=read_id`;

  try {
    // SECURITY: Fully redact API key from logs
    console.log(`Fetching Beestat Thermostats from: ${thermostatEndpoint.replace(/api_key=[^&]+/, 'api_key=***REDACTED***')}`);
    console.log(`Fetching Beestat Sensors from: ${sensorEndpoint.replace(/api_key=[^&]+/, 'api_key=***REDACTED***')}`);

    const [thermostatRes, sensorRes] = await Promise.all([
      fetch(thermostatEndpoint),
      fetch(sensorEndpoint)
    ]);

    console.log(`Beestat Thermostat API: ${thermostatRes.status} ${thermostatRes.statusText}`);
    console.log(`Beestat Sensor API: ${sensorRes.status} ${sensorRes.statusText}`);

    if (!thermostatRes.ok || !sensorRes.ok) {
      const errorText = await thermostatRes.text() || await sensorRes.text();
      console.error(`Beestat API error: ${errorText.substring(0, 200)}`);
      throw new Error(`Beestat API error: ${errorText.substring(0, 100)}`);
    }

    const rawThermostatData = await thermostatRes.json();
    const rawSensorData = await sensorRes.json();

    // Validate API response with Zod schema
    let data: BeestatResponse;
    let sensorData: BeestatSensorResponse;
    try {
      data = BeestatResponseSchema.parse(rawThermostatData);
      sensorData = BeestatSensorResponseSchema.parse(rawSensorData);
    } catch (error) {
      if (error instanceof ZodError) {
        console.error(`Beestat API response validation failed:`, error.errors);
        console.error(`Raw response (first 500 chars):`, JSON.stringify(rawThermostatData).substring(0, 500));
        throw new Error(`Beestat API returned invalid data format: ${error.errors.map(e => e.message).join(', ')}`);
      }
      throw error;
    }

    if (!data || (!data.success && !data.data) || !sensorData || !sensorData.success) {
      console.error(`Unexpected Beestat response format:`, { thermostat: !!data, sensor: !!sensorData });
      throw new Error(`Beestat API returned unexpected format`);
    }

    console.log(`✓ Successfully retrieved and validated data for ${Object.keys(data.data || {}).length} thermostat(s) and ${Object.keys(sensorData.data || {}).length} sensor(s)`);

    // Process and return thermostat data
    return await processBeestatResponse(data, sensorData);

  } catch (error) {
    console.error(`Beestat API request failed:`, error);
    throw error instanceof Error ? error : new Error(String(error));
  }
}

async function processBeestatResponse(data: BeestatResponse, sensors: BeestatSensorResponse): Promise<ThermostatData[]> {
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

    // Note: The thermostat API 'isOccupied' reflects the scheduled preference, not the actual room state.
    // To get the actual room state, we must scan the detached hardware sensors.
    let isOccupied = false; // Default to away
    const thermostatSensors = (Object.values(sensors.data) as BeestatSensor[]).filter(
      sensor => sensor.thermostat_id === thermostat.ecobee_thermostat_id || sensor.thermostat_id === thermostat.thermostat_id
    );

    const occupiedSensors = thermostatSensors.filter(sensor => sensor.occupancy === true);

    if (occupiedSensors.length > 0) {
      isOccupied = true;
      console.log(`👤 Occupancy: Active ✓ (${occupiedSensors.map(s => s.name).join(', ')})`);
    } else {
      console.log(`👤 Occupancy: Away ✗ (No motion detected across ${thermostatSensors.length} sensors)`);
    }

    if (thermostat.program?.currentClimateRef) {
      const activeClimate = thermostat.program.climates?.find(c => c.climateRef === thermostat.program?.currentClimateRef);
      if (activeClimate) {
        console.log(`🏠 Current Climate Schedule: '${activeClimate.name}' (${activeClimate.climateRef})`);

        // Get setpoints if needed (fallback if not provided at top level)
        if (!heatSetpoint && activeClimate.heatTemp) {
          heatSetpoint = activeClimate.heatTemp; // Program temps are in tenths
        }
        if (!coolSetpoint && activeClimate.coolTemp) {
          coolSetpoint = activeClimate.coolTemp; // Program temps are in tenths
        }
      }
    } else {
      console.log(`⚠️  No program/climate data available`);
    }

    // Check running equipment to determine HVAC state
    let runningEquipment = thermostat.running_equipment || [];
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


    let targetTemp = 72;
    let effectiveMode = 'auto'; // Default to auto



    // 2. Infer Mode based on the active bounds
    const hasValidOffsets = heatSetpoint && coolSetpoint && heatSetpoint !== coolSetpoint;

    if (hasValidOffsets) {
      effectiveMode = 'auto';
      // In Auto mode, the thermostat chases whichever boundary the current room temp is violating or closest to
      const distFromHeat = Math.abs((currentTemp ?? 72) - heatSetpoint!);
      const distFromCool = Math.abs((currentTemp ?? 72) - coolSetpoint!);

      if ((currentTemp ?? 72) < heatSetpoint!) {
        targetTemp = heatSetpoint!;  // Actively Heating
      } else if ((currentTemp ?? 72) > coolSetpoint!) {
        targetTemp = coolSetpoint!;  // Actively Cooling
      } else {
        // Room is comfortable, display the boundary we are drifting towards
        targetTemp = distFromCool <= distFromHeat ? coolSetpoint! : heatSetpoint!;
      }
      console.log(`🌡️  Mode Inference: AUTO (Bounds: ${heatSetpoint}°F - ${coolSetpoint}°F, Target: ${targetTemp}°F)`);
    } else if (heatSetpoint && !coolSetpoint) {
      effectiveMode = 'heat';
      targetTemp = heatSetpoint;
      console.log(`🌡️  Mode Inference: HEAT (Setpoint: ${targetTemp}°F)`);
    } else if (coolSetpoint && !heatSetpoint) {
      effectiveMode = 'cool';
      targetTemp = coolSetpoint;
      console.log(`🌡️  Mode Inference: COOL (Setpoint: ${targetTemp}°F)`);
    } else {
      effectiveMode = 'off';
      targetTemp = currentTemp ?? 72;
      console.log(`🌡️  Mode Inference: OFF (No valid setpoints found)`);
    }

    // 3. Absolute Override: If the physical equipment is currently running, it instantly dictates the active target
    runningEquipment = thermostat.running_equipment || [];
    hvacState = runningEquipment.length > 0 ? runningEquipment.join(',') : 'idle';

    const hasCompCool = runningEquipment.some(eq => eq.toLowerCase().includes('compcool'));
    const hasCompHeat = runningEquipment.some(eq => eq.toLowerCase().includes('compheat'));
    const hasAuxHeat = runningEquipment.some(eq => eq.toLowerCase().includes('auxheat'));

    if (hasCompCool) {
      targetTemp = coolSetpoint || targetTemp;
      console.log(`⚡  Equipment Override: COOLING to ${targetTemp}°F`);
    } else if (hasCompHeat || hasAuxHeat) {
      targetTemp = heatSetpoint || targetTemp;
      console.log(`⚡  Equipment Override: HEATING to ${targetTemp}°F`);
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

    // Save raw Beestat API response for debugging and analysis
    try {
      const rawDataToSave: InsertBeestatRawData = {
        thermostatId: `beestat-${thermostat.ecobee_thermostat_id}`,
        thermostatName: location,
        temperature: currentTemp ?? 72,
        setpointHeat: heatSetpoint ?? null,
        setpointCool: coolSetpoint ?? null,
        humidity: thermostat.humidity ?? null,
        hvacMode: hvacMode ?? null,
        runningEquipment: JSON.stringify(runningEquipment),
        effectiveMode: effectiveMode,
        targetTemp: targetTemp,
        rawResponse: JSON.stringify(thermostat), // Full raw response for debugging
      };
      await storage.saveBeestatRawData(rawDataToSave);
      console.log(`✓ Saved raw Beestat data to database for debugging`);
    } catch (error) {
      console.error(`⚠️  Failed to save raw Beestat data:`, error);
      // Don't fail the whole process if saving raw data fails
    }

    thermostats.push({
      id: parseInt(id),
      thermostatId: `beestat-${thermostat.ecobee_thermostat_id}`,
      name: location, // Use simplified location name
      temperature: currentTemp ?? 72,
      targetTemp: targetTemp,
      humidity: thermostat.humidity || null,
      mode: mapBeestatMode(effectiveMode || 'off'),
      hvacState: hvacState || null, // Actual HVAC equipment state
      occupied: isOccupied, // Occupancy status from Ecobee comfort setting
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