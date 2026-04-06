const STORAGE_KEY = "tfu-duel-v14-local";
const CARD_POOL = Array.isArray(window.cards)
  ? window.cards
  : (typeof cards !== "undefined" ? cards : []);

const state = {
  menuOpen: false,
  imageOpen: false,
  deckSize: 8,
  deck: [],
  currentIndex: 0,
  selectedStat: null,
  roundResolved: false,
  roundResult: null,
  finished: false,
  score: {
    wins: 0,
    losses: 0,
    draws: 0
  }
};

const leftStats = ["STR", "AGI", "VIT"];
const rightStats = ["INT", "PWR", "TOT"];

const appView = document.getElementById("appView");

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return false;

  try {
    const parsed = JSON.parse(raw);
    state.menuOpen = Boolean(parsed.menuOpen);
    state.imageOpen = false;
    state.deckSize = Number(parsed.deckSize) || 8;
    state.deck = Array.isArray(parsed.deck) ? parsed.deck : [];
    state.currentIndex = Number.isInteger(parsed.currentIndex) ? parsed.currentIndex : 0;
    state.selectedStat = parsed.selectedStat || null;
    state.roundResolved = Boolean(parsed.roundResolved);
    state.roundResult = parsed.roundResult || null;
    state.finished = Boolean(parsed.finished);
    state.score = {
      wins: Number(parsed.score?.wins) || 0,
      losses: Number(parsed.score?.losses) || 0,
      draws: Number(parsed.score?.draws) || 0
    };
    return true;
  } catch (error) {
    console.error("State load failed:", error);
    return false;
  }
}

function shuffle(array) {
  const clone = array.slice();
  for (let i = clone.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [clone[i], clone[j]] = [clone[j], clone[i]];
  }
  return clone;
}

function getCurrentCard() {
  return state.deck[state.currentIndex] || null;
}

function toggleMenu(forceValue) {
  state.menuOpen = typeof forceValue === "boolean" ? forceValue : !state.menuOpen;
  saveState();
  render();
}

function openImage() {
  state.imageOpen = true;
  render();
}

function closeImage() {
  state.imageOpen = false;
  render();
}

function selectDeckSize(value) {
  const nextSize = Number(value);
  if (!Number.isNaN(nextSize)) {
    state.deckSize = Math.max(4, Math.min(nextSize, CARD_POOL.length));
    saveState();
  }
}

function createLocalMatch(resetScore = false) {
  const safeDeckSize = Math.max(4, Math.min(state.deckSize, CARD_POOL.length));
  state.deck = shuffle(CARD_POOL).slice(0, safeDeckSize);
  state.currentIndex = 0;
  state.selectedStat = null;
  state.roundResolved = false;
  state.roundResult = null;
  state.finished = false;
  state.menuOpen = false;
  state.imageOpen = false;

  if (resetScore) {
    state.score = { wins: 0, losses: 0, draws: 0 };
  }

  saveState();
  render();
}

function fullReset() {
  state.menuOpen = true;
  state.imageOpen = false;
  state.deckSize = 8;
  state.deck = [];
  state.currentIndex = 0;
  state.selectedStat = null;
  state.roundResolved = false;
  state.roundResult = null;
  state.finished = false;
  state.score = { wins: 0, losses: 0, draws: 0 };
  saveState();
  render();
}

function resetScoreOnly() {
  state.score = { wins: 0, losses: 0, draws: 0 };
  saveState();
  render();
}

function selectStat(statKey) {
  if (state.finished || state.roundResolved) return;
  const card = getCurrentCard();
  if (!card) return;
  if (!(statKey in card.stats)) return;

  state.selectedStat = statKey;
  saveState();
  render();
}

function resolveRound(result) {
  if (!state.selectedStat || state.roundResolved || state.finished) return;

  if (result === "win") state.score.wins += 1;
  if (result === "lose") state.score.losses += 1;
  if (result === "draw") state.score.draws += 1;

  state.roundResolved = true;
  state.roundResult = result;
  saveState();
  render();
}

function nextCard() {
  if (!state.roundResolved || state.finished) return;

  const isLastCard = state.currentIndex >= state.deck.length - 1;

  if (isLastCard) {
    state.finished = true;
    saveState();
    render();
    return;
  }

  state.currentIndex += 1;
  state.selectedStat = null;
  state.roundResolved = false;
  state.roundResult = null;
  saveState();
  render();
}

function getRarityClass(rarity) {
  const safe = String(rarity || "")
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/'/g, "");
  return "rarity-" + safe;
}

