const STORAGE_KEY = "tfu-duel-v17-linked-reveal";
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
  opponentRevealed: false,
  score: {
    wins: 0,
    losses: 0,
    draws: 0
  },
  matchMode: "local",
  sharedSeed: null,
  playerRole: 1,
  shareLink: ""
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
    state.opponentRevealed = Boolean(parsed.opponentRevealed);
    state.score = {
      wins: Number(parsed.score?.wins) || 0,
      losses: Number(parsed.score?.losses) || 0,
      draws: Number(parsed.score?.draws) || 0
    };
    state.matchMode = parsed.matchMode || "local";
    state.sharedSeed = parsed.sharedSeed || null;
    state.playerRole = parsed.playerRole === 2 ? 2 : 1;
    state.shareLink = parsed.shareLink || "";
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
    [clone[i], clone[j]] = [clone[j], clone[i]];
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

  return { player1, player2 };
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
  state.opponentRevealed = false;
  state.menuOpen = false;
  state.imageOpen = false;
  state.score = { wins: 0, losses: 0, draws: 0 };

  saveState();
  return true;
}

function clearUrlParams() {
  const url = new URL(window.location.href);
  url.searchParams.delete("mode");
  url.searchParams.delete("seed");
  url.searchParams.delete("player");
  window.history.replaceState({}, "", url.toString());
}

function getCurrentCard() {
  return state.deck[state.currentIndex] || null;
}

function getOpponentCard() {
  if (state.matchMode !== "linked" || !state.sharedSeed) return null;

  const split = splitDecksFromSeed(state.sharedSeed);
  const opponentDeck = state.playerRole === 1 ? split.player2 : split.player1;
  return opponentDeck[state.currentIndex] || null;
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
  state.opponentRevealed = false;
  state.menuOpen = false;
  state.imageOpen = false;
  state.matchMode = "local";
  state.sharedSeed = null;
  state.playerRole = 1;
  state.shareLink = "";

  if (resetScore) {
    state.score = { wins: 0, losses: 0, draws: 0 };
  }

  clearUrlParams();
  saveState();
  render();
}

function createLinkedMatch(resetScore = true) {
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
  state.opponentRevealed = false;
  state.menuOpen = false;
  state.imageOpen = false;

  if (resetScore) {
    state.score = { wins: 0, losses: 0, draws: 0 };
  }

  const url = new URL(window.location.href);
  url.searchParams.set("mode", "linked");
  url.searchParams.set("seed", seedString);
  url.searchParams.set("player", "1");
  window.history.replaceState({}, "", url.toString());

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
  state.opponentRevealed = false;
  state.score = { wins: 0, losses: 0, draws: 0 };
  state.matchMode = "local";
  state.sharedSeed = null;
  state.playerRole = 1;
  state.shareLink = "";

  clearUrlParams();
  saveState();
  render();
}

function resetScoreOnly() {
  state.score = { wins: 0, losses: 0, draws: 0 };
  saveState();
  render();
}

function computeRoundResult(myValue, opponentValue) {
  if (myValue > opponentValue) return "win";
  if (myValue < opponentValue) return "lose";
  return "draw";
}

function applyScore(result) {
  if (result === "win") state.score.wins += 1;
  if (result === "lose") state.score.losses += 1;
  if (result === "draw") state.score.draws += 1;
}

function selectStat(statKey) {
  if (state.finished || state.roundResolved) return;
  const card = getCurrentCard();
  if (!card) return;
  if (!(statKey in card.stats)) return;

  state.selectedStat = statKey;

  if (state.matchMode === "linked") {
    const opponentCard = getOpponentCard();
    if (!opponentCard || !(statKey in opponentCard.stats)) return;

    const myValue = card.stats[statKey];
    const opponentValue = opponentCard.stats[statKey];
    const result = computeRoundResult(myValue, opponentValue);

    applyScore(result);
    state.opponentRevealed = true;
    state.roundResolved = true;
    state.roundResult = result;
  }

  saveState();
  render();
}

function resolveRound(result) {
  if (state.matchMode === "linked") return;
  if (!state.selectedStat || state.roundResolved || state.finished) return;

  applyScore(result);
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
  state.opponentRevealed = false;
  saveState();
  render();
}

function copyShareLink() {
  if (!state.shareLink) return;

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(state.shareLink).then(() => {
      alert("Link copiato!");
    }).catch(() => {
      window.prompt("Copy this link:", state.shareLink);
    });
  } else {
    window.prompt("Copy this link:", state.shareLink);
  }
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

