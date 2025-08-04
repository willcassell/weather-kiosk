import { z } from "zod";

const ECOBEE_API_BASE = "https://api.ecobee.com/1";

// Ecobee API response schemas
const EcobeeTokenResponse = z.object({
  access_token: z.string(),
  token_type: z.string(),
  expires_in: z.number(),
  refresh_token: z.string(),
  scope: z.string(),
});

const EcobeeThermostat = z.object({
  identifier: z.string(),
  name: z.string(),
  thermostatRev: z.string(),
  isRegistered: z.boolean(),
  modelNumber: z.string(),
  brand: z.string(),
  features: z.string(),
  lastModified: z.string(),
  thermostatTime: z.string(),
  utcTime: z.string(),
  runtime: z.object({
    runtimeRev: z.string(),
    connected: z.boolean(),
    firstConnected: z.string(),
    connectDateTime: z.string(),
    disconnectDateTime: z.string(),
    lastModified: z.string(),
    lastStatusModified: z.string(),
    runtimeDate: z.string(),
    runtimeInterval: z.number(),
    actualTemperature: z.number(),
    actualHumidity: z.number(),
    desiredHeat: z.number(),
    desiredCool: z.number(),
    desiredHumidity: z.number(),
    desiredDehumidity: z.number(),
    hvacMode: z.string(),
    heatPump: z.boolean(),
  }),
  settings: z.object({
    hvacMode: z.string(),
    lastServiceDate: z.string(),
    serviceRemindMe: z.boolean(),
    monthsBetweenService: z.number(),
    reminderDate: z.string(),
    vent: z.string(),
    ventilatorMinOnTime: z.number(),
    serviceRemindTechnician: z.boolean(),
    eiLocation: z.string(),
    coldTempAlert: z.number(),
    coldTempAlertEnabled: z.boolean(),
    hotTempAlert: z.number(),
    hotTempAlertEnabled: z.boolean(),
    coolStages: z.number(),
    heatStages: z.number(),
    maxSetBack: z.number(),
    maxSetForward: z.number(),
    quickSaveSetBack: z.number(),
    quickSaveSetForward: z.number(),
    hasHeatPump: z.boolean(),
    hasForcedAir: z.boolean(),
    hasBoiler: z.boolean(),
    hasHumidifier: z.boolean(),
    hasErv: z.boolean(),
    hasHrv: z.boolean(),
    condensationAvoid: z.boolean(),
    useCelsius: z.boolean(),
    useTimeFormat12: z.boolean(),
    locale: z.string(),
    humidity: z.string(),
    humidifierMode: z.string(),
    backlightOnIntensity: z.number(),
    backlightSleepIntensity: z.number(),
    backlightOffTime: z.number(),
    soundTickVolume: z.number(),
    soundAlertVolume: z.number(),
    compressorProtectionMinTime: z.number(),
    compressorProtectionMinTemp: z.number(),
    stage1HeatingDifferentialTemp: z.number(),
    stage1CoolingDifferentialTemp: z.number(),
    stage1HeatingDissipationTime: z.number(),
    stage1CoolingDissipationTime: z.number(),
    heatPumpReversalOnCool: z.boolean(),
    fanControlRequired: z.boolean(),
    fanMinOnTime: z.number(),
    heatCoolMinDelta: z.number(),
    tempCorrection: z.number(),
    holdAction: z.string(),
    heatPumpGroundWater: z.boolean(),
    hasElectric: z.boolean(),
    hasDehumidifier: z.boolean(),
    dehumidifierMode: z.string(),
    dehumidifierLevel: z.number(),
    dehumidifyWithAC: z.boolean(),
    dehumidifyOvercoolOffset: z.number(),
    autoHeatCoolFeatureEnabled: z.boolean(),
    wifiOfflineAlert: z.boolean(),
    heatMinTemp: z.number(),
    coolMaxTemp: z.number(),
    heatRangeHigh: z.number(),
    heatRangeLow: z.number(),
    coolRangeHigh: z.number(),
    coolRangeLow: z.number(),
    userAccessCode: z.string(),
    userAccessSetting: z.number(),
    auxRuntimeAlert: z.number(),
    auxOutdoorTempAlert: z.number(),
    auxMaxOutdoorTemp: z.number(),
    auxRuntimeAlertNotify: z.boolean(),
    auxOutdoorTempAlertNotify: z.boolean(),
    auxRuntimeAlertNotifyTechnician: z.boolean(),
    auxOutdoorTempAlertNotifyTechnician: z.boolean(),
    disablePreHeating: z.boolean(),
    disablePreCooling: z.boolean(),
    installerCodeRequired: z.boolean(),
    drAccept: z.string(),
    isRentalProperty: z.boolean(),
    useZoneController: z.boolean(),
    randomStartDelayCool: z.number(),
    randomStartDelayHeat: z.number(),
    humidityHighAlert: z.number(),
    humidityLowAlert: z.number(),
    disableHeatPumpAlerts: z.boolean(),
    disableAlertsOnIdt: z.boolean(),
    humidityAlertNotify: z.boolean(),
    humidityAlertNotifyTechnician: z.boolean(),
    tempAlertNotify: z.boolean(),
    tempAlertNotifyTechnician: z.boolean(),
    monthlyElectricityBillLimit: z.number(),
    enableElectricityBillAlert: z.boolean(),
    enableProjectedElectricityBillAlert: z.boolean(),
    electricityBillingDayOfMonth: z.number(),
    electricityBillCycleMonths: z.number(),
    electricityBillStartMonth: z.number(),
    ventilatorMinOnTimeHome: z.number(),
    ventilatorMinOnTimeAway: z.number(),
    backlightOffDuringSleep: z.boolean(),
    autoAway: z.boolean(),
    smartHome: z.boolean(),
    followMeComfort: z.boolean(),
    ventilatorType: z.string(),
    isVentilatorTimerOn: z.boolean(),
    ventilatorOffDateTime: z.string(),
    hasUVFilter: z.boolean(),
    coolingLockout: z.boolean(),
    ventilatorFreeCooling: z.boolean(),
    dehumidifyWhenHeating: z.boolean(),
    ventilatorDehumidify: z.boolean(),
    groupRef: z.string(),
    groupName: z.string(),
    groupSetting: z.number(),
  }),
});

