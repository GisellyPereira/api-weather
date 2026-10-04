import { useEffect, useId, useRef, useState } from "react";
import { searchPlaces, suggestedPlaces, type Place } from "../lib/weather";
import { PinIcon, SearchIcon } from "./Icons";
export default function CitySearch({
  onSelect,
}: {
  onSelect: (place: Place) => void;
}) {
  const [query, setQuery] = useState(""),
    [open, setOpen] = useState(false),
    [places, setPlaces] = useState<Place[]>([]),
    [loading, setLoading] = useState(false),
    [error, setError] = useState(""),
    [active, setActive] = useState(-1);
  const box = useRef<HTMLDivElement>(null),
    input = useRef<HTMLInputElement>(null),
    listId = useId();
  const options = query.trim().length < 2 ? suggestedPlaces : places;
  useEffect(() => {
    if (!open || query.trim().length < 2) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      searchPlaces(query, controller.signal)
        .then((result) => {
          setPlaces(result);
          setLoading(false);
        })
        .catch((err) => {
          if (!controller.signal.aborted) {
            setError(
              err instanceof Error
                ? err.message
                : "Não foi possível buscar cidades.",
            );
            setLoading(false);
          }
        });
    }, 350);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, open]);
  useEffect(() => {
    function outside(event: PointerEvent) {
      if (event.target instanceof Node && !box.current?.contains(event.target))
        setOpen(false);
    }
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, []);
  function choose(place: Place) {
    onSelect(place);
    setOpen(false);
    setQuery("");
    setActive(-1);
    input.current?.blur();
  }
  return (
    <div className="city-search" ref={box}>
      <SearchIcon />
      <input
        ref={input}
        role="combobox"
        aria-label="Buscar cidade"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={
          open && active >= 0 && options[active]
            ? `${listId}-${active}`
            : undefined
        }
        placeholder="Qual cidade vamos ver?"
        value={query}
        autoComplete="off"
        onBlur={(event) => {
          if (!box.current?.contains(event.relatedTarget)) setOpen(false);
        }}
        onFocus={() => {
          setOpen(true);
          setActive(-1);
        }}
        onChange={(event) => {
          const text = event.target.value;
          setQuery(text);
          setOpen(true);
          setActive(-1);
          setPlaces([]);
          setError("");
          setLoading(text.trim().length >= 2);
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            setOpen(false);
            setActive(-1);
          }
          if (event.key === "ArrowDown") {
            event.preventDefault();
            setOpen(true);
            setActive((index) => Math.min(index + 1, options.length - 1));
          }
          if (event.key === "ArrowUp") {
            event.preventDefault();
            setActive((index) => Math.max(index - 1, 0));
          }
          if (event.key === "Enter" && open && options.length && !loading) {
            event.preventDefault();
            choose(options[Math.max(active, 0)]);
          }
        }}
      />
      <span className="search-hint">cidade, país</span>
      {open && (
        <div className="search-results">
          <p className="search-caption">
            {query.trim().length < 2
              ? "Para começar a explorar"
              : "Cidades encontradas"}
          </p>
          <div role="status" className="search-status">
            {loading
              ? "Buscando cidades…"
              : error ||
                (query.trim().length >= 2 && !options.length
                  ? "Nenhuma cidade encontrada. Tente outro nome."
                  : "")}
          </div>
          <ul id={listId} role="listbox" aria-label="Resultados de cidades">
            {!loading &&
              !error &&
              options.map((place, index) => (
                <li
                  id={`${listId}-${index}`}
                  role="option"
                  aria-selected={active === index}
                  key={place.id}
                  onPointerMove={() => setActive(index)}
                >
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => choose(place)}
                  >
                    <PinIcon />
                    <span>
                      <strong>{place.name}</strong>
                      <small>
                        {[place.region, place.country]
                          .filter(Boolean)
                          .join(", ")}
                      </small>
                    </span>
                  </button>
                </li>
              ))}
          </ul>
        </div>
      )}
    </div>
  );
}
