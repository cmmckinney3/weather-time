import { Sun, Cloud, CloudRain, Wind, CloudSnow } from 'lucide-react';

/**
 * Get appropriate weather icon component based on condition
 * @param {Object} condition - Weather condition object from API
 * @param {string} size - Icon size (default: 36)
 * @returns {JSX.Element} - Weather icon component
 */
export const getWeatherIcon = (condition, size = 36) => {
  const text = condition.text.toLowerCase();
  if (text.includes('sun') || text.includes('clear')) {
    return <Sun className="text-yellow-500" size={size} />;
  }
  if (text.includes('rain') || text.includes('drizzle') || text.includes('shower')) {
    return <CloudRain className="text-blue-500" size={size} />;
  }
  if (text.includes('snow')) {
    return <CloudSnow className="text-blue-200" size={size} />;
  }
  if (text.includes('wind')) {
    return <Wind className="text-blue-400" size={size} />;
  }
  return <Cloud className="text-gray-500" size={size} />;
};

/**
 * Resolve the visual "atmosphere" theme key for the current conditions.
 * Drives the data-atmo attribute on the app root, which re-tints the
 * entire palette (surfaces, accent, aurora) via CSS variables.
 * @param {Object} condition - Weather condition object from API
 * @param {boolean} isDay - Whether it is currently daytime at the location
 * @returns {string} - Atmosphere key (e.g. 'clear-day', 'rain', 'storm')
 */
export const getAtmosphere = (condition, isDay) => {
  const text = condition?.text?.toLowerCase() ?? '';
  if (text.includes('thunder') || text.includes('storm')) return 'storm';
  if (
    text.includes('snow') || text.includes('blizzard') ||
    text.includes('sleet') || text.includes('ice')
  ) return 'snow';
  if (text.includes('rain') || text.includes('drizzle') || text.includes('shower')) return 'rain';
  if (text.includes('fog') || text.includes('mist') || text.includes('haze')) return 'fog';
  // "Partly cloudy" still reads as a sunny sky — only fully grey skies get the cloud theme
  if (text.includes('partly')) return isDay ? 'clear-day' : 'clear-night';
  if (text.includes('cloud') || text.includes('overcast')) return 'cloud';
  if (text.includes('sun') || text.includes('clear')) return isDay ? 'clear-day' : 'clear-night';
  return isDay ? 'clear-day' : 'clear-night';
};

/**
 * Format time string to AM/PM format
 * @param {string} dateTimeStr - DateTime string from API
 * @returns {string} - Formatted time string (e.g., "2 PM")
 */
export const formatTime = (dateTimeStr) => {
  return new Date(dateTimeStr).toLocaleString('en-US', {
    hour: 'numeric',
    hour12: true
  });
};

/**
 * Get day name for forecast display
 * @param {number} index - Day index (0 = today, 1 = tomorrow, etc.)
 * @param {string} dateStr - Date string from API
 * @returns {string} - Formatted day name
 */
export const getDayName = (index, dateStr) => {
  if (index === 0) return 'Today';
  if (index === 1) return 'Tomorrow';
  // Append T12:00:00 to parse as local noon, avoiding UTC-offset date shift
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric'
  });
};


/**
 * Filter hourly data to show only current hour onward for today
 * @param {Array} hourlyData - Array of hourly weather data
 * @param {number} dayIndex - Day index (0 = today)
 * @returns {Array} - Filtered hourly data
 */
export const filterHourlyData = (hourlyData, dayIndex, localtime) => {
  if (dayIndex !== 0) return hourlyData;

  const localNow = localtime
    ? new Date(localtime.replace(' ', 'T'))
    : new Date();
  const currentHour = Number.isNaN(localNow.getTime())
    ? new Date().getHours()
    : localNow.getHours();

  return hourlyData.filter(hour => new Date(hour.time).getHours() >= currentHour);
};



/**
 * Get weather recommendation based on conditions
 * @param {Object} current - Current weather data
 * @param {Object} today - Today's forecast data
 * @returns {Object} - Recommendation with icon and text
 */
export const getWeatherRecommendation = (current, today) => {
  const condition = current.condition.text.toLowerCase();
  const temp = current.temp_f;
  const rainChance = today ? today.day.daily_chance_of_rain : 0;
  
  // High precipitation priority
  if (rainChance >= 70) {
    return {
      icon: <CloudRain className="text-blue-500" />,
      text: `${rainChance}% chance of rain today. Don't forget your umbrella!`
    };
  }
  
  if (condition.includes("rain") || condition.includes("drizzle") || condition.includes("shower")) {
    return {
      icon: <CloudRain className="text-blue-500" />,
      text: "It's raining! Stay dry and drive carefully."
    };
  } 
  else if (condition.includes("snow")) {
    return {
      icon: <CloudSnow className="text-blue-300" />,
      text: "Bundle up and wear waterproof footwear!"
    };
  }
  else if (temp > 85) {
    return {
      icon: <Sun className="text-yellow-500" />,
      text: "It's hot out there! Stay hydrated and wear sunscreen."
    };
  }
  else if (temp < 32) {
    return {
      icon: <CloudSnow className="text-blue-300" />,
      text: "Freezing temperatures! Wear layers and a warm coat."
    };
  }
  else if (condition.includes("wind")) {
    return {
      icon: <Wind className="text-blue-400" />,
      text: "Strong winds today. Secure any loose items outdoors."
    };
  }
  else if (condition.includes("fog") || condition.includes("mist")) {
    return {
      icon: <Cloud className="text-gray-400" />,
      text: "Low visibility conditions. Drive carefully if you're on the road."
    };
  }
  else if ((condition.includes("sun") || condition.includes("clear")) && temp > 70) {
    const rainText = rainChance > 30 ? ` ${rainChance}% chance of rain later.` : '';
    return {
      icon: <Sun className="text-yellow-500" />,
      text: `Beautiful day! Perfect for outdoor activities.${rainText}`
    };
  }
  
  const rainText = rainChance > 30 ? ` ${rainChance}% chance of rain today.` : '';
  return {
    icon: getWeatherIcon(current.condition, 24),
    text: `Enjoy your day, whatever you have planned!${rainText}`
  };
};