function getResultBadge() {
  if (!state.roundResolved) {
    return '<span class="status-badge badge-neutral">Round Open</span>';
  }
  if (state.roundResult === "win") {
    return '<span class="status-badge badge-win">Win Locked</span>';
  }
  if (state.roundResult === "lose") {
    return '<span class="status-badge badge-lose">Lose Locked</span>';
  }
  return '<span class="status-badge badge-draw">Draw Locked</span>';
}

function getStatusText() {
  if (state.finished) return "Match finished.";
  if (!state.selectedStat) return "Choose a stat.";
  if (!state.roundResolved) return "Confirm the round result.";
  return "Round resolved.";
}

function buildMenuOverlay() {
  if (!state.menuOpen) return "";

  const allowedSizes = [4, 6, 8, 10, 12, 16, 20].filter((size) => size <= CARD_POOL.length);

  return `
    <div class="menu-overlay">
      <section class="menu-panel">
        <div class="menu-panel-header">
          <div>
            <p class="section-eyebrow">TFU Duel Menu</p>
            <h2 class="setup-title">Match Setup</h2>
          </div>
          <button id="closeMenuBtn" class="menu-close-btn" type="button">✕</button>
        </div>

        <p class="setup-copy">
          Start a local match with your current card pool.
        </p>

        <div class="field-group">
          <label for="deckSizeSelect" class="field-label">Deck Size</label>
          <select id="deckSizeSelect" class="field-control">
            ${allowedSizes
              .map(
                (size) =>
                  `<option value="${size}"${size === state.deckSize ? " selected" : ""}>${size} Cards</option>`
              )
              .join("")}
          </select>
        </div>

        <div class="setup-actions">
          <button id="startLocalMatchBtn" class="btn btn-primary" type="button">Start Match</button>
          <button id="resetAllBtn" class="btn btn-danger" type="button">Full Reset</button>
        </div>
      </section>
    </div>
  `;
}

function buildImageOverlay(card) {
  if (!state.imageOpen || !card) return "";

  return `
    <div id="imageOverlay" class="image-overlay">
      <div class="image-overlay-inner">
        <button id="closeImageBtn" class="image-close-btn" type="button">✕</button>
        <img class="fullscreen-card-image" src="${card.image}" alt="${card.name}" />
      </div>
    </div>
  `;
}

function buildSideButton(statKey, side) {
  return `
    <button
      class="side-stick ${side} ${state.selectedStat === statKey ? "selected" : ""}"
      data-select-stat="${statKey}"
      type="button"
      ${state.finished || state.roundResolved ? "disabled" : ""}
    >
      <span class="stick-short">${statKey}</span>
    </button>
  `;
}

function buildBottomFloatButtons() {
  return `
    <div class="bottom-float-actions">
      <button id="winBtn" class="float-action action-win" type="button" ${!state.selectedStat || state.roundResolved ? "disabled" : ""}>WIN</button>
      <button id="drawBtn" class="float-action action-draw" type="button" ${!state.selectedStat || state.roundResolved ? "disabled" : ""}>DRAW</button>
      <button id="loseBtn" class="float-action action-lose" type="button" ${!state.selectedStat || state.roundResolved ? "disabled" : ""}>LOSE</button>
      <button id="nextCardBtn" class="float-action action-next" type="button" ${!state.roundResolved ? "disabled" : ""}>NEXT</button>
    </div>
  `;
}

function buildCompactHud(totalCards) {
  const roundNumber = state.finished ? totalCards : totalCards ? state.currentIndex + 1 : 0;

  return `
    <section class="compact-hud-bar">
      <div class="hud-chip">
        <span class="hud-label">Round</span>
        <strong>${roundNumber}/${totalCards || state.deckSize}</strong>
      </div>
      <div class="hud-chip">
        <span class="hud-label">Score</span>
        <strong>${state.score.wins}/${state.score.losses}/${state.score.draws}</strong>
      </div>
      <div class="hud-chip">
        <span class="hud-label">Selected</span>
        <strong>${state.selectedStat || "—"}</strong>
      </div>
      <div class="hud-chip hud-chip-status">
        ${getResultBadge()}
      </div>
    </section>
  `;
}

function buildFooterInfo() {
  return `
    <section class="footer-info-bar">
      <div class="footer-status-text">${getStatusText()}</div>
      <button id="resetScoreBtn" class="btn btn-secondary small" type="button">Reset Score</button>
    </section>
  `;
}

