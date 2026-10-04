import { useState } from "react";
import {
  hourLabel,
  temperature,
  weatherInfo,
  type HourWeather,
  type Unit,
} from "../lib/weather";
import { WeatherIcon } from "./Icons";
export default function HourlyChart({
  hours,
  unit,
}: {
  hours: HourWeather[];
  unit: Unit;
}) {
  const [active, setActive] = useState<number | null>(null);
  if (!hours.length)
    return <p>Previsão por hora indisponível para este dia.</p>;
  const min = Math.min(...hours.map((h) => h.temperature)) - 2,
    max = Math.max(...hours.map((h) => h.temperature)) + 2;
  const points = hours.map((hour, index) => ({
    x: 24 + index * 66,
    y: 100 - ((hour.temperature - min) / (max - min)) * 66,
  }));
  const width = Math.max(320, 48 + (hours.length - 1) * 66);
  const path = points
    .map((point, i) => `${i === 0 ? "M" : "L"}${point.x},${point.y}`)
    .join(" ");
  const selected = active === null ? null : hours[active];
  return (
    <div
      className="hourly-scroll"
      aria-label="Previsão por hora; deslize para ver mais"
    >
      <div className="hourly-chart" style={{ width }}>
        <svg
          className="temperature-curve"
          viewBox={`0 0 ${width} 124`}
          aria-hidden="true"
        >
          <path
            className="curve-fill"
            d={`${path} L${points[points.length - 1].x},124 L24,124Z`}
          />
          <path className="curve-line" d={path} />
          {points.map((point, i) => (
            <circle
              key={hours[i].time}
              cx={point.x}
              cy={point.y}
              r={active === i ? 5 : 2.7}
              className={active === i ? "curve-point is-active" : "curve-point"}
            />
          ))}
        </svg>
        <div className="hourly-points">
          {hours.map((hour, index) => (
            <button
              key={hour.time}
              className={
                active === index ? "hour-point is-active" : "hour-point"
              }
              onPointerEnter={() => setActive(index)}
              onPointerLeave={() => setActive(null)}
              onFocus={() => setActive(index)}
              onBlur={() => setActive(null)}
              onClick={() => setActive(index)}
              aria-label={`${hourLabel(hour.time)}, ${temperature(hour.temperature, unit)} graus ${unit === "celsius" ? "Celsius" : "Fahrenheit"}, ${weatherInfo(hour.code, hour.isDay).label}, ${hour.rain}% de chance de chuva`}
            >
              <span className="hour-time">{hourLabel(hour.time)}</span>
              <WeatherIcon
                kind={weatherInfo(hour.code).kind}
                night={!hour.isDay}
              />
              <strong style={{ top: points[index].y + 54 }}>
                {temperature(hour.temperature, unit)}°
              </strong>
              <span className="hour-rain">{hour.rain}%</span>
            </button>
          ))}
        </div>
        {selected && (
          <div
            className="hour-detail"
            role="status"
            style={{ left: Math.min(points[active!].x, width - 140) }}
          >
            {weatherInfo(selected.code, selected.isDay).label}
          </div>
        )}
      </div>
    </div>
  );
}
