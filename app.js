// ProxyLair public showcase (ADR-014). Vanilla JS, no framework, no
// server runtime, no dependency on HIRO/src/api -- reads two static
// JSON manifests (data/cards.json, data/site.json) that a future HIRO
// "Publish to Showcase" step will replace. No page code needs to change
// when real curated content lands.

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
    renderWatch();
    renderContact();
    renderContactDock();
    renderFooter();
  })
  .catch((err) => console.error("Failed to load showcase data:", err));

// ---------- Gallery (flip cards) ----------

function renderGallery() {
  const grid = el("gallery-grid");
  if (!cardsData.length) {
    grid.innerHTML = '<p style="color:var(--text-muted)">No cards published yet.</p>';
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

// ---------- Lightbox (per-card detail + "watch the build") ----------

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

el("lightbox-close").addEventListener("click", closeLightbox);
el("lightbox").addEventListener("click", (e) => {
  if (e.target.id === "lightbox") closeLightbox();
});

// ---------- Watch / content hub ----------

function renderWatch() {
  const videos = siteData.featuredVideos || [];
  const first = videos[0];
  if (first && first.embedUrl) {
    el("watch-embed").innerHTML = `<iframe src="${escapeHtml(first.embedUrl)}"
      title="${escapeHtml(first.title || "Featured build")}"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowfullscreen></iframe>`;
  }
  // else: leaves the "No featured video yet" placeholder already in index.html.

  const socials = siteData.socials || [];
  el("social-links").innerHTML = socials
    .map((s) => `<a class="social-pill" href="${escapeHtml(s.url)}" target="_blank" rel="noopener">${escapeHtml(s.label)}</a>`)
    .join("");
}

// ---------- Contact ----------

function renderContact() {
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
  el("contact-actions").innerHTML = actions.join("");
}

function renderContactDock() {
  const contact = siteData.contact || {};
  if (contact.instagramUrl) {
    el("contact-dock").innerHTML =
      `<a class="btn btn-primary" href="${escapeHtml(contact.instagramUrl)}" target="_blank" rel="noopener">Message ProxyLair</a>`;
  }
}

function renderFooter() {
  if (siteData.domain) el("footer-domain").textContent = siteData.domain;
}
