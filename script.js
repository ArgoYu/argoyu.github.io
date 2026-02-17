const timePhases = ["dawn", "day", "dusk", "night"];
const weatherConditions = ["clear", "cloudy", "rain", "snow", "thunder", "fog"];

const weatherCodeGroups = {
  clear: [0, 1],
  cloudy: [2, 3],
  fog: [45, 48],
  rain: [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82],
  snow: [71, 73, 75, 77, 85, 86],
  thunder: [95, 96, 99],
};

const weatherConditionByCode = Object.entries(weatherCodeGroups).reduce(
  (map, [condition, codes]) => {
    codes.forEach((code) => {
      map[code] = condition;
    });
    return map;
  },
  {}
);

const searchParams = new URLSearchParams(window.location.search);
let isDevThemeEnabled =
  searchParams.get("dev-theme") === "1" ||
  searchParams.get("dev") === "1" ||
  searchParams.has("time") ||
  searchParams.has("weather");

const isValidTimePhase = (value) => timePhases.includes(value);
const isValidWeatherCondition = (value) => weatherConditions.includes(value);

const getValidatedParam = (key, validator) => {
  const value = searchParams.get(key);
  if (value === "auto") {
    return "auto";
  }
  return value && validator(value) ? value : "auto";
};

let liveTimePhase = "night";
let liveWeatherCondition = "clear";
let devThemeState = {
  time: getValidatedParam("time", isValidTimePhase),
  weather: getValidatedParam("weather", isValidWeatherCondition),
};
let devThemePanel = null;
let weatherFxLayer = null;

const getTimePhase = () => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 8) {
    return "dawn";
  }
  if (hour >= 8 && hour < 17) {
    return "day";
  }
  if (hour >= 17 && hour < 20) {
    return "dusk";
  }
  return "night";
};

const applyDynamicBackground = ({ timePhase, weatherCondition = "clear" }) => {
  document.body.setAttribute("data-time", timePhase);
  document.body.setAttribute("data-weather", weatherCondition);
  if (!weatherFxLayer) {
    weatherFxLayer = createWeatherFxLayer();
  }
  weatherFxLayer.setAttribute("data-weather", weatherCondition);
};

const createParticle = (className, styleVars) => {
  const particle = document.createElement("span");
  particle.className = className;
  Object.entries(styleVars).forEach(([key, value]) => {
    particle.style.setProperty(key, String(value));
  });
  return particle;
};

const createWeatherFxLayer = () => {
  const layer = document.createElement("div");
  layer.className = "weather-fx";
  layer.setAttribute("aria-hidden", "true");

  const rainLayer = document.createElement("div");
  rainLayer.className = "weather-fx-rain";
  for (let i = 0; i < 48; i += 1) {
    rainLayer.append(
      createParticle("weather-drop", {
        "--x": `${Math.random() * 100}%`,
        "--delay": `${Math.random() * 2.5}s`,
        "--duration": `${0.7 + Math.random() * 0.9}s`,
        "--len": `${12 + Math.random() * 16}px`,
      })
    );
  }

  const snowLayer = document.createElement("div");
  snowLayer.className = "weather-fx-snow";
  for (let i = 0; i < 34; i += 1) {
    snowLayer.append(
      createParticle("weather-flake", {
        "--x": `${Math.random() * 100}%`,
        "--delay": `${Math.random() * 6}s`,
        "--duration": `${5 + Math.random() * 6}s`,
        "--size": `${2 + Math.random() * 5}px`,
        "--drift": `${-30 + Math.random() * 60}px`,
      })
    );
  }

  const fogLayer = document.createElement("div");
  fogLayer.className = "weather-fx-fog";

  const cloudLayer = document.createElement("div");
  cloudLayer.className = "weather-fx-clouds";
  for (let i = 0; i < 8; i += 1) {
    cloudLayer.append(
      createParticle("weather-cloud", {
        "--top": `${8 + Math.random() * 28}%`,
        "--size": `${160 + Math.random() * 220}px`,
        "--delay": `${Math.random() * 8}s`,
        "--duration": `${20 + Math.random() * 18}s`,
      })
    );
  }

  const thunderLayer = document.createElement("div");
  thunderLayer.className = "weather-fx-thunder";

  layer.append(cloudLayer, fogLayer, rainLayer, snowLayer, thunderLayer);
  document.body.append(layer);
  return layer;
};

