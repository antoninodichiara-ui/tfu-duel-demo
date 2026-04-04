const cardDatabase = [
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
  player1Deck: [],
  player2Deck: [],
  roundIndex: 0,
  player1Score: 0,
  player2Score: 0,
  selectedStat: null,
  selectedValues: null,
  roundLocked: false,
  gameOver: false,
  log: []
};

const player1CardEl = document.getElementById("player1Card");
const player2CardEl = document.getElementById("player2Card");
const roundLabelEl = document.getElementById("roundLabel");
const turnLabelEl = document.getElementById("turnLabel");
const scoreLabelEl = document.getElementById("scoreLabel");
const selectedStatLabelEl = document.getElementById("selectedStatLabel");
const player1ValueEl = document.getElementById("player1Value");
const player2ValueEl = document.getElementById("player2Value");
const resultTextEl = document.getElementById("resultText");
const battleLogEl = document.getElementById("battleLog");
const nextRoundBtn = document.getElementById("nextRoundBtn");
const restartBtn = document.getElementById("restartBtn");

function shuffle(array) {
  const clone = [...array];
  for (let i = clone.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [clone[i], clone[j]] = [clone[j], clone[i]];
  }
  return clone;
}

function getCurrentPlayerLabel() {
  return state.roundIndex % 2 === 0 ? "Spieler 1" : "Spieler 2";
}

function getActivePlayerNumber() {
  return state.roundIndex % 2 === 0 ? 1 : 2;
}

function getCurrentCards() {
  return {
    player1: state.player1Deck[state.roundIndex],
    player2: state.player2Deck[state.roundIndex]
  };
}

function setupGame() {
  const shuffled = shuffle(cardDatabase);
  const usableCards = shuffled.slice(0, 8);

  state.player1Deck = usableCards.slice(0, 4);
  state.player2Deck = usableCards.slice(4, 8);
  state.roundIndex = 0;
  state.player1Score = 0;
  state.player2Score = 0;
  state.selectedStat = null;
  state.selectedValues = null;
  state.roundLocked = false;
  state.gameOver = false;
  state.log = [
    "Match gestartet. 4 Karten pro Spieler. Spieler 1 beginnt mit der ersten Fähigkeitswahl."
  ];

  render();
}

function render() {
  const { player1, player2 } = getCurrentCards();

  roundLabelEl.textContent = state.gameOver
    ? `${state.player1Deck.length} / ${state.player1Deck.length}`
    : `${state.roundIndex + 1} / ${state.player1Deck.length}`;

  turnLabelEl.textContent = state.gameOver ? "Match beendet" : getCurrentPlayerLabel();
  scoreLabelEl.textContent = `${state.player1Score} : ${state.player2Score}`;

  if (player1 && player2) {
    player1CardEl.innerHTML = buildCardHTML(player1, 1);
    player2CardEl.innerHTML = buildCardHTML(player2, 2);
    bindStatButtons();
  } else {
    player1CardEl.innerHTML = "";
    player2CardEl.innerHTML = "";
  }

  if (!state.selectedStat) {
    selectedStatLabelEl.textContent = state.gameOver
      ? "Match abgeschlossen"
      : "Noch keine Fähigkeit gewählt";
    player1ValueEl.textContent = "-";
    player2ValueEl.textContent = "-";
  } else {
    selectedStatLabelEl.textContent = state.selectedStat;
    player1ValueEl.textContent = state.selectedValues.player1;
    player2ValueEl.textContent = state.selectedValues.player2;
  }

  battleLogEl.innerHTML = state.log
    .slice()
    .reverse()
    .map((entry) => `<li>${entry}</li>`)
    .join("");

  nextRoundBtn.disabled = !state.roundLocked || state.gameOver;
}

function buildCardHTML(card, playerNumber) {
  const activePlayer = getActivePlayerNumber();
  const isActiveCard = activePlayer === playerNumber && !state.roundLocked && !state.gameOver;

  const statsHTML = Object.entries(card.stats)
    .map(([statName, value]) => {
      const isSelected = state.selectedStat === statName;
      const buttonClasses = [
        "stat-btn",
        isActiveCard ? "active-turn" : "disabled",
        isSelected ? "selected" : ""
      ]
        .filter(Boolean)
        .join(" ");

      return `
        <button
          class="${buttonClasses}"
          ${isActiveCard ? "" : "disabled"}
          data-player="${playerNumber}"
          data-stat="${statName}"
          type="button"
        >
          <span class="stat-left">
            <span class="stat-name">${statName}</span>
            <span class="stat-tag">Ability</span>
          </span>
          <span class="stat-number">${value}</span>
        </button>
      `;
    })
    .join("");

  const roleClass = card.role.toLowerCase() === "hero" ? "role-hero" : "role-villain";

  const artHTML = card.image
    ? `<img src="${card.image}" alt="${card.name}" />`
    : `
      <div class="card-art-fallback">
        <span class="card-art-signature">${card.faction}</span>
      </div>
    `;

  return `
    <div class="card-inner">
      <div class="card-head">
        <div class="card-title-wrap">
          <h3 class="card-name">${card.name}</h3>
          <p class="card-subtitle">${card.title}</p>
        </div>
        <div class="role-badge ${roleClass}">${card.role}</div>
      </div>

      <div class="card-art">
        ${artHTML}
      </div>

      <div class="card-meta">
        <div class="meta-box">
          <span class="meta-label">Fraktion</span>
          <span class="meta-value">${card.faction}</span>
        </div>
        <div class="meta-box">
          <span class="meta-label">Stil</span>
          <span class="meta-value">${card.style}</span>
        </div>
      </div>

      <div class="stats-list">
        ${statsHTML}
      </div>

      <p class="card-flavor">"${card.flavor}"</p>
    </div>
  `;
}

