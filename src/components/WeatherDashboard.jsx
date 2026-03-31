import React, { useState } from 'react';
import { Droplets, ThermometerSun, ThermometerSnowflake, Calendar, MapPin, Clock, X, ChevronRight, Wind, Cloud } from 'lucide-react';
import { getWeatherIcon, formatTime, getDayName, filterHourlyData } from '../utils/weatherUtils';
import PrecipitationInfo, { HourlyPrecipIndicator } from './shared/PrecipitationInfo';

const WeatherDashboard = ({ weather, tempUnit = "F" }) => {
    const [expandedDay, setExpandedDay] = useState(null);

    if (!weather) return null;

    const { location, current, forecast } = weather;

    // Handle card click to expand/collapse
    const toggleExpand = (index) => {
        if (expandedDay === index) {
            setExpandedDay(null); // Collapse if already expanded
        } else {
            setExpandedDay(index); // Expand the clicked card
        }
    };

    // Get hourly data - for today, only show current hour onward
    const getHourlyData = (dayIndex) => {
        const day = forecast.forecastday[dayIndex];
        if (!day) return [];

        const filteredHours = filterHourlyData(day.hour, dayIndex);

        return filteredHours.map(hour => ({
            time: formatTime(hour.time),
            temp: tempUnit === "F" ? hour.temp_f : hour.temp_c,
            feelsLike: tempUnit === "F" ? hour.feelslike_f : hour.feelslike_c,
            condition: hour.condition.text,
            icon: hour.condition.icon,
            chanceOfRain: hour.chance_of_rain,
            precip_in: hour.precip_in,
            wind: hour.wind_mph,
            humidity: hour.humidity,
            visibility: hour.vis_miles,
            hourData: hour // Keep full hour data for components
        }));
    };

    return (
        <div className="bg-white rounded-xl shadow-lg p-6 max-w-4xl w-full mx-auto">
            {/* Header with location */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                    <MapPin className="text-indigo-600 mr-2" />
                    <h1 className="text-2xl font-bold text-gray-800">
                        {location.name}, {location.region && `${location.region}, `}{location.country}
                    </h1>
                </div>
                <div className="flex items-center text-gray-600">
                    <Clock className="mr-2" size={18} />
                    <span className="text-sm">Last updated: {current.last_updated}</span>
                </div>
            </div>

            {/* Current weather */}
            <div className="bg-gray-50 rounded-lg border border-gray-200 p-6 mb-6">
                <div className="flex flex-col md:flex-row items-center justify-between">
                    <div className="flex items-center mb-4 md:mb-0">
                        <div className="mr-4">
                            {getWeatherIcon(current.condition)}
                        </div>
                        <div>
                            <h2 className="text-5xl font-bold text-gray-800">
                            {tempUnit === "F" ? `${current.temp_f}°F` : `${current.temp_c}°C`}
                        </h2>
                            <p className="text-lg text-gray-600">{current.condition.text}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center">
                            <ThermometerSun className="text-orange-500 mr-2" />
                            <div>
                                <p className="text-sm text-gray-600">Feels like</p>
                                <p className="font-semibold">
                            {tempUnit === "F" ? `${current.feelslike_f}°F` : `${current.feelslike_c}°C`}
                        </p>
                            </div>
                        </div>

                        <div className="flex items-center">
                            <Wind className="text-blue-500 mr-2" />
                            <div>
                                <p className="text-sm text-gray-600">Wind</p>
                                <p className="font-semibold">{current.wind_mph} mph</p>
                            </div>
                        </div>

                        <div className="flex items-center">
                            <Droplets className="text-blue-400 mr-2" />
                            <div>
                                <p className="text-sm text-gray-600">Humidity</p>
                                <p className="font-semibold">{current.humidity}%</p>
                            </div>
                        </div>

                        <div className="flex items-center">
                            <Cloud className="text-gray-500 mr-2" />
                            <div>
                                <p className="text-sm text-gray-600">Cloud</p>
                                <p className="font-semibold">{current.cloud}%</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Forecast */}
            <div>
                <div className="flex items-center mb-4">
                    <Calendar className="text-indigo-600 mr-2" />
                    <h2 className="text-xl font-bold text-gray-800">3-Day Forecast</h2>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    {forecast.forecastday.map((day, index) => {
                        const dayName = getDayName(index, day.date);
                        const isExpanded = expandedDay === index;
                        const hourlyData = isExpanded ? getHourlyData(index) : [];
                        return (
                            <div
                                key={day.date}
                                className={`bg-gray-50 border border-gray-200 rounded-lg transition-all duration-300 ${isExpanded ? '' : 'hover:shadow-md'}`}
                            >
                                {/* Card header - always visible */}
                                <div
                                    className="p-4 cursor-pointer flex justify-between items-center"
                                    onClick={() => toggleExpand(index)}
                                >
                                    <div className="flex items-center">
                                        <div className="mr-3">
                                            {getWeatherIcon(day.day.condition)}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-800 text-lg">
                                                {dayName}
                                            </p>
                                            <p className="text-gray-700">{day.day.condition.text}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center space-x-4">
                                        {/* Precipitation info */}
                                        <PrecipitationInfo dayData={day} className="hidden md:block" />
                                        
                                        {/* Temperature */}
                                        <div className="text-right">
                                            <div className="flex items-center justify-end">
                                                <ThermometerSun className="text-orange-500 mr-1" size={16} />
                                                <span className="font-semibold">
                                                {tempUnit === "F" ? `${day.day.maxtemp_f}°` : `${day.day.maxtemp_c}°`}
                                            </span>
                                            </div>
                                            <div className="flex items-center justify-end mt-1">
                                                <ThermometerSnowflake className="text-blue-500 mr-1" size={16} />
                                                <span className="font-semibold">
                                                {tempUnit === "F" ? `${day.day.mintemp_f}°` : `${day.day.mintemp_c}°`}
                                            </span>
                                            </div>
                                        </div>

                                        {isExpanded ? (
                                            <X size={18} className="text-gray-400" />
                                        ) : (
                                            <ChevronRight size={18} className="text-gray-400" />
                                        )}
                                    </div>
                                </div>

                                {/* Expanded content */}
                                {isExpanded && (
                                    <div className="p-4 border-t border-gray-100">
                                        {/* Detailed day info */}
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                            <div className="bg-white border border-gray-200 p-3 rounded-lg">
                                                <h4 className="font-medium text-gray-700 mb-2">Conditions</h4>
                                                <ul className="space-y-2">
                                                    <li className="flex justify-between">
                                                        <span className="text-gray-600">Avg Temperature:</span>
                                                        <span className="font-medium">
                                                        {tempUnit === "F" ? `${day.day.avgtemp_f}°F` : `${day.day.avgtemp_c}°C`}
                                                    </span>
                                                    </li>
                                                    <li className="flex justify-between">
                                                        <span className="text-gray-600">Avg Humidity:</span>
                                                        <span className="font-medium">{day.day.avghumidity}%</span>
                                                    </li>
                                                    <li className="flex justify-between">
                                                        <span className="text-gray-600">Total Precipitation:</span>
                                                        <span className="font-medium">{day.day.totalprecip_in} in</span>
                                                    </li>
                                                </ul>
                                            </div>

                                            <div className="bg-white border border-gray-200 p-3 rounded-lg">
                                                <h4 className="font-medium text-gray-700 mb-2">Wind & Visibility</h4>
                                                <ul className="space-y-2">
                                                    <li className="flex justify-between">
                                                        <span className="text-gray-600">Max Wind:</span>
                                                        <span className="font-medium">{day.day.maxwind_mph} mph</span>
                                                    </li>
                                                    <li className="flex justify-between">
                                                        <span className="text-gray-600">Avg Visibility:</span>
                                                        <span className="font-medium">{day.day.avgvis_miles} miles</span>
                                                    </li>
                                                    <li className="flex justify-between">
                                                        <span className="text-gray-600">UV Index:</span>
                                                        <span className="font-medium">{day.day.uv}</span>
                                                    </li>
                                                </ul>
                                            </div>

                                            <div className="bg-white border border-gray-200 p-3 rounded-lg">
                                                <h4 className="font-medium text-gray-700 mb-2">Precipitation</h4>
                                                <ul className="space-y-2">
                                                    <li className="flex justify-between">
                                                        <span className="text-gray-600">Chance of Rain:</span>
                                                        <span className="font-medium">{day.day.daily_chance_of_rain}%</span>
                                                    </li>
                                                    <li className="flex justify-between">
                                                        <span className="text-gray-600">Chance of Snow:</span>
                                                        <span className="font-medium">{day.day.daily_chance_of_snow}%</span>
                                                    </li>
                                                    <li className="flex justify-between">
                                                        <span className="text-gray-600">Will it Rain:</span>
                                                        <span className="font-medium">{day.day.daily_will_it_rain ? 'Yes' : 'No'}</span>
                                                    </li>
                                                </ul>
                                            </div>
                                        </div>

                                        {/* Astro info */}
                                        <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg mb-6">
                                            <h4 className="font-medium text-gray-700 mb-2">Sunrise/set Moonrise/set</h4>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                <div>
                                                    <p className="text-gray-600 text-sm">Sunrise</p>
                                                    <p className="font-medium">{day.astro.sunrise}</p>
                                                </div>
                                                <div>
                                                    <p className="text-gray-600 text-sm">Sunset</p>
                                                    <p className="font-medium">{day.astro.sunset}</p>
                                                </div>
                                                <div>
                                                    <p className="text-gray-600 text-sm">Moonrise</p>
                                                    <p className="font-medium">{day.astro.moonrise}</p>
                                                </div>
                                                <div>
                                                    <p className="text-gray-600 text-sm">Moonset</p>
                                                    <p className="font-medium">{day.astro.moonset}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Hourly forecast */}
                                        <h4 className="font-medium text-gray-700 mb-2">Hourly Forecast</h4>
                                        <div className="overflow-x-auto">
                                            <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                                                <thead className="bg-gray-50">
                                                    <tr>
                                                        <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                                                        <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Condition</th>
                                                        <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Temp</th>
                                                        <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rain</th>
                                                        <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Wind</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-200">
                                                    {hourlyData.map((hour, i) => (
                                                        <tr key={i} className="hover:bg-gray-50">
                                                            <td className="py-2 px-3 whitespace-nowrap text-sm font-medium text-gray-900">{hour.time}</td>
                                                            <td className="py-2 px-3 whitespace-nowrap text-sm text-gray-500 flex items-center">
                                                                <img src={hour.icon} alt={hour.condition} className="w-6 h-6 mr-2" />
                                                                <span className="hidden md:inline">{hour.condition}</span>
                                                            </td>
                                                            <td className="py-2 px-3 whitespace-nowrap text-sm text-gray-500">
                                                            {hour.temp}°{tempUnit}
                                                        </td>
                                                            <td className="py-2 px-3 whitespace-nowrap text-sm text-gray-500">
                                                                <HourlyPrecipIndicator hour={hour.hourData} compact={true} />
                                                            </td>
                                                            <td className="py-2 px-3 whitespace-nowrap text-sm text-gray-500">{hour.wind} mph</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default WeatherDashboard;