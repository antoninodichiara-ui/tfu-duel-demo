const STORAGE_KEY = "tfu-duel-v2-1";
const CARDS = Array.isArray(window.TFU_CARDS) ? window.TFU_CARDS : [];

const state = {
  screen: "setup",
  matchMode: "score",
  deckSize: 8,
  deck: [],
  currentIndex: 0,
  selectedAbility: null,
  selectedValue: null,
  roundResolved: false,
  roundResult: null,
  finished: false,
  score: {
    wins: 0,
    losses: 0,
    draws: 0
  },
  collection: [],
  log: []
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
    state.matchMode = parsed.matchMode || "score";
    state.deckSize = Number(parsed.deckSize) || 8;
    state.deck = Array.isArray(parsed.deck) ? parsed.deck : [];
    state.currentIndex = Number.isInteger(parsed.currentIndex) ? parsed.currentIndex : 0;
    state.selectedAbility = parsed.selectedAbility || null;
    state.selectedValue = parsed.selectedValue ?? null;
    state.roundResolved = Boolean(parsed.roundResolved);
    state.roundResult = parsed.roundResult || null;
    state.finished = Boolean(parsed.finished);
    state.score = {
      wins: Number(parsed.score?.wins) || 0,
      losses: Number(parsed.score?.losses) || 0,
      draws: Number(parsed.score?.draws) || 0
    };
    state.collection = Array.isArray(parsed.collection) ? parsed.collection : [];
    state.log = Array.isArray(parsed.log) ? parsed.log : [];

    return true;
  } catch (error) {
    console.error("Fehler beim Laden des Spielstands:", error);
    return false;
  }
}

function getCurrentCard() {
  return state.deck[state.currentIndex] || null;
}

function startNewMatch() {
  const safeDeckSize = Math.max(4, Math.min(state.deckSize, CARDS.length));
  state.deck = shuffle(CARDS).slice(0, safeDeckSize);
  state.currentIndex = 0;
  state.selectedAbility = null;
  state.selectedValue = null;
  state.roundResolved = false;
  state.roundResult = null;
  state.finished = false;
  state.log = [
    `Neues Match gestartet. Modus: ${state.matchMode === "score" ? "Score Mode" : "Collection Mode"}.`,
    `Deck lokal gemischt. ${safeDeckSize} Karten aktiv.`
  ];
  state.screen = "game";
  saveState();
  render();
}

function resetToSetup() {
  state.screen = "setup";
  saveState();
  render();
}

function resetEverything() {
  state.screen = "setup";
  state.matchMode = "score";
  state.deckSize = 8;
  state.deck = [];
  state.currentIndex = 0;
  state.selectedAbility = null;
  state.selectedValue = null;
  state.roundResolved = false;
  state.roundResult = null;
  state.finished = false;
  state.score = {
    wins: 0,
    losses: 0,
    draws: 0
  };
  state.collection = [];
  state.log = [];
  saveState();
  render();
}

function selectMode(mode) {
  state.matchMode = mode;
  saveState();
  render();
}

function updateDeckSize(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return;
  state.deckSize = Math.max(4, Math.min(number, CARDS.length));
  saveState();
}

function selectAbility(statName) {
  if (state.roundResolved || state.finished) return;
  const currentCard = getCurrentCard();
  if (!currentCard) return;

  state.selectedAbility = statName;
  state.selectedValue = currentCard.stats[statName];
  state.log.push(
    `Runde ${state.currentIndex + 1}: Fähigkeit "${statName}" mit Wert ${state.selectedValue} gewählt.`
  );
  saveState();
  render();
}

function resolveRound(resultType) {
  if (!state.selectedAbility || state.roundResolved || state.finished) return;

  const currentCard = getCurrentCard();
  if (!currentCard) return;

  state.roundResolved = true;
  state.roundResult = resultType;

  if (resultType === "win") {
    state.score.wins += 1;
    state.log.push(
      `Runde ${state.currentIndex + 1}: ${currentCard.name} gewinnt mit "${state.selectedAbility}" (${state.selectedValue}).`
    );
  }

  if (resultType === "lose") {
    state.score.losses += 1;
    state.log.push(
      `Runde ${state.currentIndex + 1}: ${currentCard.name} verliert mit "${state.selectedAbility}" (${state.selectedValue}).`
    );
  }

  if (resultType === "draw") {
    state.score.draws += 1;
    state.log.push(
      `Runde ${state.currentIndex + 1}: ${currentCard.name} endet unentschieden mit "${state.selectedAbility}" (${state.selectedValue}).`
    );
  }

  saveState();
  render();
}

