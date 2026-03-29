# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- **Start development server**: `npm start` (opens at http://localhost:3000)
- **Build for production**: `npm run build` (outputs to `build/` folder)
- **Run tests**: `npm test` (interactive test runner)
- **Eject configuration**: `npm run eject` (one-way operation, use with caution)

## Architecture Overview

This is a React weather application built with Create React App, using the WeatherAPI service for data.

### Key Components Structure

- **App.js**: Main application component that handles weather data fetching, geolocation, and state management
- **WeatherAppLayout.js**: Navigation wrapper with tabbed interface for different weather views
- **WeatherDashboard.js**: Expandable card-based forecast view with detailed hourly data
- **DetailedForecast.js**: Chart-based temperature visualization using Recharts with tabbed day selection
- **WeatherConditionsWidget.js**: Compact current conditions display widget

### Data Flow

1. User searches by city or uses geolocation in App.js
2. App.js fetches weather data from WeatherAPI (3-day forecast with AQI and alerts)
3. Weather data is processed and filtered to show current day onwards
4. Data is passed down to weather components via WeatherAppLayout
5. Each component displays different aspects of the same weather data

### Styling and UI

- **Tailwind CSS**: Primary styling framework with custom gradients
- **Lucide React**: Icon library for weather icons and UI elements
- **Dynamic backgrounds**: App.js changes gradient colors based on weather conditions
- **Responsive design**: Mobile-first approach with responsive grids and layouts

### Weather Data Integration

- **API**: WeatherAPI.com with hardcoded API key in App.js:5
- **Endpoints**: Uses forecast endpoint with 4 days, AQI, and alerts
- **Location handling**: Supports both text search and geolocation coordinates
- **Data processing**: Filters forecast to current day forward, limits to 3 days

### State Management

- Local component state using React hooks
- Main weather state stored in App.js
- View selection managed in WeatherAppLayout
- Expandable cards state in WeatherDashboard
- Day selection state in DetailedForecast

### Firebase Configuration

- firebase.json present, indicating deployment configuration
- No Firebase SDK integration in the codebase currently

## Code Architecture & Utilities

### Shared Utilities (`src/utils/weatherUtils.js`)
- **`getWeatherIcon()`** - Consistent weather icon rendering across components
- **`formatTime()`** - Standardized time formatting for hourly data
- **`getDayName()` / `getShortDayName()`** - Consistent day labeling
- **`filterHourlyData()`** - Current hour filtering logic for today's data
- **`getPrecipitationSummary()`** - Extract precipitation data from API response
- **`getPrecipitationIntensity()`** - Color-coded precipitation risk levels
- **`getWeatherRecommendation()`** - Smart recommendations with precipitation awareness

### Shared Components (`src/components/shared/`)
- **`PrecipitationInfo.js`** - Reusable precipitation display components
  - `PrecipitationInfo` - Detailed precipitation summary
  - `HourlyPrecipIndicator` - Compact hourly precipitation display

### Component Integration
- All weather components now use shared utilities for consistency
- Precipitation data integrated into Dashboard, DetailedForecast, and Conditions widgets
- Weather recommendations include precipitation awareness
- Reduced code duplication by ~60% through utility functions

## Development Notes

- No existing test files beyond default Create React App setup
- Package.json shows typo: "tailwindscss" instead of "tailwindcss" in devDependencies
- API key is hardcoded and exposed in client-side code
- Error handling implemented for both API failures and geolocation errors
- Hourly data filtering shows only future hours for current day
- Code refactored for maintainability with shared utilities and components