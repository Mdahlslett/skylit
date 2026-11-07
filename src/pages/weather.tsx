import { normalizeWeather, type WeatherData } from "../lib/weather-data";
import { FeatureBoundary } from "../lib/error-boundary";
import { Status } from "../components/ui/status";
import { useLayoutEffect, useRef } from "react";
import { createStore } from "../lib/store";
import { Button } from "../components/ui/button";
import { Icon } from "../components/icon";
type WeatherState = {
  data: WeatherData | null;
  city: {
    name: string;
    admin1: string;
    timezone: string;
    latitude: number | null;
  };
  clock: string;
  busy: boolean;
  error: boolean;
  status: string;
  now: number;
};
export const weatherStore = createStore<WeatherState>({
  data: null,
  city: {
    name: "Velg sted",
    admin1: "",
    timezone: "UTC",
    latitude: null,
  },
  clock: "12",
  busy: false,
  error: false,
  status: "Henter siste værvarsel …",
  now: Date.now(),
});
const round = (value: unknown) =>
  typeof value === "number" && Number.isFinite(value) ? Math.round(value) : "—";
function time(
  s: WeatherState,
  epoch: number,
  options: Intl.DateTimeFormatOptions = {},
) {
  return new Intl.DateTimeFormat("nb-NO", {
    timeZone: s.city.timezone,
    hour: "numeric",
    minute: "2-digit",
    hourCycle: s.clock === "12" ? "h12" : "h23",
    ...options,
  }).format(new Date(epoch));
}
function SkyArt({ data, id }: { data: WeatherData | null; id?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (data && ref.current)
      window.SkylitWeatherArt.apply(
        ref.current,
        data.current.weather_code,
        data.current.is_day,
      );
  }, [data]);
  return (
    <div
      id={id}
      ref={ref}
      className="sky-art"
      hidden={!data}
      aria-hidden="true"
    >
      {[
        "sun-disc",
        "cloud one",
        "cloud two",
        "weather-haze",
        "weather-rain",
        "weather-snow",
        "weather-bolt",
        "hill hill-a",
        "hill hill-b",
      ].map((c) => (
        <div key={c} className={c} />
      ))}
    </div>
  );
}
function WeatherContent({ s }: { s: WeatherState }) {
  const data = s.data,
    c = data?.current,
    d = data?.daily,
    h = data?.hourly,
    describe = (code: number) => window.SkylitWeatherArt.describe(code),
    forecast = data
      ? window.SkylitAppModel.forecast(data, s.now, s.city.timezone)
      : { hours: [], days: [] },
    stale = !!window.SkylitOverview.weather(data)?.stale;
  const placeholder =
    s.city.latitude === null
      ? "Velg et sted for å se timevarselet."
      : s.busy
        ? "Henter værvarsel …"
        : "Det lagrede timevarselet har utløpt. Oppdater når du er på nett.";
  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Vær</h1>
        </div>
        <Button
          id="refresh"
          variant="ghost"
          disabled={s.busy || s.city.latitude === null}
          onClick={() => window.SkylitApp.refreshWeather()}
        >
          <Icon name="refresh" />
          Oppdater
        </Button>
      </div>
      <div
        id="weather-status"
        className={"notice" + (s.error ? " error" : "")}
        role="status"
      >
        {s.status}
      </div>
      <div className="weather-layout">
        <article className="hero card">
          <div className="hero-copy">
            <p className="eyebrow" id="weather-label">
              {stale ? "LAGRET VÆRSTATUS" : "AKKURAT NÅ"}
            </p>
            <div className="temperature">
              <span id="temperature">{round(c?.temperature_2m)}</span>
              <span className="degree">°</span>
            </div>
            <h2 id="condition">
              {c
                ? describe(c.weather_code).label
                : s.city.latitude === null
                  ? "Sted ikke valgt"
                  : "Venter på værdata"}
            </h2>
            <p className="subtle" id="feels">
              {c
                ? "Føles som " +
                  round(c.apparent_temperature) +
                  "° · " +
                  (c.is_day ? "Dag" : "Natt")
                : "Velg et sted for å se været."}
            </p>
            <div className="high-low" id="high-low">
              {d
                ? "Maks " +
                  round(d!.temperature_2m_max[0]) +
                  "° / Min " +
                  round(d!.temperature_2m_min[0]) +
                  "°"
                : "—"}
            </div>
          </div>
          <SkyArt data={data} />
          <div className="hero-bottom">
            <span id="weather-note">
              {data
                ? (stale ? "Lagret værstatus" : "Været nå") +
                  " · " +
                  s.city.name
                : "Velg et sted for å hente været."}
            </span>
            <Icon name="arrow" />
          </div>
        </article>
        <div className="weather-side">
          <article className="card metric">
            <span className="metric-icon">
              <Icon name="drop" />
            </span>
            <div>
              <p className="eyebrow">
                {forecast.days[0]?.isToday
                  ? "NEDBØRSJANSE I DAG"
                  : "NEDBØRSJANSE"}
              </p>
              <strong id="rain">
                {d ? round(d!.precipitation_probability_max[0]) + "%" : "—"}
              </strong>
              <p className="subtle" id="rain-note">
                {(d?.precipitation_probability_max[0] ?? 0) >= 50
                  ? "Ta gjerne med paraply."
                  : "Liten sjanse for nedbør."}
              </p>
            </div>
          </article>
          <article className="card metric">
            <span className="metric-icon">
              <Icon name="wind" />
            </span>
            <div>
              <p className="eyebrow">VIND</p>
              <strong id="wind">
                {c ? round(c!.wind_speed_10m) + " km/t" : "—"}
              </strong>
              <p className="subtle" id="humidity">
                {c ? "Luftfuktighet " + round(c.relative_humidity_2m) + "%" : "—"}
              </p>
            </div>
          </article>
          <article className="card metric sunset">
            <span className="metric-icon">
              <Icon name="sunset" />
            </span>
            <div>
              <p className="eyebrow">SOLNEDGANG</p>
              <strong id="sunset">
                {d?.sunset[0] ? time(s, d!.sunset[0] * 1000) : "—"}
              </strong>
              <p className="subtle">Lokal tid</p>
            </div>
          </article>
        </div>
      </div>
      <article className="card forecast-card">
        <div className="section-title">
          <h3>De neste timene</h3>
          <span className="subtle" />
        </div>
        <div id="hourly" className="hourly">
          {forecast.hours.length ? (
            forecast.hours.map(({ time: t, index: i, isNow }) => (
              <div className="hour" key={t}>
                <span>
                  {isNow ? "Nå" : time(s, t * 1000, { minute: undefined })}
                </span>
                <Icon
                  name={
                    h!.is_day?.[i] === 0 && h!.weather_code[i] <= 2
                      ? "moon"
                      : describe(h!.weather_code[i]).icon
                  }
                />
                <strong>{round(h!.temperature_2m[i])}°</strong>
                <span className="precip">
                  {round(h!.precipitation_probability[i])}% nedbør
                </span>
              </div>
            ))
          ) : (
            <p className="forecast-placeholder subtle">{placeholder}</p>
          )}
        </div>
      </article>
      <article className="card days-card" hidden={!data}>
        <div className="section-title">
          <h3>Femdagersvarsel</h3>
          <span id="updated" className="tiny">
            {data
              ? "Hentet " +
                time(
                  s,
                  data.fetchedAt || s.now,
                  stale ? { month: "short", day: "numeric" } : {},
                )
              : ""}
          </span>
        </div>
        <div id="daily" className="daily">
          {forecast.days.map(({ time: t, index: i, isToday, isPast }) => (
            <div className="day" key={t}>
              <span>
                {isToday
                  ? "I dag"
                  : new Intl.DateTimeFormat("nb-NO", {
                      timeZone: s.city.timezone,
                      weekday: "short",
                      ...(isPast ? { month: "short", day: "numeric" } : {}),
                    }).format(new Date(t * 1000))}
              </span>
              <Icon name={describe(d!.weather_code[i]).icon} />
              <b>
                {round(d!.temperature_2m_max[i])}°{" "}
                <small>{round(d!.temperature_2m_min[i])}°</small>
              </b>
            </div>
          ))}
        </div>
      </article>
      <footer>
        <span>
          Værdata fra{" "}
          <a href="https://open-meteo.com/" target="_blank" rel="noreferrer">
            Open-Meteo
          </a>
        </span>
        <span id="weather-source">Oppdateres hvert kvarter</span>
      </footer>
    </>
  );
}
function OverviewWeatherContent({ s }: { s: WeatherState }) {
  const data = s.data,
    w = window.SkylitOverview.weather(data),
    d = data?.daily,
    c = data?.current;
  return (
    <>
      <div className="overview-weather-scene">
        <div className="overview-weather-copy">
          <p className="eyebrow">RIGHT NOW</p>
          <Icon
            className="overview-condition-icon"
            name={
              w
                ? !c?.is_day && w.code <= 2
                  ? "moon"
                  : window.SkylitWeatherArt.describe(w.code).icon
                : "cloud"
            }
          />
          <strong id="overview-temperature">
            {w ? w.temperature + "°" : "—"}
          </strong>
          <h2 id="overview-condition">
            {w
              ? window.SkylitWeatherArt.describe(w.code).label
              : s.city.latitude === null
                ? "Velg sted i innstillingene."
                : "Værdata utilgjengelig"}
          </h2>
          <p id="overview-weather-detail" className="subtle">
            {w
              ? "Maks " +
                round(d!.temperature_2m_max[0]) +
                "° / Min " +
                round(d!.temperature_2m_min[0]) +
                "°"
              : ""}
          </p>
        </div>
        <SkyArt id="overview-sky" data={w ? data : null} />
        <Button
          variant="ghost"
          className="overview-forecast-link"
          data-go="weather"
          aria-label="Åpne hele værvarselet"
        >
          <Icon name="arrow" />
        </Button>
      </div>
      <div className="overview-weather-metrics">
        {[
          [
            "drop",
            "Nedbør i dag",
            "overview-rain",
            w ? round(d!.precipitation_probability_max[0]) + "%" : "—",
          ],
          [
            "wind",
            "Vind",
            "overview-wind",
            w ? round(c!.wind_speed_10m) + " km/t" : "—",
          ],
          [
            "sunset",
            "Solnedgang",
            "overview-sunset",
            w && d!.sunset[0] ? time(s, d!.sunset[0] * 1000) : "—",
          ],
        ].map(([icon, label, id, value]) => (
          <div key={id}>
            <span>
              <Icon name={icon} />
            </span>
            <span>
              {label}
              <strong id={id}>{value}</strong>
            </span>
          </div>
        ))}
      </div>
      <Status id="overview-weather-status" className="tiny" role="status">
        {w
          ? w.stale || !navigator.onLine
            ? "Lagret varsel · Hentet " +
              time(s, w.fetchedAt, { month: "short", day: "numeric" })
            : ""
          : "Åpne Vær for å oppdatere."}
      </Status>
    </>
  );
}

export function Weather() {
  const state = weatherStore.use();
  const s = { ...state, data: normalizeWeather(state.data) };
  return (
    <FeatureBoundary revision={state}>
      <WeatherContent s={s} />
    </FeatureBoundary>
  );
}
export function OverviewWeather() {
  const state = weatherStore.use();
  const s = { ...state, data: normalizeWeather(state.data) };
  return (
    <FeatureBoundary revision={state}>
      <OverviewWeatherContent s={s} />
    </FeatureBoundary>
  );
}
