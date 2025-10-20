import { weatherData, weatherObservations, thermostatData, type WeatherData, type WeatherObservation, type ThermostatData, type InsertWeatherData, type InsertWeatherObservation, type InsertThermostatData, type WeatherFlowStation, type WeatherFlowObservation, type WeatherFlowForecast } from "@shared/schema";
import pkg from "pg";
const { Pool } = pkg;
import { drizzle } from "drizzle-orm/node-postgres";
import { desc, eq, and, gte, sql } from "drizzle-orm";

export interface IStorage {
  getLatestWeatherData(stationId: string): Promise<WeatherData | undefined>;
  saveWeatherData(data: InsertWeatherData): Promise<WeatherData>;
  getWeatherHistory(stationId: string, hours: number): Promise<WeatherData[]>;
  getWeatherHistorySince(stationId: string, since: Date): Promise<WeatherData[]>;
  
  // Weather observations methods
  saveWeatherObservation(data: InsertWeatherObservation): Promise<WeatherObservation>;
  getWeatherObservations(stationId: string, hours: number): Promise<WeatherObservation[]>;
  getWeatherObservationsSince(stationId: string, since: Date): Promise<WeatherObservation[]>;
  getDailyTemperatureExtremes(stationId: string, date: Date): Promise<{ high: number; low: number; highTime: Date; lowTime: Date } | null>;
  getRecentLightningData(stationId: string, since: Date): Promise<{ timestamp: Date; distance: number } | null>;
  
  getLatestThermostatData(): Promise<ThermostatData[]>;
  saveThermostatData(data: InsertThermostatData): Promise<ThermostatData>;
}

export class MemStorage implements IStorage {
  private weatherData: Map<string, WeatherData>;
  private weatherHistory: Map<string, WeatherData[]>;
  private weatherObservations: Map<string, WeatherObservation[]>;
  private thermostatData: ThermostatData[];
  currentId: number;
  currentObservationId: number;
  currentThermostatId: number;

  constructor() {
    this.weatherData = new Map();
    this.weatherHistory = new Map();
    this.weatherObservations = new Map();
    this.thermostatData = [];
    this.currentId = 1;
    this.currentObservationId = 1;
    this.currentThermostatId = 1;
  }

  async getLatestWeatherData(stationId: string): Promise<WeatherData | undefined> {
    return this.weatherData.get(stationId);
  }

  async saveWeatherData(insertData: InsertWeatherData): Promise<WeatherData> {
    const id = this.currentId++;
    const weatherDataRecord: WeatherData = { 
      ...insertData, 
      id,
      timestamp: new Date(),
      lastUpdated: new Date(),
      // Ensure all optional fields have proper null values instead of undefined
      temperature: insertData.temperature ?? null,
      feelsLike: insertData.feelsLike ?? null,
      temperatureHigh: insertData.temperatureHigh ?? null,
      temperatureLow: insertData.temperatureLow ?? null,
      temperatureHighTime: insertData.temperatureHighTime ?? null,
      temperatureLowTime: insertData.temperatureLowTime ?? null,
      windSpeed: insertData.windSpeed ?? null,
      windGust: insertData.windGust ?? null,
      windDirection: insertData.windDirection ?? null,
      windDirectionCardinal: insertData.windDirectionCardinal ?? null,
      pressure: insertData.pressure ?? null,
      pressureTrend: insertData.pressureTrend ?? null,
      humidity: insertData.humidity ?? null,
      uvIndex: insertData.uvIndex ?? null,
      dewPoint: insertData.dewPoint ?? null,
      rainToday: insertData.rainToday ?? null,
      rainYesterday: insertData.rainYesterday ?? null,
      stationName: insertData.stationName ?? null,
      lightningStrikeDistance: insertData.lightningStrikeDistance ?? null,
      lightningStrikeTime: insertData.lightningStrikeTime ?? null,
    };
    
    this.weatherData.set(insertData.stationId, weatherDataRecord);
    
    // Add to history
    const history = this.weatherHistory.get(insertData.stationId) || [];
    history.push(weatherDataRecord);
    // Keep only last 48 hours of data
    const cutoffTime = Date.now() - (48 * 60 * 60 * 1000);
    const filteredHistory = history.filter(record => record.timestamp && record.timestamp.getTime() > cutoffTime);
    this.weatherHistory.set(insertData.stationId, filteredHistory);
    
    return weatherDataRecord;
  }

