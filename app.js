const STORAGE_KEY = "tfu-duel-local-v2";

const cards = [
  {
    id: "solara-vex",
    name: "Solara Vex",
    title: "The Dawn Tyrant",
    role: "Hero",
    faction: "Solaris Order",
    style: "Celestial Flame",
    image: "",
    flavor: "Sie schlägt nicht schnell zu. Sie löscht Schlachtfelder aus.",
    stats: {
      "Arcane Blast": 86,
      "Solar Dominion": 94,
      "Resonance Sync": 71,
      "Defense Matrix": 78,
      "Speed Surge": 69,
      "Mystic Force": 91
    }
  },
  {
    id: "nyr-vale",
    name: "Nyr Vale",
    title: "The Silent Rift",
    role: "Villain",
    faction: "Voidborne",
    style: "Entropy Control",
    image: "",
    flavor: "Wo er auftaucht, zerfällt Ordnung zu Stille.",
    stats: {
      "Arcane Blast": 79,
      "Void Collapse": 95,
      "Resonance Sync": 83,
      "Defense Matrix": 72,
      "Speed Surge": 74,
      "Mystic Force": 93
    }
  },
  {
    id: "lyra-bloom",
    name: "Lyra Bloom",
    title: "Heart of Verdancy",
    role: "Hero",
    faction: "Bloom Covenant",
    style: "Nature Resonance",
    image: "",
    flavor: "Sanft im Ton. Brutal in der Kontrolle.",
    stats: {
      "Bloom Pulse": 82,
      "Solar Dominion": 66,
      "Resonance Sync": 92,
      "Defense Matrix": 84,
      "Speed Surge": 70,
      "Mystic Force": 80
    }
  },
  {
    id: "kael-drax",
    name: "Kael Drax",
    title: "Iron Warlord",
    role: "Villain",
    faction: "Crimson Forge",
    style: "Siege Power",
    image: "",
    flavor: "Kein Stratege. Eine Naturkatastrophe mit Panzerung.",
    stats: {
      "Arcane Blast": 61,
      "War Crush": 96,
      "Resonance Sync": 54,
      "Defense Matrix": 93,
      "Speed Surge": 52,
      "Mystic Force": 58
    }
  },
  {
    id: "astra-nox",
    name: "Astra Nox",
    title: "Oracle of the Last Eclipse",
    role: "Villain",
    faction: "Night Halo",
    style: "Astral Corruption",
    image: "",
    flavor: "Sie gewinnt Kämpfe lange bevor sie beginnen.",
    stats: {
      "Arcane Blast": 88,
      "Void Collapse": 81,
      "Resonance Sync": 90,
      "Defense Matrix": 67,
      "Speed Surge": 76,
      "Mystic Force": 97
    }
  },
  {
    id: "torin-ash",
    name: "Torin Ash",
    title: "Blade of Emberfall",
    role: "Hero",
    faction: "Ashen Guard",
    style: "Close Combat Burst",
    image: "",
    flavor: "Präzise genug für Duelle. Wild genug für Kriege.",
    stats: {
      "Arcane Blast": 68,
      "Solar Dominion": 72,
      "Resonance Sync": 63,
      "Defense Matrix": 75,
      "Speed Surge": 91,
      "Mystic Force": 64
    }
  },
  {
    id: "selene-cryx",
    name: "Selene Cryx",
    title: "Mirror of Ruin",
    role: "Villain",
    faction: "Obsidian Court",
    style: "Reflection Hex",
    image: "",
    flavor: "Wer sie liest, hat schon verloren.",
    stats: {
      "Arcane Blast": 84,
      "Void Collapse": 77,
      "Resonance Sync": 89,
      "Defense Matrix": 73,
      "Speed Surge": 80,
      "Mystic Force": 88
    }
  },
  {
    id: "orion-kade",
    name: "Orion Kade",
    title: "Storm Vanguard",
    role: "Hero",
    faction: "Aether Legion",
    style: "Tempest Assault",
    image: "",
    flavor: "Er spielt keine langen Matches. Er beendet sie.",
    stats: {
      "Arcane Blast": 81,
      "Storm Pressure": 87,
      "Resonance Sync": 72,
      "Defense Matrix": 76,
      "Speed Surge": 89,
      "Mystic Force": 74
    }
  }
];

