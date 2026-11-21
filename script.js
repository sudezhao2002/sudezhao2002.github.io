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

// 列表先显示 WebP 缩略图；四张缩略图就绪后，自动在后台缓存 COS 高清原图。
const publicationImageLinks = [...document.querySelectorAll(".publication-image-link")];
const publicationFullImages = new Map();
const publicationThumbnailsReady = Promise.all(publicationImageLinks.map((link) => {
  const thumbnail = link.querySelector("img");
  return new Promise((resolve) => {
    const finish = () => {
      if (thumbnail.naturalWidth > 0) thumbnail.decode().catch(() => {}).then(resolve);
      else resolve();
    };
    if (thumbnail.complete) finish();
    else {
      thumbnail.addEventListener("load", finish, { once: true });
      thumbnail.addEventListener("error", finish, { once: true });
    }
  });
}));

function loadPublicationFullImage(url, priority = "low") {
  const existing = publicationFullImages.get(url);
  if (existing) {
    if (priority === "high") existing.image.fetchPriority = "high";
    return existing;
  }

  const entry = { image: new Image(), ready: false, promise: null };
  entry.image.decoding = "async";
  entry.image.fetchPriority = priority;
  entry.promise = new Promise((resolve) => {
    entry.image.onload = async () => {
      try {
        await entry.image.decode();
        entry.ready = true;
        resolve(true);
      } catch {
        resolve(false);
      }
    };
    entry.image.onerror = () => resolve(false);
  });
  publicationFullImages.set(url, entry);
  entry.image.src = url;
  return entry;
}

publicationThumbnailsReady.then(() => {
  publicationImageLinks.forEach((link) => loadPublicationFullImage(link.href));
});

// 论文大图：原生 dialog 提供 Esc 关闭和键盘焦点限制。
const imageViewer = document.querySelector(".image-viewer");
const imageViewerImage = document.querySelector(".image-viewer-image");
const imageViewerClose = document.querySelector(".image-viewer-close");
const imageViewerStatus = document.querySelector(".image-viewer-status");
let imageViewerTrigger = null;
let imageViewerRequestId = 0;
let imageViewerScale = 1;
let imageViewerX = 0;
let imageViewerY = 0;
let imageViewerGestureMoved = false;
let imageViewerBackdropPress = false;
const imageViewerPointers = new Map();

function updateImageViewerTransform() {
  imageViewerImage.style.transform = `translate(${imageViewerX}px, ${imageViewerY}px) scale(${imageViewerScale})`;
}

function resetImageViewer() {
  imageViewerScale = 1;
  imageViewerX = 0;
  imageViewerY = 0;
  imageViewerGestureMoved = false;
  imageViewerBackdropPress = false;
  imageViewerPointers.forEach((point, id) => {
    if (imageViewer.hasPointerCapture(id)) imageViewer.releasePointerCapture(id);
  });
  imageViewerPointers.clear();
  imageViewer.classList.remove("dragging");
  updateImageViewerTransform();
}

// 缩放范围：初始显示大小的 0.5～8 倍，以鼠标或双指中心为缩放中心。
function zoomImageViewer(scale, clientX, clientY) {
  const nextScale = Math.max(0.5, Math.min(8, scale));
  const ratio = nextScale / imageViewerScale;
  const rect = imageViewerImage.getBoundingClientRect();
  const offsetX = clientX - (rect.left + rect.width / 2);
  const offsetY = clientY - (rect.top + rect.height / 2);
  imageViewerX += offsetX * (1 - ratio);
  imageViewerY += offsetY * (1 - ratio);
  imageViewerScale = nextScale;
  updateImageViewerTransform();
}

function getImageViewerPinch() {
  const [first, second] = [...imageViewerPointers.values()];
  return {
    x: (first.x + second.x) / 2,
    y: (first.y + second.y) / 2,
    distance: Math.hypot(first.x - second.x, first.y - second.y),
  };
}

// 按高清图比例固定预览尺寸，缩略图切换为原图时不跳动，并保留拖动和缩放状态。
function fitImageViewer() {
  if (!imageViewer.open || !imageViewerTrigger) return;
  const thumbnail = imageViewerTrigger.querySelector("img");
  const width = Number(thumbnail.getAttribute("width")) || thumbnail.naturalWidth;
  const height = Number(thumbnail.getAttribute("height")) || thumbnail.naturalHeight;
  const padding = getComputedStyle(imageViewer);
  const availableWidth = imageViewer.clientWidth - parseFloat(padding.paddingLeft) - parseFloat(padding.paddingRight);
  const availableHeight = imageViewer.clientHeight - parseFloat(padding.paddingTop) - parseFloat(padding.paddingBottom);
  const scale = Math.min(1, availableWidth / width, availableHeight / height);
  imageViewerImage.style.width = `${width * scale}px`;
  imageViewerImage.style.height = `${height * scale}px`;
}

