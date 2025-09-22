import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Cloud, Sun, CloudRain, Wind, Droplets, Thermometer } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface WeatherData {
  temperature: number;
  humidity: number;
  windSpeed: number;
  condition: string;
  description: string;
  iconUrl?: string;
}

const WeatherWidget: React.FC = () => {
  const { t } = useTranslation('common');
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState<string>('auto:ip');
  const [mode, setMode] = useState<'ip' | 'device'>('ip');
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [locationLabel, setLocationLabel] = useState<string>('');
  const [refreshTick, setRefreshTick] = useState<number>(0);

  useEffect(() => {
    const apiKey = import.meta.env.VITE_WEATHERAPI_KEY || '9956fc95984840d2ae563035250809';
    const fetchWeather = async () => {
      try {
        setLoading(true);
        setError(null);
        const url = `https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${encodeURIComponent(query)}&aqi=no&_=${Date.now()}`;
        const res = await fetch(url, { cache: 'no-store', headers: { 'Cache-Control': 'no-store' } });
        if (!res.ok) {
          throw new Error(`WeatherAPI error: ${res.status}`);
        }
        const data = await res.json();
        const conditionText: string = data?.current?.condition?.text || 'Unknown';
        const iconUrl: string | undefined = data?.current?.condition?.icon
          ? `https:${data.current.condition.icon}`
          : undefined;
        const mappedCondition = mapConditionToKey(conditionText);
        const payload: WeatherData = {
          temperature: Math.round(data?.current?.temp_c ?? 0),
          humidity: Math.round(data?.current?.humidity ?? 0),
          windSpeed: Math.round(data?.current?.wind_kph ?? 0),
          condition: mappedCondition,
          description: conditionText,
          iconUrl,
        };
        setWeather(payload);
        const loc = data?.location;
        if (loc) {
          const parts = [loc.name, loc.region, loc.country].filter(Boolean);
          setLocationLabel(parts.join(', '));
        } else {
          setLocationLabel('');
        }
      } catch (e: any) {
        setError(e?.message || 'Failed to load weather');
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
    const interval = setInterval(fetchWeather, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, [query, refreshTick]);

  const mapConditionToKey = (text: string) => {
    const t = text.toLowerCase();
    if (t.includes('rain') || t.includes('drizzle') || t.includes('shower')) return 'rainy';
    if (t.includes('cloud')) return 'cloudy';
    if (t.includes('sun') || t.includes('clear')) return 'sunny';
    return 'partly-cloudy';
  };

  const getWeatherIcon = (condition: string) => {
    switch (condition) {
      case 'sunny':
        return <Sun className="h-8 w-8 text-yellow-500" />;
      case 'cloudy':
        return <Cloud className="h-8 w-8 text-gray-500" />;
      case 'rainy':
        return <CloudRain className="h-8 w-8 text-blue-500" />;
      case 'partly-cloudy':
        return <Cloud className="h-8 w-8 text-gray-400" />;
      default:
        return <Sun className="h-8 w-8 text-yellow-500" />;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Thermometer className="h-5 w-5" />
            {t('currentWeather')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-sm text-muted-foreground mt-2">Loading weather...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Thermometer className="h-5 w-5" />
            {t('currentWeather')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground">Unable to load weather data: {error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!weather) {
    return null;
  }

  return (
    <div className="relative">
      <div className="absolute inset-0 bg=[#131826]"></div>
      <Card className="relative border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Thermometer className="h-5 w-5 text--400" />
            <span className="bg-white bg-clip-text text-transparent">
              {t('currentWeather')}
            </span>
          </CardTitle>
        </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Main weather display */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              {weather.iconUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={weather.iconUrl} alt={weather.description} className="h-8 w-8" />
              ) : (
                getWeatherIcon(weather.condition)
              )}
              <div className="min-w-0">
                <p className="text-2xl font-bold">{weather.temperature}°C</p>
                <p className="text-sm text-muted-foreground whitespace-normal break-words">{weather.description}</p>
                {locationLabel && (
                  <p className="text-xs text-muted-foreground whitespace-normal break-words">{locationLabel}</p>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:items-end sm:justify-start sm:self-auto self-start mt-1 sm:mt-0 w-full sm:w-36">
              <button
                className="text-xs px-3 py-1 rounded-md border border-border hover:bg-muted/50 w-full"
                onClick={() => {
                  setRefreshTick((n) => n + 1);
                }}
                aria-label="Refresh weather"
                title="Refresh"
              >
                Refresh
              </button>
              <button
                className="text-xs px-3 py-1 rounded-md border border-border hover:bg-muted/50 w-full"
                onClick={() => {
                  setMode('ip');
                  setQuery('auto:ip');
                  setRefreshTick((n) => n + 1);
                }}
                aria-label="Use IP location"
                title="Use IP location"
              >
                Use IP
              </button>
              <button
                className="text-xs px-3 py-1 rounded-md border border-border hover:bg-muted/50 disabled:opacity-50 w-full"
                disabled={isLocating}
                onClick={() => {
                  if (!navigator.geolocation) {
                    setError('Geolocation not supported');
                    return;
                  }
                  setIsLocating(true);
                  navigator.geolocation.getCurrentPosition(
                    (pos) => {
                      const { latitude, longitude } = pos.coords;
                      setMode('device');
                      setQuery(`${latitude},${longitude}`);
                      setIsLocating(false);
                    },
                    (err) => {
                      setError(err.message || 'Failed to get location');
                      setIsLocating(false);
                    },
                    { enableHighAccuracy: true, timeout: 10000 }
                  );
                }}
                aria-label="Use my location"
                title="Use my location"
              >
                {isLocating ? 'Locating…' : 'Use my location'}
              </button>
            </div>
          </div>

          {/* Weather details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
              <Droplets className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-xs text-muted-foreground">{t('humidity')}</p>
                <p className="font-semibold">{weather.humidity}%</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
              <Wind className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-xs text-muted-foreground">{t('windSpeed')}</p>
                <p className="font-semibold">{weather.windSpeed} km/h</p>
              </div>
            </div>
          </div>

          {/* Farming recommendations based on weather */}
          <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
            <p className="text-xs text-blue-700 dark:text-blue-300 font-medium mb-1">
              Farm Recommendations:
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-400">
              {weather.condition === 'sunny' && 'Perfect weather for grazing. Ensure adequate water supply.'}
              {weather.condition === 'rainy' && 'Keep cattle in shelter. Check for muddy conditions.'}
              {weather.condition === 'cloudy' && 'Good weather for outdoor activities. Monitor temperature.'}
              {weather.condition === 'partly-cloudy' && 'Ideal conditions for cattle. Maintain regular schedule.'}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
    </div>
  );
};

export default WeatherWidget;