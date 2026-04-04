const STORAGE_KEY = "tfu-duel-v4-local";
const CARD_POOL = Array.isArray(window.cards) ? window.cards : [];

const state = {
  menuOpen: true,
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
  log: []
};

const statLabels = {
  attack: "Attack",
  defense: "Defense",
  speed: "Speed",
  intelligence: "Intelligence",
  energy: "Energy"
};

const appView = document.getElementById("appView");
const goToSetupBtn = document.getElementById("goToSetupBtn");
const newMatchBtn = document.getElementById("newMatchBtn");

function shuffle(array) {
  const clone = [...array];
  for (let i = clone.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [clone[i], clone[j]] = [clone[j], clone[i]];
  }
  return clone;
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return false;

  try {
    const parsed = JSON.parse(raw);

    state.menuOpen = Boolean(parsed.menuOpen);
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
    state.log = Array.isArray(parsed.log) ? parsed.log : [];
    return true;
  } catch (error) {
    console.error("Could not load game state:", error);
    return false;
  }
}

function createNewMatch(keepScore = true) {
  const safeDeckSize = Math.max(4, Math.min(state.deckSize, CARD_POOL.length));
  state.deck = shuffle(CARD_POOL).slice(0, safeDeckSize);
  state.currentIndex = 0;
  state.selectedStat = null;
  state.roundResolved = false;
  state.roundResult = null;
  state.finished = false;
  state.menuOpen = false;
  state.log = [`New match started. ${safeDeckSize} cards shuffled locally.`];

  if (!keepScore) {
    state.score = {
      wins: 0,
      losses: 0,
      draws: 0
    };
    state.log.push("Score reset.");
  }

  saveState();
  render();
}

function fullReset() {
  state.menuOpen = true;
  state.deckSize = 8;
  state.deck = [];
  state.currentIndex = 0;
  state.selectedStat = null;
  state.roundResolved = false;
  state.roundResult = null;
  state.finished = false;
  state.score = {
    wins: 0,
    losses: 0,
    draws: 0
  };
  state.log = [];
  saveState();
  render();
}

function resetScoreOnly() {
  state.score = {
    wins: 0,
    losses: 0,
    draws: 0
  };
  state.log.push("Score reset.");
  saveState();
  render();
}

function toggleMenu(forceValue) {
  state.menuOpen = typeof forceValue === "boolean" ? forceValue : !state.menuOpen;
  saveState();
  render();
}

function getCurrentCard() {
  return state.deck[state.currentIndex] || null;
}

function getSelectedValue() {
  const card = getCurrentCard();
  if (!card || !state.selectedStat) return null;
  return card.stats[state.selectedStat];
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
  if (state.finished) {
    return "Match finished. Start a new match for a fresh local shuffle.";
  }

  if (!state.selectedStat) {
    return "Pick one stat on your current card, compare it in real life, then confirm Win, Lose or Draw.";
  }

  if (!state.roundResolved) {
    return "Stat selected. Compare values now and record the result.";
  }

  return "Round resolved. Move to the next card.";
}

function getResultBadge() {
  if (!state.roundResolved) {
    return `<span class="status-badge badge-neutral">Round Open</span>`;
  }

  if (state.roundResult === "win") {
    return `<span class="status-badge badge-win">Win Locked</span>`;
  }

  if (state.roundResult === "lose") {
    return `<span class="status-badge badge-lose">Lose Locked</span>`;
  }

  return `<span class="status-badge badge-draw">Draw Locked</span>`;
}

function selectDeckSize(value) {
  const nextSize = Number(value);
  if (!Number.isFinite(nextSize)) return;
  state.deckSize = Math.max(4, Math.min(nextSize, CARD_POOL.length));
  saveState();
}

function selectStat(statKey) {
  if (state.roundResolved || state.finished) return;

  const card = getCurrentCard();
  if (!card) return;

  state.selectedStat = statKey;
  state.log.push(
    `Round ${state.currentIndex + 1}: ${card.name} selected ${statLabels[statKey]} (${card.stats[statKey]}).`
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
    `Round ${state.currentIndex + 1}: ${card.name} -> ${statLabels[state.selectedStat]} ${card.stats[state.selectedStat]} -> ${result.toUpperCase()}.`
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
      `Match finished. Final score: ${state.score.wins}W / ${state.score.losses}L / ${state.score.draws}D.`
    );
    saveState();
    render();
    return;
  }

  state.currentIndex += 1;
  state.selectedStat = null;
  state.roundResolved = false;
  state.roundResult = null;
  state.log.push(`Round ${state.currentIndex + 1}: next card revealed.`);
  saveState();
  render();
}