function addWinToCollection() {
  if (state.matchMode !== "collection") return;
  if (!state.roundResolved || state.roundResult !== "win") return;

  const currentCard = getCurrentCard();
  if (!currentCard) return;

  const exists = state.collection.some((item) => item.id === currentCard.id);
  if (exists) {
    state.log.push(`Sammlung: ${currentCard.name} ist bereits in deiner lokalen Collection.`);
  } else {
    state.collection.push({
      id: currentCard.id,
      name: currentCard.name,
      title: currentCard.title,
      faction: currentCard.faction,
      role: currentCard.role
    });
    state.log.push(`Sammlung: ${currentCard.name} wurde lokal zu deiner Collection hinzugefügt.`);
  }

  saveState();
  render();
}

function goToNextCard() {
  if (!state.roundResolved || state.finished) return;

  const isLastCard = state.currentIndex >= state.deck.length - 1;
  if (isLastCard) {
    state.finished = true;
    state.screen = "end";
    state.log.push(
      `Match beendet. Endstand: ${state.score.wins} Win / ${state.score.losses} Lose / ${state.score.draws} Draw.`
    );
    saveState();
    render();
    return;
  }

  state.currentIndex += 1;
  state.selectedAbility = null;
  state.selectedValue = null;
  state.roundResolved = false;
  state.roundResult = null;
  state.log.push(`Runde ${state.currentIndex + 1} startet. Nächste Karte aufgedeckt.`);
  saveState();
  render();
}

function resetScoreOnly() {
  state.score = {
    wins: 0,
    losses: 0,
    draws: 0
  };
  state.log.push("Score wurde manuell zurückgesetzt.");
  saveState();
  render();
}

function clearCollection() {
  state.collection = [];
  state.log.push("Lokale Collection wurde geleert.");
  saveState();
  render();
}

function getRoundBadge() {
  if (!state.roundResolved) {
    return `<div class="status-badge badge-neutral">Runde offen</div>`;
  }

  if (state.roundResult === "win") {
    return `<div class="status-badge badge-win">Win bestätigt</div>`;
  }

  if (state.roundResult === "lose") {
    return `<div class="status-badge badge-lose">Lose bestätigt</div>`;
  }

  return `<div class="status-badge badge-draw">Draw bestätigt</div>`;
}

