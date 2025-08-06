import type { ThermostatData } from '../shared/schema.ts';

const BEESTAT_API_BASE = 'https://beestat.io/api/';

interface BeestatThermostat {
  ecobee_thermostat_id: number;
  identifier: string;
  name: string;
  temperature: number;
  temperature_setpoint_heat: number;
  temperature_setpoint_cool: number;
  humidity: number;
  hvac_mode: string;
  hvac_state: string;
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
    
    // Filter for specific thermostats: Downstairs (for Home) and 809 Sailors Cove (for Lake)
    const targetThermostats = ['Downstairs', '809 Sailors Cove'];
    
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

      console.log(`Processing thermostat: ${thermostatName}`);
      
      // Determine target temperature based on HVAC mode
      let targetTemp = 72; // default
      if (thermostat.hvac_mode === 'heat') {
        targetTemp = Math.round(thermostat.temperature_setpoint_heat / 10); // Beestat uses decidegrees
      } else if (thermostat.hvac_mode === 'cool') {
        targetTemp = Math.round(thermostat.temperature_setpoint_cool / 10);
      } else if (thermostat.hvac_mode === 'auto') {
        // For auto mode, use the appropriate setpoint based on current state
        if (thermostat.hvac_state?.includes('heat')) {
          targetTemp = Math.round(thermostat.temperature_setpoint_heat / 10);
        } else if (thermostat.hvac_state?.includes('cool')) {
          targetTemp = Math.round(thermostat.temperature_setpoint_cool / 10);
        } else {
          // Use average of both setpoints when idle in auto mode
          targetTemp = Math.round((thermostat.temperature_setpoint_heat + thermostat.temperature_setpoint_cool) / 20);
        }
      }

      // Determine location based on thermostat name
      let location = 'Home';
      if (thermostatName.toLowerCase().includes('809 sailors cove')) {
        location = 'Lake';
      } else if (thermostatName.toLowerCase().includes('downstairs')) {
        location = 'Home';
      }

      thermostats.push({
        id: parseInt(id),
        thermostatId: `beestat-${thermostat.ecobee_thermostat_id}`,
        name: location, // Use simplified location name
        temperature: Math.round(thermostat.temperature / 10), // Convert decidegrees to Fahrenheit
        targetTemp: targetTemp,
        humidity: thermostat.humidity || null,
        mode: mapBeestatMode(thermostat.hvac_mode),
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