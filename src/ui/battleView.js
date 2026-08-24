import { calculateHeroStats } from "../systems/heroes.js";
import { isUnitDead } from "../systems/combat/engine.js";
import { state } from "../state/gameState.js";
import { $, append, el, fill } from "./dom.js";
import {
  getHeroMaxEnergy,
  getHeroMaxMana,
} from "../systems/heroes.js";

function expDots(hero) {
  if (hero.isMinion || hero.isReanimated) return el("div", { class: "exp-container" });
  if (hero.level === 3) {
    return el("div", { class: "exp-container" }, el("span", { class: "max-text" }, "MAX LVL"));
  }
  const total = hero.level === 1 ? 2 : 3;
  const dots = [];
  for (let i = 0; i < total; i += 1) {
    dots.push(el("div", { class: `exp-dot${i < (hero.exp || 0) ? " filled" : ""}` }));
  }
  return el("div", { class: "exp-container" }, ...dots);
}

function resourceBar(hero, dead) {
  if (!state.manaModeActive || dead || hero.isMinion || hero.isReanimated) return null;
  if (hero.hasEnergy) {
    const maxE = getHeroMaxEnergy(hero);
    const currentE = hero.currentEnergy || 0;
    const segs = [];
    for (let i = 0; i < maxE; i += 1) {
      segs.push(el("div", { class: `resource-segment${i < currentE ? " energy-filled" : ""}` }));
    }
    return el("div", { class: "resource-bar-container" }, ...segs);
  }
  if (hero.hasMana) {
    const maxM = getHeroMaxMana(hero);
    const currentM = hero.currentMana || 0;
    const segs = [];
    for (let i = 0; i < maxM; i += 1) {
      segs.push(el("div", { class: `resource-segment${i < currentM ? " mana-filled" : ""}` }));
    }
    return el("div", { class: "resource-bar-container" }, ...segs);
  }
  return null;
}

function combatStats(hero, dead) {
  if (hero.isMinion || hero.isReanimated) {
    return { atk: hero.atk, hp: hero.hp, isDead: dead };
  }
  const stats = calculateHeroStats(hero);
  if (hero.isReanimated) {
    stats.atk = hero.atk;
    stats.hp = hero.hp;
  }
  return stats;
}

export function renderBattleFrame(frame) {
  const fx = frame.fx || {};
  const playerRoot = $("battle-player-team");
  const enemyRoot = $("battle-enemy-team");
  if (!playerRoot || !enemyRoot) return;

  const playerCards = frame.player.map((hero, index) => {
    const isFront = index === frame.player.length - 1;
    const dead = isUnitDead(hero, state.statMultiplier);
    const css = [
      "card",
      dead ? "dead-card" : "",
      isFront && fx.lungePlayer ? "lunge-player" : "",
      index === fx.pulseIdx ? "ability-pulse" : "",
    ]
      .filter(Boolean)
      .join(" ");

    const dmgNodes = [];
    if (isFront && !dead) {
      if (fx.playerFrontArmorLoss > 0) {
        dmgNodes.push(el("div", { class: "armor-dmg-text-center" }, `-${fx.playerFrontArmorLoss}`));
      }
      if (fx.playerFrontHpLoss > 0) {
        dmgNodes.push(el("div", { class: "dmg-text-center" }, `-${fx.playerFrontHpLoss}`));
      }
    }

    const stats = combatStats(hero, dead);
    const name = dead ? "Dead Body" : hero.name;
    const card = el("div", { class: css, style: { borderColor: "#3498db" } }, ...dmgNodes);
    append(
      card,
      el(
        "div",
        { class: "badge-row" },
        el(
          "div",
          { class: "tier-badge" },
          hero.isMinion ? "Minion" : hero.isReanimated ? "Reanimated" : `Tier ${hero.tier || 1}`,
        ),
        el("div", { class: "level-badge" }, `Lvl ${hero.level || 1}`),
      ),
      el(
        "div",
        { class: "hero-name-row" },
        el("div", { class: "hero-name" }, name),
        hero.armor > 0 ? el("div", { class: "armor-badge" }, `🛡️${hero.armor}`) : null,
      ),
      expDots(hero),
      resourceBar(hero, dead),
      el("div", { class: "emoji" }, dead ? "💀" : hero.emoji),
      el(
        "div",
        { class: "ability-box" },
        el("span", { class: "ability-title" }, hero.abilityTitle || ""),
        el("span", { class: "ability-desc" }, hero.abilityDesc || ""),
      ),
      hero.perk ? el("div", { class: "perk-badge" }, `${hero.perk.emoji} ${hero.perk.name}`) : null,
      el(
        "div",
        { class: "stats" },
        el("span", { class: "atk" }, `⚔️${stats.atk}`),
        el("span", { class: "hp" }, dead ? "💀" : `❤️${stats.hp}`),
      ),
    );
    return card;
  });

  if (frame.mindControl) {
    const mc = frame.mindControl;
    const mcClass = `card mind-control-active${fx.mcSlide ? " lunge-enemy" : ""}`;
    playerCards.push(
      el(
        "div",
        { class: mcClass, style: { borderColor: "#9b59b6" } },
        el(
          "div",
          { class: "badge-row" },
          el("div", { class: "tier-badge", style: { background: "#8e44ad" } }, "MIND CONTROL"),
          el("div", { class: "level-badge" }, `Turns: ${mc.turnsLeft}`),
        ),
        el("div", { class: "hero-name mc-name" }, `✨ ${mc.name}`),
        el("div", { class: "emoji" }, mc.emoji),
        el(
          "div",
          { class: "ability-box" },
          el("span", { class: "ability-title mc-title" }, "Controlled"),
          el("span", { class: "ability-desc" }, "Fighting for you"),
        ),
        el(
          "div",
          { class: "stats" },
          el("span", { class: "atk" }, `⚔️${mc.atk}`),
          el("span", { class: "hp" }, `❤️${mc.hp}`),
        ),
      ),
    );
  }

  fill(playerRoot, ...playerCards);

  const enemyCards = frame.enemies.map((enemy, index) => {
    const isFront = index === 0;
    let dmgNode = null;
    if (fx.specificEnemyIdx === index && fx.specificEnemyDmg != null) {
      dmgNode = el("div", { class: "dmg-text-center" }, `-${fx.specificEnemyDmg}`);
    } else if (isFront && fx.enemyFrontDmg != null) {
      dmgNode = el("div", { class: "dmg-text-center" }, `-${fx.enemyFrontDmg}`);
    }
    const css = `card${isFront && fx.lungeEnemy ? " lunge-enemy" : ""}`;
    return el(
      "div",
      { class: css, style: { borderColor: "#e74c3c" } },
      dmgNode,
      el(
        "div",
        { class: "badge-row" },
        el("div", { class: "tier-badge tier-enemy" }, "Enemy"),
        el("div", { class: "level-badge" }, `Lvl ${enemy.level || 1}`),
      ),
      el("div", { class: "hero-name" }, enemy.name),
      el("div", { class: "emoji" }, enemy.emoji),
      el(
        "div",
        { class: "ability-box" },
        el("span", { class: "ability-title" }, enemy.ability ? "Ability:" : ""),
        el("span", { class: "ability-desc" }, enemy.ability === "SPLIT" ? "Splits" : "Standard"),
      ),
      el(
        "div",
        { class: "stats" },
        el("span", { class: "atk" }, `⚔️${enemy.atk}`),
        el("span", { class: "hp" }, `❤️${enemy.hp}`),
      ),
    );
  });

  fill(enemyRoot, ...enemyCards);
}
