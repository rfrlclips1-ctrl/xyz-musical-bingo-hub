(() => {
  "use strict";
  const DATA = window.XYZ_BINGO;
  const keyInput = document.getElementById("host-key");
  const venueSelect = document.getElementById("venue-select");
  const roundSelect = document.getElementById("round-select");
  const guestLink = document.getElementById("guest-link");
  const log = document.getElementById("host-log");
  const status = document.getElementById("session-status");

  const writeLog = (message) => {
    const timestamp = new Date().toLocaleTimeString();
    log.textContent = `[${timestamp}] ${message}\n${log.textContent}`.trim();
  };

  let savedKey = "";
  try { savedKey = localStorage.getItem("xyz-bingo-host-key") || ""; } catch (_error) { savedKey = ""; }
  if (savedKey) keyInput.value = savedKey;

  Object.values(DATA.venues).forEach((venue) => {
    venueSelect.add(new Option(venue.name, venue.slug));
  });

  const updateRounds = () => {
    const venue = DATA.venues[venueSelect.value];
    roundSelect.innerHTML = "";
    venue.rounds.forEach((slug) => {
      const round = DATA.rounds[slug];
      if (round) roundSelect.add(new Option(round.title, round.slug));
    });
    updateGuestLink();
  };

  const updateGuestLink = () => {
    guestLink.href = `/${venueSelect.value}/${roundSelect.value}`;
  };

  const request = async (action) => {
    const hostKey = keyInput.value.trim();
    if (!hostKey) throw new Error("Enter the private host key first.");
    const response = await fetch("/.netlify/functions/host-session", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-host-key": hostKey
      },
      body: JSON.stringify({
        action,
        venueSlug: venueSelect.value,
        roundSlug: roundSelect.value
      })
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.error || `Request failed (${response.status})`);
    return body;
  };

  const run = async (action, button, successText) => {
    button.disabled = true;
    try {
      writeLog(`${action} requested for ${venueSelect.value}/${roundSelect.value}.`);
      const result = await request(action);
      writeLog(result.message || successText);
      status.textContent = result.active ? "Session active" : "No active session";
      status.classList.toggle("active", Boolean(result.active));
    } catch (error) {
      writeLog(`ERROR: ${error.message}`);
    } finally {
      button.disabled = false;
    }
  };

  document.getElementById("save-key").addEventListener("click", () => {
    if (!keyInput.value.trim()) return writeLog("Nothing to save.");
    try {
      localStorage.setItem("xyz-bingo-host-key", keyInput.value.trim());
      writeLog("Host key saved on this browser only.");
    } catch (_error) {
      writeLog("This browser blocked local key storage; keep the page open or paste the key again later.");
    }
  });
  document.getElementById("forget-key").addEventListener("click", () => {
    try { localStorage.removeItem("xyz-bingo-host-key"); } catch (_error) {}
    keyInput.value = "";
    writeLog("Saved host key removed.");
  });
  document.getElementById("start-session").addEventListener("click", (event) => run("start", event.currentTarget, "Session started."));
  document.getElementById("end-session").addEventListener("click", (event) => run("end", event.currentTarget, "Session ended."));
  document.getElementById("clear-history").addEventListener("click", (event) => run("clear", event.currentTarget, "History cleared."));
  venueSelect.addEventListener("change", updateRounds);
  roundSelect.addEventListener("change", updateGuestLink);
  updateRounds();
})();
