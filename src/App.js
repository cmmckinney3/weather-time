import React, { useState, useEffect } from "react";
import WeatherAppLayout from "./components/WeatherAppLayout";
import { MapPin, Search, Compass, TrendingUp, Camera, Umbrella } from "lucide-react";
import { getWeatherRecommendation, getWeatherIcon } from "./utils/weatherUtils";

const API_KEY = "78beeaa33e864130837194702250505"; // Keep your existing API key

function App() {
  const [city, setCity] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [weather, setWeather] = useState(null);
  const [quote, setQuote] = useState(null);
  const [backgroundClass, setBackgroundClass] = useState("from-blue-50 to-indigo-100");

  useEffect(() => {
    // Weather quotes to display based on conditions
    const weatherQuotes = {
      sunny: [
        "Wherever you go, no matter what the weather, always bring your own sunshine.",
        "A sunny day is a reminder that light always follows darkness.",
        "Keep your face to the sunshine and you cannot see the shadow."
      ],
      rainy: [
        "Some people feel the rain. Others just get wet.",
        "Let the rain kiss you. Let the rain beat upon your head with silver liquid drops.",
        "The sound of rain needs no translation."
      ],
      cloudy: [
        "Even the darkest clouds will eventually part for the sun.",
        "Clouds come floating into my life, no longer to carry rain or usher storm, but to add color to my sunset sky.",
        "Behind every cloud is another cloud."
      ],
      snowy: [
        "Snowflakes are one of nature's most fragile things, but just look what they can do when they stick together.",
        "When snow falls, nature listens.",
        "The first fall of snow is not only an event, it is a magical event."
      ],
      default: [
        "Wherever you go, the weather follows you.",
        "Climate is what we expect, weather is what we get.",
        "Nature, time and patience are the three great physicians."
      ]
    };

    // Set appropriate background based on weather
    if (weather && weather.current) {
      const condition = weather.current.condition.text.toLowerCase();
      let quoteCategory = "default";
      
      // Set background gradient and quote category based on weather condition
      if (condition.includes("sun") || condition.includes("clear")) {
        setBackgroundClass("from-yellow-50 to-amber-100");
        quoteCategory = "sunny";
      } else if (condition.includes("rain")) {
        setBackgroundClass("from-blue-100 to-indigo-200");
        quoteCategory = "rainy";
      } else if (condition.includes("cloud")) {
        setBackgroundClass("from-gray-100 to-blue-100");
        quoteCategory = "cloudy";
      } else if (condition.includes("snow")) {
        setBackgroundClass("from-blue-50 to-gray-100");
        quoteCategory = "snowy";
      }
      
      // Select a random quote
      const quotes = weatherQuotes[quoteCategory];
      const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
      setQuote(randomQuote);
    }
  }, [weather]);

  // Location variable is now used in fetchWeatherByCoords function
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      setLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          fetchWeatherByCoords(latitude, longitude);
        },
        (err) => {
          setError("Unable to retrieve your location. Please search manually.");
          setLoading(false);
        }
      );
    } else {
      setError("Geolocation is not supported by your browser. Please search manually.");
    }
  };

  // Fetch weather data by coordinates
  const fetchWeatherByCoords = async (lat, lon) => {
    try {
      const res = await fetch(
        `https://api.weatherapi.com/v1/forecast.json?key=${API_KEY}&q=${lat},${lon}&days=3&aqi=yes&alerts=yes`
      );

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error.message || "Could not fetch weather data");
      }

      const data = await res.json();
      processWeatherData(data);
    } catch (err) {
      setError(err.message || "Could not fetch weather data");
    } finally {
      setLoading(false);
    }
  };

  const getWeather = async () => {
    if (!city.trim()) {
      setError("Please enter a city name");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `https://api.weatherapi.com/v1/forecast.json?key=${API_KEY}&q=${city}&days=3&aqi=yes&alerts=yes`
      );

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error.message || "Could not fetch weather data");
      }

      const data = await res.json();
      processWeatherData(data);
    } catch (err) {
      setError(err.message || "Could not fetch weather data");
    } finally {
      setLoading(false);
    }
  };

  // Process weather data - just use what the API gives us
  const processWeatherData = (data) => {
    setWeather(data);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      getWeather();
    }
  };

  const recommendation = weather ? getWeatherRecommendation(weather.current, weather.forecast.forecastday[0]) : null;

  return (
    <div className={`min-h-screen bg-gradient-to-b ${backgroundClass} transition-colors duration-1000`}>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto mb-8">
          <h1 className="text-4xl font-bold text-center text-indigo-900 mb-2">
            Weather My Way
          </h1>
          
          {quote && !weather && (
            <p className="text-center text-indigo-700 italic mb-6">"{quote}"</p>
          )}

          <div className="relative mb-6">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <MapPin className="text-gray-500" />
            </div>
            <input
              type="text"
              placeholder="Enter city, zip code, or location"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-full pl-10 pr-16 py-3 rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <button
              onClick={getWeather}
              disabled={loading}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg flex items-center transition-colors"
            >
              {loading ? (
                <span className="inline-block h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin mr-1"></span>
              ) : (
                <Search className="mr-1" size={18} />
              )}
              Search
            </button>
          </div>

          <div className="flex justify-center mb-6">
            <button
              onClick={getCurrentLocation}
              disabled={loading}
              className="flex items-center bg-white hover:bg-gray-50 text-indigo-600 font-medium py-2 px-4 rounded-lg shadow transition-colors"
            >
              <Compass className="mr-2" size={18} />
              Use my location
            </button>
          </div>

          {error && (
            <div className="mt-4 bg-red-50 border-l-4 border-red-500 p-4 rounded">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {!weather && !loading && (
          <div className="max-w-4xl mx-auto bg-white bg-opacity-80 rounded-xl shadow-lg p-6 mb-8">
            <h2 className="text-2xl font-bold text-center text-indigo-900 mb-6">
              Popular Weather Destinations
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {['New York', 'London', 'Tokyo', 'Sydney', 'Paris', 'Dubai', 'Cape Town', 'Rio de Janeiro'].map((popularCity) => (
                <button
                  key={popularCity}
                  onClick={() => {
                    setCity(popularCity);
                    setTimeout(() => getWeather(), 100);
                  }}
                  className="bg-gradient-to-r from-indigo-50 to-blue-50 hover:from-indigo-100 hover:to-blue-100 rounded-lg p-4 text-center shadow-sm transition-all duration-300 hover:shadow-md"
                >
                  <p className="font-medium text-indigo-800">{popularCity}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {weather && (
          <>
            {/* Weather icon and current conditions display */}
            <div className="max-w-4xl mx-auto mb-6">
              <div className="bg-white bg-opacity-90 rounded-xl shadow p-6 flex flex-col md:flex-row items-center justify-between">
                <div className="flex items-center mb-4 md:mb-0">
                  <div className="mr-4">
                    {React.cloneElement(getWeatherIcon(weather.current.condition, 64))}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">{weather.location.name}</h2>
                    <p className="text-lg text-gray-600">{weather.current.condition.text}</p>
                    <p className="text-3xl font-bold text-indigo-600">{weather.current.temp_f}°F</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-gray-600">Feels like: {weather.current.feelslike_f}°F</p>
                  <p className="text-gray-600">Wind: {weather.current.wind_mph} mph</p>
                  <p className="text-gray-600">Humidity: {weather.current.humidity}%</p>
                </div>
              </div>
            </div>

            {/* Quote and recommendation display */}
            <div className="max-w-4xl mx-auto mb-6">
              {quote && (
                <div className="bg-white bg-opacity-80 rounded-xl shadow-sm p-4 mb-4 text-center">
                  <p className="text-lg text-indigo-800 italic">"{quote}"</p>
                </div>
              )}
              
              {recommendation && (
                <div className="bg-white bg-opacity-90 rounded-xl shadow p-4 flex items-center">
                  <div className="mr-4">
                    {recommendation.icon}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800">Today's Recommendation</h3>
                    <p className="text-gray-700">{recommendation.text}</p>
                  </div>
                </div>
              )}
            </div>
            
            <WeatherAppLayout weather={weather} />
          </>
        )}

        {/* Footer with app features */}
        <div className="max-w-4xl mx-auto mt-12 px-4">
          <h3 className="text-xl font-bold text-center text-indigo-900 mb-6">
            App Features
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow p-4 text-center">
              <div className="flex justify-center mb-3">
                <TrendingUp className="text-indigo-600" size={28} />
              </div>
              <h4 className="font-semibold text-gray-800 mb-2">Accurate Forecasts</h4>
              <p className="text-gray-600 text-sm">Get detailed 3-day forecasts with hourly updates for any location worldwide</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4 text-center">
              <div className="flex justify-center mb-3">
                <Camera className="text-indigo-600" size={28} />
              </div>
              <h4 className="font-semibold text-gray-800 mb-2">Visual Weather</h4>
              <p className="text-gray-600 text-sm">Interactive weather visualizations help you understand conditions at a glance</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4 text-center">
              <div className="flex justify-center mb-3">
                <Umbrella className="text-indigo-600" size={28} />
              </div>
              <h4 className="font-semibold text-gray-800 mb-2">Smart Recommendations</h4>
              <p className="text-gray-600 text-sm">Get daily tips based on weather conditions to help plan your activities</p>
            </div>
          </div>
          
          {/* Attribution */}
          <div className="text-center mt-8 pt-4 border-t border-gray-200">
            <p className="text-gray-600 text-sm">
              Powered by <a href="https://www.weatherapi.com/" title="Weather API" className="text-indigo-600 hover:text-indigo-800 underline">WeatherAPI.com</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;