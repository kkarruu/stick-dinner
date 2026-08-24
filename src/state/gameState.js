import {
    INVENTORY_DEFAULT_SIZE,
    PARTY_SIZE,
  SANDBOX_ENEMY_SLOTS,
  SHOP_HERO_SLOTS,
  SHOP_ITEM_SLOTS,
  START_GOLD,
  STAT_MULTIPLIER_DEFAULT,
  SCREEN,
} from "../data/constants.js";

function emptySlots(count) {
  return Array.from({ length: count }, () => null);
}

function createRoom() {
  return {
    doors: [],
    shops: [],
    chest: null,
    crate: null,
    traveler: null,
    monsters: [],
    obstacles: [],
  };
}

export function createInitialState() {
  return {
    gold: START_GOLD,
    savedGoldBeforeInfinite: START_GOLD,
    dungeonFloor: 1,
    floorRoomsCount: 0,
    statMultiplier: STAT_MULTIPLIER_DEFAULT,
    debugMode: false,
    sandboxActive: false,
    infiniteGoldActive: false,
    hardcoreModeActive: true,
    manaModeActive: true,
    autoplayActive: true,
    party: emptySlots(PARTY_SIZE),
    inventorySize: INVENTORY_DEFAULT_SIZE,
    inventory: emptySlots(INVENTORY_DEFAULT_SIZE),
    shopHeroes: emptySlots(SHOP_HERO_SLOTS),
    shopItems: emptySlots(SHOP_ITEM_SLOTS),
    currentState: SCREEN.SHOP,
    previousStateBeforeSandbox: SCREEN.SHOP,
    currentEncounterHero: null,
    currentChestItem: null,
    currentCrateDrop: null,
    sandboxParty: emptySlots(PARTY_SIZE),
    sandboxEnemies: emptySlots(SANDBOX_ENEMY_SLOTS),
    sandboxCurrentTab: "heroes",
    playerSnake: [{ x: 8, y: 5 }],
    room: createRoom(),
    inBattleTransition: false,
    isSandboxBattle: false,
    activeEnemyIndices: [],
    pendingBattleResult: null,
  };
}

export const state = createInitialState();

export function resetState() {
  const next = createInitialState();
  for (const key of Object.keys(state)) {
    delete state[key];
  }
  Object.assign(state, next);
}

export function resetRoom() {
  state.room = createRoom();
}
