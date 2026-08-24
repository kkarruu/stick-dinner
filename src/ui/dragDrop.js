import { HERO_COST, ITEM_COST, SELL_GOLD } from "../data/constants.js";
import { HERO_POOL } from "../data/heroes.js";
import { ITEM_POOL } from "../data/items.js";
import { ENEMY_POOL, cloneEnemy } from "../data/enemies.js";
import { state } from "../state/gameState.js";
import {
  applyItemToHero,
  createSandboxHero,
  createDeadHeroInstance,
  handleMerge,
  isHeroDead,
  triggerBardItemBought,
  triggerWarlockSellBuff,
} from "../systems/heroes.js";
import { ensureInventory } from "../systems/inventory.js";
import { canSpend, spendGold, addGold } from "../systems/shop.js";
import { logDebug } from "../systems/debug.js";
import { refresh } from "./refresh.js";
import { $ } from "./dom.js";

let drag = { source: null, index: null };

export function allowDrop(node) {
  node.addEventListener("dragover", (event) => event.preventDefault());
}

export function bindDragSource(node, source, index) {
  node.addEventListener("dragstart", (event) => {
    drag = { source, index };
    event.dataTransfer?.setData("text/plain", "");
  });
}

function clearDrag() {
  drag = { source: null, index: null };
}

function getIncomingHero(context) {
  if (drag.source === "encounter" || context === "encounter") return state.currentEncounterHero;
  if (drag.source === "shop") return state.shopHeroes[drag.index];
  return null;
}

function consumeIncomingHero(context) {
  if (context === "encounter" || drag.source === "encounter") state.currentEncounterHero = null;
  else if (drag.source === "shop") state.shopHeroes[drag.index] = null;
}

function getIncomingItem() {
  if (drag.source === "item") return state.shopItems[drag.index];
  if (drag.source === "chestItem") return state.currentChestItem;
  if (drag.source === "crateDrop") return state.currentCrateDrop;
  if (drag.source === "inventory") return ensureInventory()[drag.index];
  if (drag.source === "sandboxPoolItem") return ITEM_POOL[drag.index];
  return null;
}

function consumeIncomingItem() {
  if (drag.source === "item") state.shopItems[drag.index] = null;
  if (drag.source === "chestItem") state.currentChestItem = null;
  if (drag.source === "crateDrop") state.currentCrateDrop = null;
  if (drag.source === "inventory") ensureInventory()[drag.index] = null;
}

export function handlePartyDrop(targetIndex, context = "shop") {
  const { source, index } = drag;
  if (!source) return;

  if (source === "party") {
    if (index === targetIndex) {
      clearDrag();
      return;
    }
    const sourceHero = state.party[index];
    const targetHero = state.party[targetIndex];
    if (targetHero && sourceHero && sourceHero.name === targetHero.name) {
      handleMerge(targetHero, sourceHero);
      state.party[index] = null;
    } else {
      state.party[index] = targetHero;
      state.party[targetIndex] = sourceHero;
    }
  } else if (source === "item" || source === "chestItem" || source === "crateDrop" || source === "inventory") {
    const item = getIncomingItem();
    const target = state.party[targetIndex];
    if (!item || !target) {
      clearDrag();
      return;
    }
    if (source === "item") {
      if (!canSpend(ITEM_COST)) {
        clearDrag();
        return;
      }
      spendGold(ITEM_COST);
      triggerBardItemBought(state.party);
    }
    consumeIncomingItem();
    applyItemToHero(target, item);
  } else if (source === "shop" || source === "encounter") {
    const incoming = getIncomingHero(context);
    if (!incoming) {
      clearDrag();
      return;
    }
    const target = state.party[targetIndex];
    const paid = source !== "encounter" && context !== "encounter";
    if (paid && !canSpend(HERO_COST)) {
      clearDrag();
      return;
    }
    if (target && target.name === incoming.name) {
      if (paid) spendGold(HERO_COST);
      consumeIncomingHero(context);
      handleMerge(target, incoming);
    } else if (target === null) {
      if (paid) spendGold(HERO_COST);
      state.party[targetIndex] = incoming;
      consumeIncomingHero(context);
    }
  }

  clearDrag();
  refresh();
}

export function handleInventoryDrop(targetIndex) {
  const { source, index } = drag;
  const inventory = ensureInventory();
  if (source === "inventory") {
    if (index === targetIndex) {
      clearDrag();
      return;
    }
    const moved = inventory[index];
    inventory[index] = inventory[targetIndex];
    inventory[targetIndex] = moved;
  } else if (source === "item") {
    const item = state.shopItems[index];
    if (!item || inventory[targetIndex]) {
      clearDrag();
      return;
    }
    if (!canSpend(ITEM_COST)) {
      clearDrag();
      return;
    }
    spendGold(ITEM_COST);
    triggerBardItemBought(state.party);
    inventory[targetIndex] = item;
    state.shopItems[index] = null;
  } else if (source === "chestItem" || source === "crateDrop") {
    const item = getIncomingItem();
    if (!item) {
      clearDrag();
      return;
    }
    const parked = inventory[targetIndex];
    inventory[targetIndex] = item;
    consumeIncomingItem();
    if (parked) {
      if (source === "chestItem") state.currentChestItem = parked;
      else state.currentCrateDrop = parked;
    }
  }
  clearDrag();
  refresh();
}

