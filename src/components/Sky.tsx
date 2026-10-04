import { useId } from "react";
import type { WeatherKind } from "../lib/weather";
export default function Sky({
  kind,
  isDay,
}: {
  kind: WeatherKind;
  isDay: boolean;
}) {
  const gradient = useId();
  return (
    <div
      className={`sky sky--${kind} ${isDay ? "sky--day" : "sky--night"}`}
      aria-hidden="true"
    >
      <div className="sky-glow" />
      <svg className="sky-orb" viewBox="0 0 300 300">
        <defs>
          <radialGradient id={gradient}>
            <stop stopColor={isDay ? "#fffbdc" : "#fafbff"} />
            <stop offset="1" stopColor={isDay ? "#f5e6aa" : "#d9deef"} />
          </radialGradient>
        </defs>
        <circle cx="150" cy="150" r="96" fill={`url(#${gradient})`} />
        {!isDay && (
          <>
            <circle cx="128" cy="117" r="13" fill="#cbd0e4" opacity=".45" />
            <circle cx="177" cy="179" r="20" fill="#cbd0e4" opacity=".3" />
            <circle cx="166" cy="109" r="6" fill="#cbd0e4" opacity=".35" />
          </>
        )}
      </svg>
      <svg className="sky-cloud sky-cloud--back" viewBox="0 0 700 300">
        <path
          d="M70 275C-20 250-10 130 80 125 65 15 230-10 260 95c75-75 195-30 205 65 120-30 180 115 65 120Z"
          fill="currentColor"
        />
      </svg>
      <svg className="sky-cloud sky-cloud--front" viewBox="0 0 700 300">
        <path
          d="M60 275C-10 230 15 145 95 150 105 42 258 12 303 117c75-45 173 0 178 79 120-10 151 90 46 90Z"
          fill="currentColor"
        />
      </svg>
      {!isDay && (
        <div className="sky-stars">
          {Array.from({ length: 14 }, (_, i) => (
            <i
              key={i}
              style={{
                left: `${8 + ((i * 37) % 87)}%`,
                top: `${4 + ((i * 19) % 45)}%`,
                animationDelay: `${i * 0.3}s`,
              }}
            />
          ))}
        </div>
      )}
      {(kind === "rain" || kind === "storm") && (
        <div className="sky-rain">
          {Array.from({ length: 24 }, (_, i) => (
            <i
              key={i}
              style={{
                left: `${(i * 17) % 100}%`,
                animationDelay: `${i * 0.13}s`,
                animationDuration: `${1.2 + (i % 3) * 0.2}s`,
              }}
            />
          ))}
        </div>
      )}
      {kind === "snow" && (
        <div className="sky-snow">
          {Array.from({ length: 18 }, (_, i) => (
            <i
              key={i}
              style={{
                left: `${(i * 23) % 100}%`,
                animationDelay: `${i * 0.3}s`,
              }}
            />
          ))}
        </div>
      )}
      <div className="sky-horizon" />
    </div>
  );
}