function getStatusText() {
  if (state.finished) {
    return "Match abgeschlossen. Neues Match starten oder zur Setup-Ansicht zurück.";
  }

  if (!state.selectedAbility) {
    return "Wähle zuerst eine Fähigkeit auf deiner Karte. Danach trägst du das Rundenergebnis manuell ein.";
  }

  if (!state.roundResolved) {
    return "Fähigkeit gewählt. Vergleiche jetzt mit dem Gegner und drücke Win, Lose oder Draw.";
  }

  if (state.matchMode === "collection" && state.roundResult === "win") {
    return "Du hast gewonnen. Du kannst diese Karte optional lokal deiner Collection hinzufügen oder direkt zur nächsten Karte gehen.";
  }

  return "Runde abgeschlossen. Weiter mit der nächsten Karte.";
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
  return `
    <section class="screen">
      <div class="setup-grid">
        <section class="panel">
          <div class="setup-header">
            <p class="section-eyebrow">Version 2.1 Setup</p>
            <h2 class="setup-title">Lokales Duell sauber starten</h2>
            <p class="setup-copy">
              Jeder Spieler nutzt die App auf seinem eigenen Smartphone. Kein Sync, kein Fake-Multiplayer.
              Die App verwaltet dein eigenes Deck, deine aktuelle Karte, deinen Score und optional deine lokale Sammlung.
            </p>
          </div>

          <div class="mode-grid">
            <button class="mode-card ${state.matchMode === "score" ? "active" : ""}" data-mode="score" type="button">
              <span class="panel-label">Modus</span>
              <span class="mode-card-title">Score Mode</span>
              <span class="mode-card-copy">
                Klassisch und sauber. Nach jeder Runde nur Win / Lose / Draw tracken. Keine Collection-Logik.
              </span>
            </button>

            <button class="mode-card ${state.matchMode === "collection" ? "active" : ""}" data-mode="collection" type="button">
              <span class="panel-label">Modus</span>
              <span class="mode-card-title">Collection Mode</span>
              <span class="mode-card-copy">
                Zusätzlich kannst du gewonnene Karten lokal deiner Sammlung hinzufügen. Das ist bewusst nur lokal/manuell.
              </span>
            </button>
          </div>

          <div class="config-grid">
            <div class="field-group">
              <label for="deckSizeSelect" class="field-label">Deckgröße</label>
              <select id="deckSizeSelect" class="field-control">
                ${buildDeckSizeOptions()}
              </select>
              <p class="field-hint">
                Für den Start reicht 6 oder 8. Mehr Karten sind okay, aber zuerst soll der Flow sauber bleiben.
              </p>
            </div>
          </div>

          <div class="setup-actions">
            <button id="startMatchBtn" class="btn btn-primary" type="button">Match starten</button>
            <button id="fullResetBtn" class="btn btn-danger" type="button">Alles zurücksetzen</button>
          </div>
        </section>

        <section class="panel">
          <div class="setup-header">
            <p class="section-eyebrow">Projektstatus</p>
            <h3 class="setup-title">Was diese Version korrekt macht</h3>
          </div>

          <div class="collection-grid">
            <li class="collection-card">
              <div class="collection-name">1 Gerät = 1 Spieler</div>
              <div class="collection-meta">Jeder mischt sein Deck lokal auf dem eigenen Smartphone.</div>
            </li>
            <li class="collection-card">
              <div class="collection-name">Manuelle Rundenauswertung</div>
              <div class="collection-meta">Passt exakt zu deinem realen Spielablauf ohne Verbindung zwischen den Geräten.</div>
            </li>
            <li class="collection-card">
              <div class="collection-name">Saubere Datenstruktur</div>
              <div class="collection-meta">Kartendaten liegen getrennt in cards.js statt chaotisch in app.js.</div>
            </li>
            <li class="collection-card">
              <div class="collection-name">Erweiterbar</div>
              <div class="collection-meta">Der nächste logische Schritt sind echte Assets, Sound, Animationen und bessere Kartenpräsentation.</div>
            </li>
          </div>
        </section>
      </div>
    </section>
  `;
}

function buildDeckSizeOptions() {
  const allowedSizes = [4, 6, 8, 10].filter((size) => size <= CARDS.length);
  return allowedSizes
    .map((size) => `<option value="${size}" ${size === state.deckSize ? "selected" : ""}>${size} Karten</option>`)
    .join("");
}

