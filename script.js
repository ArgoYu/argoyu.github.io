const revealItems = document.querySelectorAll("[data-reveal]");

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

<<<<<<< HEAD
  revealItems.forEach((item) => observer.observe(item));
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
=======
const observeReveal = (element) => {
  if (element) {
    observer.observe(element);
  }
};

revealItems.forEach((item) => observeReveal(item));

// Replace these placeholder paths with your own images in assets/photos.
const photoData = [
  {
    src: "assets/photos/drone_01.jpg",
    title: "Golden Hour Over the River",
    caption: "Taipei, 2023. Warm light skimming the water.",
    tags: ["Drone", "Landscape"],
    details: {
      gear: "DJI Mini 3 Pro",
      location: "Taipei, Taiwan",
      settings: "ISO 100, f/1.7, 1/320s",
    },
  },
  {
    src: "assets/photos/drone_02.jpg",
    title: "Harbor Lines at Dawn",
    caption: "Kaohsiung, 2022. Morning geometry and mist.",
    tags: ["Drone", "City"],
    details: {
      gear: "DJI Air 2S",
      location: "Kaohsiung, Taiwan",
    },
  },
  {
    src: "assets/photos/street_01.jpg",
    title: "Neon Crosswalk",
    caption: "Tokyo, 2023. Nightfall in motion.",
    tags: ["Street", "City"],
    details: {
      gear: "Fujifilm X-T4",
      location: "Tokyo, Japan",
      settings: "ISO 800, f/2.8, 1/125s",
    },
  },
  {
    src: "assets/photos/travel_01.jpg",
    title: "Fog Over the Ridge",
    caption: "Alishan, 2021. Layers of quiet in the hills.",
    tags: ["Travel", "Landscape"],
    details: {
      gear: "Sony A7C",
      location: "Alishan, Taiwan",
    },
  },
  {
    src: "assets/photos/street_02.jpg",
    title: "Old Street Patterns",
    caption: "Tainan, 2022. Texture study on brick and light.",
    tags: ["Street", "Travel"],
    details: {
      gear: "Ricoh GR III",
      location: "Tainan, Taiwan",
    },
  },
  {
    src: "assets/photos/travel_02.jpg",
    title: "Coastal Switchbacks",
    caption: "Hualien, 2023. Leading lines toward the sea.",
    tags: ["Travel", "Drone"],
    details: {
      gear: "DJI Mini 3 Pro",
      location: "Hualien, Taiwan",
    },
  },
];

const gallery = document.querySelector("[data-gallery]");
const filterButtons = document.querySelectorAll("[data-filter]");
const lightbox = document.querySelector("#photo-lightbox");
const lightboxImage = document.querySelector("[data-lightbox-image]");
const lightboxTitle = document.querySelector("#lightbox-title");
const lightboxCaption = document.querySelector(".lightbox-caption");
const lightboxDetails = document.querySelector("[data-lightbox-details]");
const lightboxMedia = document.querySelector(".lightbox-media");
const lightboxPlaceholder = document.querySelector("[data-lightbox-placeholder]");

const detailLabels = {
  gear: "Gear",
  location: "Location",
  settings: "Settings",
  year: "Year",
};

let activeFilter = null;

const buildDetailItem = (label, value) => {
  const detail = document.createElement("div");
  detail.className = "detail-item";

  const detailLabel = document.createElement("span");
  detailLabel.className = "detail-label";
  detailLabel.textContent = label;

  const detailValue = document.createElement("span");
  detailValue.className = "detail-value";
  detailValue.textContent = value;

  detail.append(detailLabel, detailValue);
  return detail;
};

