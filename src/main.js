import "./style.css";
import { SCREEN } from "./data/constants.js";
import { state, resetState } from "./state/gameState.js";
import { setRefresh, refresh } from "./ui/refresh.js";
import { $ } from "./ui/dom.js";
import { showScreen } from "./ui/screens.js";
import { renderApp } from "./ui/render.js";
import { initDungeonCanvas } from "./ui/dungeonCanvas.js";
import { bindLeaveBehindZones, bindSandboxDeleteZone, bindSellZone } from "./ui/dragDrop.js";
import { rerollShop, rollShop, setInfiniteGold, setStatMultiplier } from "./systems/shop.js";
import { toggleDebugMode, syncLevelSystemBoostButton } from "./systems/debug.js";
import { refreshAllAbilityText } from "./systems/heroes.js";
import { bindDungeonKeys, proceedToNextFloor, returnToDungeon, startDungeon } from "./systems/dungeon.js";
import { closeSandbox, setSandboxMode, setSandboxTab, startSandboxBattle } from "./systems/sandbox.js";
import { returnFromBattle, resetCombat, toggleAutoplay, vcrNext, vcrPrev } from "./systems/combat/index.js";

function bindClicks() {
  $("debug-toggle-btn")?.addEventListener("click", () => {
    toggleDebugMode();
  });

  $("level-system-boost-btn")?.addEventListener("click", () => {
    state.levelSystemBoost = !state.levelSystemBoost;
    refreshAllAbilityText();
    syncLevelSystemBoostButton();
    refresh();
  });

  $("sandbox-checkbox")?.addEventListener("change", (event) => {
    setSandboxMode(event.target.checked);
  });

  $("stat-multiplier-slider")?.addEventListener("input", (event) => {
    setStatMultiplier(event.target.value);
    refresh();
  });

  $("infinite-gold-checkbox")?.addEventListener("change", (event) => {
    setInfiniteGold(event.target.checked);
    refresh();
  });

  $("sandbox-panel-close-btn")?.addEventListener("click", closeSandbox);
  $("sandbox-exit-btn")?.addEventListener("click", closeSandbox);
  $("sb-tab-heroes")?.addEventListener("click", () => setSandboxTab("heroes"));
  $("sb-tab-items")?.addEventListener("click", () => setSandboxTab("items"));
  $("sb-tab-enemies")?.addEventListener("click", () => setSandboxTab("enemies"));
  $("sandbox-battle-btn")?.addEventListener("click", startSandboxBattle);

  $("reroll-btn")?.addEventListener("click", () => {
    rerollShop();
    refresh();
  });
  $("enter-dungeon-btn")?.addEventListener("click", startDungeon);
  $("proceed-floor-btn")?.addEventListener("click", proceedToNextFloor);
  $("chest-return-btn")?.addEventListener("click", returnToDungeon);
  $("crate-return-btn")?.addEventListener("click", returnToDungeon);
  $("encounter-return-btn")?.addEventListener("click", returnToDungeon);
  $("party-return-btn")?.addEventListener("click", returnToDungeon);
  $("battle-return-btn")?.addEventListener("click", returnFromBattle);
  $("play-again-btn")?.addEventListener("click", resetGame);

  $("autoplay-checkbox")?.addEventListener("change", (event) => {
    toggleAutoplay(event.target.checked);
  });
  $("vcr-back-btn")?.addEventListener("click", vcrPrev);
  $("vcr-fwd-btn")?.addEventListener("click", vcrNext);
}

export function resetGame() {
  const autoplay = state.autoplayActive;
  resetCombat();
  resetState();
  state.autoplayActive = autoplay;
  const infiniteBox = $("infinite-gold-checkbox");
  if (infiniteBox) infiniteBox.checked = false;
  const sandboxBox = $("sandbox-checkbox");
  if (sandboxBox) sandboxBox.checked = false;
  syncLevelSystemBoostButton();
  const sandboxPanel = $("sandbox-panel");
  if (sandboxPanel) sandboxPanel.style.display = "none";
  const slider = $("stat-multiplier-slider");
  if (slider) slider.value = String(state.statMultiplier);
  rollShop();
  state.currentState = SCREEN.SHOP;
  showScreen(SCREEN.SHOP);
  refresh();
}

function boot() {
  setRefresh(renderApp);
  initDungeonCanvas();
  bindSellZone();
  bindSandboxDeleteZone();
  bindLeaveBehindZones();
  bindDungeonKeys();
  bindClicks();
  toggleAutoplay(true);
  rollShop();
  showScreen(SCREEN.SHOP);
  refresh();
}

boot();
