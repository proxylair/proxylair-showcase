// ProxyLair public showcase (ADR-014). Vanilla JS, no framework, no
// server runtime, no dependency on HIRO/src/api -- reads two static
// JSON manifests (data/cards.json, data/site.json) written by HIRO's
// "Publish to Showcase" step. Shared verbatim across every page
// (index/gallery/process/watch/gear/about/contact/legal) -- every
// render function below is null-guarded so it's safe to include on a
// page that doesn't have the element it targets.

const el = (id) => document.getElementById(id);

function escapeHtml(s) {
  const div = document.createElement("div");
  div.textContent = s == null ? "" : String(s);
  return div.innerHTML;
}

let cardsData = [];
let siteData = {};

Promise.all([
  fetch("data/cards.json").then((r) => r.json()),
  fetch("data/site.json").then((r) => r.json()),
])
  .then(([cards, site]) => {
    cardsData = cards.cards || [];
    siteData = site;
    renderGallery();
    renderHero();
    renderProcessImages();
    renderWatch();
    renderGear();
    renderContact();
    renderContactDock();
    renderFooter();
  })
  .catch((err) => console.error("Failed to load showcase data:", err));

// ---------- Hero image (index.html only) ----------
// Absent/null hero.image leaves the original text-only hero untouched --
// this is expected pre-launch, not an error state.

function renderHero() {
  const bg = el("hero-bg");
  if (!bg) return;
  const image = siteData.hero && siteData.hero.image;
  if (!image) return;
  bg.style.setProperty("--hero-photo-url", `url("${image}")`);
  bg.classList.add("is-visible");
}

// ---------- Process step photos (process.html only) ----------
// Each step is a fixed slot keyed by position (1-8), matching the
// hardcoded step copy in process.html -- only the photo is data-driven.

function renderProcessImages() {
  const anyStepEl = document.querySelector(".process-step");
  if (!anyStepEl) return;
  const steps = siteData.process || [];
  steps.forEach((step) => {
    if (!step.image) return;
    const card = document.querySelector(`.process-step[data-step="${step.step}"]`);
    if (!card) return;
    const img = document.createElement("img");
    img.className = "process-step-image";
    img.src = step.image;
    img.alt = card.querySelector("h3")?.textContent || `Process step ${step.step}`;
    card.insertBefore(img, card.firstChild);
  });
}

// ---------- Gear (affiliate links, gear.html only) ----------

function renderGear() {
  const container = el("gear-links");
  if (!container) return;
  const links = siteData.affiliateLinks || [];
  if (!links.length) {
    container.innerHTML = '<p style="color:var(--ink-muted)">No links added yet.</p>';
    return;
  }
  container.innerHTML = links
    .map(
      (l) => `
    <a class="gear-link" href="${escapeHtml(l.url)}" target="_blank" rel="noopener sponsored">
      <div class="gear-label">${escapeHtml(l.label)}</div>
      ${l.note ? `<div class="gear-note">${escapeHtml(l.note)}</div>` : ""}
    </a>
  `
    )
    .join("");
}

// ---------- Gallery (flip cards, gallery.html only) ----------

