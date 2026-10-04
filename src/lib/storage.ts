import { defaultPlace, isPlace, type Place, type Unit } from "./weather";
export function savedPlaces(): Place[] {
  try {
    const data: unknown = JSON.parse(
      localStorage.getItem("weather:places") ?? "[]",
    );
    return Array.isArray(data) ? data.filter(isPlace).slice(0, 6) : [];
  } catch {
    return [];
  }
}
export function lastPlace(): Place {
  try {
    const value: unknown = JSON.parse(
      localStorage.getItem("weather:last-place") ?? "null",
    );
    return isPlace(value) ? value : defaultPlace;
  } catch {
    return defaultPlace;
  }
}
export function savedUnit(): Unit {
  try {
    return localStorage.getItem("weather:unit") === "fahrenheit"
      ? "fahrenheit"
      : "celsius";
  } catch {
    return "celsius";
  }
}
export function persist(key: string, value: unknown) {
  try {
    localStorage.setItem(`weather:${key}`, JSON.stringify(value));
  } catch {
    /* A consulta funciona mesmo com armazenamento bloqueado. */
  }
}
export function persistUnit(value: Unit) {
  try {
    localStorage.setItem("weather:unit", value);
  } catch {
    /* A preferência dura apenas nesta sessão. */
  }
}
