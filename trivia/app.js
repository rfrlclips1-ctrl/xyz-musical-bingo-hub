(() => {
  const d = window.TRIVIA_DATA;
  if (!d) return;

  const $ = (id) => document.getElementById(id);
  const pct = (n) => `${Number(n).toFixed(0)}%`;

  $("updated").textContent = `Season data updated ${d.lastUpdated} • ${d.season.officialNights} official nights`;

  const headlineStats = [
    { label: "Season leader", value: `${d.season.leader.wins} wins`, detail: d.season.leader.team, emphasis: true },
    { label: "Chasing", value: `${d.season.challenger.wins} wins`, detail: d.season.challenger.team, emphasis: true },
    { label: "Current streak", value: "3 straight", detail: "Seannah • ACTIVE", emphasis: false },
    { label: "Two-team control", value: pct(d.season.combinedWinPct), detail: `${d.season.combinedWins} of ${d.season.officialNights} nights won by Wise Ass Owls + Seannah`, emphasis: false }
  ];
  $("headline-stats").innerHTML = headlineStats.map(s => `
    <article class="stat-card ${s.emphasis ? "emphasis" : ""}">
      <span class="label">${s.label}</span>
      <span class="value">${s.value}</span>
      <span class="detail">${s.detail}</span>
    </article>`).join("");

  const lg = d.latestGame;
  $("latest-headline").textContent = lg.headline;
  $("latest-date").textContent = lg.date;
  $("latest-summary").textContent = lg.summary;
  $("latest-podium").innerHTML = lg.podium.map(p => `
    <div class="podium-row">
      <span class="place">${p.place}</span>
      <span class="podium-team">${p.team}</span>
      <span class="podium-score">${p.score}</span>
    </div>`).join("");
  $("latest-notes").innerHTML = lg.notes.map(n => `<li>${n}</li>`).join("");

  let lastWins = null, rank = 0;
  $("standings").innerHTML = d.season.standings.map((s, i) => {
    if (s.wins !== lastWins) rank = i + 1;
    lastWins = s.wins;
    const displayRank = s.wins === 0 ? "—" : rank;
    return `
      <tr class="${i < 2 ? "top-two" : ""}">
        <td class="rank">${displayRank}</td>
        <td class="team">${s.team}</td>
        <td class="wins">${s.wins}</td>
      </tr>`;
  }).join("");

  $("race-note").innerHTML =
    `<strong>${d.season.leader.team}</strong> still leads, but <strong>${d.season.challenger.team}</strong> is now only ` +
    `<strong>${d.season.leader.wins - d.season.challenger.wins} wins back</strong>. Together they have won ` +
    `<strong>${d.season.combinedWins} of ${d.season.officialNights}</strong> official trivia nights.`;

  $("records").innerHTML = d.season.records.map(r => `
    <article class="record-card">
      <span class="record-label">${r.label}</span>
      <span class="record-value">${r.value}</span>
      <span class="record-detail">${r.detail}</span>
    </article>`).join("");

  $("recent-games").innerHTML = d.recentGames.map(g => `
    <article class="game-card">
      <div class="game-date">${g.date}</div>
      ${g.results.map(r => `
        <div class="game-result">
          <span>${r.place}</span>
          <strong>${r.team}</strong>
          <span class="game-score">${r.score}</span>
        </div>`).join("")}
    </article>`).join("");

  $("streaks").innerHTML = d.season.winStreaks.map(s => `
    <div class="streak-row">
      <span class="streak-team">${s.team}</span>
      <span class="streak-num">${s.streak}</span>
      <span class="streak-status ${s.status === "ACTIVE" ? "active" : ""}">${s.status}</span>
    </div>`).join("");

  $("aliases").innerHTML = Object.entries(d.aliases).map(([canonical, aliases]) => `
    <div class="alias-item"><strong>${canonical}</strong> ← ${aliases.join(" • ")}</div>
  `).join("");
})();