  async getWeatherHistory(stationId: string, hours: number): Promise<WeatherData[]> {
    const history = this.weatherHistory.get(stationId) || [];
    const cutoffTime = Date.now() - (hours * 60 * 60 * 1000);
    return history.filter(record => record.timestamp && record.timestamp.getTime() > cutoffTime);
  }

  async getWeatherHistorySince(stationId: string, since: Date): Promise<WeatherData[]> {
    const history = this.weatherHistory.get(stationId) || [];
    return history.filter(record => record.timestamp && record.timestamp.getTime() >= since.getTime());
  }

  async getLatestThermostatData(): Promise<ThermostatData[]> {
    return [...this.thermostatData];
  }

  async saveThermostatData(insertData: InsertThermostatData): Promise<ThermostatData> {
    const id = this.currentThermostatId++;
    const thermostatRecord: ThermostatData = {
      ...insertData,
      id,
      timestamp: new Date(),
      lastUpdated: new Date(),
      humidity: insertData.humidity ?? null, // Fix undefined to null conversion
      hvacState: insertData.hvacState ?? null, // Fix undefined to null conversion
    };

    // Remove existing data for this thermostat
    this.thermostatData = this.thermostatData.filter(t => t.thermostatId !== insertData.thermostatId);
    
    // Add new data
    this.thermostatData.push(thermostatRecord);
    
    return thermostatRecord;
  }

  // Weather observations methods for MemStorage
  async saveWeatherObservation(data: InsertWeatherObservation): Promise<WeatherObservation> {
    const id = this.currentObservationId++;
    const observation: WeatherObservation = {
      ...data,
      id,
      createdAt: new Date(),
      // Ensure all optional fields have proper null values instead of undefined
      feelsLike: data.feelsLike ?? null,
      windSpeed: data.windSpeed ?? null,
      windGust: data.windGust ?? null,
      windDirection: data.windDirection ?? null,
      pressure: data.pressure ?? null,
      humidity: data.humidity ?? null,
      uvIndex: data.uvIndex ?? null,
      dewPoint: data.dewPoint ?? null,
      rainAccumulation: data.rainAccumulation ?? null,
      lightningStrikeCount: data.lightningStrikeCount ?? null,
      lightningStrikeDistance: data.lightningStrikeDistance ?? null,
    };
    
    const observations = this.weatherObservations.get(data.stationId) || [];
    observations.push(observation);
    
    // Keep only last 7 days of observations
    const cutoffTime = Date.now() - (7 * 24 * 60 * 60 * 1000);
    const filteredObservations = observations.filter(obs => obs.timestamp.getTime() > cutoffTime);
    this.weatherObservations.set(data.stationId, filteredObservations);
    
    return observation;
  }

  async getWeatherObservations(stationId: string, hours: number): Promise<WeatherObservation[]> {
    const observations = this.weatherObservations.get(stationId) || [];
    const cutoffTime = Date.now() - (hours * 60 * 60 * 1000);
    return observations.filter(obs => obs.timestamp.getTime() > cutoffTime);
  }

  async getWeatherObservationsSince(stationId: string, since: Date): Promise<WeatherObservation[]> {
    const observations = this.weatherObservations.get(stationId) || [];
    return observations.filter(obs => obs.timestamp.getTime() >= since.getTime());
  }

