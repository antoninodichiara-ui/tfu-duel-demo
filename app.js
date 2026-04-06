const STORAGE_KEY = "tfu-duel-v15-linked";
const LINK_PREFIX = "#linked=";

const state = {
  cards: [],
  deck: [],
  currentIndex: 0,
  selectedStat: null,
  roundOpen: true,
  roundNumber: 1,
  maxRounds: 8,
  wins: 0,
  losses: 0,
  draws: 0,
  mode: "local", // "local" | "linked"
  deckSize: 20,
  linkedId: null,
  playerRole: "host", // "host" | "guest"
};

const el = {
  app: document.getElementById("app"),
};

function safeNumber(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function shuffle(arr) {
  const clone = [...arr];
  for (let i = clone.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [clone[i], clone[j]] = [clone[j], clone[i]];
  }
  return clone;
}

function slugify(text = "") {
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .trim();
}

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function getAllCards() {
  if (!window.TFU_CARDS || !Array.isArray(window.TFU_CARDS)) return [];
  return window.TFU_CARDS.map((c, index) => ({
    id: c.id || `${slugify(c.name || "card")}-${index}`,
    name: c.name || "Unknown",
    title: c.title || "",
    type: c.type || "",
    image: c.image || "",
    stats: {
      STR: safeNumber(c.stats?.STR),
      AGI: safeNumber(c.stats?.AGI),
      VIT: safeNumber(c.stats?.VIT),
      INT: safeNumber(c.stats?.INT),
      PWR: safeNumber(c.stats?.PWR),
      TOT: safeNumber(c.stats?.TOT),
    },
    tags: Array.isArray(c.tags) ? c.tags : [],
    quote: c.quote || "",
  }));
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    deck: state.deck,
    currentIndex: state.currentIndex,
    selectedStat: state.selectedStat,
    roundOpen: state.roundOpen,
    roundNumber: state.roundNumber,
    maxRounds: state.maxRounds,
    wins: state.wins,
    losses: state.losses,
    draws: state.draws,
    mode: state.mode,
    deckSize: state.deckSize,
    linkedId: state.linkedId,
    playerRole: state.playerRole,
  }));
}

function restore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const data = JSON.parse(raw);

    state.deck = Array.isArray(data.deck) ? data.deck : [];
    state.currentIndex = safeNumber(data.currentIndex, 0);
    state.selectedStat = data.selectedStat || null;
    state.roundOpen = data.roundOpen !== false;
    state.roundNumber = safeNumber(data.roundNumber, 1);
    state.maxRounds = safeNumber(data.maxRounds, 8);
    state.wins = safeNumber(data.wins, 0);
    state.losses = safeNumber(data.losses, 0);
    state.draws = safeNumber(data.draws, 0);
    state.mode = data.mode || "local";
    state.deckSize = safeNumber(data.deckSize, 20);
    state.linkedId = data.linkedId || null;
    state.playerRole = data.playerRole || "host";

    return state.deck.length > 0;
  } catch {
    return false;
  }
}

function resetState() {
  state.deck = [];
  state.currentIndex = 0;
  state.selectedStat = null;
  state.roundOpen = true;
  state.roundNumber = 1;
  state.maxRounds = 8;
  state.wins = 0;
  state.losses = 0;
  state.draws = 0;
  state.mode = "local";
  state.deckSize = 20;
  state.linkedId = null;
  state.playerRole = "host";
  persist();
}

function buildDeck(size = 20) {
  const pool = shuffle(state.cards);
  return pool.slice(0, Math.min(size, pool.length));
}

function startLocalMatch(size = 20) {
  state.mode = "local";
  state.deckSize = size;
  state.deck = buildDeck(size);
  state.currentIndex = 0;
  state.selectedStat = null;
  state.roundOpen = true;
  state.roundNumber = 1;
  state.maxRounds = Math.min(8, state.deck.length);
  state.wins = 0;
  state.losses = 0;
  state.draws = 0;
  state.linkedId = null;
  state.playerRole = "host";
  persist();
  render();
}

function startLinkedMatch(size = 20) {
  state.mode = "linked";
  state.deckSize = size;
  state.deck = buildDeck(size);
  state.currentIndex = 0;
  state.selectedStat = null;
  state.roundOpen = true;
  state.roundNumber = 1;
  state.maxRounds = Math.min(8, state.deck.length);
  state.wins = 0;
  state.losses = 0;
  state.draws = 0;
  state.linkedId = uid();
  state.playerRole = "host";
  persist();
  render();
}

