import type { CSSProperties } from "react";
export default function Metric({
  label,
  value,
  unit,
  note,
  type,
  fraction = 0,
  direction = 0,
}: {
  label: string;
  value: string | number;
  unit?: string;
  note: string;
  type: "humidity" | "wind" | "rain" | "uv" | "sun";
  fraction?: number;
  direction?: number;
}) {
  return (
    <div className={`metric metric--${type}`}>
      <p>{label}</p>
      <div className="metric-visual">
        {type === "humidity" && (
          <svg
            className="humidity-ring"
            viewBox="0 0 110 110"
            aria-hidden="true"
          >
            <circle cx="55" cy="55" r="44" className="ring-track" />
            <circle
              cx="55"
              cy="55"
              r="44"
              className="ring-value"
              pathLength="100"
              strokeDasharray={`${fraction * 100} 100`}
            />
          </svg>
        )}
        {type === "wind" && (
          <svg
            className="wind-compass"
            viewBox="0 0 110 110"
            aria-hidden="true"
          >
            <circle cx="55" cy="55" r="43" />
            <text x="55" y="16">
              N
            </text>
            <text x="98" y="58">
              L
            </text>
            <text x="55" y="102">
              S
            </text>
            <text x="12" y="58">
              O
            </text>
            <g
              style={{
                transform: `rotate(${direction}deg)`,
                transformOrigin: "55px 55px",
              }}
            >
              <path className="compass-needle" d="M55 20 61 37 55 33 49 37Z" />
            </g>
          </svg>
        )}
        <strong>
          {value}
          <small>{unit}</small>
        </strong>
        {type === "rain" && (
          <div className="rain-meter" aria-hidden="true">
            {Array.from({ length: 12 }, (_, i) => (
              <i
                key={i}
                className={i / 12 < fraction ? "is-filled" : ""}
                style={{ "--drop-delay": `${i * 0.08}s` } as CSSProperties}
              />
            ))}
          </div>
        )}
        {type === "uv" && (
          <div className="uv-meter" aria-hidden="true">
            <span style={{ width: `${Math.min(1, fraction) * 100}%` }} />
          </div>
        )}
        {type === "sun" && (
          <svg className="metric-sun" viewBox="0 0 100 40" aria-hidden="true">
            <path d="M20 32a30 30 0 0 1 60 0" />
            <path d="M10 32h80" />
          </svg>
        )}
      </div>
      <span>{note}</span>
    </div>
  );
}
