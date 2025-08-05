import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { weatherData, thermostatData } from "@shared/schema";

export async function initializeDatabase(): Promise<boolean> {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.log("DATABASE_URL not provided, skipping database initialization");
    return false;
  }

  try {
    console.log("Initializing database connection...");
    const sql = neon(databaseUrl);
    const db = drizzle(sql);

    // Test connection by attempting a simple query
    await sql`SELECT 1 as test`;
    console.log("Database connection successful");

    // Create tables if they don't exist (simple approach for deployment)
    try {
      await sql`
        CREATE TABLE IF NOT EXISTS weather_data (
          id SERIAL PRIMARY KEY,
          station_id TEXT NOT NULL,
          station_name TEXT,
          timestamp TIMESTAMP DEFAULT NOW() NOT NULL,
          temperature REAL,
          feels_like REAL,
          temperature_high REAL,
          temperature_low REAL,
          temperature_high_time TIMESTAMP,
          temperature_low_time TIMESTAMP,
          wind_speed REAL,
          wind_gust REAL,
          wind_direction INTEGER,
          wind_direction_cardinal TEXT,
          pressure REAL,
          pressure_trend TEXT,
          humidity REAL,
          uv_index REAL,
          visibility REAL,
          dew_point REAL,
          rain_today REAL,
          rain_yesterday REAL,
          last_updated TIMESTAMP DEFAULT NOW() NOT NULL
        )
      `;

      await sql`
        CREATE TABLE IF NOT EXISTS thermostat_data (
          id SERIAL PRIMARY KEY,
          thermostat_id TEXT NOT NULL,
          name TEXT NOT NULL,
          temperature REAL NOT NULL,
          target_temp REAL NOT NULL,
          humidity REAL,
          mode TEXT NOT NULL,
          timestamp TIMESTAMP DEFAULT NOW() NOT NULL,
          last_updated TIMESTAMP DEFAULT NOW() NOT NULL
        )
      `;

      // Create session table for connect-pg-simple
      await sql`
        CREATE TABLE IF NOT EXISTS session (
          sid VARCHAR NOT NULL COLLATE "default",
          sess JSON NOT NULL,
          expire TIMESTAMP(6) NOT NULL
        )
      `;

      await sql`
        ALTER TABLE session ADD CONSTRAINT IF NOT EXISTS session_pkey PRIMARY KEY (sid) NOT DEFERRABLE INITIALLY IMMEDIATE
      `;

      await sql`
        CREATE INDEX IF NOT EXISTS IDX_session_expire ON session (expire)
      `;

      console.log("Database tables initialized successfully");
      return true;
    } catch (tableError) {
      console.error("Error creating database tables:", tableError);
      return false;
    }
  } catch (error) {
    console.error("Database initialization failed:", error);
    return false;
  }
}