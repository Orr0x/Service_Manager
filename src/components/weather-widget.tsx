'use client';

import { useEffect, useState } from 'react';
import { Sun, Cloud, CloudRain, CloudSnow, CloudLightning, Loader2 } from 'lucide-react';

export function WeatherWidget() {
    const [weather, setWeather] = useState<{ temp: number; code: number } | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        if (!navigator.geolocation) {
            setLoading(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(async (position) => {
            try {
                const { latitude, longitude } = position.coords;
                const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code&temperature_unit=fahrenheit`);
                const data = await res.json();

                if (data.current) {
                    setWeather({
                        temp: Math.round(data.current.temperature_2m),
                        code: data.current.weather_code
                    });
                }
            } catch (err) {
                console.error('Weather fetch error:', err);
                setError(true);
            } finally {
                setLoading(false);
            }
        }, (err) => {
            console.error('Geolocation error:', err);
            setLoading(false);
            // Default to generic mock if permission denied? Or show nothing/dash?
            // Let's fallback to NY/London or just "--"
        });
    }, []);

    const getWeatherIcon = (code: number) => {
        if (code <= 1) return <Sun className="h-6 w-6 text-yellow-500" />;
        if (code <= 3) return <Cloud className="h-6 w-6 text-gray-500" />;
        if (code <= 67) return <CloudRain className="h-6 w-6 text-blue-500" />;
        if (code <= 77) return <CloudSnow className="h-6 w-6 text-blue-300" />;
        if (code <= 99) return <CloudLightning className="h-6 w-6 text-purple-500" />;
        return <Sun className="h-6 w-6 text-yellow-500" />;
    };

    const getWeatherLabel = (code: number) => {
        if (code <= 1) return 'Clear';
        if (code <= 3) return 'Cloudy';
        if (code <= 67) return 'Rainy';
        if (code <= 77) return 'Snow';
        if (code <= 99) return 'Storm';
        return 'Clear';
    }

    if (loading) {
        return (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center justify-between animate-pulse">
                <div>
                    <div className="h-3 w-12 bg-gray-200 rounded mb-2"></div>
                    <div className="h-8 w-16 bg-gray-200 rounded"></div>
                </div>
                <div className="bg-gray-100 p-3 rounded-full h-12 w-12"></div>
            </div>
        );
    }

    if (error || !weather) {
        // Fallback UI or empty
        return (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center justify-between">
                <div>
                    <p className="text-gray-500 text-xs font-medium uppercase tracking-wide mb-1">Weather</p>
                    <h3 className="text-2xl font-bold text-gray-900">--°</h3>
                    <p className="text-xs text-gray-400 font-medium">Unavailable</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-full">
                    <Cloud className="h-6 w-6 text-gray-400" />
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center justify-between transition-all hover:border-blue-200">
            <div>
                <p className="text-gray-500 text-xs font-medium uppercase tracking-wide mb-1">Weather</p>
                <h3 className="text-2xl font-bold text-gray-900">{weather.temp}°F</h3>
                <p className="text-xs text-gray-400 font-medium">{getWeatherLabel(weather.code)}</p>
            </div>
            <div className={`p-3 rounded-full ${weather.code <= 1 ? 'bg-yellow-50' : 'bg-gray-50'}`}>
                {getWeatherIcon(weather.code)}
            </div>
        </div>
    );
}
