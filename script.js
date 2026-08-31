// Weather code -> description + emoji icon
// Full WMO weather code list (Open-Meteo can return any of these)
const weatherInfo = {
  0: { desc: "Clear sky", icon: "☀️" },
  1: { desc: "Mostly clear", icon: "🌤️" },
  2: { desc: "Partly cloudy", icon: "⛅" },
  3: { desc: "Overcast", icon: "☁️" },
  45: { desc: "Fog", icon: "🌫️" },
  48: { desc: "Depositing rime fog", icon: "🌫️" },
  51: { desc: "Light drizzle", icon: "🌦️" },
  53: { desc: "Moderate drizzle", icon: "🌦️" },
  55: { desc: "Dense drizzle", icon: "🌦️" },
  56: { desc: "Light freezing drizzle", icon: "🌦️" },
  57: { desc: "Dense freezing drizzle", icon: "🌦️" },
  61: { desc: "Light rain", icon: "🌧️" },
  63: { desc: "Rain", icon: "🌧️" },
  65: { desc: "Heavy rain", icon: "🌧️" },
  66: { desc: "Light freezing rain", icon: "🌧️" },
  67: { desc: "Heavy freezing rain", icon: "🌧️" },
  71: { desc: "Light snow", icon: "🌨️" },
  73: { desc: "Moderate snow", icon: "🌨️" },
  75: { desc: "Heavy snow", icon: "🌨️" },
  77: { desc: "Snow grains", icon: "🌨️" },
  80: { desc: "Light rain showers", icon: "🌦️" },
  81: { desc: "Rain showers", icon: "🌧️" },
  82: { desc: "Violent rain showers", icon: "🌧️" },
  85: { desc: "Light snow showers", icon: "🌨️" },
  86: { desc: "Heavy snow showers", icon: "🌨️" },
  95: { desc: "Thunderstorm", icon: "⛈️" },
  96: { desc: "Thunderstorm with light hail", icon: "⛈️" },
  99: { desc: "Thunderstorm with heavy hail", icon: "⛈️" }
};

// Popular cities for the quick-select row — coordinates included so
// clicking one skips the geocoding step and loads instantly
const popularCities = [
  { name: "Lagos", country: "Nigeria", lat: 6.5244, lon: 3.3792 },
  { name: "London", country: "UK", lat: 51.5072, lon: -0.1276 },
  { name: "New York", country: "USA", lat: 40.7128, lon: -74.006 },
  { name: "Tokyo", country: "Japan", lat: 35.6762, lon: 139.6503 },
  { name: "Dubai", country: "UAE", lat: 25.2048, lon: 55.2708 },
  { name: "Paris", country: "France", lat: 48.8566, lon: 2.3522 },
  { name: "Nairobi", country: "Kenya", lat: -1.2921, lon: 36.8219 },
  { name: "Sydney", country: "Australia", lat: -33.8688, lon: 151.2093 }
];

// Elements
const cityInput = document.getElementById("cityInput");
const searchBtn = document.getElementById("searchBtn");
const locationBtn = document.getElementById("locationBtn");
const unitToggle = document.getElementById("unitToggle");
const resultDiv = document.getElementById("result");
const forecastDiv = document.getElementById("forecast");
const recentDiv = document.getElementById("recentSearches");
const calendarToggle = document.getElementById("calendarToggle");
const calendarDiv = document.getElementById("calendar");
const popularCitiesDiv = document.getElementById("popularCities");

// State: keep the last fetched data + current unit, so toggling
// units doesn't require a new API call
let lastWeatherData = null;
let currentUnit = "C";

// Remember the coordinates of the last searched location, so the
// calendar can fetch a specific date without asking for a city again
let lastCoords = null;

// ---- Event listeners ----

searchBtn.addEventListener("click", () => {
  getWeatherByCity(cityInput.value.trim());
});

cityInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    getWeatherByCity(cityInput.value.trim());
  }
});

locationBtn.addEventListener("click", useMyLocation);

