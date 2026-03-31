import React, { useState } from 'react';
import WeatherDashboard from './WeatherDashboard';
import DetailedForecast from './DetailedForecast';
import WeatherConditionsWidget from './WeatherConditionsWidget';
import PrecipitationRadar from './PrecipitationRadar';

const WeatherAppLayout = ({ weather, tempUnit }) => {
  const [activeView, setActiveView] = useState('dashboard');

  if (!weather) return null;

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-indigo-900 mb-2 text-center">Weather Information</h1>
        <p className="text-center text-indigo-700 mb-6">Current weather and forecast for {weather.location.name}</p>
        
        {/* View selector */}
        <div className="flex justify-center mb-8">
          <div className="flex flex-wrap justify-center gap-1 bg-white rounded-lg shadow-md p-1">
            <button
              onClick={() => setActiveView('dashboard')}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                activeView === 'dashboard'
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-700 hover:bg-indigo-50'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveView('forecast')}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                activeView === 'forecast'
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-700 hover:bg-indigo-50'
              }`}
            >
              Detailed Forecast
            </button>
            <button
              onClick={() => setActiveView('conditions')}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                activeView === 'conditions'
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-700 hover:bg-indigo-50'
              }`}
            >
              Conditions
            </button>
            <button
              onClick={() => setActiveView('precipitation')}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                activeView === 'precipitation'
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-700 hover:bg-indigo-50'
              }`}
            >
              Precipitation
            </button>
          </div>
        </div>
        
        {/* Active view */}
        <div className="mb-8">
          {activeView === 'dashboard' && <WeatherDashboard weather={weather} tempUnit={tempUnit} />}
          {activeView === 'forecast' && <DetailedForecast weather={weather} tempUnit={tempUnit} />}
          {activeView === 'conditions' && <WeatherConditionsWidget weather={weather} tempUnit={tempUnit} />}
          {activeView === 'precipitation' && <PrecipitationRadar weather={weather} />}
        </div>
      </div>
    </div>
  );
};

export default WeatherAppLayout;