const getEffectiveTheme = () => ({
  timePhase: devThemeState.time === "auto" ? liveTimePhase : devThemeState.time,
  weatherCondition: devThemeState.weather === "auto" ? liveWeatherCondition : devThemeState.weather,
});

const renderDynamicBackground = () => {
  const effectiveTheme = getEffectiveTheme();
  applyDynamicBackground(effectiveTheme);
};

const fetchWeatherCondition = async (latitude, longitude) => {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(latitude));
  url.searchParams.set("longitude", String(longitude));
  url.searchParams.set("current", "weather_code");
  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error("weather request failed");
  }
  const data = await response.json();
  const weatherCode = Number(data?.current?.weather_code);
  return weatherConditionByCode[weatherCode] || "clear";
};

const getCurrentPosition = () =>
  new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("geolocation unsupported"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => resolve(position),
      () => reject(new Error("geolocation denied")),
      { timeout: 8000, maximumAge: 15 * 60 * 1000 }
    );
  });

const shouldFetchLiveWeather = () => devThemeState.weather === "auto";

const setBackgroundFromTimeAndWeather = async () => {
  liveTimePhase = getTimePhase();
  renderDynamicBackground();

  if (!shouldFetchLiveWeather()) {
    return;
  }

  try {
    const position = await getCurrentPosition();
    liveWeatherCondition = await fetchWeatherCondition(
      position.coords.latitude,
      position.coords.longitude
    );
    renderDynamicBackground();
  } catch {
    // Keep time-based background when location/weather lookup is unavailable.
  }
};

const setDevThemeState = (nextState) => {
  devThemeState = { ...devThemeState, ...nextState };
  renderDynamicBackground();
};

const syncDevThemeQuery = () => {
  const url = new URL(window.location.href);
  if (isDevThemeEnabled) {
    url.searchParams.set("dev-theme", "1");
    url.searchParams.set("time", devThemeState.time);
    url.searchParams.set("weather", devThemeState.weather);
  } else {
    url.searchParams.delete("dev-theme");
    url.searchParams.delete("time");
    url.searchParams.delete("weather");
  }
  window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
};

