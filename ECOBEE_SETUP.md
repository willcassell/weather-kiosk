# Ecobee Thermostat Integration via Beestat

The weather dashboard integrates with Ecobee thermostats through the **Beestat API**, which provides reliable access to thermostat data without requiring direct Ecobee API registration.

## Why Beestat?

- **No Ecobee API needed**: Ecobee suspended new developer registrations in March 2024
- **Reliable data access**: Beestat maintains its own Ecobee integration
- **Simple setup**: Just connect your Ecobee account to Beestat and get an API key
- **Multi-thermostat support**: Handle multiple thermostats with custom naming

## Setup Steps

### 1. Create Beestat Account
1. Visit [Beestat.io](https://beestat.io)
2. Create an account and connect your Ecobee account
3. Wait 24-48 hours for initial data synchronization
4. Verify your thermostats appear in the Beestat dashboard

### 2. Get API Access
1. Go to [Beestat Account Settings](https://beestat.io/account)
2. Generate an API key
3. Copy the key for your environment configuration

### 3. Configure Environment Variables
Add these variables to your `.env` file:

```bash
# Beestat API Configuration
BEESTAT_API_KEY=your_beestat_api_key_here
TARGET_THERMOSTAT_NAMES=Downstairs,Upstairs,Main Floor
```

### 4. Configure Thermostat Names
The `TARGET_THERMOSTAT_NAMES` should match the exact names of your thermostats as they appear in your Ecobee app:

- Check your Ecobee app for the exact thermostat names
- Use comma-separated list with no spaces after commas
- Names are case-sensitive and must match exactly

**Examples:**
```bash
# Single thermostat
TARGET_THERMOSTAT_NAMES=Home

# Multiple thermostats
TARGET_THERMOSTAT_NAMES=Downstairs,Upstairs
TARGET_THERMOSTAT_NAMES=Living Room,Bedroom,Guest Room
```

## Features

### Thermostat Data Display
- **Current temperature** for each configured thermostat
- **Target temperature** with HVAC mode indicators
- **HVAC status**: Visual indicators for heating/cooling/idle
- **Multi-location support**: Display multiple thermostats simultaneously

### HVAC Mode Indicators
- 🔥 **Heat**: Red indicator when heating is active
- ❄️ **Cool**: Blue indicator when cooling is active  
- 🎯 **Auto**: Green indicator for automatic mode
- ⏸️ **Off**: Gray indicator when HVAC is off

## Troubleshooting

### No Thermostat Data
- **Check API Key**: Verify `BEESTAT_API_KEY` is correct
- **Wait for sync**: Initial Beestat sync can take 24-48 hours
- **Verify connection**: Ensure your Ecobee account is connected to Beestat

### Wrong Thermostats Shown
- **Check names**: Verify `TARGET_THERMOSTAT_NAMES` spelling matches Ecobee app exactly
- **Case sensitive**: Names must match case exactly as shown in Ecobee
- **No extra spaces**: Use format `Name1,Name2` without spaces after commas

### Incorrect Readings
- **Data delay**: Beestat updates may have 15-30 minute delay
- **Recent changes**: New thermostat settings may take time to appear
- **Sync issues**: Check Beestat dashboard for any sync errors

## Data Flow

1. **Ecobee** → Your thermostats report to Ecobee cloud
2. **Beestat** → Syncs data from Ecobee every 15-30 minutes  
3. **Weather Dashboard** → Requests thermostat data from Beestat API every 3 minutes
4. **Display** → Shows current readings with visual HVAC status

## API Endpoints

The dashboard provides thermostat data via:
- `GET /api/thermostats/current` - Current readings from all configured thermostats

This endpoint returns temperature, humidity, HVAC mode, and status for each thermostat in your `TARGET_THERMOSTAT_NAMES` list.

## Support

For issues with:
- **Beestat API**: Visit [Beestat Community](https://community.beestat.io)  
- **Ecobee connection**: Check your Ecobee account at [ecobee.com](https://ecobee.com)
- **Dashboard integration**: Verify environment variables and check application logs