calendarToggle.addEventListener("click", () => {
  if (!lastCoords) {
    showError("Search a city first, then pick a date.");
    return;
  }
  calendarDiv.classList.toggle("hidden");
  if (!calendarDiv.classList.contains("hidden")) {
    renderCalendar();
  }
});

unitToggle.addEventListener("click", () => {
  currentUnit = currentUnit === "C" ? "F" : "C";
  unitToggle.textContent = `°${currentUnit}`;
  // Re-render using the data we already have, no need to re-fetch
  if (lastWeatherData) {
    renderWeather(lastWeatherData);
  }
});

// ---- Core functions ----

async function getWeatherByCity(city) {
  if (city === "") {
    showError("Please enter a city name");
    return;
  }

  showLoading();

  try {
    const geoResponse = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`
    );
    const geoData = await geoResponse.json();

    if (!geoData.results || geoData.results.length === 0) {
      showError(`Couldn't find "${city}". Try another city.`);
      return;
    }

    const { latitude, longitude, name, country } = geoData.results[0];
    await fetchAndRender(latitude, longitude, name, country);
    saveRecentSearch(name);

  } catch (error) {
    showError("Something went wrong. Check your internet connection.");
    console.error(error);
  }
}

function useMyLocation() {
  if (!navigator.geolocation) {
    showError("Location isn't supported on this browser.");
    return;
  }

  showLoading();

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const { latitude, longitude } = position.coords;

      // Reverse geocoding: turn coordinates into a real place name.
      // Open-Meteo's geocoding API only searches BY name, not the
      // other way around, so we use a separate free reverse-geocode
      // service here instead.
      let placeName = "Your Location";
      let placeCountry = "";

      try {
        const reverseResponse = await fetch(
          `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
        );
        const reverseData = await reverseResponse.json();
        placeName = reverseData.city || reverseData.locality || "Your Location";
        placeCountry = reverseData.countryName || "";
      } catch (err) {
        // If reverse geocoding fails, we still show weather —
        // just with a generic label instead of a real place name.
        console.error("Reverse geocoding failed:", err);
      }

      await fetchAndRender(latitude, longitude, placeName, placeCountry);
    },
    (error) => {
      if (error.code === error.PERMISSION_DENIED) {
        showError("Location permission denied. Check your browser settings.");
      } else {
        showError("Couldn't get an accurate location right now. Try searching your city instead.");
      }
    },
    {
      enableHighAccuracy: true, // ask for GPS-level precision, not just Wi-Fi/IP estimate
      timeout: 10000,
      maximumAge: 0 // don't reuse an old cached location
    }
  );
}

// Shared fetch logic used by both city search and geolocation
async function fetchAndRender(latitude, longitude, name, country) {
  try {
    const weatherResponse = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}` +
      `&current=temperature_2m,apparent_temperature,weathercode,is_day,wind_speed_10m` +
      `&hourly=temperature_2m,weathercode` +
      `&daily=weathercode,temperature_2m_max,temperature_2m_min,sunrise,sunset` +
      `&past_days=7&forecast_days=8` +
      `&timezone=auto`
    );
    const weatherData = await weatherResponse.json();

    lastWeatherData = {
      name,
      country,
      current: weatherData.current,
      hourly: weatherData.hourly,
      daily: weatherData.daily
    };

    // Save so the calendar feature can fetch specific dates later
    lastCoords = { latitude, longitude, name, country };

    renderWeather(lastWeatherData);

  } catch (error) {
    showError("Something went wrong fetching weather data.");
    console.error(error);
  }
}

