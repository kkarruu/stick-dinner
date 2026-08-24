import { state } from "../state/gameState.js";
import { $ } from "../ui/dom.js";

export function logDebug(message) {
  console.log(message);
  if (!state.debugMode) return;
  const logContent = $("debug-log-content");
  if (!logContent) return;
  logContent.append(`> ${message}`);
  logContent.append(document.createElement("br"));
  const panel = $("debug-log-panel");
  if (panel) panel.scrollTop = panel.scrollHeight;
}

export function setDebugMode(enabled) {
  state.debugMode = enabled;
  const btn = $("debug-toggle-btn");
  const panel = $("debug-log-panel");
  if (!btn || !panel) return;
  btn.textContent = enabled ? "🛠️ Debug: ON" : "🛠️ Debug: OFF";
  btn.classList.toggle("active", enabled);
  panel.style.display = enabled ? "block" : "none";
}

export function syncLevelSystemBoostButton() {
  const btn = $("level-system-boost-btn");
  if (!btn) return;
  const on = !!state.levelSystemBoost;
  btn.textContent = on ? "Lvl system boost: ON" : "Lvl system boost: OFF";
  btn.classList.toggle("active", on);
}

export function toggleDebugMode() {
  setDebugMode(!state.debugMode);
}
