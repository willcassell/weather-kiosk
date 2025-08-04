import { weatherData, type WeatherData, type InsertWeatherData, type WeatherFlowStation, type WeatherFlowObservation, type WeatherFlowForecast } from "@shared/schema";

export interface IStorage {
  getLatestWeatherData(stationId: string): Promise<WeatherData | undefined>;
  saveWeatherData(data: InsertWeatherData): Promise<WeatherData>;
  getWeatherHistory(stationId: string, hours: number): Promise<WeatherData[]>;
}

export class MemStorage implements IStorage {
  private weatherData: Map<string, WeatherData>;
  private weatherHistory: Map<string, WeatherData[]>;
  currentId: number;

  constructor() {
    this.weatherData = new Map();
    this.weatherHistory = new Map();
    this.currentId = 1;
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
}

export const storage = new MemStorage();
