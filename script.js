const form = document.getElementById("searchForm");
const cityInput = document.getElementById("cityInput");

const nameEl = document.getElementById("name");
const tempEl = document.getElementById("temp");
const descEl = document.getElementById("text");
const windEl = document.getElementById("wind");
const iconEl = document.getElementById("icon");
const nowBox = document.getElementById("now");
const showDaysBtn = document.getElementById("showDays");

const msgEl = document.getElementById("msg");

const daysBox = document.getElementById("days");
const listEl = document.getElementById("list");

const unitBtn = document.getElementById("unit");
const posBtn = document.getElementById("position");

iconEl.style.display = "none";

const apiKey = "bff2ebc6bb6e75baeb7ecdf2aaa60f80";

const icon = {
  Clouds: "icon/cloudy.png",
  Fog: "icon/fog.png",
  Rain: "icon/rain.png",
  Snow: "icon/snow.png",
  Clear: "icon/sunny.png",
  Thunderstorm: "icon/thunderstorm.png",
  Tornado: "icon/tornado.png",
  Drizzle: "icon/drizzle.png",
};

let unit = "C";
let lastTemp = null;
let lastDaily = null;
let lastMode = "";

function showMessage(text) {
  msgEl.textContent = text;
}

function formatTemp(t) {
  if (unit === "C") return Math.round(t) + "°C";
  return Math.round(t * 1.8 + 32) + "°F";
}

function formatDay(dateStr) {
  const date = new Date(dateStr);
  {
    return date.toLocaleDateString("sv-SE", { weekday: "short" });
  }
}

form.addEventListener("submit", function (event) {
  event.preventDefault();
  const city = cityInput.value.trim();

  if (city === "") {
    msgEl.textContent = "Skriv in en stad.";
    return;
  }
  showMessage("Söker väder...");
  daysBox.classList.add("hide");
  iconEl.style.display = "none";

  getWeather(city);
});

async function getWeather(city) {
  const url =
    `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(
      city
    )}` + `&appid=${apiKey}&units=metric&lang=sv`;

  try {
    const res = await fetch(url);
    const data = await res.json();

    if (data.cod !== 200 && data.cod !== "200") {
      showMessage("Kunde inte hitta staden.");
      return;
    }
    updateUI(data);
    showMessage("");
  } catch (err) {
    showMessage("Något gick fel.");
  }
}

function updateUI(data) {
  const w = data.weather[0].main;

  nameEl.textContent = data.name;
  lastTemp = data.main.temp;
  tempEl.textContent = formatTemp(lastTemp);

  descEl.textContent = data.weather[0].description;
  windEl.textContent = "vind" + data.wind.speed + " m/s ";

  if (icon[w]) {
    iconEl.src = icon[w];
    iconEl.style.display = "block";
  }
  nowBox.classList.remove("hide");
  daysBox.classList.add("hide");
  showDaysBtn.classList.remove("hide");

  lastMode = "city";
}

unitBtn.addEventListener("click", function () {
  if (unit === "C") {
    unit = "F";
    unitBtn.textContent = "°C";
  } else {
    unit = "C";
    unitBtn.textContent = "°F";
  }

  if (lastMode === "city" && lastTemp !== null) {
    tempEl.textContent = formatTemp(lastTemp);
  }

  if (lastMode === "position" && lastDaily) {
    showDaily(lastDaily);
  }
});

posBtn.addEventListener("click", function () {
  if (!navigator.geolocation) {
    showMessage("Din webbläsare stödje inte Geolocation.");
    return;
  }
  showDaysBtn.classList.add("hide");
  nowBox.classList.add("hide");
  iconEl.style.display = "none";

  showMessage("Hämtar din position... ");
  navigator.geolocation.getCurrentPosition(showPosWeather, () =>
    showMessage(" Kunde inte hämta position.")
  );
});

async function showPosWeather(pos) {
  const lat = pos.coords.latitude;
  const lon = pos.coords.longitude;

  const url =
    `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}` +
    `&appid=${apiKey}&units=metric&lang=sv`;

  try {
    const res = await fetch(url);
    const data = await res.json();

    showDaily(data);
    showMessage("");
  } catch {
    showMessage("Kunde inte hitta prognos.");
  }
}

function showDaily(data) {
  daysBox.classList.remove("hide");
  listEl.innerHTML = "";

  lastDaily = data;
  lastMode = "position";

  let usedDays = {};

  for (let i = 0; i < data.list.length; i++) {
    const item = data.list[i];
    const date = item.dt_txt.split(" ")[0];

    if (!usedDays[date]) {
      usedDays[date] = item;
    }
  }

  const days = Object.values(usedDays).slice(0, 7);

  days.forEach((day) => {
    const li = document.createElement("li");

    const weekday = new Date(day.dt_txt).toLocaleDateString("sv-SE", {
      weekday: "short",
    });

    li.textContent =
      weekday +
      " - " +
      formatTemp(day.main.temp) +
      " - " +
      day.weather[0].description;

    listEl.appendChild(li);
  });
}

showDaysBtn.addEventListener("click", function () {
  showMessage("Hämtar 7-dagars prognos...");
  getDailyForecast(nameEl.textContent);
});

async function getDailyForecast(city) {
  const url =
    `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(
      city
    )}` + `&appid=${apiKey}&units=metric&lang=sv`;

  try {
    const res = await fetch(url);
    const data = await res.json();

    console.log("Forecast response:", data);

    if (data.cod !== 200 && data.cod !== "200") {
      showMessage("Kunde inte hitta prognos.");
      return;
    }

    showDaily(data);
    showMessage("");
  } catch {
    console.error(err);
    showMessage("Kunde inte hitta prognos.");
  }
}
