export const PARTY_SIZE = 5;
export const SHOP_HERO_SLOTS = 3;
export const SHOP_ITEM_SLOTS = 2;
export const SANDBOX_ENEMY_SLOTS = 8;
export const INVENTORY_COLUMNS = 2;
export const INVENTORY_ROWS = 2;
export const INVENTORY_DEFAULT_SIZE = INVENTORY_COLUMNS * INVENTORY_ROWS;
export const MAX_HERO_LEVEL = 20;
export const EXP_BASE = 10;
export const EXP_GROWTH = 3;

export const START_GOLD = 30;
export const HERO_COST = 20;
export const ITEM_COST = 2;
export const REROLL_COST = 1;
export const SELL_GOLD = 1;
export const CHEST_GOLD = 3;
export const INFINITE_GOLD_AMOUNT = 999;

export const BATTLE_GOLD = {
  victory: 3,
  defeat: 1,
  draw: 2,
};

export const ROOMS_PER_FLOOR = 10;
export const GRID_WIDTH = 16;
export const GRID_HEIGHT = 10;
export const TILE_SIZE = 50;
export const PLAYER_START = { x: 8, y: 5 };

export const STAT_MULTIPLIER_DEFAULT = 2;
export const MAX_BATTLE_TURNS = 80;

export const CRATE_CHANCE = 0.3;
export const TRAVELER_CHANCE = 0.18;
export const LOCKED_DOOR_CHANCE = 0.22;
export const TREASURE_HERO_CHANCE = 0.12;

export const SCREEN = {
  SHOP: "SHOP",
  DUNGEON: "DUNGEON",
  PARTY: "PARTY",
  BATTLE: "BATTLE",
  ENCOUNTER: "ENCOUNTER",
  CHEST: "CHEST",
  CRATE: "CRATE",
  GAMEOVER: "GAMEOVER",
  SANDBOX: "SANDBOX",
  FLOOR_TRANSITION: "FLOOR_TRANSITION",
};

export const SCREEN_IDS = {
  [SCREEN.SHOP]: "shop-screen",
  [SCREEN.DUNGEON]: "dungeon-screen",
  [SCREEN.PARTY]: "party-manage-screen",
  [SCREEN.BATTLE]: "battle-screen",
  [SCREEN.ENCOUNTER]: "hero-encounter-screen",
  [SCREEN.CHEST]: "chest-reward-screen",
  [SCREEN.CRATE]: "crate-reward-screen",
  [SCREEN.GAMEOVER]: "gameover-screen",
  [SCREEN.SANDBOX]: "sandbox-screen",
  [SCREEN.FLOOR_TRANSITION]: "floor-transition-screen",
};

export const FLOOR_THEMES = {
  1: { bg: "#1a252f", wall: "#34495e", name: "Slime & Goblins" },
  2: { bg: "#251a2f", wall: "#4a3b5c", name: "Spider & Skeleton" },
  3: { bg: "#2f251a", wall: "#5c4a3b", name: "Minotaur & Gelatinous Cube" },
  4: { bg: "#2f1a1a", wall: "#5c3b3b", name: "Owlbear & Kobold Caverns" },
};

export const DELAY = {
  battleIntro: 800,
  energyPulse: 2000,
  ability: 1200,
  necro: 1000,
  postStart: 1000,
  manaPulse: 600,
  manaResolve: 500,
  mindControl: 1000,
  lunge: 400,
  clash: 1000,
  turnGap: 800,
  expTick: 45,
  expReveal: 280,
  levelUpHold: 700,
};
