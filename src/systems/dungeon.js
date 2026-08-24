import {
  CRATE_CHANCE,
  GRID_HEIGHT,
  GRID_WIDTH,
  PLAYER_START,
  ROOMS_PER_FLOOR,
  SCREEN,
  TRAVELER_CHANCE,
  LOCKED_DOOR_CHANCE,
  TREASURE_HERO_CHANCE,
  CHEST_GOLD,
} from "../data/constants.js";
import { state, resetRoom } from "../state/gameState.js";
import { createRandomHero, getRandomItem, isHeroDead } from "./heroes.js";
import { addGold, rollShop } from "./shop.js";
import { beginBattle } from "./combat/index.js";
import { showScreen } from "../ui/screens.js";
import { drawGridDungeon, focusDungeon } from "../ui/dungeonCanvas.js";
import { refresh } from "../ui/refresh.js";
import { spawnRoomMonsters, moveMonsterPacks } from "./dungeonSpawn.js";
import { consumeDungeonKey } from "./inventory.js";

function inBounds(x, y) {
  return x >= 0 && x < GRID_WIDTH && y >= 0 && y < GRID_HEIGHT;
}

export function isObstacle(x, y) {
  if (!inBounds(x, y)) return true;
  return state.room.obstacles.some((obs) => obs.x === x && obs.y === y);
}

function occupiedSet() {
  const spots = new Set();
  const add = (x, y) => spots.add(`${x},${y}`);
  for (const part of state.playerSnake) add(part.x, part.y);
  for (const obs of state.room.obstacles) add(obs.x, obs.y);
  for (const door of state.room.doors) add(door.x, door.y);
  for (const shop of state.room.shops) add(shop.x, shop.y);
  for (const monster of state.room.monsters) add(monster.x, monster.y);
  if (state.room.chest) add(state.room.chest.x, state.room.chest.y);
  if (state.room.crate) add(state.room.crate.x, state.room.crate.y);
  if (state.room.traveler) add(state.room.traveler.x, state.room.traveler.y);
  if (state.room.lockedDoor) add(state.room.lockedDoor.x, state.room.lockedDoor.y);
  for (const loot of state.room.loot || []) {
    if (!loot.collected) add(loot.x, loot.y);
  }
  return spots;
}

export function getSafeGridSpawn() {
  const taken = occupiedSet();
  for (let attempt = 0; attempt < 120; attempt += 1) {
    const x = Math.floor(Math.random() * GRID_WIDTH);
    const y = Math.floor(Math.random() * GRID_HEIGHT);
    if (!taken.has(`${x},${y}`) && !isObstacle(x, y)) return { x, y };
  }
  return { x: 0, y: 0 };
}

function buildPlayerSnake() {
  const activeParty = state.party.filter((hero) => hero !== null && !isHeroDead(hero));
  const { x: startX, y: startY } = PLAYER_START;
  if (activeParty.length === 0) {
    state.playerSnake = [{ x: startX, y: startY, heroRef: { emoji: "🧙‍♂️" } }];
    return;
  }
  state.playerSnake = activeParty.map((hero, i) => ({
    x: Math.max(0, startX - i),
    y: startY,
    heroRef: hero,
  }));
}

function enterTreasureRoom() {
  state.room.monsters = [];
  state.room.chest = null;
  state.room.crate = null;
  state.room.lockedDoor = null;
  state.room.isTreasureRoom = true;
  state.room.loot = [];
  const count = 2 + Math.floor(Math.random() * 3);
  for (let i = 0; i < count; i += 1) {
    const kind = Math.random() < 0.5 ? "chest" : "crate";
    state.room.loot.push({
      ...getSafeGridSpawn(),
      kind,
      collected: false,
      color: kind === "chest" ? "#f1c40f" : "#e67e22",
    });
  }
  if (Math.random() < TREASURE_HERO_CHANCE) {
    state.room.traveler = { ...getSafeGridSpawn(), color: "#9b59b6", collected: false };
  }
}

