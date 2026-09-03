// ============================================================
// WEATHER APP JAVASCRIPT
// ============================================================


// Constants
const MAX_RECENT_SEARCHES = 4;
const HOURLY_FORECAST_COUNT = 12;
const CALENDAR_PAST_DAYS = 7;
const CALENDAR_FUTURE_DAYS = 15;


// Weather code -> description + emoji icon
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



// ============================================================
// POPULAR CITIES
// ============================================================


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



// ============================================================
// ELEMENTS
// ============================================================


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
const hourlyDiv = document.getElementById("hourly");
const sunMoonDiv = document.getElementById("sunMoon");



// ============================================================
// STATE
// ============================================================


let lastWeatherData = null;
let currentUnit = "C";
let lastCoords = null;



// ============================================================
// EVENT LISTENERS
// ============================================================


searchBtn.addEventListener("click", () => {
  getWeatherByCity(cityInput.value.trim());
});


cityInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    getWeatherByCity(cityInput.value.trim());
  }
});



// Live location button
locationBtn.addEventListener("click", useMyLocation);



// Calendar
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



// Celsius / Fahrenheit toggle
unitToggle.addEventListener("click", () => {
  currentUnit = currentUnit === "C" ? "F" : "C";


  unitToggle.textContent = `°${currentUnit}`;


  if (lastWeatherData) {
    renderWeather(lastWeatherData);
  }
});



// ============================================================
// SEARCH WEATHER BY CITY
// ============================================================


async function getWeatherByCity(city) {


  if (city === "") {
    showError("Please enter a city name");
    return;
  }


  // Disable search button while loading
  searchBtn.disabled = true;
  searchBtn.textContent = "⏳";
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


    const {
      latitude,
      longitude,
      name,
      country
    } = geoData.results[0];


    await fetchAndRender(
      latitude,
      longitude,
      name,
      country
    );


    saveRecentSearch(name);


  } catch (error) {


    showError(
      "Something went wrong. Check your internet connection."
    );


    console.error(error);


  } finally {
    // Re-enable search button
    searchBtn.disabled = false;
    searchBtn.textContent = "Search";
  }
}



// ============================================================
// USE MY LIVE LOCATION
// ============================================================