function bindStatButtons() {
  const statButtons = document.querySelectorAll(".stat-btn.active-turn");

  statButtons.forEach((button) => {
    button.addEventListener("click", () => {
      if (state.roundLocked || state.gameOver) return;
      const statName = button.dataset.stat;
      resolveRound(statName);
    });
  });
}

function resolveRound(statName) {
  const { player1, player2 } = getCurrentCards();
  if (!player1 || !player2) return;

  const player1Value = player1.stats[statName];
  const player2Value = player2.stats[statName];

  state.selectedStat = statName;
  state.selectedValues = {
    player1: player1Value,
    player2: player2Value
  };
  state.roundLocked = true;

  const activePlayer = getCurrentPlayerLabel();
  let resultMessage = "";
  let logEntry = "";

  if (player1Value > player2Value) {
    state.player1Score += 1;
    resultMessage = `${player1.name} gewinnt die Runde mit ${statName} (${player1Value} zu ${player2Value}).`;
    logEntry = `Runde ${state.roundIndex + 1}: ${activePlayer} wählt ${statName}. ${player1.name} schlägt ${player2.name} mit ${player1Value} zu ${player2Value}. Punkt für Spieler 1.`;
    resultTextEl.innerHTML = `<span class="result-win">${resultMessage}</span>`;
  } else if (player2Value > player1Value) {
    state.player2Score += 1;
    resultMessage = `${player2.name} gewinnt die Runde mit ${statName} (${player2Value} zu ${player1Value}).`;
    logEntry = `Runde ${state.roundIndex + 1}: ${activePlayer} wählt ${statName}. ${player2.name} schlägt ${player1.name} mit ${player2Value} zu ${player1Value}. Punkt für Spieler 2.`;
    resultTextEl.innerHTML = `<span class="result-lose">${resultMessage}</span>`;
  } else {
    resultMessage = `Unentschieden. Beide Karten haben bei ${statName} den Wert ${player1Value}.`;
    logEntry = `Runde ${state.roundIndex + 1}: ${activePlayer} wählt ${statName}. Gleichstand bei ${player1Value}. Kein Punkt.`;
    resultTextEl.innerHTML = `<span class="result-draw">${resultMessage}</span>`;
  }

  state.log.push(logEntry);
  render();
}

function advanceRound() {
  if (!state.roundLocked || state.gameOver) return;

  const isLastRound = state.roundIndex >= state.player1Deck.length - 1;

  if (isLastRound) {
    state.gameOver = true;
    state.roundLocked = true;

    let finalMessage = "";
    if (state.player1Score > state.player2Score) {
      finalMessage = `Match vorbei. Spieler 1 gewinnt mit ${state.player1Score} : ${state.player2Score}.`;
      resultTextEl.innerHTML = `<span class="result-win">${finalMessage}</span>`;
    } else if (state.player2Score > state.player1Score) {
      finalMessage = `Match vorbei. Spieler 2 gewinnt mit ${state.player2Score} : ${state.player1Score}.`;
      resultTextEl.innerHTML = `<span class="result-lose">${finalMessage}</span>`;
    } else {
      finalMessage = `Match vorbei. Unentschieden mit ${state.player1Score} : ${state.player2Score}.`;
      resultTextEl.innerHTML = `<span class="result-draw">${finalMessage}</span>`;
    }

    state.log.push(finalMessage);
    nextRoundBtn.disabled = true;
    render();
    return;
  }

  state.roundIndex += 1;
  state.selectedStat = null;
  state.selectedValues = null;
  state.roundLocked = false;
  resultTextEl.textContent = "Wähle eine Fähigkeit, um die nächste Runde zu starten.";
  state.log.push(`Runde ${state.roundIndex + 1} startet. ${getCurrentPlayerLabel()} ist am Zug.`);
  render();
}

nextRoundBtn.addEventListener("click", advanceRound);
restartBtn.addEventListener("click", setupGame);

setupGame();