function joinLinkedMatch(matchId) {
  state.mode = "linked";
  state.linkedId = matchId;
  state.playerRole = "guest";
  if (!state.deck.length) {
    state.deck = buildDeck(20);
    state.deckSize = 20;
    state.maxRounds = Math.min(8, state.deck.length);
  }
  persist();
  render();
}

function nextCard() {
  if (state.currentIndex < state.deck.length - 1) {
    state.currentIndex += 1;
    state.selectedStat = null;
    state.roundOpen = true;
    if (state.roundNumber < state.maxRounds) {
      state.roundNumber += 1;
    }
    persist();
    render();
  }
}

function setStat(stat) {
  if (!state.roundOpen) return;
  state.selectedStat = stat;
  persist();
  render();
}

function setRoundResult(result) {
  if (!state.roundOpen) return;

  if (result === "win") state.wins += 1;
  if (result === "lose") state.losses += 1;
  if (result === "draw") state.draws += 1;

  state.roundOpen = false;
  persist();
  render();
}

function copyLinkedUrl() {
  if (!state.linkedId) return;
  const url = `${window.location.origin}${window.location.pathname}${LINK_PREFIX}${state.linkedId}`;
  navigator.clipboard.writeText(url).then(() => {
    alert("Link copiato!");
  });
}

function currentCard() {
  return state.deck[state.currentIndex] || null;
}

function buildTopBar() {
  return `
    <div class="ultra-thin-topbar">
      <div class="topbar-left">
        <div class="topbar-eyebrow">TFU Universe Card Battle</div>
        <div class="topbar-title">TFU Duel</div>
        <div class="topbar-subtitle">Mobile-first Local Duel Companion</div>
      </div>

      <div class="topbar-actions">
        <button class="glass-btn" onclick="toggleSetupModal(true)">Setup</button>
        <button class="glass-btn" onclick="startLocalMatch(state.deckSize)">Neues Match</button>
      </div>
    </div>
  `;
}

function buildLinkedMiniBar() {
  if (state.mode !== "linked") return "";

  const role = state.playerRole === "host" ? "HOST" : "GUEST";
  return `
    <div class="linked-mini-bar">
      <div class="linked-pill">${role}</div>
      <div class="linked-id">Match ID: ${state.linkedId || "—"}</div>
      ${state.playerRole === "host" ? `
        <button class="linked-copy-btn" onclick="copyLinkedUrl()">Copy Link</button>
      ` : ""}
    </div>
  `;
}

function buildCompactHud() {
  return `
    <div class="compact-hud-bar">
      <div class="hud-chip">
        <span class="hud-label">ROUND</span>
        <span class="hud-value">${state.roundNumber}/${state.maxRounds}</span>
      </div>
      <div class="hud-chip">
        <span class="hud-label">SCORE</span>
        <span class="hud-value">${state.wins}/${state.losses}/${state.draws}</span>
        <span class="hud-sub">W / L / D</span>
      </div>
      <div class="hud-chip">
        <span class="hud-label">SELECTED</span>
        <span class="hud-value">${state.selectedStat || "—"}</span>
      </div>
      <div class="hud-chip round-state ${state.roundOpen ? "open" : "closed"}">
        ${state.roundOpen ? "ROUND OPEN" : "ROUND LOCKED"}
      </div>
    </div>
  `;
}

function buildCard(card) {
  if (!card) {
    return `
      <div class="empty-state">
        <h2>No Card Loaded</h2>
        <p>Start a new match from Setup.</p>
      </div>
    `;
  }

  const statOrderLeft = ["STR", "AGI", "VIT"];
  const statOrderRight = ["INT", "PWR", "TOT"];

  return `
    <div class="card-visual-shell">
      <div class="side-stick side-stick-left">
        ${statOrderLeft.map(stat => `
          <button
            class="side-stat-btn ${state.selectedStat === stat ? "selected" : ""}"
            onclick="setStat('${stat}')"
          >
            ${stat}
          </button>
        `).join("")}
      </div>

      <div class="side-stick side-stick-right">
        ${statOrderRight.map(stat => `
          <button
            class="side-stat-btn ${state.selectedStat === stat ? "selected" : ""}"
            onclick="setStat('${stat}')"
          >
            ${stat}
          </button>
        `).join("")}
      </div>

      <div class="card-hero-frame">
        <img class="card-main-image" src="${card.image}" alt="${card.name}" />
      </div>

      <div class="bottom-float-actions">
        <button class="float-action type-chip">${card.type || "CARD"}</button>
        <button class="float-action expand-chip" onclick="toggleExpandModal(true)">TAP TO EXPAND</button>
      </div>
    </div>

    <div class="compact-hud-wrap">
      ${buildCompactHud()}
    </div>

    <div class="mobile-fight-actions">
      <button class="fight-btn fight-win" onclick="setRoundResult('win')">WIN</button>
      <button class="fight-btn fight-draw" onclick="setRoundResult('draw')">DRAW</button>
      <button class="fight-btn fight-lose" onclick="setRoundResult('lose')">LOSE</button>
      <button class="fight-btn fight-next" onclick="nextCard()">NEXT</button>
    </div>
  `;
}

