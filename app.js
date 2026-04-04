const STORAGE_KEY = "tfu-duel-v3-local";
const CARD_POOL = Array.isArray(window.cards) ? window.cards : [];

const state = {
  screen: "setup",
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

    state.screen = parsed.screen || "setup";
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
  state.screen = "game";
  state.log = [
    `New match started. ${safeDeckSize} cards shuffled locally.`
  ];

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
  state.screen = "setup";
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

function goToSetup() {
  state.screen = "setup";
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
    return "Pick one stat on your current card, compare it with your opponent in real life, then confirm Win, Lose or Draw.";
  }

  if (!state.roundResolved) {
    return "Stat selected. Compare values now and record the round result.";
  }

  return "Round resolved. Move to the next card.";
}

function getResultBadge() {
  if (!state.roundResolved) {
    return `<span class="status-badge badge-neutral">Round open</span>`;
  }

  if (state.roundResult === "win") {
    return `<span class="status-badge badge-win">Win locked</span>`;
  }

  if (state.roundResult === "lose") {
    return `<span class="status-badge badge-lose">Lose locked</span>`;
  }

  return `<span class="status-badge badge-draw">Draw locked</span>`;
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
    state.screen = "end";
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
  if (state.screen === "setup") {
    appView.innerHTML = buildSetupScreen();
    bindSetupScreen();
    return;
  }

  if (state.screen === "game") {
    appView.innerHTML = buildGameScreen();
    bindGameScreen();
    return;
  }

  if (state.screen === "end") {
    appView.innerHTML = buildEndScreen();
    bindEndScreen();
  }
}

function buildSetupScreen() {
  const allowedSizes = [4, 6, 8, 10, 12].filter((size) => size <= CARD_POOL.length);

  return `
    <section class="screen">
      <div class="setup-grid">
        <section class="panel">
          <div class="setup-header">
            <p class="section-eyebrow">TFU Duel Setup</p>
            <h2 class="setup-title">Local duel on your own device</h2>
            <p class="setup-copy">
              Each player runs the app on their own smartphone. No sync, no fake multiplayer, no backend nonsense.
              You reveal one card locally, pick one stat, compare it in real life, then record Win, Lose or Draw.
            </p>
          </div>

          <div class="config-grid">
            <div class="field-group">
              <label for="deckSizeSelect" class="field-label">Deck size</label>
              <select id="deckSizeSelect" class="field-control">
                ${allowedSizes
                  .map(
                    (size) =>
                      `<option value="${size}" ${size === state.deckSize ? "selected" : ""}>${size} cards</option>`
                  )
                  .join("")}
              </select>
              <p class="field-hint">
                8 or 10 is a good starting point. 12 works too if you want more variation.
              </p>
            </div>
          </div>

          <div class="setup-actions">
            <button id="startMatchBtn" class="btn btn-primary" type="button">Start Match</button>
            <button id="resetAllBtn" class="btn btn-danger" type="button">Full Reset</button>
          </div>
        </section>

        <section class="panel">
          <div class="setup-header">
            <p class="section-eyebrow">Current card pool</p>
            <h3 class="setup-title">${CARD_POOL.length} TFU cards loaded</h3>
            <p class="setup-copy">
              Real images are now linked. The app is using your actual uploaded card set, not placeholder demo cards.
            </p>
          </div>

          <ul class="collection-grid">
            ${CARD_POOL.map(
              (card) => `
                <li class="collection-card">
                  <div class="collection-name">${escapeHtml(card.name)}</div>
                  <div class="collection-meta">${escapeHtml(card.title)} · ${escapeHtml(card.type)} · ${escapeHtml(card.rarity)}</div>
                </li>
              `
            ).join("")}
          </ul>
        </section>
      </div>
    </section>
  `;
}

