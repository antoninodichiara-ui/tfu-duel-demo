const STORAGE_KEY = "tfu-duel-v11-local";
const CARD_POOL = Array.isArray(window.cards) ? window.cards : [];

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
  },
  log: [],
  matchMode: "local",
  sharedSeed: null,
  playerRole: 1,
  shareLink: "",
  openStatPanel: null
};

const statLabels = {
  attack: "Attack",
  defense: "Defense",
  speed: "Speed",
  intelligence: "Intelligence",
  energy: "Energy",
  power: "Power"
};

const statShortLabels = {
  attack: "ATT",
  defense: "DEF",
  speed: "SPD",
  intelligence: "INT",
  energy: "ENG",
  power: "PWR"
};

const leftStats = ["attack", "defense", "speed"];
const rightStats = ["intelligence", "energy", "power"];

const appView = document.getElementById("appView");

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return false;

  try {
    const parsed = JSON.parse(raw);

    state.menuOpen = typeof parsed.menuOpen === "boolean" ? parsed.menuOpen : false;
    state.imageOpen = false;
    state.deckSize = Number(parsed.deckSize) || 8;
    state.deck = Array.isArray(parsed.deck) ? parsed.deck : [];
    state.currentIndex = Number.isInteger(parsed.currentIndex) ? parsed.currentIndex : 0;
    state.selectedStat = parsed.selectedStat || null;
    state.roundResolved = Boolean(parsed.roundResolved);
    state.roundResult = parsed.roundResult || null;
    state.finished = Boolean(parsed.finished);
    state.score = {
      wins: Number(parsed.score && parsed.score.wins) || 0,
      losses: Number(parsed.score && parsed.score.losses) || 0,
      draws: Number(parsed.score && parsed.score.draws) || 0
    };
    state.log = Array.isArray(parsed.log) ? parsed.log : [];
    state.matchMode = parsed.matchMode || "local";
    state.sharedSeed = parsed.sharedSeed || null;
    state.playerRole = parsed.playerRole === 2 ? 2 : 1;
    state.shareLink = parsed.shareLink || "";
    state.openStatPanel = null;
    return true;
  } catch (error) {
    console.error("Could not load saved state:", error);
    return false;
  }
}

function stringToSeed(str) {
  let hash = 2166136261;
  for (let i = 0; i < str.length; i += 1) {
    hash ^= str.charCodeAt(i);
    hash +=
      (hash << 1) +
      (hash << 4) +
      (hash << 7) +
      (hash << 8) +
      (hash << 24);
  }
  return Math.abs(hash >>> 0);
}