  async getDailyTemperatureExtremes(stationId: string, date: Date): Promise<{ high: number; low: number; highTime: Date; lowTime: Date } | null> {
    // Get timezone from environment variable, default to America/New_York
    const timezone = process.env.TIMEZONE || 'America/New_York';

    // Get the calendar day in the configured timezone
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      hour12: false
    });

    const parts = formatter.formatToParts(date);
    const year = parseInt(parts.find(p => p.type === 'year')!.value);
    const month = parseInt(parts.find(p => p.type === 'month')!.value) - 1; // JS months are 0-indexed
    const day = parseInt(parts.find(p => p.type === 'day')!.value);

    // Create midnight in the target timezone
    // We create a date string in the target timezone, then parse it
    const midnightLocal = new Date(`${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}T00:00:00`);

    // Get the UTC offset for this specific date/time in this timezone
    const localTimeStr = midnightLocal.toLocaleString('en-US', { timeZone: timezone });
    const utcTimeStr = midnightLocal.toLocaleString('en-US', { timeZone: 'UTC' });
    const offset = (new Date(localTimeStr).getTime() - new Date(utcTimeStr).getTime()) / (60 * 60 * 1000);

    const startOfDay = new Date(Date.UTC(year, month, day, -offset, 0, 0, 0));
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

    const observations = this.weatherObservations.get(stationId) || [];
    const dayObservations = observations.filter(obs =>
      obs.timestamp.getTime() >= startOfDay.getTime() && obs.timestamp.getTime() < endOfDay.getTime()
    );
    
    if (dayObservations.length === 0) return null;
    
    const highRecord = dayObservations.reduce((max, obs) => obs.temperature > max.temperature ? obs : max);
    const lowRecord = dayObservations.reduce((min, obs) => obs.temperature < min.temperature ? obs : min);
    
    return {
      high: highRecord.temperature,
      low: lowRecord.temperature,
      highTime: highRecord.timestamp,
      lowTime: lowRecord.timestamp
    };
  }

  async getRecentLightningData(stationId: string, since: Date): Promise<{ timestamp: Date; distance: number } | null> {
    const observations = this.weatherObservations.get(stationId) || [];
    const recentObservations = observations.filter(obs => 
      obs.timestamp.getTime() >= since.getTime() && 
      obs.lightningStrikeCount && obs.lightningStrikeCount > 0 &&
      obs.lightningStrikeDistance !== null
    );
    
    if (recentObservations.length === 0) return null;
    
    // Return the most recent lightning strike
    const mostRecent = recentObservations.reduce((latest, obs) => 
      obs.timestamp.getTime() > latest.timestamp.getTime() ? obs : latest
    );
    
    return {
      timestamp: mostRecent.timestamp,
      distance: mostRecent.lightningStrikeDistance!
    };
  }

}

// PostgreSQL Storage Implementation
export class PostgreSQLStorage implements IStorage {
  private db: ReturnType<typeof drizzle>;
  private pool: InstanceType<typeof Pool>;

  constructor() {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error("DATABASE_URL environment variable is required for PostgreSQL storage");
    }

