import type { ThermostatData } from '../shared/schema.ts';

const BEESTAT_API_BASE = 'https://beestat.io/api/';

interface BeestatThermostat {
  // Core thermostat identification
  ecobee_thermostat_id: number;
  identifier: string;
  name: string;

  // Temperature data (from actual API response structure)
  temperature: number;          // This might be actual temp or setpoint depending on API
  actual_temperature?: number;  // Actual current temperature if available
  indoor_temperature?: number;  // Alternative field for current temperature
  setpoint_heat?: number;       // Heat setpoint in tenths of degrees
  setpoint_cool?: number;       // Cool setpoint in tenths of degrees
  humidity?: number;
  hvac_mode?: string;
  
  // System settings
  settings?: {
    hvacMode?: string;
    differential_cool?: number;
    differential_heat?: number;
  };
  
  // Current equipment status
  running_equipment: string[];  // Array of currently running equipment
  
  // Ecobee program/schedule info (from the actual response structure we see)
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

  // Try multiple endpoint formats that might work
  const endpointVariations = [
    `${BEESTAT_API_BASE}?api_key=${apiKey}&resource=thermostat&method=read_id`,
    `${BEESTAT_API_BASE}?api_key=${apiKey}&resource=ecobee_runtime_thermostat&method=read_id`,
    `${BEESTAT_API_BASE}?api_key=${apiKey}&resource=runtime_thermostat&method=read_id`,
    `https://api.beestat.io/?api_key=${apiKey}&resource=thermostat&method=read_id`
  ];

  let lastError: Error | null = null;