const buildDevThemePanel = () => {
  const panel = document.createElement("aside");
  panel.className = "dev-theme-panel";
  panel.setAttribute("aria-label", "Theme debug panel");

  const title = document.createElement("h3");
  title.textContent = "Theme Debug";

  const timeLabel = document.createElement("label");
  timeLabel.textContent = "Time";
  const timeSelect = document.createElement("select");
  const weatherLabel = document.createElement("label");
  weatherLabel.textContent = "Weather";
  const weatherSelect = document.createElement("select");

  const status = document.createElement("p");
  status.className = "dev-theme-status";

  const createOption = (value, label) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = label;
    return option;
  };

  timeSelect.append(createOption("auto", "Auto"));
  timePhases.forEach((phase) => timeSelect.append(createOption(phase, phase)));
  weatherSelect.append(createOption("auto", "Auto"));
  weatherConditions.forEach((condition) => weatherSelect.append(createOption(condition, condition)));

  timeSelect.value = devThemeState.time;
  weatherSelect.value = devThemeState.weather;

  const updateStatus = () => {
    const resolved = getEffectiveTheme();
    status.textContent = `Active: ${resolved.timePhase} / ${resolved.weatherCondition}`;
  };

  timeSelect.addEventListener("change", () => {
    setDevThemeState({ time: timeSelect.value });
    syncDevThemeQuery();
    updateStatus();
  });

  weatherSelect.addEventListener("change", () => {
    setDevThemeState({ weather: weatherSelect.value });
    if (weatherSelect.value === "auto") {
      setBackgroundFromTimeAndWeather();
    }
    syncDevThemeQuery();
    updateStatus();
  });

  const copyLinkButton = document.createElement("button");
  copyLinkButton.type = "button";
  copyLinkButton.textContent = "Copy Link";
  copyLinkButton.addEventListener("click", async () => {
    const debugUrl = new URL(window.location.href);
    debugUrl.searchParams.set("dev-theme", "1");
    debugUrl.searchParams.set("time", timeSelect.value);
    debugUrl.searchParams.set("weather", weatherSelect.value);
    try {
      await navigator.clipboard.writeText(debugUrl.toString());
      copyLinkButton.textContent = "Copied";
      setTimeout(() => {
        copyLinkButton.textContent = "Copy Link";
      }, 1200);
    } catch {
      copyLinkButton.textContent = "Copy Failed";
      setTimeout(() => {
        copyLinkButton.textContent = "Copy Link";
      }, 1400);
    }
  });

  const resetButton = document.createElement("button");
  resetButton.type = "button";
  resetButton.textContent = "Use Live";
  resetButton.addEventListener("click", () => {
    timeSelect.value = "auto";
    weatherSelect.value = "auto";
    setDevThemeState({ time: "auto", weather: "auto" });
    setBackgroundFromTimeAndWeather();
    syncDevThemeQuery();
    updateStatus();
  });

  const closeButton = document.createElement("button");
  closeButton.type = "button";
  closeButton.textContent = "Close";
  closeButton.addEventListener("click", () => {
    panel.remove();
    devThemePanel = null;
    isDevThemeEnabled = false;
    setDevThemeState({ time: "auto", weather: "auto" });
    syncDevThemeQuery();
    setBackgroundFromTimeAndWeather();
  });

  const actions = document.createElement("div");
  actions.className = "dev-theme-actions";
  actions.append(copyLinkButton, resetButton, closeButton);

  panel.append(title, timeLabel, timeSelect, weatherLabel, weatherSelect, status, actions);
  document.body.append(panel);
  updateStatus();
  return panel;
};

const openDevThemePanel = () => {
  if (devThemePanel) {
    return;
  }
  isDevThemeEnabled = true;
  devThemePanel = buildDevThemePanel();
  syncDevThemeQuery();
};

const buildDevThemeEntry = () => {
  const entryButton = document.createElement("button");
  entryButton.type = "button";
  entryButton.className = "dev-theme-entry";
  entryButton.textContent = "Theme QA";
  entryButton.setAttribute("aria-label", "Open theme debug panel");
  entryButton.addEventListener("click", openDevThemePanel);
  document.body.append(entryButton);
};

setBackgroundFromTimeAndWeather();
setInterval(setBackgroundFromTimeAndWeather, 20 * 60 * 1000);
setInterval(() => {
  liveTimePhase = getTimePhase();
  renderDynamicBackground();
}, 60 * 1000);

if (isDevThemeEnabled) {
  openDevThemePanel();
}
buildDevThemeEntry();

const revealItems = document.querySelectorAll("[data-reveal]");
let observeReveal = () => {};

if (revealItems.length > 0) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );

  observeReveal = (element) => {
    if (element) {
      observer.observe(element);
    }
  };

  revealItems.forEach((item) => observeReveal(item));
}

const resumeLink = document.querySelector("[data-resume]");

if (resumeLink) {
  fetch(resumeLink.getAttribute("href"), { method: "HEAD" })
    .then((response) => {
      if (!response.ok) {
        throw new Error("resume missing");
      }
    })
    .catch(() => {
      resumeLink.classList.add("is-disabled");
      resumeLink.setAttribute("aria-disabled", "true");
      resumeLink.setAttribute("title", "Resume available soon");
      resumeLink.addEventListener("click", (event) => event.preventDefault());
    });
}

const photoGrid = document.querySelector("[data-photo-grid]");

