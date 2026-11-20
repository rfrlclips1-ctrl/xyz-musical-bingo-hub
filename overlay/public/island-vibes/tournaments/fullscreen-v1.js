/* Island Vibes Tournament Tuesdays | accessible live fullscreen bracket.
   Presentation uses existing server-authoritative brackets and score controls.
   The host must still authenticate; player viewers have read-only scores. */
(() => {
  'use strict';
  const main = document.getElementById('main');
  if (!main) return;
  let active = false, stage = '', scale = 1, fitMode = true, scheduled = false;
  const root = document.createElement('section');
  root.id = 'iv-live-presentation';
  root.className = 'iv-live-presentation';
  root.setAttribute('aria-label', 'Tournament fullscreen bracket');
  root.hidden = true;
  root.innerHTML = `
    <header class="iv-live-header">
      <div class="iv-live-brand"><img src="/island-vibes/tournaments/iv-logo.jpg" alt=""><div><small>ISLAND VIBES · TOURNAMENT TUESDAYS</small><strong id="iv-live-name">LIVE BRACKET</strong></div></div>
      <div class="iv-live-header-actions"><span id="iv-live-host" class="iv-live-host" aria-live="polite">Player view · scores are read-only</span><button type="button" data-live-action="exit" class="iv-live-button iv-live-close" aria-label="Exit fullscreen">✕ Exit fullscreen</button></div>
    </header>
    <div class="iv-live-toolbar"><nav id="iv-live-stages" aria-label="Choose bracket stage" class="iv-live-tabs"></nav>
      <div class="iv-live-tools"><button type="button" data-live-action="fit" class="iv-live-button" aria-label="Fit bracket to screen">⤢ Fit screen</button><button type="button" data-live-action="minus" class="iv-live-button" aria-label="Zoom out">−</button><output id="iv-live-scale" aria-live="off">100%</output><button type="button" data-live-action="plus" class="iv-live-button" aria-label="Zoom in">+</button><button type="button" data-action="refresh" class="iv-live-button" aria-label="Refresh live scores">↻ Refresh</button></div>
    </div>
    <div class="iv-live-scroll" id="iv-live-scroll" tabindex="0" role="region" aria-label="Scrollable tournament bracket"><div id="iv-live-spacer" class="iv-live-spacer"><div id="iv-live-track" class="iv-live-track"></div></div></div>
    <div class="iv-live-footer"><span id="iv-live-stage-label">Live tournament</span><span>Live scores refresh automatically · Swipe or scroll to explore the bracket</span></div>`;
  document.body.appendChild(root);
  const floatingUi = [document.getElementById('overlay'), document.getElementById('toast')].filter(Boolean);
  const stagesEl = root.querySelector('#iv-live-stages');
  const trackHost = root.querySelector('#iv-live-track');
  const viewport = root.querySelector('#iv-live-scroll');
  const spacer = root.querySelector('#iv-live-spacer');
  const output = root.querySelector('#iv-live-scale');
  const liveTitle = root.querySelector('#iv-live-name');
  const hostLabel = root.querySelector('#iv-live-host');
  const footer = root.querySelector('#iv-live-stage-label');
  const stageKey = title => {
    const s = title.toLowerCase();
    if (s.includes('upper') || s.includes('winner')) return 'winners';
    if (s.includes('lower') || s.includes('loser')) return 'losers';
    if (s.includes('grand final')) return 'finals';
    return s.replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'main';
  };
  const sources = () => [...main.querySelectorAll('.bracket-section')].map((element, i) => {
    const label = element.querySelector('.bracket-heading h2')?.textContent?.trim() || `Bracket ${i + 1}`;
    return { key: stageKey(label), label, element };
  });
  function injectButton() {
    const toolbar = main.querySelector('.bracket-toolbar');
    if (!toolbar || toolbar.querySelector('[data-live-action="enter"]')) return;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'btn primary iv-present-button';
    button.dataset.liveAction = 'enter';
    button.textContent = '⛶ Fullscreen bracket & scores';
    button.setAttribute('aria-label', 'Open interactive fullscreen bracket');
    toolbar.appendChild(button);
  }
  function dimensions() {
    const track = trackHost.querySelector('.bracket-track');
    if (!track) return { width: 0, height: 0 };
    return { width: Math.ceil(track.scrollWidth), height: Math.ceil(track.scrollHeight) };
  }
  function applyScale() {
    const d = dimensions();
    if (!d.width) return;
    if (fitMode) {
      const roomX = Math.max(250, viewport.clientWidth - 30);
      const roomY = Math.max(200, viewport.clientHeight - 30);
      // Narrow phones pan the bracket rather than shrinking names to illegibility.
      const minimum = window.innerWidth < 720 ? 0.75 : 0.42;
      scale = Math.max(minimum, Math.min(1.2, roomX / d.width, roomY / d.height));
    }
    spacer.style.width = `${Math.ceil(d.width * scale)}px`;
    spacer.style.height = `${Math.ceil(d.height * scale)}px`;
    trackHost.style.transform = `scale(${scale})`;
    output.textContent = `${Math.round(scale * 100)}%`;
  }
  function paint(keepPosition = true) {
    const options = sources();
    if (!options.length) { if (active) exit(); return; }
    if (!options.some(x => x.key === stage)) stage = options[0].key;
    stagesEl.replaceChildren();
    options.forEach(x => {
      const b = document.createElement('button'); b.type = 'button';
      b.dataset.liveAction = 'stage'; b.dataset.stage = x.key;
      b.className = 'iv-live-tab' + (x.key === stage ? ' selected' : '');
      b.setAttribute('aria-pressed', String(x.key === stage));
      b.textContent = x.key === 'winners' ? '🏆 Winners' : x.key === 'losers' ? '↩ Losers' : x.key === 'finals' ? '★ Grand finals' : x.label;
      stagesEl.appendChild(b);
    });
    const selected = options.find(x => x.key === stage);
    const oldX = viewport.scrollLeft, oldY = viewport.scrollTop;
    // Reuse existing match cards and their host-only save/undo handlers.
    const track = selected.element.querySelector('.bracket-track');
    trackHost.replaceChildren(track ? track.cloneNode(true) : document.createTextNode('Bracket is unavailable'));
    trackHost.querySelector('.bracket-track')?.classList.add('iv-presented-track');
    liveTitle.textContent = main.querySelector('.subhead h1')?.textContent?.trim() || 'Live tournament';
    const isHost = document.getElementById('host-toggle')?.textContent?.includes('Host unlocked');
    hostLabel.textContent = isHost ? 'HOST MODE · Enter scores in each match' : 'PLAYER VIEW · Live scores (read-only)';
    root.classList.toggle('iv-live-is-host', !!isHost);
    footer.textContent = `${selected.label} · ${selected.element.querySelectorAll('.match-card').length} matches`;
    requestAnimationFrame(() => {
      applyScale();
      if (keepPosition) { viewport.scrollLeft = oldX; viewport.scrollTop = oldY; }
      else { viewport.scrollLeft = 0; viewport.scrollTop = 0; }
    });
  }
  function enter() {
    if (!sources().length) return;
    active = true; fitMode = true;
    root.hidden = false; root.classList.add('iv-live-active');
    document.body.classList.add('iv-live-open');
    // Native fullscreen hides elements outside its top layer. Move the existing
    // score-confirmation dialog and save/error toasts into the fullscreen view.
    for (const element of floatingUi) root.appendChild(element);
    paint(false);
    if (root.requestFullscreen) {
      try { const result = root.requestFullscreen({ navigationUI: 'hide' }); result?.catch(() => {}); }
      catch (_) { /* The CSS full-viewport fallback remains available on iOS. */ }
    }
  }
  function exit() {
    if (!active) return;
    active = false;
    root.classList.remove('iv-live-active'); root.hidden = true;
    document.body.classList.remove('iv-live-open');
    for (const element of floatingUi) document.body.appendChild(element);
    if (document.fullscreenElement === root && document.exitFullscreen) document.exitFullscreen().catch(() => {});
  }
  document.addEventListener('fullscreenchange', () => {
    if (active && document.fullscreenElement !== root) exit();
    else if (active) requestAnimationFrame(applyScale);
  });
  document.addEventListener('keydown', event => { if (active && event.key === 'Escape') exit(); });
  document.addEventListener('click', event => {
    const button = event.target.closest('[data-live-action]');
    if (!button) return;
    event.preventDefault(); event.stopPropagation();
    switch (button.dataset.liveAction) {
      case 'enter': enter(); break;
      case 'exit': exit(); break;
      case 'stage': stage = button.dataset.stage; paint(false); break;
      case 'fit': fitMode = true; applyScale(); break;
      case 'plus': fitMode = false; scale = Math.min(1.8, scale + 0.15); applyScale(); break;
      case 'minus': fitMode = false; scale = Math.max(0.4, scale - 0.15); applyScale(); break;
    }
  }, true);
  new MutationObserver(() => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => { scheduled = false; injectButton(); if (active) paint(); });
  }).observe(main, { childList: true, subtree: true });
  window.addEventListener('resize', () => { if (active) requestAnimationFrame(applyScale); });
  injectButton();
})();