export function generateNewRoom() {
  state.floorRoomsCount += 1;
  if (state.floorRoomsCount > ROOMS_PER_FLOOR) {
    state.floorRoomsCount = 0;
    state.dungeonFloor += 1;
    state.currentState = SCREEN.FLOOR_TRANSITION;
    const nextNum = document.getElementById("next-floor-num");
    if (nextNum) nextNum.textContent = String(state.dungeonFloor);
    showScreen(SCREEN.FLOOR_TRANSITION);
    refresh();
    return "transition";
  }

  resetRoom();
  buildPlayerSnake();

  for (let i = 0; i < 6; i += 1) {
    const cx = Math.floor(Math.random() * (GRID_WIDTH - 4)) + 2;
    const cy = Math.floor(Math.random() * 6) + 2;
    if (state.playerSnake.some((part) => part.x === cx && part.y === cy)) continue;
    state.room.obstacles.push({ x: cx, y: cy });
  }

  state.room.doors = [
    { x: 0, y: 5, color: "#2ecc71" },
    { x: GRID_WIDTH - 1, y: 5, color: "#2ecc71" },
  ];
  state.room.shops = [{ x: 8, y: 0, color: "#f1c40f" }];

  if (Math.random() < CRATE_CHANCE) {
    state.room.crate = { ...getSafeGridSpawn(), color: "#e67e22", collected: false };
  } else {
    state.room.chest = { ...getSafeGridSpawn(), color: "#f1c40f", collected: false };
  }

  if (Math.random() < TRAVELER_CHANCE) {
    state.room.traveler = { ...getSafeGridSpawn(), color: "#9b59b6", collected: false };
  }

  if (Math.random() < LOCKED_DOOR_CHANCE) {
    state.room.lockedDoor = { ...getSafeGridSpawn(), color: "#8e44ad" };
  }

  state.room.monsters = spawnRoomMonsters(getSafeGridSpawn, state.dungeonFloor, state.floorRoomsCount);

  const title = document.getElementById("dungeon-title");
  if (title) {
    title.textContent = `Explore Floor ${state.dungeonFloor} (WASD / Arrows to step, Tab for party)`;
  }
  refresh();
  return "ok";
}

export function startDungeon() {
  if (!state.party.some(Boolean)) return;
  state.currentState = SCREEN.DUNGEON;
  state.inBattleTransition = false;
  showScreen(SCREEN.DUNGEON);
  generateNewRoom();
  if (state.currentState === SCREEN.DUNGEON) {
    focusDungeon();
    drawGridDungeon();
  }
}

export function proceedToNextFloor() {
  state.currentState = SCREEN.DUNGEON;
  showScreen(SCREEN.DUNGEON);
  const generated = generateNewRoom();
  if (generated === "ok") {
    focusDungeon();
    drawGridDungeon();
  }
}

function triggerChestReward() {
  state.currentState = SCREEN.CHEST;
  addGold(CHEST_GOLD);
  state.currentChestItem = getRandomItem();
  const msg = document.getElementById("chest-gold-msg");
  if (msg) msg.textContent = `Found +${CHEST_GOLD} Gold!`;
  showScreen(SCREEN.CHEST);
  refresh();
}

function triggerCrateReward() {
  state.currentState = SCREEN.CRATE;
  state.currentCrateDrop = getRandomItem(1);
  const label = document.getElementById("crate-item-label");
  if (label) label.textContent = "A crate of supplies!";
  showScreen(SCREEN.CRATE);
  refresh();
}

function triggerHeroEncounter() {
  state.currentState = SCREEN.ENCOUNTER;
  state.currentEncounterHero = createRandomHero();
  showScreen(SCREEN.ENCOUNTER);
  refresh();
}

export function returnToDungeon() {
  state.currentState = SCREEN.DUNGEON;
  showScreen(SCREEN.DUNGEON);
  focusDungeon();
  drawGridDungeon();
  refresh();
}

function expandPackIndices(indices) {
  const set = new Set(indices);
  for (const idx of indices) {
    const packId = state.room.monsters[idx]?.packId;
    if (!packId) continue;
    state.room.monsters.forEach((monster, i) => {
      if (monster.packId === packId) set.add(i);
    });
  }
  return [...set];
}

function startClusterBattle(indices) {
  const packed = expandPackIndices(indices);
  state.inBattleTransition = true;
  state.activeEnemyIndices = packed;
  beginBattle({
    enemies: packed.map((i) => state.room.monsters[i]),
    sourceParty: state.party,
    isSandbox: false,
    monsterIndices: packed,
  });
}

function moveMonsters() {
  const head = state.playerSnake[0];
  moveMonsterPacks(head, isObstacle);

  const hits = [];
  state.room.monsters.forEach((monster, idx) => {
    if (state.playerSnake.some((part) => part.x === monster.x && part.y === monster.y)) hits.push(idx);
  });
  if (hits.length > 0) startClusterBattle([...new Set(hits)]);
}