function renderGallery() {
  const grid = el("gallery-grid");
  if (!grid) return;
  if (!cardsData.length) {
    grid.innerHTML = '<p style="color:var(--ink-muted)">No cards published yet.</p>';
    return;
  }
  grid.innerHTML = cardsData
    .map(
      (c, i) => `
    <div class="flip-card" style="--card-accent:${escapeHtml(c.accent || "#6d28d9")}" data-index="${i}">
      <span class="plate-number">Plate&nbsp;No.&nbsp;${String(i + 1).padStart(2, "0")}</span>
      <button class="card-expand-btn" data-index="${i}" aria-label="View details" type="button">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
          <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
        </svg>
      </button>
      <div class="flip-card-inner">
        <div class="flip-card-face flip-card-front">
          <img src="${escapeHtml(c.image)}" alt="${escapeHtml(c.title)}" />
          <div class="card-meta">
            <div class="title">${escapeHtml(c.title)}</div>
            <div class="sub">${escapeHtml(c.game)} · ${escapeHtml(c.style)}</div>
          </div>
        </div>
        <div class="flip-card-face flip-card-back">
          <img src="${escapeHtml(c.printImage || c.image)}" alt="${escapeHtml(c.title)} — finished print" />
          <div class="card-meta">
            <div class="title">Finished print</div>
            <div class="sub">Tap to flip back</div>
          </div>
        </div>
      </div>
    </div>
  `
    )
    .join("");

  grid.querySelectorAll(".flip-card").forEach((node) => {
    node.addEventListener("click", (e) => {
      if (e.target.closest(".card-expand-btn")) return;
      node.classList.toggle("is-flipped");
    });
  });
  grid.querySelectorAll(".card-expand-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const index = Number(btn.dataset.index);
      openLightbox(cardsData[index], index);
    });
  });
}

// ---------- Lightbox (per-card detail + "watch the build", gallery.html only) ----------

function openLightbox(card, index) {
  el("lightbox-image").src = card.printImage || card.image;
  el("lightbox-image").alt = card.title;
  el("lightbox-plate").textContent = `Plate No. ${String(index + 1).padStart(2, "0")}`;
  el("lightbox-title").textContent = card.title;
  el("lightbox-sub").textContent = `${card.game} · ${card.style}`;
  el("lightbox-caption").textContent = card.caption || "";

  const link = el("lightbox-watch-link");
  if (card.socialPostUrl) {
    link.href = card.socialPostUrl;
    link.style.display = "";
  } else {
    link.style.display = "none";
  }
  el("lightbox").classList.remove("hidden");
}

function closeLightbox() {
  el("lightbox").classList.add("hidden");
}

if (el("lightbox-close")) {
  el("lightbox-close").addEventListener("click", closeLightbox);
  el("lightbox").addEventListener("click", (e) => {
    if (e.target.id === "lightbox") closeLightbox();
  });
}

// ---------- Watch / content hub (watch.html only) ----------
// featuredVideos entries look like { id, platform, url }. Only a plain
// public post URL is needed per video -- the embeddable iframe src is
// derived here so nobody has to hand-write embed codes. Platform label
// is just the platform name (no per-video titles) -- matches the "no
// catchy titles" requirement directly.

const PLATFORM_LABELS = {
  youtube: "YouTube",
  instagram: "Instagram",
  tiktok: "TikTok",
  facebook: "Facebook",
};

function derivePlatform(url) {
  if (/tiktok\.com/i.test(url)) return "tiktok";
  if (/instagram\.com/i.test(url)) return "instagram";
  if (/(youtube\.com|youtu\.be)/i.test(url)) return "youtube";
  if (/facebook\.com/i.test(url)) return "facebook";
  return null;
}

