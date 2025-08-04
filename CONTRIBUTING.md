# Contributing to Weather Kiosk

## Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/weather-kiosk.git
   cd weather-kiosk
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create `.env` file with:
   ```
   WEATHERFLOW_API_TOKEN=your_token_here
   DATABASE_URL=postgresql://localhost:5432/weather_kiosk
   NODE_ENV=development
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

## Project Structure

```
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # UI components
│   │   ├── pages/         # Route pages
│   │   ├── hooks/         # Custom React hooks
│   │   └── lib/           # Utilities and config
├── server/                # Express backend
│   ├── index.ts           # Server entry point
│   ├── routes.ts          # API routes
│   ├── storage.ts         # Database interface
│   └── homekit-discovery.ts # Thermostat integration
├── shared/                # Shared types and schemas
└── docs/                  # Documentation
```

## Architecture Decisions

### Frontend
- **React + TypeScript** for type safety
- **Wouter** for lightweight routing
- **TanStack Query** for server state management
- **shadcn/ui** for consistent UI components
- **Tailwind CSS** for styling

### Backend
- **Express + TypeScript** for API server
- **Drizzle ORM** for database operations
- **PostgreSQL** for data persistence
- **ESM modules** for modern JavaScript

### Data Flow
1. WeatherFlow API polling every 3 minutes
2. Data transformation and storage
3. Frontend polling for updates
4. Real-time display with animations

## Adding Features

### New Weather Cards
1. Create component in `client/src/components/weather/`
2. Add to main dashboard layout
3. Include responsive design considerations
4. Add proper loading and error states

### API Integrations
1. Add API client in `server/` directory
2. Create proper TypeScript interfaces
3. Add error handling and fallbacks
4. Update storage interface if needed

### Thermostat Integrations
1. Follow existing HomeKit pattern in `server/homekit-discovery.ts`
2. Add proper authentication handling
3. Implement realistic data fallbacks
4. Document setup process

## Code Style

### TypeScript
- Strict mode enabled
- Proper type definitions required
- No `any` types without justification

### React
- Functional components with hooks
- Proper prop typing with interfaces
- Custom hooks for reusable logic

### Styling
- Tailwind utility classes preferred
- Dark theme support required
- Mobile-first responsive design

## Testing

Currently using manual testing. Future improvements:
- Unit tests for utility functions
- Integration tests for API routes
- E2E tests for critical user flows

## Database Changes

### Schema Updates
1. Modify `shared/schema.ts`
2. Generate migration with Drizzle
3. Test migration on development database
4. Update storage interface accordingly

### Data Migration
- Use Drizzle migration system
- Provide rollback procedures
- Test with production-like data

## Documentation

### Required Documentation
- Update README.md for new features
- Add setup instructions for integrations
- Include troubleshooting guides
- Document API changes

### Code Documentation
- JSDoc comments for complex functions
- Inline comments for business logic
- Type definitions serve as documentation

## Deployment

### Testing Before Release
1. Test all weather data sources
2. Verify thermostat integrations
3. Check responsive design
4. Validate database migrations

### Release Process
1. Update version in package.json
2. Update CHANGELOG.md
3. Create GitHub release
4. Deploy to staging environment
5. Monitor for issues

## Getting Help

- **Questions**: Open GitHub discussion
- **Bugs**: Create detailed issue report
- **Feature Requests**: Describe use case and benefits
- **Security Issues**: Email privately first

## Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Help others learn and contribute
- Maintain professional communication