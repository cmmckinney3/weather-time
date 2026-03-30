import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Wind, CalendarDays } from 'lucide-react';
import { getWeatherIcon, formatTime, getShortDayName, filterHourlyData, getPrecipitationSummary } from '../utils/weatherUtils';
import PrecipitationInfo from './shared/PrecipitationInfo';

const DetailedForecast = ({ weather }) => {
    const [selectedDay, setSelectedDay] = useState(0);

    if (!weather) return null;

    const { forecast } = weather;
    
    // forecastday[0] is always today per WeatherAPI
    const relevantDays = forecast.forecastday;

    // Get selected day's data
    const dayData = relevantDays[selectedDay];
    const precipSummary = getPrecipitationSummary(dayData);

    // Get filtered hourly data (pass real day index so today filters past hours correctly)
    const filteredHours = filterHourlyData(dayData.hour, selectedDay);
    
    // Map hourly data for display
    const formattedHourlyData = filteredHours.map(hour => ({
        time: formatTime(hour.time),
        temp: hour.temp_f,
        feelsLike: hour.feelslike_f,
        condition: hour.condition.text,
        chanceOfRain: hour.chance_of_rain,
        precipAmount: hour.precip_in,
        wind: hour.wind_mph,
        humidity: hour.humidity,
        icon: hour.condition.icon
    }));

    const chartData = formattedHourlyData.map(hour => ({
        time: hour.time,
        Temperature: hour.temp,
        'Feels Like': hour.feelsLike
    }));

    return (
        <div className="bg-white rounded-xl shadow-lg p-6 max-w-4xl w-full mx-auto">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                <CalendarDays className="text-indigo-600 mr-2" />
                Detailed Forecast
            </h2>

            {/* Day selector tabs */}
            <div className="flex mb-6 overflow-x-auto">
                {relevantDays.map((day, index) => {
                    const dayName = getShortDayName(index, day.date);

                    return (
                        <button
                            key={day.date}
                            onClick={() => setSelectedDay(index)}
                            className={`px-4 py-2 mr-2 rounded-t-lg font-medium transition-colors ${selectedDay === index
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-indigo-100'
                                }`}
                        >
                            {dayName}
                        </button>
                    );
                })}
            </div>

            {/* Day summary */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                <div className="flex flex-col md:flex-row items-center justify-between">
                    <div className="flex items-center mb-4 md:mb-0">
                        <div className="mr-4">
                            {getWeatherIcon(dayData.day.condition)}
                        </div>
                        <div>
                            <p className="text-lg font-semibold text-gray-800">{dayData.day.condition.text}</p>
                            <p className="text-gray-600">
                                High: {dayData.day.maxtemp_f}°F | Low: {dayData.day.mintemp_f}°F
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center">
                            <Wind className="text-blue-500 mr-2" size={16} />
                            <div>
                                <p className="text-sm text-gray-600">Max Wind</p>
                                <p className="font-semibold">{dayData.day.maxwind_mph} mph</p>
                            </div>
                        </div>

                        <PrecipitationInfo dayData={dayData} />
                    </div>
                </div>
            </div>

            {/* Temperature chart */}
            <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Temperature Trend</h3>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="time" />
                            <YAxis unit="°F" />
                            <Tooltip />
                            <Legend />
                            <Line
                                type="monotone"
                                dataKey="Temperature"
                                stroke="#4F46E5"
                                strokeWidth={2}
                                dot={{ r: 4 }}
                                activeDot={{ r: 6 }}
                            />
                            <Line
                                type="monotone"
                                dataKey="Feels Like"
                                stroke="#EC4899"
                                strokeWidth={2}
                                dot={{ r: 4 }}
                                activeDot={{ r: 6 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Hourly forecast */}
            <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Hourly Forecast</h3>
                <div className="overflow-x-auto">
                    <div className="inline-block min-w-full">
                        <div className="shadow overflow-hidden border-b border-gray-200 rounded-lg">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Condition</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Temp</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Feels Like</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precipitation</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Wind</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Humidity</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {formattedHourlyData.map((hour, i) => (
                                        <tr key={i} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{hour.time}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 flex items-center">
                                                <img src={hour.icon} alt={hour.condition} className="w-8 h-8 mr-2" />
                                                {hour.condition}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{hour.temp}°F</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{hour.feelsLike}°F</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                <div className="flex flex-col">
                                                    <span className="text-blue-600 font-medium">{hour.chanceOfRain}%</span>
                                                    {hour.precipAmount > 0 && (
                                                        <span className="text-xs text-blue-800">{hour.precipAmount}"</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{hour.wind} mph</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{hour.humidity}%</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DetailedForecast;