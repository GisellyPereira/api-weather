import React from "react";
import { useState } from "react";
import { getCoordinates } from "../lib/location";
import { getWeather } from "../lib/weather";

export default function WeatherSearch() {
  const [city, setCity] = useState("");
  const [weather, setWeather] = useState<any>(null);
  const [error, setError] = useState("");

  async function handleSearch() {
    setError("");
    setWeather(null);

    try {
      const { lat, lon } = await getCoordinates(city);
      const data = await getWeather(lat, lon);
      setWeather(data);
    } catch (err) {
      setError("Não foi possível obter os dados. Verifique o nome da cidade.");
    }
  }

  return (
    <div className="container">
      <h2>Previsão do Tempo</h2>
      <input
        type="text"
        placeholder="Digite o nome da cidade"
        value={city}
        onChange={(e) => setCity(e.target.value)}
      />
      <button onClick={handleSearch}>Buscar</button>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {weather && (
        <div>
          <p><strong>Cidade:</strong> {city}</p>
          <p><strong>Temperatura:</strong> {weather.properties.timeseries[0].data.instant.details.air_temperature}°C</p>
        </div>
      )}
    </div>
  );
}
