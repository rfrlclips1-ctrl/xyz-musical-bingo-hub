(() => {
  "use strict";

  const DATA = window.XYZ_BINGO;
  const app = document.getElementById("app");
  const menuButton = document.getElementById("menu-button");
  const nav = document.getElementById("main-nav");
  const navDropdown = document.querySelector(".nav-dropdown");
  const navDropdownToggle = document.querySelector(".nav-dropdown-toggle");
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

  const roundCard = (venue, round) => `
    <a class="round-card" href="${routeUrl(venue.slug, round.slug)}" data-link>
      <div class="round-art ${escapeHtml(round.accent)}">${escapeHtml(round.title.toUpperCase())}</div>
      <h3>${escapeHtml(round.title)}</h3>
      <p>${escapeHtml(round.subtitle)}</p>
      <div class="tags">${tags(round.categories)}</div>
    </a>`;

  const homePage = () => {
    const venues = Object.values(DATA.venues);
    return `
      <div class="page-shell">
        <section class="hero">
          <p class="eyebrow">MUSICAL BINGO · ISLAND VIBES TRIVIA · LIVE ENTERTAINMENT</p>
          <h1>Musical bingo and trivia, built around every venue.</h1>
          <p class="lead">Choose a venue for its branded musical bingo experience, or jump directly into Island Vibes Trivia for standings, player profiles, records, streaks, and every final scoreboard.</p>
          <div class="hero-actions">
            <a class="button primary" href="/island-vibes/trivia" data-link>Explore Island Vibes Trivia</a>
            <a class="button secondary" href="/playlists" data-link>Browse bingo playlists</a>
            <a class="button secondary" href="#venues">Choose a venue</a>
          </div>

        </section>

        <section class="section" id="venues">
          <div class="section-heading">
            <div><p class="eyebrow">CHOOSE YOUR VENUE</p><h2>Weekly events by venue</h2></div>
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
                  <div class="venue-event-times"><span class="schedule"><small>${venue.slug === "island-vibes" ? "MUSICAL BINGO" : "MUSICAL BINGO"}</small>${escapeHtml(venue.schedule)}</span>${venue.slug === "island-vibes" ? '<span class="schedule trivia-schedule"><small>TRIVIA</small>Thursdays · 8:00 PM</span>' : ''}</div>
                </div>
                <span class="venue-enter">Enter ${escapeHtml(venue.shortName)} →</span>
              </a>`).join("")}
          </div>
        </section>

      </div>`;
  };

  const islandTriviaTeaser = (venue) => venue.slug === "island-vibes" ? `
    <section class="section trivia-teaser" aria-labelledby="island-trivia-title">
      <div class="trivia-teaser-copy">
        <p class="eyebrow">THURSDAYS · 8:00 PM · ISLAND VIBES</p>
        <h2 id="island-trivia-title">Island Vibes Trivia</h2>
        <p>Play team trivia every Thursday at 8:00 PM. Follow standings, team profiles, winning streaks, records, and every recorded result.</p>
        <div class="trivia-feature-row"><span>Thursdays at 8 PM</span><span>28 recorded nights</span><span>Team profile pages</span><span>Live sports-style records</span></div>
        <a class="button trivia-button" href="/island-vibes/trivia" data-link>View trivia statistics</a>
      </div>
      <div class="trivia-teaser-art" aria-hidden="true"><span class="trivia-note">★</span><strong>?</strong><span class="trivia-bubble">TRIVIA</span></div>
    </section>` : "";

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
            <h1>${escapeHtml(venue.shortName)}${venue.slug === "island-vibes" ? ' <span class="venue-title-extra">Musical Bingo + Trivia</span>' : ''}</h1>
            <p class="lead">${escapeHtml(venue.description)}</p>
            <div class="venue-weekly-schedule ${escapeHtml(venue.theme)}">
              <article><span>MUSICAL BINGO</span><strong>${venue.slug === "island-vibes" ? "Wednesdays" : "Thursdays"}</strong><b>${venue.slug === "island-vibes" ? "7:30 PM" : "5:30–7:30 PM"}</b></article>
              ${venue.slug === "island-vibes" ? '<article class="trivia-event"><span>TEAM TRIVIA</span><strong>Thursdays</strong><b>8:00 PM</b><a href="/island-vibes/trivia" data-link>Stats, teams & results →</a></article>' : '<article class="venue-link-event"><span>AT MANGROVE SANDS</span><strong>Golf Club & Restaurant</strong><b>Vero Beach</b><a href="https://mangrovesands.com/" target="_blank" rel="noreferrer">Venue website →</a></article>'}
            </div>
            <div class="hero-actions">
              ${venue.slug === "island-vibes" ? '<a class="button primary" href="/island-vibes/trivia" data-link>Open Trivia Headquarters</a>' : ''}
              <a class="button secondary" href="/${escapeHtml(venue.slug)}/live" data-link>Open Live Board</a>
              <a class="button ${venue.theme === "island" ? "primary" : "secondary"}" href="#venue-rounds">View playlists</a>
              <a class="button secondary" href="/playlists?venue=${encodeURIComponent(venue.slug)}" data-link>Open full catalog</a>
              <a class="button venue-external" href="${escapeHtml(venue.externalUrl)}" target="_blank" rel="noreferrer">${escapeHtml(venue.externalLabel)} ↗</a>
            </div>
            <p class="notice">${escapeHtml(venue.schedule)} · ${escapeHtml(venue.location)}</p>
            ${mangroveHeroAssets(venue)}
          </section>

          ${islandTriviaTeaser(venue)}

          <section class="section" id="venue-rounds">
            <div class="section-heading">
              <div><p class="eyebrow">${escapeHtml(venue.shortName)} PLAYLISTS</p><h2>Choose a round</h2></div>
            </div>
            <div class="round-grid">${rounds.map((round) => roundCard(venue, round)).join("")}</div>
          </section>

          <section class="section venue-quick-guide">
            <div class="section-heading"><div><p class="eyebrow">${escapeHtml(venue.shortName)} QUICK LINKS</p><h2>Everything for this venue</h2></div></div>
            <div class="venue-action-grid">
              <a href="#venue-rounds"><span>♫</span><strong>Musical Bingo</strong><small>Choose tonight’s playlist</small></a>
              ${venue.slug === "island-vibes" ? '<a href="/island-vibes/trivia" data-link><span>?</span><strong>Trivia Headquarters</strong><small>Teams, standings and results</small></a>' : '<a href="https://mangrovesands.com/" target="_blank" rel="noreferrer"><span>⌂</span><strong>Mangrove Sands</strong><small>Visit the venue website</small></a>'}
              <a href="/${escapeHtml(venue.slug)}/live" data-link><span>●</span><strong>Live Board</strong><small>Now playing and song history</small></a>
              <a href="/playlists?venue=${encodeURIComponent(venue.slug)}" data-link><span>▦</span><strong>Playlist Library</strong><small>Browse all venue rounds</small></a>
              <a href="/contact" data-link><span>✦</span><strong>Book XY&amp;Z</strong><small>Hosting and event inquiries</small></a>
            </div>
          </section>
        </div>
      </div>`;
  };

  const triviaStats = () => {
    const source = window.ISLAND_TRIVIA || { nights: [], noTrivia: [] };
    const teams = new Map();
    source.nights.forEach((night) => night.results.forEach((row) => {
      const stat = teams.get(row.team) || { team: row.team, played: 0, wins: 0, podiums: 0, total: 0, best: -Infinity, finishes: 0, results: [] };
      stat.played += 1;
      stat.total += row.score;
      stat.best = Math.max(stat.best, row.score);
      stat.finishes += row.place;
      stat.results.push({ date: night.date, place: row.place, score: row.score, field: night.results.length });
      if (row.place === 1) stat.wins += 1;
      if (row.place <= 3) stat.podiums += 1;
      teams.set(row.team, stat);
    }));
    const standings = [...teams.values()].map((x) => ({
      ...x,
      avg: x.total / x.played,
      avgFinish: x.finishes / x.played,
      winRate: 100 * x.wins / x.played,
      podiumRate: 100 * x.podiums / x.played,
      latest: x.results[x.results.length - 1]
    })).sort((a,b) => b.wins-a.wins || b.podiums-a.podiums || a.avgFinish-b.avgFinish || b.best-a.best);

    const streaks = [];
    let current = null;
    source.nights.forEach((night) => {
      const winner = night.results[0]?.team;
      if (!winner) return;
      if (current && current.team === winner) {
        current.count += 1;
        current.end = night.date;
        current.nights.push(night);
      } else {
        if (current) streaks.push(current);
        current = { team: winner, count: 1, start: night.date, end: night.date, nights: [night] };
      }
    });
    if (current) streaks.push(current);
    streaks.sort((a,b)=>b.count-a.count || a.start.localeCompare(b.start));

    const allRows = source.nights.flatMap(n=>n.results.map(r=>({...r,date:n.date,field:n.results.length})));
    const margins = source.nights.filter(n=>n.results.length>1).map(n=>({
      date:n.date, winner:n.results[0].team, winnerScore:n.results[0].score,
      runner:n.results[1].team, runnerScore:n.results[1].score,
      margin:n.results[0].score-n.results[1].score
    }));
    const monthly = new Map();
    source.nights.forEach(n=>{
      const key=n.date.slice(0,7);
      const m=monthly.get(key)||{key,nights:0,teams:0,winners:new Map(),high:-Infinity};
      m.nights++; m.teams+=n.results.length; m.high=Math.max(m.high,...n.results.map(r=>r.score));
      const w=n.results[0].team; m.winners.set(w,(m.winners.get(w)||0)+1); monthly.set(key,m);
    });
    const months=[...monthly.values()].map(m=>{
      const leaders=[...m.winners.entries()].sort((a,b)=>b[1]-a[1]);
      return {...m,avgTeams:m.teams/m.nights,leader:leaders[0]?.[0]||'',leaderWins:leaders[0]?.[1]||0};
    });
    const highest=[...allRows].sort((a,b)=>b.score-a.score).slice(0,10);
    const lowest=[...allRows].sort((a,b)=>a.score-b.score).slice(0,8);
    const closest=[...margins].sort((a,b)=>a.margin-b.margin).slice(0,8);
    const largest=[...margins].sort((a,b)=>b.margin-a.margin).slice(0,8);
    const totalEntries=source.nights.reduce((a,n)=>a+n.results.length,0);
    const uniqueTeams=standings.length;
    return {
      source, standings, streaks, highest, lowest, closest, largest, months,
      highestScore: highest[0]?.score ?? 0,
      largestMargin: largest[0]?.margin ?? 0,
      closestMargin: closest[0]?.margin ?? 0,
      avgTeams: totalEntries/source.nights.length,
      totalEntries, uniqueTeams,
      champion: standings[0]
    };
  };

  const triviaTeamSlug = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
  const triviaFmtDate = (d, year=true) => new Date(d+'T12:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric',...(year?{year:'numeric'}:{})});

  const triviaTeamPage = (venue, slug) => {
    const stats = triviaStats();
    const team = stats.standings.find(t => triviaTeamSlug(t.team) === slug);
    if (!team) return errorPage("Team not found", "Return to Trivia Headquarters to browse every recorded team.");
    const rank = stats.standings.indexOf(team) + 1;
    const wins = team.results.filter(r=>r.place===1);
    const podiums = team.results.filter(r=>r.place<=3);
    const recent = team.results.slice().reverse();
    const bestFinish = Math.min(...team.results.map(r=>r.place));
    const lastFive = recent.slice(0,5);
    const form = lastFive.map(r=>`<span class="form-badge ${r.place===1?'win':r.place<=3?'podium':''}">${r.place===1?'W':r.place}</span>`).join('');
    const teamStreaks = stats.streaks.filter(x=>x.team===team.team).sort((a,b)=>b.count-a.count);
    const bestStreak = teamStreaks[0]?.count || (team.wins ? 1 : 0);
    return `<div class="venue-page island trivia-page team-page"><div class="page-shell">
      <nav class="breadcrumbs"><a href="/" data-link>Home</a><span>›</span><a href="/island-vibes" data-link>Island Vibes</a><span>›</span><a href="/island-vibes/trivia" data-link>Trivia</a><span>›</span><span>${escapeHtml(team.team)}</span></nav>
      <section class="sports-team-hero">
        <div class="team-crest">${escapeHtml(team.team.split(/\s+/).map(w=>w[0]).slice(0,3).join(''))}</div>
        <div class="sports-team-copy"><p class="eyebrow">ISLAND VIBES TRIVIA · TEAM PROFILE</p><h1>${escapeHtml(team.team)}</h1><p class="lead">Official results, season history, records, form, and every recorded appearance.</p><div class="team-form"><span>Recent form</span>${form || '<em>No results</em>'}</div></div>
        <div class="team-rank-panel"><small>ALL-TIME RANK</small><strong>#${rank}</strong><span>${team.wins} wins · ${team.podiums} podiums</span></div>
      </section>
      <nav class="sports-subnav"><a href="/island-vibes/trivia" data-link>← Trivia Home</a><a href="#snapshot">Snapshot</a><a href="#game-log">Game Log</a><a href="#records">Records</a></nav>
      <section id="snapshot" class="sports-stat-strip">
        <article><span>Played</span><strong>${team.played}</strong></article><article><span>Wins</span><strong>${team.wins}</strong></article><article><span>Podiums</span><strong>${team.podiums}</strong></article><article><span>Win rate</span><strong>${team.winRate.toFixed(1)}%</strong></article><article><span>Avg score</span><strong>${team.avg.toFixed(1)}</strong></article><article><span>Best score</span><strong>${team.best}</strong></article><article><span>Avg finish</span><strong>${team.avgFinish.toFixed(2)}</strong></article><article><span>Best streak</span><strong>${bestStreak}</strong></article>
      </section>
      <div class="sports-layout">
        <main>
          <section class="sports-panel" id="game-log"><header><div><p class="eyebrow">COMPLETE HISTORY</p><h2>Game log</h2></div><span>${team.played} appearances</span></header><div class="game-log-table"><div class="game-log-head"><span>Date</span><span>Finish</span><span>Score</span><span>Field</span></div>${recent.map(r=>`<div class="game-log-row"><span>${triviaFmtDate(r.date)}</span><b class="finish-${Math.min(r.place,4)}">${r.place===1?'WIN':`#${r.place}`}</b><strong>${r.score}</strong><span>${r.field} teams</span></div>`).join('')}</div></section>
        </main>
        <aside>
          <section class="sports-panel" id="records"><header><div><p class="eyebrow">TEAM RECORDS</p><h2>At a glance</h2></div></header><dl class="team-record-list"><div><dt>Highest score</dt><dd>${team.best}</dd></div><div><dt>Best finish</dt><dd>${bestFinish===1?'Winner':`#${bestFinish}`}</dd></div><div><dt>Total wins</dt><dd>${wins.length}</dd></div><div><dt>Total podiums</dt><dd>${podiums.length}</dd></div><div><dt>Longest win streak</dt><dd>${bestStreak}</dd></div><div><dt>Latest appearance</dt><dd>${triviaFmtDate(team.latest.date)}</dd></div></dl></section>
          <section class="sports-panel"><header><div><p class="eyebrow">NEXT GAME</p><h2>Thursday at 8 PM</h2></div></header><p>Island Vibes Trivia is held Thursdays at 8:00 PM in Vero Beach.</p><a class="button primary" href="/island-vibes/trivia" data-link>Back to Trivia Headquarters</a></section>
        </aside>
      </div>
    </div></div>`;
  };

  const triviaPage = (venue) => {
    const stats = triviaStats();
    const profileTeams = stats.standings.filter(t=>t.played>=2 || t.wins>0);
    const featuredTeams = profileTeams.slice(0,8);
    const recentNights = stats.source.nights.slice(-6).reverse();
    const recordCard = (label,value,detail) => `<article class="record-card"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong><small>${escapeHtml(detail)}</small></article>`;
    const teamLink = (t) => `/island-vibes/trivia/team/${triviaTeamSlug(t.team)}`;
    return `<div class="venue-page island trivia-page"><div class="page-shell">
      <nav class="breadcrumbs"><a href="/" data-link>Home</a><span>›</span><a href="/island-vibes" data-link>Island Vibes</a><span>›</span><span>Trivia Headquarters</span></nav>
      <section class="trivia-live-hero compact island-scoreboard-hero">
        <div><p class="eyebrow">THURSDAYS · 8:00 PM · ISLAND VIBES</p><h1>Island Vibes Trivia Headquarters</h1><p class="lead">Team profiles, standings, records, streaks, and every Island Vibes final scoreboard.</p><div class="button-row"><button class="button primary trivia-tab-trigger" data-tab-target="teams">Team pages</button><button class="button secondary trivia-tab-trigger" data-tab-target="standings">Standings</button><button class="button secondary trivia-tab-trigger" data-tab-target="results">Latest results</button></div></div>
        <div class="trivia-champion-mark"><span>ALL-TIME LEADER</span><strong>${escapeHtml(stats.champion.team)}</strong><b>${stats.champion.wins} WINS</b><a href="${teamLink(stats.champion)}" data-link>View team profile →</a></div>
      </section>
      <section class="trivia-scoreboard-strip"><article><small>NIGHTS</small><b>${stats.source.nights.length}</b></article><article><small>TEAMS</small><b>${stats.uniqueTeams}</b></article><article><small>LONGEST STREAK</small><b>${stats.streaks[0].count}</b><span>${escapeHtml(stats.streaks[0].team)}</span></article><article><small>HIGH SCORE</small><b>${stats.highestScore}</b><span>${escapeHtml(stats.highest[0].team)}</span></article><article><small>AVG FIELD</small><b>${stats.avgTeams.toFixed(1)}</b></article><article><small>CLOSEST FINISH</small><b>${stats.closestMargin}</b><span>points</span></article></section>
      <nav class="trivia-tabbar" aria-label="Trivia sections"><button class="active" data-trivia-tab="home">Home</button><button data-trivia-tab="teams">Teams</button><button data-trivia-tab="standings">Standings</button><button data-trivia-tab="records">Records</button><button data-trivia-tab="streaks">Streaks</button><button data-trivia-tab="results">Results</button></nav>

      <div class="trivia-tab-panel active" data-trivia-panel="home">
        <section class="sports-home-grid">
          <article class="sports-feature"><p class="eyebrow">THE LEAGUE STORY</p><h2>Island Vibes all-time leaders</h2><p>Wise Ass Owls lead all-time with ${stats.champion.wins} wins and a nine-game streak. Seannah owns the scoring record at 420 and a seven-game winning run. Mr and Mrs Awesome posted a perfect recorded podium rate, while The Cluckaneers took over April.</p><button class="text-link trivia-tab-trigger" data-tab-target="records">Explore the record book →</button></article>
          <article class="sports-next"><span>EVERY THURSDAY</span><strong>8:00 PM</strong><p>Island Vibes Kava Bar<br>Vero Beach, Florida</p><a class="button primary" href="/island-vibes" data-link>Island Vibes home</a></article>
        </section>
        <section class="section"><div class="section-heading"><div><p class="eyebrow">POWER RANKINGS</p><h2>Featured teams</h2></div><button class="text-link trivia-tab-trigger" data-tab-target="teams">View all teams →</button></div><div class="sports-team-grid">${featuredTeams.map((t,i)=>`<a class="sports-team-card" href="${teamLink(t)}" data-link><span class="sports-rank">${i+1}</span><div class="mini-crest">${escapeHtml(t.team.split(/\s+/).map(w=>w[0]).slice(0,3).join(''))}</div><h3>${escapeHtml(t.team)}</h3><div><b>${t.wins}<small>WINS</small></b><b>${t.podiums}<small>PODIUMS</small></b><b>${t.best}<small>BEST</small></b></div><p>${t.played} played · ${t.winRate.toFixed(1)}% win rate</p></a>`).join('')}</div></section>
        <section class="section"><div class="section-heading"><div><p class="eyebrow">LATEST SCOREBOARDS</p><h2>Recent results</h2></div><button class="text-link trivia-tab-trigger" data-tab-target="results">Complete archive →</button></div><div class="recent-results-grid">${recentNights.map(n=>`<article><header><span>${triviaFmtDate(n.date)}</span><strong>${n.results[0].score}</strong></header><h3>${escapeHtml(n.results[0].team)}</h3><p>Winner · ${n.results.length} teams</p><ol>${n.results.slice(0,3).map(r=>`<li><span>${r.place}</span><a href="/island-vibes/trivia/team/${triviaTeamSlug(r.team)}" data-link>${escapeHtml(r.team)}</a><b>${r.score}</b></li>`).join('')}</ol></article>`).join('')}</div></section>
      </div>

      <div class="trivia-tab-panel" data-trivia-panel="teams"><section class="section"><div class="section-heading"><div><p class="eyebrow">OFFICIAL TEAM DIRECTORY</p><h2>Every established team</h2></div><p>Select a team for its full sports-style profile and game log.</p></div><div class="sports-team-grid">${profileTeams.map((t,i)=>`<a class="sports-team-card" href="${teamLink(t)}" data-link><span class="sports-rank">${stats.standings.indexOf(t)+1}</span><div class="mini-crest">${escapeHtml(t.team.split(/\s+/).map(w=>w[0]).slice(0,3).join(''))}</div><h3>${escapeHtml(t.team)}</h3><div><b>${t.wins}<small>WINS</small></b><b>${t.podiums}<small>PODIUMS</small></b><b>${t.best}<small>BEST</small></b></div><p>${t.played} played · ${t.avgFinish.toFixed(2)} average finish</p></a>`).join('')}</div></section></div>

      <div class="trivia-tab-panel" data-trivia-panel="standings"><section class="section"><div class="section-heading"><div><p class="eyebrow">ALL-TIME TABLE</p><h2>Complete standings</h2></div><p>Ranked by wins, podiums, average finish, and best score.</p></div><div class="trivia-table-wrap"><table class="trivia-table"><thead><tr><th>Rank</th><th>Team</th><th>Played</th><th>Wins</th><th>Podiums</th><th>Win %</th><th>Podium %</th><th>Avg score</th><th>Best</th><th>Avg finish</th></tr></thead><tbody>${stats.standings.map((t,i)=>`<tr><td>${i+1}</td><td><a href="${teamLink(t)}" data-link><strong>${escapeHtml(t.team)}</strong></a></td><td>${t.played}</td><td>${t.wins}</td><td>${t.podiums}</td><td>${t.winRate.toFixed(1)}%</td><td>${t.podiumRate.toFixed(1)}%</td><td>${t.avg.toFixed(1)}</td><td>${t.best}</td><td>${t.avgFinish.toFixed(2)}</td></tr>`).join('')}</tbody></table></div></section></div>

      <div class="trivia-tab-panel" data-trivia-panel="records"><section class="section"><div class="section-heading"><div><p class="eyebrow">RECORD BOOK</p><h2>All-time records</h2></div></div><div class="record-grid">${recordCard('Most wins',`${stats.champion.wins}`,stats.champion.team)}${recordCard('Most podiums',`${[...stats.standings].sort((a,b)=>b.podiums-a.podiums)[0].podiums}`,[...stats.standings].sort((a,b)=>b.podiums-a.podiums)[0].team)}${recordCard('Highest score',`${stats.highest[0].score}`,`${stats.highest[0].team} · ${triviaFmtDate(stats.highest[0].date)}`)}${recordCard('Highest losing score','371','TMobile · July 9, 2026')}${recordCard('Longest streak',`${stats.streaks[0].count} wins`,stats.streaks[0].team)}${recordCard('Closest finish',`${stats.closest[0].margin} points`,`${stats.closest[0].winner} over ${stats.closest[0].runner}`)}${recordCard('Largest victory',`${stats.largest[0].margin} points`,`${stats.largest[0].winner} · ${triviaFmtDate(stats.largest[0].date)}`)}${recordCard('Largest field','10 teams','March 19 and April 2')}</div><div class="records-columns"><article><h3>Highest scores</h3><ol class="record-list">${stats.highest.map(r=>`<li><span>${escapeHtml(r.team)}<small>${triviaFmtDate(r.date)}</small></span><b>${r.score}</b></li>`).join('')}</ol></article><article><h3>Closest finishes</h3><ol class="record-list">${stats.closest.map(r=>`<li><span>${escapeHtml(r.winner)} over ${escapeHtml(r.runner)}<small>${triviaFmtDate(r.date)}</small></span><b>${r.margin}</b></li>`).join('')}</ol></article><article><h3>Largest victories</h3><ol class="record-list">${stats.largest.map(r=>`<li><span>${escapeHtml(r.winner)} over ${escapeHtml(r.runner)}<small>${triviaFmtDate(r.date)}</small></span><b>${r.margin}</b></li>`).join('')}</ol></article></div></section></div>

      <div class="trivia-tab-panel" data-trivia-panel="streaks"><section class="section"><div class="section-heading"><div><p class="eyebrow">DYNASTIES</p><h2>Winning streaks</h2></div></div><div class="streak-grid">${stats.streaks.filter(s=>s.count>1).map((s,i)=>`<article><b>${i+1}</b><h3>${escapeHtml(s.team)}</h3><strong>${s.count} straight</strong><p>${triviaFmtDate(s.start,false)}–${triviaFmtDate(s.end,true)}</p><div class="streak-night-list">${s.nights.map(n=>`<span>${triviaFmtDate(n.date,false)} · ${n.results[0].score}</span>`).join('')}</div><a href="/island-vibes/trivia/team/${triviaTeamSlug(s.team)}" data-link>Team profile →</a></article>`).join('')}</div><div class="month-grid">${stats.months.map(m=>`<article><span>${new Date(m.key+'-15T12:00:00').toLocaleDateString('en-US',{month:'long',year:'numeric'})}</span><strong>${escapeHtml(m.leader)}</strong><b>${m.leaderWins} win${m.leaderWins===1?'':'s'}</b><small>${m.nights} nights · ${m.avgTeams.toFixed(1)} avg teams · high ${m.high}</small></article>`).join('')}</div></section></div>

      <div class="trivia-tab-panel" data-trivia-panel="results"><section class="section"><div class="section-heading"><div><p class="eyebrow">COMPLETE HISTORY</p><h2>Results archive</h2></div><div class="trivia-filter-row"><label class="trivia-search-label">Search team<input id="trivia-search" class="search-box" type="search" placeholder="Team name"></label><label class="trivia-search-label">Month<select id="trivia-month" class="filter-select"><option value="">All months</option>${stats.months.map(m=>`<option value="${m.key}">${new Date(m.key+'-15T12:00:00').toLocaleDateString('en-US',{month:'long',year:'numeric'})}</option>`).join('')}</select></label></div></div><div id="trivia-archive" class="trivia-archive">${stats.source.nights.slice().reverse().map(n=>`<article class="trivia-night" data-date="${n.date}" data-teams="${escapeHtml(n.results.map(r=>r.team.toLowerCase()).join(' '))}"><header><div><span>${triviaFmtDate(n.date)}</span><h3>${escapeHtml(n.results[0].team)} won</h3></div><strong>${n.results[0].score}</strong></header><ol>${n.results.map(r=>`<li><span class="place">${r.place}</span><a href="/island-vibes/trivia/team/${triviaTeamSlug(r.team)}" data-link>${escapeHtml(r.team)}</a><b>${r.score}</b></li>`).join('')}</ol>${n.partial?'<p class="partial-note">Only the visible portion of this scoreboard was available.</p>':''}</article>`).join('')}</div></section></div>
    </div></div>`;
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

          <section class="section card-system-showcase" aria-labelledby="card-system-title">
            <div class="section-heading">
              <div>
                <p class="eyebrow">BRANDED PLAYER EXPERIENCE</p>
                <h2 id="card-system-title">See how the card-to-phone system works.</h2>
              </div>
              <p>One platform, customized for every venue.</p>
            </div>
            <div class="card-example-grid">
              <article class="card-example island-card-example">
                <div class="card-example-top">
                  <img src="/assets/island-vibes-logo.png" alt="Island Vibes logo">
                  <div><span>Island Vibes</span><strong>Northeaster</strong></div>
                </div>
                <div class="card-example-board" aria-hidden="true">
                  <span>SONG</span><span>SONG</span><span>SONG</span><span>SONG</span><span>SONG</span>
                  <span>SONG</span><span>SONG</span><span>SONG</span><span>SONG</span><span>SONG</span>
                  <span>SONG</span><span>SONG</span><b>FREE</b><span>SONG</span><span>SONG</span>
                  <span>SONG</span><span>SONG</span><span>SONG</span><span>SONG</span><span>SONG</span>
                  <span>SONG</span><span>SONG</span><span>SONG</span><span>SONG</span><span>SONG</span>
                </div>
                <div class="card-example-footer">
                  <img src="/assets/qr-island-vibes-northeaster.png" alt="QR code opening the Island Vibes Northeaster round">
                  <p><strong>Venue-specific QR</strong><span>Opens the Island Vibes-branded player page.</span></p>
                </div>
              </article>

              <article class="card-example mangrove-card-example">
                <div class="card-example-top">
                  <img src="/assets/mangrove-sands-primary.png" alt="Mangrove Sands logo">
                  <div><span>Mangrove Sands</span><strong>Northeaster</strong></div>
                </div>
                <div class="card-example-board" aria-hidden="true">
                  <span>SONG</span><span>SONG</span><span>SONG</span><span>SONG</span><span>SONG</span>
                  <span>SONG</span><span>SONG</span><span>SONG</span><span>SONG</span><span>SONG</span>
                  <span>SONG</span><span>SONG</span><b>FREE</b><span>SONG</span><span>SONG</span>
                  <span>SONG</span><span>SONG</span><span>SONG</span><span>SONG</span><span>SONG</span>
                  <span>SONG</span><span>SONG</span><span>SONG</span><span>SONG</span><span>SONG</span>
                </div>
                <div class="card-example-footer">
                  <img src="/assets/qr-mangrove-sands-northeaster.png" alt="QR code opening the Mangrove Sands Northeaster round">
                  <p><strong>Same round, different venue</strong><span>Opens the Mangrove Sands-branded player page.</span></p>
                </div>
              </article>
            </div>
            <div class="card-system-steps">
              <div><strong>1</strong><span>A player scans the QR printed on their card.</span></div>
              <div><strong>2</strong><span>The correct venue and round open automatically.</span></div>
              <div><strong>3</strong><span>The playlist, live board, and venue branding stay together.</span></div>
            </div>
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

  const liveBoardPage = (venue) => `
    <div class="live-board-page ${escapeHtml(venue.theme)}">
      <div class="page-shell">
        <section class="live-board-hero">
          <div>
            <p class="eyebrow">${escapeHtml(venue.shortName)} · LIVE EVENT</p>
            <h1>Now Playing</h1>
            <p class="lead">Follow the current song and everything played tonight. This board updates automatically while the host session is active.</p>
            <div class="live-status" id="live-status"><span class="live-dot"></span><span>Checking live event</span></div>
          </div>
          ${venueLogo(venue, "hero")}
        </section>
        <section class="live-board-layout" data-live-venue="${escapeHtml(venue.slug)}" data-live-round="*">
          <article class="now-playing live-now-feature" id="now-playing">
            <span class="label">Now Playing</span>
            <h3>Waiting for the host</h3>
            <p>The live board appears automatically when the event begins.</p>
          </article>
          <article class="live-history-panel">
            <header><div><p class="eyebrow">TONIGHT'S MUSIC</p><h2>Played tonight</h2></div><span id="live-count">0 songs</span></header>
            <div class="history" id="history"><p class="help-text">No songs have been published yet.</p></div>
          </article>
        </section>
        <div class="live-board-actions">
          <a class="button secondary" href="/${escapeHtml(venue.slug)}" data-link>Back to ${escapeHtml(venue.shortName)}</a>
          ${venue.slug === "island-vibes" ? '<a class="button secondary" href="/island-vibes/trivia" data-link>Trivia Headquarters</a>' : ''}
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
    const count = document.getElementById("live-count");
    if (!status || !now || !history) return;

    const config = await backendConfig();
    if (!config) {
      status.innerHTML = `<span class="live-dot"></span><span>Live board ready after setup</span>`;
      return;
    }

    try {
      const sessions = await supabaseGet(
        roundSlug === "*"
          ? `sessions?select=id,venue_slug,round_slug,started_at&venue_slug=eq.${encodeURIComponent(venueSlug)}&status=eq.active&order=started_at.desc&limit=1`
          : `sessions?select=id,venue_slug,round_slug,started_at&venue_slug=eq.${encodeURIComponent(venueSlug)}&round_slug=eq.${encodeURIComponent(roundSlug)}&status=eq.active&order=started_at.desc&limit=1`,
        config
      );
      if (!sessions.length) {
        status.classList.remove("active");
        status.innerHTML = `<span class="live-dot"></span><span>No active session</span>`;
        now.innerHTML = `<span class="label">Now Playing</span><h3>Waiting for the host</h3><p>The live board appears when this round starts.</p>`;
        history.innerHTML = `<p class="help-text">No active song history.</p>`;
        if (count) count.textContent = "0 songs";
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
        if (count) count.textContent = "0 songs";
        return;
      }
      const latest = tracks[0];
      now.innerHTML = `<span class="label">Now Playing · Song ${escapeHtml(latest.position)}</span><h3>${escapeHtml(latest.title)}</h3><p>${escapeHtml(latest.artist || "Artist unavailable")}</p>`;
      if (count) count.textContent = `${tracks.length} song${tracks.length === 1 ? "" : "s"}`;
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
    } else if (parts.length === 4 && parts[0] === "island-vibes" && parts[1] === "trivia" && parts[2] === "team") {
      const venue = DATA.venues["island-vibes"];
      app.innerHTML = triviaTeamPage(venue, parts[3]);
      document.title = `Team Profile · Island Vibes Trivia · XY&Z`;
    } else if (path === "/island-vibes/trivia") {
      const venue = DATA.venues["island-vibes"];
      app.innerHTML = triviaPage(venue);
      document.title = `Island Vibes Trivia Headquarters · XY&Z`;
    } else if (parts.length === 2 && DATA.venues[parts[0]] && parts[1] === "live") {
      const venue = DATA.venues[parts[0]];
      app.innerHTML = liveBoardPage(venue);
      document.title = `Live Board · ${venue.shortName} · XY&Z`;
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
    if (path === "/island-vibes/trivia") {
      const activateTriviaTab=(name)=>{
        document.querySelectorAll("[data-trivia-tab]").forEach(b=>b.classList.toggle("active",b.dataset.triviaTab===name));
        document.querySelectorAll("[data-trivia-panel]").forEach(p=>p.classList.toggle("active",p.dataset.triviaPanel===name));
        window.scrollTo({top:document.querySelector(".trivia-tabbar")?.offsetTop-90 || 0,behavior:"smooth"});
      };
      document.querySelectorAll("[data-trivia-tab]").forEach(b=>b.addEventListener("click",()=>activateTriviaTab(b.dataset.triviaTab)));
      document.querySelectorAll(".trivia-tab-trigger").forEach(b=>b.addEventListener("click",()=>activateTriviaTab(b.dataset.tabTarget)));
      const q=document.getElementById("trivia-search");
      const m=document.getElementById("trivia-month");
      const filterTrivia=()=>document.querySelectorAll(".trivia-night").forEach(card=>{
        const matchesTeam=!q?.value.trim() || card.dataset.teams.includes(q.value.trim().toLowerCase());
        const matchesMonth=!m?.value || card.dataset.date.startsWith(m.value);
        card.hidden=!(matchesTeam&&matchesMonth);
      });
      q?.addEventListener("input",filterTrivia);
      m?.addEventListener("change",filterTrivia);
    }
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
        navDropdown?.classList.remove("open");
        navDropdownToggle?.setAttribute("aria-expanded", "false");
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
  navDropdownToggle?.addEventListener("click", () => {
    const open = navDropdown.classList.toggle("open");
    navDropdownToggle.setAttribute("aria-expanded", String(open));
  });
  document.addEventListener("click", (event) => {
    if (navDropdown && !navDropdown.contains(event.target)) {
      navDropdown.classList.remove("open");
      navDropdownToggle?.setAttribute("aria-expanded", "false");
    }
  });
  window.addEventListener("popstate", render);
  handleLegacyQuery();
  render();
})();
