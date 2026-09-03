# Weather Check App

**Live site:** [https://omoleyeabigail82-dot.github.io/Weather-App/](https://omoleyeabigail82-dot.github.io/Weather-App/)  
**Repo:** [https://github.com/omoleyeabigail82-dot/Weather-App](https://github.com/omoleyeabigail82-dot/Weather-App)

---

## What it is
A weather app with live search, current location detection, a 15-day forecast (one week behind, today, one week ahead), an hourly scroll, sunrise/sunset times, moon phase, and a background that shifts color and animation based on real weather conditions and time of day.

---

## Why I built it
This was my first project using a real external API — direct practice for the fetch/API pattern my final year chatbot project needs. Started simple (search + current weather) and layered on features over several sessions, taking feedback from real testers along the way.

---

## Tech stack
- **HTML, CSS, vanilla JavaScript** — no frameworks or build tools
- **Open-Meteo API** — weather, geocoding, and hourly/daily forecast data (free, no API key required)
- **Nominatim (OpenStreetMap) reverse geocoding** — converts coordinates to real place names (free, no API key)
- **Browser Geolocation API** — for "Use my location" feature
- **localStorage** — persists recent searches across sessions
- **GitHub Pages** — deployed as a static site

> 🔒 **Security note:** Chose Open-Meteo specifically because it requires no API keys, eliminating the risk of key exposure in client-side code.

---

## Features
- ✅ Search weather by city name, or use current location (with real place name via reverse geocoding)
- ✅ Current conditions: temperature, "feels like," description, wind speed, local time
- ✅ Hourly forecast (next 12 hours, horizontal scroll)
- ✅ 15-day forecast: 7 days behind, today, 7 days ahead — horizontal scroll, past days dimmed, today highlighted
- ✅ Sunrise, sunset, and moon phase (moon phase calculated locally with date math — no extra API call)
- ✅ Pick any date within range via a built-in calendar widget
- ✅ °C / °F toggle (instant, no re-fetch)
- ✅ Recent searches, saved locally and clickable
- ✅ Popular cities quick-access (Lagos, London, New York, Tokyo, Dubai, Paris, Nairobi, Sydney)
- ✅ Dynamic background: CSS-only animated clouds, rain, and stars that change color and behavior based on real weather + day/night — no images used, so it costs zero extra data
- ✅ Fully responsive (desktop, tablet, mobile down to 340px screens)
- ✅ Accessibility: ARIA labels, keyboard navigation, reduced motion support (`prefers-reduced-motion`)

---

## Key concepts practiced
- `async/await` with `fetch()`, including chaining multiple API calls (geocoding → weather → reverse geocoding)
- Working with nested JSON and large time-series data (360+ hourly data points)
- `localStorage` for persistence
- Browser Geolocation API + reverse geocoding
- Date math (calendar grid, moon phase calculation, filtering past/future days)
- CSS-only animation (clouds, rain, stars) with zero image assets
- Managing shared state across features to avoid redundant API calls
- Accessibility best practices (ARIA labels, focus states, keyboard navigation)
- Debugging real production bugs (see below)

---

## Notable bugs & fixes

**1. Two-step API calls** — Weather needs coordinates, not a city name, so search always geocodes first, then fetches weather.

**2. "Unknown conditions" showing up** — The weather code lookup table was missing several official WMO codes. Expanded it to cover all of them.

**3. Missing location name on geolocation** — Originally just showed "Your Location." Fixed by adding a reverse geocoding call to get the real city name from coordinates.

**4. Low text contrast on lighter backgrounds** — The card's glass background was too light on warm sunset gradients, hurting readability. Fixed by using a consistently dark, semi-transparent card background regardless of the mood behind it.

**5. Hourly forecast invisible** — The code and data were both correct, but `overflow: hidden` on `body` (added for the animated clouds) was blocking the whole page from scrolling, making content below the fold unreachable. Fixed by scoping the overflow clipping to just the sky layer, not the whole page.

**6. Search button spam** — Users could click search multiple times while waiting, causing duplicate API calls. Fixed by disabling the button and showing a loading indicator during fetch.

**7. Duplicate body declaration in CSS** — Had `body` defined twice with conflicting styles. Merged into a single declaration for cleaner, more maintainable code.

---

## What I'd do differently next time
- Add previous/next month navigation to the calendar for edge cases near month boundaries
- Cache city search results locally to reduce repeat API calls
- Add a loading skeleton instead of plain "Loading..." text
- Add humidity, pressure, and UV index from Open-Meteo's extended endpoints
- Implement a "Share weather" button to copy forecast as text

---

## Accessibility
This app is designed to be usable by everyone:
- **Keyboard navigation:** All interactive elements are focusable and operable via keyboard
- **Screen reader support:** ARIA labels on buttons, live regions for weather updates
- **Reduced motion:** Respects `prefers-reduced-motion` system preference (disables animations)
- **Focus indicators:** Visible focus rings on all interactive elements
- **Color contrast:** Text meets WCAG AA contrast requirements

---

## Performance
- **Zero external dependencies** — no frameworks, libraries, or image assets
- **Minimal API calls** — reuses fetched data across features (forecast, hourly, sun/moon)
- **Efficient CSS** — animations use `transform` and `opacity` for GPU acceleration
- **Small bundle size** — entire app is under 50KB (HTML + CSS + JS combined)

---

## How to run locally
1. Clone the repo:
   ```bash
   git clone https://github.com/omoleyeabigail82-dot/Weather-App.git
   ```
2. Open `index.html` in your browser (no server required)
3. Or use a local server (optional):
   ```bash
   # With Python
   python -m http.server 8000

   # With Node.js (npx)
   npx serve
   ```
4. Visit `http://localhost:8000` (or the port shown)

---

## Credits
- Weather data: [Open-Meteo](https://open-meteo.com/)
- Geocoding: [Open-Meteo Geocoding API](https://open-meteo.com/docs/geocoding-api)
- Reverse geocoding: [Nominatim by OpenStreetMap](https://nominatim.openstreetmap.org/)
- Icons: Emoji (Unicode) — no external icon library

---

## License
MIT License — feel free to use this code for your own learning or projects.