function buildGameContent() {
  const card = getCurrentCard();
  const totalCards = state.deck.length;

  if (!card) {
    return `
      <section class="panel">
        <h2 class="setup-title">No Active Match</h2>
        <p class="setup-copy">Open the menu and start a match.</p>
      </section>
    `;
  }

  return `
    <section class="arena-shell">
      <div class="arena-top-meta">
        <div class="arena-name-block">
          <h2 class="arena-card-name">${card.name}</h2>
          <p class="arena-card-title">${card.title}</p>
        </div>

        <div class="arena-top-right">
          <div class="rarity-chip ${getRarityClass(card.rarity)}">${card.rarity}</div>
        </div>
      </div>

      <div class="card-stage">
        <div class="left-stick-column">
          ${leftStats.map((statKey) => buildSideButton(statKey, "left")).join("")}
        </div>

        <div class="hero-card-zone">
          <div class="card-visual-shell">
            <img id="openImageBtn" class="main-card-image image-clickable" src="${card.image}" alt="${card.name}" />
            ${buildBottomFloatButtons()}
          </div>
        </div>

        <div class="right-stick-column">
          ${rightStats.map((statKey) => buildSideButton(statKey, "right")).join("")}
        </div>
      </div>

      ${buildCompactHud(totalCards)}
      ${buildFooterInfo()}
    </section>
  `;
}

function buildApp() {
  return `
    <section class="screen">
      ${buildMenuOverlay()}
      ${buildImageOverlay(getCurrentCard())}

      <section class="micro-topbar ultra-thin-topbar">
        <button id="menuToggleBtn" class="micro-btn" type="button">☰</button>
        <div class="micro-title">TFU Duel</div>
        <button id="quickNewMatchBtn" class="micro-btn alt" type="button">New</button>
      </section>

      ${buildGameContent()}
    </section>
  `;
}

function bindApp() {
  const menuToggleBtn = document.getElementById("menuToggleBtn");
  const closeMenuBtn = document.getElementById("closeMenuBtn");
  const quickNewMatchBtn = document.getElementById("quickNewMatchBtn");
  const deckSizeSelect = document.getElementById("deckSizeSelect");
  const startLocalMatchBtn = document.getElementById("startLocalMatchBtn");
  const resetAllBtn = document.getElementById("resetAllBtn");
  const winBtn = document.getElementById("winBtn");
  const drawBtn = document.getElementById("drawBtn");
  const loseBtn = document.getElementById("loseBtn");
  const nextCardBtn = document.getElementById("nextCardBtn");
  const resetScoreBtn = document.getElementById("resetScoreBtn");
  const openImageBtn = document.getElementById("openImageBtn");
  const closeImageBtn = document.getElementById("closeImageBtn");
  const imageOverlay = document.getElementById("imageOverlay");

  if (menuToggleBtn) menuToggleBtn.addEventListener("click", () => toggleMenu());
  if (closeMenuBtn) closeMenuBtn.addEventListener("click", () => toggleMenu(false));
  if (quickNewMatchBtn) quickNewMatchBtn.addEventListener("click", () => createLocalMatch(true));
  if (deckSizeSelect) deckSizeSelect.addEventListener("change", (event) => selectDeckSize(event.target.value));
  if (startLocalMatchBtn) startLocalMatchBtn.addEventListener("click", () => createLocalMatch(true));
  if (resetAllBtn) resetAllBtn.addEventListener("click", fullReset);
  if (winBtn) winBtn.addEventListener("click", (event) => { event.stopPropagation(); resolveRound("win"); });
  if (drawBtn) drawBtn.addEventListener("click", (event) => { event.stopPropagation(); resolveRound("draw"); });
  if (loseBtn) loseBtn.addEventListener("click", (event) => { event.stopPropagation(); resolveRound("lose"); });
  if (nextCardBtn) nextCardBtn.addEventListener("click", (event) => { event.stopPropagation(); nextCard(); });
  if (resetScoreBtn) resetScoreBtn.addEventListener("click", resetScoreOnly);
  if (openImageBtn) openImageBtn.addEventListener("click", openImage);
  if (closeImageBtn) closeImageBtn.addEventListener("click", closeImage);

  if (imageOverlay) {
    imageOverlay.addEventListener("click", (event) => {
      if (event.target === imageOverlay) closeImage();
    });
  }

  document.querySelectorAll("[data-select-stat]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      selectStat(button.getAttribute("data-select-stat"));
    });
  });
}

function render() {
  if (!appView) return;
  appView.innerHTML = buildApp();
  bindApp();
}

loadState();
render();
