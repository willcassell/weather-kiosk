#!/usr/bin/env node

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

async function runMigrations() {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error("DATABASE_URL environment variable is required for migrations");
    process.exit(1);
  }

  try {
    console.log("Running database migrations...");
    const sql = neon(databaseUrl);
    const db = drizzle(sql);

    // Test connection
    await sql`SELECT 1 as test`;
    console.log("Database connection successful");

    // Create weather_data table
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

    // Create thermostat_data table
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

    // Create indexes for better performance
    await sql`
      CREATE INDEX IF NOT EXISTS idx_weather_data_station_id ON weather_data (station_id)
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS idx_weather_data_last_updated ON weather_data (last_updated DESC)
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS idx_weather_data_timestamp ON weather_data (timestamp DESC)
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS idx_thermostat_data_thermostat_id ON thermostat_data (thermostat_id)
    `;

    console.log("Database migrations completed successfully");
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

runMigrations();