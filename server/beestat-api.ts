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
    
    for (const [id, thermostat] of Object.entries(data.data)) {
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

      // Determine if HVAC is actively running
      const isActive = thermostat.hvac_state && 
                      (thermostat.hvac_state.includes('heat') || 
                       thermostat.hvac_state.includes('cool'));

      thermostats.push({
        id: parseInt(id),
        thermostatId: `beestat-${thermostat.ecobee_thermostat_id}`,
        name: thermostat.name || thermostat.identifier || 'Thermostat',
        temperature: Math.round(thermostat.temperature / 10), // Convert decidegrees to Fahrenheit
        targetTemp: targetTemp,
        humidity: thermostat.humidity || null,
        mode: mapBeestatMode(thermostat.hvac_mode),
        timestamp: new Date(),
        lastUpdated: new Date()
      });
    }

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