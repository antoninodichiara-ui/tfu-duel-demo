const cards = [
  {
    id: 1,
    name: "Commander Arios",
    title: "The Iron Vanguard",
    type: "Warlord",
    rarity: "Warlord",
    power: 109,
    image: "/assets/cards/commanderarios.jpeg",
    stats: {
      STR: 88,
      AGI: 72,
      VIT: 93,
      INT: 81,
      PWR: 91,
      TOT: 514
    }
  },
  {
    id: 2,
    name: "Xallus",
    title: "Forge Demon",
    type: "Warlock",
    rarity: "Warlock",
    power: 115,
    image: "/assets/cards/xallus.jpeg",
    stats: {
      STR: 101,
      AGI: 66,
      VIT: 93,
      INT: 66,
      PWR: 102,
      TOT: 512
    }
  },
  {
    id: 3,
    name: "Selyn Syn",
    title: "The Arcane Trickster",
    type: "Rogue",
    rarity: "Rogue",
    power: 104,
    image: "/assets/cards/selynsyn.jpeg",
    stats: {
      STR: 57,
      AGI: 93,
      VIT: 64,
      INT: 78,
      PWR: 84,
      TOT: 464
    }
  },
  {
    id: 4,
    name: "Gromok",
    title: "Champion of Gore",
    type: "Berserker",
    rarity: "Berserker",
    power: 108,
    image: "/assets/cards/gromok.jpeg",
    stats: {
      STR: 106,
      AGI: 73,
      VIT: 92,
      INT: 38,
      PWR: 105,
      TOT: 472
    }
  },
  {
    id: 5,
    name: "Malgrave",
    title: "The Iron Executor",
    type: "Apex",
    rarity: "Apex",
    power: 109,
    image: "/assets/cards/malgrave.jpeg",
    stats: {
      STR: 93,
      AGI: 69,
      VIT: 95,
      INT: 44,
      PWR: 98,
      TOT: 484
    }
  },
  {
    id: 6,
    name: "Xaro",
    title: "Lord of the Undying",
    type: "Necromancer",
    rarity: "Necromancer",
    power: 110,
    image: "/assets/cards/xaro.jpeg",
    stats: {
      STR: 52,
      AGI: 70,
      VIT: 103,
      INT: 104,
      PWR: 102,
      TOT: 510
    }
  },
  {
    id: 7,
    name: "Serrak",
    title: "The Reaper",
    type: "Anti-Hero",
    rarity: "Anti-Hero",
    power: 106,
    image: "/assets/cards/serrak.jpeg",
    stats: {
      STR: 82,
      AGI: 88,
      VIT: 79,
      INT: 71,
      PWR: 90,
      TOT: 503
    }
  },
  {
    id: 8,
    name: "Sovnaith",
    title: "Void Revenant",
    type: "Fallen",
    rarity: "Fallen",
    power: 114,
    image: "/assets/cards/sovinaith.jpeg",
    stats: {
      STR: 94,
      AGI: 102,
      VIT: 73,
      INT: 74,
      PWR: 103,
      TOT: 527
    }
  },
  {
    id: 9,
    name: "Nihraza",
    title: "Archsorceress of Decay",
    type: "Fallen",
    rarity: "Fallen",
    power: 112,
    image: "/assets/cards/nihraza.jpeg",
    stats: {
      STR: 59,
      AGI: 72,
      VIT: 104,
      INT: 104,
      PWR: 102,
      TOT: 497
    }
  },
  {
    id: 10,
    name: "Icor Strimbane",
    title: "The Twilight Reaper",
    type: "Anti-Hero",
    rarity: "Anti-Hero",
    power: 103,
    image: "/assets/cards/strimbane.jpeg",
    stats: {
      STR: 81,
      AGI: 76,
      VIT: 68,
      INT: 77,
      PWR: 88,
      TOT: 483
    }
  },
  {
    id: 11,
    name: "Felnara",
    title: "Mistress of Shadows",
    type: "Rogue",
    rarity: "Rogue",
    power: 103,
    image: "/assets/cards/felnara.jpeg",
    stats: {
      STR: 56,
      AGI: 105,
      VIT: 78,
      INT: 90,
      PWR: 105,
      TOT: 479
    }
  },
  {
    id: 12,
    name: "Aleron",
    title: "Guardian of the Heavens",
    type: "Divine",
    rarity: "Divine",
    power: 114,
    image: "/assets/cards/aleron.jpeg",
    stats: {
      STR: 89,
      AGI: 74,
      VIT: 102,
      INT: 62,
      PWR: 103,
      TOT: 519
    }
  },
  {
    id: 13,
    name: "Zul'kar",
    title: "Archlich of Death",
    type: "Spellcaster",
    rarity: "Spellcaster",
    power: 109,
    image: "/assets/cards/zulkar.jpeg",
    stats: {
      STR: 37,
      AGI: 50,
      VIT: 74,
      INT: 108,
      PWR: 111,
      TOT: 479
    }
  },
  {
    id: 14,
    name: "Tyvar Stormbringer",
    title: "The Thunderous Paladin",
    type: "Hero",
    rarity: "Hero",
    power: 105,
    image: "/assets/cards/tyvarstormbringer.jpeg",
    stats: {
      STR: 92,
      AGI: 74,
      VIT: 94,
      INT: 72,
      PWR: 89,
      TOT: 497
    }
  },
  {
    id: 15,
    name: "Horok",
    title: "Lord of the Iron Legion",
    type: "Warlord",
    rarity: "Warlord",
    power: 108,
    image: "/assets/cards/horok.jpeg",
    stats: {
      STR: 95,
      AGI: 71,
      VIT: 97,
      INT: 63,
      PWR: 75,
      TOT: 500
    }
  },
  {
    id: 16,
    name: "Vyron Red Vektor",
    title: "The Blazing Warlord",
    type: "Villain",
    rarity: "Villain",
    power: 106,
    image: "/assets/cards/vyronredvektor.jpeg",
    stats: {
      STR: 95,
      AGI: 62,
      VIT: 91,
      INT: 68,
      PWR: 94,
      TOT: 483
    }
  },
  {
    id: 17,
    name: "Tauron",
    title: "Scourge of War",
    type: "Warlord",
    rarity: "Warlord",
    power: 109,
    image: "/assets/cards/tauron.jpeg",
    stats: {
      STR: 101,
      AGI: 69,
      VIT: 99,
      INT: 63,
      PWR: 84,
      TOT: 499
    }
  },
  {
    id: 18,
    name: "Velandra",
    title: "Coven Enchantress",
    type: "Fallen",
    rarity: "Fallen",
    power: 109,
    image: "/assets/cards/velandra.jpeg",
    stats: {
      STR: 60,
      AGI: 74,
      VIT: 90,
      INT: 104,
      PWR: 102,
      TOT: 519
    }
  },
  {
    id: 19,
    name: "Mycothrax Rot Sovereign",
    title: "The Fungal Overlord",
    type: "Fallen",
    rarity: "Fallen",
    power: 107,
    image: "/assets/cards/mycothraxrotsovereign.jpeg",
    stats: {
      STR: 78,
      AGI: 55,
      VIT: 95,
      INT: 92,
      PWR: 91,
      TOT: 484
    }
  },
  {
    id: 20,
    name: "Miraveth",
    title: "Blademistress of Flame",
    type: "Elite",
    rarity: "Elite",
    power: 113,
    image: "/assets/cards/miraveth.jpeg",
    stats: {
      STR: 106,
      AGI: 95,
      VIT: 85,
      INT: 62,
      PWR: 106,
      TOT: 512
    }
  }
];
