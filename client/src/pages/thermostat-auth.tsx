import EcobeeAuth from "@/components/auth/ecobee-auth";

export default function ThermostatAuth() {
  return (
    <div className="min-h-screen bg-background p-4">
      <div className="container mx-auto py-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2">Thermostat Setup</h1>
          <p className="text-muted-foreground">
            Configure your Ecobee thermostats to display real temperature data on the weather dashboard.
          </p>
        </div>
        
        <EcobeeAuth />
        
        <div className="mt-8 text-center">
          <a 
            href="/" 
            className="text-primary hover:underline"
          >
            ← Back to Weather Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}