  for (const endpoint of endpointVariations) {
    try {
      console.log(`Trying Beestat endpoint: ${endpoint.replace(apiKey, apiKey.substring(0, 8) + '...')}`);
      
      const response = await fetch(endpoint);
      console.log(`Response: ${response.status} ${response.statusText}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.log(`Error response: ${errorText.substring(0, 200)}...`);
        lastError = new Error(`${response.status}: ${errorText.substring(0, 100)}`);
        continue;
      }

      const data: BeestatResponse = await response.json();
      console.log(`Success! Response data keys:`, Object.keys(data || {}));
      
      if (!data || (!data.success && !data.data)) {
        console.log(`API returned unexpected format:`, data);
        lastError = new Error(`API returned unexpected format: ${JSON.stringify(data)}`);
        continue;
      }

      // If we got here, we have valid data
      return await processBeestatResponse(data);
      
    } catch (error) {
      console.log(`Endpoint failed:`, error);
      lastError = error instanceof Error ? error : new Error(String(error));
      continue;
    }
  }
  
  // If all endpoints failed, throw the last error
  throw lastError || new Error('All Beestat API endpoints failed');
}

async function processBeestatResponse(data: BeestatResponse): Promise<ThermostatData[]> {

    // Convert Beestat data to our thermostat format
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
        console.log(`Skipping thermostat: ${thermostatName} (not in target list: ${targetThermostats.join(', ')})`);
        continue;
      }

      console.log(`\n========================================`);
      console.log(`Processing thermostat: ${thermostatName}`);
      console.log(`========================================`);
      console.log(`Full thermostat data:`, JSON.stringify(thermostat, null, 2));
      console.log(`Available properties:`, Object.keys(thermostat));
      console.log(`Settings properties:`, thermostat.settings ? Object.keys(thermostat.settings) : 'no settings');
      console.log(`========================================\n`);
      
      // Handle different API response formats
      let currentTemp: number | null = null;
      let heatSetpoint: number | null = null;
      let coolSetpoint: number | null = null;
      let hvacMode: string | undefined = undefined;
      let hvacState: string | undefined = undefined;
      
      // Parse thermostat data from Beestat API response
      if (thermostat.temperature || thermostat.actual_temperature || thermostat.indoor_temperature) {
        // Determine actual current temperature from available fields
        currentTemp = thermostat.actual_temperature || thermostat.indoor_temperature || thermostat.temperature;

        console.log(`Raw temperature fields: temperature=${thermostat.temperature}°F, actual=${thermostat.actual_temperature}°F, indoor=${thermostat.indoor_temperature}°F`);
        console.log(`Using current temperature: ${currentTemp}°F`);

        // Setpoints from Beestat API are already in Fahrenheit (Beestat divides by 10)
        heatSetpoint = thermostat.setpoint_heat || null;
        coolSetpoint = thermostat.setpoint_cool || null;

        console.log(`Setpoints from Beestat API: heat=${heatSetpoint}°F, cool=${coolSetpoint}°F`);
        
        // If setpoints are null, try to get from current climate/program
        if ((!heatSetpoint || !coolSetpoint) && thermostat.program?.currentClimateRef) {
          const currentClimate = thermostat.program.climates?.find(c => c.climateRef === thermostat.program?.currentClimateRef);
          if (currentClimate) {
            if (!heatSetpoint && currentClimate.heatTemp) {
              heatSetpoint = currentClimate.heatTemp / 10; // Program temps are in tenths
            }
            if (!coolSetpoint && currentClimate.coolTemp) {
              coolSetpoint = currentClimate.coolTemp / 10; // Program temps are in tenths  
            }
            console.log(`Using current climate '${currentClimate.name}' setpoints: heat=${heatSetpoint}°F, cool=${coolSetpoint}°F`);
          }
        }
        
        // HVAC mode from settings or main property
        hvacMode = thermostat.settings?.hvacMode || thermostat.hvac_mode;
        
        // Check running equipment for current state
        if (thermostat.running_equipment && thermostat.running_equipment.length > 0) {
          hvacState = thermostat.running_equipment.join(',');
          console.log(`Active equipment detected: ${hvacState}`);
        } else {
          hvacState = 'idle';
          console.log(`No active equipment detected - HVAC is idle`);
        }
      }

      
      console.log(`Temperature data: current=${currentTemp}°F, heat_setpoint=${heatSetpoint}°F, cool_setpoint=${coolSetpoint}°F`);
      console.log(`HVAC mode: ${hvacMode}, HVAC state: ${hvacState}`);
      
      // Determine target temperature and effective HVAC mode
      let targetTemp = 72; // default fallback
      let effectiveMode = hvacMode || 'auto'; // Default to auto if mode not specified
      
      if (hvacMode === 'heat' && heatSetpoint) {
        targetTemp = heatSetpoint;
      } else if (hvacMode === 'cool' && coolSetpoint) {
        targetTemp = coolSetpoint;
      } else if (hvacMode === 'auto' && heatSetpoint && coolSetpoint) {
        // For auto mode, use the appropriate setpoint based on current state
        if (hvacState?.includes('heat')) {
          targetTemp = heatSetpoint;
        } else if (hvacState?.includes('cool')) {
          targetTemp = coolSetpoint;
        } else {
          // Use cool setpoint if temperature is closer to it, otherwise heat
          targetTemp = Math.abs((currentTemp ?? 72) - coolSetpoint) <= Math.abs((currentTemp ?? 72) - heatSetpoint) ? coolSetpoint : heatSetpoint;
        }
      } else if (!hvacMode && heatSetpoint && coolSetpoint) {
        // No explicit mode but both setpoints available - infer from current temperature and setpoints
        if (heatSetpoint === coolSetpoint) {
          // Same setpoint for both, use it directly
          targetTemp = coolSetpoint;
          effectiveMode = 'auto';
        } else if ((currentTemp ?? 72) < heatSetpoint - 1) {
          // Significantly below heat setpoint - need heating
          targetTemp = heatSetpoint;
          effectiveMode = 'heat';
        } else if ((currentTemp ?? 72) > coolSetpoint + 1) {
          // Significantly above cool setpoint - need cooling
          targetTemp = coolSetpoint;
          effectiveMode = 'cool';
        } else {
          // Temperature is between heat and cool setpoints (auto mode range)
          // Check if cooling or heating equipment is running
          if (hvacState?.includes('cool') || hvacState?.includes('compressor')) {
            targetTemp = coolSetpoint;
            effectiveMode = 'cool';
          } else if (hvacState?.includes('heat') || hvacState?.includes('auxHeat')) {
            targetTemp = heatSetpoint;
            effectiveMode = 'heat';
          } else {
            // No active equipment running - system is in auto mode maintaining between setpoints
            // Default to cool setpoint as the "target" since that's what most thermostats display
            // in auto mode (ecobee shows the boundary the system is maintaining)
            targetTemp = coolSetpoint;
            effectiveMode = 'auto';
          }
        }
      } else if (!hvacMode && coolSetpoint) {
        // Only cool setpoint available
        targetTemp = coolSetpoint;
        effectiveMode = 'cool';
      } else if (!hvacMode && heatSetpoint) {
        // Only heat setpoint available  
        targetTemp = heatSetpoint;
        effectiveMode = 'heat';
      }

      // Determine location based on thermostat name
      let location = 'Home';
      if (thermostatName.toLowerCase().includes('809 sailors cove')) {
        location = 'Lake';
      } else if (thermostatName.toLowerCase().includes('downstairs')) {
        location = 'Home';
      }

      console.log(`\n----- FINAL DECISION (${location}) -----`);
      console.log(`Current Temperature: ${currentTemp}°F`);
      console.log(`Target Temperature: ${targetTemp}°F`);
      console.log(`Effective Mode: ${effectiveMode} (original hvacMode: ${hvacMode})`);
      console.log(`Heat Setpoint: ${heatSetpoint}°F`);
      console.log(`Cool Setpoint: ${coolSetpoint}°F`);
      console.log(`HVAC State: ${hvacState}`);
      console.log(`Running Equipment: ${JSON.stringify(thermostat.running_equipment)}`);
      console.log(`Beestat Sync Time: ${new Date().toISOString()}`);
      console.log(`--------------------------\n`);

      thermostats.push({
        id: parseInt(id),
        thermostatId: `beestat-${thermostat.ecobee_thermostat_id}`,
        name: location, // Use simplified location name
        temperature: currentTemp ?? 72, // Convert from tenths of degrees
        targetTemp: targetTemp,
        humidity: thermostat.humidity || null,
        mode: mapBeestatMode(effectiveMode || 'off'),
        hvacState: hvacState || null, // Add actual HVAC equipment state
        timestamp: new Date(),
        lastUpdated: new Date()
      });
    }

    console.log(`Found ${thermostats.length} target thermostats from ${Object.keys(data.data || {}).length} total thermostats`);

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