const state = {
  deck: [],
  currentIndex: 0,
  selectedAbility: null,
  selectedValue: null,
  roundResolved: false,
  finished: false,
  score: {
    wins: 0,
    losses: 0,
    draws: 0
  },
  log: []
};

const currentCardEl = document.getElementById("currentCard");
const roundLabelEl = document.getElementById("roundLabel");
const deckRemainingLabelEl = document.getElementById("deckRemainingLabel");
const scoreLabelEl = document.getElementById("scoreLabel");
const selectedAbilityLabelEl = document.getElementById("selectedAbilityLabel");
const selectedAbilityValueEl = document.getElementById("selectedAbilityValue");
const statusTextEl = document.getElementById("statusText");
const battleLogEl = document.getElementById("battleLog");

const winBtn = document.getElementById("winBtn");
const drawBtn = document.getElementById("drawBtn");
const loseBtn = document.getElementById("loseBtn");
const nextCardBtn = document.getElementById("nextCardBtn");
const newMatchBtn = document.getElementById("newMatchBtn");
const resetScoreBtn = document.getElementById("resetScoreBtn");

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
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return false;

  try {
    const parsed = JSON.parse(saved);

    if (!Array.isArray(parsed.deck) || !parsed.score || !Array.isArray(parsed.log)) {
      return false;
    }

    state.deck = parsed.deck;
    state.currentIndex = Number.isInteger(parsed.currentIndex) ? parsed.currentIndex : 0;
    state.selectedAbility = parsed.selectedAbility || null;
    state.selectedValue = parsed.selectedValue ?? null;
    state.roundResolved = Boolean(parsed.roundResolved);
    state.finished = Boolean(parsed.finished);
    state.score = {
      wins: Number(parsed.score.wins) || 0,
      losses: Number(parsed.score.losses) || 0,
      draws: Number(parsed.score.draws) || 0
    };
    state.log = parsed.log;

    return true;
  } catch (error) {
    console.error("Konnte gespeicherten Spielstand nicht laden:", error);
    return false;
  }
}

function createNewMatch({ keepScore = true } = {}) {
  const shuffledDeck = shuffle(cards);

  state.deck = shuffledDeck;
  state.currentIndex = 0;
  state.selectedAbility = null;
  state.selectedValue = null;
  state.roundResolved = false;
  state.finished = false;
  state.log = ["Neues Match gestartet. Deck wurde lokal neu gemischt."];

  if (!keepScore) {
    state.score.wins = 0;
    state.score.losses = 0;
    state.score.draws = 0;
    state.log.push("Score wurde zurückgesetzt.");
  }

  saveState();
  render();
}

function getCurrentCard() {
  return state.deck[state.currentIndex] || null;
}