window.addEventListener("resize", fitImageViewer);

publicationImageLinks.forEach((link) => {
  link.addEventListener("click", (event) => {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    if (!imageViewer || typeof imageViewer.showModal !== "function") return;

    event.preventDefault();
    resetImageViewer();
    const requestId = ++imageViewerRequestId;
    const thumbnail = link.querySelector("img");
    const cached = publicationFullImages.get(link.href);
    imageViewerTrigger = link;
    imageViewerImage.src = cached?.ready ? link.href : thumbnail.currentSrc || thumbnail.src;
    imageViewerImage.alt = thumbnail.alt;
    imageViewerStatus.hidden = Boolean(cached?.ready);
    imageViewerStatus.textContent = isEnglishPage ? "Loading high-resolution image…" : "正在加载高清图…";
    document.body.classList.add("image-viewer-open");
    imageViewer.showModal();
    fitImageViewer();

    if (!cached?.ready) {
      publicationThumbnailsReady
        .then(() => loadPublicationFullImage(link.href, "high").promise)
        .then((loaded) => {
          if (!imageViewer.open || requestId !== imageViewerRequestId) return;
          if (loaded) {
            imageViewerImage.src = link.href;
            imageViewerStatus.hidden = true;
          } else {
            imageViewerStatus.textContent = isEnglishPage
              ? "High-resolution image unavailable; showing preview."
              : "高清图暂时无法加载，当前显示预览图。";
          }
        });
    }
  });
});

imageViewerClose.addEventListener("click", () => imageViewer.close());
imageViewer.addEventListener("click", (event) => {
  if (event.target === imageViewer && imageViewerBackdropPress && !imageViewerGestureMoved) {
    imageViewer.close();
  }
});

imageViewer.addEventListener("wheel", (event) => {
  event.preventDefault();
  const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? imageViewer.clientHeight : 1);
  zoomImageViewer(imageViewerScale * Math.exp(-delta * 0.0015), event.clientX, event.clientY);
}, { passive: false });

imageViewer.addEventListener("pointerdown", (event) => {
  if (imageViewerClose.contains(event.target) || event.button !== 0) return;
  if (imageViewerPointers.size === 0) {
    imageViewerGestureMoved = false;
    imageViewerBackdropPress = event.target === imageViewer;
  } else {
    imageViewerGestureMoved = true;
  }
  imageViewerPointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
  imageViewer.setPointerCapture(event.pointerId);
  imageViewer.classList.add("dragging");
});

imageViewer.addEventListener("pointermove", (event) => {
  const previous = imageViewerPointers.get(event.pointerId);
  if (!previous) return;
  const pinchBefore = imageViewerPointers.size === 2 ? getImageViewerPinch() : null;
  imageViewerPointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

  if (pinchBefore) {
    const pinchAfter = getImageViewerPinch();
    if (pinchBefore.distance > 0 && pinchAfter.distance > 0) {
      zoomImageViewer(imageViewerScale * pinchAfter.distance / pinchBefore.distance, pinchBefore.x, pinchBefore.y);
    }
    imageViewerX += pinchAfter.x - pinchBefore.x;
    imageViewerY += pinchAfter.y - pinchBefore.y;
    imageViewerGestureMoved = true;
  } else if (imageViewerPointers.size === 1) {
    const dx = event.clientX - previous.x;
    const dy = event.clientY - previous.y;
    imageViewerX += dx;
    imageViewerY += dy;
    if (Math.abs(dx) + Math.abs(dy) > 1) imageViewerGestureMoved = true;
  }
  updateImageViewerTransform();
});

function endImageViewerPointer(event) {
  imageViewerPointers.delete(event.pointerId);
  if (imageViewerPointers.size === 0) imageViewer.classList.remove("dragging");
}

imageViewer.addEventListener("pointerup", endImageViewerPointer);
imageViewer.addEventListener("pointercancel", endImageViewerPointer);
imageViewer.addEventListener("lostpointercapture", endImageViewerPointer);
imageViewer.addEventListener("close", () => {
  imageViewerRequestId++;
  resetImageViewer();
  document.body.classList.remove("image-viewer-open");
  imageViewerImage.removeAttribute("src");
  imageViewerStatus.hidden = true;
  imageViewerTrigger?.focus({ preventScroll: true });
});