function seededRandomGenerator(seed) {
  let value = seed % 2147483647;
  if (value <= 0) value += 2147483646;

  return function () {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
}

function seededShuffle(array, seedString) {
  const clone = array.slice();
  const rng = seededRandomGenerator(stringToSeed(seedString));

  for (let i = clone.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    const temp = clone[i];
    clone[i] = clone[j];
    clone[j] = temp;
  }

  return clone;
}

function localShuffle(array) {
  const clone = array.slice();
  for (let i = clone.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = clone[i];
    clone[i] = clone[j];
    clone[j] = temp;
  }
  return clone;
}

function splitDecksFromSeed(seedString) {
  const shuffled = seededShuffle(CARD_POOL, seedString);
  const player1 = [];
  const player2 = [];

  for (let i = 0; i < shuffled.length; i += 1) {
    if (i % 2 === 0) {
      player1.push(shuffled[i]);
    } else {
      player2.push(shuffled[i]);
    }
  }

  return {
    player1,
    player2
  };
}

function buildShareLink(seedString) {
  const url = new URL(window.location.href);
  url.searchParams.set("mode", "linked");
  url.searchParams.set("seed", seedString);
  url.searchParams.set("player", "2");
  return url.toString();
}

function parseUrlMatch() {
  const url = new URL(window.location.href);
  const mode = url.searchParams.get("mode");
  const seed = url.searchParams.get("seed");
  const player = url.searchParams.get("player");

  if (mode !== "linked" || !seed) return false;

  const split = splitDecksFromSeed(seed);
  const role = player === "2" ? 2 : 1;

  state.matchMode = "linked";
  state.sharedSeed = seed;
  state.playerRole = role;
  state.shareLink = role === 1 ? buildShareLink(seed) : "";
  state.deck = role === 1 ? split.player1 : split.player2;
  state.deckSize = state.deck.length;
  state.currentIndex = 0;
  state.selectedStat = null;
  state.roundResolved = false;
  state.roundResult = null;
  state.finished = false;
  state.menuOpen = false;
  state.imageOpen = false;
  state.openStatPanel = null;
  state.score = { wins: 0, losses: 0, draws: 0 };
  state.log = [
    "Linked match loaded.",
    "Seed: " + seed,
    "You are Player " + role + "."
  ];

  saveState();
  return true;
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

function toggleStatPanel(statKey) {
  if (state.finished) return;
  state.openStatPanel = state.openStatPanel === statKey ? null : statKey;
  render();
}

function closeStatPanel() {
  state.openStatPanel = null;
  render();
}

function resetScoreOnly() {
  state.score = { wins: 0, losses: 0, draws: 0 };
  state.log.push("Score reset.");
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
  state.log = [];
  state.matchMode = "local";
  state.sharedSeed = null;
  state.playerRole = 1;
  state.shareLink = "";
  state.openStatPanel = null;

  const url = new URL(window.location.href);
  url.searchParams.delete("mode");
  url.searchParams.delete("seed");
  url.searchParams.delete("player");
  window.history.replaceState({}, "", url.toString());

  saveState();
  render();
}

function createLocalMatch(keepScore) {
  const safeDeckSize = Math.max(4, Math.min(state.deckSize, CARD_POOL.length));
  state.deck = localShuffle(CARD_POOL).slice(0, safeDeckSize);
  state.currentIndex = 0;
  state.selectedStat = null;
  state.roundResolved = false;
  state.roundResult = null;
  state.finished = false;
  state.menuOpen = false;
  state.imageOpen = false;
  state.openStatPanel = null;
  state.matchMode = "local";
  state.sharedSeed = null;
  state.playerRole = 1;
  state.shareLink = "";
  state.log = ["New local match started. " + safeDeckSize + " cards shuffled locally."];

  if (!keepScore) {
    state.score = { wins: 0, losses: 0, draws: 0 };
    state.log.push("Score reset.");
  }

  const url = new URL(window.location.href);
  url.searchParams.delete("mode");
  url.searchParams.delete("seed");
  url.searchParams.delete("player");
  window.history.replaceState({}, "", url.toString());

  saveState();
  render();
}

function createLinkedMatch(keepScore) {
  const seedString =
    Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);

  const split = splitDecksFromSeed(seedString);

  state.matchMode = "linked";
  state.sharedSeed = seedString;
  state.playerRole = 1;
  state.shareLink = buildShareLink(seedString);
  state.deck = split.player1;
  state.deckSize = state.deck.length;
  state.currentIndex = 0;
  state.selectedStat = null;
  state.roundResolved = false;
  state.roundResult = null;
  state.finished = false;
  state.menuOpen = false;
  state.imageOpen = false;
  state.openStatPanel = null;
  state.log = [
    "Linked match created.",
    "You are Player 1.",
    "Share the generated link with Player 2."
  ];

  if (!keepScore) {
    state.score = { wins: 0, losses: 0, draws: 0 };
    state.log.push("Score reset.");
  }

  const url = new URL(window.location.href);
  url.searchParams.set("mode", "linked");
  url.searchParams.set("seed", seedString);
  url.searchParams.set("player", "1");
  window.history.replaceState({}, "", url.toString());

  saveState();
  render();
}

function copyShareLink() {
  if (!state.shareLink) return;

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(state.shareLink).then(function () {
      state.log.push("Share link copied.");
      saveState();
      render();
    }).catch(function () {
      promptFallback();
    });
  } else {
    promptFallback();
  }

  function promptFallback() {
    window.prompt("Copy this link and send it to Player 2:", state.shareLink);
  }
}

function getCurrentCard() {
  return state.deck[state.currentIndex] || null;
}

function getSelectedValue() {
  const card = getCurrentCard();
  if (!card || !state.selectedStat) return null;
  return card.stats[state.selectedStat];
}

function getStatValue(card, statKey) {
  if (!card) return null;
  if (statKey === "power") return card.power;
  return card.stats[statKey];
}

function selectDeckSize(value) {
  const nextSize = Number(value);
  if (!isNaN(nextSize)) {
    state.deckSize = Math.max(4, Math.min(nextSize, CARD_POOL.length));
    saveState();
  }
}

