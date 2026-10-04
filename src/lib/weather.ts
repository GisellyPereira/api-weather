export type WeatherKind =
  "clear" | "cloudy" | "fog" | "rain" | "snow" | "storm";
export type Unit = "celsius" | "fahrenheit";
export interface Place {
  id: number | string;
  name: string;
  region: string;
  country: string;
  latitude: number;
  longitude: number;
}
export interface CurrentWeather {
  time: string;
  temperature: number;
  apparent: number;
  humidity: number;
  code: number;
  isDay: boolean;
  wind: number;
  direction: number;
}
export interface HourWeather {
  time: string;
  temperature: number;
  rain: number;
  code: number;
  isDay: boolean;
}
export interface DayWeather {
  date: string;
  code: number;
  min: number;
  max: number;
  rain: number;
  sunrise: string;
  sunset: string;
  uv: number;
}
export interface Forecast {
  current: CurrentWeather;
  hours: HourWeather[];
  days: DayWeather[];
  timezone: string;
}

export const defaultPlace: Place = {
  id: 3388368,
  name: "São Luís",
  region: "Maranhão",
  country: "Brasil",
  latitude: -2.5297,
  longitude: -44.3028,
};
export const suggestedPlaces: Place[] = [
  defaultPlace,
  {
    id: 3448439,
    name: "São Paulo",
    region: "São Paulo",
    country: "Brasil",
    latitude: -23.5475,
    longitude: -46.6361,
  },
  {
    id: 3451190,
    name: "Rio de Janeiro",
    region: "Rio de Janeiro",
    country: "Brasil",
    latitude: -22.9068,
    longitude: -43.1729,
  },
  {
    id: 2988507,
    name: "Paris",
    region: "Île-de-France",
    country: "França",
    latitude: 48.8534,
    longitude: 2.3488,
  },
];
export function weatherInfo(
  code: number,
  isDay = true,
): { label: string; kind: WeatherKind } {
  if (code === 0) return { label: "Céu limpo", kind: "clear" };
  if (code === 1 || code === 2)
    return {
      label: isDay ? "Sol entre nuvens" : "Parcialmente nublado",
      kind: "cloudy",
    };
  if (code === 3) return { label: "Céu nublado", kind: "cloudy" };
  if (code === 45 || code === 48) return { label: "Névoa", kind: "fog" };
  if ([51, 53, 55, 56, 57].includes(code))
    return { label: "Garoa", kind: "rain" };
  if ([61, 63, 65, 66, 67].includes(code))
    return { label: "Chuva", kind: "rain" };
  if ([80, 81, 82].includes(code))
    return { label: "Pancadas de chuva", kind: "rain" };
  if ([71, 73, 75, 77, 85, 86].includes(code))
    return { label: "Neve", kind: "snow" };
  if ([95, 96, 99].includes(code)) return { label: "Trovoadas", kind: "storm" };
  return { label: "Condições variáveis", kind: "cloudy" };
}
export function temperature(value: number, unit: Unit) {
  return Math.round(unit === "fahrenheit" ? (value * 9) / 5 + 32 : value);
}
export function windDirection(degrees: number) {
  return ["N", "NE", "L", "SE", "S", "SO", "O", "NO"][
    Math.round(degrees / 45) % 8
  ];
}
export function dateLabel(date: string, options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat("pt-BR", {
    ...options,
    timeZone: "UTC",
  }).format(new Date(`${date.slice(0, 10)}T12:00:00Z`));
}
export function hourLabel(time: string) {
  return time.slice(11, 16);
}
export function hourlySelection(
  forecast: Forecast,
  day: string,
): HourWeather[] {
  if (day === forecast.current.time.slice(0, 10))
    return forecast.hours
      .filter((hour) => hour.time >= `${forecast.current.time.slice(0, 13)}:00`)
      .slice(0, 24);
  return forecast.hours
    .filter((hour) => hour.time.startsWith(day))
    .slice(0, 24);
}

