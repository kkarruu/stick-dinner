import { REROLL_COST, INFINITE_GOLD_AMOUNT } from "../data/constants.js";
import { state } from "../state/gameState.js";
import { createRandomHero, getRandomItem } from "./heroes.js";

export function canSpend(amount) {
  if (state.infiniteGoldActive) return true;
  return state.gold >= amount;
}

export function spendGold(amount) {
  if (state.infiniteGoldActive) return true;
  if (state.gold < amount) return false;
  state.gold -= amount;
  return true;
}

export function addGold(amount) {
  if (state.infiniteGoldActive) return;
  state.gold += amount;
}

export function rollShop() {
  state.shopHeroes = [createRandomHero(), createRandomHero(), createRandomHero()];
  if (state.shopItems[0] === null) state.shopItems[0] = getRandomItem();
  if (state.shopItems[1] === null) state.shopItems[1] = getRandomItem();
}

export function rerollShop() {
  const cost = state.infiniteGoldActive ? 0 : REROLL_COST;
  if (!canSpend(cost)) return false;
  spendGold(cost);
  state.shopHeroes = [createRandomHero(), createRandomHero(), createRandomHero()];
  state.shopItems[0] = getRandomItem();
  state.shopItems[1] = getRandomItem();
  return true;
}

export function setInfiniteGold(enabled) {
  if (enabled && !state.infiniteGoldActive) {
    state.savedGoldBeforeInfinite = state.gold;
    state.infiniteGoldActive = true;
    state.gold = INFINITE_GOLD_AMOUNT;
  } else if (!enabled && state.infiniteGoldActive) {
    state.infiniteGoldActive = false;
    state.gold = state.savedGoldBeforeInfinite;
  }
}

export function setStatMultiplier(value) {
  state.statMultiplier = Number(value) || 1;
}