function selectStat(statKey) {
  if (state.roundResolved || state.finished) return;
  if (statKey === "power") return;

  const card = getCurrentCard();
  if (!card) return;

  state.selectedStat = statKey;
  state.openStatPanel = null;

  state.log.push(
    "Round " +
      (state.currentIndex + 1) +
      ": " +
      card.name +
      " selected " +
      statLabels[statKey] +
      " (" +
      card.stats[statKey] +
      ")."
  );
  saveState();
  render();
}

function resolveRound(result) {
  if (!state.selectedStat || state.roundResolved || state.finished) return;
  const card = getCurrentCard();
  if (!card) return;

  if (result === "win") state.score.wins += 1;
  if (result === "lose") state.score.losses += 1;
  if (result === "draw") state.score.draws += 1;

  state.roundResolved = true;
  state.roundResult = result;

  state.log.push(
    "Round " +
      (state.currentIndex + 1) +
      ": " +
      card.name +
      " -> " +
      statLabels[state.selectedStat] +
      " " +
      card.stats[state.selectedStat] +
      " -> " +
      result.toUpperCase() +
      "."
  );

  saveState();
  render();
}

function nextCard() {
  if (!state.roundResolved || state.finished) return;

  const isLastCard = state.currentIndex >= state.deck.length - 1;

  if (isLastCard) {
    state.finished = true;
    state.log.push(
      "Match finished. Final score: " +
        state.score.wins +
        "W / " +
        state.score.losses +
        "L / " +
        state.score.draws +
        "D."
    );
    saveState();
    render();
    return;
  }

  state.currentIndex += 1;
  state.selectedStat = null;
  state.roundResolved = false;
  state.roundResult = null;
  state.openStatPanel = null;
  state.log.push("Round " + (state.currentIndex + 1) + ": next card revealed.");
  saveState();
  render();
}

function getRarityClass(rarity) {
  const safe = String(rarity || "").toLowerCase();
  if (safe === "mythic") return "rarity-mythic";
  if (safe === "legendary") return "rarity-legendary";
  if (safe === "titan") return "rarity-titan";
  if (safe === "apex") return "rarity-apex";
  return "rarity-default";
}