function buildLinkedInfoBar() {
  if (state.matchMode !== "linked") return "";

  return `
    <section class="panel linked-panel">
      <div class="linked-panel-grid">
        <div class="linked-panel-item">
          <span class="hud-label">Mode</span>
          <strong>Linked</strong>
        </div>
        <div class="linked-panel-item">
          <span class="hud-label">Player</span>
          <strong>P${state.playerRole}</strong>
        </div>
        <div class="linked-panel-item">
          <span class="hud-label">Seed</span>
          <strong>${String(state.sharedSeed || "").slice(0, 8)}</strong>
        </div>
      </div>
      ${
        state.playerRole === 1 && state.shareLink
          ? `<button id="copyShareLinkInlineBtn" class="btn btn-primary" type="button">Copy Player 2 Link</button>`
          : ""
      }
    </section>
  `;
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
          Start a local match or create a linked match for Player 2.
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
          <button id="startLocalMatchBtn" class="btn btn-primary" type="button">Start Local Match</button>
          <button id="startLinkedMatchBtn" class="btn btn-secondary" type="button">Create Linked Match</button>
          <button id="resetAllBtn" class="btn btn-danger" type="button">Full Reset</button>
        </div>

        ${
          state.matchMode === "linked" && state.playerRole === 1 && state.shareLink
            ? `
              <div class="panel-link-box">
                <p class="panel-label">Player 2 Invite Link</p>
                <div class="share-link-preview">${state.shareLink}</div>
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

function buildLocalBottomFloatButtons() {
  return `
    <div class="bottom-float-actions">
      <button id="winBtn" class="float-action action-win" type="button" ${!state.selectedStat || state.roundResolved ? "disabled" : ""}>WIN</button>
      <button id="drawBtn" class="float-action action-draw" type="button" ${!state.selectedStat || state.roundResolved ? "disabled" : ""}>DRAW</button>
      <button id="loseBtn" class="float-action action-lose" type="button" ${!state.selectedStat || state.roundResolved ? "disabled" : ""}>LOSE</button>
      <button id="nextCardBtn" class="float-action action-next" type="button" ${!state.roundResolved ? "disabled" : ""}>NEXT</button>
    </div>
  `;
}

function buildLinkedBottomFloatButtons() {
  const currentCard = getCurrentCard();
  const opponentCard = getOpponentCard();
  const myValue = state.selectedStat && currentCard ? currentCard.stats[state.selectedStat] : "—";
  const opponentValue = state.selectedStat && opponentCard ? opponentCard.stats[state.selectedStat] : "—";
  const resultText =
    state.roundResult === "win"
      ? "YOU WIN"
      : state.roundResult === "lose"
        ? "YOU LOSE"
        : state.roundResult === "draw"
          ? "DRAW"
          : "SELECT STAT";

  return `
    <div class="bottom-float-actions linked-float-actions">
      <button class="float-action action-next" type="button" disabled>${state.selectedStat || "LINKED"}</button>
      <button class="float-action action-draw" type="button" disabled>${myValue} VS ${opponentValue}</button>
      <button class="float-action ${
        state.roundResult === "win"
          ? "action-win"
          : state.roundResult === "lose"
            ? "action-lose"
            : "action-draw"
      }" type="button" disabled>${resultText}</button>
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

function buildMyCard(card) {
  return `
    <div class="card-visual-shell">
      <img id="openImageBtn" class="main-card-image image-clickable" src="${card.image}" alt="${card.name}" />
      ${
        state.matchMode === "linked"
          ? buildLinkedBottomFloatButtons()
          : buildLocalBottomFloatButtons()
      }
    </div>
  `;
}

function buildOpponentCard(card) {
  if (!card) return "";

  return `
    <div class="opponent-card-shell ${state.opponentRevealed ? "revealed" : ""}">
      <img class="main-card-image opponent-card-image" src="${card.image}" alt="${card.name}" />
      ${
        state.selectedStat
          ? `<div class="opponent-stat-chip">${state.selectedStat}: ${card.stats[state.selectedStat]}</div>`
          : ""
      }
    </div>
  `;
}

function buildGameContent() {
  const card = getCurrentCard();
  const opponentCard = getOpponentCard();
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
          <h2 class="arena-card-name">${card.name}</h2>
          <p class="arena-card-title">${card.title}</p>
        </div>

        <div class="arena-top-right">
          <div class="rarity-chip ${getRarityClass(card.rarity)}">${card.rarity}</div>
        </div>
      </div>

      <div class="card-stage ${state.matchMode === "linked" && state.opponentRevealed ? "reveal-active" : ""}">
        <div class="left-stick-column">
          ${leftStats.map((statKey) => buildSideButton(statKey, "left")).join("")}
        </div>

        <div class="hero-card-zone player-card-zone ${state.matchMode === "linked" && state.opponentRevealed ? "shift-left" : ""}">
          ${buildMyCard(card)}
        </div>

        ${
          state.matchMode === "linked"
            ? `<div class="opponent-card-zone ${state.opponentRevealed ? "visible" : ""}">
                 ${buildOpponentCard(opponentCard)}
               </div>`
            : ""
        }

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

  if (menuToggleBtn) menuToggleBtn.addEventListener("click", () => toggleMenu());
  if (closeMenuBtn) closeMenuBtn.addEventListener("click", () => toggleMenu(false));
  if (quickNewMatchBtn) quickNewMatchBtn.addEventListener("click", () => createLocalMatch(true));
  if (deckSizeSelect) deckSizeSelect.addEventListener("change", (event) => selectDeckSize(event.target.value));
  if (startLocalMatchBtn) startLocalMatchBtn.addEventListener("click", () => createLocalMatch(true));
  if (startLinkedMatchBtn) startLinkedMatchBtn.addEventListener("click", () => createLinkedMatch(true));
  if (resetAllBtn) resetAllBtn.addEventListener("click", fullReset);

  if (winBtn) winBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    resolveRound("win");
  });

  if (drawBtn) drawBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    resolveRound("draw");
  });

  if (loseBtn) loseBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    resolveRound("lose");
  });

  if (nextCardBtn) nextCardBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    nextCard();
  });

  if (resetScoreBtn) resetScoreBtn.addEventListener("click", resetScoreOnly);
  if (openImageBtn) openImageBtn.addEventListener("click", openImage);
  if (closeImageBtn) closeImageBtn.addEventListener("click", closeImage);
  if (copyShareLinkBtn) copyShareLinkBtn.addEventListener("click", copyShareLink);
  if (copyShareLinkInlineBtn) copyShareLinkInlineBtn.addEventListener("click", copyShareLink);

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

const loadedFromUrl = parseUrlMatch();
if (!loadedFromUrl) {
  loadState();
}
render();
