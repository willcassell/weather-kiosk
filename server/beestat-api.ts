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

  try {
    // Get thermostat list - using the thermostat resource
    const response = await fetch(
      `${BEESTAT_API_BASE}?api_key=${apiKey}&resource=thermostat&method=read_id&arguments={}`
    );

    if (!response.ok) {
      throw new Error(`Beestat API error: ${response.status} ${response.statusText}`);
    }

    const data: BeestatResponse = await response.json();
    
    if (!data.success || !data.data) {
      throw new Error(`Beestat API returned error: ${data.message || 'Unknown error'}`);
    }

    // Convert Beestat data to our thermostat format
    const thermostats: ThermostatData[] = [];
    
    // Filter for specific thermostats: Downstairs (for Home) and SML809 (for Lake)
    const targetThermostats = ['Downstairs', 'SML809'];
    
    for (const [id, thermostat] of Object.entries(data.data)) {
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
      if (thermostatName.toLowerCase().includes('sml809')) {
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

    console.log(`Found ${thermostats.length} target thermostats from ${Object.keys(data.data).length} total thermostats`);

    return thermostats;
  } catch (error) {
    console.error('Error fetching Beestat data:', error);
    throw error;
  }
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