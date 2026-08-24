import { HERO_POOL } from "../data/heroes.js";
import { ITEM_POOL } from "../data/items.js";
import { ENEMY_POOL } from "../data/enemies.js";
import { state } from "../state/gameState.js";
import { createSandboxHero, cycleSandboxLevel } from "../systems/heroes.js";
import { $, fill } from "./dom.js";
import {
  renderDeadBodyPoolCard,
  renderEnemyCard,
  renderHeroCard,
  renderItemCard,
  renderSandboxPoolHero,
} from "./cards.js";
import { refresh } from "./refresh.js";

export function renderSandboxToolbox() {
  const root = $("sandbox-panel-content");
  if (!root) return;
  if (state.sandboxCurrentTab === "heroes") {
    const cards = HERO_POOL.map((template, index) =>
      renderSandboxPoolHero(createSandboxHero(template), index),
    );
    cards.push(renderDeadBodyPoolCard());
    fill(root, ...cards);
  } else if (state.sandboxCurrentTab === "items") {
    fill(
      root,
      ...ITEM_POOL.map((item, index) =>
        renderItemCard(item, {
          source: "sandboxPoolItem",
          index,
          showCost: false,
          extraClass: "sandbox-mini",
        }),
      ),
    );
  } else {
    fill(
      root,
      ...ENEMY_POOL.map((enemy, index) =>
        renderEnemyCard(enemy, { source: "sandboxPoolEnemy", index, extraClass: "sandbox-mini" }),
      ),
    );
  }
}

export function renderSandboxLineups() {
  const partyRoot = $("sandbox-party-container");
  const enemyRoot = $("sandbox-enemy-container");
  if (partyRoot) {
    fill(
      partyRoot,
      ...state.sandboxParty.map((hero, index) =>
        renderHeroCard(hero, {
          source: "sandboxPartySlot",
          index,
          context: "sandbox",
          onLevelClick: hero
            ? () => {
                cycleSandboxLevel(hero);
                refresh();
              }
            : undefined,
        }),
      ),
    );
  }
  if (enemyRoot) {
    fill(
      enemyRoot,
      ...state.sandboxEnemies.map((enemy, index) =>
        renderEnemyCard(enemy, {
          source: "sandboxEnemySlot",
          index,
          droppable: true,
        }),
      ),
    );
  }
}
