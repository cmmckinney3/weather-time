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
 * Get short day name for tabs
 * @param {number} index - Day index
 * @param {string} dateStr - Date string from API
 * @returns {string} - Short day name
 */
export const getShortDayName = (index, dateStr) => {
  if (index === 0) return 'Today';
  if (index === 1) return 'Tomorrow';
  // Append T12:00:00 to parse as local noon, avoiding UTC-offset date shift
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'short',
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
export const filterHourlyData = (hourlyData, dayIndex) => {
  if (dayIndex !== 0) return hourlyData;
  
  const currentHour = new Date().getHours();
  return hourlyData.filter(hour => new Date(hour.time).getHours() >= currentHour);
};

/**
 * Get precipitation summary for a day
 * @param {Object} dayData - Day forecast data from API
 * @returns {Object} - Precipitation summary
 */
export const getPrecipitationSummary = (dayData) => {
  return {
    chanceOfRain: dayData.day.daily_chance_of_rain,
    willItRain: dayData.day.daily_will_it_rain,
    totalPrecip: dayData.day.totalprecip_in,
    chanceOfSnow: dayData.day.daily_chance_of_snow,
    willItSnow: dayData.day.daily_will_it_snow,
    maxChanceToday: Math.max(...dayData.hour.map(h => h.chance_of_rain))
  };
};

/**
 * Get precipitation intensity level
 * @param {number} chanceOfRain - Percentage chance of rain
 * @returns {Object} - Intensity info with color and label
 */
export const getPrecipitationIntensity = (chanceOfRain) => {
  if (chanceOfRain >= 80) {
    return { level: 'very-high', color: 'text-blue-700', bg: 'bg-blue-100', label: 'Very High' };
  }
  if (chanceOfRain >= 60) {
    return { level: 'high', color: 'text-blue-600', bg: 'bg-blue-50', label: 'High' };
  }
  if (chanceOfRain >= 30) {
    return { level: 'moderate', color: 'text-blue-500', bg: 'bg-blue-50', label: 'Moderate' };
  }
  if (chanceOfRain > 0) {
    return { level: 'low', color: 'text-blue-400', bg: 'bg-gray-50', label: 'Low' };
  }
  return { level: 'none', color: 'text-gray-400', bg: 'bg-gray-50', label: 'None' };
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