const openLightbox = (photo) => {
  if (!lightbox || !lightboxImage || !lightboxMedia) {
    return;
  }

  lightboxTitle.textContent = photo.title;
  lightboxCaption.textContent = photo.caption;
  lightboxImage.alt = photo.title;
  lightboxMedia.classList.remove("has-image");
  lightboxImage.src = photo.src;
  if (lightboxPlaceholder) {
    lightboxPlaceholder.textContent = photo.title;
  }

  lightboxDetails.innerHTML = "";
  const details = photo.details || {};
  Object.entries(details).forEach(([key, value]) => {
    if (!value) {
      return;
    }
    const label = detailLabels[key] || key;
    lightboxDetails.append(buildDetailItem(label, value));
  });
  lightboxDetails.style.display = lightboxDetails.childElementCount ? "grid" : "none";

  lightbox.classList.add("is-open");
  lightbox.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
};

const closeLightbox = () => {
  if (!lightbox) {
    return;
  }
  lightbox.classList.remove("is-open");
  lightbox.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
  if (lightboxImage) {
    lightboxImage.removeAttribute("src");
  }
};

const createPhotoCard = (photo) => {
  const card = document.createElement("article");
  card.className = "photo-card";
  card.setAttribute("role", "button");
  card.setAttribute("tabindex", "0");
  card.setAttribute("data-reveal", "");

  const thumb = document.createElement("div");
  thumb.className = "photo-thumb";

  const placeholder = document.createElement("div");
  placeholder.className = "photo-placeholder";
  placeholder.textContent = photo.title;

  const image = document.createElement("img");
  image.src = photo.src;
  image.alt = photo.title;
  image.loading = "lazy";
  image.addEventListener("load", () => {
    thumb.classList.add("has-image");
  });
  image.addEventListener("error", () => {
    thumb.classList.remove("has-image");
  });

  thumb.append(placeholder, image);

  const meta = document.createElement("div");
  meta.className = "photo-meta";

  const title = document.createElement("h3");
  title.textContent = photo.title;

  const caption = document.createElement("p");
  caption.textContent = photo.caption;

  const tags = document.createElement("div");
  tags.className = "photo-tags";

  (photo.tags || []).forEach((tag) => {
    const tagEl = document.createElement("span");
    tagEl.className = "photo-tag";
    tagEl.textContent = tag;
    tags.append(tagEl);
  });

  meta.append(title, caption, tags);
  card.append(thumb, meta);

  const handleOpen = () => openLightbox(photo);
  card.addEventListener("click", handleOpen);
  card.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleOpen();
    }
  });

  return card;
};

const renderGallery = () => {
  if (!gallery) {
    return;
  }

  gallery.innerHTML = "";
  const visiblePhotos = activeFilter
    ? photoData.filter((photo) => (photo.tags || []).includes(activeFilter))
    : photoData;

  if (!visiblePhotos.length) {
    const empty = document.createElement("div");
    empty.className = "photo-empty";
    empty.textContent = "No photos match this album yet.";
    gallery.append(empty);
    return;
  }

  visiblePhotos.forEach((photo) => {
    const card = createPhotoCard(photo);
    gallery.append(card);
    observeReveal(card);
  });
};

const updateFilterButtons = () => {
  filterButtons.forEach((button) => {
    const isActive = button.dataset.filter === activeFilter;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", isActive ? "true" : "false");
  });
};

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const selectedFilter = button.dataset.filter || null;
    activeFilter = activeFilter === selectedFilter ? null : selectedFilter;
    updateFilterButtons();
    renderGallery();
  });
});

if (lightboxImage) {
  lightboxImage.addEventListener("load", () => {
    lightboxMedia.classList.add("has-image");
  });
  lightboxImage.addEventListener("error", () => {
    lightboxMedia.classList.remove("has-image");
  });
}

if (lightbox) {
  lightbox.addEventListener("click", (event) => {
    if (event.target.matches("[data-lightbox-close]")) {
      closeLightbox();
    }
  });
}

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && lightbox?.classList.contains("is-open")) {
    closeLightbox();
  }
});

renderGallery();
>>>>>>> 3928b48 (update)