if (photoGrid) {
  const photoFilters = document.querySelector("[data-photo-filters]");
  const photoEmpty = document.querySelector("[data-photo-empty]");
  const lightbox = document.getElementById("photo-lightbox");
  const lightboxTitle = lightbox?.querySelector("#lightbox-title");
  const lightboxCaption = lightbox?.querySelector(".lightbox-caption");
  const lightboxMedia = lightbox?.querySelector(".lightbox-media");
  const lightboxImage = lightbox?.querySelector(".lightbox-media img");
  const lightboxClose = lightbox?.querySelector(".lightbox-close");
  const lightboxBackdrop = lightbox?.querySelector("[data-lightbox-close]");
  let lastActiveElement = null;

  const toText = (value) => (typeof value === "string" ? value.trim() : "");
  const toTags = (value) =>
    Array.isArray(value) ? value.map((tag) => String(tag).trim()).filter(Boolean) : [];

  const normalizePhotos = (data) => {
    const rawList = Array.isArray(data) ? data : Array.isArray(data?.photos) ? data.photos : [];
    return rawList
      .map((photo) => ({
        title: toText(photo?.title),
        caption: toText(photo?.caption),
        src: toText(photo?.src),
        alt: toText(photo?.alt),
        date: toText(photo?.date),
        location: toText(photo?.location),
        tags: toTags(photo?.tags),
      }))
      .filter((photo) => photo.title || photo.caption || photo.src || photo.tags.length > 0);
  };

  const setEmptyState = (message) => {
    if (photoEmpty) {
      photoEmpty.textContent = message;
      photoEmpty.hidden = false;
    }
  };

  const setDetail = (key, value) => {
    if (!lightbox) {
      return;
    }
    const detailItem = lightbox.querySelector(`[data-detail-item="${key}"]`);
    const detailValue = lightbox.querySelector(`[data-detail="${key}"]`);
    if (!detailItem || !detailValue) {
      return;
    }
    if (value) {
      detailValue.textContent = value;
      detailItem.hidden = false;
    } else {
      detailValue.textContent = "";
      detailItem.hidden = true;
    }
  };

  const setLightboxImage = (src, alt) => {
    if (!lightboxMedia || !lightboxImage) {
      return;
    }
    if (!src) {
      lightboxMedia.classList.remove("has-image");
      lightboxImage.removeAttribute("src");
      lightboxImage.setAttribute("alt", "");
      return;
    }
    lightboxImage.onload = () => lightboxMedia.classList.add("has-image");
    lightboxImage.onerror = () => {
      lightboxMedia.classList.remove("has-image");
      lightboxImage.removeAttribute("src");
      lightboxImage.setAttribute("alt", "");
    };
    lightboxImage.setAttribute("alt", alt || "Photo");
    lightboxImage.setAttribute("src", src);
  };

  const openLightbox = (photo) => {
    if (!lightbox) {
      return;
    }
    lastActiveElement = document.activeElement;
    lightbox.classList.add("is-open");
    lightbox.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
    if (lightboxTitle) {
      lightboxTitle.textContent = photo.title || "Untitled";
    }
    if (lightboxCaption) {
      if (photo.caption) {
        lightboxCaption.textContent = photo.caption;
        lightboxCaption.hidden = false;
      } else {
        lightboxCaption.textContent = "";
        lightboxCaption.hidden = true;
      }
    }
    setDetail("location", photo.location);
    setDetail("date", photo.date);
    setDetail("tags", photo.tags.join(", "));
    setLightboxImage(photo.src, photo.alt || photo.title);
    lightboxClose?.focus();
  };

  const closeLightbox = () => {
    if (!lightbox) {
      return;
    }
    lightbox.classList.remove("is-open");
    lightbox.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
    if (lastActiveElement instanceof HTMLElement) {
      lastActiveElement.focus();
    }
  };

  const buildPhotoCard = (photo) => {
    const card = document.createElement("article");
    card.className = "photo-card";
    card.setAttribute("tabindex", "0");
    card.setAttribute("role", "button");
    card.setAttribute("aria-label", photo.title ? `Open photo: ${photo.title}` : "Open photo");

    const thumb = document.createElement("div");
    thumb.className = "photo-thumb";
    const placeholder = document.createElement("div");
    placeholder.className = "photo-placeholder";
    placeholder.textContent = "Add Image";
    thumb.append(placeholder);

    if (photo.src) {
      const img = document.createElement("img");
      img.setAttribute("alt", photo.alt || photo.title || "Photo");
      img.addEventListener("load", () => thumb.classList.add("has-image"));
      img.addEventListener("error", () => {
        img.remove();
        thumb.classList.remove("has-image");
      });
      img.src = photo.src;
      thumb.append(img);
    }

    const meta = document.createElement("div");
    meta.className = "photo-meta";

    const title = document.createElement("h3");
    title.textContent = photo.title || "Untitled";
    meta.append(title);

    if (photo.caption) {
      const caption = document.createElement("p");
      caption.textContent = photo.caption;
      meta.append(caption);
    }

    if (photo.tags.length > 0) {
      const tags = document.createElement("div");
      tags.className = "photo-tags";
      photo.tags.forEach((tag) => {
        const tagEl = document.createElement("span");
        tagEl.className = "photo-tag";
        tagEl.textContent = tag;
        tags.append(tagEl);
      });
      meta.append(tags);
    }

    card.append(thumb, meta);

    const openHandler = () => openLightbox(photo);
    card.addEventListener("click", openHandler);
    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openHandler();
      }
    });

    return card;
  };

  const renderFilters = (tags, setActiveTag) => {
    if (!photoFilters) {
      return;
    }
    if (tags.length === 0) {
      photoFilters.hidden = true;
      return;
    }
    photoFilters.hidden = false;
    photoFilters.innerHTML = "";
    const allTags = ["All", ...tags];
    allTags.forEach((tag) => {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "chip";
      chip.textContent = tag;
      if (tag === "All") {
        chip.classList.add("is-active");
      }
      chip.addEventListener("click", () => setActiveTag(tag));
      photoFilters.append(chip);
    });
  };

  const updateActiveChip = (activeTag) => {
    if (!photoFilters) {
      return;
    }
    const chips = photoFilters.querySelectorAll(".chip");
    chips.forEach((chip) => {
      chip.classList.toggle("is-active", chip.textContent === activeTag);
    });
  };

  const renderGallery = (photos) => {
    if (!photoGrid) {
      return;
    }
    photoGrid.innerHTML = "";
    photos.forEach((photo) => photoGrid.append(buildPhotoCard(photo)));
  };

  fetch("photos.json")
    .then((response) => (response.ok ? response.json() : Promise.reject(new Error("missing"))))
    .then((data) => {
      const photos = normalizePhotos(data);
      if (photos.length === 0) {
        setEmptyState("Add your photos in photos.json to populate this gallery.");
        return;
      }
      const uniqueTags = Array.from(new Set(photos.flatMap((photo) => photo.tags))).sort();
      let activeTag = "All";

      const setActiveTag = (tag) => {
        activeTag = tag;
        updateActiveChip(activeTag);
        const filtered =
          activeTag === "All" ? photos : photos.filter((photo) => photo.tags.includes(activeTag));
        renderGallery(filtered);
        if (photoEmpty) {
          photoEmpty.hidden = filtered.length > 0;
        }
      };

      renderFilters(uniqueTags, setActiveTag);
      setActiveTag(activeTag);
    })
    .catch(() => {
      setEmptyState("Add your photos in photos.json to populate this gallery.");
    });

  if (lightboxClose) {
    lightboxClose.addEventListener("click", closeLightbox);
  }

  if (lightboxBackdrop) {
    lightboxBackdrop.addEventListener("click", closeLightbox);
  }

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && lightbox?.classList.contains("is-open")) {
      closeLightbox();
    }
  });
}
