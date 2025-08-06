# Contributing to WeatherFlow Tempest Weather Dashboard

Thank you for your interest in contributing to this weather dashboard project! This guide will help you get started.

## Getting Started

### Prerequisites
- Node.js 18 or higher
- Your own WeatherFlow Tempest weather station
- WeatherFlow API access token
- (Optional) Beestat account for thermostat integration

### Development Setup
1. Fork the repository
2. Clone your fork: `git clone https://github.com/yourusername/weather-dashboard.git`
3. Install dependencies: `npm install`
4. Copy `.env.example` to `.env` and configure with your personal API keys
5. Start development server: `npm run dev`

## Development Guidelines

### Environment Variables
- **Never commit personal data** - All API keys, station IDs, and coordinates must be environment variables
- **Use `.env.example`** - Add new environment variables to the example file with placeholder values
- **Test with real data** - Use your actual weather station and thermostat data for testing

### Code Style
- Follow existing TypeScript patterns
- Use functional React components with hooks
- Implement proper error handling for all API calls
- Add loading states for all async operations
- Use existing shadcn/ui components when possible

### Data Integrity
- Only use authentic data from real weather stations and thermostats
- Implement proper error handling when APIs are unavailable
- Never use mock or placeholder data in production code
- Ensure all units are properly converted (metric to imperial)

### Testing Your Changes
1. Configure your personal environment variables in `.env`
2. Test with your actual WeatherFlow Tempest station
3. If adding thermostat features, test with real Beestat API data
4. Verify the dashboard works in both landscape and portrait orientations
5. Test the kiosk mode functionality

## Types of Contributions

### Bug Reports
When reporting bugs, please include:
- Steps to reproduce the issue
- Expected behavior vs actual behavior
- Your environment setup (Node.js version, browser, etc.)
- Any relevant console logs or error messages
- Whether the issue occurs with your actual weather data

### Feature Requests
For new features, consider:
- Is this useful for multiple weather station owners?
- Does it maintain the kiosk-friendly design principles?
- Can it be configured via environment variables for different users?

### Code Contributions

#### Adding New Weather Cards
1. Create the component in `client/src/components/weather/`
2. Add necessary data fields to the schema in `shared/schema.ts`
3. Update the server routes to fetch and process the data
4. Add the card to the weather dashboard layout
5. Test with real weather station data

#### Adding New API Integrations
1. Create a new API client in `server/`
2. Add environment variables for API keys and configuration
3. Update the schema for any new data types
4. Add proper error handling and caching
5. Document the new integration in SETUP.md

#### Improving Responsive Design
1. Test changes on multiple screen sizes (phone to large kiosk displays)
2. Ensure both landscape and portrait orientations work well
3. Maintain the dark theme optimization
4. Test with actual kiosk hardware if possible

## Documentation

### Required Documentation Updates
- Update `README.md` for user-facing changes
- Update `SETUP.md` for new configuration options
- Update `DEPLOYMENT.md` for new deployment considerations
- Update `.env.example` for new environment variables

### Code Comments
- Document complex weather data processing logic
- Explain API integration patterns
- Comment on responsive design decisions
- Document unit conversion formulas

## Pull Request Process

### Before Submitting
1. Ensure all personal data is removed from your code
2. Test with your own weather station and API keys
3. Update relevant documentation
4. Follow the existing code patterns and style
5. Add proper error handling for API failures

### Pull Request Description
Include:
- **What**: Brief description of changes
- **Why**: Reason for the change (bug fix, feature, improvement)
- **Testing**: How you tested the changes with real data
- **Breaking Changes**: Any configuration changes required
- **Documentation**: What documentation was updated

### Review Process
1. Automated tests will run (when available)
2. Maintainers will review for:
   - Data integrity (no mock data)
   - Security (no exposed API keys)
   - Functionality with real weather stations
   - Code quality and consistency
3. Address any feedback
4. Once approved, changes will be merged

## Development Environment

### Recommended Setup
- **VS Code** with TypeScript and React extensions
- **Node.js 18+** for best compatibility
- **Real weather station** for authentic testing
- **Multiple browsers** for cross-browser testing

### Environment Variables for Development
Always use your actual:
- WeatherFlow API token and station ID
- Geographic coordinates for your location
- Beestat API key (if testing thermostat features)
- Thermostat names that match your Ecobee setup

### Debugging Tips
- Check browser console for client-side errors
- Monitor server logs for API issues
- Use browser dev tools to test responsive layouts
- Test with network throttling to simulate slow connections

## Security Considerations

### API Key Protection
- Never commit `.env` files
- Use environment variables in all deployment scenarios
- Rotate API keys periodically
- Report any suspected key exposure immediately

### Data Privacy
- Only process data from your own weather station
- Don't log sensitive configuration data
- Be mindful of location data in error reports
- Follow WeatherFlow and Beestat API terms of service

## Community Guidelines

### Be Helpful
- Share knowledge about weather station setup
- Help others troubleshoot their configurations
- Suggest improvements for different hardware setups

### Be Respectful
- Respect others' privacy (don't ask for their API keys or location)
- Be patient with users learning to configure their systems
- Provide constructive feedback in code reviews

### Stay Focused
- Keep discussions related to weather monitoring
- Focus on authentic data solutions
- Maintain the kiosk-friendly design principles

## Getting Help

### Documentation
- Read [SETUP.md](./SETUP.md) for configuration help
- Check [DEPLOYMENT.md](./DEPLOYMENT.md) for deployment guidance
- Review existing issues for similar problems

### Support Channels
- GitHub Issues for bugs and feature requests
- Discussions for configuration help
- WeatherFlow community for API-related questions
- Beestat community for thermostat integration help

Thank you for contributing to making weather monitoring more accessible and user-friendly!