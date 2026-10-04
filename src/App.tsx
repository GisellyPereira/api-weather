import { useEffect, useState, useRef } from "react";
import useSceneMotion, { scenePalette } from "./hooks/useSceneMotion";
import AnimatedNumber from "./components/AnimatedNumber";
import Metric from "./components/Metric";
import CitySearch from "./components/CitySearch";
import HourlyChart from "./components/HourlyChart";
import Sky from "./components/Sky";
import {
  BookmarkIcon,
  Logo,
  PinIcon,
  RefreshIcon,
  WeatherIcon,
} from "./components/Icons";
import {
  dateLabel,
  getForecast,
  hourLabel,
  hourlySelection,
  temperature,
  weatherInfo,
  windDirection,
  type Forecast,
  type Place,
} from "./lib/weather";
import {
  lastPlace,
  persist,
  persistUnit,
  savedPlaces,
  savedUnit,
} from "./lib/storage";

export default function App() {
  const sceneRoot = useRef<HTMLDivElement>(null);
  const [place, setPlace] = useState(lastPlace),
    [data, setData] = useState<{ place: Place; forecast: Forecast } | null>(
      null,
    );
  const [forceRefresh, setForceRefresh] = useState(false);
  const [unit, setUnit] = useState(savedUnit),
    [favorites, setFavorites] = useState(savedPlaces),
    [busy, setBusy] = useState(true),
    [error, setError] = useState(""),
    [revision, setRevision] = useState(0),
    [selectedDay, setSelectedDay] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    getForecast(place, controller.signal, forceRefresh)
      .then((forecast) => {
        if (controller.signal.aborted) return;
        setData({ place, forecast });
        setBusy(false);
        setError("");
        setSelectedDay(0);
        persist("last-place", place);
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        setBusy(false);
        setError(
          err instanceof Error
            ? err.message
            : "Confira sua conexão e tente novamente.",
        );
      });
    return () => controller.abort();
  }, [place, revision, forceRefresh]);
  function selectPlace(next: Place) {
    setForceRefresh(false);
    setBusy(true);
    setError("");
    setPlace(next);
    setRevision((value) => value + 1);
  }
  function refresh() {
    setForceRefresh(true);
    setBusy(true);
    setError("");
    setRevision((value) => value + 1);
  }
  function toggleFavorite() {
    if (!data) return;
    const city = data.place;
    const next = favorites.some((item) => item.id === city.id)
      ? favorites.filter((item) => item.id !== city.id)
      : [city, ...favorites].slice(0, 6);
    setFavorites(next);
    persist("places", next);
  }
  const forecast = data?.forecast,
    shownPlace = data?.place ?? place,
    current = forecast?.current;
  const day = forecast?.days[selectedDay],
    selectedFuture = selectedDay > 0;
  const code = selectedFuture ? (day?.code ?? 2) : (current?.code ?? 2);
  const isDay = selectedFuture || (current?.isDay ?? false),
    condition = weatherInfo(code, isDay);
  const palette = scenePalette(condition.kind, isDay),
    sceneKey = `${shownPlace.id}:${selectedDay}:${condition.kind}:${isDay}`;
  useSceneMotion(sceneRoot, sceneKey, palette, selectedDay);
  const hours = forecast && day ? hourlySelection(forecast, day.date) : [],
    t = (value: number) => temperature(value, unit);
  const shownTemperature = selectedFuture ? day?.max : current?.temperature;
  const isSaved = favorites.some((item) => item.id === shownPlace.id);
  return (
    <div
      ref={sceneRoot}
      className={`app-shell ${isDay ? "theme-day" : "theme-night"} weather-${condition.kind}`}
    >
      <div className="world-backdrop" aria-hidden="true">
        <div className="world-mist" />
        <div className="world-horizon" />
      </div>
      <a href="#previsao" className="skip-link">
        Ir para a previsão
      </a>
      <header className="app-header">
        <a className="brand" href="#" aria-label="Weather, início">
          <Logo />
          <span>weather</span>
        </a>
        <CitySearch onSelect={selectPlace} />
        <div
          className="unit-switch"
          role="group"
          aria-label="Unidade de temperatura"
        >
          {(["celsius", "fahrenheit"] as const).map((value) => (
            <button
              key={value}
              aria-pressed={unit === value}
              onClick={() => {
                setUnit(value);
                persistUnit(value);
              }}
            >
              °{value === "celsius" ? "C" : "F"}
            </button>
          ))}
        </div>
      </header>
      <main id="previsao">
        {error && (
          <div className="error-notice" role="alert">
            <div>
              <strong>Não conseguimos atualizar {place.name}.</strong>
              <p>{error}</p>
              {data && <small>A previsão anterior continua visível.</small>}
            </div>
            <button onClick={refresh}>Tentar novamente</button>
          </div>
        )}
        {!data && !busy && (
          <div className="initial-error">
            <WeatherIcon kind="cloudy" />
            <h1>Vamos tentar de novo?</h1>
            <p>Busque outra cidade ou atualize a previsão.</p>
            <button className="primary-button" onClick={refresh}>
              Atualizar previsão
            </button>
          </div>
        )}
        {(data || busy) && (
          <>
            <section
              className="weather-scene"
              aria-labelledby="city-name"
              aria-busy={busy}
            >
              <Sky
                key={`${condition.kind}-${isDay}`}
                kind={condition.kind}
                isDay={isDay}
              />
              <div className="city-copy">
                <p className="scene-eyebrow">
                  {selectedFuture && day
                    ? `Previsão · ${dateLabel(day.date, { weekday: "long", day: "numeric", month: "short" })}`
                    : "Agora em"}
                </p>
                <h1 id="city-name">{shownPlace.name}</h1>
                <p className="city-region">
                  <PinIcon />
                  {[shownPlace.region, shownPlace.country]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
                <div
                  className={`temperature ${shownTemperature !== undefined && String(t(shownTemperature)).length > 2 ? "temperature--wide" : ""}`}
                  aria-label={
                    shownTemperature !== undefined
                      ? `${t(shownTemperature)} graus ${unit === "celsius" ? "Celsius" : "Fahrenheit"}${selectedFuture ? ", máxima prevista" : ""}`
                      : "Carregando temperatura"
                  }
                >
                  <span aria-hidden="true">
                    {shownTemperature !== undefined ? (
                      <AnimatedNumber value={t(shownTemperature)} />
                    ) : (
                      "—"
                    )}
                    <sup>°</sup>
                    <small>{unit === "celsius" ? "C" : "F"}</small>
                  </span>
                </div>
                <p className="weather-condition">
                  <WeatherIcon kind={condition.kind} night={!isDay} />
                  {current ? condition.label : "Buscando o tempo…"}
                </p>
                <p className="feels-like">
                  {selectedFuture
                    ? "Máxima prevista para o dia"
                    : current
                      ? `Sensação de ${t(current.apparent)}°`
                      : "Só um instante…"}
                </p>
                {day && (
                  <p className="temperature-range">
                    Máx. {t(day.max)}° <span>·</span> Mín. {t(day.min)}°
                  </p>
                )}
              </div>
              <div className="scene-home" aria-hidden="true">
                <div className="home-shadow" />
                <div className="house-motion">
                  <img
                    src="/images/weather-house.png"
                    alt=""
                    width="1312"
                    height="1199"
                    fetchPriority="high"
                    draggable="false"
                  />
                </div>
                <div className="house-mist" />
              </div>
              <div className="scene-utilities">
                <button
                  className={`save-city ${isSaved ? "is-saved" : ""}`}
                  onClick={toggleFavorite}
                  disabled={!data || busy}
                  aria-pressed={isSaved}
                  aria-label={
                    isSaved
                      ? `Remover ${shownPlace.name} das cidades salvas`
                      : `Salvar ${shownPlace.name}`
                  }
                >
                  <BookmarkIcon filled={isSaved} />
                  {isSaved ? "Cidade salva" : "Salvar cidade"}
                </button>
                <button
                  className={busy ? "refresh is-spinning" : "refresh"}
                  disabled={busy}
                  onClick={refresh}
                  aria-label="Atualizar previsão"
                >
                  <RefreshIcon />
                </button>
              </div>
              {current && day ? (
                <div
                  className="scene-metrics"
                  key={`metrics-${shownPlace.id}-${selectedDay}`}
                >
                  <Metric
                    label={selectedFuture ? "Nascer do sol" : "Vento"}
                    value={
                      selectedFuture
                        ? hourLabel(day.sunrise)
                        : Math.round(current.wind)
                    }
                    unit={selectedFuture ? undefined : "km/h"}
                    note={
                      selectedFuture
                        ? "Horário local"
                        : `Direção ${windDirection(current.direction)}`
                    }
                    type={selectedFuture ? "sun" : "wind"}
                    direction={current.direction}
                  />
                  <Metric
                    label={selectedFuture ? "Pôr do sol" : "Umidade"}
                    value={
                      selectedFuture ? hourLabel(day.sunset) : current.humidity
                    }
                    unit={selectedFuture ? undefined : "%"}
                    note={selectedFuture ? "Horário local" : "Umidade relativa"}
                    type={selectedFuture ? "sun" : "humidity"}
                    fraction={current.humidity / 100}
                  />
                  <Metric
                    label="Chance de chuva"
                    value={day.rain}
                    unit="%"
                    note="Maior chance no dia"
                    type="rain"
                    fraction={day.rain / 100}
                  />
                  <Metric
                    label="Índice UV"
                    value={day.uv.toFixed(1).replace(".", ",")}
                    note={`${day.uv <= 2 ? "Baixo" : day.uv <= 5 ? "Moderado" : day.uv <= 7 ? "Alto" : day.uv <= 10 ? "Muito alto" : "Extremo"} · máximo`}
                    type="uv"
                    fraction={day.uv / 11}
                  />
                </div>
              ) : (
                <div className="scene-loading" role="status">
                  Carregando sua previsão…
                </div>
              )}
              <div className="scene-caption">
                <span>
                  {busy
                    ? `Atualizando ${place.name}…`
                    : selectedFuture && day
                      ? dateLabel(day.date, {
                          weekday: "long",
                          day: "numeric",
                          month: "long",
                        })
                      : current
                        ? `Condições às ${hourLabel(current.time)} · horário local`
                        : ""}
                </span>
                {!selectedFuture && day && (
                  <span>
                    Nascer do sol {hourLabel(day.sunrise)} <i>·</i> Pôr do sol{" "}
                    {hourLabel(day.sunset)}
                  </span>
                )}
              </div>
            </section>
            <div className="forecast-content">
              <section className="weekly" aria-labelledby="week-title">
                <div className="section-heading">
                  <div>
                    <h2 id="week-title">Os próximos dias</h2>
                    <p className="section-note">
                      Previsão para os próximos 7 dias.
                    </p>
                  </div>
                  {favorites.length > 0 && (
                    <nav className="saved-cities" aria-label="Cidades salvas">
                      <span>Suas cidades</span>
                      {favorites.map((city) => (
                        <button
                          key={city.id}
                          aria-pressed={shownPlace.id === city.id}
                          onClick={() => selectPlace(city)}
                        >
                          {city.name}
                        </button>
                      ))}
                    </nav>
                  )}
                </div>
                {forecast ? (
                  <div className="day-list">
                    {forecast.days.map((item, index) => (
                      <button
                        key={item.date}
                        className={`day-row ${selectedDay === index ? "is-selected" : ""}`}
                        aria-pressed={selectedDay === index}
                        aria-label={`${index === 0 ? "Hoje" : dateLabel(item.date, { weekday: "long", day: "numeric" })}, ${weatherInfo(item.code).label}, mínima ${t(item.min)} e máxima ${t(item.max)} graus, ${item.rain}% de chance de chuva`}
                        onClick={() => setSelectedDay(index)}
                        onKeyDown={(event) => {
                          if (
                            event.key === "ArrowRight" ||
                            event.key === "ArrowLeft"
                          ) {
                            event.preventDefault();
                            const next = Math.min(
                              6,
                              Math.max(
                                0,
                                index + (event.key === "ArrowRight" ? 1 : -1),
                              ),
                            );
                            setSelectedDay(next);
                            (
                              event.currentTarget.parentElement?.children[
                                next
                              ] as HTMLElement
                            )?.focus();
                          }
                        }}
                      >
                        <span className="day-name">
                          <strong>
                            {index === 0
                              ? "Hoje"
                              : index === 1
                                ? "Amanhã"
                                : dateLabel(item.date, {
                                    weekday: "short",
                                  }).replace(".", "")}
                          </strong>
                          <small>
                            {dateLabel(item.date, {
                              day: "2-digit",
                              month: "2-digit",
                            })}
                          </small>
                        </span>
                        <WeatherIcon kind={weatherInfo(item.code).kind} />
                        <span className="day-temperatures">
                          <strong>{t(item.max)}°</strong>
                          <small>{t(item.min)}°</small>
                        </span>
                        <span className="day-rain">
                          <svg viewBox="0 0 16 20" aria-hidden="true">
                            <path d="M8 1S1 9 1 13a7 7 0 0 0 14 0C15 9 8 1 8 1Z" />
                          </svg>
                          {item.rain}%
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="week-skeleton" aria-hidden="true">
                    {Array.from({ length: 7 }, (_, i) => (
                      <div key={i} />
                    ))}
                  </div>
                )}
              </section>
              <section className="hourly" aria-labelledby="hour-title">
                <div className="section-heading">
                  <div>
                    <h2 id="hour-title">
                      {selectedDay === 0
                        ? "Hora a hora"
                        : day
                          ? dateLabel(day.date, { weekday: "long" })
                          : "Hora a hora"}
                    </h2>
                    <p className="section-note">
                      {selectedDay === 0
                        ? "Temperatura e chance de chuva nas próximas 24 horas."
                        : day
                          ? dateLabel(day.date, {
                              day: "numeric",
                              month: "long",
                            })
                          : "Carregando os detalhes."}
                    </p>
                  </div>
                  <span className="chart-legend">
                    <i /> Temperatura <small>% chuva</small>
                  </span>
                </div>
                {hours.length ? (
                  <HourlyChart
                    key={`${shownPlace.id}-${day?.date}`}
                    hours={hours}
                    unit={unit}
                  />
                ) : (
                  <div className="hourly-skeleton" aria-hidden="true" />
                )}
                <p className="scroll-note">
                  Deslize para acompanhar as próximas horas.
                </p>
              </section>
            </div>
          </>
        )}
        <div className="sr-only" role="status" aria-live="polite">
          {busy
            ? `Carregando previsão de ${place.name}.`
            : data && shownTemperature !== undefined
              ? `${selectedFuture ? "Previsão" : "Condições atuais"} de ${shownPlace.name}: ${condition.label}, ${t(shownTemperature)} graus${selectedFuture ? ", máxima prevista" : ""}.`
              : ""}
        </div>
      </main>
      <footer className="app-footer">
        <p>
          weather <span>por Giselly Pereira</span>
        </p>
        <p>
          Previsão:{" "}
          <a href="https://open-meteo.com/" target="_blank" rel="noreferrer">
            Open-Meteo
          </a>{" "}
          · cidades:{" "}
          <a href="https://www.geonames.org/" target="_blank" rel="noreferrer">
            GeoNames
          </a>
        </p>
        <small>
          O cenário é uma ilustração. Horários seguem o fuso da cidade.
        </small>
      </footer>
    </div>
  );
}
