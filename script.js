const header = document.querySelector(".site-header");
const progressBar = document.querySelector(".reading-progress-bar");
const menuButton = document.querySelector(".menu-button");
const mobileNav = document.querySelector(".mobile-nav");
const mobileNavLinks = document.querySelectorAll(".mobile-nav-link");
const desktopNavLinks = [...document.querySelectorAll(".desktop-nav-link")];
const currentYear = document.querySelector("#current-year");
const isEnglishPage = document.documentElement.lang === "en";

function closeMenu() {
  mobileNav.classList.remove("open");
  menuButton.setAttribute("aria-expanded", "false");
  menuButton.setAttribute("aria-label", isEnglishPage ? "Open menu" : "打开菜单");
  document.body.classList.remove("menu-open");
}

function toggleMenu() {
  const willOpen = !mobileNav.classList.contains("open");
  mobileNav.classList.toggle("open", willOpen);
  menuButton.setAttribute("aria-expanded", String(willOpen));
  menuButton.setAttribute(
    "aria-label",
    willOpen
      ? (isEnglishPage ? "Close menu" : "关闭菜单")
      : (isEnglishPage ? "Open menu" : "打开菜单"),
  );
  document.body.classList.toggle("menu-open", willOpen);
}

function updateReadingProgress() {
  const pageHeight = document.documentElement.scrollHeight - window.innerHeight;
  const progress = pageHeight > 0 ? (window.scrollY / pageHeight) * 100 : 0;
  progressBar.style.width = `${progress}%`;
}

const observedSections = desktopNavLinks
  .map((link) => document.querySelector(link.getAttribute("href")))
  .filter(Boolean);

function updateActiveNavigation() {
  if (!observedSections.length) return;

  const marker = window.scrollY + header.offsetHeight + Math.min(window.innerHeight * 0.22, 160);
  let activeSection = observedSections[0];

  observedSections.forEach((section) => {
    if (section.offsetTop <= marker) activeSection = section;
  });

  desktopNavLinks.forEach((link) => {
    link.classList.toggle("active", link.getAttribute("href") === `#${activeSection.id}`);
  });
}

const revealObserver = new IntersectionObserver(
  (entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.style.transitionDelay = `${entry.target.dataset.delay || 0}ms`;
      entry.target.classList.add("visible");
      observer.unobserve(entry.target);
    });
  },
  { threshold: 0.12 },
);

document.querySelectorAll(".reveal").forEach((element) => {
  revealObserver.observe(element);
});

menuButton.addEventListener("click", toggleMenu);
mobileNavLinks.forEach((link) => link.addEventListener("click", closeMenu));

desktopNavLinks.forEach((link) => {
  link.addEventListener("click", () => {
    desktopNavLinks.forEach((item) => item.classList.remove("active"));
    link.classList.add("active");
  });
});

window.addEventListener(
  "scroll",
  () => {
    updateReadingProgress();
    updateActiveNavigation();
  },
  { passive: true },
);

window.addEventListener("resize", () => {
  if (window.innerWidth > 820) closeMenu();
  updateActiveNavigation();
});

currentYear.textContent = new Date().getFullYear();
updateReadingProgress();
updateActiveNavigation();