function buildGameScreen() {
  const currentCard = getCurrentCard();
  const totalCards = state.deck.length;
  const roundNumber = state.currentIndex + 1;
  const remaining = Math.max(totalCards - state.currentIndex - 1, 0);

  return `
    <section class="screen">
      <section class="hud-grid">
        <article class="hud-card">
          <span class="hud-label">Modus</span>
          <strong>${state.matchMode === "score" ? "Score Mode" : "Collection Mode"}</strong>
        </article>

        <article class="hud-card">
          <span class="hud-label">Runde</span>
          <strong>${roundNumber} / ${totalCards}</strong>
        </article>

        <article class="hud-card">
          <span class="hud-label">Deck verbleibend</span>
          <strong>${remaining}</strong>
        </article>

        <article class="hud-card">
          <span class="hud-label">Score</span>
          <strong>${state.score.wins} / ${state.score.losses} / ${state.score.draws}</strong>
          <small>Win / Lose / Draw</small>
        </article>
      </section>

      <div class="game-grid">
        <section class="duel-card">
          ${currentCard ? buildCardHTML(currentCard) : `<div class="card-inner"><h3>Kein Deck aktiv</h3></div>`}
        </section>

        <aside class="side-stack">
          <section class="panel">
            <p class="panel-label">Gewählte Fähigkeit</p>
            <h2 class="selected-ability">${state.selectedAbility || "Noch keine Fähigkeit gewählt"}</h2>
            <div class="selected-value">${state.selectedValue ?? "—"}</div>
            ${getRoundBadge()}
            <p class="status-copy">${getStatusText()}</p>
          </section>

          <section class="panel">
            <p class="panel-label">Rundenauswertung</p>
            <div class="result-grid">
              <button id="winBtn" class="btn btn-win" type="button" ${!state.selectedAbility || state.roundResolved ? "disabled" : ""}>Win</button>
              <button id="drawBtn" class="btn btn-draw" type="button" ${!state.selectedAbility || state.roundResolved ? "disabled" : ""}>Draw</button>
              <button id="loseBtn" class="btn btn-lose" type="button" ${!state.selectedAbility || state.roundResolved ? "disabled" : ""}>Lose</button>
            </div>

            <div class="action-row">
              <button id="nextCardBtn" class="btn btn-primary" type="button" ${!state.roundResolved ? "disabled" : ""}>Nächste Karte</button>
              <button id="resetScoreBtn" class="btn btn-secondary" type="button">Score reset</button>
            </div>
          </section>

          ${
            state.matchMode === "collection"
              ? `
                <section class="panel">
                  <p class="panel-label">Collection</p>
                  <p class="collection-copy">
                    Ohne Verbindung zwischen den Smartphones kann nichts automatisch übertragen werden.
                    Hier kannst du eine gewonnene Karte nur lokal/manuell zu deiner Sammlung hinzufügen.
                  </p>

                  <div class="collection-actions">
                    <button
                      id="addToCollectionBtn"
                      class="btn btn-secondary"
                      type="button"
                      ${state.roundResolved && state.roundResult === "win" ? "" : "disabled"}
                    >
                      Gewinn lokal sammeln
                    </button>
                    <button id="clearCollectionBtn" class="btn btn-ghost" type="button">Collection leeren</button>
                  </div>

                  <ul class="collection-grid">
                    ${
                      state.collection.length === 0
                        ? `<li class="collection-card"><div class="collection-meta">Noch keine Karten in deiner lokalen Collection.</div></li>`
                        : state.collection
                            .slice()
                            .reverse()
                            .map(
                              (item) => `
                                <li class="collection-card">
                                  <div class="collection-name">${escapeHtml(item.name)}</div>
                                  <div class="collection-meta">${escapeHtml(item.title)} · ${escapeHtml(item.role)} · ${escapeHtml(item.faction)}</div>
                                </li>
                              `
                            )
                            .join("")
                    }
                  </ul>
                </section>
              `
              : ""
          }

          <section class="log-panel">
            <div class="log-header">
              <p class="panel-label">Battle Log</p>
            </div>
            <ul class="battle-log">
              ${
                state.log.length === 0
                  ? `<li>Noch kein Eintrag.</li>`
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

function buildCardHTML(card) {
  const statsHTML = Object.entries(card.stats)
    .map(([statName, value]) => {
      const isSelected = state.selectedAbility === statName;
      const classes = [
        "stat-btn",
        isSelected ? "selected" : "",
        state.roundResolved ? "locked" : ""
      ].filter(Boolean).join(" ");

      return `
        <button
          class="${classes}"
          type="button"
          data-stat="${escapeHtml(statName)}"
          ${state.roundResolved ? "disabled" : ""}
        >
          <span class="stat-left">
            <span class="stat-name">${escapeHtml(statName)}</span>
            <span class="stat-tag">Ability</span>
          </span>
          <span class="stat-number">${value}</span>
        </button>
      `;
    })
    .join("");

  const artHTML = card.image
    ? `<img src="${escapeHtml(card.image)}" alt="${escapeHtml(card.name)}" />`
    : `
      <div class="card-art-fallback">
        <span class="card-art-signature">${escapeHtml(card.faction)}</span>
      </div>
    `;

  const roleClass = card.role.toLowerCase() === "hero" ? "role-hero" : "role-villain";

  return `
    <div class="card-inner">
      <div class="card-head">
        <div class="card-title-wrap">
          <h3 class="card-name">${escapeHtml(card.name)}</h3>
          <p class="card-subtitle">${escapeHtml(card.title)}</p>
        </div>
        <div class="role-badge ${roleClass}">${escapeHtml(card.role)}</div>
      </div>

      <div class="card-art">
        ${artHTML}
      </div>

      <div class="card-meta">
        <div class="meta-box">
          <span class="meta-label">Fraktion</span>
          <span class="meta-value">${escapeHtml(card.faction)}</span>
        </div>
        <div class="meta-box">
          <span class="meta-label">Stil</span>
          <span class="meta-value">${escapeHtml(card.style)}</span>
        </div>
      </div>

      <div class="stats-list">
        ${statsHTML}
      </div>

      <p class="card-flavor">"${escapeHtml(card.flavor)}"</p>
    </div>
  `;
}

function buildEndScreen() {
  const total = state.deck.length;
  const scoreLine = `${state.score.wins} / ${state.score.losses} / ${state.score.draws}`;

  let verdict = "Ausgeglichenes Match.";
  if (state.score.wins > state.score.losses) {
    verdict = "Mehr Siege als Niederlagen. Solider Run.";
  } else if (state.score.losses > state.score.wins) {
    verdict = "Mehr Niederlagen als Siege. Deck, Fähigkeitenauswahl oder Glück waren schwächer.";
  }

  return `
    <section class="screen">
      <section class="panel">
        <div class="endscreen-grid">
          <p class="section-eyebrow">Match abgeschlossen</p>
          <h2 class="endscreen-title">Alle Karten gespielt</h2>
          <div class="endscreen-score">${scoreLine}</div>
          <p class="endscreen-copy">
            ${total} Karten wurden gespielt. ${verdict}
          </p>
          <p class="endscreen-copy">
            Modus: ${state.matchMode === "score" ? "Score Mode" : "Collection Mode"}.
            ${
              state.matchMode === "collection"
                ? `Lokale Collection: ${state.collection.length} Karte(n).`
                : `Keine Collection-Logik aktiv.`
            }
          </p>

          <div class="endscreen-actions">
            <button id="rematchBtn" class="btn btn-primary" type="button">Rematch</button>
            <button id="backToSetupBtn" class="btn btn-secondary" type="button">Zur Setup-Ansicht</button>
          </div>
        </div>
      </section>

      <section class="log-panel">
        <div class="log-header">
          <p class="panel-label">Battle Log</p>
        </div>
        <ul class="battle-log">
          ${
            state.log.length === 0
              ? `<li>Noch kein Eintrag.</li>`
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
  document.querySelectorAll("[data-mode]").forEach((button) => {
    button.addEventListener("click", () => {
      selectMode(button.dataset.mode);
    });
  });

  const deckSizeSelect = document.getElementById("deckSizeSelect");
  if (deckSizeSelect) {
    deckSizeSelect.addEventListener("change", (event) => {
      updateDeckSize(event.target.value);
    });
  }

  const startMatchBtn = document.getElementById("startMatchBtn");
  if (startMatchBtn) {
    startMatchBtn.addEventListener("click", startNewMatch);
  }

  const fullResetBtn = document.getElementById("fullResetBtn");
  if (fullResetBtn) {
    fullResetBtn.addEventListener("click", resetEverything);
  }
}

function bindGameScreen() {
  document.querySelectorAll("[data-stat]").forEach((button) => {
    button.addEventListener("click", () => {
      selectAbility(button.dataset.stat);
    });
  });

  document.getElementById("winBtn")?.addEventListener("click", () => resolveRound("win"));
  document.getElementById("drawBtn")?.addEventListener("click", () => resolveRound("draw"));
  document.getElementById("loseBtn")?.addEventListener("click", () => resolveRound("lose"));
  document.getElementById("nextCardBtn")?.addEventListener("click", goToNextCard);
  document.getElementById("resetScoreBtn")?.addEventListener("click", resetScoreOnly);
  document.getElementById("addToCollectionBtn")?.addEventListener("click", addWinToCollection);
  document.getElementById("clearCollectionBtn")?.addEventListener("click", clearCollection);
}

function bindEndScreen() {
  document.getElementById("rematchBtn")?.addEventListener("click", startNewMatch);
  document.getElementById("backToSetupBtn")?.addEventListener("click", resetToSetup);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

goToSetupBtn.addEventListener("click", resetToSetup);
newMatchBtn.addEventListener("click", startNewMatch);

if (!loadState()) {
  saveState();
}
render();
