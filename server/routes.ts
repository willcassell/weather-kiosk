import type { Express } from "express";
import { createServer, type Server } from "http";
import { systemRouter } from "./controllers/system.js";
import { weatherRouter } from "./controllers/weather.js";
import { thermostatRouter } from "./controllers/thermostat.js";
import { setupWebSockets } from "./ws.js";

export async function registerRoutes(app: Express): Promise<Server> {
  // Mount the modular routers
  app.use("/api", systemRouter);
  app.use("/api/weather", weatherRouter);
  app.use("/api/thermostats", thermostatRouter);

  // Note: No background polling needed for thermostat data - using on-demand API calls with caching
  const httpServer = createServer(app);

  setupWebSockets(httpServer);

  return httpServer;
}