function buildSetupModal() {
  return `
    <div id="setupModal" class="setup-modal hidden">
      <div class="setup-panel">
        <div class="setup-header">
          <div>
            <div class="setup-eyebrow">TFU Duel Menu</div>
            <h2>Match Setup</h2>
          </div>
          <button class="close-x" onclick="toggleSetupModal(false)">×</button>
        </div>

        <p class="setup-copy">
          Start a local match with your current card pool or create a linked match for player 2.
        </p>

        <label class="setup-label">Deck Size</label>
        <select id="deckSizeSelect" class="deck-select">
          <option value="20" ${state.deckSize === 20 ? "selected" : ""}>20 Cards</option>
          <option value="15" ${state.deckSize === 15 ? "selected" : ""}>15 Cards</option>
          <option value="10" ${state.deckSize === 10 ? "selected" : ""}>10 Cards</option>
        </select>

        <div class="setup-actions-stack">
          <button class="primary-setup-btn" onclick="handleStartLocal()">Start Local Match</button>
          <button class="secondary-setup-btn" onclick="handleStartLinked()">Create Linked Match</button>
          <button class="danger-setup-btn" onclick="handleFullReset()">Full Reset</button>
        </div>

        ${state.mode === "linked" && state.playerRole === "host" && state.linkedId ? `
          <div class="linked-share-box">
            <div class="share-title">Player 2 Link</div>
            <div class="share-url">${window.location.origin}${window.location.pathname}${LINK_PREFIX}${state.linkedId}</div>
            <button class="copy-share-btn" onclick="copyLinkedUrl()">Copy Link</button>
          </div>
        ` : ""}
      </div>
    </div>
  `;
}

function buildExpandModal(card) {
  if (!card) return "";

  return `
    <div id="expandModal" class="expand-modal hidden" onclick="toggleExpandModal(false)">
      <div class="expand-panel" onclick="event.stopPropagation()">
        <button class="close-x expand-close" onclick="toggleExpandModal(false)">×</button>
        <img class="expand-image" src="${card.image}" alt="${card.name}" />
      </div>
    </div>
  `;
}

function render() {
  const card = currentCard();

  el.app.innerHTML = `
    <div class="app-shell">
      ${buildTopBar()}
      ${buildLinkedMiniBar()}
      <main class="duel-main">
        ${buildCard(card)}
      </main>
      ${buildSetupModal()}
      ${buildExpandModal(card)}
    </div>
  `;
}

function toggleSetupModal(show) {
  const modal = document.getElementById("setupModal");
  if (!modal) return;
  modal.classList.toggle("hidden", !show);
}

function toggleExpandModal(show) {
  const modal = document.getElementById("expandModal");
  if (!modal) return;
  modal.classList.toggle("hidden", !show);
}

function handleStartLocal() {
  const select = document.getElementById("deckSizeSelect");
  const size = safeNumber(select?.value, 20);
  startLocalMatch(size);
  toggleSetupModal(false);
}

function handleStartLinked() {
  const select = document.getElementById("deckSizeSelect");
  const size = safeNumber(select?.value, 20);
  startLinkedMatch(size);
  toggleSetupModal(false);
}

function handleFullReset() {
  localStorage.removeItem(STORAGE_KEY);
  resetState();
  render();
  toggleSetupModal(false);
}

function bootLinkedMatchFromHash() {
  const hash = window.location.hash || "";
  if (!hash.startsWith(LINK_PREFIX)) return false;
  const matchId = hash.replace(LINK_PREFIX, "").trim();
  if (!matchId) return false;
  joinLinkedMatch(matchId);
  return true;
}

function init() {
  state.cards = getAllCards();

  const hasLinkedHash = bootLinkedMatchFromHash();
  if (!hasLinkedHash) {
    const restored = restore();
    if (!restored) {
      startLocalMatch(20);
      return;
    }
  }

  render();
}

window.toggleSetupModal = toggleSetupModal;
window.toggleExpandModal = toggleExpandModal;
window.setStat = setStat;
window.setRoundResult = setRoundResult;
window.nextCard = nextCard;
window.handleStartLocal = handleStartLocal;
window.handleStartLinked = handleStartLinked;
window.handleFullReset = handleFullReset;
window.copyLinkedUrl = copyLinkedUrl;
window.state = state;

init();
