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
