# Weather Check App

**Live site:** https://omoleyeabigail82-dot.github.io/Weather-App/
**Repo:** [https://github.com/omoleyeabigail82-dot/Weather-App/

## What it is
A weather app with live search, current location detection, a 15-day forecast (one week behind, today, one week ahead), an hourly scroll, sunrise/sunset times, moon phase, and a background that shifts color and animation based on real weather conditions and time of day.

## Why I built it
This was my first project using a real external API — direct practice for the fetch/API pattern my final year chatbot project needs. Started simple (search + current weather) and layered on features over several sessions, taking feedback from real testers along the way.

## Tech stack
- HTML, CSS, vanilla JavaScript
- Open-Meteo API — weather, geocoding, and hourly/daily forecast data (free, no API key)
- BigDataCloud reverse geocoding API — turns coordinates into a real place name (free, no API key)
- Browser Geolocation API
- `localStorage` for persistence
- Deployed with GitHub Pages

## Features
- Search weather by city name, or use current location (with real place name via reverse geocoding)
- Current conditions: temperature, "feels like," description, wind speed, local time
- Hourly forecast (next 12 hours, horizontal scroll)
- 15-day forecast: 7 days behind, today, 7 days ahead — horizontal scroll, past days dimmed, today highlighted
- Sunrise, sunset, and moon phase (moon phase calculated locally with date math — no extra API call)
- Pick any date within range via a built-in calendar widget
- °C / °F toggle (instant, no re-fetch)
- Recent searches, saved locally and clickable
- Dynamic background: CSS-only animated clouds, rain, and stars that change color and behavior based on real weather + day/night — no images used, so it costs zero extra data
- Fully responsive

## Key concepts practiced
- `async/await` with `fetch()`, including chaining multiple API calls
- Working with nested JSON and large time-series data (360+ hourly data points)
- `localStorage` for persistence
- Browser Geolocation API + reverse geocoding
- Date math (calendar grid, moon phase calculation, filtering past/future days)
- CSS-only animation (clouds, rain, stars) with zero image assets
- Managing shared state across features to avoid redundant API calls
- Debugging a real production bug: an `overflow: hidden` on `body` was silently blocking scroll to the bottom of the page

## Notable bugs & fixes
**1. Two-step API calls** — weather needs coordinates, not a city name, so search always geocodes first, then fetches weather.

**2. "Unknown conditions" showing up** — the weather code lookup table was missing several official WMO codes. Expanded it to cover all of them.

**3. Missing location name on geolocation** — originally just showed "Your Location." Fixed by adding a reverse geocoding call to get the real city name from coordinates.

**4. Low text contrast on lighter backgrounds** — the card's glass background was too light on warm sunset gradients, hurting readability. Fixed by using a consistently dark, semi-transparent card background regardless of the mood behind it.

**5. Hourly forecast invisible** — the code and data were both correct, but `overflow: hidden` on `body` (added for the animated clouds) was blocking the whole page from scrolling, making content below the fold unreachable. Fixed by scoping the overflow clipping to just the sky layer, not the whole page.

## What I'd do differently next time
- Add previous/next month navigation to the calendar for edge cases near month boundaries
- Cache city search results locally to reduce repeat API calls
- Add a loading skeleton instead of plain "Loading..." text

---

## How to edit this project on GitHub

You don't need to touch the terminal for small changes — GitHub's website lets you edit files directly.

**To edit a file directly on GitHub.com:**
1. Go to your repo
2. Click the file you want to change (e.g. `style.css`)
3. Click the pencil ✏️ icon (top right of the file view) — this opens an editor right in the browser
4. Make your changes
5. Scroll down, write a short commit message describing what you changed (e.g. "fix background contrast")
6. Click **Commit changes**

GitHub Pages will automatically rebuild your live site within a minute or two of any commit — no extra steps needed.

**For bigger changes (multiple files at once), use GitHub Desktop instead:**
1. Open GitHub Desktop
2. Make your edits locally in VS Code as usual
3. Back in GitHub Desktop, you'll see the changed files listed
4. Write a commit message summarizing the changes
5. Click **Commit to main**
6. Click **Push origin** (top right) to send the changes to GitHub

**Good commit message habits:**
- Short, present-tense, specific: "add sunrise/sunset widget," not "updates" or "fixed stuff"
- One commit per logical change when possible — makes it easier to track what broke what, later

**If something breaks after a push:**
GitHub keeps every previous version. Go to your repo → **Commits** (near the top) → find the last working commit → you can view or even revert to that exact version of any file.
