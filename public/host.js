(() => {
  "use strict";
  const DATA = window.XYZ_BINGO;
  const keyInput = document.getElementById("host-key");
  const venueSelect = document.getElementById("venue-select");
  const roundSelect = document.getElementById("round-select");
  const guestLink = document.getElementById("guest-link");
  const log = document.getElementById("host-log");
  const status = document.getElementById("session-status");
  const testTitle = document.getElementById("test-title");
  const testArtist = document.getElementById("test-artist");

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
    guestLink.href = `/${venueSelect.value}/live`;
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

  const publishTrack = async (title, artist = "") => {
    const hostKey = keyInput.value.trim();
    if (!hostKey) throw new Error("Enter the private host key first.");
    const response = await fetch("/.netlify/functions/bridge-track", {
      method: "POST",
      headers: { "content-type": "application/json", "x-host-key": hostKey },
      body: JSON.stringify({ venueSlug: venueSelect.value, title, artist, detectedAt: new Date().toISOString() })
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.error || `Publish failed (${response.status})`);
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
  document.getElementById("check-session").addEventListener("click", (event) => run("status", event.currentTarget, "Session checked."));
  document.getElementById("publish-test").addEventListener("click", async (event) => {
    const button = event.currentTarget;
    const title = testTitle.value.trim();
    if (!title) return writeLog("Enter a song title first.");
    button.disabled = true;
    try {
      const result = await publishTrack(title, testArtist.value.trim());
      writeLog(result.waiting ? "No active session. Start one first." : result.duplicate ? "That song is already the latest track." : `Published song #${result.position}: ${title}.`);
    } catch (error) { writeLog(`ERROR: ${error.message}`); }
    finally { button.disabled = false; }
  });
  document.getElementById("demo-sequence").addEventListener("click", async (event) => {
    const button = event.currentTarget;
    const demo = [["September","Earth, Wind & Fire"],["I Wanna Dance with Somebody","Whitney Houston"],["Don't Stop Believin'","Journey"]];
    button.disabled = true;
    try {
      for (const [title, artist] of demo) {
        const result = await publishTrack(title, artist);
        if (result.waiting) throw new Error("No active session. Start one first.");
        writeLog(`Demo published: ${artist} — ${title}.`);
        await new Promise(resolve => setTimeout(resolve, 1800));
      }
      writeLog("Three-song demo complete. Check the guest live board.");
    } catch (error) { writeLog(`ERROR: ${error.message}`); }
    finally { button.disabled = false; }
  });
  venueSelect.addEventListener("change", updateRounds);
  roundSelect.addEventListener("change", updateGuestLink);
  updateRounds();
})();