export function stepDungeon(dx, dy) {
  if (state.currentState !== SCREEN.DUNGEON || state.inBattleTransition || state.sandboxActive) return;
  const head = state.playerSnake[0];
  const nx = head.x + dx;
  const ny = head.y + dy;
  if (isObstacle(nx, ny)) return;

  if (state.room.lockedDoor && state.room.lockedDoor.x === nx && state.room.lockedDoor.y === ny) {
    if (!consumeDungeonKey(state.dungeonFloor)) return;
    const prev = state.playerSnake.map((part) => ({ x: part.x, y: part.y }));
    state.playerSnake[0].x = nx;
    state.playerSnake[0].y = ny;
    for (let i = 1; i < state.playerSnake.length; i += 1) {
      state.playerSnake[i].x = prev[i - 1].x;
      state.playerSnake[i].y = prev[i - 1].y;
    }
    enterTreasureRoom();
    drawGridDungeon();
    return;
  }

  const prev = state.playerSnake.map((part) => ({ x: part.x, y: part.y }));
  state.playerSnake[0].x = nx;
  state.playerSnake[0].y = ny;
  for (let i = 1; i < state.playerSnake.length; i += 1) {
    state.playerSnake[i].x = prev[i - 1].x;
    state.playerSnake[i].y = prev[i - 1].y;
  }

  const hits = [];
  state.room.monsters.forEach((monster, idx) => {
    const dist = Math.abs(monster.x - nx) + Math.abs(monster.y - ny);
    if ((monster.x === nx && monster.y === ny) || dist <= 1) hits.push(idx);
  });
  if (hits.length > 0) {
    startClusterBattle([...new Set(hits)]);
    return;
  }

  moveMonsters();
  if (state.inBattleTransition || state.currentState === SCREEN.BATTLE) return;

  if (state.room.shops.some((shop) => shop.x === nx && shop.y === ny)) {
    rollShop();
    state.currentState = SCREEN.SHOP;
    showScreen(SCREEN.SHOP);
    refresh();
    return;
  }
  if (state.room.doors.some((door) => door.x === nx && door.y === ny)) {
    const generated = generateNewRoom();
    if (generated === "ok") drawGridDungeon();
    return;
  }
  if (state.room.chest && !state.room.chest.collected && state.room.chest.x === nx && state.room.chest.y === ny) {
    state.room.chest.collected = true;
    triggerChestReward();
    return;
  }
  if (state.room.crate && !state.room.crate.collected && state.room.crate.x === nx && state.room.crate.y === ny) {
    state.room.crate.collected = true;
    triggerCrateReward();
    return;
  }
  const loot = (state.room.loot || []).find((entry) => !entry.collected && entry.x === nx && entry.y === ny);
  if (loot) {
    loot.collected = true;
    if (loot.kind === "crate") triggerCrateReward();
    else triggerChestReward();
    return;
  }
  if (
    state.room.traveler &&
    !state.room.traveler.collected &&
    state.room.traveler.x === nx &&
    state.room.traveler.y === ny
  ) {
    state.room.traveler.collected = true;
    triggerHeroEncounter();
    return;
  }

  drawGridDungeon();
}

export function togglePartyManage() {
  if (state.sandboxActive || state.inBattleTransition) return;
  if (state.currentState === SCREEN.DUNGEON) {
    state.currentState = SCREEN.PARTY;
    showScreen(SCREEN.PARTY);
    refresh();
    return;
  }
  if (state.currentState === SCREEN.PARTY) {
    returnToDungeon();
  }
}

export function bindDungeonKeys() {
  window.addEventListener("keydown", (event) => {
    if (state.sandboxActive || state.inBattleTransition) return;
    if (event.key === "Tab") {
      if (state.currentState === SCREEN.DUNGEON || state.currentState === SCREEN.PARTY) {
        event.preventDefault();
        togglePartyManage();
      }
      return;
    }
    if (state.currentState !== SCREEN.DUNGEON) return;
    let dx = 0;
    let dy = 0;
    if (event.key === "w" || event.key === "W" || event.key === "ArrowUp") dy = -1;
    else if (event.key === "s" || event.key === "S" || event.key === "ArrowDown") dy = 1;
    else if (event.key === "a" || event.key === "A" || event.key === "ArrowLeft") dx = -1;
    else if (event.key === "d" || event.key === "D" || event.key === "ArrowRight") dx = 1;
    else return;
    event.preventDefault();
    stepDungeon(dx, dy);
  });
}
