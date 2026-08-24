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
    renderProjectBrief();
    renderContactDock();
    renderFooter();
    // motion.js listens for this to reveal content rendered from data
    // (gallery cards, watch items, gear links) that didn't exist in the
    // DOM yet when it first scanned for reveal targets on page load.
    document.dispatchEvent(new CustomEvent("showcase:content-ready"));
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
// mailto: links do nothing on a device with no default mail app
// configured (common for webmail/Gmail-only users) -- the copy row
// below is the fallback that works regardless of mail-client setup.

function copyTextToClipboard(text) {
  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(text);
  }
  // Fallback for non-secure contexts / browsers without the Clipboard API.
  return new Promise((resolve, reject) => {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    try {
      document.execCommand("copy");
      resolve();
    } catch (err) {
      reject(err);
    } finally {
      document.body.removeChild(textarea);
    }
  });
}

function renderContact() {
  const container = el("contact-actions");
  const contact = siteData.contact || {};

  if (container) {
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

  const copyRow = el("email-copy");
  if (copyRow && contact.email) {
    copyRow.innerHTML = `
      <span class="email-copy-text">${escapeHtml(contact.email)}</span>
      <button class="email-copy-btn" type="button" aria-label="Copy email address">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>
        <span class="email-copy-btn-label">Copy</span>
      </button>
      <span class="email-copy-feedback" role="status" aria-live="polite"></span>
    `;
    const btn = copyRow.querySelector(".email-copy-btn");
    const label = copyRow.querySelector(".email-copy-btn-label");
    const feedback = copyRow.querySelector(".email-copy-feedback");
    let resetTimer = null;
    btn.addEventListener("click", () => {
      copyTextToClipboard(contact.email)
        .then(() => {
          label.textContent = "Copied!";
          feedback.textContent = "Email address copied to clipboard.";
          btn.classList.add("is-copied");
        })
        .catch(() => {
          feedback.textContent = "Couldn't copy automatically -- select the address above instead.";
        });
      clearTimeout(resetTimer);
      resetTimer = setTimeout(() => {
        label.textContent = "Copy";
        feedback.textContent = "";
        btn.classList.remove("is-copied");
      }, 2200);
    });
  }
}

// ---------- Project-brief builder (contact.html only) ----------
// Purely client-side, no submission anywhere -- it just assembles a
// plain-text message from the selected fields so a visitor doesn't have
// to figure out what to say from a blank box. "Copy message" and the
// mailto: link below both just read the same generated text.

function buildBriefText() {
  const type = el("pb-type") ? el("pb-type").value : "";
  const finish = el("pb-finish") ? el("pb-finish").value : "";
  const quantity = el("pb-quantity") ? el("pb-quantity").value : "";
  const artwork = el("pb-artwork") ? el("pb-artwork").value : "";
  const notes = el("pb-notes") ? el("pb-notes").value.trim() : "";

  const lines = ["Hi! I'd like to start a project."];
  if (type) lines.push(`Type: ${type}`);
  if (finish) lines.push(`Finish: ${finish}`);
  if (quantity) lines.push(`Quantity: ${quantity}`);
  if (artwork) lines.push(`Artwork: ${artwork}`);
  if (notes) lines.push("", `Reference/inspiration: ${notes}`);
  if (lines.length === 1) {
    lines.push("", "(Fill in a few details above and this'll fill itself in -- or just send this as-is and we'll talk it through.)");
  }
  return lines.join("\n");
}

function renderProjectBrief() {
  const preview = el("pb-preview");
  if (!preview) return; // not on this page

  const fieldIds = ["pb-type", "pb-finish", "pb-quantity", "pb-artwork", "pb-notes"];
  const emailLink = el("pb-email-link");
  const contact = siteData.contact || {};

  function update() {
    const text = buildBriefText();
    preview.value = text;
    if (emailLink && contact.email) {
      const subject = encodeURIComponent("Custom card project");
      const body = encodeURIComponent(text);
      emailLink.href = `mailto:${contact.email}?subject=${subject}&body=${body}`;
    }
  }

  fieldIds.forEach((id) => {
    const field = el(id);
    if (field) field.addEventListener("input", update);
  });

  const copyBtn = el("pb-copy");
  const feedback = el("pb-copy-feedback");
  if (copyBtn) {
    let resetTimer = null;
    copyBtn.addEventListener("click", () => {
      copyTextToClipboard(preview.value)
        .then(() => {
          if (feedback) feedback.textContent = "Copied to clipboard.";
          copyBtn.textContent = "Copied!";
        })
        .catch(() => {
          if (feedback) feedback.textContent = "Couldn't copy automatically -- select the text above instead.";
        });
      clearTimeout(resetTimer);
      resetTimer = setTimeout(() => {
        copyBtn.textContent = "Copy message";
        if (feedback) feedback.textContent = "";
      }, 2200);
    });
  }

  update();
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
