import { NextResponse } from 'next/server';

type WeatherSuccessResponse = {
  success: true;
  weather: {
    cityName: string;
    country: string;
    temperatureC: number;
    feelsLikeC: number;
    humidityPercent: number;
    windSpeedKmh: number;
    description: string;
    icon: string;
  };
};

function wmoToOpenWeatherIcon(code: number): string {
  // UI uses OpenWeather icon codes to render images.
  if (code === 0) return '01d'; // clear sky
  if (code === 1) return '02d'; // mainly clear
  if (code === 2) return '03d'; // partly cloudy
  if (code === 3) return '04d'; // overcast
  if (code === 45 || code === 48) return '50d'; // fog
  if (code >= 51 && code <= 57) return '09d'; // drizzle
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return '10d'; // rain/showers
  if (code >= 71 && code <= 77) return '13d'; // snow
  if (code >= 95 && code <= 99) return '11d'; // thunderstorm
  return '03d';
}

function wmoToDescription(code: number): string {
  if (code === 0) return 'clear sky';
  if (code === 1) return 'mostly clear';
  if (code === 2) return 'partly cloudy';
  if (code === 3) return 'overcast';
  if (code === 45 || code === 48) return 'fog';
  if (code >= 51 && code <= 57) return 'drizzle';
  if (code >= 61 && code <= 67) return 'rain';
  if (code >= 71 && code <= 77) return 'snow';
  if (code >= 80 && code <= 82) return 'rain showers';
  if (code >= 95 && code <= 99) return 'thunderstorm';
  return 'cloudy';
}

async function fetchFromOpenWeather(city: string, apiKey: string): Promise<WeatherSuccessResponse> {
  const baseUrl = 'https://api.openweathermap.org/data/2.5/weather';
  const apiUrl = `${baseUrl}?q=${encodeURIComponent(city)}&units=metric&appid=${apiKey}`;

  const response = await fetch(apiUrl, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    cache: 'no-cache',
  });

  const data = await response.json();

  if (!response.ok) {
    const message = data?.message || `Weather service error: ${response.status}`;
    const error = new Error(message) as Error & { status?: number };
    error.status = response.status;
    throw error;
  }

  return {
    success: true,
    weather: {
      cityName: data.name,
      country: data.sys.country,
      temperatureC: Math.round(data.main.temp),
      feelsLikeC: Math.round(data.main.feels_like),
      humidityPercent: data.main.humidity,
      windSpeedKmh: Math.round(data.wind.speed * 3.6),
      description: data.weather[0].description,
      icon: data.weather[0].icon,
    },
  };
}

async function fetchFromOpenMeteo(city: string): Promise<WeatherSuccessResponse> {
  const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;
  const geoRes = await fetch(geoUrl, { headers: { Accept: 'application/json' }, cache: 'no-cache' });
  const geo = await geoRes.json();

  const first = geo?.results?.[0];
  if (!geoRes.ok || !first) {
    throw new Error('City not found');
  }

  const latitude = first.latitude as number;
  const longitude = first.longitude as number;

  const forecastUrl =
    `https://api.open-meteo.com/v1/forecast?latitude=${encodeURIComponent(String(latitude))}` +
    `&longitude=${encodeURIComponent(String(longitude))}` +
    `&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m` +
    `&timezone=auto`;

  const forecastRes = await fetch(forecastUrl, { headers: { Accept: 'application/json' }, cache: 'no-cache' });
  const forecast = await forecastRes.json();

  const current = forecast?.current;
  if (!forecastRes.ok || !current) {
    throw new Error('Failed to fetch weather data');
  }

  const wmoCode = Number(current.weather_code ?? 0);

  return {
    success: true,
    weather: {
      cityName: first.name,
      country: first.country_code ?? '',
      temperatureC: Math.round(Number(current.temperature_2m)),
      feelsLikeC: Math.round(Number(current.apparent_temperature)),
      humidityPercent: Math.round(Number(current.relative_humidity_2m)),
      windSpeedKmh: Math.round(Number(current.wind_speed_10m)),
      description: wmoToDescription(wmoCode),
      icon: wmoToOpenWeatherIcon(wmoCode),
    },
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const city = searchParams.get('city');

  if (!city) {
    return NextResponse.json(
      { success: false, error: 'City parameter is required' },
      { status: 400 }
    );
  }

  try {
    const apiKey = process.env.OPENWEATHER_API_KEY?.replace(/\$/g, '').trim();

    // Prefer OpenWeather when a key is configured; fall back to Open-Meteo (no key)
    // so the app runs out-of-the-box.
    if (apiKey) {
      try {
        const weatherData = await fetchFromOpenWeather(city, apiKey);
        return NextResponse.json(weatherData);
      } catch (err) {
        const status = (err as { status?: number } | null)?.status;
        if (status === 401) {
          const weatherData = await fetchFromOpenMeteo(city);
          return NextResponse.json(weatherData);
        }
        throw err;
      }
    }

    const weatherData = await fetchFromOpenMeteo(city);
    return NextResponse.json(weatherData);

  } catch (error) {
    console.error('Weather API error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch weather data'
      },
      { status: 500 }
    );
  }
}