function render() {
  appView.innerHTML = buildApp();
  bindApp();
}

function buildApp() {
  const allowedSizes = [4, 6, 8, 10, 12].filter((size) => size <= CARD_POOL.length);
  const card = getCurrentCard();
  const totalCards = state.deck.length;
  const roundNumber = state.finished
    ? totalCards
    : state.deck.length
      ? state.currentIndex + 1
      : 0;
  const remaining = state.finished
    ? 0
    : state.deck.length
      ? Math.max(totalCards - state.currentIndex - 1, 0)
      : 0;
  const selectedValue = getSelectedValue();

  return `
    <section class="screen">
      <div class="floating-menu-bar">
        <button id="menuToggleBtn" class="menu-toggle-btn" type="button">
          ☰ Menu
        </button>
      </div>

      ${state.menuOpen ? `
        <div id="menuOverlay" class="menu-overlay">
          <section class="menu-panel">
            <div class="menu-panel-header">
              <div>
                <p class="section-eyebrow">TFU Duel Menu</p>
                <h2 class="setup-title">Quick Match Setup</h2>
              </div>
              <button id="closeMenuBtn" class="menu-close-btn" type="button">✕</button>
            </div>

            <p class="setup-copy">
              Local duel mode. Each player uses their own device, reveals one card, picks one stat, compares it in real life, then records Win, Lose or Draw.
            </p>

            <div class="config-grid">
              <div class="field-group">
                <label for="deckSizeSelect" class="field-label">Deck Size</label>
                <select id="deckSizeSelect" class="field-control">
                  ${allowedSizes
                    .map(
                      (size) =>
                        `<option value="${size}" ${size === state.deckSize ? "selected" : ""}>${size} Cards</option>`
                    )
                    .join("")}
                </select>
              </div>
            </div>

            <div class="setup-actions">
              <button id="startMatchBtn" class="btn btn-primary" type="button">Start Match</button>
              <button id="newLocalMatchBtn" class="btn btn-secondary" type="button">New Match</button>
              <button id="resetAllBtn" class="btn btn-danger" type="button">Full Reset</button>
            </div>

            <div class="mini-card-pool">
              <p class="panel-label">Card Pool</p>
              <div class="mini-card-pool-grid">
                ${CARD_POOL.map(
                  (c) => `
                    <div class="mini-card-pill">${escapeHtml(c.name)}</div>
                  `
                ).join("")}
              </div>
            </div>
          </section>
        </div>
      ` : ""}

      <section class="hud-grid compact-hud">
        <article class="hud-card">
          <span class="hud-label">Round</span>
          <strong>${roundNumber} / ${totalCards || state.deckSize}</strong>
        </article>

        <article class="hud-card">
          <span class="hud-label">Remaining</span>
          <strong>${remaining}</strong>
        </article>

        <article class="hud-card">
          <span class="hud-label">Score</span>
          <strong>${state.score.wins} / ${state.score.losses} / ${state.score.draws}</strong>
          <small>Win / Lose / Draw</small>
        </article>

        <article class="hud-card">
          <span class="hud-label">Power</span>
          <strong>${card ? card.power : "—"}</strong>
        </article>
      </section>

      ${
        card
          ? `
            <div class="game-grid">
              <section class="duel-card premium-card">
                <div class="card-inner-v3 card-inner-compact">
                  <div class="card-topline compact-topline">
                    <div class="compact-title-wrap">
                      <h2 class="card-name-v3 compact-name">${escapeHtml(card.name)}</h2>
                      <p class="card-subtitle-v3 compact-subtitle">${escapeHtml(card.title)}</p>
                    </div>

                    <div class="compact-right-meta">
                      <div class="power-pill compact-power">
                        <span>Power</span>
                        <strong>${card.power}</strong>
                      </div>
                      <div class="rarity-chip ${getRarityClass(card.rarity)}">${escapeHtml(card.rarity)}</div>
                    </div>
                  </div>

                  <div class="card-image-frame image-priority-frame">
                    <img class="card-image-v3 image-priority" src="${escapeHtml(card.image)}" alt="${escapeHtml(card.name)}" />
                    <div class="card-role-badge">${escapeHtml(card.type)}</div>
                  </div>

                  <div class="card-meta-grid-v3 compact-meta-grid">
                    <div class="meta-box">
                      <span class="meta-label">Role</span>
                      <span class="meta-value">${escapeHtml(card.type)}</span>
                    </div>
                    <div class="meta-box">
                      <span class="meta-label">Rarity</span>
                      <span class="meta-value">${escapeHtml(card.rarity)}</span>
                    </div>
                  </div>

                  <div class="stats-list-v3">
                    ${Object.entries(card.stats)
                      .map(([key, value]) => {
                        const selected = state.selectedStat === key ? "selected" : "";
                        const disabled = state.roundResolved ? "disabled" : "";
                        return `
                          <button class="stat-btn-v3 ${selected}" data-stat="${key}" type="button" ${disabled}>
                            <span class="stat-left">
                              <span class="stat-name">${statLabels[key]}</span>
                              <span class="stat-tag">Compare Value</span>
                            </span>
                            <span class="stat-number">${value}</span>
                          </button>
                        `;
                      })
                      .join("")}
                  </div>
                </div>
              </section>

              <aside class="side-stack">
                <section class="panel">
                  <p class="panel-label">Selected Stat</p>
                  <h2 class="selected-ability">${state.selectedStat ? statLabels[state.selectedStat] : "No Stat Selected"}</h2>
                  <div class="selected-value">${selectedValue ?? "—"}</div>
                  ${getResultBadge()}
                  <p class="status-copy">${getStatusText()}</p>
                </section>

                <section class="panel">
                  <p class="panel-label">Round Result</p>
                  <div class="result-grid">
                    <button id="winBtn" class="btn btn-win" type="button" ${!state.selectedStat || state.roundResolved ? "disabled" : ""}>Win</button>
                    <button id="drawBtn" class="btn btn-draw" type="button" ${!state.selectedStat || state.roundResolved ? "disabled" : ""}>Draw</button>
                    <button id="loseBtn" class="btn btn-lose" type="button" ${!state.selectedStat || state.roundResolved ? "disabled" : ""}>Lose</button>
                  </div>

                  <div class="action-row">
                    <button id="nextCardBtn" class="btn btn-primary" type="button" ${!state.roundResolved ? "disabled" : ""}>Next Card</button>
                    <button id="resetScoreBtn" class="btn btn-secondary" type="button">Reset Score</button>
                  </div>
                </section>

                <section class="log-panel">
                  <div class="log-header">
                    <p class="panel-label">Battle Log</p>
                  </div>
                  <ul class="battle-log">
                    ${
                      state.log.length === 0
                        ? `<li>No entries yet.</li>`
                        : state.log
                            .slice()
                            .reverse()
                            .map((entry) => `<li>${escapeHtml(entry)}</li>`)
                            .join("")
                    }
                  </ul>
                </section>
              </aside>
            </div>
          `
          : `
            <section class="panel">
              <h2 class="setup-title">No Active Match</h2>
              <p class="setup-copy">Open the menu and start a match.</p>
            </section>
          `
      }

      ${
        state.finished
          ? `
            <section class="panel">
              <div class="endscreen-grid">
                <p class="section-eyebrow">Match Complete</p>
                <h2 class="endscreen-title">All Cards Played</h2>
                <div class="endscreen-score">${state.score.wins} / ${state.score.losses} / ${state.score.draws}</div>
                <p class="endscreen-copy">Start a new match from the menu for a fresh local shuffle.</p>
              </div>
            </section>
          `
          : ""
      }
    </section>
  `;
}