function useMyLocation() {


  // Check whether browser supports geolocation
  if (!navigator.geolocation) {


    showError(
      "Geolocation is not supported by your browser."
    );


    return;
  }



  // Disable button while location is being found
  locationBtn.disabled = true;
  locationBtn.textContent = "📍 Finding you...";
  resultDiv.innerHTML = `
    <p class="placeholder">
      Getting your live location...
    </p>
  `;



  // Ask browser for current location
  navigator.geolocation.getCurrentPosition(


    // ========================================================
    // SUCCESS
    // ========================================================


    async (position) => {


      const latitude = position.coords.latitude;
      const longitude = position.coords.longitude;
      const accuracy = position.coords.accuracy;



      // Show coordinates in browser console
      console.log("Latitude:", latitude);
      console.log("Longitude:", longitude);
      console.log(
        "Accuracy:",
        Math.round(accuracy),
        "meters"
      );



      let placeName = "Your Location";
      let placeCountry = "";



      // ======================================================
      // REVERSE GEOCODING
      // Convert coordinates -> city/location name
      // ======================================================


      try {


        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`
        );



        if (!response.ok) {
          throw new Error(
            "Reverse geocoding request failed"
          );
        }



        const data = await response.json();


        const address = data.address || {};



        // Find the best available city/town name
        placeName =
          address.city ||
          address.town ||
          address.village ||
          address.municipality ||
          address.county ||
          address.state ||
          "Your Location";



        placeCountry =
          address.country || "";



      } catch (error) {


        console.error(
          "Could not determine place name:",
          error
        );


      }



      // ======================================================
      // GET WEATHER USING THE EXACT COORDINATES
      // ======================================================


      await fetchAndRender(
        latitude,
        longitude,
        placeName,
        placeCountry
      );



      // Reset button
      locationBtn.disabled = false;
      locationBtn.textContent =
        "📍 Use my location";


    },



    // ========================================================
    // LOCATION ERROR
    // ========================================================


    (error) => {


      console.error(
        "Geolocation error:",
        error
      );



      // Reset button
      locationBtn.disabled = false;
      locationBtn.textContent =
        "📍 Use my location";



      // Permission denied
      if (error.code === 1) {


        showError(
          "Location permission was denied. Please allow location access and try again."
        );


      }



      // Location unavailable
      else if (error.code === 2) {


        showError(
          "Your location could not be determined. Check your internet connection or location settings."
        );


      }



      // Timeout
      else if (error.code === 3) {


        showError(
          "Location is taking too long. Please try again."
        );


      }



      // Unknown error
      else {


        showError(
          "Unable to get your location. Please try again."
        );


      }


    },



    // ========================================================
    // LOCATION OPTIONS
    // ========================================================


    {
      enableHighAccuracy: true,


      // Give browser 60 seconds (mobile can be slower)
      timeout: 60000,


      // Accept location up to 5 minutes old (faster on mobile)
      maximumAge: 300000
    }


  );
}



// ============================================================
// FETCH WEATHER USING COORDINATES
// ============================================================


async function fetchAndRender(
  latitude,
  longitude,
  name,
  country
) {


  try {


    const weatherResponse = await fetch(


      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}` +


      `&current=temperature_2m,apparent_temperature,weathercode,is_day,wind_speed_10m` +


      `&hourly=temperature_2m,weathercode` +


      `&daily=weathercode,temperature_2m_max,temperature_2m_min,sunrise,sunset` +


      `&past_days=7&forecast_days=8` +


      `&timezone=auto`


    );



    if (!weatherResponse.ok) {
      throw new Error("Weather API request failed");
    }



    const weatherData =
      await weatherResponse.json();



    // Validate API response structure
    if (!weatherData.current || !weatherData.daily) {
      throw new Error("Invalid weather data structure");
    }



    // Store weather data
    lastWeatherData = {


      name,


      country,


      current: weatherData.current,


      hourly: weatherData.hourly,


      daily: weatherData.daily


    };



    // Store coordinates for calendar
    lastCoords = {


      latitude,


      longitude,


      name,


      country


    };



    // Display weather
    renderWeather(lastWeatherData);



  } catch (error) {


    showError(
      "Something went wrong fetching weather data."
    );


    console.error(error);
  }
}



// ============================================================
// WEATHER FOR SELECTED CALENDAR DATE
// ============================================================


async function getWeatherForDate(dateStr) {


  if (!lastCoords) {
    return;
  }



  showLoading();
  calendarDiv.classList.add("hidden");



  try {


    const {
      latitude,
      longitude,
      name,
      country
    } = lastCoords;



    const response = await fetch(


      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}` +


      `&daily=weathercode,temperature_2m_max,temperature_2m_min` +


      `&start_date=${dateStr}&end_date=${dateStr}&timezone=auto`


    );



    if (!response.ok) {
      throw new Error("Calendar weather request failed");
    }



    const data = await response.json();



    const code =
      data.daily.weathercode[0];
    const high =
      data.daily.temperature_2m_max[0];
    const low =
      data.daily.temperature_2m_min[0];



    const info =
      weatherInfo[code] ||
      {
        desc: "Unknown",
        icon: "❓"
      };



    const locationLabel =
      country
        ? `${name}, ${country}`
        : name;



    const readableDate =
      new Date(dateStr).toLocaleDateString(
        undefined,
        {
          weekday: "long",
          month: "short",
          day: "numeric"
        }
      );



    resultDiv.innerHTML = `


      <div class="city-name">
        ${locationLabel}
      </div>


      <div class="details">
        ${readableDate}
      </div>


      <div class="weather-icon">
        ${info.icon}
      </div>


      <div class="temperature">
        ${convertTemp(high)}° /
        ${convertTemp(low)}°${currentUnit}
      </div>


      <div class="feels-like">
        forecasted high / low — not a live reading
      </div>


      <div class="description">
        ${info.desc}
      </div>


      <p class="forecast-note" id="backToToday">
        ← Back to today
      </p>


    `;



    document
      .getElementById("backToToday")
      .addEventListener("click", () => {


        renderWeather(lastWeatherData);


      });



  } catch (error) {


    showError(
      "Couldn't get weather for that date."
    );


    console.error(error);
  }
}



// ============================================================
// CALENDAR
// ============================================================


function renderCalendar() {


  const today = new Date();



  const minDate = new Date();
  minDate.setDate(
    today.getDate() - CALENDAR_PAST_DAYS
  );



  const maxDate = new Date();
  maxDate.setDate(
    today.getDate() + CALENDAR_FUTURE_DAYS
  );



  const year =
    today.getFullYear();
  const month =
    today.getMonth();



  const firstDayOfMonth =
    new Date(
      year,
      month,
      1
    );



  const startWeekday =
    firstDayOfMonth.getDay();



  const daysInMonth =
    new Date(
      year,
      month + 1,
      0
    ).getDate();



  const monthLabel =
    today.toLocaleDateString(
      undefined,
      {
        month: "long",
        year: "numeric"
      }
    );



  const weekdayLabels = [
    "S",
    "M",
    "T",
    "W",
    "T",
    "F",
    "S"
  ];



  let html =
    `<div class="calendar-header">
      ${monthLabel}
    </div>`;



  html +=
    `<div class="calendar-grid">`;



  weekdayLabels.forEach((day) => {


    html += `
      <div class="calendar-weekday">
        ${day}
      </div>
    `;


  });



  // Empty cells before first day
  for (
    let i = 0;
    i < startWeekday;
    i++
  ) {


    html += `
      <div class="calendar-day disabled"></div>
    `;


  }



  // Days of month
  for (
    let day = 1;
    day <= daysInMonth;
    day++
  ) {


    const cellDate =
      new Date(
        year,
        month,
        day
      );



    const dateStr =
      formatDate(cellDate);



    const inRange =
      cellDate >= stripTime(minDate) &&
      cellDate <= maxDate;



    const cssClass =
      inRange
        ? "calendar-day"
        : "calendar-day out-of-range";



    html += `
      <div
        class="${cssClass}"
        data-date="${dateStr}"
        tabindex="${inRange ? '0' : '-1'}"
      >
        ${day}
      </div>
    `;


  }



  html += `</div>`;



  calendarDiv.innerHTML = html;



  // Add click events
  document
    .querySelectorAll(
      ".calendar-day:not(.out-of-range):not(.disabled)"
    )
    .forEach((cell) => {


      cell.addEventListener(
        "click",
        () => {


          document
            .querySelectorAll(".calendar-day")
            .forEach((c) =>
              c.classList.remove("selected")
            );



          cell.classList.add("selected");



          getWeatherForDate(
            cell.dataset.date
          );


        }
      );


    });


}



// ============================================================
// DATE HELPERS
// ============================================================


function formatDate(date) {


  const y =
    date.getFullYear();
  const m =
    String(
      date.getMonth() + 1
    ).padStart(2, "0");
  const d =
    String(
      date.getDate()
    ).padStart(2, "0");



  return `${y}-${m}-${d}`;
}



function stripTime(date) {


  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );


}



// ============================================================
// RENDER WEATHER
// ============================================================


function renderWeather(data) {


  const {
    name,
    country,
    current,
    hourly,
    daily
  } = data;



  const info =
    weatherInfo[current.weathercode] ||
    {
      desc: "Unknown",
      icon: "❓"
    };



  const temp =
    convertTemp(
      current.temperature_2m
    );



  const feelsLike =
    convertTemp(
      current.apparent_temperature
    );



  const locationLabel =
    country
      ? `${name}, ${country}`
      : name;



  const timeLabel =
    formatTime(current.time);



  resultDiv.innerHTML = `


    <div class="city-name">
      ${locationLabel}
    </div>


    <div class="local-time">
      ${timeLabel}
    </div>


    <div class="weather-icon">
      ${info.icon}
    </div>


    <div class="temperature">
      ${temp}°${currentUnit}
    </div>


    <div class="feels-like">
      Feels like ${feelsLike}°${currentUnit}
    </div>


    <div class="description">
      ${info.desc}
    </div>


    <div class="details">
      Wind: ${current.wind_speed_10m} km/h
    </div>


  `;



  renderHourly(
    hourly,
    current.time
  );



  renderForecast(daily);



  renderSunMoon(daily);



  updateBackground(
    current.weathercode,
    current.is_day
  );


}



// ============================================================
// HOURLY WEATHER
// ============================================================


function renderHourly(
  hourly,
  currentTimeStr
) {


  if (
    !hourly ||
    !hourly.time
  ) {


    hourlyDiv.innerHTML = "";
    return;
  }



  const currentTime =
    new Date(
      currentTimeStr
    ).getTime();



  let startIndex =
    hourly.time.findIndex(
      (t) =>
        new Date(t).getTime() >= currentTime
    );



  if (startIndex === -1) {
    startIndex = 0;
  }



  const nextHours =
    hourly.time.slice(
      startIndex,
      startIndex + HOURLY_FORECAST_COUNT
    );



  hourlyDiv.innerHTML =
    nextHours
      .map((timeStr, i) => {


        const index =
          startIndex + i;



        const label =
          i === 0
            ? "Now"
            : new Date(
                timeStr
              ).toLocaleTimeString(
                undefined,
                {
                  hour: "numeric"
                }
              );



        const code =
          hourly.weathercode[index];



        const info =
          weatherInfo[code] ||
          {
            icon: "❓"
          };



        const temp =
          convertTemp(
            hourly.temperature_2m[index]
          );



        return `


          <div class="hourly-item">


            <div class="hourly-time">
              ${label}
            </div>


            <div class="hourly-icon">
              ${info.icon}
            </div>


            <div class="hourly-temp">
              ${temp}°
            </div>


          </div>


        `;


      })
      .join("");


}



// ============================================================
// SUNRISE / SUNSET / MOON
// ============================================================


function renderSunMoon(daily) {


  if (
    !daily ||
    !daily.sunrise
  ) {


    sunMoonDiv.innerHTML = "";
    return;
  }



  const sunrise =
    formatTime(
      daily.sunrise[0]
    );



  const sunset =
    formatTime(
      daily.sunset[0]
    );



  const moon =
    getMoonPhase(
      new Date()
    );



  sunMoonDiv.innerHTML = `


    <div class="sun-moon-item">


      <div class="sm-icon">
        🌅
      </div>


      <div class="sm-label">
        Sunrise
      </div>


      <div class="sm-value">
        ${sunrise}
      </div>


    </div>



    <div class="sun-moon-item">


      <div class="sm-icon">
        🌇
      </div>


      <div class="sm-label">
        Sunset
      </div>


      <div class="sm-value">
        ${sunset}
      </div>


    </div>



    <div class="sun-moon-item">


      <div class="sm-icon">
        ${moon.icon}
      </div>


      <div class="sm-label">
        Moon
      </div>


      <div class="sm-value">
        ${moon.name}
      </div>


    </div>


  `;


}



// ============================================================
// MOON PHASE
// ============================================================


function getMoonPhase(date) {


  const knownNewMoon =
    new Date(
      "2000-01-06T18:14:00Z"
    ).getTime();



  const lunarCycle =
    29.53058867;



  const daysSince =
    (
      date.getTime() -
      knownNewMoon
    ) /
    (
      1000 *
      60 *
      60 *
      24
    );



  const phase =
    (
      daysSince %
      lunarCycle
    ) /
    lunarCycle;



  const phases = [


    {
      max: 0.03,
      name: "New Moon",
      icon: "🌑"
    },


    {
      max: 0.22,
      name: "Waxing Crescent",
      icon: "🌒"
    },


    {
      max: 0.28,
      name: "First Quarter",
      icon: "🌓"
    },


    {
      max: 0.47,
      name: "Waxing Gibbous",
      icon: "🌔"
    },


    {
      max: 0.53,
      name: "Full Moon",
      icon: "🌕"
    },


    {
      max: 0.72,
      name: "Waning Gibbous",
      icon: "🌖"
    },


    {
      max: 0.78,
      name: "Last Quarter",
      icon: "🌗"
    },


    {
      max: 0.97,
      name: "Waning Crescent",
      icon: "🌘"
    },


    {
      max: 1,
      name: "New Moon",
      icon: "🌑"
    }


  ];



  return phases.find(
    (p) => phase <= p.max
  );


}



// ============================================================
// FORMAT TIME
// ============================================================


function formatTime(isoString) {


  const date =
    new Date(isoString);



  return date.toLocaleTimeString(
    undefined,
    {
      hour: "numeric",
      minute: "2-digit",
      hour12: true
    }
  );


}



// ============================================================
// DYNAMIC WEATHER BACKGROUND
// ============================================================


function updateBackground(
  weathercode,
  isDay
) {


  let mood =
    "clear-day";



  if (isDay === 0) {


    mood = "night";


  }
  else if (
    [
      61,
      63,
      65,
      66,
      67,
      80,
      81,
      82
    ].includes(weathercode)
  ) {


    mood = "rain";


  }
  else if (
    [
      71,
      73,
      75,
      77,
      85,
      86
    ].includes(weathercode)
  ) {


    mood = "snow";


  }
  else if (
    [
      95,
      96,
      99
    ].includes(weathercode)
  ) {


    mood = "storm";


  }
  else if (
    [
      45,
      48
    ].includes(weathercode)
  ) {


    mood = "fog";


  }
  else if (
    [
      2,
      3
    ].includes(weathercode)
  ) {


    mood = "cloudy";


  }
  else {


    mood = "clear-day";


  }



  document.body.classList.remove(


    "weather-clear-day",
    "weather-night",
    "weather-rain",
    "weather-snow",
    "weather-storm",
    "weather-fog",
    "weather-cloudy"


  );



  document.body.classList.add(
    `weather-${mood}`
  );
}



// ============================================================
// DAILY FORECAST
// ============================================================


function renderForecast(daily) {


  if (
    !daily ||
    !daily.time
  ) {


    forecastDiv.innerHTML = "";
    return;
  }



  const today =
    stripTime(
      new Date()
    );



  const todayStr =
    formatDate(
      new Date()
    );



  forecastDiv.innerHTML =
    daily.time
      .map((dateStr, i) => {


        const date =
          new Date(dateStr);



        const isToday =
          dateStr === todayStr;



        const isPast =
          stripTime(date) < today;



        const dayLabel =
          isToday
            ? "Today"
            : date.toLocaleDateString(
                undefined,
                {
                  weekday: "short"
                }
              );



        const dateLabel =
          date.toLocaleDateString(
            undefined,
            {
              month: "short",
              day: "numeric"
            }
          );



        const code =
          daily.weathercode[i];



        const info =
          weatherInfo[code] ||
          {
            icon: "❓"
          };



        const high =
          convertTemp(
            daily.temperature_2m_max[i]
          );



        const low =
          convertTemp(
            daily.temperature_2m_min[i]
          );



        let cssClass =
          "forecast-day";



        if (isToday) {
          cssClass +=
            " forecast-today";
        }



        if (isPast) {
          cssClass +=
            " forecast-past";
        }



        return `


          <div class="${cssClass}">


            <div class="day-label">
              ${dayLabel}
            </div>


            <div class="day-date">
              ${dateLabel}
            </div>


            <div class="day-icon">
              ${info.icon}
            </div>


            <div class="day-temps">


              <span class="high">
                ${high}°
              </span>


              <span class="low">
                ${low}°
              </span>


            </div>


          </div>


        `;


      })
      .join("");


}



// ============================================================
// TEMPERATURE CONVERSION
// ============================================================


function convertTemp(celsius) {


  if (currentUnit === "F") {


    return Math.round(
      (celsius * 9) / 5 + 32
    );


  }



  return Math.round(celsius);


}



// ============================================================
// LOADING
// ============================================================


function showLoading() {


  resultDiv.innerHTML = `
    <p class="placeholder">
      Loading...
    </p>
  `;



  forecastDiv.innerHTML = "";
}



// ============================================================
// ERROR MESSAGE
// ============================================================


function showError(message) {


  resultDiv.innerHTML = `
    <p class="error">
      ${message}
    </p>
  `;



  forecastDiv.innerHTML = "";
}



// ============================================================
// RECENT SEARCHES
// ============================================================


function getRecentSearches() {


  const stored =
    localStorage.getItem(
      "recentCities"
    );



  return stored
    ? JSON.parse(stored)
    : [];


}



function saveRecentSearch(city) {


  let recent =
    getRecentSearches();



  // Remove duplicate
  recent =
    recent.filter(
      (c) =>
        c.toLowerCase() !==
        city.toLowerCase()
    );



  // Add newest city to front
  recent.unshift(city);



  // Keep last MAX_RECENT_SEARCHES
  recent =
    recent.slice(0, MAX_RECENT_SEARCHES);



  localStorage.setItem(
    "recentCities",
    JSON.stringify(recent)
  );



  renderRecentSearches();


}



function renderRecentSearches() {


  const recent =
    getRecentSearches();



  recentDiv.innerHTML =
    recent
      .map(
        (city) =>
          `<span class="recent-chip" tabindex="0">
            ${city}
          </span>`
      )
      .join("");



  document
    .querySelectorAll(
      ".recent-chip"
    )
    .forEach((chip) => {


      chip.addEventListener(
        "click",
        () => {


          cityInput.value =
            chip.textContent.trim();



          getWeatherByCity(
            chip.textContent.trim()
          );


        }
      );


    });


}



// ============================================================
// POPULAR CITIES
// ============================================================


function renderPopularCities() {


  popularCitiesDiv.innerHTML =
    popularCities
      .map(
        (city) =>
          `<span class="popular-chip" tabindex="0">
            ${city.name}
          </span>`
      )
      .join("");



  document
    .querySelectorAll(
      ".popular-chip"
    )
    .forEach(
      (chip, index) => {


        chip.addEventListener(
          "click",
          () => {


            const city =
              popularCities[index];



            cityInput.value =
              city.name;



            fetchAndRender(
              city.lat,
              city.lon,
              city.name,
              city.country
            );



            saveRecentSearch(
              city.name
            );


          }
        );


      }
    );


}



// ============================================================
// INITIALIZE APP
// ============================================================


renderRecentSearches();


renderPopularCities();

// ============================================================
// MANUAL LOCATION FALLBACK
// ============================================================

const showManualBtn = document.getElementById("showManualLocation");
const manualLocationBox = document.getElementById("manualLocationBox");
const manualLatInput = document.getElementById("manualLat");
const manualLonInput = document.getElementById("manualLon");
const manualLocationBtn = document.getElementById("manualLocationBtn");

if (showManualBtn) {
  showManualBtn.addEventListener("click", () => {
    manualLocationBox.style.display = 
      manualLocationBox.style.display === "none" ? "block" : "none";
  });
}

if (manualLocationBtn) {
  manualLocationBtn.addEventListener("click", async () => {
    const lat = parseFloat(manualLatInput.value);
    const lon = parseFloat(manualLonInput.value);

    if (isNaN(lat) || isNaN(lon)) {
      showError("Please enter valid coordinates");
      return;
    }

    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      showError("Invalid coordinates. Lat: -90 to 90, Lon: -180 to 180");
      return;
    }

    showLoading();
    await fetchAndRender(lat, lon, "Manual Location", "");
    saveRecentSearch(`Coords: ${lat.toFixed(2)}, ${lon.toFixed(2)}`);
  });
}