function getStatusText() {
  if (state.finished) return "Match finished. Start a new match for a fresh setup.";
  if (!state.selectedStat) return "Open a side stat panel and choose your category.";
  if (!state.roundResolved) return "Compare values now and confirm the round result.";
  return "Round resolved. Move to the next card.";
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

function buildMenuOverlay() {
  if (!state.menuOpen) return "";

  const allowedSizes = [4, 6, 8, 10, 12].filter(function (size) {
    return size <= CARD_POOL.length;
  });

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
          Use Local Match for one-device play. Use Linked Match to generate a shareable link for Player 2.
        </p>

        <div class="field-group">
          <label for="deckSizeSelect" class="field-label">Deck Size (Local Mode)</label>
          <select id="deckSizeSelect" class="field-control">
            ${allowedSizes
              .map(function (size) {
                return '<option value="' + size + '"' + (size === state.deckSize ? " selected" : "") + ">" + size + " Cards</option>";
              })
              .join("")}
          </select>
        </div>

        <div class="setup-actions">
          <button id="startLocalMatchBtn" class="btn btn-primary" type="button">Start Local Match</button>
          <button id="startLinkedMatchBtn" class="btn btn-secondary" type="button">Create Linked Match</button>
          <button id="resetAllBtn" class="btn btn-danger" type="button">Full Reset</button>
        </div>

        ${
          state.matchMode === "linked" && state.playerRole === 1 && state.shareLink
            ? `
              <div class="panel-link-box">
                <p class="panel-label">Player 2 Invite Link</p>
                <div class="share-link-preview">${escapeHtml(state.shareLink)}</div>
                <button id="copyShareLinkBtn" class="btn btn-primary" type="button">Copy Link</button>
              </div>
            `
            : ""
        }
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
        <img class="fullscreen-card-image" src="${escapeHtml(card.image)}" alt="${escapeHtml(card.name)}" />
      </div>
    </div>
  `;
}

function buildLinkedInfoBar() {
  if (state.matchMode !== "linked") return "";

  return `
    <section class="linked-mini-bar">
      <div><span>Mode</span><strong>Linked</strong></div>
      <div><span>Player</span><strong>P${state.playerRole}</strong></div>
      ${
        state.playerRole === 1 && state.shareLink
          ? `<button id="copyShareLinkInlineBtn" class="mini-link-btn" type="button">Copy Link</button>`
          : `<div><span>Seed</span><strong>${escapeHtml((state.sharedSeed || "").slice(0, 6))}</strong></div>`
      }
    </section>
  `;
}

function buildSideStick(statKey, side, card) {
  const value = getStatValue(card, statKey);
  const isOpen = state.openStatPanel === statKey;
  const isSelected = state.selectedStat === statKey;
  const isPower = statKey === "power";

  return `
    <div class="stick-wrap ${side}">
      <button
        class="side-stick ${side} ${isSelected ? "selected" : ""} ${isOpen ? "open" : ""} ${isPower ? "info-only" : ""}"
        data-open-stat="${statKey}"
        type="button"
        ${state.finished ? "disabled" : ""}
      >
        <span class="stick-short">${statShortLabels[statKey]}</span>
      </button>

      ${
        isOpen
          ? `
            <div class="slide-panel ${side}">
              <div class="slide-panel-inner glass-panel">
                <div class="slide-top">
                  <span class="slide-label">${escapeHtml(statLabels[statKey])}</span>
                  <button class="slide-close" data-close-stat type="button">✕</button>
                </div>

                <div class="slide-value">${value}</div>

                ${
                  isPower
                    ? `<div class="slide-info-only">Info Only</div>`
                    : `
                      <button
                        class="btn btn-primary slide-select-btn"
                        data-confirm-stat="${statKey}"
                        type="button"
                        ${state.roundResolved ? "disabled" : ""}
                      >
                        ${isSelected ? "Selected" : "Select"}
                      </button>
                    `
                }
              </div>
            </div>
          `
          : ""
      }
    </div>
  `;
}

function buildBottomControls(totalCards) {
  const roundNumber = state.finished ? totalCards : totalCards ? state.currentIndex + 1 : 0;

  return `
    <section class="bottom-compact-bar">
      <div class="bottom-status-line">
        <div class="bottom-mini-box">
          <span class="hud-label">Round</span>
          <strong>${roundNumber} / ${totalCards || state.deckSize}</strong>
        </div>

        <div class="bottom-mini-box">
          <span class="hud-label">Score</span>
          <strong>${state.score.wins} / ${state.score.losses} / ${state.score.draws}</strong>
          <small>W / L / D</small>
        </div>

        <div class="bottom-mini-box">
          <span class="hud-label">Selected</span>
          <strong>${state.selectedStat ? statShortLabels[state.selectedStat] : "—"}</strong>
        </div>

        <div class="bottom-badge-box">
          ${getResultBadge()}
        </div>
      </div>

      <div class="battle-action-row compact">
        <button id="winBtn" class="btn btn-win" type="button" ${!state.selectedStat || state.roundResolved ? "disabled" : ""}>Win</button>
        <button id="drawBtn" class="btn btn-draw" type="button" ${!state.selectedStat || state.roundResolved ? "disabled" : ""}>Draw</button>
        <button id="loseBtn" class="btn btn-lose" type="button" ${!state.selectedStat || state.roundResolved ? "disabled" : ""}>Lose</button>
        <button id="nextCardBtn" class="btn btn-primary" type="button" ${!state.roundResolved ? "disabled" : ""}>Next</button>
      </div>

      <div class="bottom-helper-line">
        <span>${getStatusText()}</span>
        <button id="resetScoreBtn" class="btn btn-secondary small" type="button">Reset</button>
      </div>
    </section>
  `;
}

function buildGameContent() {
  const card = getCurrentCard();
  const totalCards = state.deck.length;

  if (!card) {
    return `
      ${buildLinkedInfoBar()}
      <section class="panel">
        <h2 class="setup-title">No Active Match</h2>
        <p class="setup-copy">Open the menu and start a match.</p>
      </section>
    `;
  }

  return `
    ${buildLinkedInfoBar()}

    <section class="arena-shell">
      <div class="arena-top-meta">
        <div class="arena-name-block">
          <h2 class="arena-card-name">${escapeHtml(card.name)}</h2>
          <p class="arena-card-title">${escapeHtml(card.title)}</p>
        </div>

        <div class="arena-top-right">
          <div class="arena-power-badge">
            <span>Power</span>
            <strong>${card.power}</strong>
          </div>
          <div class="rarity-chip ${getRarityClass(card.rarity)}">${escapeHtml(card.rarity)}</div>
        </div>
      </div>

      <div class="card-stage">
        <div class="left-stick-column">
          ${leftStats.map(function (statKey) {
            return buildSideStick(statKey, "left", card);
          }).join("")}
        </div>

        <div class="hero-card-zone">
          <button id="openImageBtn" class="main-card-shell card-image-button" type="button">
            <img class="main-card-image" src="${escapeHtml(card.image)}" alt="${escapeHtml(card.name)}" />
            <div class="main-role-badge">${escapeHtml(card.type)}</div>
            <div class="main-zoom-hint">Tap to expand</div>
          </button>
        </div>

        <div class="right-stick-column">
          ${rightStats.map(function (statKey) {
            return buildSideStick(statKey, "right", card);
          }).join("")}
        </div>
      </div>

      ${buildBottomControls(totalCards)}
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
  const startLinkedMatchBtn = document.getElementById("startLinkedMatchBtn");
  const resetAllBtn = document.getElementById("resetAllBtn");
  const winBtn = document.getElementById("winBtn");
  const drawBtn = document.getElementById("drawBtn");
  const loseBtn = document.getElementById("loseBtn");
  const nextCardBtn = document.getElementById("nextCardBtn");
  const resetScoreBtn = document.getElementById("resetScoreBtn");
  const openImageBtn = document.getElementById("openImageBtn");
  const closeImageBtn = document.getElementById("closeImageBtn");
  const imageOverlay = document.getElementById("imageOverlay");
  const copyShareLinkBtn = document.getElementById("copyShareLinkBtn");
  const copyShareLinkInlineBtn = document.getElementById("copyShareLinkInlineBtn");

  if (menuToggleBtn) menuToggleBtn.addEventListener("click", function () { toggleMenu(); });
  if (closeMenuBtn) closeMenuBtn.addEventListener("click", function () { toggleMenu(false); });
  if (quickNewMatchBtn) quickNewMatchBtn.addEventListener("click", function () { createLocalMatch(true); });
  if (deckSizeSelect) deckSizeSelect.addEventListener("change", function (event) { selectDeckSize(event.target.value); });
  if (startLocalMatchBtn) startLocalMatchBtn.addEventListener("click", function () { createLocalMatch(true); });
  if (startLinkedMatchBtn) startLinkedMatchBtn.addEventListener("click", function () { createLinkedMatch(false); });
  if (resetAllBtn) resetAllBtn.addEventListener("click", fullReset);
  if (winBtn) winBtn.addEventListener("click", function () { resolveRound("win"); });
  if (drawBtn) drawBtn.addEventListener("click", function () { resolveRound("draw"); });
  if (loseBtn) loseBtn.addEventListener("click", function () { resolveRound("lose"); });
  if (nextCardBtn) nextCardBtn.addEventListener("click", nextCard);
  if (resetScoreBtn) resetScoreBtn.addEventListener("click", resetScoreOnly);
  if (openImageBtn) openImageBtn.addEventListener("click", openImage);
  if (closeImageBtn) closeImageBtn.addEventListener("click", closeImage);
  if (copyShareLinkBtn) copyShareLinkBtn.addEventListener("click", copyShareLink);
  if (copyShareLinkInlineBtn) copyShareLinkInlineBtn.addEventListener("click", copyShareLink);

  if (imageOverlay) {
    imageOverlay.addEventListener("click", function (event) {
      if (event.target === imageOverlay) {
        closeImage();
      }
    });
  }

  const statOpenButtons = document.querySelectorAll("[data-open-stat]");
  statOpenButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      toggleStatPanel(button.getAttribute("data-open-stat"));
    });
  });

  const statCloseButtons = document.querySelectorAll("[data-close-stat]");
  statCloseButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      closeStatPanel();
    });
  });

  const confirmStatButtons = document.querySelectorAll("[data-confirm-stat]");
  confirmStatButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      selectStat(button.getAttribute("data-confirm-stat"));
    });
  });
}

function render() {
  if (!appView) return;
  appView.innerHTML = buildApp();
  bindApp();
}

const loadedFromUrl = parseUrlMatch();
if (!loadedFromUrl) {
  loadState();
}
render();
