import { SCREEN } from "../data/constants.js";
import { state } from "../state/gameState.js";
import { beginBattle } from "./combat/index.js";
import { showScreen } from "../ui/screens.js";
import { drawGridDungeon, focusDungeon } from "../ui/dungeonCanvas.js";
import { refresh } from "../ui/refresh.js";
import { $ } from "../ui/dom.js";

export function setSandboxTab(tabName) {
  state.sandboxCurrentTab = tabName;
  $("sb-tab-heroes")?.classList.toggle("tab-inactive", tabName !== "heroes");
  $("sb-tab-items")?.classList.toggle("tab-inactive", tabName !== "items");
  $("sb-tab-enemies")?.classList.toggle("tab-inactive", tabName !== "enemies");
  refresh();
}

export function openSandbox() {
  state.sandboxActive = true;
  const panel = $("sandbox-panel");
  if (panel) panel.style.display = "block";
  state.previousStateBeforeSandbox = state.currentState;
  state.currentState = SCREEN.SANDBOX;
  showScreen(SCREEN.SANDBOX);
  setSandboxTab(state.sandboxCurrentTab);
}

export function closeSandbox() {
  state.sandboxActive = false;
  const checkbox = $("sandbox-checkbox");
  if (checkbox) checkbox.checked = false;
  const panel = $("sandbox-panel");
  if (panel) panel.style.display = "none";
  state.currentState = state.previousStateBeforeSandbox;
  if (state.currentState === SCREEN.DUNGEON) {
    showScreen(SCREEN.DUNGEON);
    focusDungeon();
    drawGridDungeon();
  } else {
    state.currentState = SCREEN.SHOP;
    showScreen(SCREEN.SHOP);
  }
  refresh();
}

export function setSandboxMode(enabled) {
  if (enabled) openSandbox();
  else closeSandbox();
}

export function startSandboxBattle() {
  const heroes = state.sandboxParty.filter(Boolean);
  const enemies = state.sandboxEnemies.filter(Boolean);
  if (heroes.length === 0 || enemies.length === 0) {
    alert("Please add at least one hero and one enemy to test!");
    return;
  }
  beginBattle({
    enemies,
    sourceParty: state.sandboxParty,
    isSandbox: true,
  });
}