function buildCardHTML(card) {
  const statsHTML = Object.entries(card.stats)
    .map(([statName, value]) => {
      const isSelected = state.selectedAbility === statName;
      const classes = [
        "stat-btn",
        isSelected ? "selected" : "",
        state.roundResolved || state.finished ? "locked" : ""
      ].filter(Boolean).join(" ");

      return `
        <button
          class="${classes}"
          type="button"
          data-stat="${escapeHtml(statName)}"
          ${state.roundResolved || state.finished ? "disabled" : ""}
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
    <div class="card-inner ${state.finished ? "match-finished" : ""}">
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

function buildEndscreenHTML() {
  const totalRounds = state.deck.length;
  const scoreText = `${state.score.wins} / ${state.score.losses} / ${state.score.draws}`;

  let resultText = "Solides Match.";
  if (state.score.wins > state.score.losses) {
    resultText = "Starker Run. Mehr Siege als Niederlagen.";
  } else if (state.score.losses > state.score.wins) {
    resultText = "Mehr verloren als gewonnen. Deck oder Entscheidungen prüfen.";
  } else {
    resultText = "Ausgeglichen. Kein klarer Vorteil.";
  }

  return `
    <div class="endscreen">
      <p class="panel-label">Match beendet</p>
      <h2 class="endscreen-title">Alle Karten gespielt</h2>
      <div class="endscreen-score">${scoreText}</div>
      <p class="endscreen-subtext">
        ${totalRounds} Karten wurden durchgespielt. ${resultText}
      </p>
      <p class="endscreen-subtext">
        Starte ein neues Match für ein frisch gemischtes Deck.
      </p>
    </div>
  `;
}

function render() {
  const currentCard = getCurrentCard();
  const totalCards = state.deck.length;
  const roundNumber = state.finished ? totalCards : state.currentIndex + 1;
  const remaining = state.finished ? 0 : Math.max(totalCards - state.currentIndex - 1, 0);

  roundLabelEl.textContent = `${roundNumber} / ${totalCards}`;
  deckRemainingLabelEl.textContent = String(remaining);
  scoreLabelEl.textContent = `${state.score.wins} / ${state.score.losses} / ${state.score.draws}`;

  if (state.finished) {
    currentCardEl.innerHTML = buildEndscreenHTML();
  } else if (currentCard) {
    currentCardEl.innerHTML = buildCardHTML(currentCard);
    bindStatButtons();
  } else {
    currentCardEl.innerHTML = `<div class="endscreen"><h2 class="endscreen-title">Kein Deck geladen</h2></div>`;
  }

  selectedAbilityLabelEl.textContent = state.selectedAbility || "Noch keine Fähigkeit gewählt";
  selectedAbilityValueEl.textContent = state.selectedValue ?? "—";

  if (state.finished) {
    statusTextEl.textContent = "Match abgeschlossen. Starte ein neues Match.";
  } else if (state.roundResolved) {
    statusTextEl.textContent = "Runde ausgewertet. Weiter mit der nächsten Karte.";
  } else {
    statusTextEl.textContent = "Wähle zuerst eine Fähigkeit deiner aktuellen Karte.";
  }

  winBtn.disabled = !state.selectedAbility || state.roundResolved || state.finished;
  drawBtn.disabled = !state.selectedAbility || state.roundResolved || state.finished;
  loseBtn.disabled = !state.selectedAbility || state.roundResolved || state.finished;
  nextCardBtn.disabled = !state.roundResolved || state.finished;

  battleLogEl.innerHTML = state.log
    .slice()
    .reverse()
    .map((entry) => `<li>${escapeHtml(entry)}</li>`)
    .join("");
}

function bindStatButtons() {
  const buttons = currentCardEl.querySelectorAll(".stat-btn");
  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      if (state.roundResolved || state.finished) return;

      const currentCard = getCurrentCard();
      if (!currentCard) return;

      const statName = button.dataset.stat;
      const statValue = currentCard.stats[statName];

      state.selectedAbility = statName;
      state.selectedValue = statValue;

      state.log.push(
        `Runde ${state.currentIndex + 1}: Fähigkeit "${statName}" mit Wert ${statValue} gewählt.`
      );

      saveState();
      render();
    });
  });
}

function applyRoundResult(resultType) {
  if (!state.selectedAbility || state.roundResolved || state.finished) return;

  const currentCard = getCurrentCard();
  if (!currentCard) return;

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

  state.roundResolved = true;
  saveState();
  render();
}

function goToNextCard() {
  if (!state.roundResolved || state.finished) return;

  const isLastCard = state.currentIndex >= state.deck.length - 1;

  if (isLastCard) {
    state.finished = true;
    state.log.push(
      `Match beendet. Endscore: ${state.score.wins} Win / ${state.score.losses} Lose / ${state.score.draws} Draw.`
    );
    saveState();
    render();
    return;
  }

  state.currentIndex += 1;
  state.selectedAbility = null;
  state.selectedValue = null;
  state.roundResolved = false;
  state.log.push(`Runde ${state.currentIndex + 1} startet. Nächste Karte aufgedeckt.`);
  saveState();
  render();
}

function resetScoreOnly() {
  state.score.wins = 0;
  state.score.losses = 0;
  state.score.draws = 0;
  state.log.push("Score wurde manuell zurückgesetzt.");
  saveState();
  render();
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

winBtn.addEventListener("click", () => applyRoundResult("win"));
drawBtn.addEventListener("click", () => applyRoundResult("draw"));
loseBtn.addEventListener("click", () => applyRoundResult("lose"));
nextCardBtn.addEventListener("click", goToNextCard);
newMatchBtn.addEventListener("click", () => createNewMatch({ keepScore: true }));
resetScoreBtn.addEventListener("click", () => {
  resetScoreOnly();
});

if (!loadState()) {
  createNewMatch({ keepScore: false });
} else {
  render();
}
