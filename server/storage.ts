import { weatherData, thermostatData, type WeatherData, type ThermostatData, type InsertWeatherData, type InsertThermostatData, type WeatherFlowStation, type WeatherFlowObservation, type WeatherFlowForecast } from "@shared/schema";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { desc, eq, and, gte } from "drizzle-orm";

export interface IStorage {
  getLatestWeatherData(stationId: string): Promise<WeatherData | undefined>;
  saveWeatherData(data: InsertWeatherData): Promise<WeatherData>;
  getWeatherHistory(stationId: string, hours: number): Promise<WeatherData[]>;
  getWeatherHistorySince(stationId: string, since: Date): Promise<WeatherData[]>;
  getLatestThermostatData(): Promise<ThermostatData[]>;
  saveThermostatData(data: InsertThermostatData): Promise<ThermostatData>;
}

export class MemStorage implements IStorage {
  private weatherData: Map<string, WeatherData>;
  private weatherHistory: Map<string, WeatherData[]>;
  private thermostatData: ThermostatData[];
  currentId: number;
  currentThermostatId: number;

  constructor() {
    this.weatherData = new Map();
    this.weatherHistory = new Map();
    this.thermostatData = [];
    this.currentId = 1;
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
      visibility: insertData.visibility ?? null,
      dewPoint: insertData.dewPoint ?? null,
      rainToday: insertData.rainToday ?? null,
      rainYesterday: insertData.rainYesterday ?? null,
      stationName: insertData.stationName ?? null,
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
    };

    // Remove existing data for this thermostat
    this.thermostatData = this.thermostatData.filter(t => t.thermostatId !== insertData.thermostatId);
    
    // Add new data
    this.thermostatData.push(thermostatRecord);
    
    return thermostatRecord;
  }
}

// PostgreSQL Storage Implementation
export class PostgreSQLStorage implements IStorage {
  private db: ReturnType<typeof drizzle>;
  private sql: ReturnType<typeof neon>;

  constructor() {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error("DATABASE_URL environment variable is required for PostgreSQL storage");
    }
    
    try {
      this.sql = neon(databaseUrl);
      this.db = drizzle(this.sql);
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
      const result = await this.db
        .select()
        .from(thermostatData)
        .orderBy(desc(thermostatData.lastUpdated));
      
      return result;
    } catch (error) {
      console.error("Error getting latest thermostat data:", error);
      throw new Error("Failed to retrieve thermostat data from database");
    }
  }

  async saveThermostatData(insertData: InsertThermostatData): Promise<ThermostatData> {
    try {
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
