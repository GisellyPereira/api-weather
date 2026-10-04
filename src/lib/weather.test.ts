import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getForecast,
  hourlySelection,
  isPlace,
  parseForecast,
  searchPlaces,
  temperature,
  weatherInfo,
  windDirection,
  type Forecast,
} from "./weather";
const payload = {
  timezone: "America/Fortaleza",
  current: {
    time: "2026-10-03T23:15",
    temperature_2m: 28,
    apparent_temperature: 31,
    relative_humidity_2m: 75,
    weather_code: 2,
    is_day: 0,
    wind_speed_10m: 12,
    wind_direction_10m: 90,
  },
  hourly: {
    time: ["2026-10-03T22:00", "2026-10-03T23:00", "2026-10-04T00:00"],
    temperature_2m: [27, 26, 25],
    precipitation_probability: [20, 25, 35],
    weather_code: [2, 3, 61],
    is_day: [0, 0, 0],
  },
  daily: {
    time: ["2026-10-03", "2026-10-04"],
    weather_code: [2, 61],
    temperature_2m_max: [31, 30],
    temperature_2m_min: [25, 24],
    precipitation_probability_max: [25, 35],
    sunrise: ["2026-10-03T05:40", "2026-10-04T05:40"],
    sunset: ["2026-10-03T17:50", "2026-10-04T17:50"],
    uv_index_max: [8, 7],
  },
};
afterEach(() => vi.unstubAllGlobals());
describe("forecast data", () => {
  it("preserves local time and maps all data from the provider", () => {
    const forecast = parseForecast(payload);
    expect(forecast.current.isDay).toBe(false);
    expect(forecast.current.temperature).toBe(28);
    expect(forecast.days[1].rain).toBe(35);
    expect(forecast.hours[2].code).toBe(61);
  });
  it("rejects missing or null weather values rather than displaying invented numbers", () => {
    expect(() =>
      parseForecast({
        ...payload,
        current: { ...payload.current, temperature_2m: null },
      }),
    ).toThrow();
    expect(() => parseForecast({})).toThrow();
  });
  it("shows future hours across midnight and the chosen day separately", () => {
    const forecast: Forecast = parseForecast(payload);
    expect(hourlySelection(forecast, "2026-10-03").map((h) => h.time)).toEqual([
      "2026-10-03T23:00",
      "2026-10-04T00:00",
    ]);
    expect(hourlySelection(forecast, "2026-10-04")).toHaveLength(1);
  });
  it("converts units correctly, including freezing temperatures", () => {
    expect(temperature(0, "fahrenheit")).toBe(32);
    expect(temperature(-40, "fahrenheit")).toBe(-40);
    expect(temperature(29.6, "celsius")).toBe(30);
  });
  it("maps day types and wraps the wind compass correctly", () => {
    expect(weatherInfo(99).kind).toBe("storm");
    expect(weatherInfo(85).kind).toBe("snow");
    expect(weatherInfo(65).kind).toBe("rain");
    expect(windDirection(360)).toBe("N");
    expect(windDirection(90)).toBe("L");
  });
  it("validates stored places before making requests", () => {
    expect(
      isPlace({
        id: 1,
        name: "Cidade",
        region: "",
        country: "",
        latitude: 200,
        longitude: 0,
      }),
    ).toBe(false);
    expect(isPlace(null)).toBe(false);
  });
});
describe("API integration", () => {
  it("encodes accents and never assumes a missing city result", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValue({ ok: true, json: async () => ({}) });
    vi.stubGlobal("fetch", fetch);
    expect(await searchPlaces("São Luís")).toEqual([]);
    expect(new URL(fetch.mock.calls[0][0]).searchParams.get("name")).toBe(
      "São Luís",
    );
  });
  it("reports network failures in Portuguese", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new TypeError("Failed to fetch")),
    );
    await expect(searchPlaces("Paris")).rejects.toThrow("Confira sua internet");
  });
  it("surfaces rate limits as a recoverable error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 429 }),
    );
    await expect(searchPlaces("Paris")).rejects.toThrow("Muitas consultas");
  });
  it("requests local time and caches forecasts for the same coordinates", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValue({ ok: true, json: async () => payload });
    vi.stubGlobal("fetch", fetch);
    const place = {
      id: "test",
      name: "Cidade teste",
      region: "",
      country: "",
      latitude: 10,
      longitude: 20,
    };
    await getForecast(place);
    await getForecast(place);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(new URL(fetch.mock.calls[0][0]).searchParams.get("timezone")).toBe(
      "auto",
    );
    await getForecast(place, undefined, true);
    expect(fetch).toHaveBeenCalledTimes(2);
  });
});
