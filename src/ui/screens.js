import { SCREEN, SCREEN_IDS } from "../data/constants.js";
import { $ } from "./dom.js";

export function showScreen(stateKey) {
  for (const id of Object.values(SCREEN_IDS)) {
    const node = $(id);
    if (node) node.classList.add("hidden");
  }
  const target = $(SCREEN_IDS[stateKey] || stateKey);
  if (target) target.classList.remove("hidden");
}

export function updateHeader(gold, floor) {
  const goldEl = $("gold-display");
  const floorEl = $("floor-display");
  if (goldEl) goldEl.textContent = String(gold);
  if (floorEl) floorEl.textContent = String(floor);
}

export { SCREEN };
