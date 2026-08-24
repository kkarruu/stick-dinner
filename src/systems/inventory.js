import { INVENTORY_DEFAULT_SIZE } from "../data/constants.js";
import { state } from "../state/gameState.js";

export function ensureInventory() {
  if (!state.inventorySize || state.inventorySize < INVENTORY_DEFAULT_SIZE) {
    state.inventorySize = INVENTORY_DEFAULT_SIZE;
  }
  if (!Array.isArray(state.inventory)) state.inventory = [];
  while (state.inventory.length < state.inventorySize) state.inventory.push(null);
  return state.inventory;
}

export function growInventory(extraSlots = 2) {
  state.inventorySize = (state.inventorySize || INVENTORY_DEFAULT_SIZE) + extraSlots;
  return ensureInventory();
}

export function inventorySlots() {
  return ensureInventory().slice(0, state.inventorySize);
}
