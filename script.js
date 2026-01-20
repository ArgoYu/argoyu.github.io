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