    try {
      this.pool = new Pool({ connectionString: databaseUrl });
      this.db = drizzle({ client: this.pool });
      console.log("PostgreSQL storage initialized successfully");
    } catch (error) {
      console.error("Failed to initialize PostgreSQL storage:", error);
      throw new Error("Failed to connect to PostgreSQL database");
    }
  }

  async getLatestWeatherData(stationId: string): Promise<WeatherData | undefined> {
    try {
      const result = await this.db
        .select()
        .from(weatherData)
        .where(eq(weatherData.stationId, stationId))
        .orderBy(desc(weatherData.lastUpdated))
        .limit(1);
      
      return result[0] || undefined;
    } catch (error) {
      console.error("Error getting latest weather data:", error);
      throw new Error("Failed to retrieve weather data from database");
    }
  }

  async saveWeatherData(insertData: InsertWeatherData): Promise<WeatherData> {
    try {
      const result = await this.db
        .insert(weatherData)
        .values(insertData)
        .returning();
      
      if (!result[0]) {
        throw new Error("Failed to save weather data to database");
      }
      
      return result[0];
    } catch (error) {
      console.error("Error saving weather data:", error);
      throw new Error("Failed to save weather data to database");
    }
  }

  async getWeatherHistory(stationId: string, hours: number): Promise<WeatherData[]> {
    try {
      const cutoffTime = new Date(Date.now() - (hours * 60 * 60 * 1000));
      
      const result = await this.db
        .select()
        .from(weatherData)
        .where(
          and(
            eq(weatherData.stationId, stationId),
            gte(weatherData.timestamp, cutoffTime)
          )
        )
        .orderBy(desc(weatherData.timestamp));
      
      return result;
    } catch (error) {
      console.error("Error getting weather history:", error);
      throw new Error("Failed to retrieve weather history from database");
    }
  }

  async getWeatherHistorySince(stationId: string, since: Date): Promise<WeatherData[]> {
    try {
      const result = await this.db
        .select()
        .from(weatherData)
        .where(
          and(
            eq(weatherData.stationId, stationId),
            gte(weatherData.timestamp, since)
          )
        )
        .orderBy(desc(weatherData.timestamp));
      
      return result;
    } catch (error) {
      console.error("Error getting weather history since date:", error);
      throw new Error("Failed to retrieve weather history from database");
    }
  }

  async getLatestThermostatData(): Promise<ThermostatData[]> {
    try {
      // Get only the most recent record for each thermostat_id using a window function
      const result = await this.db
        .select()
        .from(thermostatData)
        .where(
          sql`id IN (
            SELECT DISTINCT ON (thermostat_id) id 
            FROM thermostat_data 
            ORDER BY thermostat_id, last_updated DESC
          )`
        )
        .orderBy(desc(thermostatData.lastUpdated));
      
      return result;
    } catch (error) {
      console.error("Error getting latest thermostat data:", error);
      throw new Error("Failed to retrieve thermostat data from database");
    }
  }

  async saveThermostatData(insertData: InsertThermostatData): Promise<ThermostatData> {
    try {
      // First, delete existing records for this thermostat to prevent duplicates
      await this.db
        .delete(thermostatData)
        .where(eq(thermostatData.thermostatId, insertData.thermostatId));
      
      // Then insert the new record
      const result = await this.db
        .insert(thermostatData)
        .values(insertData)
        .returning();
      
      if (!result[0]) {
        throw new Error("Failed to save thermostat data to database");
      }
      
      return result[0];
    } catch (error) {
      console.error("Error saving thermostat data:", error);
      throw new Error("Failed to save thermostat data to database");
    }
  }

  // Weather observations methods for PostgreSQL
  async saveWeatherObservation(data: InsertWeatherObservation): Promise<WeatherObservation> {
    try {
      const result = await this.db
        .insert(weatherObservations)
        .values(data)
        .returning();
      
      if (!result[0]) {
        throw new Error("Failed to save weather observation to database");
      }
      
      return result[0];
    } catch (error) {
      console.error("Error saving weather observation:", error);
      throw new Error("Failed to save weather observation to database");
    }
  }

  async getWeatherObservations(stationId: string, hours: number): Promise<WeatherObservation[]> {
    try {
      const cutoffTime = new Date(Date.now() - (hours * 60 * 60 * 1000));
      
      const result = await this.db
        .select()
        .from(weatherObservations)
        .where(
          and(
            eq(weatherObservations.stationId, stationId),
            gte(weatherObservations.timestamp, cutoffTime)
          )
        )
        .orderBy(desc(weatherObservations.timestamp));
      
      return result;
    } catch (error) {
      console.error("Error getting weather observations:", error);
      throw new Error("Failed to retrieve weather observations from database");
    }
  }

  async getWeatherObservationsSince(stationId: string, since: Date): Promise<WeatherObservation[]> {
    try {
      const result = await this.db
        .select()
        .from(weatherObservations)
        .where(
          and(
            eq(weatherObservations.stationId, stationId),
            gte(weatherObservations.timestamp, since)
          )
        )
        .orderBy(desc(weatherObservations.timestamp));
      
      return result;
    } catch (error) {
      console.error("Error getting weather observations since date:", error);
      throw new Error("Failed to retrieve weather observations from database");
    }
  }

  async getDailyTemperatureExtremes(stationId: string, date: Date): Promise<{ high: number; low: number; highTime: Date; lowTime: Date } | null> {
    try {
      // Get timezone from environment variable, default to America/New_York
      const timezone = process.env.TIMEZONE || 'America/New_York';

      // Get the calendar day in the configured timezone
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        hour12: false
      });

      const parts = formatter.formatToParts(date);
      const year = parseInt(parts.find(p => p.type === 'year')!.value);
      const month = parseInt(parts.find(p => p.type === 'month')!.value) - 1; // JS months are 0-indexed
      const day = parseInt(parts.find(p => p.type === 'day')!.value);

      // Create midnight in the target timezone
      const midnightLocal = new Date(`${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}T00:00:00`);

      // Get the UTC offset for this specific date/time in this timezone
      const localTimeStr = midnightLocal.toLocaleString('en-US', { timeZone: timezone });
      const utcTimeStr = midnightLocal.toLocaleString('en-US', { timeZone: 'UTC' });
      const offset = (new Date(localTimeStr).getTime() - new Date(utcTimeStr).getTime()) / (60 * 60 * 1000);

      const startOfDayUTC = new Date(Date.UTC(year, month, day, -offset, 0, 0, 0));
      const endOfDayUTC = new Date(startOfDayUTC.getTime() + 24 * 60 * 60 * 1000);

      const result = await this.db
        .select({
          maxTemp: sql<number>`MAX(temperature)`.as('maxTemp'),
          minTemp: sql<number>`MIN(temperature)`.as('minTemp'),
        })
        .from(weatherObservations)
        .where(
          and(
            eq(weatherObservations.stationId, stationId),
            gte(weatherObservations.timestamp, startOfDayUTC),
            sql`${weatherObservations.timestamp} < ${endOfDayUTC}`
          )
        );
      
      if (!result[0] || result[0].maxTemp === null || result[0].minTemp === null) {
        return null;
      }
      
      // Get the actual records for the high and low temperatures to get timestamps
      const [highRecord, lowRecord] = await Promise.all([
        this.db
          .select()
          .from(weatherObservations)
          .where(
            and(
              eq(weatherObservations.stationId, stationId),
              eq(weatherObservations.temperature, result[0].maxTemp),
              gte(weatherObservations.timestamp, startOfDayUTC),
              sql`${weatherObservations.timestamp} < ${endOfDayUTC}`
            )
          )
          .limit(1),
        this.db
          .select()
          .from(weatherObservations)
          .where(
            and(
              eq(weatherObservations.stationId, stationId),
              eq(weatherObservations.temperature, result[0].minTemp),
              gte(weatherObservations.timestamp, startOfDayUTC),
              sql`${weatherObservations.timestamp} < ${endOfDayUTC}`
            )
          )
          .limit(1)
      ]);
      
      return {
        high: result[0].maxTemp,
        low: result[0].minTemp,
        highTime: highRecord[0]?.timestamp || startOfDayUTC,
        lowTime: lowRecord[0]?.timestamp || startOfDayUTC
      };
    } catch (error) {
      console.error("Error getting daily temperature extremes:", error);
      throw new Error("Failed to retrieve daily temperature extremes from database");
    }
  }

  async getRecentLightningData(stationId: string, since: Date): Promise<{ timestamp: Date; distance: number } | null> {
    try {
      const result = await this.db
        .select()
        .from(weatherObservations)
        .where(
          and(
            eq(weatherObservations.stationId, stationId),
            gte(weatherObservations.timestamp, since),
            sql`${weatherObservations.lightningStrikeCount} > 0`,
            sql`${weatherObservations.lightningStrikeDistance} IS NOT NULL`
          )
        )
        .orderBy(desc(weatherObservations.timestamp))
        .limit(1);
      
      if (!result[0] || !result[0].lightningStrikeDistance) {
        return null;
      }
      
      return {
        timestamp: result[0].timestamp,
        distance: result[0].lightningStrikeDistance
      };
    } catch (error) {
      console.error("Error getting recent lightning data:", error);
      throw new Error("Failed to retrieve recent lightning data from database");
    }
  }
}

// Storage factory function that chooses between PostgreSQL and Memory storage
function createStorage(): IStorage {
  if (process.env.DATABASE_URL) {
    try {
      return new PostgreSQLStorage();
    } catch (error) {
      console.warn("Failed to initialize PostgreSQL storage, falling back to memory storage:", error);
      return new MemStorage();
    }
  } else {
    console.warn("DATABASE_URL not provided, using memory storage");
    return new MemStorage();
  }
}

export const storage = createStorage();
