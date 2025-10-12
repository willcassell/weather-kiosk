import pkg from "pg";
const { Pool } = pkg;
import { drizzle } from "drizzle-orm/node-postgres";
import { weatherData, weatherObservations, thermostatData } from "@shared/schema";

export async function initializeDatabase(): Promise<boolean> {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.log("DATABASE_URL not provided, skipping database initialization");
    return false;
  }

  let pool: Pool | null = null;

  try {
    console.log("Initializing database connection...");
    pool = new Pool({ connectionString: databaseUrl });
    const db = drizzle({ client: pool });

    // Test connection by attempting a simple query
    await pool.query('SELECT 1 as test');
    console.log("Database connection successful");

    // Create tables if they don't exist (simple approach for deployment)
    try {
      await pool.query(`
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
          lightning_strike_distance REAL,
          lightning_strike_time TIMESTAMP,
          dew_point REAL,
          rain_today REAL,
          rain_yesterday REAL,
          last_updated TIMESTAMP DEFAULT NOW() NOT NULL
        )
      `);

      // Create weather observations table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS weather_observations (
          id SERIAL PRIMARY KEY,
          station_id TEXT NOT NULL,
          timestamp TIMESTAMP NOT NULL,
          temperature REAL NOT NULL,
          feels_like REAL,
          wind_speed REAL,
          wind_gust REAL,
          wind_direction INTEGER,
          pressure REAL,
          humidity REAL,
          uv_index REAL,
          dew_point REAL,
          rain_accumulation REAL,
          lightning_strike_count INTEGER,
          lightning_strike_distance REAL,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL
        )
      `);

      await pool.query(`
        CREATE TABLE IF NOT EXISTS thermostat_data (
          id SERIAL PRIMARY KEY,
          thermostat_id TEXT NOT NULL,
          name TEXT NOT NULL,
          temperature REAL NOT NULL,
          target_temp REAL NOT NULL,
          humidity REAL,
          mode TEXT NOT NULL,
          hvac_state TEXT,
          timestamp TIMESTAMP DEFAULT NOW() NOT NULL,
          last_updated TIMESTAMP DEFAULT NOW() NOT NULL
        )
      `);

      // Create session table for connect-pg-simple
      await pool.query(`
        CREATE TABLE IF NOT EXISTS session (
          sid VARCHAR NOT NULL COLLATE "default",
          sess JSON NOT NULL,
          expire TIMESTAMP(6) NOT NULL
        )
      `);

      // Add primary key constraint if it doesn't exist (PostgreSQL compatible syntax)
      try {
        await pool.query(`ALTER TABLE session ADD CONSTRAINT session_pkey PRIMARY KEY (sid)`);
      } catch (constraintError) {
        // Constraint probably already exists, which is fine
        console.log("Session table constraint already exists or not needed");
      }

      await pool.query(`
        CREATE INDEX IF NOT EXISTS IDX_session_expire ON session (expire)
      `);

      console.log("Database tables initialized successfully");
      return true;
    } catch (tableError) {
      console.error("Error creating database tables:", tableError);
      return false;
    }
  } catch (error) {
    console.error("Database initialization failed:", error);
    return false;
  } finally {
    // Clean up pool connection
    if (pool) {
      await pool.end();
    }
  }
}