function bindApp() {
  document.getElementById("menuToggleBtn")?.addEventListener("click", () => toggleMenu());
  document.getElementById("closeMenuBtn")?.addEventListener("click", () => toggleMenu(false));
  document.getElementById("deckSizeSelect")?.addEventListener("change", (event) => {
    selectDeckSize(event.target.value);
  });
  document.getElementById("startMatchBtn")?.addEventListener("click", () => createNewMatch(true));
  document.getElementById("newLocalMatchBtn")?.addEventListener("click", () => createNewMatch(true));
  document.getElementById("resetAllBtn")?.addEventListener("click", fullReset);

  document.querySelectorAll("[data-stat]").forEach((button) => {
    button.addEventListener("click", () => {
      selectStat(button.dataset.stat);
    });
  });

  document.getElementById("winBtn")?.addEventListener("click", () => resolveRound("win"));
  document.getElementById("drawBtn")?.addEventListener("click", () => resolveRound("draw"));
  document.getElementById("loseBtn")?.addEventListener("click", () => resolveRound("lose"));
  document.getElementById("nextCardBtn")?.addEventListener("click", nextCard);
  document.getElementById("resetScoreBtn")?.addEventListener("click", resetScoreOnly);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

goToSetupBtn.addEventListener("click", () => toggleMenu(true));
newMatchBtn.addEventListener("click", () => createNewMatch(true));

if (!loadState()) {
  render();
} else {
  render();
}
