# Contributing to WeatherFlow Tempest Weather Kiosk

Thank you for your interest in contributing! This project welcomes contributions from the community.

## How to Contribute

### Reporting Bugs

If you find a bug, please create an issue with:
- A clear description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Your environment (OS, Docker version, etc.)

### Suggesting Features

Feature requests are welcome! Please:
- Check if the feature has already been requested
- Describe the use case and benefits
- Consider if it fits the kiosk use case

### Pull Requests

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make your changes**
   - Follow existing code style
   - Test with real WeatherFlow API credentials
   - Update documentation if needed

4. **Test thoroughly**
   ```bash
   docker compose down
   docker compose build
   docker compose up -d
   ```

5. **Commit your changes**
   ```bash
   git commit -m "Description of changes"
   ```

6. **Push and create PR**
   ```bash
   git push origin feature/your-feature-name
   ```

## Development Guidelines

### Code Style
- Use TypeScript for type safety
- Follow existing patterns and conventions
- Use meaningful variable names
- Add comments for complex logic

### Environment Variables
- **Never commit API keys or personal data**
- All personal configuration must use environment variables
- Add new variables to `.env.example` with descriptions
- Document in README.md

### Testing
- Test with actual WeatherFlow Tempest station
- Verify both with and without Beestat integration
- Test unit conversions (imperial/metric)
- Test on different screen sizes

### Documentation
- Update README.md for new features
- Update QUICK_START.md if setup changes
- Add inline code comments
- Update environment variable tables

## What We're Looking For

Contributions that align with the project goals:
- **Kiosk-focused features** - Designed for continuous display
- **Additional weather integrations** - More data sources
- **Deployment improvements** - Easier setup, more platforms
- **Bug fixes** - Stability and reliability
- **Performance optimizations** - Faster loading, lower resource usage
- **Accessibility improvements** - Better readability, contrast

## What to Avoid

- Features requiring user interaction (this is for kiosks)
- Breaking changes without discussion
- Hardcoded personal data
- Unnecessary dependencies
- Complex configuration

## Code of Conduct

- Be respectful and inclusive
- Welcome newcomers
- Focus on constructive feedback
- Help others learn

## Questions?

- Open an issue for questions
- Check existing issues and documentation first
- Be specific about your environment and use case

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
