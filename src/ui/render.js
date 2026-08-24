import { SCREEN } from "../data/constants.js";
import { state } from "../state/gameState.js";
import { inventorySlots } from "../systems/inventory.js";
import { $, fill } from "./dom.js";
import { updateHeader } from "./screens.js";
import { renderHeroCard, renderInventorySlot, renderItemCard } from "./cards.js";
import { renderSandboxLineups, renderSandboxToolbox } from "./sandboxView.js";

function fillInventory(id) {
  const root = $(id);
  if (!root) return;
  fill(
    root,
    ...inventorySlots().map((item, index) => renderInventorySlot(item, index)),
  );
}

function fillParty(id, context) {
  const root = $(id);
  if (!root) return;
  fill(
    root,
    ...state.party.map((hero, index) => renderHeroCard(hero, { source: "party", index, context })),
  );
}

export function renderShop() {
  const heroShop = $("hero-shop-container");
  const itemShop = $("item-shop-container");
  const enterBtn = $("enter-dungeon-btn");
  if (enterBtn) enterBtn.disabled = !state.party.some(Boolean);
  fillParty("party-container", "shop");
  fillInventory("shop-inventory-container");
  if (heroShop) {
    fill(
      heroShop,
      ...state.shopHeroes.map((hero, index) =>
        renderHeroCard(hero, { source: "shop", index, context: "shop", emptyText: "None" }),
      ),
    );
  }
  if (itemShop) {
    fill(
      itemShop,
      ...state.shopItems.map((item, index) => renderItemCard(item, { source: "item", index })),
    );
  }
}

export function renderEncounter() {
  fillParty("encounter-party-container", "encounter");
  fillInventory("encounter-inventory-container");
  const heroRoot = $("encounter-hero-container");
  if (heroRoot) {
    fill(
      heroRoot,
      renderHeroCard(state.currentEncounterHero, {
        source: "encounter",
        index: 0,
        context: "encounter",
      }),
    );
  }
}

export function renderChest() {
  fillParty("chest-party-container", "chest");
  fillInventory("chest-inventory-container");
  const itemRoot = $("chest-dropped-item-slot");
  if (itemRoot) {
    fill(
      itemRoot,
      renderItemCard(state.currentChestItem, {
        source: "chestItem",
        index: 0,
        isFree: true,
        emptyText: "None",
      }),
    );
  }
}

export function renderCrate() {
  fillParty("crate-party-container", "crate");
  fillInventory("crate-inventory-container");
  const itemRoot = $("crate-dropped-item-slot");
  if (itemRoot) {
    fill(
      itemRoot,
      renderItemCard(state.currentCrateDrop, {
        source: "crateDrop",
        index: 0,
        isFree: true,
        emptyText: "None",
      }),
    );
  }
}

export function renderPartyManage() {
  fillParty("party-manage-party-container", "party");
  fillInventory("party-inventory-container");
}

export function renderApp() {
  updateHeader(state.gold, state.dungeonFloor);
  const multiplierLabel = $("stat-multiplier-val");
  if (multiplierLabel) multiplierLabel.textContent = String(state.statMultiplier);

  if (state.sandboxActive) {
    renderSandboxToolbox();
    if (state.currentState === SCREEN.SANDBOX) renderSandboxLineups();
  }

  if (state.currentState === SCREEN.SHOP) renderShop();
  if (state.currentState === SCREEN.ENCOUNTER) renderEncounter();
  if (state.currentState === SCREEN.CHEST) renderChest();
  if (state.currentState === SCREEN.CRATE) renderCrate();
  if (state.currentState === SCREEN.PARTY) renderPartyManage();
}