export function handleSellDrop() {
  if (drag.source === "party" && state.party[drag.index]) {
    const soldHero = state.party[drag.index];
    const dead = isHeroDead(soldHero);
    state.party[drag.index] = null;
    if (dead) triggerWarlockSellBuff(soldHero, state.party);
    else addGold(SELL_GOLD);
  }
  clearDrag();
  refresh();
}

export function handleLeaveBehindDrop() {
  if (drag.source === "party" && state.party[drag.index]) {
    const left = state.party[drag.index];
    state.party[drag.index] = null;
    logDebug(`[LEAVE] Left ${left.name} behind. No gold, no Warlock trigger.`);
  }
  clearDrag();
  refresh();
}

export function handleSandboxPartyDrop(targetIndex) {
  const { source, index } = drag;
  if (source === "sandboxPoolHero") {
    state.sandboxParty[targetIndex] = createSandboxHero(HERO_POOL[index]);
  } else if (source === "sandboxPoolDeadBody") {
    state.sandboxParty[targetIndex] = createDeadHeroInstance();
  } else if (source === "sandboxPoolItem") {
    const target = state.sandboxParty[targetIndex];
    if (target && !isHeroDead(target)) applyItemToHero(target, ITEM_POOL[index]);
  } else if (source === "sandboxPartySlot") {
    if (index === targetIndex) {
      clearDrag();
      return;
    }
    const temp = state.sandboxParty[index];
    state.sandboxParty[index] = state.sandboxParty[targetIndex];
    state.sandboxParty[targetIndex] = temp;
  }
  clearDrag();
  refresh();
}

export function handleSandboxEnemyDrop(targetIndex) {
  const { source, index } = drag;
  if (source === "sandboxPoolEnemy") {
    state.sandboxEnemies[targetIndex] = cloneEnemy(ENEMY_POOL[index]);
  } else if (source === "sandboxEnemySlot") {
    if (index === targetIndex) {
      clearDrag();
      return;
    }
    const temp = state.sandboxEnemies[index];
    state.sandboxEnemies[index] = state.sandboxEnemies[targetIndex];
    state.sandboxEnemies[targetIndex] = temp;
  }
  clearDrag();
  refresh();
}

export function handleSandboxDeleteDrop() {
  if (drag.source === "sandboxPartySlot") {
    const soldHero = state.sandboxParty[drag.index];
    if (soldHero && isHeroDead(soldHero)) triggerWarlockSellBuff(soldHero, state.sandboxParty);
    state.sandboxParty[drag.index] = null;
  } else if (drag.source === "sandboxEnemySlot") {
    state.sandboxEnemies[drag.index] = null;
  }
  clearDrag();
  refresh();
}

export function bindDropTarget(node, { kind, index, context }) {
  allowDrop(node);
  node.addEventListener("drop", (event) => {
    event.preventDefault();
    if (kind === "party") handlePartyDrop(index, context);
    else if (kind === "inventory") handleInventoryDrop(index);
    else if (kind === "leaveBehind") handleLeaveBehindDrop();
    else if (kind === "sandboxPartySlot") handleSandboxPartyDrop(index);
    else if (kind === "sandboxEnemySlot") handleSandboxEnemyDrop(index);
    else if (kind === "sell") handleSellDrop();
    else if (kind === "sandboxDelete") handleSandboxDeleteDrop();
  });
}

export function bindSellZone() {
  const zone = $("sell-zone");
  if (!zone) return;
  allowDrop(zone);
  zone.addEventListener("dragenter", (event) => {
    event.preventDefault();
    zone.textContent = "💸 Sell Hero / Dead Body (Active Warlock Buff)";
  });
  zone.addEventListener("dragleave", (event) => {
    event.preventDefault();
    zone.textContent = "💸 Sell Hero / Dead Body";
  });
  zone.addEventListener("drop", (event) => {
    event.preventDefault();
    zone.textContent = "💸 Sell Hero / Dead Body";
    handleSellDrop();
  });
}

export function bindSandboxDeleteZone() {
  const zone = $("sandbox-delete-zone");
  if (!zone) return;
  allowDrop(zone);
  zone.addEventListener("drop", (event) => {
    event.preventDefault();
    handleSandboxDeleteDrop();
  });
}

export function bindLeaveBehindZones() {
  document.querySelectorAll(".leave-behind-zone").forEach((zone) => {
    allowDrop(zone);
    zone.addEventListener("drop", (event) => {
      event.preventDefault();
      handleLeaveBehindDrop();
    });
  });
}