const EcobeeThermostatsResponse = z.object({
  page: z.object({
    page: z.number(),
    totalPages: z.number(),
    pageSize: z.number(),
    total: z.number(),
  }),
  thermostatList: z.array(EcobeeThermostat),
});

type EcobeeTokens = z.infer<typeof EcobeeTokenResponse>;
type EcobeeThermostatData = z.infer<typeof EcobeeThermostat>;

// In-memory token storage (in production, use a database)
let cachedTokens: EcobeeTokens | null = null;
let tokenExpiry: number = 0;

export class EcobeeAPI {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async refreshAccessToken(): Promise<EcobeeTokens> {
    if (!cachedTokens?.refresh_token) {
      throw new Error("No refresh token available. Re-authentication required.");
    }

    const response = await fetch(`${ECOBEE_API_BASE}/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        grant_type: "refresh_token",
        code: cachedTokens.refresh_token,
        client_id: this.apiKey,
      }),
    });

    if (!response.ok) {
      throw new Error(`Token refresh failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const tokens = EcobeeTokenResponse.parse(data);
    
    cachedTokens = tokens;
    tokenExpiry = Date.now() + tokens.expires_in * 1000;
    
    return tokens;
  }

  private async getValidAccessToken(): Promise<string> {
    // Check if we have cached tokens and they haven't expired
    if (cachedTokens && Date.now() < tokenExpiry - 60000) { // 1 minute buffer
      return cachedTokens.access_token;
    }

    // Try to refresh the token
    if (cachedTokens?.refresh_token) {
      try {
        const tokens = await this.refreshAccessToken();
        return tokens.access_token;
      } catch (error) {
        console.error("Token refresh failed:", error);
        throw new Error("Authentication expired. Please re-authenticate with Ecobee.");
      }
    }

    throw new Error("No valid authentication. Please authenticate with Ecobee first.");
  }

  async getThermostats(): Promise<EcobeeThermostatData[]> {
    try {
      const accessToken = await this.getValidAccessToken();

      const response = await fetch(
        `${ECOBEE_API_BASE}/thermostat?json={"selection":{"selectionType":"registered","selectionMatch":"","includeRuntime":true,"includeSettings":true}}`,
        {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Ecobee API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const parsed = EcobeeThermostatsResponse.parse(data);
      
      return parsed.thermostatList;
    } catch (error) {
      console.error("Error fetching thermostats:", error);
      throw error;
    }
  }

  // Initialize PIN-based authentication (first-time setup)
  async initiateAuth(): Promise<{ authorizationCode: string; pin: string; interval: number; expiresIn: number }> {
    const response = await fetch(`${ECOBEE_API_BASE}/authorize?response_type=ecobeePin&client_id=${this.apiKey}&scope=smartRead`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Auth initiation failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return {
      authorizationCode: data.code,
      pin: data.ecobeePin,
      interval: data.interval,
      expiresIn: data.expires_in,
    };
  }

  // Complete authentication after user enters PIN
  async completeAuth(authorizationCode: string): Promise<EcobeeTokens> {
    const response = await fetch(`${ECOBEE_API_BASE}/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        grant_type: "ecobeePin",
        code: authorizationCode,
        client_id: this.apiKey,
      }),
    });

    if (!response.ok) {
      throw new Error(`Token exchange failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const tokens = EcobeeTokenResponse.parse(data);
    
    cachedTokens = tokens;
    tokenExpiry = Date.now() + tokens.expires_in * 1000;
    
    return tokens;
  }

  // Store tokens manually (for existing auth)
  setTokens(tokens: EcobeeTokens): void {
    cachedTokens = tokens;
    tokenExpiry = Date.now() + tokens.expires_in * 1000;
  }

  // Get current token status
  getTokenStatus(): { hasTokens: boolean; isExpired: boolean; expiresIn?: number } {
    if (!cachedTokens) {
      return { hasTokens: false, isExpired: false };
    }
    
    const isExpired = Date.now() >= tokenExpiry;
    const expiresIn = Math.max(0, Math.floor((tokenExpiry - Date.now()) / 1000));
    
    return {
      hasTokens: true,
      isExpired,
      expiresIn,
    };
  }
}

// Helper function to convert Ecobee data to our schema format
export function convertEcobeeToThermostatData(ecobeeData: EcobeeThermostatData, index: number) {
  const runtime = ecobeeData.runtime;
  const settings = ecobeeData.settings;
  
  // Convert temperature from Ecobee format (usually in tenths of degrees)
  const actualTemp = runtime.actualTemperature / 10;
  const targetTemp = settings.hvacMode === 'heat' 
    ? runtime.desiredHeat / 10
    : settings.hvacMode === 'cool'
    ? runtime.desiredCool / 10
    : (runtime.desiredHeat + runtime.desiredCool) / 20; // Average for auto mode

  return {
    id: index + 1,
    thermostatId: ecobeeData.identifier,
    name: ecobeeData.name,
    temperature: actualTemp,
    targetTemp: targetTemp,
    humidity: runtime.actualHumidity,
    mode: settings.hvacMode.toLowerCase() as 'heat' | 'cool' | 'auto' | 'off',
    timestamp: new Date(),
    lastUpdated: new Date(),
  };
}