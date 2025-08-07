# WeatherFlow Tempest Rainfall Measurement Accuracy

## Understanding the Discrepancy

The WeatherFlow Tempest uses a **haptic rain sensor** that measures precipitation through vibration detection rather than traditional volume measurement. This can lead to differences between API data and physical unit readings.

## Current Issue

- **API Reports**: 1.15" yesterday rainfall
- **Physical Unit Shows**: 0.75" yesterday rainfall  
- **Discrepancy**: +0.40" (53% higher via API)

## Why This Happens

### Haptic Sensor Technology
- Measures rainfall by detecting vibration from raindrop impacts
- More sensitive to environmental factors than traditional rain gauges
- Can over-report due to:
  - Wind-induced vibrations
  - Mounting instability
  - External vibrations (roof movement, etc.)
  - Processing algorithms that enhance raw measurements

### API vs Device Display
- **API Data**: Often includes WeatherFlow's processed/calibrated values using regional modeling
- **Device Display**: May show raw sensor readings or differently processed data
- **Timing Differences**: API uses server processing while device shows real-time calculations

## Potential Solutions

### 1. Accept API Data as More Accurate
The API uses regional modeling and calibration data that may be more accurate than raw sensor readings.

### 2. Manual Calibration Factor
Apply a correction factor based on comparison with local reference gauges:
```
Correction Factor = Physical Reading / API Reading = 0.75 / 1.15 = 0.65
```

### 3. Use Alternative Data Source
- Check if WeatherFlow provides raw sensor data endpoints
- Compare with nearby weather stations or rain gauges
- Use forecast precipitation data instead of observed

### 4. Installation Review
- Ensure Tempest is mounted on stable, vibration-free surface
- Check mounting height (accuracy decreases above 40 inches)
- Verify level installation
- Consider wind effects on measurement accuracy

## Recommendation

For this application, **continue using the API data** as it represents WeatherFlow's best estimate of actual precipitation using their calibration systems. The haptic sensor technology, while innovative, is known to have accuracy variations that WeatherFlow addresses through their processing algorithms.

Consider adding a note in the UI about potential measurement variations if users compare with other local gauges.