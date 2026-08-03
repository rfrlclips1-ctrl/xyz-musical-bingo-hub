(() => {
  "use strict";

  const DATA = window.XYZ_BINGO;
  const app = document.getElementById("app");
  const menuButton = document.getElementById("menu-button");
  const nav = document.getElementById("main-nav");
  let liveTimer = null;
  let publicBackend = null;

  const escapeHtml = (value = "") => String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

  const normalizePath = (path) => {
    const clean = String(path || "/").split("?")[0].replace(/\/+$/, "");
    return clean || "/";
  };

  const roundForVenue = (venueSlug, roundSlug) => {
    const venue = DATA.venues[venueSlug];
    const round = DATA.rounds[roundSlug];
    if (!venue || !round || !round.venues.includes(venueSlug)) return null;
    return round;
  };

  const routeUrl = (venueSlug, roundSlug) => `/${venueSlug}/${roundSlug}`;

  const tags = (items = []) => items.map((item) => `<span class="tag">${escapeHtml(item)}</span>`).join("");

  const venuePills = (venueSlugs) => venueSlugs.map((slug) => {
    const venue = DATA.venues[slug];
    return `<span class="venue-pill ${escapeHtml(venue.theme)}">${escapeHtml(venue.shortName)}</span>`;
  }).join("");

  const venueLogo = (venue, variant = "default") => `
    <div class="venue-brand ${escapeHtml(venue.theme)} ${escapeHtml(variant)}">
      <img class="venue-brand-image" src="${escapeHtml(venue.logo)}" alt="${escapeHtml(venue.logoAlt)}">
    </div>`;

  const mangroveHeroAssets = (venue) => venue.theme === "mangrove" ? `
    <div class="mangrove-hero-assets" aria-label="Mangrove Sands brand artwork">
      <img class="mangrove-mascot" src="${escapeHtml(venue.mascot)}" alt="Mangrove Sands host mascot">
      <img class="mangrove-alt-logo" src="${escapeHtml(venue.alternateLogo)}" alt="Alternate Mangrove Sands Golf Club logo">
    </div>` : "";

  const venueRoundSummary = (rounds, venue) => {
    const exclusive = rounds.filter((round) => round.venues.length === 1).length;
    const shared = rounds.filter((round) => round.venues.length > 1).length;
    return `<div class="venue-round-summary" aria-label="${escapeHtml(venue.shortName)} playlist summary">
      <span><strong>${rounds.length}</strong> total rounds</span>
      <span><strong>${exclusive}</strong> venue-exclusive</span>
      <span><strong>${shared}</strong> shared rounds</span>
    </div>`;
  };

  const roundCard = (venue, round) => `
    <a class="round-card" href="${routeUrl(venue.slug, round.slug)}" data-link>
      <div class="round-art ${escapeHtml(round.accent)}">${escapeHtml(round.title.toUpperCase())}</div>
      <span class="round-availability">${round.venues.length > 1 ? "Shared round · venue-specific page" : `${escapeHtml(venue.shortName)} exclusive`}</span>
      <h3>${escapeHtml(round.title)}</h3>
      <p>${escapeHtml(round.subtitle)}</p>
      <div class="tags">${tags(round.categories)}</div>
    </a>`;

  const homePage = () => {
    const venues = Object.values(DATA.venues);
    const allRounds = Object.values(DATA.rounds);
    return `
      <div class="page-shell">
        <section class="hero">
          <p class="eyebrow">ONE APP · DISTINCT VENUES · DIRECT QR ROUTES</p>
          <h1>Every musical bingo night, under one roof.</h1>
          <p class="lead">Choose a venue to enter its own branded experience. Players scanning a card skip the menu and land directly on the correct venue and round.</p>
          <div class="hero-actions">
            <a class="button primary" href="/playlists" data-link>Browse all playlists</a>
            <a class="button secondary" href="#venues">Choose a venue</a>
            <a class="button secondary" href="/contact" data-link>Book an event</a>
          </div>
          <div class="metric-row" aria-label="App summary">
            <div class="metric"><strong>${venues.length}</strong><span>separate venue experiences</span></div>
            <div class="metric"><strong>${allRounds.length}</strong><span>active playlist rounds</span></div>
            <div class="metric"><strong>1</strong><span>shared app and host system</span></div>
          </div>
        </section>

        <section class="section" id="venues">
          <div class="section-heading">
            <div><p class="eyebrow">CHOOSE YOUR VENUE</p><h2>Same platform. Completely different feel.</h2></div>
          </div>
          <div class="venue-grid">
            ${venues.map((venue) => `
              <a class="venue-card ${escapeHtml(venue.theme)}" href="/${escapeHtml(venue.slug)}" data-link>
                <div>
                  <div class="venue-card-brand">
                    ${venueLogo(venue, "card")}
                    <span class="venue-brand-style">${escapeHtml(venue.brandStyle)}</span>
                  </div>
                  <h2>${escapeHtml(venue.name)}</h2>
                  <p>${escapeHtml(venue.description)}</p>
                  <span class="venue-tagline">${escapeHtml(venue.brandTagline)}</span>
                  <span class="schedule">${escapeHtml(venue.schedule)}</span>
                </div>
                <span class="venue-enter">Enter ${escapeHtml(venue.shortName)} →</span>
              </a>`).join("")}
          </div>
        </section>

        <section class="section">
          <div class="section-heading">
            <div><p class="eyebrow">HOW QR CODES WORK</p><h2>No venue choice after scanning.</h2></div>
          </div>
          <div class="round-layout">
            <div class="round-main">
              <h3>Island Vibes card example</h3>
              <p class="help-text"><code>/island-vibes/northeaster</code> opens the Island Vibes version with Island Vibes colors, schedule, navigation, and live board.</p>
            </div>
            <div class="round-side">
              <h3>Mangrove Sands card example</h3>
              <p class="help-text"><code>/mangrove-sands/northeaster</code> opens the Mangrove Sands version—even when the underlying Spotify playlist is shared.</p>
            </div>
          </div>
        </section>
      </div>`;
  };

  const venuePage = (venue) => {
    const rounds = venue.rounds.map((slug) => DATA.rounds[slug]).filter(Boolean);
    return `
      <div class="venue-page ${escapeHtml(venue.theme)}">
        <div class="page-shell">
          <section class="venue-hero">
            <div class="venue-hero-brand">
              ${venueLogo(venue, "hero")}
              <div class="venue-identity-copy">
                <span class="venue-brand-style">${escapeHtml(venue.brandStyle)}</span>
                <strong>${escapeHtml(venue.brandTagline)}</strong>
              </div>
            </div>
            <p class="eyebrow">${escapeHtml(venue.eyebrow)}</p>
            <h1>${escapeHtml(venue.shortName)}</h1>
            <p class="lead">${escapeHtml(venue.description)}</p>
            <div class="hero-actions">
              <a class="button ${venue.theme === "island" ? "primary" : "secondary"}" href="#venue-rounds">View playlists</a>
              <a class="button secondary" href="/playlists?venue=${encodeURIComponent(venue.slug)}" data-link>Open full catalog</a>
            </div>
            <p class="notice">${escapeHtml(venue.schedule)} · ${escapeHtml(venue.location)}</p>
            ${mangroveHeroAssets(venue)}
          </section>

          <section class="section" id="venue-rounds">
            <div class="section-heading">
              <div><p class="eyebrow">${escapeHtml(venue.shortName)} PLAYLISTS</p><h2>Every round currently assigned to this venue</h2></div>
              <p>${rounds.length} active rounds</p>
            </div>
            ${venueRoundSummary(rounds, venue)}
            <div class="round-grid">${rounds.map((round) => roundCard(venue, round)).join("")}</div>
          </section>

          <section class="section">
            <div class="round-layout">
              <div class="round-main">
                <p class="eyebrow">VENUE MESSAGE</p>
                <h2>${escapeHtml(venue.announcement)}</h2>
                <p class="lead">Each playlist page keeps this venue’s look, links, schedule, and live song history separate from every other venue.</p>
              </div>
              <div class="round-side">
                <h3>Direct card links</h3>
                <p class="help-text">Every new QR code should point to <strong>/${escapeHtml(venue.slug)}/round-name</strong>. The player never needs to choose a venue.</p>
              </div>
            </div>
          </section>
        </div>
      </div>`;
  };

  const playlistLibrary = () => {
    const params = new URLSearchParams(location.search);
    const selected = params.get("venue") || "all";
    return `
      <div class="page-shell">
        <section class="hero">
          <p class="eyebrow">XY&amp;Z PLAYLIST LIBRARY</p>
          <h1>Every active round.</h1>
          <p class="lead">Search the full catalog, filter by venue, and see which rounds are exclusive or shared.</p>
        </section>

        <section class="section">
          <div class="library-toolbar">
            <label>
              <span class="eyebrow">SEARCH</span>
              <input class="search-box" id="playlist-search" type="search" placeholder="Search playlists or categories" autocomplete="off">
            </label>
            <label>
              <span class="eyebrow">VENUE</span>
              <select class="filter-select" id="venue-filter">
                <option value="all" ${selected === "all" ? "selected" : ""}>All venues</option>
                <option value="island-vibes" ${selected === "island-vibes" ? "selected" : ""}>Island Vibes</option>
                <option value="mangrove-sands" ${selected === "mangrove-sands" ? "selected" : ""}>Mangrove Sands</option>
                <option value="shared" ${selected === "shared" ? "selected" : ""}>Available at both</option>
              </select>
            </label>
          </div>
          <div class="library-list" id="library-list"></div>
        </section>
      </div>`;
  };

  const contactPage = () => {
    const site = DATA.site;
    const venueLogos = Object.values(DATA.venues).map((venue) => `
      <a class="contact-venue" href="/${escapeHtml(venue.slug)}" data-link>
        <span class="contact-venue-logo ${escapeHtml(venue.theme)}"><img src="${escapeHtml(venue.logo)}" alt="${escapeHtml(venue.logoAlt)}"></span>
        <span><strong>${escapeHtml(venue.shortName)}</strong><small>${escapeHtml(venue.schedule)}</small></span>
      </a>`).join("");
    return `
      <div class="contact-page">
        <div class="page-shell">
          <section class="contact-hero">
            <div class="contact-hero-copy">
              <p class="eyebrow">BUSINESS INQUIRIES · SOCIAL MEDIA · BOOKINGS</p>
              <img class="contact-main-logo" src="${escapeHtml(site.logo)}" alt="XY&Z Productions — Musical Bingo, Trivia and Hosting">
              <h1>Bring a better game night to your venue.</h1>
              <p class="lead">XY&amp;Z Productions creates hosted musical bingo, trivia, and interactive entertainment for bars, restaurants, clubs, private events, and community spaces.</p>
              <div class="hero-actions">
                <a class="button primary" href="#inquiry-form">Start a business inquiry</a>
                <a class="button secondary" href="${escapeHtml(site.instagram)}" target="_blank" rel="noreferrer">Instagram · ${escapeHtml(site.contactLabel)}</a>
              </div>
              <div class="contact-service-row">
                ${site.services.map((service) => `<span>${escapeHtml(service)}</span>`).join("")}
              </div>
            </div>
            <div class="contact-brand-showcase" aria-label="XY&Z Productions services">
              <div class="contact-brand-orbit">
                <span>♫</span><span>?</span><span>●</span>
              </div>
              <strong>Musical Bingo</strong>
              <strong>Trivia</strong>
              <strong>Event Hosting</strong>
              <p>Custom entertainment built for each venue.</p>
            </div>
          </section>

          <section class="section contact-info-grid" aria-label="Business information">
            <article class="contact-info-card">
              <p class="eyebrow">BASED IN</p>
              <h2>${escapeHtml(site.location)}</h2>
              <p>Serving local venues and events with scalable game-night entertainment and custom-branded musical bingo experiences.</p>
            </article>
            <article class="contact-info-card">
              <p class="eyebrow">SOCIAL MEDIA</p>
              <h2>${escapeHtml(site.contactLabel)}</h2>
              <p>Follow event updates, new rounds, venue announcements, and XY&amp;Z Productions projects.</p>
              <a class="button secondary" href="${escapeHtml(site.instagram)}" target="_blank" rel="noreferrer">Open Instagram</a>
            </article>
            <article class="contact-info-card">
              <p class="eyebrow">SERVICES</p>
              <h2>Musical Bingo, Trivia &amp; Hosting</h2>
              <p>Recurring venue nights, one-time events, branded card packs, playlist systems, QR experiences, and live hosting.</p>
            </article>
          </section>

          <section class="section contact-layout" id="inquiry-form">
            <div class="contact-form-panel">
              <p class="eyebrow">CONTACT XY&amp;Z PRODUCTIONS</p>
              <h2>Tell us about your venue or event.</h2>
              <p class="help-text">Send the basics below. The submission will be stored securely through Netlify Forms after the site is deployed.</p>
              <form class="contact-form" id="business-inquiry-form" name="business-inquiry" method="POST" data-netlify="true" netlify-honeypot="bot-field">
                <input type="hidden" name="form-name" value="business-inquiry">
                <p class="hidden-field"><label>Do not fill this out: <input name="bot-field"></label></p>
                <div class="form-grid">
                  <label><span>Your name</span><input required name="name" autocomplete="name" placeholder="Name"></label>
                  <label><span>Email</span><input required type="email" name="email" autocomplete="email" placeholder="you@example.com"></label>
                  <label><span>Venue or business</span><input name="business" autocomplete="organization" placeholder="Business or event name"></label>
                  <label><span>Event type</span>
                    <select name="event-type">
                      <option value="Musical Bingo">Musical Bingo</option>
                      <option value="Trivia">Trivia</option>
                      <option value="Event Hosting">Event Hosting</option>
                      <option value="Custom Event">Custom Event</option>
                    </select>
                  </label>
                  <label><span>Preferred date</span><span class="date-input-wrap"><input type="date" name="event-date"></span></label>
                  <label class="form-span"><span>Message</span><textarea required name="message" rows="6" placeholder="Tell us about the venue, audience, schedule, and what you would like to create."></textarea></label>
                </div>
                <div class="button-row">
                  <button class="button primary" type="submit">Send business inquiry</button>
                  <a class="button secondary" href="${escapeHtml(site.instagram)}" target="_blank" rel="noreferrer">Message on Instagram</a>
                </div>
                <p class="form-status" id="form-status" role="status" aria-live="polite"></p>
              </form>
            </div>

            <aside class="contact-partners">
              <p class="eyebrow">CURRENT VENUE EXPERIENCES</p>
              <h2>One system, individually branded.</h2>
              <p class="help-text">The platform currently supports separate Island Vibes and Mangrove Sands experiences, each with its own playlists, branding, and QR routes.</p>
              <div class="contact-venues">${venueLogos}</div>
            </aside>
          </section>
        </div>
      </div>`;
  };

  const libraryItem = (round) => {
    const preferredVenue = round.venues[0];
    const links = round.venues.map((venueSlug) => {
      const venue = DATA.venues[venueSlug];
      return `<a class="button secondary small" href="${routeUrl(venueSlug, round.slug)}" data-link>Open ${escapeHtml(venue.shortName)}</a>`;
    }).join("");
    return `
      <article class="library-item" data-search="${escapeHtml([round.title, round.subtitle, ...round.categories].join(" ").toLowerCase())}" data-venues="${escapeHtml(round.venues.join(" "))}">
        <div>
          <h3>${escapeHtml(round.title)}</h3>
          <p>${escapeHtml(round.subtitle)}</p>
          <div class="venue-pills">${venuePills(round.venues)}</div>
        </div>
        <div class="button-row">${links || `<a href="${routeUrl(preferredVenue, round.slug)}" data-link>Open</a>`}</div>
      </article>`;
  };

  const roundPage = (venue, round) => `
    <div class="round-page ${escapeHtml(venue.theme)}">
      <div class="page-shell">
        <nav class="breadcrumbs" aria-label="Breadcrumb">
          <a href="/" data-link>Home</a><span>›</span>
          <a href="/${escapeHtml(venue.slug)}" data-link>${escapeHtml(venue.shortName)}</a><span>›</span>
          <span>${escapeHtml(round.title)}</span>
        </nav>

        <div class="round-layout">
          <section class="round-main">
            <div class="round-venue-brand">
              ${venueLogo(venue, "round")}
              <div><span>${escapeHtml(venue.shortName)}</span><strong>${escapeHtml(venue.brandTagline)}</strong></div>
            </div>
            <div class="round-art round-title-art ${escapeHtml(round.accent)}">${escapeHtml(round.title.toUpperCase())}</div>
            <p class="eyebrow">${escapeHtml(venue.eyebrow)}</p>
            <h1>${escapeHtml(round.title)}</h1>
            <p class="lead">${escapeHtml(round.subtitle)}</p>
            <div class="tags">${tags(round.categories)}</div>
            <div class="button-row">
              ${round.spotifyUrl
                ? `<a class="button spotify" href="${escapeHtml(round.spotifyUrl)}" target="_blank" rel="noreferrer">Open Spotify playlist</a>`
                : round.legacyUrl
                  ? `<a class="button spotify" href="${escapeHtml(round.legacyUrl)}" target="_blank" rel="noreferrer">Open current playlist page</a>`
                  : `<span class="button disabled" aria-disabled="true">Playlist link needed</span>`}
              <a class="button secondary" href="/${escapeHtml(venue.slug)}" data-link>All ${escapeHtml(venue.shortName)} rounds</a>
            </div>
            ${round.needsLink ? `<div class="notice">This round is included and routed correctly. It currently opens the existing venue playlist page until the direct Spotify URL is added.</div>` : ""}

            <div class="how-to">
              <h2>How to play</h2>
              <div class="how-step"><strong>1</strong><div><h3>Listen</h3><p class="help-text">The host plays a short section of each song.</p></div></div>
              <div class="how-step"><strong>2</strong><div><h3>Mark your card</h3><p class="help-text">Find the title on your card and mark the square.</p></div></div>
              <div class="how-step"><strong>3</strong><div><h3>Call bingo</h3><p class="help-text">Complete the announced pattern and get the host’s attention.</p></div></div>
            </div>
          </section>

          <aside class="round-side live-card" data-live-venue="${escapeHtml(venue.slug)}" data-live-round="${escapeHtml(round.slug)}">
            <div class="live-status" id="live-status"><span class="live-dot"></span><span>Checking live event</span></div>
            <div class="now-playing" id="now-playing">
              <span class="label">Now Playing</span>
              <h3>Waiting for the host</h3>
              <p>The live board appears automatically when a session is active.</p>
            </div>
            <div>
              <h2>Played tonight</h2>
              <div class="history" id="history"><p class="help-text">No songs have been published yet.</p></div>
            </div>
            <p class="help-text">${escapeHtml(venue.schedule)}</p>
          </aside>
        </div>
      </div>
    </div>`;

  const errorPage = (title, message) => `
    <section class="error-card">
      <p class="eyebrow">PAGE NOT FOUND</p>
      <h1>${escapeHtml(title)}</h1>
      <p class="lead">${escapeHtml(message)}</p>
      <a class="button primary" href="/" data-link>Return home</a>
    </section>`;

  const renderLibrary = () => {
    const list = document.getElementById("library-list");
    const search = document.getElementById("playlist-search");
    const filter = document.getElementById("venue-filter");
    if (!list || !search || !filter) return;

    const apply = () => {
      const query = search.value.trim().toLowerCase();
      const venueFilter = filter.value;
      const results = Object.values(DATA.rounds).filter((round) => {
        const haystack = [round.title, round.subtitle, ...round.categories].join(" ").toLowerCase();
        const queryMatch = !query || haystack.includes(query);
        const venueMatch = venueFilter === "all"
          || (venueFilter === "shared" && round.venues.length > 1)
          || round.venues.includes(venueFilter);
        return queryMatch && venueMatch;
      });
      list.innerHTML = results.length
        ? results.map(libraryItem).join("")
        : `<div class="empty-state">No playlists match those filters.</div>`;
      bindLinks();
    };

    search.addEventListener("input", apply);
    filter.addEventListener("change", apply);
    apply();
  };

  const backendConfig = async () => {
    if (publicBackend !== null) return publicBackend;
    try {
      const response = await fetch("/.netlify/functions/config", { headers: { "accept": "application/json" } });
      if (!response.ok) throw new Error("Backend not configured");
      const data = await response.json();
      if (!data.supabaseUrl || !data.supabasePublishableKey) throw new Error("Missing public configuration");
      publicBackend = data;
    } catch (_error) {
      publicBackend = false;
    }
    return publicBackend;
  };

  const supabaseGet = async (path, config) => {
    const response = await fetch(`${config.supabaseUrl}/rest/v1/${path}`, {
      headers: {
        apikey: config.supabasePublishableKey,
        Authorization: `Bearer ${config.supabasePublishableKey}`,
        Accept: "application/json"
      }
    });
    if (!response.ok) throw new Error(`Live data request failed (${response.status})`);
    return response.json();
  };

  const updateLiveBoard = async (venueSlug, roundSlug) => {
    const status = document.getElementById("live-status");
    const now = document.getElementById("now-playing");
    const history = document.getElementById("history");
    if (!status || !now || !history) return;

    const config = await backendConfig();
    if (!config) {
      status.innerHTML = `<span class="live-dot"></span><span>Live board ready after setup</span>`;
      return;
    }

    try {
      const sessions = await supabaseGet(
        `sessions?select=id,venue_slug,round_slug,started_at&venue_slug=eq.${encodeURIComponent(venueSlug)}&round_slug=eq.${encodeURIComponent(roundSlug)}&status=eq.active&order=started_at.desc&limit=1`,
        config
      );
      if (!sessions.length) {
        status.classList.remove("active");
        status.innerHTML = `<span class="live-dot"></span><span>No active session</span>`;
        now.innerHTML = `<span class="label">Now Playing</span><h3>Waiting for the host</h3><p>The live board appears when this round starts.</p>`;
        history.innerHTML = `<p class="help-text">No active song history.</p>`;
        return;
      }

      const session = sessions[0];
      const tracks = await supabaseGet(
        `tracks?select=position,title,artist,album,detected_at&session_id=eq.${encodeURIComponent(session.id)}&order=position.desc&limit=50`,
        config
      );
      status.classList.add("active");
      status.innerHTML = `<span class="live-dot"></span><span>Live session active</span>`;
      if (!tracks.length) {
        now.innerHTML = `<span class="label">Now Playing</span><h3>Session started</h3><p>Waiting for the first song.</p>`;
        history.innerHTML = `<p class="help-text">Songs will appear here automatically.</p>`;
        return;
      }
      const latest = tracks[0];
      now.innerHTML = `<span class="label">Now Playing · Song ${escapeHtml(latest.position)}</span><h3>${escapeHtml(latest.title)}</h3><p>${escapeHtml(latest.artist || "Artist unavailable")}</p>`;
      history.innerHTML = tracks.map((track) => `
        <div class="history-item">
          <b>${escapeHtml(track.position)}</b>
          <div><strong>${escapeHtml(track.title)}</strong><span>${escapeHtml(track.artist || "Artist unavailable")}</span></div>
        </div>`).join("");
    } catch (_error) {
      status.classList.remove("active");
      status.innerHTML = `<span class="live-dot"></span><span>Live board unavailable</span>`;
    }
  };

  const startLivePolling = (venueSlug, roundSlug) => {
    clearInterval(liveTimer);
    updateLiveBoard(venueSlug, roundSlug);
    liveTimer = setInterval(() => updateLiveBoard(venueSlug, roundSlug), 4000);
  };

  const updateNav = (path) => {
    document.querySelectorAll(".main-nav a").forEach((link) => {
      const href = normalizePath(link.getAttribute("href"));
      const current = href === "/" ? path === "/" : path.startsWith(href);
      if (current) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
  };

  const bindContactForm = () => {
    const form = document.getElementById("business-inquiry-form");
    const status = document.getElementById("form-status");
    if (!form || !status) return;

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const submitButton = form.querySelector('button[type="submit"]');
      submitButton.disabled = true;
      status.className = "form-status sending";
      status.textContent = "Sending your inquiry…";
      try {
        const body = new URLSearchParams(new FormData(form)).toString();
        const response = await fetch("/", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body
        });
        if (!response.ok) throw new Error("Submission failed");
        form.reset();
        status.className = "form-status success";
        status.textContent = "Thank you — your business inquiry has been sent.";
      } catch (_error) {
        status.className = "form-status error";
        status.textContent = "The form could not send from this preview. Please message @XYandZproductions on Instagram.";
      } finally {
        submitButton.disabled = false;
      }
    });
  };

  const render = () => {
    clearInterval(liveTimer);
    liveTimer = null;
    const path = normalizePath(location.pathname);
    const parts = path.split("/").filter(Boolean);
    document.body.dataset.page = parts[0] || "home";
    const routeVenue = DATA.venues[parts[0]] || null;
    document.body.dataset.venue = routeVenue ? routeVenue.theme : "";

    if (path === "/") {
      app.innerHTML = homePage();
      document.title = `${DATA.site.name} · Venue Hub`;
    } else if (path === "/playlists") {
      app.innerHTML = playlistLibrary();
      document.title = `All Playlists · ${DATA.site.name}`;
    } else if (path === "/contact") {
      app.innerHTML = contactPage();
      document.title = `Contact & Business Inquiries · ${DATA.site.name}`;
    } else if (parts.length === 1 && DATA.venues[parts[0]]) {
      const venue = DATA.venues[parts[0]];
      app.innerHTML = venuePage(venue);
      document.title = `${venue.shortName} Musical Bingo · XY&Z`;
    } else if (parts.length === 2 && DATA.venues[parts[0]]) {
      const venue = DATA.venues[parts[0]];
      const round = roundForVenue(parts[0], parts[1]);
      if (round) {
        app.innerHTML = roundPage(venue, round);
        document.title = `${round.title} at ${venue.shortName} · XY&Z`;
      } else {
        app.innerHTML = errorPage("That round is not offered here", "Open the venue page to see its current playlist lineup.");
        document.title = `Round unavailable · ${DATA.site.name}`;
      }
    } else {
      app.innerHTML = errorPage("We could not find that page", "Choose a venue or browse the full playlist library.");
      document.title = `Page not found · ${DATA.site.name}`;
    }

    updateNav(path);
    bindLinks();
    if (path === "/playlists") renderLibrary();
    if (path === "/contact") bindContactForm();
    const live = document.querySelector("[data-live-venue][data-live-round]");
    if (live) startLivePolling(live.dataset.liveVenue, live.dataset.liveRound);
    window.scrollTo({ top: 0, behavior: "instant" });
    app.focus({ preventScroll: true });
  };

  const navigate = (href) => {
    const target = new URL(href, location.origin);
    history.pushState({}, "", `${target.pathname}${target.search}${target.hash}`);
    render();
  };

  const bindLinks = () => {
    document.querySelectorAll("a[data-link]").forEach((link) => {
      if (link.dataset.bound === "true") return;
      link.dataset.bound = "true";
      link.addEventListener("click", (event) => {
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        const url = new URL(link.href, location.origin);
        if (url.origin !== location.origin) return;
        event.preventDefault();
        nav.classList.remove("open");
        menuButton.setAttribute("aria-expanded", "false");
        navigate(url.href);
      });
    });
  };

  const handleLegacyQuery = () => {
    if (normalizePath(location.pathname) !== "/") return false;
    const params = new URLSearchParams(location.search);
    const roundSlug = params.get("round");
    const venueSlug = params.get("venue");
    if (!roundSlug) return false;
    const round = DATA.rounds[roundSlug];
    if (!round) return false;
    if (venueSlug && round.venues.includes(venueSlug)) {
      history.replaceState({}, "", routeUrl(venueSlug, roundSlug));
      return true;
    }
    if (round.venues.length === 1) {
      history.replaceState({}, "", routeUrl(round.venues[0], roundSlug));
      return true;
    }
    history.replaceState({}, "", `/playlists?round=${encodeURIComponent(roundSlug)}`);
    return true;
  };

  menuButton.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    menuButton.setAttribute("aria-expanded", String(open));
  });
  window.addEventListener("popstate", render);
  handleLegacyQuery();
  render();
})();
