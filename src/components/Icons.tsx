import type { WeatherKind } from "../lib/weather";
export function SearchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      aria-hidden="true"
    >
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m16 16 4.5 4.5" />
    </svg>
  );
}
export function PinIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      aria-hidden="true"
    >
      <path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z" />
      <circle cx="12" cy="10" r="2.3" />
    </svg>
  );
}
export function BookmarkIcon({ filled = false }: { filled?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6 3h12v18l-6-4-6 4V3Z" />
    </svg>
  );
}
export function RefreshIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 9a8 8 0 1 0-1 8M20 4v5h-5" />
    </svg>
  );
}
export function WeatherIcon({
  kind,
  night = false,
}: {
  kind: WeatherKind;
  night?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={`weather-icon weather-icon--${kind}`}
      aria-hidden="true"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {(kind === "clear" || kind === "cloudy") &&
        (night ? (
          <path
            className="icon-moon"
            d="M37 8a17 17 0 1 0 17 23A17 17 0 0 1 37 8Z"
          />
        ) : (
          <g className="icon-sun">
            <circle cx="29" cy="26" r="11" />
            <path d="M29 6v4m0 32v4M9 26h4m32 0h4M15 12l3 3m22 22 3 3M15 40l3-3m22-22 3-3" />
          </g>
        ))}
      {kind !== "clear" && (
        <path
          className="icon-cloud"
          d="M17 44a10 10 0 0 1-1-20 15 15 0 0 1 28 2 9 9 0 1 1 3 18H17Z"
        />
      )}
      {(kind === "rain" || kind === "storm") && (
        <path className="icon-rain" d="m20 51-3 5m15-5-3 5m15-5-3 5" />
      )}
      {kind === "storm" && (
        <path className="icon-lightning" d="m35 33-8 11h7l-5 8" />
      )}
      {kind === "snow" && (
        <path className="icon-snow" d="M20 50v8m-4-4h8m16-4v8m-4-4h8" />
      )}
      {kind === "fog" && <path className="icon-fog" d="M13 50h37M18 56h26" />}
    </svg>
  );
}
export function Logo() {
  return (
    <svg viewBox="0 0 48 36" aria-hidden="true" className="logo-mark">
      <path
        d="M3 10c4-5 7-5 10 0l7 15c2 4 5 4 7 0l7-15c3-5 6-5 11 0M3 21c4-5 7-5 10 0l2 4m18 0 2-4c3-5 6-5 10 0"
        fill="none"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