function buildGameScreen() {
  const card = getCurrentCard();
  if (!card) {
    return `
      <section class="screen">
        <section class="panel">
          <h2 class="setup-title">No active deck</h2>
          <p class="setup-copy">Go back to setup and start a new match.</p>
        </section>
      </section>
    `;
  }

  const totalCards = state.deck.length;
  const roundNumber = state.currentIndex + 1;
  const remaining = Math.max(totalCards - state.currentIndex - 1, 0);
  const selectedValue = getSelectedValue();

  return `
    <section class="screen">
      <section class="hud-grid">
        <article class="hud-card">
          <span class="hud-label">Round</span>
          <strong>${roundNumber} / ${totalCards}</strong>
        </article>

        <article class="hud-card">
          <span class="hud-label">Cards Remaining</span>
          <strong>${remaining}</strong>
        </article>

        <article class="hud-card">
          <span class="hud-label">Score</span>
          <strong>${state.score.wins} / ${state.score.losses} / ${state.score.draws}</strong>
          <small>Win / Lose / Draw</small>
        </article>

        <article class="hud-card">
          <span class="hud-label">Power</span>
          <strong>${card.power}</strong>
        </article>
      </section>

      <div class="game-grid">
        <section class="duel-card premium-card">
          <div class="card-inner-v3">
            <div class="card-topline">
              <div class="card-title-wrap-v3">
                <p class="section-eyebrow">TFU Universe</p>
                <h2 class="card-name-v3">${escapeHtml(card.name)}</h2>
                <p class="card-subtitle-v3">${escapeHtml(card.title)}</p>
              </div>

              <div class="power-stack">
                <div class="power-pill">
                  <span>Power</span>
                  <strong>${card.power}</strong>
                </div>
                <div class="rarity-chip ${getRarityClass(card.rarity)}">${escapeHtml(card.rarity)}</div>
              </div>
            </div>

            <div class="card-image-frame">
              <img class="card-image-v3" src="${escapeHtml(card.image)}" alt="${escapeHtml(card.name)}" />
              <div class="card-role-badge">${escapeHtml(card.type)}</div>
            </div>

            <div class="card-meta-grid-v3">
              <div class="meta-box">
                <span class="meta-label">Role</span>
                <span class="meta-value">${escapeHtml(card.type)}</span>
              </div>
              <div class="meta-box">
                <span class="meta-label">Rarity</span>
                <span class="meta-value">${escapeHtml(card.rarity)}</span>
              </div>
              <div class="meta-box">
                <span class="meta-label">Card ID</span>
                <span class="meta-value">#${card.id}</span>
              </div>
              <div class="meta-box">
                <span class="meta-label">Deck Slot</span>
                <span class="meta-value">${roundNumber}</span>
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
                        <span class="stat-tag">Compare value</span>
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
            <p class="panel-label">Selected stat</p>
            <h2 class="selected-ability">${state.selectedStat ? statLabels[state.selectedStat] : "No stat selected"}</h2>
            <div class="selected-value">${selectedValue ?? "—"}</div>
            ${getResultBadge()}
            <p class="status-copy">${getStatusText()}</p>
          </section>

          <section class="panel">
            <p class="panel-label">Round result</p>
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
              <p class="panel-label">Battle log</p>
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
    </section>
  `;
}

function buildEndScreen() {
  const total = state.deck.length;
  const scoreLine = `${state.score.wins} / ${state.score.losses} / ${state.score.draws}`;

  let verdict = "Balanced match.";
  if (state.score.wins > state.score.losses) {
    verdict = "More wins than losses. Solid run.";
  } else if (state.score.losses > state.score.wins) {
    verdict = "More losses than wins. Deck luck or stat choices were weaker.";
  }

  return `
    <section class="screen">
      <section class="panel">
        <div class="endscreen-grid">
          <p class="section-eyebrow">Match complete</p>
          <h2 class="endscreen-title">All cards played</h2>
          <div class="endscreen-score">${scoreLine}</div>
          <p class="endscreen-copy">${total} cards were played. ${verdict}</p>

          <div class="endscreen-actions">
            <button id="rematchBtn" class="btn btn-primary" type="button">Rematch</button>
            <button id="backToSetupBtn" class="btn btn-secondary" type="button">Back to Setup</button>
          </div>
        </div>
      </section>

      <section class="log-panel">
        <div class="log-header">
          <p class="panel-label">Battle log</p>
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
    </section>
  `;
}

function bindSetupScreen() {
  document.getElementById("deckSizeSelect")?.addEventListener("change", (event) => {
    selectDeckSize(event.target.value);
  });

  document.getElementById("startMatchBtn")?.addEventListener("click", () => createNewMatch(true));
  document.getElementById("resetAllBtn")?.addEventListener("click", fullReset);
}

function bindGameScreen() {
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

function bindEndScreen() {
  document.getElementById("rematchBtn")?.addEventListener("click", () => createNewMatch(true));
  document.getElementById("backToSetupBtn")?.addEventListener("click", goToSetup);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

goToSetupBtn.addEventListener("click", goToSetup);
newMatchBtn.addEventListener("click", () => createNewMatch(true));

if (!loadState()) {
  render();
} else {
  render();
}
