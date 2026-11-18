import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import App from "./App";
import { makeWeather } from "./test/fixtures";

vi.stubEnv("VITE_API_KEY", "test-key");

const weather = makeWeather();
const history = { forecast: { forecastday: [{ day: { maxtemp_f: 42, maxtemp_c: 5.6, mintemp_f: 28, mintemp_c: -2.2, totalprecip_in: 0, totalprecip_mm: 0 } }] } };

function mockApi() {
  globalThis.fetch = vi.fn(async (url) => {
    const { pathname } = new URL(url);
    const body = pathname.endsWith("history.json")
      ? history
      : pathname.endsWith("current.json")
        ? { location: weather.location, current: weather.current }
        : pathname.endsWith("search.json")
          ? [{ id: 1, name: "Chicago", region: "Illinois", country: "United States of America" }]
          : weather;
    return { ok: true, json: async () => body };
  });
}

beforeEach(() => {
  localStorage.clear();
  window.history.pushState({}, "", "/");
  window.scrollTo = vi.fn();
  globalThis.ResizeObserver = class { observe() {} disconnect() {} };
  mockApi();
});
afterEach(() => vi.restoreAllMocks());

describe("App", () => {
  test("shows the welcome screen with no saved location", () => {
    render(<App />);
    expect(screen.getByRole("heading", { name: /what's it like out there/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /use my current location/i })).toBeInTheDocument();
  });

  test("loads a popular city and renders the Now page", async () => {
    render(<App />);
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Chicago" })));
    expect(await screen.findByRole("heading", { level: 1, name: "Chicago" })).toBeInTheDocument();
    expect(screen.getByText(/next 24 hours/i)).toBeInTheDocument();
    expect(screen.getByText(/8° warmer than yesterday/)).toBeInTheDocument();
    // The location is remembered for next time
    expect(JSON.parse(localStorage.getItem("weather_last_city"))).toMatchObject({ query: "Chicago" });
  });

  test("restores a location saved by the previous version (plain string)", async () => {
    localStorage.setItem("weather_last_city", "Chicago, Illinois, United States of America");
    localStorage.setItem("weather_favorites", JSON.stringify(["Chicago, Illinois, United States of America"]));
    render(<App />);
    expect(await screen.findByRole("heading", { level: 1, name: "Chicago" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /remove from favorites/i })).toBeInTheDocument();
  });

  test("navigates between the three pages", async () => {
    localStorage.setItem("weather_last_city", JSON.stringify({ label: "Chicago", query: "Chicago" }));
    render(<App />);
    await screen.findByRole("heading", { level: 1, name: "Chicago" });

    const nav = screen.getAllByRole("navigation", { name: "Pages" })[0];
    await act(async () => fireEvent.click(within(nav).getByRole("link", { name: "Forecast" })));
    expect(window.location.pathname).toBe("/forecast");
    expect(screen.getByRole("heading", { level: 1, name: "Forecast" })).toBeInTheDocument();
    expect(screen.getAllByRole("article")).toHaveLength(3);

    await act(async () => fireEvent.click(within(nav).getByRole("link", { name: "Details" })));
    expect(screen.getByRole("heading", { level: 1, name: "Details" })).toBeInTheDocument();
    expect(screen.getByText("Air quality")).toBeInTheDocument();
    expect(screen.getByText("First Quarter")).toBeInTheDocument();
  });

  test("switches units", async () => {
    localStorage.setItem("weather_last_city", JSON.stringify({ label: "Chicago", query: "Chicago" }));
    render(<App />);
    await screen.findByRole("heading", { level: 1, name: "Chicago" });
    expect(screen.getByText("°F", { selector: "span" })).toBeInTheDocument();
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Celsius" })));
    expect(screen.getByText("°C", { selector: "span" })).toBeInTheDocument();
    expect(localStorage.getItem("weather_unit")).toBe('"C"');
  });
});