type ApiRecord = Record<string, unknown>;
function record(value: unknown): ApiRecord {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Dados meteorológicos indisponíveis. Tente novamente.");
  return value as ApiRecord;
}
function number(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value))
    throw new Error("A previsão chegou incompleta. Tente atualizar.");
  return value;
}
function string(value: unknown) {
  if (typeof value !== "string")
    throw new Error("A previsão chegou incompleta. Tente atualizar.");
  return value;
}
function values(data: ApiRecord, name: string) {
  if (!Array.isArray(data[name]))
    throw new Error("A previsão chegou incompleta. Tente atualizar.");
  return data[name] as unknown[];
}
export function parseForecast(payload: unknown): Forecast {
  const data = record(payload),
    current = record(data.current),
    hourly = record(data.hourly),
    daily = record(data.daily);
  const at = (group: ApiRecord, key: string, index: number) =>
    values(group, key)[index];
  return {
    timezone: string(data.timezone),
    current: {
      time: string(current.time),
      temperature: number(current.temperature_2m),
      apparent: number(current.apparent_temperature),
      humidity: number(current.relative_humidity_2m),
      code: number(current.weather_code),
      isDay: number(current.is_day) === 1,
      wind: number(current.wind_speed_10m),
      direction: number(current.wind_direction_10m),
    },
    hours: values(hourly, "time").map((time, i) => ({
      time: string(time),
      temperature: number(at(hourly, "temperature_2m", i)),
      rain: number(at(hourly, "precipitation_probability", i)),
      code: number(at(hourly, "weather_code", i)),
      isDay: number(at(hourly, "is_day", i)) === 1,
    })),
    days: values(daily, "time").map((date, i) => ({
      date: string(date),
      code: number(at(daily, "weather_code", i)),
      min: number(at(daily, "temperature_2m_min", i)),
      max: number(at(daily, "temperature_2m_max", i)),
      rain: number(at(daily, "precipitation_probability_max", i)),
      sunrise: string(at(daily, "sunrise", i)),
      sunset: string(at(daily, "sunset", i)),
      uv: number(at(daily, "uv_index_max", i)),
    })),
  };
}
async function request(url: string, signal?: AbortSignal) {
  let response: Response;
  try {
    const timeout = AbortSignal.timeout(15_000);
    response = await fetch(url, {
      signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
    });
  } catch (error) {
    if (signal?.aborted) throw error;
    throw new Error(
      error instanceof DOMException && error.name === "TimeoutError"
        ? "A consulta demorou mais que o esperado. Tente novamente."
        : "Não foi possível conectar. Confira sua internet e tente novamente.",
      { cause: error },
    );
  }
  if (!response.ok)
    throw new Error(
      response.status === 429
        ? "Muitas consultas em pouco tempo. Aguarde um instante e tente de novo."
        : "Não conseguimos consultar o tempo agora. Tente novamente em instantes.",
    );
  return response.json() as Promise<unknown>;
}
const forecastCache = new Map<string, { data: Forecast; at: number }>();
export async function getForecast(
  place: Place,
  signal?: AbortSignal,
  refresh = false,
): Promise<Forecast> {
  const key = `${place.latitude},${place.longitude}`,
    cached = forecastCache.get(key);
  if (!refresh && cached && Date.now() - cached.at < 600_000)
    return cached.data;
  const query = new URLSearchParams({
    latitude: String(place.latitude),
    longitude: String(place.longitude),
    timezone: "auto",
    forecast_days: "7",
    current:
      "temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m,wind_direction_10m",
    hourly: "temperature_2m,precipitation_probability,weather_code,is_day",
    daily:
      "weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,precipitation_probability_max",
  });
  const data = parseForecast(
    await request(`https://api.open-meteo.com/v1/forecast?${query}`, signal),
  );
  forecastCache.set(key, { data, at: Date.now() });
  return data;
}
export async function searchPlaces(
  query: string,
  signal?: AbortSignal,
): Promise<Place[]> {
  const params = new URLSearchParams({
    name: query.trim(),
    count: "6",
    language: "pt",
    format: "json",
  });
  const data = record(
    await request(
      `https://geocoding-api.open-meteo.com/v1/search?${params}`,
      signal,
    ),
  );
  if (!Array.isArray(data.results)) return [];
  return data.results.map((value) => {
    const place = record(value);
    return {
      id: number(place.id),
      name: string(place.name),
      region: typeof place.admin1 === "string" ? place.admin1 : "",
      country: typeof place.country === "string" ? place.country : "",
      latitude: number(place.latitude),
      longitude: number(place.longitude),
    };
  });
}
export function isPlace(value: unknown): value is Place {
  if (!value || typeof value !== "object") return false;
  const place = value as Partial<Place>;
  return (
    (typeof place.id === "string" || typeof place.id === "number") &&
    typeof place.name === "string" &&
    typeof place.region === "string" &&
    typeof place.country === "string" &&
    typeof place.latitude === "number" &&
    Number.isFinite(place.latitude) &&
    Math.abs(place.latitude) <= 90 &&
    typeof place.longitude === "number" &&
    Number.isFinite(place.longitude) &&
    Math.abs(place.longitude) <= 180
  );
}