function deriveEmbed(url, platform) {
  if (platform === "youtube") {
    const m = url.match(/(?:youtube\.com\/(?:shorts\/|watch\?v=|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/);
    if (!m) return null;
    return { src: `https://www.youtube.com/embed/${m[1]}`, vertical: /\/shorts\//.test(url) };
  }
  // TikTok's /embed/v2/{id} iframe is TikTok's whole mini post page (header,
  // like/comment counts, share icon), not a bare video player -- it's meant
  // to be sized by TikTok's own embed.js, not a fixed CSS box. Loading it
  // directly in a fixed aspect-ratio frame clips it into a cropped-looking
  // mess (confirmed on the live site). TikTok's official blockquote +
  // embed.js method handles sizing itself, so TikTok gets its own render
  // path in renderVideoItem() below instead of going through this iframe path.
  if (platform === "instagram") {
    const m = url.match(/instagram\.com\/(p|reel|tv)\/([A-Za-z0-9_-]+)/);
    if (!m) return null;
    return { src: `https://www.instagram.com/${m[1]}/${m[2]}/embed`, vertical: true };
  }
  if (platform === "facebook") {
    const clean = url.split("?")[0];
    return { src: `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(clean)}&show_text=false`, vertical: true };
  }
  return null;
}

function renderVideoItem(v) {
  const platform = v.platform || derivePlatform(v.url);
  const label = PLATFORM_LABELS[platform] || "Video";

  if (platform === "tiktok") {
    const m = v.url.match(/\/video\/(\d+)/);
    if (m) {
      return `<div class="watch-item">
        <blockquote class="tiktok-embed" cite="${escapeHtml(v.url)}" data-video-id="${m[1]}" style="max-width: 325px; min-width: 325px;">
          <section></section>
        </blockquote>
        <p class="watch-label">${escapeHtml(label)}</p>
      </div>`;
    }
  }

  const embed = deriveEmbed(v.url, platform);
  if (embed) {
    return `<div class="watch-item">
      <div class="watch-frame${embed.vertical ? " is-vertical" : ""}">
        <iframe src="${escapeHtml(embed.src)}" title="${escapeHtml(label)}" loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen></iframe>
      </div>
      <p class="watch-label">${escapeHtml(label)}</p>
    </div>`;
  }
  return `<div class="watch-item watch-item-link">
    <a href="${escapeHtml(v.url)}" target="_blank" rel="noopener">${escapeHtml(label)}</a>
  </div>`;
}

// TikTok's embed.js only scans the DOM for un-rendered .tiktok-embed
// blockquotes at its own load time. Since our blockquote is inserted
// dynamically (after any prior load of the script), a fresh script
// element is appended each time to force a re-scan -- the standard
// workaround for injecting TikTok embeds into a page after the fact.
function loadTikTokEmbedScript() {
  const script = document.createElement("script");
  script.async = true;
  script.src = "https://www.tiktok.com/embed.js";
  document.body.appendChild(script);
}

function renderWatch() {
  const container = el("watch-embed");
  if (container) {
    const videos = siteData.featuredVideos || [];
    if (!videos.length) {
      container.innerHTML = '<p class="watch-empty">No videos added yet.</p>';
    } else {
      container.innerHTML = videos.map(renderVideoItem).join("");
      if (videos.some((v) => (v.platform || derivePlatform(v.url)) === "tiktok")) {
        loadTikTokEmbedScript();
      }
    }
  }

  const socialContainer = el("social-links");
  if (socialContainer) {
    const socials = siteData.socials || [];
    socialContainer.innerHTML = socials
      .map((s) => `<a class="social-pill" href="${escapeHtml(s.url)}" target="_blank" rel="noopener">${escapeHtml(s.label)}</a>`)
      .join("");
  }
}

// ---------- Contact (contact.html only) ----------

function renderContact() {
  const container = el("contact-actions");
  if (!container) return;
  const contact = siteData.contact || {};
  const actions = [];
  if (contact.instagramUrl) {
    actions.push(
      `<a class="btn btn-primary" href="${escapeHtml(contact.instagramUrl)}" target="_blank" rel="noopener">DM on Instagram</a>`
    );
  }
  if (contact.email) {
    actions.push(`<a class="btn" href="mailto:${escapeHtml(contact.email)}">${escapeHtml(contact.email)}</a>`);
  }
  container.innerHTML = actions.join("");
}

// ---------- Persistent "Message ProxyLair" CTA (every page) ----------

function renderContactDock() {
  const dock = el("contact-dock");
  if (!dock) return;
  const contact = siteData.contact || {};
  if (contact.instagramUrl) {
    dock.innerHTML =
      `<a class="btn btn-primary" href="${escapeHtml(contact.instagramUrl)}" target="_blank" rel="noopener">Message ProxyLair</a>`;
  }
}

// ---------- Footer (every page) ----------

function renderFooter() {
  const domainEl = el("footer-domain");
  if (domainEl && siteData.domain) domainEl.textContent = siteData.domain;
}