// Fetch weather for one specific date (used by the calendar)
async function getWeatherForDate(dateStr) {
  if (!lastCoords) return;

  showLoading();
  calendarDiv.classList.add("hidden");

  try {
    const { latitude, longitude, name, country } = lastCoords;
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}` +
      `&daily=weathercode,temperature_2m_max,temperature_2m_min` +
      `&start_date=${dateStr}&end_date=${dateStr}&timezone=auto`
    );
    const data = await response.json();

    const code = data.daily.weathercode[0];
    const high = data.daily.temperature_2m_max[0];
    const low = data.daily.temperature_2m_min[0];
    const info = weatherInfo[code] || { desc: "Unknown", icon: "❓" };
    const locationLabel = country ? `${name}, ${country}` : name;
    const readableDate = new Date(dateStr).toLocaleDateString(undefined, {
      weekday: "long",
      month: "short",
      day: "numeric"
    });

    resultDiv.innerHTML = `
      <div class="city-name">${locationLabel}</div>
      <div class="details">${readableDate}</div>
      <div class="weather-icon">${info.icon}</div>
      <div class="temperature">${convertTemp(high)}° / ${convertTemp(low)}°${currentUnit}</div>
      <div class="description">${info.desc}</div>
      <p class="forecast-note" id="backToToday">← Back to today</p>
    `;

    document.getElementById("backToToday").addEventListener("click", () => {
      renderWeather(lastWeatherData);
    });

  } catch (error) {
    showError("Couldn't get weather for that date.");
    console.error(error);
  }
}

// Build and display the calendar grid
function renderCalendar() {
  const today = new Date();
  const minDate = new Date();
  minDate.setDate(today.getDate() - 7); // past week now available
  const maxDate = new Date();
  maxDate.setDate(today.getDate() + 15); // Open-Meteo's forecast limit

  const year = today.getFullYear();
  const month = today.getMonth();
  const firstDayOfMonth = new Date(year, month, 1);
  const startWeekday = firstDayOfMonth.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const monthLabel = today.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  const weekdayLabels = ["S", "M", "T", "W", "T", "F", "S"];

  let html = `<div class="calendar-header">${monthLabel}</div>`;
  html += `<div class="calendar-grid">`;
  weekdayLabels.forEach((day) => {
    html += `<div class="calendar-weekday">${day}</div>`;
  });

  // Empty cells before the 1st of the month
  for (let i = 0; i < startWeekday; i++) {
    html += `<div class="calendar-day disabled"></div>`;
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const cellDate = new Date(year, month, day);
    const dateStr = formatDate(cellDate);
    const inRange = cellDate >= stripTime(minDate) && cellDate <= maxDate;
    const cssClass = inRange ? "calendar-day" : "calendar-day out-of-range";
    html += `<div class="${cssClass}" data-date="${dateStr}">${day}</div>`;
  }

  html += `</div>`;
  calendarDiv.innerHTML = html;

  // Attach click handlers only to selectable (in-range) days
  document.querySelectorAll(".calendar-day:not(.out-of-range):not(.disabled)").forEach((cell) => {
    cell.addEventListener("click", () => {
      document.querySelectorAll(".calendar-day").forEach((c) => c.classList.remove("selected"));
      cell.classList.add("selected");
      getWeatherForDate(cell.dataset.date);
    });
  });
}

function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function stripTime(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

// ---- Rendering ----

function renderWeather(data) {
  const { name, country, current, hourly, daily } = data;
  const info = weatherInfo[current.weathercode] || { desc: "Unknown", icon: "❓" };
  const temp = convertTemp(current.temperature_2m);
  const feelsLike = convertTemp(current.apparent_temperature);
  const locationLabel = country ? `${name}, ${country}` : name;
  const timeLabel = formatTime(current.time);

  resultDiv.innerHTML = `
    <div class="city-name">${locationLabel}</div>
    <div class="local-time">${timeLabel}</div>
    <div class="weather-icon">${info.icon}</div>
    <div class="temperature">${temp}°${currentUnit}</div>
    <div class="feels-like">Feels like ${feelsLike}°${currentUnit}</div>
    <div class="description">${info.desc}</div>
    <div class="details">Wind: ${current.wind_speed_10m} km/h</div>
  `;

  renderHourly(hourly, current.time);
  renderForecast(daily);
  renderSunMoon(daily);
  updateBackground(current.weathercode, current.is_day);
}

// Shows the next 12 hours as a horizontal scroll, starting from
// whichever hour is closest to "now" in the hourly.time array.
function renderHourly(hourly, currentTimeStr) {
  const hourlyDiv = document.getElementById("hourly");
  if (!hourly || !hourly.time) {
    hourlyDiv.innerHTML = "";
    return;
  }

  // Find the index in hourly.time that matches (or is just after) now,
  // so the scroll starts from the current hour, not midnight
  const currentTime = new Date(currentTimeStr).getTime();
  let startIndex = hourly.time.findIndex((t) => new Date(t).getTime() >= currentTime);
  if (startIndex === -1) startIndex = 0;

  const nextHours = hourly.time.slice(startIndex, startIndex + 12);

  hourlyDiv.innerHTML = nextHours.map((timeStr, i) => {
    const index = startIndex + i;
    const label = i === 0 ? "Now" : new Date(timeStr).toLocaleTimeString(undefined, { hour: "numeric" });
    const code = hourly.weathercode[index];
    const info = weatherInfo[code] || { icon: "❓" };
    const temp = convertTemp(hourly.temperature_2m[index]);

    return `
      <div class="hourly-item">
        <div class="hourly-time">${label}</div>
        <div class="hourly-icon">${info.icon}</div>
        <div class="hourly-temp">${temp}°</div>
      </div>
    `;
  }).join("");
}

// Sunrise/sunset from the API, plus a locally-calculated moon phase
// (no extra API call needed — just date math)
function renderSunMoon(daily) {
  const sunMoonDiv = document.getElementById("sunMoon");
  if (!daily || !daily.sunrise) {
    sunMoonDiv.innerHTML = "";
    return;
  }

  const sunrise = formatTime(daily.sunrise[0]);
  const sunset = formatTime(daily.sunset[0]);
  const moon = getMoonPhase(new Date());

  sunMoonDiv.innerHTML = `
    <div class="sun-moon-item">
      <div class="sm-icon">🌅</div>
      <div class="sm-label">Sunrise</div>
      <div class="sm-value">${sunrise}</div>
    </div>
    <div class="sun-moon-item">
      <div class="sm-icon">🌇</div>
      <div class="sm-label">Sunset</div>
      <div class="sm-value">${sunset}</div>
    </div>
    <div class="sun-moon-item">
      <div class="sm-icon">${moon.icon}</div>
      <div class="sm-label">Moon</div>
      <div class="sm-value">${moon.name}</div>
    </div>
  `;
}

// Simple moon phase calculation based on days since a known new moon.
// Not astronomically precise to the minute, but accurate to the day —
// no API call needed, so it costs zero data.
function getMoonPhase(date) {
  const knownNewMoon = new Date("2000-01-06T18:14:00Z").getTime();
  const lunarCycle = 29.53058867; // average days per lunar cycle
  const daysSince = (date.getTime() - knownNewMoon) / (1000 * 60 * 60 * 24);
  const phase = (daysSince % lunarCycle) / lunarCycle; // 0 to 1

  const phases = [
    { max: 0.03, name: "New Moon", icon: "🌑" },
    { max: 0.22, name: "Waxing Crescent", icon: "🌒" },
    { max: 0.28, name: "First Quarter", icon: "🌓" },
    { max: 0.47, name: "Waxing Gibbous", icon: "🌔" },
    { max: 0.53, name: "Full Moon", icon: "🌕" },
    { max: 0.72, name: "Waning Gibbous", icon: "🌖" },
    { max: 0.78, name: "Last Quarter", icon: "🌗" },
    { max: 0.97, name: "Waning Crescent", icon: "🌘" },
    { max: 1, name: "New Moon", icon: "🌑" }
  ];

  return phases.find((p) => phase <= p.max);
}

// Converts the API's time string (e.g. "2026-08-27T14:30") into a
// readable 12-hour clock with AM/PM, e.g. "2:30 PM"
function formatTime(isoString) {
  const date = new Date(isoString);
  return date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true
  });
}

// Changes the page background to match the current weather + time of day.
// current.is_day comes straight from the API: 1 = daytime, 0 = night.
function updateBackground(weathercode, isDay) {
  let mood = "clear-day";

  if (isDay === 0) {
    mood = "night";
  } else if ([61, 63, 65, 66, 67, 80, 81, 82].includes(weathercode)) {
    mood = "rain";
  } else if ([71, 73, 75, 77, 85, 86].includes(weathercode)) {
    mood = "snow";
  } else if ([95, 96, 99].includes(weathercode)) {
    mood = "storm";
  } else if ([45, 48].includes(weathercode)) {
    mood = "fog";
  } else if ([2, 3].includes(weathercode)) {
    mood = "cloudy";
  } else {
    mood = "clear-day";
  }

  // Remove any previous mood class, then add the current one.
  // The actual gradients live in CSS, keyed off these class names.
  document.body.classList.remove(
    "weather-clear-day", "weather-night", "weather-rain",
    "weather-snow", "weather-storm", "weather-fog", "weather-cloudy"
  );
  document.body.classList.add(`weather-${mood}`);
}

function renderForecast(daily) {
  if (!daily || !daily.time) {
    forecastDiv.innerHTML = "";
    return;
  }

  const today = stripTime(new Date());
  const todayStr = formatDate(new Date());

  forecastDiv.innerHTML = daily.time.map((dateStr, i) => {
    const date = new Date(dateStr);
    const isToday = dateStr === todayStr;
    const isPast = stripTime(date) < today;
    const dayLabel = isToday
      ? "Today"
      : date.toLocaleDateString(undefined, { weekday: "short" });
    const dateLabel = date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    const code = daily.weathercode[i];
    const info = weatherInfo[code] || { icon: "❓" };
    const high = convertTemp(daily.temperature_2m_max[i]);
    const low = convertTemp(daily.temperature_2m_min[i]);

    let cssClass = "forecast-day";
    if (isToday) cssClass += " forecast-today";
    if (isPast) cssClass += " forecast-past";

    return `
      <div class="${cssClass}">
        <div class="day-label">${dayLabel}</div>
        <div class="day-date">${dateLabel}</div>
        <div class="day-icon">${info.icon}</div>
        <div class="day-temps">
          <span class="high">${high}°</span> <span class="low">${low}°</span>
        </div>
      </div>
    `;
  }).join("");
}

// ---- Helpers ----

function convertTemp(celsius) {
  if (currentUnit === "F") {
    return Math.round((celsius * 9) / 5 + 32);
  }
  return Math.round(celsius);
}

function showLoading() {
  resultDiv.innerHTML = `<p class="placeholder">Loading...</p>`;
  forecastDiv.innerHTML = "";
}

function showError(message) {
  resultDiv.innerHTML = `<p class="error">${message}</p>`;
  forecastDiv.innerHTML = "";
}

// ---- Recent searches (localStorage) ----

function getRecentSearches() {
  const stored = localStorage.getItem("recentCities");
  return stored ? JSON.parse(stored) : [];
}

function saveRecentSearch(city) {
  let recent = getRecentSearches();
  // Remove duplicate if it already exists, then add to front
  recent = recent.filter((c) => c.toLowerCase() !== city.toLowerCase());
  recent.unshift(city);
  recent = recent.slice(0, 4); // keep only the last 4
  localStorage.setItem("recentCities", JSON.stringify(recent));
  renderRecentSearches();
}

function renderRecentSearches() {
  const recent = getRecentSearches();
  recentDiv.innerHTML = recent
    .map((city) => `<span class="recent-chip">${city}</span>`)
    .join("");

  // Attach click listeners to each chip so clicking re-searches that city
  document.querySelectorAll(".recent-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      cityInput.value = chip.textContent;
      getWeatherByCity(chip.textContent);
    });
  });
}

// Load recent searches on page load
renderRecentSearches();

// ---- Popular cities quick-select ----

function renderPopularCities() {
  popularCitiesDiv.innerHTML = popularCities
    .map((city) => `<span class="popular-chip">${city.name}</span>`)
    .join("");

  document.querySelectorAll(".popular-chip").forEach((chip, index) => {
    chip.addEventListener("click", () => {
      const city = popularCities[index];
      cityInput.value = city.name;
      // Skip geocoding entirely since we already have coordinates —
      // loads instantly instead of making an extra API call
      fetchAndRender(city.lat, city.lon, city.name, city.country);
      saveRecentSearch(city.name);
    });
  });
}

renderPopularCities();