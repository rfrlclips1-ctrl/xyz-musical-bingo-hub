(() => {
  "use strict";
  const DATA = window.XYZ_BINGO;
  const CATALOG = window.XYZ_SONG_CATALOG || {};
  const $ = (id) => document.getElementById(id);
  const keyInput = $("host-key");
  const venueSelect = $("venue-select");
  const roundSelect = $("round-select");
  const guestLink = $("guest-link");
  const headerGuestLink = $("header-guest-link");
  const log = $("host-log");
  const status = $("session-status");
  const quickSong = $("quick-song");
  const currentSong = $("current-song");
  const publishButton = $("publish-song");
  const songGrid = $("song-grid");
  const songSearch = $("song-search");
  const songCount = $("song-count");
  const pickerEmpty = $("picker-empty");
  const unplayedButton = $("show-unplayed");
  const catalogEditor = $("catalog-editor");
  const catalogAddSong = $("catalog-add-song");
  const catalogAddButton = $("catalog-add-button");
  const catalogRemoveModeButton = $("catalog-remove-mode");
  const editModeNote = $("edit-mode-note");
  let played = [];
  let activeSong = "";
  let showUnplayedOnly = false;
  let removeMode = false;
  let catalogEdits = {};

  try { catalogEdits = JSON.parse(localStorage.getItem("xyz-bingo-catalog-edits") || "{}"); } catch (_error) { catalogEdits = {}; }

  const saveCatalogEdits = () => {
    try { localStorage.setItem("xyz-bingo-catalog-edits", JSON.stringify(catalogEdits)); }
    catch (_error) { writeLog("This browser could not save song-list changes."); }
  };

  const originalSongs = () => [...(CATALOG[roundSelect.value] || [])];
  const currentSongs = () => {
    const slug = roundSelect.value;
    const edit = catalogEdits[slug] || { added: [], removed: [] };
    const removed = new Set(edit.removed || []);
    return originalSongs().filter((song) => !removed.has(song)).concat((edit.added || []).filter((song) => !removed.has(song)));
  };

  const writeLog = (message) => {
    const timestamp = new Date().toLocaleTimeString();
    log.textContent = `[${timestamp}] ${message}\n${log.textContent}`.trim();
  };

  let savedKey = "";
  try { savedKey = localStorage.getItem("xyz-bingo-host-key") || ""; } catch (_error) {}
  if (savedKey) keyInput.value = savedKey;

  Object.values(DATA.venues).forEach((venue) => venueSelect.add(new Option(venue.name, venue.slug)));

  const updateGuestLink = () => {
    const href = `/${venueSelect.value}/live`;
    guestLink.href = href;
    headerGuestLink.href = href;
  };

  const hostKey = () => {
    const value = keyInput.value.trim();
    if (!value) throw new Error("Open Host key settings and enter the private key first.");
    return value;
  };

  const postJson = async (url, body) => {
    const response = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json", "x-host-key": hostKey() },
      body: JSON.stringify(body)
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || `Request failed (${response.status})`);
    return result;
  };

  const sessionRequest = (action) => postJson("/.netlify/functions/host-session", {
    action,
    venueSlug: venueSelect.value,
    roundSlug: roundSelect.value
  });

  const parseSong = (raw) => {
    const value = String(raw || "").trim();
    if (!value) return { title: "", artist: "" };
    const lines = value.split(/\r?\n/).map((part) => part.trim()).filter(Boolean);
    if (lines.length >= 2) return { title: lines[0], artist: lines.slice(1).join(" ") };
    const separators = [/\s+—\s+/, /\s+–\s+/, /\s+\|\s+/, /\s+-\s+/];
    for (const separator of separators) {
      const parts = value.split(separator);
      if (parts.length >= 2) return { title: parts[0].trim(), artist: parts.slice(1).join(" - ").trim() };
    }
    return { title: value, artist: "" };
  };

  const setLiveState = (active) => {
    status.textContent = active ? "LIVE" : "Not live";
    status.classList.toggle("active", Boolean(active));
  };

  const renderSongs = () => {
    const songs = currentSongs();
    const query = songSearch.value.trim().toLowerCase();
    const visible = songs.filter((song) => {
      if (showUnplayedOnly && played.includes(song)) return false;
      return !query || song.toLowerCase().includes(query);
    });
    songGrid.innerHTML = "";
    pickerEmpty.hidden = songs.length > 0;
    songCount.textContent = songs.length ? `${visible.length} of ${songs.length} songs shown · ${played.length} played` : "No saved list for this round";
    visible.forEach((song) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "song-button";
      if (played.includes(song)) button.classList.add("played");
      if (activeSong === song) button.classList.add("current");
      button.textContent = song;
      if (removeMode) button.classList.add("editing");
      button.setAttribute("aria-label", removeMode ? `Remove ${song}` : `Publish ${song}`);
      button.addEventListener("click", () => removeMode ? removeCatalogSong(song) : publishSong(song, ""));
      songGrid.appendChild(button);
    });
  };

  const resetRoundState = () => {
    removeMode = false;
    catalogRemoveModeButton.textContent = "TURN ON REMOVE MODE";
    editModeNote.hidden = true;
    played = [];
    activeSong = "";
    currentSong.textContent = "No song selected yet.";
    songSearch.value = "";
    renderSongs();
  };

  const updateRounds = () => {
    const venue = DATA.venues[venueSelect.value];
    roundSelect.innerHTML = "";
    venue.rounds.forEach((slug) => {
      const round = DATA.rounds[slug];
      if (round) roundSelect.add(new Option(round.title, round.slug));
    });
    updateGuestLink();
    resetRoundState();
  };

  const runSessionAction = async (action, button) => {
    button.disabled = true;
    try {
      const result = await sessionRequest(action);
      setLiveState(Boolean(result.active));
      writeLog(result.message || `${action} complete.`);
      if (action === "start") songSearch.focus();
      if (action === "clear" || action === "end") resetRoundState();
    } catch (error) {
      writeLog(`ERROR: ${error.message}`);
    } finally {
      button.disabled = false;
    }
  };

  const publishSong = async (title, artist) => {
    if (!title) return;
    try {
      const result = await postJson("/.netlify/functions/bridge-track", {
        venueSlug: venueSelect.value,
        title,
        artist: artist || "",
        detectedAt: new Date().toISOString()
      });
      if (result.waiting) throw new Error("No active session. Press GO LIVE first.");
      if (result.duplicate) {
        writeLog("That is already the current song.");
        return;
      }
      if (activeSong && !played.includes(activeSong)) played.push(activeSong);
      activeSong = title;
      if (!played.includes(title)) played.push(title);
      currentSong.textContent = `Now showing: ${artist ? `${title} — ${artist}` : title}`;
      writeLog(`Published song #${result.position}: ${title}${artist ? ` — ${artist}` : ""}`);
      renderSongs();
    } catch (error) {
      writeLog(`ERROR: ${error.message}`);
    }
  };


  const addCatalogSong = () => {
    const parsed = parseSong(catalogAddSong.value);
    if (!parsed.title) return writeLog("Enter a song title before adding it.");
    const song = parsed.artist ? `${parsed.title} — ${parsed.artist}` : parsed.title;
    const slug = roundSelect.value;
    const edit = catalogEdits[slug] || { added: [], removed: [] };
    edit.added = edit.added || [];
    edit.removed = (edit.removed || []).filter((item) => item !== song);
    if (!originalSongs().includes(song) && !edit.added.includes(song)) edit.added.push(song);
    catalogEdits[slug] = edit;
    saveCatalogEdits();
    catalogAddSong.value = "";
    writeLog(`Added to ${DATA.rounds[slug]?.title || slug}: ${song}`);
    renderSongs();
    catalogAddSong.focus();
  };

  const removeCatalogSong = (song) => {
    const slug = roundSelect.value;
    const edit = catalogEdits[slug] || { added: [], removed: [] };
    edit.added = (edit.added || []).filter((item) => item !== song);
    if (originalSongs().includes(song) && !(edit.removed || []).includes(song)) {
      edit.removed = [...(edit.removed || []), song];
    }
    catalogEdits[slug] = edit;
    saveCatalogEdits();
    played = played.filter((item) => item !== song);
    if (activeSong === song) activeSong = "";
    writeLog(`Removed from this device's list: ${song}`);
    renderSongs();
  };

  const resetCatalog = () => {
    delete catalogEdits[roundSelect.value];
    saveCatalogEdits();
    writeLog("Restored the original song list for this round.");
    renderSongs();
  };

  const publishManual = async () => {
    const parsed = parseSong(quickSong.value);
    if (!parsed.title) return writeLog("Paste a song title first.");
    publishButton.disabled = true;
    await publishSong(parsed.title, parsed.artist);
    quickSong.value = "";
    publishButton.disabled = false;
    quickSong.focus();
  };


  $("toggle-catalog-editor").addEventListener("click", () => {
    catalogEditor.hidden = !catalogEditor.hidden;
    if (!catalogEditor.hidden) catalogAddSong.focus();
  });
  catalogAddButton.addEventListener("click", addCatalogSong);
  catalogAddSong.addEventListener("keydown", (event) => {
    if (event.key === "Enter") { event.preventDefault(); addCatalogSong(); }
  });
  catalogRemoveModeButton.addEventListener("click", () => {
    removeMode = !removeMode;
    catalogRemoveModeButton.textContent = removeMode ? "TURN OFF REMOVE MODE" : "TURN ON REMOVE MODE";
    editModeNote.hidden = !removeMode;
    renderSongs();
  });
  $("catalog-reset").addEventListener("click", resetCatalog);

  $("undo-song").addEventListener("click", () => {
    if (!played.length) return writeLog("Nothing to undo yet.");
    const removed = played.pop();
    activeSong = played[played.length - 1] || "";
    currentSong.textContent = activeSong ? `Previous selection restored locally: ${activeSong}` : "No song selected yet.";
    writeLog(`Undid ${removed}. Select the correct song to update the guest board.`);
    renderSongs();
  });
  songSearch.addEventListener("input", renderSongs);
  unplayedButton.addEventListener("click", () => {
    showUnplayedOnly = !showUnplayedOnly;
    unplayedButton.textContent = showUnplayedOnly ? "Show all songs" : "Show unplayed only";
    renderSongs();
  });
  $("save-key").addEventListener("click", () => {
    if (!keyInput.value.trim()) return writeLog("Enter a host key before saving.");
    try {
      localStorage.setItem("xyz-bingo-host-key", keyInput.value.trim());
      writeLog("Host key saved on this device.");
      $("setup-panel").classList.remove("open");
      songSearch.focus();
    } catch (_error) { writeLog("This browser blocked local storage."); }
  });
  $("forget-key").addEventListener("click", () => {
    try { localStorage.removeItem("xyz-bingo-host-key"); } catch (_error) {}
    keyInput.value = "";
    writeLog("Saved host key removed.");
  });
  $("toggle-setup").addEventListener("click", () => {
    $("setup-panel").classList.toggle("open");
    if ($("setup-panel").classList.contains("open")) keyInput.focus();
  });
  $("start-session").addEventListener("click", (event) => runSessionAction("start", event.currentTarget));
  $("end-session").addEventListener("click", (event) => runSessionAction("end", event.currentTarget));
  $("clear-history").addEventListener("click", (event) => runSessionAction("clear", event.currentTarget));
  publishButton.addEventListener("click", publishManual);
  quickSong.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); publishManual(); }
  });
  venueSelect.addEventListener("change", updateRounds);
  roundSelect.addEventListener("change", () => { updateGuestLink(); resetRoundState(); });
  updateRounds();
  if (!savedKey) $("setup-panel").classList.add("open");
})();
